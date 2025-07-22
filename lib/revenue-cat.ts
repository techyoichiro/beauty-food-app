import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage, 
  CustomerInfo,
  PurchasesError,
  PURCHASES_ERROR_CODE,
  LOG_LEVEL
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys (環境変数から取得)
const REVENUECAT_APPLE_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY;
const REVENUECAT_GOOGLE_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY;

// 定数
export const PREMIUM_ENTITLEMENT_ID = 'premium';
export const OFFERING_ID = 'default';

// パッケージID（要件定義通り）
export const MONTHLY_PACKAGE_ID = 'monthly_premium';  // 月額 480円
export const YEARLY_PACKAGE_ID = 'yearly_premium';    // 年額 4,800円

export interface PremiumPlan {
  id: string;
  title: string;
  price: string;
  period: string;
  savings?: string;
  rcPackage: PurchasesPackage;
}

export interface PurchaseResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: PurchasesError;
  userCancelled?: boolean;
}

class RevenueCatService {
  private initialized = false;
  private isSandboxMode = __DEV__; // 開発モードではSandboxを使用

  /**
   * RevenueCatの初期化
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('RevenueCat already initialized');
      return;
    }

    try {
      const apiKey = Platform.OS === 'ios' ? REVENUECAT_APPLE_API_KEY : REVENUECAT_GOOGLE_API_KEY;
      
      if (!apiKey) {
        console.warn(`RevenueCat API key not found for ${Platform.OS} - using mock mode`);
        this.initialized = true; // モックモードとして初期化完了扱い
        return;
      }

      console.log('Initializing RevenueCat...', {
        platform: Platform.OS,
        sandboxMode: this.isSandboxMode
      });
      
      await Purchases.configure({
        apiKey,
        appUserID: null, // RevenueCatが自動で匿名IDを生成
      });

      // デバッグログを有効化（本番では無効にする）
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        console.log('🧪 RevenueCat Sandbox Mode: ENABLED');
      }

      this.initialized = true;
      console.log('RevenueCat initialized successfully');
      
    } catch (error) {
      console.error('RevenueCat initialization failed:', error);
      // 開発環境ではエラーを投げずに警告のみ
      if (__DEV__) {
        console.warn('RevenueCat initialization failed, continuing with mock mode');
        this.initialized = true;
      } else {
        throw error;
      }
    }
  }

  /**
   * ユーザーIDを設定（認証後に呼び出し）
   */
  async setUserId(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
      console.log('RevenueCat user logged in:', userId);
    } catch (error) {
      console.error('RevenueCat login failed:', error);
      throw error;
    }
  }

  /**
   * 現在のプレミアム状態を取得
   */
  async isPremium(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const isPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]?.isActive === true;
      console.log('Premium status:', isPremium);
      return isPremium;
    } catch (error) {
      console.error('Failed to check premium status:', error);
      return false;
    }
  }

  /**
   * 利用可能なプランを取得
   */
  async getAvailablePlans(): Promise<PremiumPlan[]> {
    try {
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;
      
      if (!currentOffering) {
        console.warn('No current offering found');
        return [];
      }

      const plans: PremiumPlan[] = [];

      // 月額プラン
      const monthlyPackage = currentOffering.monthly;
      if (monthlyPackage) {
        plans.push({
          id: MONTHLY_PACKAGE_ID,
          title: 'プレミアム（月額）',
          price: monthlyPackage.product.priceString,
          period: '月額',
          rcPackage: monthlyPackage
        });
      }

      // 年額プラン  
      const yearlyPackage = currentOffering.annual;
      if (yearlyPackage) {
        plans.push({
          id: YEARLY_PACKAGE_ID,
          title: 'プレミアム（年額）',
          price: yearlyPackage.product.priceString,
          period: '年額',
          savings: '2ヶ月分お得！',
          rcPackage: yearlyPackage
        });
      }

      console.log('Available plans:', plans.length);
      return plans;
      
    } catch (error) {
      console.error('Failed to get available plans:', error);
      return [];
    }
  }

  /**
   * プレミアムプランを購入
   */
  async purchasePremium(rcPackage: PurchasesPackage): Promise<PurchaseResult> {
    try {
      console.log('Attempting to purchase:', rcPackage.identifier);
      
      const purchaseResult = await Purchases.purchasePackage(rcPackage);
      
      // 購入成功
      const isPremium = purchaseResult.customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]?.isActive === true;
      
      console.log('Purchase successful, premium status:', isPremium);
      
      return {
        success: true,
        customerInfo: purchaseResult.customerInfo
      };
      
    } catch (error: any) {
      console.error('Purchase failed:', error);
      
      // ユーザーがキャンセルした場合
      if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        return {
          success: false,
          userCancelled: true,
          error
        };
      }
      
      // その他のエラー
      return {
        success: false,
        userCancelled: false,
        error
      };
    }
  }

  /**
   * 購入を復元
   */
  async restorePurchases(): Promise<PurchaseResult> {
    try {
      console.log('Restoring purchases...');
      
      const customerInfo = await Purchases.restorePurchases();
      const isPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]?.isActive === true;
      
      console.log('Restore successful, premium status:', isPremium);
      
      return {
        success: true,
        customerInfo
      };
      
    } catch (error: any) {
      console.error('Restore failed:', error);
      return {
        success: false,
        error
      };
    }
  }

  /**
   * 顧客情報を取得
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  /**
   * エラーメッセージを日本語に変換
   */
  getErrorMessage(error: PurchasesError): string {
    switch (error.code) {
      case PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR:
        return '購入がキャンセルされました';
        
      case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
        return '購入が許可されていません。設定 > スクリーンタイム > コンテンツとプライバシーの制限 > iTunes および App Store での購入 を確認してください';
        
      case PURCHASES_ERROR_CODE.PURCHASE_INVALID_ERROR:
        return '選択された商品は現在利用できません。しばらく時間をおいてから再試行してください';
        
      case PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR:
        return 'この商品は現在購入できません。App Store の設定を確認してください';
        
      case PURCHASES_ERROR_CODE.NETWORK_ERROR:
        return 'ネットワーク接続を確認してから再試行してください';
        
      case PURCHASES_ERROR_CODE.CONFIGURATION_ERROR:
        return 'アプリの設定に問題があります。アプリを最新版に更新してください';
        
      case PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR:
        return 'このレシートは既に使用されています。購入の復元をお試しください';
        
      case PURCHASES_ERROR_CODE.MISSING_RECEIPT_FILE_ERROR:
        return 'レシート情報が見つかりません。App Store にサインインしているか確認してください';
        
      case PURCHASES_ERROR_CODE.INVALID_RECEIPT_ERROR:
        return 'レシート情報が無効です。購入の復元をお試しください';
        
      case PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
        return '支払いが保留中です。承認され次第、プレミアム機能が利用可能になります';
        
      case PURCHASES_ERROR_CODE.INSUFFICIENT_PERMISSIONS_ERROR:
        return '購入に必要な権限がありません。保護者による制限を確認してください';
        
      case PURCHASES_ERROR_CODE.INVALID_APP_USER_ID_ERROR:
        return 'ユーザー認証に問題があります。アプリを再起動してください';
        
      case PURCHASES_ERROR_CODE.OPERATION_ALREADY_IN_PROGRESS_ERROR:
        return '別の購入処理が実行中です。完了してから再試行してください';
        
      case PURCHASES_ERROR_CODE.UNKNOWN_BACKEND_ERROR:
        return 'サーバーで問題が発生しました。しばらく時間をおいてから再試行してください';
        
      default:
        // 詳細なエラー情報をログに出力（開発用）
        console.error('Unhandled RevenueCat Error:', {
          code: error.code,
          message: error.message,
          underlyingErrorMessage: error.underlyingErrorMessage
        });
        
        return error.message || '購入処理中にエラーが発生しました。しばらく時間をおいてから再試行してください';
    }
  }

  /**
   * 購入可能状態をチェック
   */
  async checkPurchaseAvailability(): Promise<{ canPurchase: boolean; error?: string }> {
    try {
      // RevenueCat初期化状態をチェック
      if (!this.initialized) {
        await this.initialize();
      }

      // 利用可能な製品を取得
      const plans = await this.getAvailablePlans();
      
      if (plans.length === 0) {
        return {
          canPurchase: false,
          error: 'App Store からの製品情報取得に失敗しました。ネットワーク接続を確認してください'
        };
      }

      return { canPurchase: true };
      
    } catch (error: any) {
      console.error('Purchase availability check failed:', error);
      return {
        canPurchase: false,
        error: '購入機能の初期化に失敗しました。アプリを再起動してください'
      };
    }
  }

  /**
   * 購入復元の可用性をチェック
   */
  async checkRestoreAvailability(): Promise<{ canRestore: boolean; error?: string }> {
    try {
      const customerInfo = await this.getCustomerInfo();
      
      if (!customerInfo) {
        return {
          canRestore: false,
          error: 'ユーザー情報の取得に失敗しました'
        };
      }

      // 過去の購入履歴があるかチェック
      const hasActiveEntitlements = Object.keys(customerInfo.entitlements.active).length > 0;
      const hasAllEntitlements = Object.keys(customerInfo.entitlements.all).length > 0;
      
      return {
        canRestore: hasAllEntitlements,
        error: hasAllEntitlements ? undefined : '復元可能な購入履歴が見つかりません'
      };
      
    } catch (error: any) {
      console.error('Restore availability check failed:', error);
      return {
        canRestore: false,
        error: '復元機能の確認に失敗しました'
      };
    }
  }

  /**
   * RevenueCatのリセット（デバッグ用）
   */
  async reset(): Promise<void> {
    try {
      await Purchases.logOut();
      console.log('RevenueCat user logged out');
    } catch (error) {
      console.error('RevenueCat logout failed:', error);
    }
  }

  /**
   * Sandboxテスト用：購入状態をリセット
   */
  async resetSandboxPurchases(): Promise<void> {
    if (!__DEV__) {
      console.warn('Sandbox reset is only available in development mode');
      return;
    }

    try {
      console.log('🧪 Resetting Sandbox purchases...');
      await Purchases.logOut();
      
      // 少し待ってから再初期化
      setTimeout(async () => {
        await this.initialize();
        console.log('✅ Sandbox reset complete');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Sandbox reset failed:', error);
    }
  }

  /**
   * Sandboxテスト用：現在のテスト状態を表示
   */
  async debugSandboxStatus(): Promise<void> {
    if (!__DEV__) return;

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const offerings = await Purchases.getOfferings();
      
      console.log('🧪 Sandbox Debug Info:', {
        userId: customerInfo.originalAppUserId,
        isPremium: customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]?.isActive,
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
        allEntitlements: Object.keys(customerInfo.entitlements.all),
        availableOfferings: Object.keys(offerings.all),
        currentOffering: offerings.current?.identifier,
        environment: customerInfo.requestDate
      });
      
    } catch (error) {
      console.error('Failed to get sandbox debug info:', error);
    }
  }
}

// シングルトンインスタンス
export const revenueCatService = new RevenueCatService();
export default revenueCatService;