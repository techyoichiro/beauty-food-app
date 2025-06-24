import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isFirstLaunch: boolean;
  isPremium: boolean;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    // 初回起動チェック
    checkFirstLaunch();
    
    // セッション取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // セッション変更の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
      // Apple認証の実装（後で詳細実装）
      console.log('Apple Sign In - 実装予定');
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

  const value = {
    session,
    user,
    loading,
    isFirstLaunch,
    isPremium,
    signInWithApple,
    signOut,
    completeOnboarding,
    upgradeToPremium,
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