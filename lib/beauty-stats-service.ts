import { supabase } from './supabase';
import { FoodAnalysisResult } from './food-analysis';

// 美容統計データの型定義
export interface BeautyStats {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD format
  week_start: string; // YYYY-MM-DD format (その週の月曜日)
  month: string; // YYYY-MM format
  
  // 日次統計
  daily_score: number;
  daily_analyses_count: number;
  
  // カテゴリー別スコア
  skin_care_score: number;
  anti_aging_score: number;
  detox_score: number;
  circulation_score: number;
  hair_nails_score: number;
  
  // 栄養バランス (0-100)
  protein_balance: number;
  vitamin_balance: number;
  mineral_balance: number;
  fiber_balance: number;
  
  created_at: Date;
  updated_at: Date;
}

// 週次レポートデータ
export interface WeeklyReport {
  period: string;
  weekStart: string;
  weekEnd: string;
  averageScore: number;
  totalAnalyses: number;
  improvement: string;
  topCategory: string;
  achievement: string;
  
  dailyScores: number[];
  days: string[];
  
  categoryScores: {
    skin_care: number;
    anti_aging: number;
    detox: number;
    circulation: number;
    hair_nails: number;
  };
  
  topFoods: Array<{
    name: string;
    score: number;
    category: string;
  }>;
  
  insights: string[];
}

// 月次レポートデータ
export interface MonthlyReport {
  period: string;
  month: string;
  averageScore: number;
  totalAnalyses: number;
  improvement: string;
  bestWeek: string;
  
  categoryTrends: {
    [key: string]: {
      current: number;
      change: number;
    };
  };
  
  nutritionBalance: {
    protein: number;
    vitamins: number;
    minerals: number;
    fiber: number;
  };
  
  weeklyProgress: Array<{
    week: string;
    score: number;
  }>;
}

// トップ美容食材
export interface TopBeautyFood {
  name: string;
  score: number;
  category: string;
  frequency: number;
  lastEaten: string;
}

export class BeautyStatsService {
  // 日次美容統計を保存/更新
  static async updateDailyStats(
    userId: string,
    analysisResult: FoodAnalysisResult,
    date?: Date
  ): Promise<void> {
    try {
      const targetDate = date || new Date();
      const dateStr = targetDate.toISOString().split('T')[0];
      const weekStart = this.getWeekStartString(targetDate);
      const month = targetDate.toISOString().substring(0, 7);
      
      // ユーザーの実際のIDを取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();
      
      if (userError || !userData) {
        console.error('ユーザー取得エラー:', userError);
        return;
      }
      
      // 既存の統計データを取得
      const { data: existingStats, error: fetchError } = await supabase
        .from('beauty_stats')
        .select('*')
        .eq('user_id', userData.id)
        .eq('date', dateStr)
        .single();
      
      // 新しい統計データを計算
      const newStats = this.calculateDailyStats(analysisResult, existingStats);
      
      const statsData = {
        user_id: userData.id,
        date: dateStr,
        week_start: weekStart,
        month: month,
        ...newStats,
        updated_at: new Date()
      };
      
      if (existingStats) {
        // 更新
        const { error: updateError } = await supabase
          .from('beauty_stats')
          .update(statsData)
          .eq('id', existingStats.id);
        
        if (updateError) {
          console.error('統計データ更新エラー:', updateError);
        }
      } else {
        // 新規作成
        const { error: insertError } = await supabase
          .from('beauty_stats')
          .insert({
            ...statsData,
            created_at: new Date()
          });
        
        if (insertError) {
          console.error('統計データ作成エラー:', insertError);
        }
      }
      
      console.log('美容統計データ更新完了:', dateStr);
      
    } catch (error) {
      console.error('美容統計更新失敗:', error);
    }
  }
  
  // 週次レポート生成
  static async generateWeeklyReport(
    userId: string,
    weekStart?: Date
  ): Promise<WeeklyReport | null> {
    try {
      const targetWeekStart = weekStart || this.getWeekStart(new Date());
      
      // targetWeekStart が undefined でないことを確認
      if (!targetWeekStart) {
        console.error('週次レポート生成エラー: 週開始日が取得できません');
        return null;
      }
      
      const weekEnd = new Date(targetWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekStartStr = targetWeekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      
      // ユーザーの実際のIDを取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();
      
      if (userError || !userData) {
        console.error('ユーザー取得エラー:', userError);
        return null;
      }
      
      // 週次統計データを取得
      const { data: weeklyStats, error: statsError } = await supabase
        .from('beauty_stats')
        .select('*')
        .eq('user_id', userData.id)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr)
        .order('date');
      
      if (statsError) {
        console.error('週次統計取得エラー:', statsError);
        return null;
      }
      
      // 前週のデータを取得（改善率計算用）
      const prevWeekStart = new Date(targetWeekStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      const prevWeekEnd = new Date(prevWeekStart);
      prevWeekEnd.setDate(prevWeekEnd.getDate() + 6);
      
      const { data: prevWeekStats } = await supabase
        .from('beauty_stats')
        .select('*')
        .eq('user_id', userData.id)
        .gte('date', prevWeekStart.toISOString().split('T')[0])
        .lte('date', prevWeekEnd.toISOString().split('T')[0]);
      
      // トップ美容食材を取得
      const topFoods = await this.getTopBeautyFoods(userId, weekStartStr, weekEndStr);
      
      return this.buildWeeklyReport(weeklyStats, prevWeekStats, topFoods, targetWeekStart);
      
    } catch (error) {
      console.error('週次レポート生成失敗:', error);
      return null;
    }
  }
  
  // 月次レポート生成
  static async generateMonthlyReport(
    userId: string,
    month?: string
  ): Promise<MonthlyReport | null> {
    try {
      const targetMonth = month || new Date().toISOString().substring(0, 7);
      
      // ユーザーの実際のIDを取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();
      
      if (userError || !userData) {
        console.error('ユーザー取得エラー:', userError);
        return null;
      }
      
      // 月次統計データを取得
      const { data: monthlyStats, error: statsError } = await supabase
        .from('beauty_stats')
        .select('*')
        .eq('user_id', userData.id)
        .eq('month', targetMonth)
        .order('date');
      
      if (statsError) {
        console.error('月次統計取得エラー:', statsError);
        return null;
      }
      
      // 前月のデータを取得（改善率計算用）
      const prevMonth = this.getPreviousMonth(targetMonth);
      const { data: prevMonthStats } = await supabase
        .from('beauty_stats')
        .select('*')
        .eq('user_id', userData.id)
        .eq('month', prevMonth);
      
      return this.buildMonthlyReport(monthlyStats, prevMonthStats, targetMonth);
      
    } catch (error) {
      console.error('月次レポート生成失敗:', error);
      return null;
    }
  }
  
  // 美容食材ランキング取得
  static async getTopBeautyFoods(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<TopBeautyFood[]> {
    try {
      // ユーザーの実際のIDを取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();
      
      if (userError || !userData) {
        return [];
      }
      
      // AI解析結果から食材データを集計
      const { data: analysisResults, error: analysisError } = await supabase
        .from('ai_analysis_results')
        .select(`
          *,
          meal_records!inner (
            user_id,
            taken_at
          )
        `)
        .eq('meal_records.user_id', userData.id)
        .gte('meal_records.taken_at', startDate)
        .lte('meal_records.taken_at', endDate);
      
      if (analysisError) {
        console.error('解析結果取得エラー:', analysisError);
        return [];
      }
      
      return this.aggregateTopFoods(analysisResults);
      
    } catch (error) {
      console.error('美容食材ランキング取得失敗:', error);
      return [];
    }
  }
  
  // プライベートメソッド
  private static getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 月曜日を週の始まりとする
    d.setDate(diff);
    d.setHours(0, 0, 0, 0); // 時刻をリセット
    return d;
  }
  
  private static getWeekStartString(date: Date): string {
    return this.getWeekStart(date).toISOString().split('T')[0];
  }
  
  private static getPreviousMonth(month: string): string {
    const [year, monthNum] = month.split('-').map(Number);
    const prevDate = new Date(year, monthNum - 2, 1); // monthは1ベースなので-2
    return prevDate.toISOString().substring(0, 7);
  }
  
  private static calculateDailyStats(
    analysisResult: FoodAnalysisResult,
    existingStats?: BeautyStats
  ): Partial<BeautyStats> {
    const beautyScore = analysisResult.beauty_score;
    const currentCount = existingStats?.daily_analyses_count || 0;
    const newCount = currentCount + 1;
    
    // 平均スコアを計算（既存がある場合は累積平均）
    const currentDailyScore = existingStats?.daily_score || 0;
    const newDailyScore = currentCount === 0 
      ? beautyScore.overall 
      : ((currentDailyScore * currentCount) + beautyScore.overall) / newCount;
    
    // カテゴリー別スコアの累積平均を計算
    const calculateCategoryAverage = (category: keyof typeof beautyScore, existingValue: number = 0) => {
      return currentCount === 0 
        ? beautyScore[category] 
        : ((existingValue * currentCount) + beautyScore[category]) / newCount;
    };
    
    return {
      daily_score: Math.round(newDailyScore),
      daily_analyses_count: newCount,
      skin_care_score: Math.round(calculateCategoryAverage('skin_care', existingStats?.skin_care_score)),
      anti_aging_score: Math.round(calculateCategoryAverage('anti_aging', existingStats?.anti_aging_score)),
      detox_score: Math.round(calculateCategoryAverage('detox', existingStats?.detox_score)),
      circulation_score: Math.round(calculateCategoryAverage('circulation', existingStats?.circulation_score)),
      hair_nails_score: Math.round(calculateCategoryAverage('hair_nails', existingStats?.hair_nails_score)),
      
      // 栄養バランスの仮実装（後で詳細化）
      protein_balance: Math.round(beautyScore.overall * 0.8),
      vitamin_balance: Math.round(beautyScore.overall * 0.9),
      mineral_balance: Math.round(beautyScore.overall * 0.85),
      fiber_balance: Math.round(beautyScore.overall * 0.75),
    };
  }
  
  private static buildWeeklyReport(
    weeklyStats: BeautyStats[],
    prevWeekStats: BeautyStats[] | null,
    topFoods: TopBeautyFood[],
    weekStart: Date
  ): WeeklyReport {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // 日別データを構築
    const days = ['月', '火', '水', '木', '金', '土', '日'];
    const dailyScores = days.map((_, index) => {
      const targetDate = new Date(weekStart);
      targetDate.setDate(targetDate.getDate() + index);
      const dateStr = targetDate.toISOString().split('T')[0];
      const stat = weeklyStats.find(s => s.date === dateStr);
      return stat?.daily_score || 0;
    });
    
    // 平均スコア計算
    const validScores = dailyScores.filter(score => score > 0);
    const averageScore = validScores.length > 0 
      ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length)
      : 0;
    
    // 前週比改善率計算
    const prevWeekAverage = prevWeekStats && prevWeekStats.length > 0
      ? prevWeekStats.reduce((sum, stat) => sum + stat.daily_score, 0) / prevWeekStats.length
      : 0;
    
    const improvement = prevWeekAverage > 0 
      ? `${averageScore > prevWeekAverage ? '+' : ''}${Math.round(averageScore - prevWeekAverage)}点`
      : '+0点';
    
    // カテゴリー別スコア計算
    const categoryScores = {
      skin_care: Math.round(weeklyStats.reduce((sum, s) => sum + s.skin_care_score, 0) / (weeklyStats.length || 1)),
      anti_aging: Math.round(weeklyStats.reduce((sum, s) => sum + s.anti_aging_score, 0) / (weeklyStats.length || 1)),
      detox: Math.round(weeklyStats.reduce((sum, s) => sum + s.detox_score, 0) / (weeklyStats.length || 1)),
      circulation: Math.round(weeklyStats.reduce((sum, s) => sum + s.circulation_score, 0) / (weeklyStats.length || 1)),
      hair_nails: Math.round(weeklyStats.reduce((sum, s) => sum + s.hair_nails_score, 0) / (weeklyStats.length || 1)),
    };
    
    // トップカテゴリー特定
    const topCategory = Object.entries(categoryScores).reduce((max, [key, value]) => 
      value > max.value ? { key, value } : max, { key: 'skin_care', value: 0 }
    );
    
    const categoryNames = {
      skin_care: '美肌',
      anti_aging: 'アンチエイジング',
      detox: 'デトックス',
      circulation: '血行促進',
      hair_nails: '髪・爪の健康'
    };
    
    return {
      period: `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      averageScore,
      totalAnalyses: weeklyStats.reduce((sum, s) => sum + s.daily_analyses_count, 0),
      improvement,
      topCategory: categoryNames[topCategory.key as keyof typeof categoryNames],
      achievement: averageScore >= 80 ? '目標達成' : '継続中',
      dailyScores,
      days,
      categoryScores,
      topFoods: topFoods.slice(0, 3),
      insights: this.generateWeeklyInsights(weeklyStats, categoryScores)
    };
  }
  
  private static buildMonthlyReport(
    monthlyStats: BeautyStats[],
    prevMonthStats: BeautyStats[] | null,
    month: string
  ): MonthlyReport {
    const averageScore = monthlyStats.length > 0
      ? Math.round(monthlyStats.reduce((sum, s) => sum + s.daily_score, 0) / monthlyStats.length)
      : 0;
    
    const prevMonthAverage = prevMonthStats && prevMonthStats.length > 0
      ? prevMonthStats.reduce((sum, s) => sum + s.daily_score, 0) / prevMonthStats.length
      : 0;
    
    const improvement = prevMonthAverage > 0 
      ? `${averageScore > prevMonthAverage ? '+' : ''}${Math.round(averageScore - prevMonthAverage)}点`
      : '+0点';
    
    // カテゴリートレンド計算
    const categoryTrends: { [key: string]: { current: number; change: number } } = {};
    const categories = ['skin_care', 'anti_aging', 'detox', 'circulation', 'hair_nails'];
    
    categories.forEach(category => {
      const currentScore = monthlyStats.length > 0
        ? monthlyStats.reduce((sum, s) => sum + (s as any)[`${category}_score`], 0) / monthlyStats.length
        : 0;
      
      const prevScore = prevMonthStats && prevMonthStats.length > 0
        ? prevMonthStats.reduce((sum, s) => sum + (s as any)[`${category}_score`], 0) / prevMonthStats.length
        : 0;
      
      categoryTrends[category] = {
        current: Math.round(currentScore),
        change: prevScore > 0 ? Math.round(currentScore - prevScore) : 0
      };
    });
    
    // 栄養バランス計算
    const nutritionBalance = {
      protein: monthlyStats.length > 0 
        ? Math.round(monthlyStats.reduce((sum, s) => sum + s.protein_balance, 0) / monthlyStats.length)
        : 0,
      vitamins: monthlyStats.length > 0 
        ? Math.round(monthlyStats.reduce((sum, s) => sum + s.vitamin_balance, 0) / monthlyStats.length)
        : 0,
      minerals: monthlyStats.length > 0 
        ? Math.round(monthlyStats.reduce((sum, s) => sum + s.mineral_balance, 0) / monthlyStats.length)
        : 0,
      fiber: monthlyStats.length > 0 
        ? Math.round(monthlyStats.reduce((sum, s) => sum + s.fiber_balance, 0) / monthlyStats.length)
        : 0,
    };
    
    return {
      period: `${month.split('-')[0]}年${month.split('-')[1]}月`,
      month,
      averageScore,
      totalAnalyses: monthlyStats.reduce((sum, s) => sum + s.daily_analyses_count, 0),
      improvement,
      bestWeek: '第4週', // 実装では実際の最高週を計算
      categoryTrends,
      nutritionBalance,
      weeklyProgress: this.calculateWeeklyProgress(monthlyStats)
    };
  }
  
  private static aggregateTopFoods(analysisResults: any[]): TopBeautyFood[] {
    // 実装では AI解析結果から食材を集計してランキング化
    // 現在はダミーデータを返す
    return [
      { name: '鮭の塩焼き', score: 95, category: '美肌', frequency: 3, lastEaten: '2025-06-28' },
      { name: 'アボカドサラダ', score: 88, category: 'アンチエイジング', frequency: 2, lastEaten: '2025-06-27' },
      { name: 'ブロッコリー炒め', score: 85, category: 'デトックス', frequency: 4, lastEaten: '2025-06-26' }
    ];
  }
  
  private static generateWeeklyInsights(weeklyStats: BeautyStats[], categoryScores: any): string[] {
    const insights: string[] = [];
    
    // 最高スコアカテゴリーに基づくインサイト
    const maxCategory = Object.entries(categoryScores).reduce((max, [key, value]) => 
      (value as number) > max.value ? { key, value: value as number } : max, { key: '', value: 0 }
    );
    
    if (maxCategory.value >= 85) {
      const categoryNames = {
        skin_care: '美肌',
        anti_aging: 'アンチエイジング',
        detox: 'デトックス',
        circulation: '血行促進',
        hair_nails: '髪・爪の健康'
      };
      insights.push(`今週は${categoryNames[maxCategory.key as keyof typeof categoryNames]}効果の高い食材を多く摂取されました`);
    }
    
    // 解析回数に基づくインサイト
    const totalAnalyses = weeklyStats.reduce((sum, s) => sum + s.daily_analyses_count, 0);
    if (totalAnalyses >= 15) {
      insights.push('継続的な食事記録により、美容効果が向上しています');
    }
    
    // デフォルトインサイト
    if (insights.length === 0) {
      insights.push('バランスの良い食事を心がけており、美容効果が期待できます');
    }
    
    return insights;
  }
  
  private static calculateWeeklyProgress(monthlyStats: BeautyStats[]): Array<{ week: string; score: number }> {
    // 実装では週別に統計を集計
    return [
      { week: '第1週', score: 75 },
      { week: '第2週', score: 78 },
      { week: '第3週', score: 82 },
      { week: '第4週', score: 85 }
    ];
  }
}

export default BeautyStatsService;