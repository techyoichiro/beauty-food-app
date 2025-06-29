/**
 * アプリデータリセットスクリプト
 * オンボーディングとサインイン状態を完全にクリアします
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export class AppDataResetter {
  
  /**
   * 全てのアプリデータをクリア
   */
  static async resetAllData(): Promise<void> {
    try {
      console.log('🔄 アプリデータリセット開始...');
      
      // Step 1: AsyncStorage をクリア
      console.log('📱 AsyncStorage クリア中...');
      await AsyncStorage.clear();
      
      // Step 2: SecureStore をクリア
      console.log('🔐 SecureStore クリア中...');
      await this.clearSecureStore();
      
      // Step 3: Supabase セッションクリア
      console.log('🗄️ Supabase セッションクリア中...');
      const { supabase } = await import('../lib/supabase');
      await supabase.auth.signOut();
      
      console.log('✅ アプリデータリセット完了!');
      console.log('📱 アプリを再起動してオンボーディングから開始できます');
      
    } catch (error) {
      console.error('❌ リセット失敗:', error);
      throw error;
    }
  }
  
  /**
   * オンボーディング状態のみリセット
   */
  static async resetOnboarding(): Promise<void> {
    try {
      console.log('🔄 オンボーディング状態リセット...');
      
      await AsyncStorage.removeItem('hasLaunched');
      
      console.log('✅ オンボーディング状態リセット完了!');
      console.log('📱 アプリを再起動してオンボーディングから開始されます');
      
    } catch (error) {
      console.error('❌ オンボーディングリセット失敗:', error);
      throw error;
    }
  }
  
  /**
   * サインイン状態のみリセット
   */
  static async resetAuth(): Promise<void> {
    try {
      console.log('🔄 認証状態リセット...');
      
      // Supabase セッションクリア
      const { supabase } = await import('../lib/supabase');
      await supabase.auth.signOut();
      
      // SecureStore の認証関連データクリア
      await this.clearSecureStore();
      
      console.log('✅ 認証状態リセット完了!');
      console.log('📱 アプリを再起動してサインイン画面から開始されます');
      
    } catch (error) {
      console.error('❌ 認証リセット失敗:', error);
      throw error;
    }
  }
  
  /**
   * SecureStore のクリア
   */
  private static async clearSecureStore(): Promise<void> {
    try {
      // Supabase認証関連のキー
      const authKeys = [
        'supabase.auth.token',
        'sb-supabase-auth-token',
        'sb-auth-token'
      ];
      
      for (const key of authKeys) {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (error) {
          // キーが存在しない場合のエラーは無視
          console.log(`🗑️ ${key} 削除 (存在しない可能性)`);
        }
      }
      
    } catch (error) {
      console.error('SecureStore クリアエラー:', error);
    }
  }
  
  /**
   * 現在の保存データ状況を確認
   */
  static async checkStoredData(): Promise<void> {
    try {
      console.log('🔍 保存データ確認中...');
      
      // AsyncStorage確認
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      const analysisResult = await AsyncStorage.getItem('latest_analysis_result');
      
      // Supabase セッション確認
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('📊 データ状況:', {
        hasLaunched: hasLaunched ? 'あり' : 'なし',
        latestAnalysis: analysisResult ? 'あり' : 'なし',
        supabaseSession: session ? 'ログイン中' : 'ログアウト',
        userId: session?.user?.id || 'なし'
      });
      
    } catch (error) {
      console.error('❌ データ確認失敗:', error);
    }
  }
}

export default AppDataResetter;