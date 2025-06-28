import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Apple, Shield, Lock, Eye } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function AppleSignInScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithApple, completeOnboarding } = useAuth();

  const handleBack = () => {
    router.back();
  };

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithApple();
      await completeOnboarding();
      
      // サインイン成功後、メイン画面へ
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Apple Sign In Error:', error);
      Alert.alert(
        'サインインエラー',
        'Apple IDでのサインインに失敗しました。もう一度お試しください。',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };




  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFF', '#FFB347', '#FF6B9D']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ArrowLeft size={24} color="#2D1B69" />
            </TouchableOpacity>
            <Text style={styles.title}>アカウント作成</Text>
            <View style={styles.placeholder} />
          </View>

          {/* プログレスバー */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
            <Text style={styles.progressText}>3 / 3</Text>
          </View>

          {/* メインコンテンツ */}
          <View style={styles.mainContent}>
            {/* アイコン */}
            <View style={styles.iconContainer}>
              <Apple size={60} color="#2D1B69" />
            </View>

            {/* タイトル */}
            <Text style={styles.mainTitle}>
              Apple IDで{'\n'}
              簡単にサインイン
            </Text>

            {/* 説明 */}
            <Text style={styles.description}>
              データを安全に保存し、{'\n'}
              どこからでもアクセスできます
            </Text>

            {/* プライバシー機能 */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Shield size={20} color="#FF6B9D" />
                <Text style={styles.featureText}>プライバシー保護</Text>
              </View>
              <View style={styles.featureItem}>
                <Lock size={20} color="#FF6B9D" />
                <Text style={styles.featureText}>データ暗号化</Text>
              </View>
              <View style={styles.featureItem}>
                <Eye size={20} color="#FF6B9D" />
                <Text style={styles.featureText}>広告なし</Text>
              </View>
            </View>

            {/* Apple サインインボタン */}
            <TouchableOpacity
              style={[styles.appleButton, isLoading && styles.appleButtonDisabled]}
              onPress={handleAppleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Apple size={20} color="#FFF" />
                  <Text style={styles.appleButtonText}>Apple IDでサインイン</Text>
                </>
              )}
            </TouchableOpacity>




            {/* プライバシーポリシー */}
            <Text style={styles.privacyText}>
              サインインすることで、
              <Text style={styles.privacyLink}>利用規約</Text>
              および
              <Text style={styles.privacyLink}>プライバシーポリシー</Text>
              に同意したものとみなされます
            </Text>
          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
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
  progressContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B9D',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: '#666',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: 'NotoSansJP-Bold',
    color: '#2D1B69',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Medium',
    color: '#666',
    marginTop: 8,
  },
  appleButton: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    width: '100%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  appleButtonDisabled: {
    backgroundColor: '#666',
    shadowOpacity: 0,
    elevation: 0,
  },
  appleButtonText: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Bold',
    color: '#FFF',
    marginLeft: 8,
  },
  privacyText: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  privacyLink: {
    color: '#FF6B9D',
    textDecorationLine: 'underline',
  },

}); 
export default AppleSignInScreen;
