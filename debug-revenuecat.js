/**
 * RevenueCat Sandbox テスト用デバッグスクリプト
 * 開発モードでのみ使用
 */

import revenueCatService from './lib/revenue-cat';

export const debugRevenueCat = {
  /**
   * Sandboxテストの開始
   */
  async startSandboxTest() {
    console.log('🧪 Starting RevenueCat Sandbox Test...');
    
    try {
      // 1. 初期化確認
      await revenueCatService.initialize();
      
      // 2. 現在の状態を表示
      await revenueCatService.debugSandboxStatus();
      
      // 3. 利用可能なプランを取得
      const plans = await revenueCatService.getAvailablePlans();
      console.log('📦 Available Plans:', plans);
      
      // 4. プレミアム状態を確認
      const isPremium = await revenueCatService.isPremium();
      console.log('💎 Current Premium Status:', isPremium);
      
      console.log('✅ Sandbox test initialization complete');
      
    } catch (error) {
      console.error('❌ Sandbox test failed:', error);
    }
  },

  /**
   * 購入テスト（月額プラン）
   */
  async testMonthlyPurchase() {
    console.log('🧪 Testing Monthly Purchase...');
    
    try {
      const plans = await revenueCatService.getAvailablePlans();
      const monthlyPlan = plans.find(plan => plan.id === 'monthly_premium');
      
      if (!monthlyPlan) {
        console.error('❌ Monthly plan not found');
        return;
      }
      
      console.log('💰 Attempting purchase:', monthlyPlan);
      const result = await revenueCatService.purchasePremium(monthlyPlan.rcPackage);
      
      if (result.success) {
        console.log('✅ Purchase successful!');
        await revenueCatService.debugSandboxStatus();
      } else {
        console.log('❌ Purchase failed:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Purchase test failed:', error);
    }
  },

  /**
   * 購入復元テスト
   */
  async testRestorePurchases() {
    console.log('🧪 Testing Restore Purchases...');
    
    try {
      const result = await revenueCatService.restorePurchases();
      
      if (result.success) {
        console.log('✅ Restore successful!');
        await revenueCatService.debugSandboxStatus();
      } else {
        console.log('❌ Restore failed:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Restore test failed:', error);
    }
  },

  /**
   * Sandbox状態をリセット
   */
  async resetSandbox() {
    console.log('🧪 Resetting Sandbox...');
    
    try {
      await revenueCatService.resetSandboxPurchases();
      
      // リセット後の状態確認
      setTimeout(async () => {
        await revenueCatService.debugSandboxStatus();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Sandbox reset failed:', error);
    }
  },

  /**
   * 完全なテストシーケンス
   */
  async runFullTest() {
    console.log('🧪 Running Full RevenueCat Test Sequence...');
    
    try {
      // 1. 初期化とステータス確認
      await this.startSandboxTest();
      
      // 2. リセット
      await this.resetSandbox();
      
      // 3. 購入テスト
      setTimeout(async () => {
        await this.testMonthlyPurchase();
        
        // 4. 復元テスト
        setTimeout(async () => {
          await this.testRestorePurchases();
        }, 3000);
        
      }, 3000);
      
    } catch (error) {
      console.error('❌ Full test sequence failed:', error);
    }
  }
};

// 開発モードでのみグローバルに公開
if (__DEV__) {
  global.debugRevenueCat = debugRevenueCat;
  console.log('🧪 RevenueCat Debug Tools Available: global.debugRevenueCat');
}

export default debugRevenueCat;