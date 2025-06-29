import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Crown, Check, Sparkles, TrendingUp, ChartBar as BarChart3, Calendar, Zap } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumPlan, PurchaseResult } from '@/lib/revenue-cat';
import revenueCatService from '@/lib/revenue-cat';

const { width } = Dimensions.get('window');

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe?: (planId: string) => void;
}

// RevenueCatから取得するプランに置き換わるため、初期値として使用
const defaultPlans = [
  {
    id: 'monthly_premium',
    title: '月額プラン',
    price: '¥480',
    period: '/月',
    savings: null,
  },
  {
    id: 'yearly_premium', 
    title: '年額プラン',
    price: '¥4,800',
    period: '/年',
    savings: '2ヶ月分お得！',
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
  const { purchasePremium, restorePurchases, getAvailablePlans, premiumLoading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly_premium');
  const [availablePlans, setAvailablePlans] = useState<PremiumPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // モーダルが開かれたときにプランを取得
  useEffect(() => {
    if (visible) {
      loadAvailablePlans();
    }
  }, [visible]);

  const loadAvailablePlans = async () => {
    try {
      setPlansLoading(true);
      
      // 購入可能性をチェック
      const availability = await revenueCatService.checkPurchaseAvailability();
      if (!availability.canPurchase) {
        console.error('Purchase not available:', availability.error);
        Toast.show({
          type: 'error',
          text1: '購入機能エラー',
          text2: availability.error || 'プラン情報の取得に失敗しました',
        });
        return;
      }
      
      const plans = await getAvailablePlans();
      setAvailablePlans(plans);
      
      // デフォルトの選択プランを設定
      if (plans.length > 0) {
        const yearlyPlan = plans.find(p => p.id.includes('yearly'));
        setSelectedPlan(yearlyPlan?.id || plans[0].id);
      } else {
        // 開発環境では製品審査待ちの可能性があるため、デフォルトプランを使用
        console.log('⚠️ RevenueCatプラン取得失敗、デフォルトプランを使用');
        setAvailablePlans(defaultPlans.map(plan => ({
          ...plan,
          rcPackage: null as any // 開発用の暫定対応
        })));
        setSelectedPlan('yearly_premium');
        
        Toast.show({
          type: 'info',
          text1: '開発モード',
          text2: 'App Store製品審査待ちのため、デモ価格を表示中',
        });
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
      Toast.show({
        type: 'error',
        text1: 'プラン取得エラー',
        text2: 'ネットワーク接続を確認してください',
      });
    } finally {
      setPlansLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const selectedPlanData = availablePlans.find(p => p.id === selectedPlan);
      if (!selectedPlanData) {
        Alert.alert('エラー', '選択されたプランが見つかりません');
        return;
      }

      setPurchasing(true);
      
      const result: PurchaseResult = await purchasePremium(selectedPlanData);
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: '購入完了！',
          text2: 'プレミアムプランへようこそ！',
        });
        
        // コールバック実行（下位互換性のため）
        if (onSubscribe) {
          onSubscribe(selectedPlan);
        }
        
        onClose();
      } else if (result.userCancelled) {
        // ユーザーキャンセルの場合は何もしない
        console.log('Purchase cancelled by user');
      } else {
        // エラーの場合
        const errorMessage = result.error ? revenueCatService.getErrorMessage(result.error) : '不明なエラーが発生しました';
        Alert.alert('購入エラー', errorMessage);
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      Alert.alert('購入エラー', '購入処理中にエラーが発生しました');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setRestoring(true);
      
      // 復元可能性をチェック
      const restoreAvailability = await revenueCatService.checkRestoreAvailability();
      
      if (!restoreAvailability.canRestore) {
        Alert.alert('復元不可', restoreAvailability.error || '復元可能な購入履歴が見つかりません');
        return;
      }
      
      const result: PurchaseResult = await restorePurchases();
      
      if (result.success) {
        const customerInfo = result.customerInfo;
        const isPremium = customerInfo?.entitlements.active['premium']?.isActive;
        
        if (isPremium) {
          Toast.show({
            type: 'success',
            text1: '復元完了！',
            text2: 'プレミアムプランが復元されました',
          });
          onClose();
        } else {
          Alert.alert('復元結果', '復元可能な購入が見つかりませんでした。過去にこのApple IDで購入されたことがあるか確認してください。');
        }
      } else {
        const errorMessage = result.error ? revenueCatService.getErrorMessage(result.error) : '復元中にエラーが発生しました';
        Alert.alert('復元エラー', errorMessage);
      }
    } catch (error: any) {
      console.error('Restore error:', error);
      Alert.alert('復元エラー', 'ネットワーク接続を確認してから再試行してください');
    } finally {
      setRestoring(false);
    }
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
            
            {plansLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ec4899" />
                <Text style={styles.loadingText}>プランを読み込み中...</Text>
              </View>
            ) : availablePlans.length > 0 ? (
              availablePlans.map((plan, index) => {
                const isYearly = plan.id.includes('yearly');
                const isPopular = isYearly;
                
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planCard,
                      selectedPlan === plan.id && styles.planCardSelected,
                      isPopular && styles.planCardPopular,
                    ]}
                    onPress={() => setSelectedPlan(plan.id)}
                  >
                    {isPopular && (
                      <View style={styles.popularBadge}>
                        <Sparkles size={12} color="white" />
                        <Text style={styles.popularText}>人気</Text>
                      </View>
                    )}
                    
                    <View style={styles.planContent}>
                      <View style={styles.planHeader}>
                        <View style={styles.planInfo}>
                          <Text style={styles.planName}>{plan.title}</Text>
                          {plan.savings && (
                            <Text style={styles.planSavings}>{plan.savings}</Text>
                          )}
                        </View>
                        <View style={styles.planPricing}>
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
                );
              })
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>プランの読み込みに失敗しました</Text>
                <TouchableOpacity onPress={loadAvailablePlans} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>再試行</Text>
                </TouchableOpacity>
              </View>
            )}
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
          <TouchableOpacity 
            style={[styles.subscribeButton, (purchasing || premiumLoading) && styles.subscribeButtonDisabled]} 
            onPress={handleSubscribe}
            disabled={purchasing || premiumLoading || availablePlans.length === 0}
          >
            <LinearGradient
              colors={['#ec4899', '#f97316']}
              style={styles.subscribeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {purchasing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Crown size={20} color="white" />
              )}
              <Text style={styles.subscribeButtonText}>
                {purchasing ? '処理中...' : (
                  selectedPlan.includes('monthly') ? '月額プランを開始' : '年額プランを開始'
                )}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.restoreButton} 
            onPress={handleRestorePurchases}
            disabled={restoring || premiumLoading}
          >
            {restoring ? (
              <ActivityIndicator size="small" color="#6b7280" />
            ) : (
              <Text style={styles.restoreButtonText}>購入を復元</Text>
            )}
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
  // 新しいスタイル
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: '#374151',
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
});