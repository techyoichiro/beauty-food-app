import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Settings, Bell, Heart, Shield, CircleHelp as HelpCircle, LogOut, ChevronRight, Sparkles, Target } from 'lucide-react-native';
import PremiumModal from '@/components/PremiumModal';
import { UserProfileService, BEAUTY_CATEGORIES, BEAUTY_LEVELS, ExtendedUserProfile } from '../../lib/meal-service';

const beautyCategories = [
  { id: 'skin', label: '美肌', selected: true },
  { id: 'antiaging', label: 'アンチエイジング', selected: true },
  { id: 'diet', label: 'ダイエット', selected: false },
  { id: 'hair', label: '美髪', selected: true },
  { id: 'nail', label: '美爪', selected: false },
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
  const isFreePlan = true;

  useEffect(() => {
    loadUserProfile();
  }, []);

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

  const updateBeautyCategories = async (categories: string[]) => {
    try {
      await UserProfileService.updateBeautyCategories(categories);
      if (userProfile) {
        setUserProfile({ ...userProfile, beautyCategories: categories });
      }
      Alert.alert('完了', '美容目標を更新しました');
    } catch (error) {
      Alert.alert('エラー', '設定の保存に失敗しました');
    }
  };

  const updateBeautyLevel = async (level: 'beginner' | 'intermediate' | 'advanced') => {
    try {
      await UserProfileService.updateBeautyLevel(level);
      if (userProfile) {
        setUserProfile({ ...userProfile, beautyLevel: level });
      }
      Alert.alert('完了', '美容スタイルを更新しました');
    } catch (error) {
      Alert.alert('エラー', '設定の保存に失敗しました');
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (!userProfile) return;
    
    const currentCategories = userProfile.beautyCategories;
    let newCategories: string[];
    
    if (currentCategories.includes(categoryId)) {
      // 最低1つは選択されている必要がある
      if (currentCategories.length === 1) {
        Alert.alert('注意', '最低1つの美容目標を選択してください');
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
      Alert.alert('エラー', '通知設定の更新に失敗しました');
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
                  Alert.alert('完了', `週間目標スコアを${score}点に設定しました。`);
                } catch (error) {
                  Alert.alert('エラー', '設定の保存に失敗しました');
                }
              } else {
                Alert.alert('エラー', '60点から100点の間で入力してください。');
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
      Alert.alert('完了', `1日の食事回数を${count}回に設定しました。`);
    } catch (error) {
      Alert.alert('エラー', '設定の保存に失敗しました');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'ログアウト', style: 'destructive', onPress: () => {} },
      ]
    );
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
        {isFreePlan ? (
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
          
          {isFreePlan ? (
            <TouchableOpacity 
              style={styles.premiumFeature}
              onPress={() => setShowPremiumModal(true)}
            >
              <Text style={styles.premiumFeatureText}>
                プレミアムプランで詳細な美容統計を確認
              </Text>
              <Text style={styles.premiumFeatureSubtext}>
                • 月間平均スコア推移{'\n'}
                • 美容カテゴリー別分析{'\n'}
                • 目標達成率
              </Text>
              <ChevronRight size={16} color="#6b7280" />
            </TouchableOpacity>
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>82</Text>
                <Text style={styles.statLabel}>今月平均スコア</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>75%</Text>
                <Text style={styles.statLabel}>目標達成率</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>美肌</Text>
                <Text style={styles.statLabel}>最高カテゴリー</Text>
              </View>
            </View>
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

          <TouchableOpacity style={styles.settingItem}>
            <Shield size={20} color="#6b7280" />
            <Text style={styles.settingLabel}>プライバシー設定</Text>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <HelpCircle size={20} color="#6b7280" />
            <Text style={styles.settingLabel}>ヘルプ・サポート</Text>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#dc2626" />
          <Text style={styles.logoutText}>ログアウト</Text>
        </TouchableOpacity>

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
    flex: 1,
    fontSize: 16,
    fontFamily: 'NotoSansJP-Medium',
    color: '#1f2937',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
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
  logoutText: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#dc2626',
    marginLeft: 8,
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
});