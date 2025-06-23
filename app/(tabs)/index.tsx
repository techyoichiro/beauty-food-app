import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Sparkles, TrendingUp, Crown } from 'lucide-react-native';
import { router } from 'expo-router';
import PremiumModal from '@/components/PremiumModal';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  const todayMeals = [
    {
      id: 1,
      time: '8:30',
      type: '朝食',
      image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300',
      score: 85,
      advice: '野菜の摂取量が理想的です'
    },
    {
      id: 2,
      time: '12:45',
      type: '昼食',
      image: 'https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg?auto=compress&cs=tinysrgb&w=300',
      score: 72,
      advice: 'タンパク質をもう少し追加しましょう'
    },
  ];

  const remainingAnalyses = 1; // 無料版の残り解析回数
  const isFreePlan = true; // プラン状況

  const handleSubscribe = (planId: string) => {
    console.log('Subscribe to plan:', planId);
    // RevenueCat integration would go here
  };

  const handleUpgradePress = () => {
    setShowPremiumModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>おはようございます！</Text>
            <Text style={styles.subtitle}>今日も美容に良い食事を</Text>
          </View>
          <TouchableOpacity style={styles.premiumBadge} onPress={handleUpgradePress}>
            <Crown size={16} color="#f59e0b" />
            <Text style={styles.premiumText}>PREMIUM</Text>
          </TouchableOpacity>
        </View>

        {/* Remaining Analyses (Free Plan) */}
        {isFreePlan && (
          <View style={styles.analysisCounter}>
            <Text style={styles.counterText}>
              今日の残り解析回数: <Text style={styles.counterNumber}>{remainingAnalyses}</Text>
            </Text>
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradePress}>
              <Text style={styles.upgradeText}>無制限にアップグレード</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Camera Button */}
        <TouchableOpacity 
          style={styles.cameraButton}
          onPress={() => router.push('/camera')}
        >
          <LinearGradient
            colors={['#ec4899', '#f97316']}
            style={styles.cameraGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Camera size={32} color="white" />
            <Text style={styles.cameraButtonText}>食事を撮影・解析</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Today's Meals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>今日の食事</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>すべて見る</Text>
            </TouchableOpacity>
          </View>

          {todayMeals.length > 0 ? (
            todayMeals.map((meal) => (
              <TouchableOpacity key={meal.id} style={styles.mealCard}>
                <Image source={{ uri: meal.image }} style={styles.mealImage} />
                <View style={styles.mealInfo}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealType}>{meal.type}</Text>
                    <Text style={styles.mealTime}>{meal.time}</Text>
                  </View>
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreLabel}>美容スコア</Text>
                    <Text style={styles.score}>{meal.score}</Text>
                  </View>
                  <Text style={styles.advice}>{meal.advice}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Sparkles size={48} color="#ec4899" />
              <Text style={styles.emptyTitle}>まだ今日の食事がありません</Text>
              <Text style={styles.emptySubtitle}>カメラボタンから食事を撮影して解析を始めましょう</Text>
            </View>
          )}
        </View>

        {/* Beauty Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今週の美容傾向</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <TrendingUp size={24} color="#10b981" />
              <Text style={styles.statValue}>78</Text>
              <Text style={styles.statLabel}>平均スコア</Text>
            </View>
            <View style={styles.statCard}>
              <Sparkles size={24} color="#f59e0b" />
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>解析回数</Text>
            </View>
          </View>
        </View>

        {/* Premium Upgrade */}
        {isFreePlan && (
          <TouchableOpacity style={styles.premiumCard} onPress={handleUpgradePress}>
            <LinearGradient
              colors={['#fbbf24', '#f59e0b']}
              style={styles.premiumGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Crown size={24} color="white" />
              <Text style={styles.premiumTitle}>プレミアムプランで</Text>
              <Text style={styles.premiumSubtitle}>無制限解析 + 詳細レポート</Text>
              <Text style={styles.premiumPrice}>月額480円から</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>

      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSubscribe={handleSubscribe}
      />
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
  greeting: {
    fontSize: 24,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    marginTop: 2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  premiumText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#f59e0b',
    marginLeft: 4,
  },
  analysisCounter: {
    backgroundColor: '#fef2f2',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  counterText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: '#7c2d12',
  },
  counterNumber: {
    color: '#dc2626',
    fontFamily: 'Poppins-Bold',
  },
  upgradeButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  upgradeText: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Medium',
    color: 'white',
  },
  cameraButton: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  cameraGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
  },
  cameraButtonText: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-Bold',
    color: 'white',
    marginLeft: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
  },
  seeAll: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: '#ec4899',
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
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  mealInfo: {
    flex: 1,
    marginLeft: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealType: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
  },
  mealTime: {
    fontSize: 14,
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
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#10b981',
  },
  advice: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#ec4899',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
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
  premiumCard: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  premiumGradient: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  premiumTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-Bold',
    color: 'white',
    marginTop: 8,
  },
  premiumSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: 'white',
    marginTop: 4,
  },
  premiumPrice: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    marginTop: 8,
  },
});