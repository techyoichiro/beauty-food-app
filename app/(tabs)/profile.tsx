import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Settings, Bell, Heart, Shield, CircleHelp as HelpCircle, ChevronRight, Sparkles, Target, TrendingUp, Calendar, Star, Code, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import PremiumModal from '@/components/PremiumModal';
import { UserProfileService, BEAUTY_CATEGORIES, BEAUTY_LEVELS, ExtendedUserProfile } from '../../lib/meal-service';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';
import BeautyStatsService from '../../lib/beauty-stats-service';
import { supabase } from '../../lib/supabase';

const beautyCategories = [
  { id: 'skin_care', label: '美肌', selected: true },
  { id: 'anti_aging', label: 'アンチエイジング', selected: true },
  { id: 'detox', label: 'デトックス', selected: false },
  { id: 'circulation', label: '血行促進', selected: false },
  { id: 'hair_nails', label: '髪・爪の健康', selected: true },
];

const beautyLevels = [
  { id: 'beginner', label: 'ライトケア派', description: '気軽に美容を楽しみたい方におすすめ' },
  { id: 'intermediate', label: 'バランス重視派', description: '美容と生活のバランスを大切にする方' },
  { id: 'advanced', label: 'こだわり美容派', description: '美容への関心が高く、詳しい情報を求める方' },
];

export default function ProfileScreen() {
  const [userProfile, setUserProfile] = useState<ExtendedUserProfile | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [premiumStats, setPremiumStats] = useState<any>(null);
  const { session, isPremium, premiumLoading, refreshPremiumStatus } = useAuth();
  
  // プレミアム状態の複数ソースチェック
  const userMetadataPremium = session?.user?.user_metadata?.premium === true;
  const actualIsPremium = isPremium || userMetadataPremium;
  const isFreePlan = !actualIsPremium;
  
  // デバッグ用：プレミアム状態の詳細表示
  useEffect(() => {
    console.log('🎯 プロフィール画面 プレミアム状態統合:', {
      authContextIsPremium: isPremium,
      userMetadataPremium,
      actualIsPremium,
      isFreePlan
    });
  }, [isPremium, userMetadataPremium, actualIsPremium, isFreePlan]);
  
  // デバッグ用: プレミアム状態の詳細ログ
  useEffect(() => {
    console.log('🎯 プロフィール画面 Premium状態詳細:', {
      isPremium,
      premiumLoading,
      isFreePlan,
      sessionExists: !!session,
      userId: session?.user?.id?.substring(0, 8) + '...' || 'なし',
      userMetadata: session?.user?.user_metadata,
      authUserMetadataPremium: session?.user?.user_metadata?.premium
    });
    
    // 強制的にプレミアム状態をチェック
    if (session?.user?.user_metadata?.premium === true) {
      console.log('🧪 Auth metadataでプレミアム検出、しかしisPremiumは:', isPremium);
    }
  }, [isPremium, premiumLoading, session]);

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (actualIsPremium && session?.user?.id) {
      console.log('🔄 プレミアム統計を読み込み中...');
      loadPremiumStats();
    }
  }, [actualIsPremium, session]);


  const loadUserProfile = async () => {
    try {
      const profile = await UserProfileService.getProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('プロフィール読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPremiumStats = async () => {
    try {
      if (!session?.user?.id) return;
      
      const monthlyReport = await BeautyStatsService.generateMonthlyReport(session.user.id);
      if (monthlyReport) {
        setPremiumStats({
          averageScore: monthlyReport.averageScore,
          goalAchievement: monthlyReport.averageScore >= 80 ? 75 : 50, // 仮の達成率計算
          topCategory: '美肌' // 実装では最高スコアカテゴリーを取得
        });
      }
    } catch (error) {
      console.error('プレミアム統計読み込みエラー:', error);
    }
  };

  const updateBeautyCategories = async (categories: string[]) => {
    try {
      await UserProfileService.updateBeautyCategories(categories);
      if (userProfile) {
        setUserProfile({ ...userProfile, beautyCategories: categories });
      }
      Toast.show({
        type: 'success',
        text1: '完了',
        text2: '美容目標を更新しました',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'エラー',
        text2: '設定の保存に失敗しました',
      });
    }
  };

  const updateBeautyLevel = async (level: 'beginner' | 'intermediate' | 'advanced') => {
    try {
      await UserProfileService.updateBeautyLevel(level);
      if (userProfile) {
        setUserProfile({ ...userProfile, beautyLevel: level });
      }
      Toast.show({
        type: 'success',
        text1: '完了',
        text2: '美容スタイルを更新しました',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'エラー',
        text2: '設定の保存に失敗しました',
      });
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (!userProfile) return;
    
    const currentCategories = userProfile.beautyCategories;
    let newCategories: string[];
    
    if (currentCategories.includes(categoryId)) {
      // 最低1つは選択されている必要がある
      if (currentCategories.length === 1) {
        Toast.show({
          type: 'info',
          text1: '注意',
          text2: '最低1つの美容目標を選択してください',
        });
        return;
      }
      newCategories = currentCategories.filter(id => id !== categoryId);
    } else {
      newCategories = [...currentCategories, categoryId];
    }
    
    updateBeautyCategories(newCategories);
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    try {
      if (userProfile) {
        const newNotifications = { ...userProfile.notifications, meal: enabled };
        await UserProfileService.updateNotifications(newNotifications);
        setUserProfile({ ...userProfile, notifications: newNotifications });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'エラー',
        text2: '通知設定の更新に失敗しました',
      });
    }
  };

  const handleAutoMealTimingToggle = async (enabled: boolean) => {
    try {
      if (userProfile) {
        await UserProfileService.updateAutoMealTiming(enabled);
        setUserProfile({ ...userProfile, autoMealTiming: enabled });
        Toast.show({
          type: 'success',
          text1: '設定完了',
          text2: `食事タイミング自動選択を${enabled ? 'ON' : 'OFF'}にしました`,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'エラー',
        text2: '設定の更新に失敗しました',
      });
    }
  };

  const handleGoalEdit = async (type: 'score' | 'meals') => {
    if (!userProfile) return;
    
    if (type === 'score') {
      Alert.prompt(
        '週間目標スコア設定',
        '目標とする週間平均スコアを入力してください（60-100点）',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '設定',
            onPress: async (value) => {
              const score = parseInt(value || '80');
              if (score >= 60 && score <= 100) {
                try {
                  await UserProfileService.updateBeautyGoals(score, userProfile.dailyMealGoal);
                  setUserProfile({ ...userProfile, weeklyGoalScore: score });
                  Toast.show({
                    type: 'success',
                    text1: '完了',
                    text2: `週間目標スコアを${score}点に設定しました。`,
                  });
                } catch (error) {
                  Toast.show({
                    type: 'error',
                    text1: 'エラー',
                    text2: '設定の保存に失敗しました',
                  });
                }
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'エラー',
                  text2: '60点から100点の間で入力してください。',
                });
              }
            }
          }
        ],
        'plain-text',
        userProfile.weeklyGoalScore.toString()
      );
    } else {
      Alert.alert(
        '1日の食事回数設定',
        '1日の目標食事回数を選択してください',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '2回', onPress: () => updateMealGoal(2) },
          { text: '3回', onPress: () => updateMealGoal(3) },
          { text: '4回', onPress: () => updateMealGoal(4) },
        ]
      );
    }
  };

  const updateMealGoal = async (count: number) => {
    if (!userProfile) return;
    
    try {
      await UserProfileService.updateBeautyGoals(userProfile.weeklyGoalScore, count);
      setUserProfile({ ...userProfile, dailyMealGoal: count });
      Toast.show({
        type: 'success',
        text1: '完了',
        text2: `1日の食事回数を${count}回に設定しました。`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'エラー',
        text2: '設定の保存に失敗しました',
      });
    }
  };



  const handleSubscribe = (planId: string) => {
    Alert.alert(
      'プレミアムプラン',
      `${planId === 'monthly' ? '月額' : '年額'}プランの購入処理を開始します。\n\n実際のアプリでは、ここでRevenueCatを使用してサブスクリプション処理を行います。`,
      [{ text: 'OK' }]
    );
  };

  if (loading || !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>美容プロフィール</Text>
          <Text style={styles.headerSubtitle}>あなたの美容目標と設定を管理</Text>
        </View>

        {/* Plan Status */}
        {premiumLoading ? (
          <View style={styles.loadingPlanCard}>
            <Text style={styles.loadingPlanText}>プレミアム状態を確認中...</Text>
          </View>
        ) : isFreePlan ? (
          <>
            <TouchableOpacity 
              style={styles.planCard} 
              onPress={() => setShowPremiumModal(true)}
            >
              <LinearGradient
                colors={['#fbbf24', '#f59e0b']}
                style={styles.planGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Crown size={24} color="white" />
                <View style={styles.planInfo}>
                  <Text style={styles.planTitle}>プレミアムプランで</Text>
                  <Text style={styles.planSubtitle}>無制限解析を始めよう</Text>
                </View>
                <ChevronRight size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>

            {/* 機能比較ボタン */}
            <TouchableOpacity 
              style={styles.featureCompareButton}
              onPress={() => router.push('/premium-features' as any)}
            >
              <View style={styles.compareButtonContent}>
                <View style={styles.compareIcon}>
                  <TrendingUp size={20} color="#ec4899" />
                </View>
                <View style={styles.compareTexts}>
                  <Text style={styles.compareTitle}>機能比較を見る</Text>
                  <Text style={styles.compareSubtitle}>無料版 vs プレミアム版の詳細比較</Text>
                </View>
                <ChevronRight size={16} color="#6b7280" />
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.premiumCard}>
            <Crown size={24} color="#f59e0b" />
            <Text style={styles.premiumText}>プレミアムプラン利用中</Text>
            <Text style={styles.premiumDate}>次回更新: 2024/02/15</Text>
          </View>
        )}

        {/* Beauty Stats - Premium Only */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={20} color="#ec4899" />
            <Text style={styles.sectionTitle}>美容統計</Text>
            {isFreePlan && <Crown size={16} color="#f59e0b" />}
          </View>
          
          {premiumLoading ? (
            <View style={styles.loadingStatsContainer}>
              <Text style={styles.loadingStatsText}>統計データを読み込み中...</Text>
            </View>
          ) : isFreePlan ? (
            <TouchableOpacity 
              style={styles.premiumFeature}
              onPress={() => router.push('/premium-reports' as any)}
            >
              <Text style={styles.premiumFeatureText}>
                プレミアムプランで{'\n'}詳細な美容統計を確認
              </Text>
              <Text style={styles.premiumFeatureSubtext}>
                • 週次・月次レポート{'\n'}
                • 美容カテゴリー別分析{'\n'}
                • 栄養バランス分析
              </Text>
              <Text style={styles.previewText}>📊 レポート画面を見る</Text>
              <ChevronRight size={16} color="#6b7280" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.statsGrid}
              onPress={() => router.push('/premium-reports' as any)}
            >
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{premiumStats?.averageScore || 82}</Text>
                <Text style={styles.statLabel}>今月平均スコア</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{premiumStats?.goalAchievement || 75}%</Text>
                <Text style={styles.statLabel}>目標達成率</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{premiumStats?.topCategory || '美肌'}</Text>
                <Text style={styles.statLabel}>最高カテゴリー</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Beauty Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={20} color="#ec4899" />
            <Text style={styles.sectionTitle}>美容目標</Text>
          </View>
          <View style={styles.goalContainer}>
            <TouchableOpacity 
              style={styles.goalItem}
              onPress={() => handleGoalEdit('score')}
            >
              <Text style={styles.goalLabel}>週間目標スコア</Text>
              <View style={styles.goalValueContainer}>
                <Text style={styles.goalValue}>{userProfile.weeklyGoalScore}点以上</Text>
                <ChevronRight size={16} color="#999" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.goalItem}
              onPress={() => handleGoalEdit('meals')}
            >
              <Text style={styles.goalLabel}>1日の食事回数</Text>
              <View style={styles.goalValueContainer}>
                <Text style={styles.goalValue}>{userProfile.dailyMealGoal}回</Text>
                <ChevronRight size={16} color="#999" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Beauty Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heart size={20} color="#ec4899" />
            <Text style={styles.sectionTitle}>美容カテゴリー設定</Text>
          </View>
          <View style={styles.categoriesContainer}>
            {beautyCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  userProfile.beautyCategories.includes(category.id) && styles.categoryChipSelected
                ]}
                onPress={() => toggleCategory(category.id)}
              >
                <Text style={[
                  styles.categoryChipText,
                  userProfile.beautyCategories.includes(category.id) && styles.categoryChipTextSelected
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Beauty Level */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={20} color="#ec4899" />
            <Text style={styles.sectionTitle}>美容スタイル</Text>
          </View>
          {beautyLevels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.levelOption,
                userProfile.beautyLevel === level.id && styles.levelOptionSelected
              ]}
              onPress={() => updateBeautyLevel(level.id as 'beginner' | 'intermediate' | 'advanced')}
            >
              <View style={styles.levelInfo}>
                <Text style={[
                  styles.levelLabel,
                  userProfile.beautyLevel === level.id && styles.levelLabelSelected
                ]}>
                  {level.label}
                </Text>
                <Text style={styles.levelDescription}>{level.description}</Text>
              </View>
              <View style={[
                styles.radioButton,
                userProfile.beautyLevel === level.id && styles.radioButtonSelected
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Settings size={20} color="#ec4899" />
            <Text style={styles.sectionTitle}>設定</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Bell size={20} color="#6b7280" />
            <Text style={styles.settingLabel}>プッシュ通知</Text>
            <Switch
              value={userProfile.notifications.meal}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#f3f4f6', true: '#fce7f3' }}
              thumbColor={userProfile.notifications.meal ? '#ec4899' : '#9ca3af'}
            />
          </View>

          <View style={styles.settingItem}>
            <Clock size={20} color="#6b7280" />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>食事タイミング自動選択</Text>
              <Text style={styles.settingDescription}>
                撮影時刻に基づいて自動で食事タイミングを判定
              </Text>
            </View>
            <Switch
              value={userProfile.autoMealTiming}
              onValueChange={handleAutoMealTimingToggle}
              trackColor={{ false: '#f3f4f6', true: '#fce7f3' }}
              thumbColor={userProfile.autoMealTiming ? '#ec4899' : '#9ca3af'}
            />
          </View>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/privacy-settings')}
          >
            <Shield size={20} color="#6b7280" />
            <Text style={styles.settingLabel}>プライバシー設定</Text>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/help-support')}
          >
            <HelpCircle size={20} color="#6b7280" />
            <Text style={styles.settingLabel}>ヘルプ・サポート</Text>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* 開発者メニュー（開発時のみ表示） */}
          {__DEV__ && (
            <View style={styles.devSection}>
              <Text style={[styles.settingLabel, styles.devSectionTitle]}>🔧 開発者メニュー</Text>
              
              {/* プレミアム状態切り替え */}
              <TouchableOpacity 
                style={[styles.settingItem, styles.devSettingItem]}
                onPress={async () => {
                  try {
                    // 現在の状態を反転
                    const newPremiumState = !actualIsPremium;
                    
                    // user_metadataを更新
                    const { error } = await supabase.auth.updateUser({
                      data: { premium: newPremiumState }
                    });
                    
                    if (error) throw error;
                    
                    // プレミアム状態を更新
                    await refreshPremiumStatus();
                    
                    Toast.show({
                      type: 'success',
                      text1: '開発者設定',
                      text2: `プレミアム状態を${newPremiumState ? 'ON' : 'OFF'}に変更しました`,
                    });
                  } catch (error) {
                    console.error('プレミアム状態切り替えエラー:', error);
                    Toast.show({
                      type: 'error',
                      text1: 'エラー',
                      text2: 'プレミアム状態の切り替えに失敗しました',
                    });
                  }
                }}
              >
                <Crown size={20} color={actualIsPremium ? "#f59e0b" : "#6b7280"} />
                <Text style={[styles.settingLabel, styles.devSettingLabel]}>
                  プレミアム状態切り替え
                </Text>
                <View style={styles.devStatusContainer}>
                  <Text style={[styles.devStatusText, { color: actualIsPremium ? "#f59e0b" : "#6b7280" }]}>
                    {actualIsPremium ? "ON" : "OFF"}
                  </Text>
                </View>
              </TouchableOpacity>
              
              {/* データリセット */}
              <TouchableOpacity 
                style={[styles.settingItem, styles.devSettingItem]}
                onPress={() => router.push('/dev-reset' as any)}
              >
                <Code size={20} color="#f59e0b" />
                <Text style={[styles.settingLabel, styles.devSettingLabel]}>データリセット</Text>
                <ChevronRight size={20} color="#f59e0b" />
              </TouchableOpacity>
              
              {/* プレミアム状態強制更新 */}
              <TouchableOpacity 
                style={[styles.settingItem, styles.devSettingItem]}
                onPress={async () => {
                  try {
                    await refreshPremiumStatus();
                    Toast.show({
                      type: 'success',
                      text1: '開発者設定',
                      text2: 'プレミアム状態を強制更新しました',
                    });
                  } catch (error) {
                    Toast.show({
                      type: 'error',
                      text1: 'エラー',
                      text2: 'プレミアム状態の更新に失敗しました',
                    });
                  }
                }}
              >
                <TrendingUp size={20} color="#f59e0b" />
                <Text style={[styles.settingLabel, styles.devSettingLabel]}>プレミアム状態更新</Text>
                <ChevronRight size={20} color="#f59e0b" />
              </TouchableOpacity>
            </View>
          )}
        </View>



        <View style={styles.footer}>
          <Text style={styles.footerText}>BeautyFood v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Modals */}
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
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    marginTop: 2,
  },
  editButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: 'white',
  },
  planCard: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  planGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  planInfo: {
    flex: 1,
    marginLeft: 16,
  },
  planTitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-SemiBold',
    color: 'white',
  },
  planSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: 'white',
    marginTop: 2,
  },
  premiumCard: {
    backgroundColor: '#fef3c7',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumText: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#92400e',
    marginLeft: 12,
    flex: 1,
  },
  premiumDate: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#92400e',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
    marginLeft: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryChipSelected: {
    backgroundColor: '#fce7f3',
    borderColor: '#ec4899',
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: '#6b7280',
  },
  categoryChipTextSelected: {
    color: '#ec4899',
  },
  levelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  levelOptionSelected: {
    backgroundColor: '#fef7ff',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  levelInfo: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
  },
  levelLabelSelected: {
    color: '#ec4899',
  },
  levelDescription: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  radioButtonSelected: {
    borderColor: '#ec4899',
    backgroundColor: '#ec4899',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Medium',
    color: '#1f2937',
    marginLeft: 12,
    flex: 1,
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#9ca3af',
  },
  premiumFeature: {
    backgroundColor: '#fef7ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3e8ff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumFeatureText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
    marginBottom: 8,
    flex: 1,
  },
  premiumFeatureSubtext: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    lineHeight: 18,
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'NotoSansJP-Bold',
    color: '#ec4899',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    textAlign: 'center',
  },
  goalContainer: {
    gap: 12,
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  goalLabel: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
  },
  goalValue: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
  },
  goalValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
  },
  featureCompareButton: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compareButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  compareIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compareTexts: {
    flex: 1,
  },
  compareTitle: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
    marginBottom: 2,
  },
  compareSubtitle: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
  },
  previewText: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#ec4899',
    marginTop: 8,
  },
  devSettingItem: {
    backgroundColor: '#fef3c7',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  devSettingLabel: {
    color: '#92400e',
    fontFamily: 'NotoSansJP-SemiBold',
  },
  loadingPlanCard: {
    backgroundColor: '#f3f4f6',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingPlanText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
  },
  loadingStatsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingStatsText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
  },
  devSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  devSectionTitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Bold',
    color: '#f59e0b',
    marginBottom: 16,
    textAlign: 'center',
  },
  devStatusContainer: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  devStatusText: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Bold',
  },
});
