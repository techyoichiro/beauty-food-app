import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  NotoSansJP_400Regular,
  NotoSansJP_500Medium,
  NotoSansJP_700Bold,
} from '@expo-google-fonts/noto-sans-jp';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import RequireSignIn from '@/components/RequireSignIn';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';
import { View, Text } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    'NotoSansJP-Regular': NotoSansJP_400Regular,
    'NotoSansJP-Medium': NotoSansJP_500Medium,
    'NotoSansJP-Bold': NotoSansJP_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <AppContent colorScheme={colorScheme} />
    </AuthProvider>
  );
}

// 認証状態に基づいてコンテンツを表示するコンポーネント
function AppContent({ colorScheme }: { colorScheme: 'light' | 'dark' | null }) {
  const { requiresSignIn } = useAuth();

  if (requiresSignIn) {
    return <RequireSignIn />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding/welcome" />
          <Stack.Screen name="onboarding/beauty-categories" />
          <Stack.Screen name="onboarding/beauty-level" />
          <Stack.Screen name="onboarding/apple-signin" />
          <Stack.Screen name="analysis-result" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
        <Toast 
          config={{
            success: (props) => (
              <View style={{
                height: 60,
                width: '90%',
                backgroundColor: '#4CAF50',
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>✅</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                    {props.text1}
                  </Text>
                  <Text style={{ color: 'white', fontSize: 14, opacity: 0.9 }}>
                    {props.text2}
                  </Text>
                </View>
              </View>
            ),
            error: (props) => (
              <View style={{
                height: 60,
                width: '90%',
                backgroundColor: '#F44336',
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>❌</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                    {props.text1}
                  </Text>
                  <Text style={{ color: 'white', fontSize: 14, opacity: 0.9 }}>
                    {props.text2}
                  </Text>
                </View>
              </View>
            ),
            info: (props) => (
              <View style={{
                height: 60,
                width: '90%',
                backgroundColor: '#2196F3',
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>ℹ️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                    {props.text1}
                  </Text>
                  <Text style={{ color: 'white', fontSize: 14, opacity: 0.9 }}>
                    {props.text2}
                  </Text>
                </View>
              </View>
            ),
          }}
          autoHide={true}
          visibilityTime={2000}
          position="top"
          topOffset={60}
        />
      </>
    </ThemeProvider>
  );
}
