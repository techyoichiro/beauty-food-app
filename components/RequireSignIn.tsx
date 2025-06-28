import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Apple, Shield, Star, Zap } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

export default function RequireSignIn() {
  const { signInWithApple, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // アプリ起動時に自動的にサインインダイアログを表示
  useEffect(() => {
    const autoPromptSignIn = async () => {
      // 少し遅延してからサインインを促す
      setTimeout(() => {
        handleSignIn();
      }, 1000);
    };

    autoPromptSignIn();
  }, []);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithApple();
    } catch (error) {
      console.error('Auto Sign In Error:', error);
      // エラーでもユーザーに再度選択肢を提供
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleManualSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithApple();
    } catch (error) {
      console.error('Manual Sign In Error:', error);
      Alert.alert(
        'サインインエラー',
        'Apple IDでのサインインに失敗しました。もう一度お試しください。',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#FFB347', '#FF6B9D', '#8A2BE2']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>アプリを準備中...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FFB347', '#FF6B9D', '#8A2BE2']} style={styles.gradient}>
        <View style={styles.content}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.appTitle}>BeautyFood</Text>
            <Text style={styles.subtitle}>美容効果のある食事管理アプリ</Text>
          </View>

          {/* メインメッセージ */}
          <View style={styles.messageContainer}>
            <Text style={styles.mainMessage}>
              BeautyFoodをご利用いただく{'\n'}にはサインインが必要です
            </Text>
            <Text style={styles.description}>
              Apple IDで安全にサインインして、{'\n'}あなた専用の美容食事アドバイスを{'\n'}お楽しみください
            </Text>
          </View>

          {/* 機能紹介 */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Zap size={24} color="#FFFFFF" />
              <Text style={styles.featureText}>AI食材解析</Text>
            </View>
            <View style={styles.feature}>
              <Star size={24} color="#FFFFFF" />
              <Text style={styles.featureText}>美容スコア算出</Text>
            </View>
            <View style={styles.feature}>
              <Shield size={24} color="#FFFFFF" />
              <Text style={styles.featureText}>プライベート保存</Text>
            </View>
          </View>

          {/* サインインボタン */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.signInButton, isSigningIn && styles.signInButtonDisabled]}
              onPress={handleManualSignIn}
              disabled={isSigningIn}
            >
              {isSigningIn ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <Apple size={24} color="#000000" />
                  <Text style={styles.signInButtonText}>Apple IDでサインイン</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.privacyText}>
              サインインすることで、利用規約とプライバシーポリシーに同意したものとみなされます
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'NotoSansJP-Medium',
    marginTop: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  appTitle: {
    fontSize: 36,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
  },
  messageContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  mainMessage: {
    fontSize: 24,
    fontFamily: 'NotoSansJP-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginVertical: 32,
  },
  feature: {
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  signInButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-Bold',
    color: '#000000',
    marginLeft: 12,
  },
  privacyText: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 40,
    opacity: 0.8,
    lineHeight: 18,
  },
});