/**
 * テストデータセットアップ用のNode.jsスクリプト
 * 
 * 実行方法:
 * 1. アプリでサインインしてユーザーIDを取得
 * 2. node setup-test-data.js [ユーザーID]
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase環境変数が設定されていません');
  console.log('💡 .env ファイルにEXPO_PUBLIC_SUPABASE_URLとEXPO_PUBLIC_SUPABASE_ANON_KEYを設定してください');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setUserPremium(authUserId, isPremium = true) {
  try {
    console.log(`👑 ユーザーをプレミアム設定: ${authUserId} -> ${isPremium}`);
    
    const { error } = await supabase.rpc('set_user_premium', {
      user_auth_id: authUserId,
      is_premium: isPremium
    });
    
    if (error) {
      console.error('プレミアム設定エラー:', error);
      throw error;
    }
    
    console.log('✅ プレミアム設定完了');
    
  } catch (error) {
    console.error('❌ プレミアム設定失敗:', error);
    throw error;
  }
}

async function generateTestStats(authUserId) {
  try {
    console.log('📊 テスト美容統計データ生成中...');
    
    // ユーザーの実際のIDを取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single();
    
    if (userError || !userData) {
      console.error('❌ ユーザー取得エラー:', userError);
      return;
    }
    
    const userId = userData.id;
    console.log('👤 内部ユーザーID:', userId);
    
    // 既存データをクリア
    const { error: clearError } = await supabase
      .from('beauty_stats')
      .delete()
      .eq('user_id', userId);
    
    if (clearError) {
      console.error('既存データクリアエラー:', clearError);
    }
    
    // 過去2週間分のテストデータを生成
    const today = new Date();
    const testData = [];
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dateStr = date.toISOString().split('T')[0];
      const weekStart = getWeekStart(date);
      const month = date.toISOString().substring(0, 7);
      
      // ランダムな美容スコアを生成
      const baseScore = 70 + Math.floor(Math.random() * 25); // 70-95点
      const analysisCount = 1 + Math.floor(Math.random() * 3); // 1-3回解析
      
      const statData = {
        user_id: userId,
        date: dateStr,
        week_start: weekStart,
        month: month,
        daily_score: baseScore,
        daily_analyses_count: analysisCount,
        skin_care_score: Math.max(60, baseScore + Math.floor(Math.random() * 10) - 5),
        anti_aging_score: Math.max(60, baseScore + Math.floor(Math.random() * 10) - 5),
        detox_score: Math.max(60, baseScore + Math.floor(Math.random() * 10) - 5),
        circulation_score: Math.max(60, baseScore + Math.floor(Math.random() * 10) - 5),
        hair_nails_score: Math.max(60, baseScore + Math.floor(Math.random() * 10) - 5),
        protein_balance: Math.max(50, Math.floor(baseScore * 0.8 + Math.random() * 20)),
        vitamin_balance: Math.max(50, Math.floor(baseScore * 0.9 + Math.random() * 15)),
        mineral_balance: Math.max(50, Math.floor(baseScore * 0.85 + Math.random() * 18)),
        fiber_balance: Math.max(50, Math.floor(baseScore * 0.75 + Math.random() * 25))
      };
      
      testData.push(statData);
    }
    
    // データを挿入
    const { error: insertError } = await supabase
      .from('beauty_stats')
      .insert(testData);
    
    if (insertError) {
      console.error('❌ テストデータ挿入エラー:', insertError);
      throw insertError;
    }
    
    console.log(`✅ ${testData.length}件のテスト美容統計データを生成しました`);
    
  } catch (error) {
    console.error('❌ テストデータ生成失敗:', error);
  }
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 月曜日を週の始まりとする
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ ユーザーIDが必要です');
    console.log('💡 使用方法: node setup-test-data.js [ユーザーID]');
    console.log('💡 ヒント: アプリでログインして session.user.id をコピーしてください');
    process.exit(1);
  }
  
  const userAuthId = args[0];
  
  try {
    console.log('🚀 テストデータセットアップ開始');
    console.log('👤 対象ユーザー:', userAuthId);
    
    // Step 1: プレミアム設定
    await setUserPremium(userAuthId, true);
    
    // Step 2: テスト統計データ生成
    await generateTestStats(userAuthId);
    
    console.log('\n🎉 セットアップ完了！');
    console.log('✅ ユーザーがプレミアム設定されました');
    console.log('✅ 美容統計テストデータが生成されました');
    console.log('📱 アプリを再起動してプロフィール画面とレポート画面を確認してください');
    
  } catch (error) {
    console.error('❌ セットアップ失敗:', error);
    process.exit(1);
  }
}

main();