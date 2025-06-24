import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Crown, Check, Sparkles, TrendingUp, ChartBar as BarChart3, Calendar, Zap } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: (planId: string) => void;
}

const plans = [
  {
    id: 'monthly',
    name: '月額プラン',
    price: '¥480',
    period: '/月',
    originalPrice: null,
    popular: false,
    savings: null,
  },
  {
    id: 'yearly',
    name: '年額プラン',
    price: '¥4,800',
    period: '/年',
    originalPrice: '¥5,760',
    popular: true,
    savings: '17%お得',
  },
];

const features = [
  {
    icon: Zap,
    title: '無制限AI解析',
    description: '1日何回でも食事を解析可能',
    color: '#ec4899',
  },
  {
    icon: TrendingUp,
    title: '詳細美容レポート',
    description: '月次・週次の詳細分析レポート',
    color: '#f59e0b',
  },
  {
    icon: BarChart3,
    title: '美容食材ランキング',
    description: 'あなたに最適な美容食材を提案',
    color: '#10b981',
  },
  {
    icon: Calendar,
    title: '達成度トラッキング',
    description: '美容目標の進捗を可視化',
    color: '#8b5cf6',
  },
];

export default function PremiumModal({ visible, onClose, onSubscribe }: PremiumModalProps) {
  const [selectedPlan, setSelectedPlan] = useState('yearly');

  const handleSubscribe = () => {
    onSubscribe(selectedPlan);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>プレミアムプラン</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={['#fbbf24', '#f59e0b']}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Crown size={48} color="white" />
              <Text style={styles.heroTitle}>美容の可能性を</Text>
              <Text style={styles.heroTitle}>最大限に引き出そう</Text>
              <Text style={styles.heroSubtitle}>
                プレミアムプランで、あなたの美容ジャーニーを次のレベルへ
              </Text>
            </LinearGradient>
          </View>

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>プレミアム限定機能</Text>
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <View key={index} style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: `${feature.color}15` }]}>
                    <IconComponent size={24} color={feature.color} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Plans */}
          <View style={styles.plansSection}>
            <Text style={styles.plansTitle}>プランを選択</Text>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.planCardSelected,
                  plan.popular && styles.planCardPopular,
                ]}
                onPress={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Sparkles size={12} color="white" />
                    <Text style={styles.popularText}>人気</Text>
                  </View>
                )}
                
                <View style={styles.planContent}>
                  <View style={styles.planHeader}>
                    <View style={styles.planInfo}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      {plan.savings && (
                        <Text style={styles.planSavings}>{plan.savings}</Text>
                      )}
                    </View>
                    <View style={styles.planPricing}>
                      {plan.originalPrice && (
                        <Text style={styles.originalPrice}>{plan.originalPrice}</Text>
                      )}
                      <View style={styles.currentPrice}>
                        <Text style={styles.planPrice}>{plan.price}</Text>
                        <Text style={styles.planPeriod}>{plan.period}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={[
                    styles.radioButton,
                    selectedPlan === plan.id && styles.radioButtonSelected
                  ]}>
                    {selectedPlan === plan.id && (
                      <Check size={16} color="white" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Terms */}
          <View style={styles.termsSection}>
            <Text style={styles.termsText}>
              • 購読は自動更新されます{'\n'}
              • いつでもキャンセル可能です{'\n'}
              • 無料トライアル期間中はいつでもキャンセル可能{'\n'}
              • 利用規約とプライバシーポリシーに同意したものとみなされます
            </Text>
          </View>
        </ScrollView>

        {/* Subscribe Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
            <LinearGradient
              colors={['#ec4899', '#f97316']}
              style={styles.subscribeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Crown size={20} color="white" />
              <Text style={styles.subscribeButtonText}>
                {selectedPlan === 'monthly' ? '月額プランを開始' : '年額プランを開始'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.restoreButton}>
            <Text style={styles.restoreButtonText}>購入を復元</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    margin: 20,
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
    lineHeight: 32,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: 'white',
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.9,
    lineHeight: 20,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    lineHeight: 20,
  },
  plansSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  plansTitle: {
    fontSize: 20,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f3f4f6',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planCardSelected: {
    borderColor: '#ec4899',
    backgroundColor: '#fef7ff',
  },
  planCardPopular: {
    borderColor: '#f59e0b',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Bold',
    color: 'white',
    marginLeft: 4,
  },
  planContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  planHeader: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginRight: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  planSavings: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#10b981',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  planPricing: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  currentPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#1f2937',
  },
  planPeriod: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#6b7280',
    marginLeft: 2,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioButtonSelected: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  termsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  termsText: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  subscribeButton: {
    marginBottom: 12,
  },
  subscribeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Bold',
    color: 'white',
    marginLeft: 8,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreButtonText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: '#6b7280',
  },
});