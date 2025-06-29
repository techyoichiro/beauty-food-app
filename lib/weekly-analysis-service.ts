import { supabase } from './supabase';
import { MealRecord } from './meal-service';

export interface WeeklyAnalysisData {
  weekStart: Date;
  weekEnd: Date;
  dailyScores: Array<{
    date: Date;
    averageScore: number;
    mealCount: number;
    topCategory: string;
  }>;
  weeklyStats: {
    averageScore: number;
    totalMeals: number;
    bestDay: string;
    worstDay: string;
    improvementTrend: 'up' | 'down' | 'stable';
    categoryBreakdown: {
      skin_care: number;
      anti_aging: number;
      detox: number;
      circulation: number;
      hair_nails: number;
    };
  };
  recommendations: string[];
  achievements: Array<{
    title: string;
    description: string;
    icon: string;
    achieved: boolean;
  }>;
}

export interface MonthlyTrend {
  month: string;
  averageScore: number;
  mealCount: number;
  bestCategory: string;
}

class WeeklyAnalysisService {
  /**
   * 週間分析データを取得
   */
  async getWeeklyAnalysis(userId: string, weekStart?: Date): Promise<WeeklyAnalysisData> {
    try {
      const startDate = weekStart || this.getWeekStart(new Date());
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      console.log('📊 週間分析データ取得中:', {
        userId: userId.substring(0, 8) + '...',
        weekStart: startDate.toISOString().split('T')[0],
        weekEnd: endDate.toISOString().split('T')[0]
      });

      // まず、auth_user_idから実際のusers.idを取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (userError || !userData) {
        console.error('ユーザーレコード取得エラー:', userError);
        // ユーザーが見つからない場合はサンプルデータを返す
        console.log('📊 ユーザーが見つからないためサンプルデータを生成');
        return this.generateSampleWeeklyData(startDate, endDate);
      }

      console.log('👤 ユーザーID変換:', {
        authUserId: userId.substring(0, 8) + '...',
        internalUserId: userData.id.substring(0, 8) + '...'
      });

      // 実際のusers.idを使用してmeal_recordsを検索
      const { data: mealRecords, error } = await supabase
        .from('meal_records')
        .select(`
          *,
          ai_analysis_results (
            nutrition_analysis
          )
        `)
        .eq('user_id', userData.id) // 内部IDを使用
        .gte('taken_at', startDate.toISOString())
        .lte('taken_at', endDate.toISOString())
        .eq('analysis_status', 'completed')
        .order('taken_at', { ascending: true });

      if (error) {
        console.error('週間分析データ取得エラー:', error);
        throw error;
      }

      console.log('📊 取得した食事記録数:', mealRecords?.length || 0);
      console.log('📊 取得した食事記録詳細:', mealRecords?.map(record => ({
        id: record.id.substring(0, 8) + '...',
        takenAt: record.taken_at,
        mealTiming: record.meal_timing,
        hasAnalysis: !!record.ai_analysis_results?.[0],
        beautyScore: record.ai_analysis_results?.[0]?.nutrition_analysis?.beauty_score?.overall
      })));

      // データが少ない場合はサンプルデータを返す
      if (!mealRecords || mealRecords.length < 3) {
        console.log('📊 データ不足のためサンプルデータを生成');
        return this.generateSampleWeeklyData(startDate, endDate);
      }

      // 日別スコアを計算
      const dailyScores = this.calculateDailyScores(mealRecords, startDate, endDate);
      
      // 週間統計を計算
      const weeklyStats = this.calculateWeeklyStats(mealRecords, dailyScores);
      
      // レコメンデーションを生成
      const recommendations = this.generateRecommendations(weeklyStats, dailyScores);
      
      // 達成度を計算
      const achievements = this.calculateAchievements(weeklyStats, dailyScores);

      console.log('📊 実際のデータで週間分析完了:', {
        dailyScoresCount: dailyScores.length,
        averageScore: weeklyStats.averageScore,
        totalMeals: weeklyStats.totalMeals
      });

      return {
        weekStart: startDate,
        weekEnd: endDate,
        dailyScores,
        weeklyStats,
        recommendations,
        achievements
      };

    } catch (error) {
      console.error('週間分析取得エラー:', error);
      // エラー時はサンプルデータを返す
      const startDate = weekStart || this.getWeekStart(new Date());
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      return this.generateSampleWeeklyData(startDate, endDate);
    }
  }

  /**
   * 月次トレンドデータを取得
   */
  async getMonthlyTrends(userId: string, monthsBack: number = 3): Promise<MonthlyTrend[]> {
    try {
      // まず、auth_user_idから実際のusers.idを取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (userError || !userData) {
        console.error('月次トレンド用ユーザーレコード取得エラー:', userError);
        return this.generateSampleMonthlyTrends();
      }

      const trends: MonthlyTrend[] = [];
      const currentDate = new Date();

      for (let i = 0; i < monthsBack; i++) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);

        const { data: mealRecords, error } = await supabase
          .from('meal_records')
          .select(`
            *,
            ai_analysis_results (
              nutrition_analysis
            )
          `)
          .eq('user_id', userData.id) // 内部IDを使用
          .gte('taken_at', monthStart.toISOString())
          .lte('taken_at', monthEnd.toISOString())
          .eq('analysis_status', 'completed');

        if (error) throw error;

        if (mealRecords && mealRecords.length > 0) {
          const averageScore = this.calculateAverageScore(mealRecords);
          const bestCategory = this.getBestCategory(mealRecords);
          
          trends.push({
            month: monthStart.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }),
            averageScore,
            mealCount: mealRecords.length,
            bestCategory
          });
        }
      }

      return trends.reverse();
    } catch (error) {
      console.error('月次トレンド取得エラー:', error);
      return this.generateSampleMonthlyTrends();
    }
  }

  /**
   * 週の開始日（月曜日）を取得
   */
  private getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // 月曜日を週の開始とする
    const weekStart = new Date(date.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  /**
   * 日別スコアを計算
   */
  private calculateDailyScores(mealRecords: any[], weekStart: Date, weekEnd: Date) {
    const dailyScores = [];
    const currentDate = new Date(weekStart);

    while (currentDate <= weekEnd) {
      const dayRecords = mealRecords.filter(record => {
        const recordDate = new Date(record.taken_at);
        return recordDate.toDateString() === currentDate.toDateString();
      });

      let averageScore = 0;
      let topCategory = 'skin_care';

      if (dayRecords.length > 0) {
        const scores = dayRecords.map(record => {
          // nutrition_analysis.beauty_score.overallからスコアを取得
          const beautyScore = record.ai_analysis_results?.[0]?.nutrition_analysis?.beauty_score;
          return beautyScore?.overall || 70;
        });
        averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
        
        // 最高スコアのカテゴリを特定
        topCategory = this.getTopCategoryForDay(dayRecords);
      }

      dailyScores.push({
        date: new Date(currentDate),
        averageScore,
        mealCount: dayRecords.length,
        topCategory
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyScores;
  }

  /**
   * 週間統計を計算
   */
  private calculateWeeklyStats(mealRecords: any[], dailyScores: any[]) {
    const scores = mealRecords.map(record => {
      // nutrition_analysis.beauty_score.overallからスコアを取得
      const beautyScore = record.ai_analysis_results?.[0]?.nutrition_analysis?.beauty_score;
      return beautyScore?.overall || 70;
    });
    
    const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    const totalMeals = mealRecords.length;

    // 最高・最低の日を特定
    const sortedDays = [...dailyScores].sort((a, b) => b.averageScore - a.averageScore);
    const bestDay = sortedDays[0]?.date.toLocaleDateString('ja-JP', { weekday: 'long' }) || '月曜日';
    const worstDay = sortedDays[sortedDays.length - 1]?.date.toLocaleDateString('ja-JP', { weekday: 'long' }) || '日曜日';

    // 改善トレンドを計算
    const firstHalf = dailyScores.slice(0, Math.ceil(dailyScores.length / 2));
    const secondHalf = dailyScores.slice(Math.ceil(dailyScores.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.averageScore, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.averageScore, 0) / secondHalf.length;
    
    let improvementTrend: 'up' | 'down' | 'stable' = 'stable';
    if (secondHalfAvg > firstHalfAvg + 5) improvementTrend = 'up';
    else if (secondHalfAvg < firstHalfAvg - 5) improvementTrend = 'down';

    // カテゴリー別スコア集計
    const categoryBreakdown = this.calculateCategoryBreakdown(mealRecords);

    return {
      averageScore,
      totalMeals,
      bestDay,
      worstDay,
      improvementTrend,
      categoryBreakdown
    };
  }

  /**
   * カテゴリー別スコアの集計
   */
  private calculateCategoryBreakdown(mealRecords: any[]) {
    const categories = ['skin_care', 'anti_aging', 'detox', 'circulation', 'hair_nails'];
    const breakdown: any = {};

    categories.forEach(category => {
      const scores = mealRecords.map(record => {
        // nutrition_analysis.beauty_score[category]からスコアを取得
        const beautyScore = record.ai_analysis_results?.[0]?.nutrition_analysis?.beauty_score;
        return beautyScore?.[category] || 70;
      });
      
      breakdown[category] = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    });

    return breakdown;
  }

  /**
   * レコメンデーションを生成
   */
  private generateRecommendations(weeklyStats: any, dailyScores: any[]): string[] {
    const recommendations = [];

    // スコアベースのアドバイス
    if (weeklyStats.averageScore < 70) {
      recommendations.push('🥗 野菜や果物を増やして美容効果をアップしましょう');
      recommendations.push('💧 水分補給を意識してデトックス効果を高めましょう');
    } else if (weeklyStats.averageScore < 80) {
      recommendations.push('🌟 あと少しで高スコア！タンパク質と抗酸化食品を意識しましょう');
      recommendations.push('🥜 ナッツ類やアボカドで良質な脂質を摂取しましょう');
    } else {
      recommendations.push('✨ 素晴らしいスコアです！この調子で美容食習慣を継続しましょう');
      recommendations.push('🎯 より高い目標に向けて新しい美容食材にチャレンジしてみましょう');
    }

    // トレンドベースのアドバイス
    if (weeklyStats.improvementTrend === 'down') {
      recommendations.push('📈 スコアが下降気味です。週末に食事プランを見直してみましょう');
    } else if (weeklyStats.improvementTrend === 'up') {
      recommendations.push('🚀 素晴らしい向上傾向です！この勢いを来週も継続しましょう');
    }

    // 食事回数ベースのアドバイス
    if (weeklyStats.totalMeals < 15) {
      recommendations.push('📱 食事記録の頻度を上げて、より詳細な分析を受けましょう');
    }

    return recommendations.slice(0, 4); // 最大4つまで
  }

  /**
   * 達成度を計算
   */
  private calculateAchievements(weeklyStats: any, dailyScores: any[]) {
    const achievements = [
      {
        title: '美容マスター',
        description: '週平均スコア80以上を達成',
        icon: '👑',
        achieved: weeklyStats.averageScore >= 80
      },
      {
        title: '継続の力',
        description: '7日間連続で食事記録',
        icon: '🔥',
        achieved: dailyScores.every(day => day.mealCount > 0)
      },
      {
        title: '向上心',
        description: '週後半のスコアが前半より向上',
        icon: '📈',
        achieved: weeklyStats.improvementTrend === 'up'
      },
      {
        title: '食事記録達人',
        description: '週20回以上の食事記録',
        icon: '📱',
        achieved: weeklyStats.totalMeals >= 20
      },
      {
        title: 'バランス美人',
        description: '全カテゴリで平均75以上',
        icon: '⚖️',
        achieved: Object.values(weeklyStats.categoryBreakdown).every((score: any) => score >= 75)
      }
    ];

    return achievements;
  }

  /**
   * その日の最高カテゴリを取得
   */
  private getTopCategoryForDay(dayRecords: any[]): string {
    const categoryTotals: Record<string, number> = {};
    const categories = ['skin_care', 'anti_aging', 'detox', 'circulation', 'hair_nails'];

    categories.forEach(category => {
      categoryTotals[category] = dayRecords.reduce((sum, record) => {
        return sum + (record.ai_analysis_results?.[0]?.nutrition_analysis?.beauty_score?.[category] || 0);
      }, 0);
    });

    let bestCategory = 'skin_care';
    let maxScore = categoryTotals[bestCategory];
    
    Object.entries(categoryTotals).forEach(([category, score]) => {
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    });

    return bestCategory;
  }

  /**
   * 平均スコアを計算
   */
  private calculateAverageScore(mealRecords: any[]): number {
    const scores = mealRecords.map(record => {
      // nutrition_analysis.beauty_score.overallからスコアを取得
      const beautyScore = record.ai_analysis_results?.[0]?.nutrition_analysis?.beauty_score;
      return beautyScore?.overall || 70;
    });
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  /**
   * 最高カテゴリを取得
   */
  private getBestCategory(mealRecords: any[]): string {
    const categoryMap: Record<string, string> = {
      skin_care: '美肌',
      anti_aging: 'アンチエイジング',
      detox: 'デトックス',
      circulation: '血行促進',
      hair_nails: '髪・爪'
    };

    const categoryTotals = this.calculateCategoryBreakdown(mealRecords);
    
    let bestCategory = 'skin_care';
    let maxScore = categoryTotals[bestCategory];
    
    Object.entries(categoryTotals).forEach(([category, score]) => {
      if (typeof score === 'number' && score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    });

    return categoryMap[bestCategory] || '美肌';
  }

  /**
   * サンプル週間データを生成
   */
  private generateSampleWeeklyData(weekStart: Date, weekEnd: Date): WeeklyAnalysisData {
    const dailyScores = [];
    const currentDate = new Date(weekStart);
    const sampleScores = [72, 78, 65, 82, 88, 75, 80];
    let dayIndex = 0;

    while (currentDate <= weekEnd) {
      dailyScores.push({
        date: new Date(currentDate),
        averageScore: sampleScores[dayIndex] || 75,
        mealCount: Math.floor(Math.random() * 3) + 1,
        topCategory: ['skin_care', 'anti_aging', 'detox'][Math.floor(Math.random() * 3)]
      });

      currentDate.setDate(currentDate.getDate() + 1);
      dayIndex++;
    }

    return {
      weekStart,
      weekEnd,
      dailyScores,
      weeklyStats: {
        averageScore: 77,
        totalMeals: 18,
        bestDay: '金曜日',
        worstDay: '水曜日',
        improvementTrend: 'up',
        categoryBreakdown: {
          skin_care: 78,
          anti_aging: 75,
          detox: 80,
          circulation: 73,
          hair_nails: 76
        }
      },
      recommendations: [
        '🥗 野菜の摂取量を増やして美容効果をアップしましょう',
        '💧 水分補給を意識してデトックス効果を高めましょう',
        '🌟 タンパク質と抗酸化食品を意識した食事を心がけましょう',
        '📱 食事記録の頻度を上げて、より詳細な分析を受けましょう'
      ],
      achievements: [
        {
          title: '美容マスター',
          description: '週平均スコア80以上を達成',
          icon: '👑',
          achieved: false
        },
        {
          title: '継続の力',
          description: '7日間連続で食事記録',
          icon: '🔥',
          achieved: true
        },
        {
          title: '向上心',
          description: '週後半のスコアが前半より向上',
          icon: '📈',
          achieved: true
        }
      ]
    };
  }

  /**
   * サンプル月次トレンドを生成
   */
  private generateSampleMonthlyTrends(): MonthlyTrend[] {
    const currentDate = new Date();
    const trends = [];

    for (let i = 2; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      trends.push({
        month: monthDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }),
        averageScore: 70 + Math.floor(Math.random() * 20),
        mealCount: 45 + Math.floor(Math.random() * 30),
        bestCategory: ['美肌', 'アンチエイジング', 'デトックス'][Math.floor(Math.random() * 3)]
      });
    }

    return trends;
  }
}

export default new WeeklyAnalysisService(); 