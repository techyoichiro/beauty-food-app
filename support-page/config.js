// 美活！サポートページ設定
window.SUPPORT_PAGE_CONFIG = {
    // 本番環境では実際のWebhook URLに置き換えてください
    SLACK_WEBHOOK_URL: 'REPLACE_WITH_ACTUAL_WEBHOOK_URL',
    
    // その他の設定
    APP_NAME: '美活！',
    SUPPORT_EMAIL: 'support@example.com',
    
    // デバッグモード（開発時のみtrue）
    DEBUG: true,
    
    // Repository secretsから取得したWebhook URLを使用
    UPDATED_AT: '2025-01-27'
};

// より詳細なデバッグ情報
console.log('=== 美活！サポートページ設定 ===');
console.log('設定読み込み時刻:', new Date().toLocaleString('ja-JP'));
console.log('Webhook URL設定状況:', window.SUPPORT_PAGE_CONFIG.SLACK_WEBHOOK_URL !== 'REPLACE_WITH_ACTUAL_WEBHOOK_URL' ? '✅ 設定済み' : '❌ 未設定');
console.log('Webhook URL長:', window.SUPPORT_PAGE_CONFIG.SLACK_WEBHOOK_URL.length);

// 本番環境では機密情報を出力しないよう注意
if (window.SUPPORT_PAGE_CONFIG.SLACK_WEBHOOK_URL === 'REPLACE_WITH_ACTUAL_WEBHOOK_URL') {
    console.warn('⚠️ Webhook URLが設定されていません。GitHub Actionsでの置換を確認してください。');
} else {
    console.log('Webhook URL（先頭部分）:', window.SUPPORT_PAGE_CONFIG.SLACK_WEBHOOK_URL.substring(0, 30) + '...');
}

console.log('==========================');

// 従来のデバッグ用ログ（互換性のため保持）
if (window.SUPPORT_PAGE_CONFIG.DEBUG) {
    console.log('Support page config loaded:', {
        ...window.SUPPORT_PAGE_CONFIG,
        SLACK_WEBHOOK_URL: window.SUPPORT_PAGE_CONFIG.SLACK_WEBHOOK_URL.substring(0, 30) + '...'
    });
} 