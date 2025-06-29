import { supabase } from './supabase';
import BeautyStatsService from './beauty-stats-service';

/**
 * 既存の AI 解析結果から美容統計を生成する
 * 開発・テスト用のスクリプト
 */
export class BeautyStatsGenerator {
  
  /**
   * 指定ユーザーの全解析結果から美容統計を再生成
   */
  static async generateStatsForUser(authUserId: string): Promise<void> {
    try {
      console.log('🔄 美容統計生成開始:', authUserId);
      
      // ユーザーの実際のIDを取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single();
      
      if (userError || !userData) {
        console.error('❌ ユーザー取得エラー:', userError);
        return;
      }
      
      const userId = userData.id;
      console.log('👤 ユーザーID:', userId);
      
      // 既存の美容統計をクリア
      await this.clearExistingStats(userId);
      
      // AI解析結果を取得（meal_records と結合）
      const { data: analysisResults, error: analysisError } = await supabase
        .from('ai_analysis_results')
        .select(`
          *,
          meal_records!inner (
            id,
            taken_at,
            user_id
          )
        `)
        .eq('meal_records.user_id', userId)
        .order('meal_records.taken_at');
      
      if (analysisError) {
        console.error('❌ 解析結果取得エラー:', analysisError);
        return;
      }
      
      if (!analysisResults || analysisResults.length === 0) {
        console.log('📊 解析結果がありません。テストデータを生成します。');
        await this.generateTestData(authUserId);
        return;
      }
      
      console.log(`📈 ${analysisResults.length}件の解析結果を処理中...`);
      
      // 解析結果を日付でグループ化して統計を生成
      const statsByDate = new Map<string, any[]>();
      
      for (const result of analysisResults) {
        const date = new Date(result.meal_records.taken_at).toISOString().split('T')[0];
        
        if (!statsByDate.has(date)) {
          statsByDate.set(date, []);
        }
        
        statsByDate.get(date)!.push(result);
      }
      
      // 日付ごとに美容統計を生成
      for (const [dateStr, dayResults] of statsByDate) {
        const date = new Date(dateStr);
        
        // その日の解析結果を統合
        const combinedAnalysis = this.combineAnalysisResults(dayResults);
        
        if (combinedAnalysis) {
          await BeautyStatsService.updateDailyStats(authUserId, combinedAnalysis, date);
          console.log(`✅ ${dateStr}: ${dayResults.length}件の解析から統計生成完了`);
        }
      }
      
      console.log('🎉 美容統計生成完了!');
      
    } catch (error) {
      console.error('❌ 美容統計生成失敗:', error);
      throw error;
    }
  }
  
  /**
   * 既存の美容統計をクリア
   */
  private static async clearExistingStats(userId: string): Promise<void> {
    const { error } = await supabase
      .from('beauty_stats')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('統計クリアエラー:', error);
      throw error;
    }
    
    console.log('🗑️ 既存統計をクリアしました');
  }
  
  /**
   * 複数の解析結果を1日分として統合
   */
  private static combineAnalysisResults(results: any[]): any | null {
    if (results.length === 0) return null;
    
    // 最初の結果をベースに統合
    const baseResult = results[0];
    
    if (!baseResult.beauty_score) {
      // beauty_score がない場合はダミーデータで生成
      return this.generateDummyAnalysisResult();
    }
    
    // 複数の解析結果がある場合は平均を計算
    if (results.length === 1) {
      return {
        beauty_score: baseResult.beauty_score,
        detected_foods: baseResult.detected_foods || [],
        nutrition_analysis: baseResult.nutrition_analysis || {}
      };
    }
    
    // 複数結果の平均を計算
    const averageScores = {
      overall: 0,
      skin_care: 0,
      anti_aging: 0,
      detox: 0,
      circulation: 0,
      hair_nails: 0
    };
    
    let validResults = 0;
    
    for (const result of results) {
      if (result.beauty_score) {
        averageScores.overall += result.beauty_score.overall || 0;
        averageScores.skin_care += result.beauty_score.skin_care || 0;
        averageScores.anti_aging += result.beauty_score.anti_aging || 0;
        averageScores.detox += result.beauty_score.detox || 0;
        averageScores.circulation += result.beauty_score.circulation || 0;
        averageScores.hair_nails += result.beauty_score.hair_nails || 0;
        validResults++;
      }
    }
    
    if (validResults === 0) {
      return this.generateDummyAnalysisResult();
    }
    
    // 平均を計算
    Object.keys(averageScores).forEach(key => {
      averageScores[key as keyof typeof averageScores] = Math.round(
        averageScores[key as keyof typeof averageScores] / validResults
      );
    });
    
    return {
      beauty_score: averageScores,
      detected_foods: results.flatMap(r => r.detected_foods || []),
      nutrition_analysis: results[0].nutrition_analysis || {}
    };
  }
  
  /**
   * ダミーの解析結果を生成（テスト用）
   */
  private static generateDummyAnalysisResult(): any {
    const baseScore = 70 + Math.floor(Math.random() * 25); // 70-95点
    
    return {
      beauty_score: {
        overall: baseScore,
        skin_care: baseScore + Math.floor(Math.random() * 10) - 5,
        anti_aging: baseScore + Math.floor(Math.random() * 10) - 5,
        detox: baseScore + Math.floor(Math.random() * 10) - 5,
        circulation: baseScore + Math.floor(Math.random() * 10) - 5,
        hair_nails: baseScore + Math.floor(Math.random() * 10) - 5,
      },
      detected_foods: [
        { name: 'サンプル食材', confidence: 0.9 }
      ],
      nutrition_analysis: {
        protein: 'high',
        vitamins: 'medium',
        minerals: 'high'
      }
    };
  }
  
  /**
   * テストデータを生成（解析結果がない場合）
   */
  private static async generateTestData(authUserId: string): Promise<void> {
    console.log('📊 テストデータ生成中...');
    
    const today = new Date();
    const daysToGenerate = 14; // 過去2週間分
    
    for (let i = 0; i < daysToGenerate; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // 1日1-3回の解析をシミュレート
      const analysisCount = 1 + Math.floor(Math.random() * 3);
      
      for (let j = 0; j < analysisCount; j++) {
        const dummyResult = this.generateDummyAnalysisResult();
        await BeautyStatsService.updateDailyStats(authUserId, dummyResult, date);
      }
    }
    
    console.log(`✅ ${daysToGenerate}日分のテストデータ生成完了`);
  }
  
  /**
   * ユーザーをプレミアム設定に変更
   */
  static async setUserPremium(authUserId: string, isPremium: boolean = true): Promise<void> {
    try {
      console.log(`👑 ユーザーをプレミアム設定: ${authUserId} -> ${isPremium}`);
      
      const { error } = await supabase.rpc('set_user_premium', {
        user_auth_id: authUserId,
        is_premium: isPremium
      });
      
      if (error) {
        console.error('プレミアム設定エラー:', error);
        throw error;
      }
      
      console.log('✅ プレミアム設定完了');
      
    } catch (error) {
      console.error('❌ プレミアム設定失敗:', error);
      throw error;
    }
  }
  
  /**
   * 統計データの確認
   */
  static async verifyStats(authUserId: string): Promise<void> {
    try {
      console.log('🔍 統計データ確認中...');
      
      const weeklyReport = await BeautyStatsService.generateWeeklyReport(authUserId);
      const monthlyReport = await BeautyStatsService.generateMonthlyReport(authUserId);
      
      console.log('📈 週次レポート:', {
        期間: weeklyReport?.period,
        平均スコア: weeklyReport?.averageScore,
        解析回数: weeklyReport?.totalAnalyses
      });
      
      console.log('📊 月次レポート:', {
        期間: monthlyReport?.period,
        平均スコア: monthlyReport?.averageScore,
        解析回数: monthlyReport?.totalAnalyses
      });
      
    } catch (error) {
      console.error('❌ 統計確認失敗:', error);
    }
  }
}

export default BeautyStatsGenerator;