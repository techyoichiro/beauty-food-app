import { supabase } from './supabase';
import { analyzeFoodImage, saveAnalysisResult, UserProfile } from './food-analysis';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExtendedUserProfile extends UserProfile {
  weeklyGoalScore: number;
  dailyMealGoal: number;
  notifications: {
    meal: boolean;
    analysis: boolean;
    weekly: boolean;
  };
}

export interface MealRecord {
  id: string;
  user_id: string;
  taken_at: Date;
  meal_timing: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  image_url: string;
  analysis_status: 'pending' | 'completed' | 'failed';
  created_at: Date;
  updated_at: Date;
  analysisResult?: any;
}

// プライベートStorageに画像をアップロード（ゲストユーザー対応）
export const uploadMealImage = async (
  imageUri: string, 
  userId: string
): Promise<string> => {
  try {
    console.log('画像アップロード開始:', imageUri, 'ユーザー:', userId);
    
    // ゲストユーザーの場合はBase64形式で返す（Storageにアップロードしない）
    if (userId === 'guest_user') {
      console.log('ゲストユーザー: Base64変換中...');
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          console.log('ゲストユーザー: Base64変換完了');
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    
    // 認証済みユーザーの場合はプライベートStorageにアップロード
    console.log('認証済みユーザー: プライベートStorageアップロード中...');
    
    // 画像をBlobに変換
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // ファイル名を生成（ユーザーフォルダ内）
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `${userId}/${timestamp}_${randomId}.jpg`;
    
    // プライベートStorageにアップロード
    const { data, error } = await supabase.storage
      .from('meal-images')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('プライベートアップロードエラー:', error);
      throw new Error(`画像のアップロードに失敗しました: ${error.message}`);
    }
    
    // プライベートファイルのパスを返す（URLではなくパス）
    console.log('プライベート画像アップロード完了:', data.path);
    return data.path;
    
  } catch (error) {
    console.error('画像アップロード失敗:', error);
    throw error;
  }
};

// プライベート画像の署名付きURLを取得
export const getSignedImageUrl = async (
  imagePath: string,
  expiresIn: number = 3600 // 1時間
): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from('meal-images')
      .createSignedUrl(imagePath, expiresIn);
    
    if (error) {
      console.error('署名付きURL取得エラー:', error);
      throw new Error(`署名付きURLの取得に失敗しました: ${error.message}`);
    }
    
    return data.signedUrl;
    
  } catch (error) {
    console.error('署名付きURL取得失敗:', error);
    throw error;
  }
};

// 食事記録を作成（ゲストユーザー対応）
export const createMealRecord = async (
  userId: string,
  imagePath: string, // URLではなくパス
  mealTiming: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): Promise<MealRecord> => {
  try {
    console.log('食事記録作成開始:', { userId, mealTiming });
    
    // ゲストユーザーの場合は仮のレコードを返す
    if (userId === 'guest_user') {
      const guestRecord: MealRecord = {
        id: `guest_${Date.now()}`,
        user_id: userId,
        image_url: imagePath,
        meal_timing: mealTiming,
        taken_at: new Date(),
        analysis_status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      };
      console.log('ゲストユーザー食事記録作成完了:', guestRecord.id);
      return guestRecord;
    }
    
    // 認証済みユーザーの場合はデータベースに保存
    const { data, error } = await supabase
      .from('meal_records')
      .insert({
        user_id: userId,
        image_url: imagePath, // プライベートStorageのパスを保存
        meal_timing: mealTiming,
        analysis_status: 'pending'
      })
      .select()
      .single();
    
    if (error) {
      console.error('食事記録作成エラー:', error);
      throw new Error(`食事記録の作成に失敗しました: ${error.message}`);
    }
    
    console.log('食事記録作成完了:', data.id);
    return data as MealRecord;
    
  } catch (error) {
    console.error('食事記録作成失敗:', error);
    throw error;
  }
};

// 食事記録のステータスを更新（ゲストユーザー対応）
export const updateMealRecordStatus = async (
  mealRecordId: string,
  status: 'pending' | 'completed' | 'failed'
): Promise<void> => {
  try {
    // ゲストユーザーの場合はスキップ
    if (mealRecordId.startsWith('guest_')) {
      console.log('ゲストユーザー: ステータス更新スキップ:', { mealRecordId, status });
      return;
    }
    
    const { error } = await supabase
      .from('meal_records')
      .update({ 
        analysis_status: status,
        updated_at: new Date()
      })
      .eq('id', mealRecordId);
    
    if (error) {
      throw new Error(`ステータス更新に失敗しました: ${error.message}`);
    }
    
    console.log('ステータス更新完了:', { mealRecordId, status });
    
  } catch (error) {
    console.error('ステータス更新失敗:', error);
    throw error;
  }
};

// 完全な食事解析フロー
export const processMealAnalysis = async (
  imageUri: string,
  mealTiming: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  userId: string,
  userProfile: UserProfile
): Promise<{
  mealRecord: MealRecord;
  analysisResult: any;
}> => {
  let mealRecord: MealRecord | null = null;
  
  try {
    console.log('食事解析フロー開始:', { userId, mealTiming });
    
    // Step 1: まず食べ物判定を行う
    console.log('食べ物判定開始');
    const { detectFoodInImage, generateNonFoodResponse } = await import('./openai');
    
    let foodDetection;
    try {
      foodDetection = await detectFoodInImage(imageUri);
    } catch (error) {
      console.error('食べ物判定でエラー発生:', error);
      // 判定エラーの場合は食べ物以外として処理
      foodDetection = {
        isFood: false,
        detectedObject: 'unclear',
        confidence: 0.5,
        description: '判定エラーが発生しました'
      };
    }
    
    // Step 2: 食べ物以外の場合は即座にユーモラスなレスポンスを返す
    console.log('食べ物判定結果:', foodDetection);
    if (!foodDetection.isFood) {
      console.log('食べ物以外を検出:', foodDetection.detectedObject);
      
      // 画像をアップロードして記録は作成する（履歴に残すため）
      const imagePath = await uploadMealImage(imageUri, userId);
      mealRecord = await createMealRecord(userId, imagePath, mealTiming);
      
      // ユーモラスなレスポンスを生成
      const nonFoodResponse = generateNonFoodResponse(foodDetection.detectedObject || 'object');
      
      // 特別な解析結果として保存
      await saveAnalysisResult(
        mealRecord.id, 
        nonFoodResponse, 
        JSON.stringify(nonFoodResponse)
      );
      
      console.log('食べ物以外の解析完了:', mealRecord.id);
      
      return {
        mealRecord,
        analysisResult: nonFoodResponse
      };
    }
    
    // Step 3: 食べ物の場合は通常の解析フローを続行
    console.log('食べ物を検出、通常解析開始');
    
    // Step 4: 画像をプライベートStorageにアップロード
    const imagePath = await uploadMealImage(imageUri, userId);
    
    // Step 5: 食事記録を作成
    mealRecord = await createMealRecord(userId, imagePath, mealTiming);
    
    // Step 6: 解析開始をログ出力
    console.log('AI解析開始:', mealRecord.id);
    
    // Step 7: AI解析を実行（元の画像URIを使用）
    const analysisResult = await analyzeFoodImage(imageUri, userProfile);
    
    // Step 8: 解析結果を保存（この中でステータスが'completed'に更新される）
    await saveAnalysisResult(
      mealRecord.id, 
      analysisResult, 
      JSON.stringify(analysisResult)
    );
    
    console.log('食事解析フロー完了:', mealRecord.id);
    
    return {
      mealRecord,
      analysisResult
    };
    
  } catch (error) {
    console.error('食事解析フロー失敗:', error);
    
    // エラー時はステータスを失敗に更新
    if (mealRecord) {
      await updateMealRecordStatus(mealRecord.id, 'failed');
    }
    
    throw error;
  }
};

// ユーザーの食事記録一覧を取得（署名付きURL付き）
export const getUserMealRecords = async (
  userId: string,
  limit: number = 10,
  offset: number = 0
): Promise<(MealRecord & { signedImageUrl?: string })[]> => {
  try {
    const { data, error } = await supabase
      .from('meal_records')
      .select('*')
      .eq('user_id', userId)
      .order('taken_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw new Error(`食事記録の取得に失敗しました: ${error.message}`);
    }
    
    // 各記録に署名付きURLを追加
    const recordsWithSignedUrls = await Promise.all(
      (data as MealRecord[]).map(async (record) => {
        try {
          // image_urlがStorageパスの場合のみ署名付きURLを生成
          if (record.image_url && !record.image_url.startsWith('data:')) {
            const signedUrl = await getSignedImageUrl(record.image_url);
            return { ...record, signedImageUrl: signedUrl };
          }
          return record;
        } catch (error) {
          console.warn('署名付きURL生成失敗:', record.id, error);
          return record;
        }
      })
    );
    
    return recordsWithSignedUrls;
    
  } catch (error) {
    console.error('食事記録取得失敗:', error);
    throw error;
  }
};

// 今日の食事記録数を取得（無料版制限チェック用）
export const getTodayMealCount = async (userId: string): Promise<number> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { count, error } = await supabase
      .from('meal_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('taken_at', today)
      .lt('taken_at', tomorrow);
    
    if (error) {
      throw new Error(`今日の食事記録数の取得に失敗しました: ${error.message}`);
    }
    
    return count || 0;
    
  } catch (error) {
    console.error('今日の食事記録数取得失敗:', error);
    return 0;
  }
};

// デフォルトユーザープロフィール
const DEFAULT_USER_PROFILE: ExtendedUserProfile = {
  beautyCategories: ['skin_care'],
  beautyLevel: 'intermediate',
  weeklyGoalScore: 70,
  dailyMealGoal: 3,
  notifications: {
    meal: true,
    analysis: true,
    weekly: true,
  },
};

// ユーザープロフィール管理
export const UserProfileService = {
  // プロフィール取得
  async getProfile(): Promise<ExtendedUserProfile> {
    try {
      const stored = await AsyncStorage.getItem('userProfile');
      if (stored) {
        return { ...DEFAULT_USER_PROFILE, ...JSON.parse(stored) };
      }
      return DEFAULT_USER_PROFILE;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return DEFAULT_USER_PROFILE;
    }
  },

  // プロフィール保存
  async saveProfile(profile: Partial<ExtendedUserProfile>): Promise<void> {
    try {
      const current = await this.getProfile();
      const updated = { ...current, ...profile };
      await AsyncStorage.setItem('userProfile', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  },

  // 美容カテゴリー更新
  async updateBeautyCategories(categories: string[]): Promise<void> {
    await this.saveProfile({ beautyCategories: categories });
  },

  // 美容スタイル更新
  async updateBeautyLevel(level: 'beginner' | 'intermediate' | 'advanced'): Promise<void> {
    await this.saveProfile({ beautyLevel: level });
  },

  // 美容目標更新
  async updateBeautyGoals(weeklyGoalScore: number, dailyMealGoal: number): Promise<void> {
    await this.saveProfile({ weeklyGoalScore, dailyMealGoal });
  },

  // 通知設定更新
  async updateNotifications(notifications: ExtendedUserProfile['notifications']): Promise<void> {
    await this.saveProfile({ notifications });
  },
};

// 食事記録管理
export const MealService = {
  // 食事記録保存
  async saveMealRecord(record: Omit<MealRecord, 'id'>): Promise<string> {
    try {
      const id = Date.now().toString();
      const mealRecord: MealRecord = { ...record, id };
      
      const stored = await AsyncStorage.getItem('mealRecords');
      const records: MealRecord[] = stored ? JSON.parse(stored) : [];
      records.unshift(mealRecord);
      
      // 最新100件のみ保持
      const trimmedRecords = records.slice(0, 100);
      await AsyncStorage.setItem('mealRecords', JSON.stringify(trimmedRecords));
      
      return id;
    } catch (error) {
      console.error('Error saving meal record:', error);
      throw error;
    }
  },

  // 食事記録取得
  async getMealRecords(limit?: number): Promise<MealRecord[]> {
    try {
      const stored = await AsyncStorage.getItem('mealRecords');
      const records: MealRecord[] = stored ? JSON.parse(stored) : [];
      
      // 日付でソート（新しい順）
      records.sort((a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime());
      
      return limit ? records.slice(0, limit) : records;
    } catch (error) {
      console.error('Error getting meal records:', error);
      return [];
    }
  },

  // 特定の食事記録取得
  async getMealRecord(id: string): Promise<MealRecord | null> {
    try {
      const records = await this.getMealRecords();
      return records.find(record => record.id === id) || null;
    } catch (error) {
      console.error('Error getting meal record:', error);
      return null;
    }
  },

  // 食事記録削除
  async deleteMealRecord(id: string): Promise<void> {
    try {
      const records = await this.getMealRecords();
      const filteredRecords = records.filter(record => record.id !== id);
      await AsyncStorage.setItem('mealRecords', JSON.stringify(filteredRecords));
    } catch (error) {
      console.error('Error deleting meal record:', error);
      throw error;
    }
  },

  // 週間統計取得
  async getWeeklyStats(): Promise<{
    averageScore: number;
    totalMeals: number;
    categoryScores: { [key: string]: number };
  }> {
    try {
      const records = await this.getMealRecords();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weeklyRecords = records.filter(
        record => new Date(record.taken_at) >= oneWeekAgo
      );
      
      if (weeklyRecords.length === 0) {
        return { averageScore: 0, totalMeals: 0, categoryScores: {} };
      }
      
      const totalScore = weeklyRecords.reduce((sum, record) => sum + (record.analysisResult?.beauty_score?.overall || 0), 0);
      const averageScore = Math.round(totalScore / weeklyRecords.length);
      
      // カテゴリー別スコア計算（解析結果がある場合）
      const categoryScores: { [key: string]: number } = {};
      const categoryNames = ['skin_care', 'anti_aging', 'detox', 'circulation', 'hair_nails'];
      
      categoryNames.forEach(category => {
        const scores = weeklyRecords
          .filter(record => record.analysisResult?.beauty_score?.[category])
          .map(record => record.analysisResult.beauty_score[category]);
        
        if (scores.length > 0) {
          categoryScores[category] = Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length
          );
        }
      });
      
      return {
        averageScore,
        totalMeals: weeklyRecords.length,
        categoryScores,
      };
    } catch (error) {
      console.error('Error getting weekly stats:', error);
      return { averageScore: 0, totalMeals: 0, categoryScores: {} };
    }
  },
};

// 美容カテゴリーの定義
export const BEAUTY_CATEGORIES = [
  { id: 'skin_care', name: '美肌', icon: '✨', description: 'ハリ・ツヤ・透明感' },
  { id: 'anti_aging', name: 'アンチエイジング', icon: '🌟', description: '細胞レベルでの老化防止' },
  { id: 'detox', name: 'デトックス', icon: '🌿', description: '体内浄化・代謝促進' },
  { id: 'circulation', name: '血行促進', icon: '💓', description: '血流改善・冷え性対策' },
  { id: 'hair_nails', name: '髪・爪の健康', icon: '💇‍♀️', description: 'ケラチン生成・毛髪成長' },
];

// 美容スタイルの定義
export const BEAUTY_LEVELS = [
  { 
    id: 'beginner', 
    label: 'ライトケア派', 
    description: '気軽に美容を楽しみたい方におすすめ' 
  },
  { 
    id: 'intermediate', 
    label: 'バランス重視派', 
    description: '美容と生活のバランスを大切にする方' 
  },
  { 
    id: 'advanced', 
    label: 'こだわり美容派', 
    description: '美容への関心が高く、詳しい情報を求める方' 
  },
];

export default { UserProfileService, MealService }; 