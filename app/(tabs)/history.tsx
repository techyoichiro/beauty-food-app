import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, TrendingUp, ChartBar as BarChart3, Crown } from 'lucide-react-native';
import { LineChart } from 'react-native-svg';

const { width } = Dimensions.get('window');

const historyData = [
  {
    date: '2024/01/15',
    meals: [
      {
        id: 1,
        type: '朝食',
        time: '8:30',
        image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300',
        score: 85,
        advice: '野菜の摂取量が理想的です'
      },
      {
        id: 2,
        type: '昼食',
        time: '12:45',
        image: 'https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg?auto=compress&cs=tinysrgb&w=300',
        score: 72,
        advice: 'タンパク質をもう少し追加しましょう'
      },
      {
        id: 3,
        type: '夕食',
        time: '19:15',
        image: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=300',
        score: 90,
        advice: 'バランスの取れた理想的な食事です'
      },
    ],
    averageScore: 82,
  },
  {
    date: '2024/01/14',
    meals: [
      {
        id: 4,
        type: '朝食',
        time: '9:00',
        image: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=300',
        score: 78,
        advice: 'フルーツを追加すると更に良いでしょう'
      },
      {
        id: 5,
        type: '昼食',
        time: '13:20',
        image: 'https://images.pexels.com/photos/1640775/pexels-photo-1640775.jpeg?auto=compress&cs=tinysrgb&w=300',
        score: 68,
        advice: '野菜を増やしましょう'
      },
    ],
    averageScore: 73,
  },
];

const weeklyScores = [65, 72, 78, 82, 85, 79, 88];
const days = ['月', '火', '水', '木', '金', '土', '日'];

export default function HistoryScreen() {
  const [selectedTab, setSelectedTab] = useState<'daily' | 'weekly'>('daily');
  const isFreePlan = true;

  const renderChart = () => {
    const maxScore = Math.max(...weeklyScores);
    const chartHeight = 120;
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>週間美容スコア推移</Text>
        <View style={styles.chart}>
          {weeklyScores.map((score, index) => (
            <View key={index} style={styles.chartBar}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: (score / maxScore) * chartHeight,
                    backgroundColor: score >= 80 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ec4899'
                  }
                ]} 
              />
              <Text style={styles.barValue}>{score}</Text>
              <Text style={styles.barLabel}>{days[index]}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderMealCard = (meal: any) => (
    <TouchableOpacity key={meal.id} style={styles.mealCard}>
      <Image source={{ uri: meal.image }} style={styles.mealImage} />
      <View style={styles.mealInfo}>
        <View style={styles.mealHeader}>
          <Text style={styles.mealType}>{meal.type}</Text>
          <Text style={styles.mealTime}>{meal.time}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>美容スコア</Text>
          <Text style={[
            styles.score,
            { color: meal.score >= 80 ? '#10b981' : meal.score >= 70 ? '#f59e0b' : '#ec4899' }
          ]}>
            {meal.score}
          </Text>
        </View>
        <Text style={styles.advice} numberOfLines={1}>{meal.advice}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>食事履歴</Text>
        <TouchableOpacity style={styles.calendarButton}>
          <Calendar size={20} color="#ec4899" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'daily' && styles.activeTab]}
          onPress={() => setSelectedTab('daily')}
        >
          <Text style={[styles.tabText, selectedTab === 'daily' && styles.activeTabText]}>
            日別履歴
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'weekly' && styles.activeTab]}
          onPress={() => setSelectedTab('weekly')}
        >
          <Text style={[styles.tabText, selectedTab === 'weekly' && styles.activeTabText]}>
            週間分析
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {selectedTab === 'daily' ? (
          <>
            {historyData.map((dayData, dayIndex) => (
              <View key={dayIndex} style={styles.daySection}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayDate}>{dayData.date}</Text>
                  <View style={styles.dayScore}>
                    <Text style={styles.dayScoreLabel}>平均スコア</Text>
                    <Text style={[
                      styles.dayScoreValue,
                      { color: dayData.averageScore >= 80 ? '#10b981' : dayData.averageScore >= 70 ? '#f59e0b' : '#ec4899' }
                    ]}>
                      {dayData.averageScore}
                    </Text>
                  </View>
                </View>
                {dayData.meals.map(renderMealCard)}
              </View>
            ))}
          </>
        ) : (
          <>
            {renderChart()}
            
            {/* Weekly Stats */}
            <View style={styles.statsSection}>
              <Text style={styles.statsTitle}>今週の統計</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <TrendingUp size={24} color="#10b981" />
                  <Text style={styles.statValue}>78</Text>
                  <Text style={styles.statLabel}>平均スコア</Text>
                </View>
                <View style={styles.statCard}>
                  <BarChart3 size={24} color="#ec4899" />
                  <Text style={styles.statValue}>12</Text>
                  <Text style={styles.statLabel}>解析回数</Text>
                </View>
              </View>
            </View>

            {/* Premium Feature */}
            {isFreePlan && (
              <TouchableOpacity style={styles.premiumFeature}>
                <Crown size={24} color="#f59e0b" />
                <View style={styles.premiumText}>
                  <Text style={styles.premiumTitle}>プレミアム限定</Text>
                  <Text style={styles.premiumSubtitle}>
                    月次詳細レポート・美容食材ランキング・達成度トラッキング
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
  },
  calendarButton: {
    padding: 8,
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
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  },
  daySection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayDate: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
  },
  dayScore: {
    alignItems: 'center',
  },
  dayScoreLabel: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
  },
  dayScoreValue: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    marginTop: 2,
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  mealInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mealType: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
  },
  mealTime: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#6b7280',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    marginRight: 8,
  },
  score: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
  },
  advice: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#ec4899',
  },
  chartContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Medium',
    color: '#6b7280',
    marginTop: 4,
  },
  premiumFeature: {
    backgroundColor: '#fef3c7',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumText: {
    flex: 1,
    marginLeft: 16,
  },
  premiumTitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#92400e',
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#92400e',
    lineHeight: 20,
  },
});