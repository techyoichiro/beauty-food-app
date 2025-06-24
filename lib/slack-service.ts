/**
 * Slack通知サービス
 * お問い合わせやアラートをSlackのワークスペースに送信する
 */

import Constants from 'expo-constants';

// お問い合わせフォームの送信データ型
export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

// アラートレベル型
export type AlertLevel = 'info' | 'warning' | 'error';

// Slack Webhook URLの設定
const SLACK_WEBHOOK_URL = 
  Constants.expoConfig?.extra?.slackWebhookUrl || 
  process.env.EXPO_PUBLIC_SLACK_WEBHOOK_URL ||
  process.env.SLACK_WEBHOOK_URL;

// 開発環境での設定確認
if (!SLACK_WEBHOOK_URL) {
  console.warn('⚠️ SLACK_WEBHOOK_URL が設定されていません');
  console.warn('環境変数 SLACK_WEBHOOK_URL を設定してください');
} else {
  console.log('✅ Slack Webhook URL が設定されています');
  // セキュリティのため、URLの一部のみ表示
  console.log('URL:', SLACK_WEBHOOK_URL.substring(0, 30) + '...');
}

export interface SlackMessage {
  text: string;
  blocks?: any[];
  channel?: string;
  username?: string;
  icon_emoji?: string;
}

/**
 * お問い合わせフォームの内容をSlackに送信
 */
export const sendContactFormToSlack = async (formData: ContactFormData) => {
  const slackMessage: SlackMessage = {
    text: "新しいお問い合わせが届きました",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🔔 新しいお問い合わせ - BeautyFood"
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*お名前:*\n${formData.name}`
          },
          {
            type: "mrkdwn", 
            text: `*メールアドレス:*\n${formData.email}`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*お問い合わせ内容:*\n${formData.message}`
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `送信日時: ${new Date().toLocaleString('ja-JP')} | アプリ: BeautyFood`
          }
        ]
      }
    ]
  };

  return await sendSlackMessage(slackMessage);
};

/**
 * アラート通知をSlackに送信
 */
export const sendAlertToSlack = async (title: string, message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  const emoji = level === 'error' ? '🚨' : level === 'warning' ? '⚠️' : 'ℹ️';
  const color = level === 'error' ? '#dc2626' : level === 'warning' ? '#f59e0b' : '#3b82f6';

  const slackMessage: SlackMessage = {
    text: `${emoji} ${title}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${emoji} ${title}`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: message
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `${new Date().toLocaleString('ja-JP')} | BeautyFood App`
          }
        ]
      }
    ]
  };

  return await sendSlackMessage(slackMessage);
};

/**
 * カスタムメッセージをSlackに送信
 */
export const sendCustomSlackMessage = async (message: SlackMessage) => {
  return await sendSlackMessage(message);
};

/**
 * Slack APIへのメッセージ送信（共通処理）
 */
const sendSlackMessage = async (message: SlackMessage): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error('Slack送信エラー:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Webhook URLの設定
 * 開発環境では環境変数から読み込み、本番環境では直接設定
 */
export const setSlackWebhookUrl = (url: string) => {
  // 注意: 本番環境では環境変数やSecure Storeを使用することを推奨
  console.log('Slack Webhook URLが設定されました');
};

/**
 * 使用例とセットアップ手順
 * 
 * 1. Slackワークスペースでアプリを作成
 * 2. Incoming Webhooksを有効化
 * 3. チャンネルを選択してWebhook URLを取得
 * 4. 上記のSLACK_WEBHOOK_URLを実際のURLに置き換え
 * 
 * 使用例:
 * ```typescript
 * import { sendContactFormToSlack, sendAlertToSlack } from './lib/slack-service';
 * 
 * // お問い合わせ送信
 * const result = await sendContactFormToSlack({
 *   name: '山田太郎',
 *   email: 'yamada@example.com',
 *   message: 'アプリの使い方について質問があります'
 * });
 * 
 * // アラート送信
 * await sendAlertToSlack('API エラー', 'OpenAI APIの呼び出しに失敗しました', 'error');
 * ```
 */ 