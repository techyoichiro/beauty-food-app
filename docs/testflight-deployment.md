# TestFlight配布ガイド

## 1. ビルド前の準備

### 環境確認
```bash
# EAS CLI インストール確認
npx eas --version

# Apple Developer アカウント確認
npx eas device:list

# プロジェクト設定確認
npx eas build:list
```

### 必要な設定
- [x] **Bundle ID**: `com.aitech.beautyfood`
- [x] **EAS Project ID**: `b06c8db5-b4c5-438b-bf47-7a0a7fe4a9e6`
- [x] **RevenueCat API Key**: 設定済み
- [x] **環境変数**: .env ファイル設定済み
- [ ] **Apple Developer Certificate**: 要確認
- [ ] **Provisioning Profile**: 要確認

## 2. App Store Connect 事前設定

### アプリ作成
1. App Store Connect → 「マイApp」
2. 「新規アプリ」作成:
   - **名前**: BeautyFood App
   - **Bundle ID**: com.aitech.beautyfood
   - **言語**: 日本語
   - **カテゴリ**: ヘルスケア/フィットネス

### サブスクリプション製品作成
1. **App内課金** → **サブスクリプション**
2. **グループ作成**: premium
3. **月額プラン**:
   - Product ID: `monthly_premium`
   - 価格: ¥480
   - 期間: 1ヶ月
4. **年額プラン**:
   - Product ID: `yearly_premium`
   - 価格: ¥4,800
   - 期間: 1年

### TestFlight設定
1. **TestFlight** → **テスター**
2. **内部テスター** 追加
3. **外部テスター** グループ作成（必要に応じて）

## 3. EAS Build実行

### プレビュービルド（内部配布用）
```bash
# iOS プレビュービルドを作成
npx eas build --platform ios --profile preview

# ビルドの進捗確認
npx eas build:list
```

### プロダクションビルド（App Store配布用）
```bash
# iOS プロダクションビルドを作成
npx eas build --platform ios --profile production

# ビルド完了後、自動的にApp Store Connectにアップロード
```

## 4. TestFlight配布

### 内部テスト
1. **App Store Connect** → **TestFlight**
2. **内部テスト** → **ビルド選択**
3. **テスターに配布**

### 外部テスト（ベータ審査必要）
1. **外部テスト** → **新しいグループ作成**
2. **テスター追加** (メールアドレス)
3. **ベータ版審査に提出**

## 5. Sandbox課金テスト

### Sandboxテスターアカウント作成
1. **App Store Connect** → **Sandbox** → **テスター**
2. **新規テスター作成**:
   - Email: test-beauty-food@example.com
   - Password: TestUser123!
   - Territory: Japan

### テスト手順
1. **iOS設定** → **App Store** → **Sandbox アカウント**
2. Sandboxアカウントでサインイン
3. **TestFlightアプリ** → **BeautyFood App**をインストール
4. **課金テスト実行**:
   - プレミアムモーダル表示
   - 月額・年額プラン購入テスト
   - 購入キャンセルテスト
   - 購入復元テスト

### テスト項目チェックリスト
- [ ] アプリ起動・初期設定フロー
- [ ] Apple Sign-In 機能
- [ ] カメラ・写真解析機能
- [ ] プレミアムモーダル表示
- [ ] **月額プラン購入（¥480）**
- [ ] **年額プラン購入（¥4,800）**
- [ ] **購入キャンセル処理**
- [ ] **購入復元機能**
- [ ] **プレミアム機能制限・解除**
- [ ] 食事履歴機能
- [ ] **課金エラーハンドリング**

## 6. 課金機能テストシナリオ

### 正常系テスト
1. **新規購入フロー**:
   - プレミアムモーダル → プラン選択 → TouchID/FaceID → 購入完了
   - プレミアム機能即座に利用可能になることを確認

2. **復元フロー**:
   - アプリ削除・再インストール → 復元ボタン → プレミアム状態復元

3. **プラン変更**:
   - 月額プラン → 年額プランへ変更
   - 適切に課金処理されることを確認

### 異常系テスト
1. **ネットワークエラー**:
   - 機内モード → 購入試行 → 適切なエラーメッセージ表示

2. **Apple ID制限**:
   - 課金制限設定 → 購入試行 → 制限解除案内表示

3. **購入キャンセル**:
   - 購入途中でキャンセル → アプリ状態が正常に戻る

4. **同時購入試行**:
   - 複数回購入ボタン押下 → 適切な制御

## 7. RevenueCat Dashboard確認

### 購入データ確認
1. **RevenueCat Dashboard** → **Overview**
2. **トランザクション** 確認:
   - 購入イベントの記録
   - 金額・通貨の正確性
   - ユーザーID関連付け

### 顧客情報確認
1. **Customers** → **テストユーザー検索**
2. **エンタイトルメント** 状態確認:
   - `premium` エンタイトルメントがアクティブか
   - 有効期限が正しく設定されているか

## 8. 本番リリース準備

### App Store審査準備
1. **アプリ説明文** 作成
2. **スクリーンショット** 作成（5.5", 6.5"）
3. **プライバシーポリシー** URL設定
4. **利用規約** URL設定
5. **サポートURL** 設定

### 審査注意事項
- **サブスクリプション機能の動作確認**
- **課金処理の透明性**
- **解約方法の案内**
- **プレミアム機能の価値説明**

## 9. トラブルシューティング

### よくある問題

#### ビルドエラー
```bash
# Certificate エラー
npx eas credentials

# Provisioning Profile エラー
npx eas build:configure
```

#### 課金テストエラー
- **製品が見つからない**: App Store Connect製品設定確認
- **購入失敗**: Sandboxアカウント設定確認
- **復元失敗**: 購入履歴・Apple ID確認

#### RevenueCat連携エラー
- **API Key**: 環境変数設定確認
- **製品同期**: Dashboard Products設定確認
- **エンタイトルメント**: 製品とエンタイトルメント紐付け確認

## 10. リリース後監視

### KPI監視項目
- **ダウンロード数**
- **課金転換率** (無料 → 有料)
- **解約率** (Churn Rate)
- **ARPU** (平均収益)
- **クラッシュ率**

### RevenueCat Analytics活用
- **Revenue Tracking**: 売上推移
- **Cohort Analysis**: ユーザー継続率
- **Subscription Analytics**: サブスクリプション状態分析

### 改善項目
- 課金UI/UX最適化
- 価格戦略見直し
- プレミアム機能追加
- ユーザーフィードバック対応