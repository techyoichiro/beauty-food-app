# 美容食事管理アプリ データベース設計

## データベース構成

### 使用技術
- **データベース**: PostgreSQL (Supabase)
- **認証**: Supabase Auth
- **ファイルストレージ**: Supabase Storage (食事画像用)

## テーブル設計

### 👤 ユーザー関連

#### users テーブル
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    beauty_level VARCHAR(20) CHECK (beauty_level IN ('beginner', 'intermediate', 'advanced')),
    seasonal_setting VARCHAR(20) CHECK (seasonal_setting IN ('spring', 'summer', 'autumn', 'winter')),
    health_condition VARCHAR(50),
    is_premium BOOLEAN DEFAULT FALSE,
    premium_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### user_beauty_categories テーブル
```sql
CREATE TABLE user_beauty_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(30) CHECK (category IN ('skin_care', 'anti_aging', 'detox', 'blood_circulation', 'hair_nail_health')),
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 🍽️ 食事記録関連

#### meal_records テーブル
```sql
CREATE TABLE meal_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    meal_timing VARCHAR(20) CHECK (meal_timing IN ('breakfast', 'lunch', 'dinner', 'snack')),
    meal_timing_auto BOOLEAN DEFAULT TRUE,
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analysis_status VARCHAR(20) CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### ai_analysis_results テーブル
```sql
CREATE TABLE ai_analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_record_id UUID REFERENCES meal_records(id) ON DELETE CASCADE,
    detected_foods JSONB, -- 検出された食材リスト
    nutrition_analysis JSONB, -- 栄養素分析結果
    raw_ai_response TEXT, -- AI APIの生レスポンス
    confidence_score DECIMAL(3,2), -- 解析精度スコア
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 💡 アドバイス関連

#### advice_records テーブル
```sql
CREATE TABLE advice_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_record_id UUID REFERENCES meal_records(id) ON DELETE CASCADE,
    advice_type VARCHAR(20) CHECK (advice_type IN ('immediate', 'next_meal')),
    beauty_category VARCHAR(30),
    advice_text TEXT NOT NULL,
    suggested_foods JSONB, -- 推奨食材リスト
    nutrition_reasoning TEXT, -- 栄養学的根拠
    is_executed BOOLEAN DEFAULT FALSE, -- ユーザーが実行したかどうか
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 📊 分析・レポート関連

#### daily_nutrition_summaries テーブル
```sql
CREATE TABLE daily_nutrition_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    summary_date DATE NOT NULL,
    total_calories DECIMAL(8,2),
    nutrition_breakdown JSONB, -- ビタミン、ミネラル等の詳細
    beauty_score JSONB, -- 美容カテゴリー別スコア
    meal_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, summary_date)
);
```

#### monthly_reports テーブル (プレミアム機能)
```sql
CREATE TABLE monthly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_month DATE NOT NULL, -- 月の初日
    nutrition_trends JSONB, -- 栄養傾向データ
    beauty_food_ranking JSONB, -- 美容食材ランキング
    advice_execution_rate DECIMAL(5,2), -- アドバイス実行率
    category_achievement JSONB, -- カテゴリー別達成度
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, report_month)
);
```

### 📱 アプリ使用状況

#### usage_analytics テーブル
```sql
CREATE TABLE usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50), -- 'photo_taken', 'advice_viewed', 'settings_changed' など
    metadata JSONB, -- アクション詳細データ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## インデックス設計

```sql
-- パフォーマンス最適化用インデックス
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_meal_records_user_id_taken_at ON meal_records(user_id, taken_at DESC);
CREATE INDEX idx_advice_records_meal_record_id ON advice_records(meal_record_id);
CREATE INDEX idx_daily_summaries_user_date ON daily_nutrition_summaries(user_id, summary_date DESC);
CREATE INDEX idx_usage_analytics_user_created ON usage_analytics(user_id, created_at DESC);
```

## Row Level Security (RLS)

### RLS有効化
```sql
-- 全テーブルでRLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_beauty_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE advice_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nutrition_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage_limits ENABLE ROW LEVEL SECURITY;
```

### 詳細なRLSポリシー設定

#### usersテーブルのポリシー
```sql
-- users テーブル（auth_user_idでアクセス制御）
CREATE POLICY "users_insert_policy" 
ON users 
FOR INSERT 
WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "users_select_policy" 
ON users 
FOR SELECT 
USING (auth.uid() = auth_user_id);

CREATE POLICY "users_update_policy" 
ON users 
FOR UPDATE 
USING (auth.uid() = auth_user_id);

CREATE POLICY "users_delete_policy" 
ON users 
FOR DELETE 
USING (auth.uid() = auth_user_id);
```

#### user_beauty_categoriesテーブルのポリシー
```sql
-- user_beauty_categories テーブル（usersテーブル経由でアクセス制御）
CREATE POLICY "user_beauty_categories_insert_policy" 
ON user_beauty_categories 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = user_beauty_categories.user_id 
        AND users.auth_user_id = auth.uid()
    )
);

CREATE POLICY "user_beauty_categories_select_policy" 
ON user_beauty_categories 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = user_beauty_categories.user_id 
        AND users.auth_user_id = auth.uid()
    )
);

CREATE POLICY "user_beauty_categories_update_policy" 
ON user_beauty_categories 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = user_beauty_categories.user_id 
        AND users.auth_user_id = auth.uid()
    )
);

CREATE POLICY "user_beauty_categories_delete_policy" 
ON user_beauty_categories 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = user_beauty_categories.user_id 
        AND users.auth_user_id = auth.uid()
    )
);
```

#### meal_recordsテーブルのポリシー
```sql
-- meal_records テーブル（usersテーブル経由でアクセス制御）
CREATE POLICY "meal_records_insert_policy" 
ON meal_records 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = meal_records.user_id 
        AND users.auth_user_id = auth.uid()
    )
);

CREATE POLICY "meal_records_select_policy" 
ON meal_records 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = meal_records.user_id 
        AND users.auth_user_id = auth.uid()
    )
);

CREATE POLICY "meal_records_update_policy" 
ON meal_records 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = meal_records.user_id 
        AND users.auth_user_id = auth.uid()
    )
);

CREATE POLICY "meal_records_delete_policy" 
ON meal_records 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = meal_records.user_id 
        AND users.auth_user_id = auth.uid()
    )
);
```

#### ai_analysis_resultsテーブルのポリシー
```sql
-- ai_analysis_results テーブル（meal_records経由でアクセス制御）
CREATE POLICY "ai_analysis_results_insert_policy" 
ON ai_analysis_results 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM meal_records 
        JOIN users ON users.id = meal_records.user_id
        WHERE meal_records.id = ai_analysis_results.meal_record_id 
        AND users.auth_user_id = auth.uid()
    )
);

CREATE POLICY "ai_analysis_results_select_policy" 
ON ai_analysis_results 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM meal_records 
        JOIN users ON users.id = meal_records.user_id
        WHERE meal_records.id = ai_analysis_results.meal_record_id 
        AND users.auth_user_id = auth.uid()
    )
);

CREATE POLICY "ai_analysis_results_update_policy" 
ON ai_analysis_results 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM meal_records 
        JOIN users ON users.id = meal_records.user_id
        WHERE meal_records.id = ai_analysis_results.meal_record_id 
        AND users.auth_user_id = auth.uid()
    )
);
```

#### advice_recordsテーブルのポリシー
```sql
-- advice_records テーブル（meal_records経由でアクセス制御）
CREATE POLICY "advice_records_insert_policy" 
ON advice_records 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM meal_records 
        JOIN users ON users.id = meal_records.user_id
        WHERE meal_records.id = advice_records.meal_record_id 
        AND users.auth_user_id = auth.uid()
    )
);

CREATE POLICY "advice_records_select_policy" 
ON advice_records 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM meal_records 
        JOIN users ON users.id = meal_records.user_id
        WHERE meal_records.id = advice_records.meal_record_id 
        AND users.auth_user_id = auth.uid()
    )
);

CREATE POLICY "advice_records_update_policy" 
ON advice_records 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM meal_records 
        JOIN users ON users.id = meal_records.user_id
        WHERE meal_records.id = advice_records.meal_record_id 
        AND users.auth_user_id = auth.uid()
    )
);
```

#### サマリー・レポート・分析テーブルのポリシー
```sql
-- daily_nutrition_summaries テーブル
CREATE POLICY "daily_nutrition_summaries_all_policy" 
ON daily_nutrition_summaries 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = daily_nutrition_summaries.user_id 
        AND users.auth_user_id = auth.uid()
    )
);

-- monthly_reports テーブル
CREATE POLICY "monthly_reports_all_policy" 
ON monthly_reports 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = monthly_reports.user_id 
        AND users.auth_user_id = auth.uid()
    )
);

-- usage_analytics テーブル
CREATE POLICY "usage_analytics_all_policy" 
ON usage_analytics 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = usage_analytics.user_id 
        AND users.auth_user_id = auth.uid()
    )
);

-- daily_usage_limits テーブル
CREATE POLICY "daily_usage_limits_all_policy" 
ON daily_usage_limits 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = daily_usage_limits.user_id 
        AND users.auth_user_id = auth.uid()
    )
);
```

### RLSポリシーのポイント

1. **認証ベース**: 全てのポリシーは`auth.uid()`（Supabase Auth）に基づく
2. **階層アクセス**: 直接制御（users）→間接制御（meal_records）→多段制御（ai_analysis_results）
3. **型安全**: UUIDとtextの型変換エラーを回避
4. **一貫性**: 全テーブルで統一されたポリシー命名規則
5. **セキュリティ**: ユーザーは自分のデータのみアクセス可能

### ポリシー削除・再作成（メンテナンス用）
```sql
-- 既存のポリシーをすべて削除して再作成する場合
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN (
        'users', 'user_beauty_categories', 'meal_records', 'ai_analysis_results', 
        'advice_records', 'daily_nutrition_summaries', 'monthly_reports', 
        'usage_analytics', 'daily_usage_limits'
    )) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
    END LOOP;
END $$;
```

## データ型の詳細

### JSONB フィールドの構造例

#### detected_foods (検出された食材)
```json
{
  "foods": [
    {
      "name": "鶏胸肉",
      "category": "protein",
      "estimated_amount": "100g",
      "confidence": 0.95
    },
    {
      "name": "ブロッコリー",
      "category": "vegetable", 
      "estimated_amount": "50g",
      "confidence": 0.88
    }
  ]
}
```

#### nutrition_analysis (栄養分析)
```json
{
  "calories": 250,
  "protein": 30.5,
  "carbohydrates": 12.3,
  "fat": 8.2,
  "vitamins": {
    "vitamin_c": 85.2,
    "vitamin_e": 12.1
  },
  "minerals": {
    "iron": 2.3,
    "zinc": 1.8
  }
}
```

#### beauty_score (美容スコア)
```json
{
  "skin_care": 85,
  "anti_aging": 78,
  "detox": 92,
  "blood_circulation": 65,
  "hair_nail_health": 72
}
```

## API 使用量制限の実装

### 無料版制限管理
```sql
CREATE TABLE daily_usage_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    photo_analysis_count INTEGER DEFAULT 0,
    UNIQUE(user_id, usage_date)
);
```

## 運用・保守

### 定期バッチ処理
1. **日次サマリー生成**: 各ユーザーの1日の栄養摂取状況を集計
2. **月次レポート生成**: プレミアムユーザー向けの詳細レポート作成  
3. **使用量制限リセット**: 無料版ユーザーの1日の解析回数をリセット
4. **期限切れプレミアムアカウントの処理**

### データ保持ポリシー
- 食事画像: 1年間保持後、圧縮または削除
- 分析結果: 無期限保持（プライバシー設定に応じて）
- 使用状況ログ: 3ヶ月間保持

## セキュリティ考慮事項

### 認証フロー
1. **Apple Sign-In必須**: 全ユーザーが認証済み
2. **自動ユーザー作成**: 初回サインイン時に`users`テーブルにレコード自動作成
3. **型安全**: `auth.uid()`（UUID）と`auth_user_id`（UUID）の適切な型マッチング

### データプライバシー
- 全テーブルで適切なRLSポリシー実装済み
- ユーザーは自分のデータのみアクセス可能
- 外部キー制約により関連データの整合性を保証

### パフォーマンス最適化
- 必要なインデックスを設定済み
- RLSポリシーでのEXISTS句最適化
- JOINクエリの効率化

## トラブルシューティング

### よくある問題と解決方法

#### 1. RLS違反エラー
```
new row violates row-level security policy
```
**解決方法**: ユーザーレコードが存在することを確認、RLSポリシーが正しく設定されているか確認

#### 2. 外部キー制約エラー
```
violates foreign key constraint "meal_records_user_id_fkey"
```
**解決方法**: `ensureUserRecord()`関数でユーザーレコードを事前作成

#### 3. UUID型変換エラー
```
operator does not exist: text = uuid
```
**解決方法**: 適切な型キャストまたは統一されたUUID型の使用

この設計により、MVPから将来の拡張まで対応できる、セキュアで柔軟なデータベース構造を提供できます。 