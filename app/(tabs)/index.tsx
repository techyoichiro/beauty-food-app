import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const { session, isFirstLaunch, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isFirstLaunch) {
        router.replace('/onboarding/welcome');
      }
      // スキップした場合はsessionがnullでもホーム画面を表示
      // 初回起動でない場合のみサインイン画面へリダイレクト
    }
  }, [session, isFirstLaunch, loading]);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  // ホーム画面
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Beauty Food</Text>
      <Text style={styles.subtitle}>
        {session 
          ? '今日も美容食事を記録しましょう！' 
          : 'ゲストモードで利用中\n写真を撮って美容食事を記録しましょう！'
        }
      </Text>
      
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>写真を撮る</Text>
      </TouchableOpacity>

      {!session && (
        <>
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => router.push('/onboarding/apple-signin' as any)}
          >
            <Text style={styles.signInButtonText}>Apple IDでサインイン</Text>
          </TouchableOpacity>
          

        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Regular',
    color: '#666',
    marginTop: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#FF6B9D',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#FF6B9D',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Bold',
    color: '#FFF',
  },
  signInButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6B9D',
  },
  signInButtonText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: '#FF6B9D',
  },

});