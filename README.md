# 美活！
美容効果のある食事を管理するReact Native + Expoアプリです。

## 機能

- 食事の写真撮影・AI解析
- 美容スコア算出
- 食事履歴管理
- プレミアム機能（詳細分析、月次レポート等）

## Slack連携機能

アプリのお問い合わせやアラート通知をSlackワークスペースに送信する機能を実装しています。

### Slack Webhook の設定方法

1. **Slackワークスペースでアプリを作成**
   - [Slack API](https://api.slack.com/apps) にアクセス
   - 「Create New App」→「From scratch」を選択
   - アプリ名とワークスペースを選択

2. **Incoming Webhooksを有効化**
   - 左メニューから「Incoming Webhooks」を選択
   - 「Activate Incoming Webhooks」をオンにする
   - 「Add New Webhook to Workspace」をクリック
   - 通知を送信するチャンネルを選択

3. **Webhook URLをアプリに設定**
   - `lib/slack-service.ts` の `SLACK_WEBHOOK_URL` を実際のURLに置き換え
   ```typescript
   const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T.../B.../...';
   ```

### 機能一覧

- **お問い合わせフォーム**: ユーザーからの問い合わせをSlackに自動送信
- **アラート通知**: エラーや警告をSlackに送信（今後実装予定）
- **カスタム通知**: 任意のメッセージをSlackに送信

### 使用例

```typescript
import { sendContactFormToSlack, sendAlertToSlack } from './lib/slack-service';

// お問い合わせ送信
const result = await sendContactFormToSlack({
  name: '山田太郎',
  email: 'yamada@example.com',
  message: 'アプリの使い方について質問があります'
});

// アラート送信
await sendAlertToSlack('API エラー', 'OpenAI APIの呼び出しに失敗しました', 'error');
```

### 推奨チャンネル構成

- `#beautyfood-support`: お問い合わせ通知
- `#beautyfood-alerts`: システムアラート・エラー通知
- `#beautyfood-analytics`: ユーザー分析・統計情報

## プライバシー設定の変更

プライバシー設定から以下の項目を削除しました：
- 広告・マーケティングカテゴリ全体
- 位置情報の利用設定

現在の設定項目：
- 基本データ収集
- 使用状況分析
- クラッシュレポート

## 開発環境

- React Native
- Expo
- TypeScript
- Supabase（バックエンド）
- OpenAI API（AI解析）

## インストール

```bash
npm install
npx expo start
```
