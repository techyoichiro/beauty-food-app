import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from '@/lib/supabase';
import revenueCatService, { PremiumPlan, PurchaseResult } from '@/lib/revenue-cat';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isFirstLaunch: boolean;
  isPremium: boolean;
  premiumLoading: boolean;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  // RevenueCat関連の新しいメソッド
  getAvailablePlans: () => Promise<PremiumPlan[]>;
  purchasePremium: (plan: PremiumPlan) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<PurchaseResult>;
  refreshPremiumStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumLoading, setPremiumLoading] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // 初回起動チェック
      await checkFirstLaunch();
      
      // RevenueCatの初期化
      await revenueCatService.initialize();
      
      // セッション取得
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      // ユーザーがログインしている場合、RevenueCatにも登録
      if (session?.user) {
        await revenueCatService.setUserId(session.user.id);
      }
      
      // プレミアム状態を取得
      await refreshPremiumStatus();
      
      setLoading(false);
    } catch (error) {
      console.error('App initialization failed:', error);
      setLoading(false);
    }

    // セッション変更の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // ログイン時にRevenueCatユーザーを設定
        if (session?.user) {
          try {
            await revenueCatService.setUserId(session.user.id);
            await refreshPremiumStatus();
          } catch (error) {
            console.error('Failed to set RevenueCat user:', error);
          }
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  };

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      setIsFirstLaunch(!hasLaunched);
    } catch (error) {
      console.error('Error checking first launch:', error);
    }
  };

  const signInWithApple = async () => {
    try {
      // Apple Developer Program待ちのため、現在はスタブ実装
      if (__DEV__) {
        console.log('Apple Sign In - スタブ実装（開発中）');
        Alert.alert(
          'Apple Sign-In', 
          'Apple Developer Programのアカウント作成完了後に実装予定です。\n現在はゲストモードでご利用いただけます。',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // 本番環境での実装 (expo-apple-authentication使用)
      // const AppleAuthentication = await import('expo-apple-authentication');
      // 
      // const credential = await AppleAuthentication.signInAsync({
      //   requestedScopes: [
      //     AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      //     AppleAuthentication.AppleAuthenticationScope.EMAIL,
      //   ],
      // });
      // 
      // if (credential.identityToken) {
      //   const { data, error } = await supabase.auth.signInWithIdToken({
      //     provider: 'apple',
      //     token: credential.identityToken,
      //   });
      //   
      //   if (error) throw error;
      // }
      
      console.log('Apple Sign In - 本番実装待ち');
    } catch (error) {
      console.error('Apple Sign In Error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign Out Error:', error);
      throw error;
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasLaunched', 'true');
      setIsFirstLaunch(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const upgradeToPremium = async () => {
    try {
      // プレミアムアップグレードの実装（後で詳細実装）
      console.log('Upgrade to Premium - 実装予定');
    } catch (error) {
      console.error('Upgrade to Premium Error:', error);
      throw error;
    }
  };

  // RevenueCat関連のメソッド実装
  const refreshPremiumStatus = async (): Promise<void> => {
    try {
      setPremiumLoading(true);
      const premiumStatus = await revenueCatService.isPremium();
      setIsPremium(premiumStatus);
      console.log('Premium status updated:', premiumStatus);
    } catch (error) {
      console.error('Failed to refresh premium status:', error);
    } finally {
      setPremiumLoading(false);
    }
  };

  const getAvailablePlans = async (): Promise<PremiumPlan[]> => {
    try {
      return await revenueCatService.getAvailablePlans();
    } catch (error) {
      console.error('Failed to get available plans:', error);
      return [];
    }
  };

  const purchasePremium = async (plan: PremiumPlan): Promise<PurchaseResult> => {
    try {
      setPremiumLoading(true);
      const result = await revenueCatService.purchasePremium(plan.rcPackage);
      
      if (result.success) {
        // 購入成功時にプレミアム状態を更新
        await refreshPremiumStatus();
      }
      
      return result;
    } catch (error: any) {
      console.error('Purchase failed:', error);
      return {
        success: false,
        error
      };
    } finally {
      setPremiumLoading(false);
    }
  };

  const restorePurchases = async (): Promise<PurchaseResult> => {
    try {
      setPremiumLoading(true);
      const result = await revenueCatService.restorePurchases();
      
      if (result.success) {
        // 復元成功時にプレミアム状態を更新
        await refreshPremiumStatus();
      }
      
      return result;
    } catch (error: any) {
      console.error('Restore failed:', error);
      return {
        success: false,
        error
      };
    } finally {
      setPremiumLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading,
    isFirstLaunch,
    isPremium,
    premiumLoading,
    signInWithApple,
    signOut,
    completeOnboarding,
    upgradeToPremium,
    // RevenueCat関連メソッド
    getAvailablePlans,
    purchasePremium,
    restorePurchases,
    refreshPremiumStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 