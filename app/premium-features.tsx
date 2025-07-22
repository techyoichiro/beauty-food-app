import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Crown, 
  Zap, 
  TrendingUp, 
  BarChart3, 
  Calendar,
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react-native';
import PremiumModal from '../components/PremiumModal';

const { width } = Dimensions.get('window');

// プレミアム機能比較データ
const featureComparison = [
  {
    category: 'AI食事解析',
    free: '1日3回まで',
    premium: '無制限',
    icon: Zap,
    color: '#ec4899',
    description: '何回でも食事を分析可能'
  },
  {
    category: 'AI解析エンジン',
    free: 'GPT-4o-mini',
    premium: 'GPT-4o',
    icon: Sparkles,
    color: '#8b5cf6',
    description: '最高精度の栄養・美容分析'
  },
  {
    category: '美容レポート',
    free: '基本分析のみ',
    premium: '詳細レポート',
    icon: TrendingUp,
    color: '#f59e0b',
    description: '週次・月次の詳細分析レポート'
  },
  {
    category: '美容スコア分析',
    free: '当日のみ',
    premium: '長期トレンド分析',
    icon: BarChart3,
    color: '#10b981',
    description: '美容効果の推移を可視化'
  },
  {
    category: '個別アドバイス',
    free: '基本的な提案',
    premium: '個別最適化',
    icon: Calendar,
    color: '#06b6d4',
    description: 'あなた専用の美容アドバイス'
  }
];

// プレミアム限定機能
const premiumFeatures = [
  {
    title: '無制限AI解析',
    description: '1日何回でも食事を分析。制限なしで美容効果を追求',
    benefit: '継続的な美容改善'
  },
  {
    title: '高精度AI',
    description: '最新のAIで栄養素を詳細分析。より正確な美容アドバイス',
    benefit: '精度の高い分析結果'
  },
  {
    title: '詳細美容レポート',
    description: '週次・月次レポートで美容効果の推移を確認',
    benefit: '長期的な美容管理'
  },
  {
    title: '美容食材ランキング',
    description: 'あなたに最適な美容食材を AI がランキング形式で提案',
    benefit: '効率的な美容食材選択'
  },
  {
    title: '達成度トラッキング',
    description: '美容目標に対する進捗を数値で可視化・管理',
    benefit: 'モチベーション維持'
  }
];

export default function PremiumFeaturesScreen() {
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FFF', '#FFF5F5']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#2D1B69" />
          </TouchableOpacity>
          <Text style={styles.title}>プレミアム機能</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={['#fbbf24', '#f59e0b', '#ec4899']}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Crown size={48} color="white" />
              <Text style={styles.heroTitle}>美容効果を最大化</Text>
              <Text style={styles.heroSubtitle}>
                プレミアムプランで制限なしの美容分析
              </Text>
            </LinearGradient>
          </View>

          {/* 機能比較セクション */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>無料版 vs プレミアム版</Text>
            <View style={styles.comparisonContainer}>
              {/* ヘッダー */}
              <View style={styles.comparisonHeader}>
                <Text style={styles.featureHeaderText}>機能</Text>
                <Text style={styles.freeHeaderText}>無料版</Text>
                <Text style={styles.premiumHeaderText}>プレミアム版</Text>
              </View>

              {/* 比較項目 */}
              {featureComparison.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <View key={index} style={styles.comparisonRow}>
                    <View style={styles.featureInfo}>
                      <View style={[styles.featureIcon, { backgroundColor: `${item.color}15` }]}>
                        <IconComponent size={20} color={item.color} />
                      </View>
                      <View style={styles.featureTexts}>
                        <Text style={styles.featureName}>{item.category}</Text>
                        <Text style={styles.featureDesc}>{item.description}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.planCompareContainer}>
                      <View style={styles.freeFeature}>
                        <XCircle size={16} color="#ef4444" />
                        <Text style={styles.freeFeatureText}>{item.free}</Text>
                      </View>
                      
                      <View style={styles.premiumFeature}>
                        <CheckCircle size={16} color="#10b981" />
                        <Text style={styles.premiumFeatureText}>{item.premium}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* プレミアム限定機能詳細 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>プレミアム限定機能</Text>
            {premiumFeatures.map((feature, index) => (
              <View key={index} style={styles.premiumFeatureCard}>
                <View style={styles.premiumFeatureHeader}>
                  <Crown size={20} color="#f59e0b" />
                  <Text style={styles.premiumFeatureTitle}>{feature.title}</Text>
                </View>
                <Text style={styles.premiumFeatureDescription}>
                  {feature.description}
                </Text>
                <View style={styles.benefitContainer}>
                  <CheckCircle size={16} color="#10b981" />
                  <Text style={styles.benefitText}>{feature.benefit}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* 価格情報 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>料金プラン</Text>
            <View style={styles.pricingContainer}>
              <View style={styles.pricingCard}>
                <Text style={styles.pricingTitle}>月額プラン</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>¥480</Text>
                  <Text style={styles.pricePeriod}>/月</Text>
                </View>
                <Text style={styles.pricingDescription}>
                  いつでもキャンセル可能
                </Text>
              </View>

              <View style={[styles.pricingCard, styles.popularCard]}>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>人気</Text>
                </View>
                <Text style={styles.pricingTitle}>年額プラン</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>¥4,800</Text>
                  <Text style={styles.pricePeriod}>/年</Text>
                </View>
                <Text style={styles.savingsText}>2ヶ月分お得！</Text>
                <Text style={styles.pricingDescription}>
                  月額換算 ¥400
                </Text>
              </View>
            </View>
          </View>

          {/* 解約について */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>解約について</Text>
            <View style={styles.cancellationCard}>
              <Text style={styles.cancellationTitle}>いつでも簡単に解約可能</Text>
              <Text style={styles.cancellationText}>
                iOS設定 {'>'} Apple ID {'>'} サブスクリプション {'>'} 美活！
                {'\n\n'}
                から簡単に解約・管理ができます。
                {'\n\n'}
                解約後も期間終了まで プレミアム機能をご利用いただけます。
              </Text>
            </View>
          </View>

          {/* CTA */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => setShowPremiumModal(true)}
            >
              <LinearGradient
                colors={['#ec4899', '#f97316']}
                style={styles.upgradeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Crown size={20} color="white" />
                <Text style={styles.upgradeButtonText}>プレミアムにアップグレード</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* プレミアムモーダル */}
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroSection: {
    marginBottom: 32,
  },
  heroGradient: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: 'NotoSansJP-Bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  comparisonContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#f3f4f6',
    marginBottom: 16,
  },
  featureHeaderText: {
    flex: 2,
    fontSize: 16,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
  },
  freeHeaderText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'NotoSansJP-Bold',
    color: '#ef4444',
    textAlign: 'center',
  },
  premiumHeaderText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'NotoSansJP-Bold',
    color: '#10b981',
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureInfo: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureTexts: {
    flex: 1,
  },
  featureName: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
  },
  planCompareContainer: {
    flex: 2,
    flexDirection: 'row',
  },
  freeFeature: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  freeFeatureText: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Medium',
    color: '#ef4444',
    marginLeft: 4,
  },
  premiumFeature: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  premiumFeatureText: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Medium',
    color: '#10b981',
    marginLeft: 4,
  },
  premiumFeatureCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumFeatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumFeatureTitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  premiumFeatureDescription: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  benefitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#10b981',
    marginLeft: 6,
  },
  pricingContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  pricingCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  popularCard: {
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontFamily: 'NotoSansJP-Bold',
    color: 'white',
  },
  pricingTitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#1f2937',
  },
  pricePeriod: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: '#6b7280',
  },
  savingsText: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Bold',
    color: '#10b981',
    marginBottom: 4,
  },
  pricingDescription: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    textAlign: 'center',
  },
  cancellationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cancellationTitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  cancellationText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#4b5563',
    lineHeight: 20,
  },
  ctaContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  upgradeButton: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Bold',
    color: 'white',
    marginLeft: 8,
  },
});