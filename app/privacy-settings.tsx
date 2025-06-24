import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Shield, Eye, Database, Bell, Share2, Trash2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrivacySettings {
  dataCollection: boolean;
  analyticsTracking: boolean;
  crashReporting: boolean;
}

export default function PrivacySettingsScreen() {
  const [settings, setSettings] = useState<PrivacySettings>({
    dataCollection: true,
    analyticsTracking: true,
    crashReporting: true,
  });

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('privacy_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('プライバシー設定の読み込みエラー:', error);
    }
  };

  const savePrivacySettings = async (newSettings: PrivacySettings) => {
    try {
      await AsyncStorage.setItem('privacy_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('プライバシー設定の保存エラー:', error);
      Alert.alert('エラー', '設定の保存に失敗しました');
    }
  };

  const toggleSetting = (key: keyof PrivacySettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    savePrivacySettings(newSettings);
  };

  const handleDataDeletion = () => {
    Alert.alert(
      'データ削除の確認',
      'すべての個人データを削除しますか？この操作は取り消せません。\n\n削除されるデータ:\n• 食事記録\n• 解析履歴\n• プロフィール情報\n• 設定情報',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '削除完了',
              'データ削除リクエストを受け付けました。24時間以内に処理されます。',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'プライバシーポリシー',
      'BeautyFood株式会社のプライバシーポリシーをブラウザで開きますか？',
      [
        { text: 'キャンセル' },
        { text: '開く', onPress: () => {
          // 実際のアプリでは外部ブラウザでプライバシーポリシーを開く
          Alert.alert('情報', 'プライバシーポリシーページを開きました（デモ）');
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>プライバシー設定</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* データ収集 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={20} color="#ec4899" />
            <Text style={styles.sectionTitle}>データ収集</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>基本データ収集</Text>
              <Text style={styles.settingDescription}>
                アプリの基本機能のために必要なデータの収集
              </Text>
            </View>
            <Switch
              value={settings.dataCollection}
              onValueChange={() => toggleSetting('dataCollection')}
              trackColor={{ false: '#f3f4f6', true: '#fce7f3' }}
              thumbColor={settings.dataCollection ? '#ec4899' : '#9ca3af'}
            />
          </View>
        </View>

        {/* 分析・改善 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eye size={20} color="#ec4899" />
            <Text style={styles.sectionTitle}>分析・改善</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>使用状況分析</Text>
              <Text style={styles.settingDescription}>
                アプリの改善のための匿名使用データの収集
              </Text>
            </View>
            <Switch
              value={settings.analyticsTracking}
              onValueChange={() => toggleSetting('analyticsTracking')}
              trackColor={{ false: '#f3f4f6', true: '#fce7f3' }}
              thumbColor={settings.analyticsTracking ? '#ec4899' : '#9ca3af'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>クラッシュレポート</Text>
              <Text style={styles.settingDescription}>
                アプリの安定性向上のためのエラー報告
              </Text>
            </View>
            <Switch
              value={settings.crashReporting}
              onValueChange={() => toggleSetting('crashReporting')}
              trackColor={{ false: '#f3f4f6', true: '#fce7f3' }}
              thumbColor={settings.crashReporting ? '#ec4899' : '#9ca3af'}
            />
          </View>
        </View>

        {/* データ管理 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trash2 size={20} color="#dc2626" />
            <Text style={styles.sectionTitle}>データ管理</Text>
          </View>
          
          <TouchableOpacity style={styles.actionItem} onPress={handleDataDeletion}>
            <Text style={styles.actionLabel}>すべてのデータを削除</Text>
            <Text style={styles.actionDescription}>
              アカウントとすべての個人データを完全に削除します
            </Text>
          </TouchableOpacity>
        </View>

        {/* ポリシー */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.policyItem} onPress={handlePrivacyPolicy}>
            <Shield size={20} color="#6b7280" />
            <Text style={styles.policyLabel}>プライバシーポリシーを読む</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            設定は即座に反映されます。{'\n'}
            詳細については、プライバシーポリシーをご確認ください。
          </Text>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
    marginLeft: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Medium',
    color: '#1f2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    lineHeight: 20,
  },
  actionItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionLabel: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Medium',
    color: '#dc2626',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    lineHeight: 20,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  policyLabel: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Medium',
    color: '#1f2937',
    marginLeft: 12,
  },
  footer: {
    padding: 20,
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 