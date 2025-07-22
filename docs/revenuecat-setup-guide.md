# RevenueCat設定ガイド

## 1. RevenueCatダッシュボード設定

### アカウント作成・プロジェクト設定
1. https://app.revenuecat.com にアクセス
2. 「Sign Up」または既存アカウントでログイン
3. 新規プロジェクト作成: `美活！`

### App設定
1. **Project Settings** → **Apps** → **Add New App**
2. 設定項目:
   - **App Name**: 美活！
   - **Bundle ID**: `com.aitech.beautyfood`
   - **Platform**: iOS
   - **Apple App Store Connect**: 連携設定

### Products設定（重要）

#### Step 1: App Store Connect製品作成
まずApp Store Connectで以下の製品を作成:

1. **月額プレミアムプラン**
   - Product ID: `monthly_premium`
   - Type: Auto-Renewable Subscription
   - Price: ¥480
   - Duration: 1 Month

2. **年額プレミアムプラン**
   - Product ID: `yearly_premium`
   - Type: Auto-Renewable Subscription  
   - Price: ¥4,800
   - Duration: 1 Year

#### Step 2: RevenueCat製品同期
1. RevenueCat Dashboard → **Products**
2. **Import from App Store Connect** をクリック
3. 製品が自動的に同期されることを確認:
   - `monthly_premium` → ¥480/月
   - `yearly_premium` → ¥4,800/年

### Entitlements設定

#### プレミアムエンタイトルメント作成
1. **Entitlements** タブ → **Create Entitlement**
2. 設定項目:
   - **Identifier**: `premium`
   - **Display Name**: Premium Features
   - **Description**: 無制限AI解析、詳細美容レポート、週次・月次分析

#### 製品とエンタイトルメントの紐付け
1. 作成した `premium` エンタイトルメントを選択
2. **Attached Products** セクションで以下を追加:
   - `monthly_premium`
   - `yearly_premium`

### Offerings設定

#### デフォルトOffering作成
1. **Offerings** タブ → **Create Offering**
2. 設定項目:
   - **Identifier**: `default`
   - **Description**: Default Premium Plans
   - **Current**: チェックを入れる

#### Packages追加
1. **Add Package** で月額プランを追加:
   - **Identifier**: `monthly_premium`
   - **Product**: `monthly_premium`を選択
   - **Package Type**: Monthly

2. **Add Package** で年額プランを追加:
   - **Identifier**: `yearly_premium`
   - **Product**: `yearly_premium`を選択
   - **Package Type**: Annual

## 2. API Keys設定

### RevenueCat API Key取得
1. **Settings** → **API Keys**
2. **Public Apple Key** をコピー
3. 環境変数に設定済み: `EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY`

### 現在の設定確認
```bash
# .env ファイル内容（設定済み）
EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=appl_LFhVmegztlhMkxwPdGKyHXwDDaa
```

## 3. 実装確認項目

### lib/revenue-cat.ts チェックリスト
- [x] **API Key環境変数**: 正しく設定されている
- [x] **製品ID定数**: App Store Connect と一致
  - `MONTHLY_PACKAGE_ID = 'monthly_premium'`
  - `YEARLY_PACKAGE_ID = 'yearly_premium'`
- [x] **エンタイトルメントID**: `premium` で設定済み
- [x] **初期化処理**: `initialize()` メソッド実装済み
- [x] **プラン取得**: `getAvailablePlans()` メソッド実装済み
- [x] **購入処理**: `purchasePremium()` メソッド実装済み
- [x] **復元処理**: `restorePurchases()` メソッド実装済み

### AuthContext統合チェック
- [x] RevenueCat初期化が `initializeApp()` で実行
- [x] ユーザーID設定が `setUserId()` で実行
- [x] プレミアム状態取得が `refreshPremiumStatus()` で実行
- [x] 購入・復元メソッドが適切にラップされている

### PremiumModal動作確認
- [x] デフォルトプラン: ¥480（月額）、¥4,800（年額）
- [x] RevenueCatプラン取得: `getAvailablePlans()` 呼び出し
- [x] 購入処理: `purchasePremium()` 呼び出し
- [x] 復元処理: `restorePurchases()` 呼び出し

## 4. テスト準備

### Sandbox環境設定
1. **App Store Connect** → **Sandbox** → **Testers**
2. Sandboxテスターアカウント作成:
   - Email: test-beauty-food@example.com
   - Territory: Japan
   - Password: TestUser123!

### 実機テスト準備
1. iOS実機またはシミュレータでの動作確認
2. Sandboxアカウントでのサインイン
3. 購入フローテスト:
   - 月額プラン購入
   - 年額プラン購入
   - 購入復元
   - キャンセル処理

### デバッグ設定
```typescript
// lib/revenue-cat.ts の設定確認
if (__DEV__) {
  Purchases.setLogLevel(LOG_LEVEL.DEBUG); // デバッグログ有効
}
```

## 5. 本番リリース準備

### App Store Connect最終確認
1. サブスクリプション審査準備
2. 製品説明・スクリーンショット準備
3. プライバシーポリシー・利用規約準備

### RevenueCat本番設定
1. Production環境での動作確認
2. Analytics・Revenue Trackingの確認
3. Webhook設定（必要に応じて）

## 6. トラブルシューティング

### よくある問題と解決策

#### 1. 製品が取得できない
**問題**: `getAvailablePlans()` で空配列が返される
**解決策**:
- App Store Connect製品設定の確認
- RevenueCat製品同期の確認
- Bundle IDの一致確認

#### 2. 購入エラー
**問題**: 購入処理で `PURCHASE_NOT_ALLOWED_ERROR`
**解決策**:
- Sandboxテスターアカウントの確認
- デバイス設定でSandboxアカウントに切り替え
- 製品IDの一致確認

#### 3. エンタイトルメントが認識されない
**問題**: `isPremium()` が false を返す
**解決策**:
- エンタイトルメント設定の確認
- 製品とエンタイトルメントの紐付け確認
- ユーザーID設定の確認

#### 4. 復元処理が失敗
**問題**: `restorePurchases()` でエラー
**解決策**:
- 同じApple IDでの過去の購入確認
- サブスクリプション状態の確認
- RevenueCat Customer Info の確認

## 7. 次のステップ

### 実装完了後の作業
1. **課金機能テスト**: Sandbox環境での完全なテスト
2. **エラーハンドリング強化**: エラーケースの対応
3. **TestFlight配布**: ベータテスト実施
4. **App Store審査**: 本番リリース準備

### 監視・分析設定
1. **Revenue Analytics**: RevenueCatダッシュボードでの売上確認
2. **Conversion Tracking**: 無料→有料の転換率監視
3. **Churn Analysis**: 解約率の分析
4. **A/B Testing**: 価格・UI最適化のテスト