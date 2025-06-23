import React, { useState } from 'react';
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
import { User, Crown, Settings, Bell, Heart, Shield, CircleHelp as HelpCircle, LogOut, ChevronRight, Sparkles, Target } from 'lucide-react-native';
import PremiumModal from '@/components/PremiumModal';
import EditNameModal from '@/components/EditNameModal';

const beautyCategories = [
  { id: 'skin', label: '美肌', selected: true },
  { id: 'antiaging', label: 'アンチエイジング', selected: true },
  { id: 'diet', label: 'ダイエット', selected: false },
  { id: 'hair', label: '美髪', selected: true },
  { id: 'nail', label: '美爪', selected: false },
];

const beautyLevels = [
  { id: 'beginner', label: '美容初心者', description: '基本的なアドバイスを重視' },
  { id: 'intermediate', label: '美容好き', description: 'バランスの取れたアドバイス' },
  { id: 'advanced', label: '美容マニア', description: '詳細で専門的なアドバイス' },
];

export default function ProfileScreen() {
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
  const [selectedBeautyLevel, setSelectedBeautyLevel] = useState('intermediate');
  const [selectedCategories, setSelectedCategories] = useState(beautyCategories);
  const [userName, setUserName] = useState('田中 美花');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const isFreePlan = true;

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, selected: !cat.selected } : cat
      )
    );
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

  const handleNameSave = (newName: string) => {
    setUserName(newName);
    Alert.alert('完了', '名前を更新しました。');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <User size={32} color="#ec4899" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userEmail}>mika.tanaka@example.com</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setShowEditNameModal(true)}
          >
            <Text style={styles.editButtonText}>編集</Text>
          </TouchableOpacity>
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

        {/* Beauty Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heart size={20} color="#ec4899" />
            <Text style={styles.sectionTitle}>美容カテゴリー設定</Text>
          </View>
          <View style={styles.categoriesContainer}>
            {selectedCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  category.selected && styles.categoryChipSelected
                ]}
                onPress={() => toggleCategory(category.id)}
              >
                <Text style={[
                  styles.categoryChipText,
                  category.selected && styles.categoryChipTextSelected
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
            <Text style={styles.sectionTitle}>美意識レベル</Text>
          </View>
          {beautyLevels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.levelOption,
                selectedBeautyLevel === level.id && styles.levelOptionSelected
              ]}
              onPress={() => setSelectedBeautyLevel(level.id)}
            >
              <View style={styles.levelInfo}>
                <Text style={[
                  styles.levelLabel,
                  selectedBeautyLevel === level.id && styles.levelLabelSelected
                ]}>
                  {level.label}
                </Text>
                <Text style={styles.levelDescription}>{level.description}</Text>
              </View>
              <View style={[
                styles.radioButton,
                selectedBeautyLevel === level.id && styles.radioButtonSelected
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
              value={isNotificationEnabled}
              onValueChange={setIsNotificationEnabled}
              trackColor={{ false: '#f3f4f6', true: '#fce7f3' }}
              thumbColor={isNotificationEnabled ? '#ec4899' : '#9ca3af'}
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

      <EditNameModal
        visible={showEditNameModal}
        currentName={userName}
        onClose={() => setShowEditNameModal(false)}
        onSave={handleNameSave}
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
    paddingVertical: 20,
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
});