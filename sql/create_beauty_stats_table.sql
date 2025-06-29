-- beauty_stats テーブルの作成
CREATE TABLE beauty_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    week_start DATE NOT NULL,
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    
    -- 日次統計
    daily_score INTEGER NOT NULL DEFAULT 0,
    daily_analyses_count INTEGER NOT NULL DEFAULT 0,
    
    -- カテゴリー別スコア (0-100)
    skin_care_score INTEGER NOT NULL DEFAULT 0,
    anti_aging_score INTEGER NOT NULL DEFAULT 0,
    detox_score INTEGER NOT NULL DEFAULT 0,
    circulation_score INTEGER NOT NULL DEFAULT 0,
    hair_nails_score INTEGER NOT NULL DEFAULT 0,
    
    -- 栄養バランス (0-100)
    protein_balance INTEGER NOT NULL DEFAULT 0,
    vitamin_balance INTEGER NOT NULL DEFAULT 0,
    mineral_balance INTEGER NOT NULL DEFAULT 0,
    fiber_balance INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_beauty_stats_user_date ON beauty_stats(user_id, date);
CREATE INDEX idx_beauty_stats_user_week ON beauty_stats(user_id, week_start);
CREATE INDEX idx_beauty_stats_user_month ON beauty_stats(user_id, month);

-- ユニーク制約（1ユーザー1日1レコード）
CREATE UNIQUE INDEX idx_beauty_stats_unique_user_date ON beauty_stats(user_id, date);

-- RLS（Row Level Security）の設定
ALTER TABLE beauty_stats ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view own beauty stats" ON beauty_stats
    FOR SELECT USING (auth.uid() IN (
        SELECT auth_user_id FROM users WHERE id = beauty_stats.user_id
    ));

CREATE POLICY "Users can insert own beauty stats" ON beauty_stats
    FOR INSERT WITH CHECK (auth.uid() IN (
        SELECT auth_user_id FROM users WHERE id = beauty_stats.user_id
    ));

CREATE POLICY "Users can update own beauty stats" ON beauty_stats
    FOR UPDATE USING (auth.uid() IN (
        SELECT auth_user_id FROM users WHERE id = beauty_stats.user_id
    ));

-- トリガー関数：updated_at の自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_beauty_stats_updated_at BEFORE UPDATE
    ON beauty_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- テストユーザーをプレミアム設定するための関数
CREATE OR REPLACE FUNCTION set_user_premium(user_auth_id UUID, is_premium BOOLEAN DEFAULT TRUE)
RETURNS VOID AS $$
BEGIN
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('premium', is_premium)
    WHERE id = user_auth_id;
    
    -- users テーブルも更新（存在する場合）
    UPDATE users 
    SET updated_at = NOW()
    WHERE auth_user_id = user_auth_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;