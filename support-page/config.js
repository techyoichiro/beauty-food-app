// 美活！サポートページ設定
window.SUPPORT_PAGE_CONFIG = {
    // 本番環境では実際のWebhook URLに置き換えてください
    SLACK_WEBHOOK_URL: 'REPLACE_WITH_ACTUAL_WEBHOOK_URL',
    
    // その他の設定
    APP_NAME: '美活！',
    SUPPORT_EMAIL: 'support@example.com',
    
    // デバッグモード（開発時のみtrue）
    DEBUG: false,
    
    // Repository secretsから取得したWebhook URLを使用
    UPDATED_AT: '2025-01-27'
};

// デバッグ用ログ
if (window.SUPPORT_PAGE_CONFIG.DEBUG) {
    console.log('Support page config loaded:', window.SUPPORT_PAGE_CONFIG);
} 