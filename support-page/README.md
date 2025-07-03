# 美活！サポートページ

このディレクトリには、美活！アプリの公式サポートページが含まれています。

## 概要

- **アプリ紹介**: 美活！の機能と特徴を紹介
- **使い方ガイド**: アプリの基本的な使用方法
- **お問い合わせフォーム**: Slackへの通知機能付き
- **法的文書へのリンク**: プライバシーポリシー、利用規約

## ファイル構成

```
support-page/
├── index.html          # メインページ
├── favicon.png         # ファビコン（32x32px）
├── og-image.png        # OGP画像（1200x630px）
└── README.md          # このファイル
```

## セットアップ手順

### 1. Slack Webhook URLの設定

`index.html` の JavaScript部分で、Slack Webhook URLを設定してください：

```javascript
// 617行目付近
const webhookUrl = 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL';
```

### 2. 画像ファイルの準備

以下の画像ファイルを用意してください：

- `favicon.png`: 32x32px のファビコン
- `og-image.png`: 1200x630px のOGP画像（SNSシェア用）

### 3. ドメインの設定

`app.config.js` でサポートページのURLを設定してください：

```javascript
supportUrl: "https://your-domain.com/support-page/",
```

## デプロイ方法

### 静的サイトホスティング

以下のサービスにデプロイできます：

#### Netlify
1. GitHubリポジトリと連携
2. Build settings:
   - Build command: (空)
   - Publish directory: `support-page`

#### Vercel
1. GitHubリポジトリと連携
2. Framework Preset: Other
3. Root Directory: `support-page`

#### GitHub Pages
1. リポジトリ設定でPages機能を有効化
2. Source: Deploy from a branch
3. Branch: main / support-page

#### Firebase Hosting
```bash
cd support-page
firebase init hosting
firebase deploy
```

### カスタムドメインの設定

1. DNS設定でCNAMEレコードを追加
2. ホスティングサービスでカスタムドメインを設定
3. SSL証明書を有効化

## 機能

### お問い合わせフォーム

- **種別選択**: 不具合報告、機能要望、課金問題など
- **メールアドレス**: 任意入力
- **内容**: 詳細な問い合わせ内容
- **Slack通知**: 送信内容が自動でSlackに通知

### レスポンシブデザイン

- モバイル対応
- タブレット対応
- デスクトップ対応

### SEO対応

- Open Graph タグ
- Twitter Card
- 適切なメタタグ

## カスタマイズ

### デザインの変更

CSS変数を使用してカラーテーマを変更できます：

```css
:root {
  --primary-color: #FF6B9D;
  --secondary-color: #FFB347;
  --text-color: #2D1B69;
}
```

### 機能の追加

- FAQ セクション
- ダウンロードリンク
- スクリーンショット
- 動画デモ

## 注意事項

1. **Slack Webhook URL**: 本番環境では環境変数での管理を推奨
2. **CORS設定**: 必要に応じてCORSヘッダーを設定
3. **セキュリティ**: XSS対策、入力値検証を適切に実装
4. **パフォーマンス**: 画像の最適化、CDN使用を検討

## ライセンス

© 2025 Beauty AI Tech. All rights reserved. 