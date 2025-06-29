# 🔄 アプリリセット完全ガイド

Apple IDサインインやオンボーディングを再度テストしたい場合の手順です。

## 📱 方法1: アプリ内開発者メニュー（推奨）

### 手順
1. **プロフィール画面**を開く
2. **「開発者メニュー」**をタップ（開発版のみ表示）
3. リセットオプションを選択：

#### オプション
- **完全リセット**: 全データ削除（オンボーディング + ログイン）
- **オンボーディングリセット**: オンボーディングのみ
- **ログアウト**: ログイン状態のみクリア
- **データ確認**: 現在の状態をチェック

### メリット
✅ 簡単・確実  
✅ 部分的リセットも可能  
✅ 開発中のテストに最適

---

## 🗑️ 方法2: アプリ完全削除・再インストール

### 手順
1. **アプリを長押し** → 「Appを削除」
2. **App Store**または**Expo Go**から再インストール
3. 初回起動でオンボーディングから開始

### メリット
✅ 100%確実にリセット  
✅ Apple設定もクリア

---

## ⚙️ 方法3: iOS設定からApple ID連携をリセット

### 手順
1. **設定** → **Apple ID** → **サインインとセキュリティ**
2. **Apple IDを使用しているApp** → **BeautyFood**
3. **Apple IDの使用を停止**をタップ

### 注意
⚠️ 他のアプリの Apple ID 連携にも影響する可能性

---

## 🔧 方法4: 開発サーバーリセット

### Metro Bundler リセット
```bash
# キャッシュクリア
npm start -- --clear

# または
npx expo start -c
```

### iOS Simulator リセット
```bash
# シミュレーターをリセット
xcrun simctl erase all
```

---

## 📊 方法5: Supabase からユーザーデータ削除

### SQL実行（Supabase Dashboard）
```sql
-- 特定ユーザーのデータを削除
DELETE FROM beauty_stats WHERE user_id IN (
    SELECT id FROM users WHERE auth_user_id = 'YOUR_USER_ID'
);

DELETE FROM ai_analysis_results WHERE meal_record_id IN (
    SELECT id FROM meal_records WHERE user_id IN (
        SELECT id FROM users WHERE auth_user_id = 'YOUR_USER_ID'
    )
);

DELETE FROM meal_records WHERE user_id IN (
    SELECT id FROM users WHERE auth_user_id = 'YOUR_USER_ID'
);

DELETE FROM users WHERE auth_user_id = 'YOUR_USER_ID';

-- Auth ユーザーも削除（管理画面から）
```

---

## 🎯 テストシナリオ別推奨方法

### 📝 オンボーディングテスト
→ **方法1**: アプリ内「オンボーディングリセット」

### 🔐 Apple ID サインインテスト  
→ **方法1**: アプリ内「ログアウト」

### 🆕 完全な初回体験テスト
→ **方法1**: アプリ内「完全リセット」または **方法2**: アプリ削除

### 🚀 本格的なテスト
→ **方法2**: アプリ削除 + **方法5**: DB削除

---

## ⚠️ 注意事項

1. **開発版のみ**: 開発者メニューは `__DEV__` 時のみ表示
2. **データバックアップ**: 重要なテストデータは事前にバックアップ
3. **Apple ID**: Apple ID 設定変更は他アプリにも影響する可能性
4. **DB削除**: プロダクションでは絶対に実行しない

---

## 🔍 トラブルシューティング

### オンボーディングが表示されない
```typescript
// AsyncStorage 確認
await AsyncStorage.getItem('hasLaunched'); // null なら初回
```

### ログイン状態が残る
```typescript
// Supabase セッション確認
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

### Apple ID 連携エラー
1. Apple Developer Console 設定確認
2. Supabase Apple Auth Provider 設定確認
3. Services ID の Bundle ID 確認