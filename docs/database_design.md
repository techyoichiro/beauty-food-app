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

```sql
-- ユーザーデータの行レベルセキュリティ
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE advice_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nutrition_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can access own data" ON users FOR ALL USING (auth_user_id = auth.uid());
CREATE POLICY "Users can access own meal records" ON meal_records FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
-- 他のテーブルも同様のポリシーを適用
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

この設計により、MVPから将来の拡張まで対応できる柔軟なデータベース構造を提供できます。 