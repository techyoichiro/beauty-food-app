import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Sparkles, Camera, Brain } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    router.push('/onboarding/beauty-categories');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FF6B9D', '#FFB347', '#FFF']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>Beauty Food</Text>
            <Text style={styles.subtitle}>
              AI が料理を解析して{'\n'}あなたの美容をサポート
            </Text>
          </View>

          {/* 特徴説明 */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <View style={styles.iconContainer}>
                <Camera size={32} color="#FF6B9D" />
              </View>
              <Text style={styles.featureTitle}>写真で簡単記録</Text>
              <Text style={styles.featureDescription}>
                料理を撮影するだけで{'\n'}栄養素を自動解析
              </Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.iconContainer}>
                <Brain size={32} color="#FF6B9D" />
              </View>
              <Text style={styles.featureTitle}>AIアドバイス</Text>
              <Text style={styles.featureDescription}>
                美容目的に合わせた{'\n'}パーソナライズされた提案
              </Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.iconContainer}>
                <Sparkles size={32} color="#FF6B9D" />
              </View>
              <Text style={styles.featureTitle}>美容効果追跡</Text>
              <Text style={styles.featureDescription}>
                日々の食事で{'\n'}理想の美しさを実現
              </Text>
            </View>
          </View>

          {/* 開始ボタン */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.startButton} onPress={handleGetStarted}>
              <Text style={styles.startButtonText}>始める</Text>
            </TouchableOpacity>
            
            <Text style={styles.privacyText}>
              続行することで、利用規約とプライバシーポリシーに同意したものとみなされます
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Poppins-Bold',
    color: '#2D1B69',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-Medium',
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 40,
  },
  feature: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-Bold',
    color: '#2D1B69',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#FF6B9D',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#FF6B9D',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-Bold',
    color: '#FFF',
  },
  privacyText: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
}); 