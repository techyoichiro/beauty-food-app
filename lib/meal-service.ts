import { supabase } from './supabase';
import { analyzeFoodImage, saveAnalysisResult, UserProfile } from './food-analysis';

export interface MealRecord {
  id: string;
  user_id: string;
  image_url: string;
  meal_timing: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_timing_auto: boolean;
  taken_at: string;
  analysis_status: 'pending' | 'analyzing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
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
        meal_timing_auto: false,
        taken_at: new Date().toISOString(),
        analysis_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
        meal_timing_auto: false, // 手動選択
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
  status: 'pending' | 'analyzing' | 'completed' | 'failed'
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
        updated_at: new Date().toISOString()
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
    
    // Step 1: 画像をプライベートStorageにアップロード
    const imagePath = await uploadMealImage(imageUri, userId);
    
    // Step 2: 食事記録を作成
    mealRecord = await createMealRecord(userId, imagePath, mealTiming);
    
    // Step 3: 解析中ステータスに更新
    await updateMealRecordStatus(mealRecord.id, 'analyzing');
    
    // Step 4: AI解析を実行（元の画像URIを使用）
    const analysisResult = await analyzeFoodImage(imageUri, userProfile);
    
    // Step 5: 解析結果を保存（この中でステータスが'completed'に更新される）
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

export default {
  uploadMealImage,
  getSignedImageUrl,
  createMealRecord,
  updateMealRecordStatus,
  processMealAnalysis,
  getUserMealRecords,
  getTodayMealCount
}; 