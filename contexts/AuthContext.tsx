import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
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
  isSignedIn: boolean;
  requiresSignIn: boolean;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  // デバッグ用
  createUserRecord: () => Promise<void>;
  resetPremiumStatus: () => Promise<void>;
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
  
  // サインイン状態の管理
  const isSignedIn = !!user;
  
  // ゲストモードが許可されているかどうかをチェック
  const allowGuestMode = process.env.EXPO_PUBLIC_ALLOW_GUEST_MODE === 'true';
  
  // サインインが必要かどうか（ゲストモード許可時はfalse）
  const requiresSignIn = !loading && !isSignedIn && !allowGuestMode;
  
  console.log('🔐 ゲストモード制御:', {
    allowGuestMode,
    isSignedIn,
    requiresSignIn,
    loading
  });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // 初回起動チェック
      await checkFirstLaunch();
      
      // Supabase接続テスト
      await testSupabaseConnection();
      
      // RevenueCatの初期化
      await revenueCatService.initialize();
      
      // セッション取得
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔑 セッション取得結果:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id?.substring(0, 8) + '...' || 'なし'
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // ユーザーがログインしている場合の処理
      if (session?.user) {
        console.log('🔄 既存セッションユーザーのレコード確認開始:', session.user.id);
        
        try {
          // ユーザーレコードを確認・作成
          await ensureUserRecord(session.user);
          console.log('✅ 既存ユーザーレコード確認完了');
          
          // RevenueCatにも登録
          await revenueCatService.setUserId(session.user.id);
        } catch (userRecordError) {
          console.error('❌ 既存ユーザーレコード処理エラー:', userRecordError);
          // ユーザーレコード作成に失敗しても、アプリの初期化は継続
        }
        
        // プレミアム状態を取得（ログインユーザーのみ）
        console.log('🔄 初期化時のプレミアム状態確認開始');
        await refreshPremiumStatus();
        console.log('✅ 初期化時のプレミアム状態確認完了');
      } else {
        console.log('👤 未ログインユーザー: プレミアム状態をfalseに設定');
        setIsPremium(false);
      }
      
      console.log('🏁 アプリ初期化完了');
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
        
        // ログイン時の処理
        if (session?.user) {
          try {
            // ユーザーレコードを確認・作成
            await ensureUserRecord(session.user);
            
            // RevenueCatユーザーを設定
            await revenueCatService.setUserId(session.user.id);
            await refreshPremiumStatus();
          } catch (error) {
            console.error('Failed to initialize user:', error);
          }
        } else {
          // ログアウト時はプレミアム状態をfalseに設定
          console.log('👤 ログアウト: プレミアム状態をfalseに設定');
          setIsPremium(false);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  };

  const testSupabaseConnection = async () => {
    try {
      console.log('🔍 Supabase接続テスト開始');
      
      // 環境変数の確認
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log('📋 環境変数確認:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseAnonKey: !!supabaseAnonKey,
        supabaseUrlValid: supabaseUrl?.includes('supabase.co'),
        supabaseUrl: supabaseUrl || '未設定',
        anonKeyLength: supabaseAnonKey?.length || 0,
        anonKeyPrefix: supabaseAnonKey?.substring(0, 20) + '...' || '未設定'
      });
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('❌ Supabase環境変数が設定されていません');
      }
      
      if (!supabaseUrl.includes('supabase.co')) {
        throw new Error('❌ Supabase URLの形式が正しくありません');
      }
      
      if (supabaseAnonKey.length < 100) {
        throw new Error('❌ Supabase Anon Keyの形式が正しくありません');
      }
      
      // 実際にSupabaseに接続テスト
      console.log('🌐 Supabaseサーバーへの接続テスト...');
      
      // 匿名セッションの取得を試行（接続テスト）
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Supabase接続エラー:', error);
        throw new Error(`Supabase接続失敗: ${error.message}`);
      }
      
      console.log('✅ Supabase接続成功!', {
        hasSession: !!data.session,
        sessionUser: data.session?.user?.id || 'なし'
      });
      
      // Apple認証プロバイダーの設定確認（間接的）
      try {
        console.log('🍎 Apple認証プロバイダー設定確認...');
        
        // 無効なトークンでテスト（設定の存在確認のため）
        const testResult = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: 'test_invalid_token_for_config_check'
        });
        
        // ここに到達することはないが、エラーの種類で設定状況を判断
      } catch (testError: any) {
        console.log('🍎 Apple認証プロバイダーテスト結果:', {
          errorMessage: testError.message,
          errorStatus: testError.status
        });
        
        if (testError.message?.includes('Invalid API key')) {
          console.warn('⚠️ Apple認証プロバイダーが設定されていない可能性があります');
        } else if (testError.message?.includes('Invalid JWT') || testError.message?.includes('token')) {
          console.log('✅ Apple認証プロバイダーは設定済み（無効トークンエラーは正常）');
        }
      }
      
    } catch (error: any) {
      console.error('❌ Supabase接続テスト失敗:', error);
      // 接続テストの失敗はアプリの初期化を止めない
    }
  };

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      setIsFirstLaunch(!hasLaunched);
    } catch (error) {
      console.error('Error checking first launch:', error);
    }
  };

  // ユーザーレコードを作成または確認する関数
  const ensureUserRecord = async (user: User) => {
    try {
      console.log('👤 ユーザーレコード確認開始:', user.id);
      
      // 既存のユーザーレコードを確認
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id, auth_user_id, display_name, created_at')
        .eq('auth_user_id', user.id)
        .single();
      
      if (existingUser) {
        console.log('✅ 既存ユーザーレコードを確認:', existingUser.id);
        return existingUser;
      }
      
      // selectErrorを確認（レコードが存在しない場合は正常）
      if (selectError && selectError.code !== 'PGRST116') {
        console.error('❌ ユーザーレコード検索エラー:', selectError);
        throw new Error(`ユーザーレコードの検索に失敗しました: ${selectError.message}`);
      }
      
      // ユーザーレコードが存在しない場合は作成
      console.log('🆕 新規ユーザーレコード作成中...');
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          auth_user_id: user.id,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'ユーザー',
          beauty_level: 'beginner',
          seasonal_setting: 'spring',
          health_condition: 'normal',
          is_premium: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ ユーザーレコード作成エラー:', insertError);
        throw new Error(`ユーザーレコードの作成に失敗しました: ${insertError.message}`);
      }
      
      console.log('✅ 新規ユーザーレコード作成完了:', newUser.id);
      return newUser;
      
    } catch (error) {
      console.error('ユーザーレコード確認/作成エラー:', error);
      throw error;
    }
  };

  const signInWithApple = async () => {
    try {
      console.log('🍎 Apple Sign In 開始');
      
      // 環境変数の詳細検証
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log('📋 環境変数詳細確認:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseAnonKey: !!supabaseAnonKey,
        supabaseUrl: supabaseUrl || '❌ 未設定',
        supabaseUrlValid: supabaseUrl?.includes('supabase.co'),
        anonKeyLength: supabaseAnonKey?.length || 0,
        anonKeyPrefix: supabaseAnonKey?.substring(0, 30) + '...' || '❌ 未設定',
        anonKeyValid: supabaseAnonKey?.startsWith('eyJ') && supabaseAnonKey.length > 100
      });
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('❌ Supabase環境変数が設定されていません。.envファイルを確認してください。');
      }
      
      // expo-apple-authenticationを使用した実装
      const AppleAuthentication = await import('expo-apple-authentication');
      
      // Apple Sign-Inが利用可能かチェック
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      
      if (!isAvailable) {
        throw new Error('❌ Apple Sign-Inはこのデバイスで利用できません。iOS 13以降が必要です。');
      }
      
      // Apple Sign-In実行
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      if (!credential.identityToken) {
        throw new Error('Apple認証でIdentity Tokenが取得できませんでした。');
      }
        
      // Supabaseでサインイン

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
        
        if (error) {
          console.error('❌ Supabase Apple Sign-In Error:', {
            message: error.message,
            status: error.status,
            code: error.code,
            name: error.name,
            cause: error.cause,
            details: error
          });
          
          // より詳細なエラー分析
          let errorAnalysis = '🔍 エラー分析:\n';
          
          if (error.status === 400) {
            errorAnalysis += '• HTTP 400: リクエストが無効です\n';
            if (error.message?.includes('Invalid JWT')) {
              errorAnalysis += '• Apple Identity Tokenが無効または期限切れです\n';
              errorAnalysis += '• Apple Developer ConsoleのServices ID設定を確認してください\n';
            }
            if (error.message?.includes('Invalid API key')) {
              errorAnalysis += '• Supabase側のApple認証プロバイダー設定が不完全です\n';
              errorAnalysis += '• Services ID、Secret Key、Authorized Client IDsを再確認してください\n';
            }
          } else if (error.status === 401) {
            errorAnalysis += '• HTTP 401: 認証に失敗しました\n';
            errorAnalysis += '• Apple Developer ConsoleとSupabaseの設定の不一致が考えられます\n';
          } else if (error.status === 422) {
            errorAnalysis += '• HTTP 422: データの形式が正しくありません\n';
            errorAnalysis += '• Identity Tokenの形式に問題があります\n';
          }
          
          console.error(errorAnalysis);
          
          // ユーザー向けエラーメッセージ
          let userMessage = 'Apple認証に失敗しました。\n\n';
          
          if (error.message?.includes('Invalid API key')) {
            userMessage += '設定の問題です。以下を確認してください：\n';
            userMessage += '1. Apple Developer ConsoleでServices ID「com.aitech.beautyfood.signin」が作成済みか\n';
            userMessage += '2. SupabaseでApple認証プロバイダーが正しく設定されているか\n';
            userMessage += '3. Client Secretが最新のものか（1時間で期限切れ）\n\n';
            userMessage += `詳細エラー: ${error.message}`;
          } else if (error.message?.includes('Invalid JWT')) {
            userMessage += 'Apple Identity Tokenが無効です。\n';
            userMessage += 'Apple Developer Consoleの設定を確認してください。\n\n';
            userMessage += `詳細エラー: ${error.message}`;
          } else {
            userMessage += `詳細エラー: ${error.message} (${error.status})`;
          }
          
          throw new Error(userMessage);
        }
        
        // ユーザーレコードを作成または確認
        if (data.user?.id) {
          await ensureUserRecord(data.user);
          
          // RevenueCatにユーザーIDを設定
          await revenueCatService.setUserId(data.user.id);
        }
        
    } catch (error: any) {
      console.error('Apple Sign In Error:', error);
      
      // ユーザーキャンセルの場合は特別な処理
      if (error?.code === 'ERR_REQUEST_CANCELED') {
        return; // エラーを投げずに終了
      }
      
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

  // デバッグ用：手動でユーザーレコード作成
  const createUserRecord = async () => {
    if (!user) {
      throw new Error('ユーザーがログインしていません');
    }
    
    try {
      console.log('🔧 手動ユーザーレコード作成開始:', user.id);
      await ensureUserRecord(user);
      console.log('✅ 手動ユーザーレコード作成完了');
    } catch (error) {
      console.error('❌ 手動ユーザーレコード作成エラー:', error);
      throw error;
    }
  };

  // デバッグ用：プレミアム状態をリセット
  const resetPremiumStatus = async () => {
    if (!user) {
      throw new Error('ユーザーがログインしていません');
    }
    
    try {
      console.log('🔧 プレミアム状態リセット開始:', user.id);
      
      // 1. users テーブルの is_premium を false に設定
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_premium: false })
        .eq('auth_user_id', user.id);
      
      if (updateError) {
        console.error('❌ users テーブル更新エラー:', updateError);
        throw updateError;
      }
      
      // 2. Auth user_metadata から premium を削除
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { premium: null }
      });
      
      if (metadataError) {
        console.error('❌ user_metadata更新エラー:', metadataError);
        throw metadataError;
      }
      
      // 3. プレミアム状態を再取得
      await refreshPremiumStatus();
      
      console.log('✅ プレミアム状態リセット完了');
    } catch (error) {
      console.error('❌ プレミアム状態リセットエラー:', error);
      throw error;
    }
  };

  // RevenueCat関連のメソッド実装
  const refreshPremiumStatus = async (): Promise<void> => {
    try {
      console.log('🔄 refreshPremiumStatus 開始');
      setPremiumLoading(true);
      
      // 手動設定のプレミアムステータスをチェック（テスト用）
      let authMetadataPremium = false;
      let usersTablePremium = false;
      
      // 1. Auth user_metadata をチェック
      if (session?.user?.user_metadata?.premium) {
        authMetadataPremium = true;
        console.log('🧪 Auth metadata プレミアム設定検出:', authMetadataPremium);
      }
      
      // 2. users テーブルの is_premium カラムをチェック（常に実行）
      if (session?.user?.id) {
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('is_premium, display_name')
            .eq('auth_user_id', session.user.id)
            .single();
          
          console.log('🧪 users テーブル確認結果:', {
            userId: session.user.id,
            userData: userData,
            error: userError,
            isPremium: userData?.is_premium
          });
          
          if (!userError && userData?.is_premium === true) {
            usersTablePremium = true;
            console.log('🧪 users テーブル プレミアム設定検出:', usersTablePremium);
          }
        } catch (error) {
          console.log('users テーブル確認エラー:', error);
        }
      }
      
      // どちらかがtrueならプレミアム
      const manualPremiumStatus = authMetadataPremium || usersTablePremium;
      
      // RevenueCatのプレミアムステータスをチェック
      const revenueCatPremiumStatus = await revenueCatService.isPremium();
      
      // どちらかでプレミアムならプレミアム扱い
      const finalPremiumStatus = manualPremiumStatus || revenueCatPremiumStatus;
      
      setIsPremium(finalPremiumStatus);
      
      console.log('🎯 Premium status updated:', {
        authMetadata: authMetadataPremium,
        usersTable: usersTablePremium,
        manual: manualPremiumStatus,
        revenueCat: revenueCatPremiumStatus,
        final: finalPremiumStatus
      });
      
      console.log('✅ refreshPremiumStatus 完了, 新しい状態:', finalPremiumStatus);
    } catch (error) {
      console.error('Failed to refresh premium status:', error);
      
      // RevenueCatエラー時は手動設定のみチェック
      let fallbackAuthMetadata = false;
      let fallbackUsersTable = false;
      
      // Auth user_metadata をチェック
      if (session?.user?.user_metadata?.premium) {
        fallbackAuthMetadata = true;
      }
      
      // users テーブルをチェック（常に実行）
      if (session?.user?.id) {
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('is_premium')
            .eq('auth_user_id', session.user.id)
            .single();
          
          if (!userError && userData?.is_premium === true) {
            fallbackUsersTable = true;
          }
        } catch (error) {
          console.log('フォールバック時の users テーブル確認エラー:', error);
        }
      }
      
      const fallbackPremiumStatus = fallbackAuthMetadata || fallbackUsersTable;
      
      setIsPremium(fallbackPremiumStatus);
      console.log('🧪 RevenueCatエラー時、手動プレミアム設定を使用:', {
        authMetadata: fallbackAuthMetadata,
        usersTable: fallbackUsersTable,
        final: fallbackPremiumStatus
      });
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
    isSignedIn,
    requiresSignIn,
    signInWithApple,
    signOut,
    completeOnboarding,
    upgradeToPremium,
    // デバッグ用
    createUserRecord,
    resetPremiumStatus,
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