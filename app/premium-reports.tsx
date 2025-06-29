import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Crown, 
  TrendingUp, 
  BarChart3, 
  Calendar,
  Star,
  Award,
  Target,
  Activity
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import BeautyStatsService, { WeeklyReport, MonthlyReport } from '../lib/beauty-stats-service';

const { width } = Dimensions.get('window');

// モック週次レポートデータ
const weeklyReportData = {
  period: '2025年6月22日 - 6月28日',
  averageScore: 82,
  totalAnalyses: 15,
  improvement: '+8点',
  topCategory: '美肌',
  achievement: '目標達成',
  dailyScores: [75, 78, 85, 82, 88, 79, 91],
  days: ['月', '火', '水', '木', '金', '土', '日'],
  categoryScores: {
    skin_care: 88,
    anti_aging: 82,
    detox: 75,
    circulation: 80,
    hair_nails: 79
  },
  topFoods: [
    { name: '鮭の塩焼き', score: 95, category: '美肌' },
    { name: 'アボカドサラダ', score: 88, category: 'アンチエイジング' },
    { name: 'ブロッコリー炒め', score: 85, category: 'デトックス' }
  ],
  insights: [
    '今週は美肌効果の高い食材を多く摂取されました',
    'タンパク質摂取量が目標値を上回っています',
    'ビタミンCの摂取バランスが理想的です'
  ]
};

// モック月次レポートデータ
const monthlyReportData = {
  period: '2025年6月',
  averageScore: 79,
  totalAnalyses: 68,
  improvement: '+12点',
  bestWeek: '第4週',
  categoryTrends: {
    skin_care: { current: 85, change: +7 },
    anti_aging: { current: 78, change: +5 },
    detox: { current: 74, change: +3 },
    circulation: { current: 81, change: +9 },
    hair_nails: { current: 76, change: +4 }
  },
  nutritionBalance: {
    protein: 85,
    vitamins: 78,
    minerals: 82,
    fiber: 75
  }
};

export default function PremiumReportsScreen() {
  const [selectedTab, setSelectedTab] = useState<'weekly' | 'monthly'>('weekly');
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const { session, isPremium } = useAuth();

  useEffect(() => {
    loadReports();
  }, [session, isPremium]);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      if (!session?.user?.id) {
        console.log('⚠️ ユーザーがログインしていません');
        setWeeklyReport({
          ...weeklyReportData,
          weekStart: weeklyReportData.period.split(' - ')[0],
          weekEnd: weeklyReportData.period.split(' - ')[1],
          achievement: weeklyReportData.achievement,
        });
        setMonthlyReport({
          ...monthlyReportData,
          month: monthlyReportData.period,
          bestWeek: monthlyReportData.bestWeek,
          weeklyProgress: []
        });
        return;
      }

      console.log('📊 レポートデータ取得開始...', { userId: session.user.id, isPremium });

      // リアルデータを取得
      const [weekly, monthly] = await Promise.all([
        BeautyStatsService.generateWeeklyReport(session.user.id),
        BeautyStatsService.generateMonthlyReport(session.user.id)
      ]).catch(error => {
        console.error('❌ レポート生成エラー:', error);
        return [null, null];
      });

      console.log('📈 取得結果:', {
        weeklyReport: weekly ? '取得成功' : '取得失敗',
        monthlyReport: monthly ? '取得成功' : '取得失敗',
        weeklyAverage: weekly?.averageScore,
        monthlyAverage: monthly?.averageScore
      });

      // データがない場合はフォールバックデータを使用
      if (!weekly || weekly.averageScore === 0) {
        console.log('⚠️ 週次データなし、フォールバックデータを使用');
        setWeeklyReport({
          ...weeklyReportData,
          weekStart: weeklyReportData.period.split(' - ')[0],
          weekEnd: weeklyReportData.period.split(' - ')[1],
          achievement: weeklyReportData.achievement,
        });
      } else {
        console.log('✅ 週次レポート: リアルデータを使用');
        setWeeklyReport(weekly);
      }
      
      if (!monthly || monthly.averageScore === 0) {
        console.log('⚠️ 月次データなし、フォールバックデータを使用');
        setMonthlyReport({
          ...monthlyReportData,
          month: monthlyReportData.period,
          bestWeek: monthlyReportData.bestWeek,
          weeklyProgress: []
        });
      } else {
        console.log('✅ 月次レポート: リアルデータを使用');
        setMonthlyReport(monthly);
      }

    } catch (error) {
      console.error('レポート読み込みエラー:', error);
      // エラー時はモックデータを使用
      setWeeklyReport({
        ...weeklyReportData,
        weekStart: weeklyReportData.period.split(' - ')[0],
        weekEnd: weeklyReportData.period.split(' - ')[1],
        achievement: weeklyReportData.achievement,
      });
      setMonthlyReport({
        ...monthlyReportData,
        month: monthlyReportData.period,
        bestWeek: monthlyReportData.bestWeek,
        weeklyProgress: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const renderWeeklyChart = () => {
    if (!weeklyReport) return null;
    
    const maxScore = Math.max(...weeklyReport.dailyScores);
    const chartHeight = 120;
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>週間美容スコア推移</Text>
        <View style={styles.chart}>
          {weeklyReport.dailyScores.map((score, index) => (
            <View key={index} style={styles.chartBar}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: maxScore > 0 ? (score / maxScore) * chartHeight : 0,
                    backgroundColor: score >= 85 ? '#10b981' : score >= 75 ? '#f59e0b' : '#ec4899'
                  }
                ]} 
              />
              <Text style={styles.barValue}>{score}</Text>
              <Text style={styles.barLabel}>{weeklyReport.days[index]}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderCategoryAnalysis = () => {
    if (!weeklyReport) return null;
    
    const categoryNames = {
      skin_care: '美肌',
      anti_aging: 'アンチエイジング',
      detox: 'デトックス',
      circulation: '血行促進',
      hair_nails: '髪・爪の健康'
    };

    return (
      <View style={styles.categoryContainer}>
        <Text style={styles.sectionTitle}>美容カテゴリー別分析</Text>
        {Object.entries(weeklyReport.categoryScores).map(([key, score]) => (
          <View key={key} style={styles.categoryItem}>
            <Text style={styles.categoryName}>{categoryNames[key as keyof typeof categoryNames]}</Text>
            <View style={styles.scoreBar}>
              <View 
                style={[
                  styles.scoreProgress,
                  { 
                    width: `${score}%`,
                    backgroundColor: score >= 85 ? '#10b981' : score >= 75 ? '#f59e0b' : '#ec4899'
                  }
                ]} 
              />
            </View>
            <Text style={[styles.scoreValue, { 
              color: score >= 85 ? '#10b981' : score >= 75 ? '#f59e0b' : '#ec4899' 
            }]}>
              {score}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTopFoods = () => {
    if (!weeklyReport) return null;
    
    return (
      <View style={styles.topFoodsContainer}>
        <Text style={styles.sectionTitle}>今週のトップ美容食材</Text>
        {weeklyReport.topFoods.map((food, index) => (
          <View key={index} style={styles.foodItem}>
            <View style={styles.rankContainer}>
              <Text style={styles.rank}>{index + 1}</Text>
            </View>
            <View style={styles.foodInfo}>
              <Text style={styles.foodName}>{food.name}</Text>
              <Text style={styles.foodCategory}>{food.category}効果</Text>
            </View>
            <View style={styles.foodScore}>
              <Star size={16} color="#f59e0b" />
              <Text style={styles.foodScoreText}>{food.score}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderWeeklyReport = () => {
    if (!weeklyReport) return null;
    
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* サマリーカード */}
        <View style={styles.summaryContainer}>
          <LinearGradient
            colors={['#ec4899', '#f97316']}
            style={styles.summaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.summaryHeader}>
              <Crown size={24} color="white" />
              <Text style={styles.summaryTitle}>週次美容レポート</Text>
            </View>
            <Text style={styles.summaryPeriod}>{weeklyReport.period}</Text>
            
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{weeklyReport.averageScore}</Text>
                <Text style={styles.statLabel}>平均スコア</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{weeklyReport.totalAnalyses}</Text>
                <Text style={styles.statLabel}>解析回数</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{weeklyReport.improvement}</Text>
                <Text style={styles.statLabel}>先週比</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* 週間チャート */}
        {renderWeeklyChart()}

        {/* カテゴリー分析 */}
        {renderCategoryAnalysis()}

        {/* トップ食材 */}
        {renderTopFoods()}

        {/* インサイト */}
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>AI美容アドバイス</Text>
          {weeklyReport.insights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <Activity size={16} color="#10b981" />
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderMonthlyReport = () => {
    if (!monthlyReport) return null;
    
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 月次サマリー */}
        <View style={styles.summaryContainer}>
          <LinearGradient
            colors={['#8b5cf6', '#ec4899']}
            style={styles.summaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.summaryHeader}>
              <Award size={24} color="white" />
              <Text style={styles.summaryTitle}>月次美容レポート</Text>
            </View>
            <Text style={styles.summaryPeriod}>{monthlyReport.period}</Text>
            
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{monthlyReport.averageScore}</Text>
                <Text style={styles.statLabel}>月間平均</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{monthlyReport.totalAnalyses}</Text>
                <Text style={styles.statLabel}>総解析数</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{monthlyReport.improvement}</Text>
                <Text style={styles.statLabel}>月間改善</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* カテゴリートレンド */}
        <View style={styles.trendContainer}>
          <Text style={styles.sectionTitle}>美容カテゴリー月間推移</Text>
          {Object.entries(monthlyReport.categoryTrends).map(([key, data]) => {
            const categoryNames = {
              skin_care: '美肌',
              anti_aging: 'アンチエイジング',
              detox: 'デトックス',
              circulation: '血行促進',
              hair_nails: '髪・爪の健康'
            };
            
            return (
              <View key={key} style={styles.trendItem}>
                <Text style={styles.trendName}>{categoryNames[key as keyof typeof categoryNames]}</Text>
                <View style={styles.trendData}>
                  <Text style={styles.trendScore}>{data.current}</Text>
                  <View style={[styles.trendChange, { 
                    backgroundColor: data.change > 0 ? '#dcfce7' : '#fee2e2' 
                  }]}>
                    <Text style={[styles.trendChangeText, {
                      color: data.change > 0 ? '#16a34a' : '#dc2626'
                    }]}>
                      {data.change > 0 ? '+' : ''}{data.change}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* 栄養バランス */}
        <View style={styles.nutritionContainer}>
          <Text style={styles.sectionTitle}>月間栄養バランス分析</Text>
          {Object.entries(monthlyReport.nutritionBalance).map(([key, score]) => {
            const nutritionNames = {
              protein: 'タンパク質',
              vitamins: 'ビタミン',
              minerals: 'ミネラル',
              fiber: '食物繊維'
            };
            
            return (
              <View key={key} style={styles.nutritionItem}>
                <Text style={styles.nutritionName}>{nutritionNames[key as keyof typeof nutritionNames]}</Text>
                <View style={styles.nutritionBar}>
                  <View 
                    style={[
                      styles.nutritionProgress,
                      { 
                        width: `${score}%`,
                        backgroundColor: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ec4899'
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.nutritionScore}>{score}%</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FFF', '#FFF5F5']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#2D1B69" />
          </TouchableOpacity>
          <Text style={styles.title}>詳細美容レポート</Text>
          <View style={styles.premiumBadge}>
            <Crown size={16} color="#f59e0b" />
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'weekly' && styles.activeTab]}
            onPress={() => setSelectedTab('weekly')}
          >
            <Calendar size={16} color={selectedTab === 'weekly' ? '#ec4899' : '#6b7280'} />
            <Text style={[styles.tabText, selectedTab === 'weekly' && styles.activeTabText]}>
              週次レポート
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'monthly' && styles.activeTab]}
            onPress={() => setSelectedTab('monthly')}
          >
            <BarChart3 size={16} color={selectedTab === 'monthly' ? '#ec4899' : '#6b7280'} />
            <Text style={[styles.tabText, selectedTab === 'monthly' && styles.activeTabText]}>
              月次レポート
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ec4899" />
              <Text style={styles.loadingText}>レポートを読み込み中...</Text>
            </View>
          ) : (
            selectedTab === 'weekly' ? renderWeeklyReport() : renderMonthlyReport()
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'NotoSansJP-Bold',
    color: '#2D1B69',
  },
  premiumBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ec4899',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryContainer: {
    marginBottom: 24,
  },
  summaryGradient: {
    padding: 24,
    borderRadius: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-Bold',
    color: 'white',
    marginLeft: 8,
  },
  summaryPeriod: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: 'white',
    opacity: 0.9,
    marginBottom: 20,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: 'white',
    opacity: 0.8,
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 4,
    marginBottom: 4,
  },
  barValue: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Medium',
    color: '#6b7280',
  },
  categoryContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: '#2D1B69',
  },
  scoreBar: {
    flex: 2,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 4,
  },
  scoreValue: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Bold',
    minWidth: 30,
    textAlign: 'right',
  },
  topFoodsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rank: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: 'white',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
  },
  foodCategory: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    marginTop: 2,
  },
  foodScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  foodScoreText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#f59e0b',
  },
  insightsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#4b5563',
    lineHeight: 20,
  },
  trendContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  trendName: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: '#1f2937',
  },
  trendData: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendScore: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#1f2937',
  },
  trendChange: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  trendChangeText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  nutritionContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nutritionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  nutritionName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: '#1f2937',
  },
  nutritionBar: {
    flex: 2,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  nutritionProgress: {
    height: '100%',
    borderRadius: 4,
  },
  nutritionScore: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#1f2937',
    minWidth: 40,
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    marginTop: 16,
  },
});