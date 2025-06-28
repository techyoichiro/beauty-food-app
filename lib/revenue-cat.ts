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
        console.warn(`RevenueCat API key not found for ${Platform.OS}`);
        return;
      }

      console.log('Initializing RevenueCat...');
      
      await Purchases.configure({
        apiKey,
        appUserID: null, // RevenueCatが自動で匿名IDを生成
      });

      // デバッグログを有効化（本番では無効にする）
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      this.initialized = true;
      console.log('RevenueCat initialized successfully');
      
    } catch (error) {
      console.error('RevenueCat initialization failed:', error);
      throw error;
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
        return '購入が許可されていません。設定を確認してください';
      case PURCHASES_ERROR_CODE.CONFIGURATION_ERROR:
        return 'アプリの設定に問題があります';
      default:
        return error.message || '購入処理中にエラーが発生しました';
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
}

// シングルトンインスタンス
export const revenueCatService = new RevenueCatService();
export default revenueCatService;