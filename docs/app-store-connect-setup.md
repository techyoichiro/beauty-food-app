# App Store Connect製品設定ガイド

## 1. App Store Connect製品ID設定

### 必要な製品情報
- **アプリ名**: 美活！
- **Bundle ID**: com.aitech.beautyfood
- **価格体系**: 
  - 月額プラン: ¥480/月
  - 年額プラン: ¥4,800/年 (月額比較で2ヶ月分お得)

### 製品ID設定
1. **月額プレミアムプラン**
   - Product ID: `monthly_premium`
   - 価格: ¥480 (税込)
   - 期間: 1ヶ月
   - グループ: premium

2. **年額プレミアムプラン**
   - Product ID: `yearly_premium`
   - 価格: ¥4,800 (税込)
   - 期間: 1年
   - グループ: premium

### App Store Connect設定手順

#### Step 1: App Store Connectにログイン
1. https://appstoreconnect.apple.com にアクセス
2. Apple Developer Account でログイン

#### Step 2: アプリ作成・確認
1. 「マイApp」→「新規アプリ」（または既存アプリを選択）
2. Bundle ID: `com.aitech.beautyfood` を確認

#### Step 3: サブスクリプション設定
1. アプリ詳細 → 「App内課金」タブ
2. 「サブスクリプショングループを作成」
3. グループ名: `premium`
4. 「新しいサブスクリプション」をクリック

#### Step 4: 月額プラン設定
- **参照名**: Premium Monthly Plan
- **製品ID**: `monthly_premium`
- **期間**: 1ヶ月
- **価格**: 日本 ¥480
- **表示名**: プレミアム（月額）
- **説明**: 無制限AI解析、詳細美容レポート、週次分析

#### Step 5: 年額プラン設定
- **参照名**: Premium Yearly Plan
- **製品ID**: `yearly_premium`
- **期間**: 1年
- **価格**: 日本 ¥4,800
- **表示名**: プレミアム（年額）
- **説明**: 無制限AI解析、詳細美容レポート、週次・月次分析（2ヶ月分お得！）

#### Step 6: 審査情報入力
- **スクリーンショット**: アプリ内のプレミアム機能画面
- **審査ノート**: プレミアム機能の詳細説明

## 2. RevenueCat設定

### RevenueCat Dashboard設定
1. https://app.revenuecat.com にログイン
2. 新規プロジェクト作成: `beauty-food-app`

### App設定
1. 「Apps」→「Add New App」
2. **App Name**: 美活！
3. **Bundle ID**: com.aitech.beautyfood
4. **Platform**: iOS

### Products設定
1. 「Products」タブ
2. App Store Connect製品IDと連携:
   - `monthly_premium` → `monthly_premium`
   - `yearly_premium` → `yearly_premium`

### Entitlements設定
1. 「Entitlements」タブ
2. 新規作成: `premium`
3. 両製品を `premium` エンタイトルメントに紐付け

### API Keys取得
1. 「Settings」→「API Keys」
2. **Apple App Store**: API Keyを生成・コピー
3. 環境変数に設定: `EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY`

## 3. 環境変数設定

### .env.local更新
```bash
# RevenueCat
EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=your_revenuecat_apple_api_key_here

# 既存の設定は維持
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

## 4. 実装確認項目

### lib/revenue-cat.ts
- [ ] API Key環境変数が正しく設定されている
- [ ] 製品ID定数が App Store Connect と一致
- [ ] エンタイトルメントID `premium` が設定されている

### components/PremiumModal.tsx
- [ ] 価格表示が ¥480/¥4,800 で正しい
- [ ] 製品ID `monthly_premium`, `yearly_premium` が使用されている
- [ ] RevenueCat製品取得ロジックが実装されている

### contexts/AuthContext.tsx
- [ ] RevenueCat初期化が適切に行われている
- [ ] プレミアム状態の同期が実装されている
- [ ] ユーザーIDの設定が適切に行われている

## 5. テスト手順

### Sandbox環境テスト
1. App Store Connect で Sandbox テスターアカウント作成
2. iOS Simulatorでテスト（実機推奨）
3. 購入フローテスト
4. 復元機能テスト
5. サブスクリプション管理テスト

### 本番環境準備
1. TestFlight配布でベータテスト
2. App Store審査提出前の最終チェック
3. プライバシーポリシー・利用規約準備

## 6. チェックリスト

### App Store Connect
- [ ] アプリが作成済み
- [ ] Bundle IDが正しく設定
- [ ] サブスクリプショングループ作成
- [ ] 月額プラン（¥480）設定完了
- [ ] 年額プラン（¥4,800）設定完了
- [ ] 審査情報入力完了

### RevenueCat
- [ ] プロジェクト作成完了
- [ ] App設定完了
- [ ] 製品ID連携完了
- [ ] Entitlements設定完了
- [ ] API Key取得・設定完了

### アプリ実装
- [ ] 環境変数設定完了
- [ ] RevenueCat初期化実装
- [ ] 購入処理実装
- [ ] 復元処理実装
- [ ] エラーハンドリング実装

## 7. 注意事項

1. **価格設定**: ¥480（月額）、¥4,800（年額）で固定
2. **製品ID**: `monthly_premium`, `yearly_premium` で統一
3. **エンタイトルメント**: `premium` で統一
4. **テスト**: 必ずSandbox環境でテスト後に本番リリース
5. **審査**: App Store審査でサブスクリプション機能の動作確認が必要

## トラブルシューティング

### よくある問題
1. **製品が見つからない**: App Store Connect側の製品設定を確認
2. **購入エラー**: Sandbox テスターアカウントの設定確認
3. **復元失敗**: エンタイトルメント設定の確認
4. **価格が表示されない**: RevenueCat製品連携の確認