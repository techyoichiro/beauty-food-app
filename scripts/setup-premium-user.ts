/**
 * プレミアムユーザー設定スクリプト
 * 
 * 使用方法:
 * 1. アプリでサインインして session.user.id を取得
 * 2. このスクリプトでプレミアム設定と統計生成を実行
 * 3. アプリでレポート機能を確認
 */

import BeautyStatsGenerator from '../lib/generate-beauty-stats';

// ここにテスト対象のユーザーIDを設定
const TEST_USER_AUTH_ID = 'YOUR_USER_AUTH_ID_HERE';

async function setupPremiumUser() {
  try {
    console.log('🚀 プレミアムユーザー設定開始');
    console.log('👤 対象ユーザー:', TEST_USER_AUTH_ID);
    
    if (TEST_USER_AUTH_ID === 'YOUR_USER_AUTH_ID_HERE') {
      console.error('❌ TEST_USER_AUTH_ID を実際のユーザーIDに変更してください');
      console.log('💡 ヒント: アプリでログインして session.user.id をコピーしてください');
      return;
    }
    
    // Step 1: ユーザーをプレミアム設定
    console.log('\n📍 Step 1: プレミアム設定');
    await BeautyStatsGenerator.setUserPremium(TEST_USER_AUTH_ID, true);
    
    // Step 2: 美容統計を生成
    console.log('\n📍 Step 2: 美容統計生成');
    await BeautyStatsGenerator.generateStatsForUser(TEST_USER_AUTH_ID);
    
    // Step 3: 生成結果を確認
    console.log('\n📍 Step 3: 統計データ確認');
    await BeautyStatsGenerator.verifyStats(TEST_USER_AUTH_ID);
    
    console.log('\n🎉 セットアップ完了！');
    console.log('✅ ユーザーがプレミアム設定されました');
    console.log('✅ 美容統計データが生成されました');
    console.log('📱 アプリでプロフィール画面とレポート画面を確認してください');
    
  } catch (error) {
    console.error('❌ セットアップ失敗:', error);
  }
}

// 実行時の引数からユーザーIDを取得可能にする
const args = process.argv.slice(2);
if (args.length > 0) {
  const userIdFromArgs = args[0];
  console.log('📝 引数からユーザーID取得:', userIdFromArgs);
  
  // 引数が提供された場合はそれを使用
  BeautyStatsGenerator.setUserPremium(userIdFromArgs, true)
    .then(() => BeautyStatsGenerator.generateStatsForUser(userIdFromArgs))
    .then(() => BeautyStatsGenerator.verifyStats(userIdFromArgs))
    .then(() => console.log('🎉 完了!'))
    .catch(error => console.error('❌ エラー:', error));
} else {
  // 直接実行の場合
  setupPremiumUser();
}

export { setupPremiumUser };