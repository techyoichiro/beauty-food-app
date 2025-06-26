# BeautyFood App セットアップガイド

## 概要
このガイドでは、BeautyFood Appの開発環境セットアップと、本番環境への展開手順を説明します。

## 前提条件
- Node.js 18以上
- npm または yarn
- Expo CLI
- iOS開発の場合: Xcode、Apple Developer Program
- Android開発の場合: Android Studio

## 1. 基本セットアップ

### 依存関係のインストール
```bash
npm install
```

### 環境変数の設定
`.env`ファイルを作成し、以下の環境変数を設定：

```env
# Supabase（必須）
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI（必須）
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-openai-api-key

# RevenueCat（課金機能用）
EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=your-revenuecat-apple-key
EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY=your-revenuecat-google-key

# Slack（オプション）
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

## 2. Supabase セットアップ

### プロジェクト作成
1. [Supabase](https://supabase.com)でプロジェクトを作成
2. データベース設定は`docs/database_design.md`を参照
3. Row Level Security (RLS)を有効化

### 認証設定
```sql
-- Apple Sign-In用の設定（Apple Developer Program必要）
-- Project Settings > Authentication > Third-party providers
-- Apple: Client ID, Client Secret設定
```

### Storageセットアップ
```sql
-- 食事画像用のプライベートバケットを作成
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-images', 'meal-images', false);
```

## 3. RevenueCat セットアップ

### アカウント作成
1. [RevenueCat](https://www.revenuecat.com)でアカウント作成
2. プロジェクトを作成

### App Store Connect設定
1. App Store Connectでアプリを作成
2. App Store Connect APIキーを生成
3. RevenueCatにApp Store Connect APIキーを設定

### プロダクト設定
RevenueCatで以下のプロダクトを作成：

**iOS:**
- `monthly_premium`: 月額 ¥480
- `yearly_premium`: 年額 ¥4,800

**Offerings設定:**
```json
{
  "current": {
    "monthly": "monthly_premium",
    "annual": "yearly_premium"
  }
}
```

### Entitlements設定
- `premium`: プレミアム機能へのアクセス権

## 4. Apple Developer Program（Apple Sign-In用）

### 必要な手順
1. Apple Developer Programに加入
2. App IDを作成し、Sign in with Appleを有効化
3. Service IDを作成
4. Keyを作成してダウンロード

### Expo設定
`app.config.js`に以下を追加：

```javascript
export default {
  expo: {
    // ... 既存設定
    plugins: [
      [
        "expo-apple-authentication",
        {
          appleTeamId: "YOUR_APPLE_TEAM_ID"
        }
      ]
    ]
  }
}
```

## 5. 開発環境での実行

### Expo Go（開発用）
```bash
npm run dev
```

### プリビルド（ネイティブ機能テスト用）
```bash
npx expo prebuild
npx expo run:ios
# または
npx expo run:android
```

## 6. 本番ビルド

### EAS Build設定
```bash
# EAS CLIインストール
npm install -g @expo/eas-cli

# EASプロジェクト初期化
eas build:configure

# iOS本番ビルド
eas build --platform ios --profile production

# Android本番ビルド
eas build --platform android --profile production
```

### `eas.json`設定例
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m1-medium"
      }
    }
  }
}
```

## 7. 実装完了チェックリスト

### ✅ 完了済み機能
- [x] AI食事解析機能
- [x] 美容カテゴリー別アドバイス
- [x] 2段階アドバイスシステム
- [x] 食事履歴管理
- [x] フリーミアムモデル
- [x] RevenueCat統合
- [x] プレミアムモーダル
- [x] ゲストモード対応
- [x] オンボーディングフロー

### 🔄 Apple Developer Program待ち
- [ ] Apple Sign-In実装（UI完成、認証処理待ち）

### ⚠️ 設定必要
- [ ] App Store Connect + RevenueCat連携
- [ ] 実際のプロダクトID設定
- [ ] Apple Sign-In証明書設定

### 📋 テスト必要
- [ ] Android環境での動作確認
- [ ] 課金フローのテスト
- [ ] App Store審査準備

## 8. トラブルシューティング

### RevenueCat関連
- **プラン取得失敗**: App Store Connectとの連携、プロダクトIDを確認
- **課金テスト失敗**: Sandbox環境の設定、テストアカウントを確認

### Apple Sign-In関連
- **認証失敗**: App ID設定、証明書の有効性を確認
- **開発時エラー**: Developer Programアカウントの状態を確認

### OpenAI API関連
- **解析失敗**: APIキーの有効性、クォータ残量を確認
- **レスポンス遅い**: 画像サイズ、品質設定を調整

## 9. デプロイメント

### App Store提出
1. EAS Buildで本番用ipaファイルを生成
2. App Store Connectでアプリ情報を設定
3. TestFlightでベータテスト
4. App Store審査へ提出

### アップデート配信
```bash
# OTAアップデート（JSバンドル/アセットのみ）
eas update --branch production

# ネイティブ機能追加時
eas build --platform ios --profile production
```

## 10. モニタリング

### 推奨ツール
- **クラッシュ追跡**: Expo/EAS内蔵analytics
- **課金追跡**: RevenueCatダッシュボード
- **API使用量**: OpenAI Usage画面
- **データベース**: Supabaseダッシュボード

### アラート設定
- OpenAI APIクォータ残量低下
- RevenueCat課金エラー増加
- Supabaseデータベース使用量増加

---

## サポート

技術的な質問や問題が発生した場合：
1. 本ドキュメントのトラブルシューティングを確認
2. 各サービス（Supabase、RevenueCat、OpenAI）の公式ドキュメントを参照
3. GitHub Issuesで報告

## 参考リンク

- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)