import { supabase } from './supabase';
import { analyzeFoodImage, saveAnalysisResult, UserProfile } from './food-analysis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BeautyStatsService from './beauty-stats-service';

export interface ExtendedUserProfile extends UserProfile {
  weeklyGoalScore: number;
  dailyMealGoal: number;
  notifications: {
    meal: boolean;
    analysis: boolean;
    weekly: boolean;
  };
  autoMealTiming: boolean; // 食事タイミング自動選択設定
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
  signedImageUrl?: string; // 署名付きURL（オプショナル）
  ai_analysis_results?: any[]; // データベースからの関連データ（オプショナル）
  advice_records?: any[]; // データベースからの関連データ（オプショナル）
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
    
    // React Nativeでの画像処理準備
    console.log('🔄 React Native画像処理開始:', {
      imageUri: imageUri.substring(0, 100) + '...',
      isDataUrl: imageUri.startsWith('data:')
    });
    
    // ファイル名を生成（ユーザーフォルダ内）
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `${userId}/${timestamp}_${randomId}.jpg`;
    
    // プライベートStorageにアップロード
    console.log('📤 ファイルアップロード試行:', {
      bucket: 'meal-images',
      fileName: fileName,
      userId: userId,
      method: 'Uint8Array'
    });
    
    // React NativeでのBlobアップロードに問題があるため、常にUint8Arrayアプローチを使用
    let data, error;
    
    console.log('🔄 Uint8Arrayアプローチでアップロード実行');
    
    if (!imageUri.startsWith('data:')) {
      // ファイルURIの場合、Base64として読み取り直接アップロード
      const { readAsStringAsync, EncodingType } = await import('expo-file-system');
      const base64Data = await readAsStringAsync(imageUri, {
        encoding: EncodingType.Base64,
      });
      
      // Base64文字列を直接Uint8Arrayに変換
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log('🔄 Uint8Array変換完了:', {
        originalBase64Length: base64Data.length,
        uint8ArrayLength: bytes.length,
        fileSizeMB: (bytes.length / (1024 * 1024)).toFixed(2)
      });
      
      // Uint8ArrayでアップロードATP
      const uploadResult = await supabase.storage
        .from('meal-images')
        .upload(fileName, bytes, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });
      
      data = uploadResult.data;
      error = uploadResult.error;
    } else {
      // すでにBase64の場合
      const base64Data = imageUri.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log('🔄 Base64 -> Uint8Array変換完了:', {
        base64Length: base64Data.length,
        uint8ArrayLength: bytes.length,
        fileSizeMB: (bytes.length / (1024 * 1024)).toFixed(2)
      });
      
      const uploadResult = await supabase.storage
        .from('meal-images')
        .upload(fileName, bytes, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });
      
      data = uploadResult.data;
      error = uploadResult.error;
    }
    
    console.log('📤 アップロード試行結果:', {
      success: !error,
      dataPath: data?.path,
      errorMessage: error?.message,
      errorDetails: error,
      method: 'Uint8Array'
    });
    
    if (error) {
      console.error('❌ プライベートアップロードエラー:', {
        error: error,
        message: error.message,
        fileName: fileName,
        bucket: 'meal-images'
      });
      
      // Storageアップロード失敗時はBase64で代替
      console.log('🔄 Storageアップロード失敗、Base64で代替保存');
      
      try {
        // React Native用のBase64変換
        if (imageUri.startsWith('data:')) {
          // すでにBase64の場合はそのまま返す
          console.log('✅ Base64代替保存完了（既にBase64形式）');
          return imageUri;
        } else {
          // ファイルURIをBase64に変換
          const { readAsStringAsync, EncodingType } = await import('expo-file-system');
          const base64Data = await readAsStringAsync(imageUri, {
            encoding: EncodingType.Base64,
          });
          const dataUrl = `data:image/jpeg;base64,${base64Data}`;
          console.log('✅ Base64代替保存完了（ファイルから変換）');
          return dataUrl;
        }
      } catch (base64Error) {
        console.error('Base64代替保存も失敗:', base64Error);
        throw new Error('画像の保存に失敗しました。ネットワーク接続を確認してください。');
      }
    }
    
    // アップロード直後にファイル存在確認
    try {
      console.log('🔍 アップロード後のファイル存在確認中...');
      const { data: listData, error: listError } = await supabase.storage
        .from('meal-images')
        .list(userId, {
          limit: 100,
          search: fileName.split('/')[1] // ファイル名のみで検索
        });
      
      if (listError) {
        console.warn('⚠️ ファイル一覧取得エラー:', listError);
      } else {
        const uploadedFile = listData?.find(file => file.name === fileName.split('/')[1]);
        console.log('📁 アップロード後のファイル確認:', {
          fileName: fileName,
          fileFound: !!uploadedFile,
          fileInfo: uploadedFile ? {
            name: uploadedFile.name,
            size: uploadedFile.metadata?.size,
            contentType: uploadedFile.metadata?.mimetype,
            lastModified: uploadedFile.updated_at
          } : null,
          totalFilesInDir: listData?.length || 0
        });
      }
    } catch (verificationError) {
      console.warn('ファイル存在確認でエラー:', verificationError);
    }
    
    // プライベートファイルのパスを返す（URLではなくパス）
    console.log('プライベート画像アップロード完了:', data?.path);
    return data?.path || '';
    
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
    console.log('🔗 署名付きURL生成開始:', {
      imagePath,
      expiresIn,
      bucket: 'meal-images'
    });
    
    const { data, error } = await supabase.storage
      .from('meal-images')
      .createSignedUrl(imagePath, expiresIn);
    
    if (error) {
      console.error('❌ 署名付きURL取得エラー:', {
        error,
        message: error.message,
        imagePath
      });
      
      // ファイル存在確認
      try {
        const pathParts = imagePath.split('/');
        const userId = pathParts[0];
        const fileName = pathParts[1];
        
        const { data: listData, error: listError } = await supabase.storage
          .from('meal-images')
          .list(userId, { limit: 100 });
        
        console.log('🔍 ファイル存在確認結果:', {
          imagePath,
          userId,
          fileName,
          listError: listError?.message,
          filesFound: listData?.length || 0,
          targetFileExists: listData?.some(file => file.name === fileName),
          allFiles: listData?.map(file => ({
            name: file.name,
            size: file.metadata?.size,
            contentType: file.metadata?.mimetype
          }))
        });
      } catch (listingError) {
        console.error('ファイル存在確認中にエラー:', listingError);
      }
      
      throw new Error(`署名付きURLの取得に失敗しました: ${error.message}`);
    }
    
    console.log('✅ 署名付きURL生成成功:', {
      imagePath,
      signedUrlLength: data.signedUrl.length
    });
    
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
    // まず、usersテーブルから実際のuser.idを取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .single();
    
    if (userError || !userData) {
      console.error('ユーザーレコード取得エラー:', userError);
      throw new Error(`ユーザーが見つかりません: ${userError?.message}`);
    }
    
    const { data, error } = await supabase
      .from('meal_records')
      .insert({
        user_id: userData.id, // usersテーブルの実際のIDを使用
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

// AI解析のみを実行（保存は別関数で）
export const analyzeMealImage = async (
  imageUri: string,
  userProfile: UserProfile,
  isPremium: boolean = false
): Promise<any> => {
  try {
    console.log('食事AI解析開始（保存なし）');
    
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
      
      // ユーモラスなレスポンスを生成
      const nonFoodResponse = generateNonFoodResponse(foodDetection.detectedObject || 'object');
      
      console.log('食べ物以外の解析完了');
      return nonFoodResponse;
    }
    
    // Step 3: 食べ物の場合は通常の解析フローを続行
    console.log('食べ物を検出、AI解析開始');
    
    // Step 4: AI解析を実行
    const { analyzeFoodImage: analyzeFood } = await import('./openai');
    const analysisResult = await analyzeFood(imageUri, userProfile);
    
    console.log('AI解析完了');
    return analysisResult;
    
  } catch (error) {
    console.error('食事AI解析失敗:', error);
    throw error;
  }
};

// 解析結果を履歴に保存
export const saveMealToHistory = async (
  imageUri: string,
  mealTiming: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  userId: string,
  analysisResult: any,
  isPremium: boolean = false
): Promise<MealRecord> => {
  try {
    console.log('食事履歴保存開始:', { userId, mealTiming });
    
    // Step 1: 画像をStorageにアップロード
    const imagePath = await uploadMealImage(imageUri, userId);
    
    // Step 2: 食事記録を作成
    const mealRecord = await createMealRecord(userId, imagePath, mealTiming);
    
    // Step 3: 解析結果を保存
    const { saveAnalysisResult } = await import('./food-analysis');
    await saveAnalysisResult(
      mealRecord.id, 
      analysisResult, 
      JSON.stringify(analysisResult)
    );
    
    // Step 4: プレミアムユーザーの場合は美容統計を更新
    if (isPremium && !userId.startsWith('guest_')) {
      try {
        const BeautyStatsService = await import('./beauty-stats-service');
        await BeautyStatsService.default.updateDailyStats(userId, analysisResult);
        console.log('美容統計更新完了:', mealRecord.id);
      } catch (statsError) {
        console.error('美容統計更新エラー:', statsError);
        // 美容統計の更新失敗は保存フロー全体を失敗させない
      }
    }
    
    console.log('食事履歴保存完了:', mealRecord.id);
    return mealRecord;
    
  } catch (error) {
    console.error('食事履歴保存失敗:', error);
    throw error;
  }
};

// 完全な食事解析フロー（後方互換性のため残す）
export const processMealAnalysis = async (
  imageUri: string,
  mealTiming: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  userId: string,
  userProfile: UserProfile,
  isPremium: boolean = false
): Promise<{
  mealRecord: MealRecord;
  analysisResult: any;
}> => {
  try {
    console.log('食事解析フロー開始（新しいAPI使用）:', { userId, mealTiming });
    
    // Step 1: AI解析のみ実行
    const analysisResult = await analyzeMealImage(imageUri, userProfile, isPremium);
    
    // Step 2: 履歴に保存
    const mealRecord = await saveMealToHistory(imageUri, mealTiming, userId, analysisResult, isPremium);
    
    console.log('食事解析フロー完了:', mealRecord.id);
    
    return {
      mealRecord,
      analysisResult
    };
    
  } catch (error) {
    console.error('食事解析フロー失敗:', error);
    throw error;
  }
};

// ユーザーの食事記録一覧を取得（署名付きURL付き）
export const getUserMealRecords = async (
  userId: string,
  limit: number = 10,
  offset: number = 0
): Promise<MealRecord[]> => {
  try {
    // まず、usersテーブルから実際のuser.idを取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .single();
    
    if (userError || !userData) {
      console.error('ユーザーレコード取得エラー:', userError);
      return []; // ユーザーが見つからない場合は空配列を返す
    }
    
    const { data, error } = await supabase
      .from('meal_records')
      .select(`
        *,
        ai_analysis_results (
          detected_foods,
          nutrition_analysis,
          confidence_score
        ),
        advice_records (
          advice_type,
          advice_text
        )
      `)
      .eq('user_id', userData.id) // usersテーブルの実際のIDを使用
      .order('taken_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw new Error(`食事記録の取得に失敗しました: ${error.message}`);
    }
    
    // 各記録に署名付きURLと解析結果を追加
    const recordsWithSignedUrls = await Promise.all(
      (data as any[]).map(async (record) => {
        try {
          let processedRecord = { ...record };
          
          // image_urlの処理（署名付きURL生成またはBase64使用）
          if (record.image_url) {
            if (record.image_url.startsWith('data:')) {
              // Base64データの場合はそのまま使用
              processedRecord.signedImageUrl = record.image_url;
              console.log('📝 Base64画像使用:', record.id);
            } else {
              // Storageパスの場合は署名付きURLを生成を試行
              try {
                console.log('🔗 署名付きURL生成試行:', {
                  recordId: record.id,
                  imagePath: record.image_url
                });
                const signedUrl = await getSignedImageUrl(record.image_url, 7200); // 2時間有効
                processedRecord.signedImageUrl = signedUrl;
                console.log('✅ 署名付きURL生成成功:', record.id);
              } catch (urlError) {
                console.warn('⚠️ 署名付きURL生成失敗、フォールバック使用:', {
                  recordId: record.id,
                  imagePath: record.image_url,
                  error: urlError instanceof Error ? urlError.message : String(urlError)
                });
                // フォールバック: プレースホルダー画像またはデフォルト画像を使用
                processedRecord.signedImageUrl = 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=300';
              }
            }
          } else {
            // 画像URLがない場合のフォールバック
            console.warn('⚠️ 画像URLがないレコード:', record.id);
            processedRecord.signedImageUrl = 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=300';
          }
          
          // データベースの構造から解析結果を構築
          console.log('📊 解析データ処理開始:', {
            recordId: record.id,
            hasAiAnalysis: !!record.ai_analysis_results,
            analysisCount: record.ai_analysis_results?.length || 0,
            hasAdviceRecords: !!record.advice_records,
            adviceCount: record.advice_records?.length || 0
          });
          
          if (record.ai_analysis_results && record.ai_analysis_results.length > 0) {
            const analysisData = record.ai_analysis_results[0];
            
            // アドバイスデータを取得
            const immediateAdvice = record.advice_records?.find((advice: any) => advice.advice_type === 'immediate')?.advice_text || '分析結果からアドバイスを生成しています...';
            const nextMealAdvice = record.advice_records?.find((advice: any) => advice.advice_type === 'next_meal')?.advice_text || '次の食事のアドバイスを準備中です...';
            
            console.log('📝 解析データの詳細確認:', {
              recordId: record.id,
              hasNutritionAnalysis: !!analysisData.nutrition_analysis,
              nutritionKeys: Object.keys(analysisData.nutrition_analysis || {}),
              hasBeautyScore: !!analysisData.nutrition_analysis?.beauty_score,
              immediateAdviceLength: immediateAdvice.length,
              nextMealAdviceLength: nextMealAdvice.length
            });
            
            // 美容スコアを取得（ネストした構造に対応）
            let beautyScore;
            if (analysisData.nutrition_analysis?.beauty_score) {
              beautyScore = analysisData.nutrition_analysis.beauty_score;
            } else if (analysisData.beauty_score) {
              beautyScore = analysisData.beauty_score;
            } else {
              // デフォルトスコアを生成
              beautyScore = {
                overall: Math.floor(Math.random() * 40) + 60, // 60-100のランダム値
                skin_care: Math.floor(Math.random() * 30) + 60,
                anti_aging: Math.floor(Math.random() * 30) + 60,
                detox: Math.floor(Math.random() * 30) + 60,
                circulation: Math.floor(Math.random() * 30) + 60,
                hair_nails: Math.floor(Math.random() * 30) + 60
              };
            }
            
            processedRecord.analysisResult = {
              detected_foods: analysisData.detected_foods || [
                { name: '食材を識別中...', category: 'unknown', estimated_amount: '', confidence: 0.5 }
              ],
              nutrition_analysis: analysisData.nutrition_analysis || {
                calories: Math.floor(Math.random() * 400) + 300,
                protein: Math.floor(Math.random() * 20) + 10,
                carbohydrates: Math.floor(Math.random() * 50) + 30,
                fat: Math.floor(Math.random() * 20) + 5
              },
              beauty_score: beautyScore,
              immediate_advice: immediateAdvice,
              next_meal_advice: nextMealAdvice,
              beauty_benefits: [
                '美容効果を分析中です...',
                'しばらくお待ちください'
              ],
              confidence_score: analysisData.confidence_score || 0.8
            };
            
            console.log('構築された解析結果:', {
              recordId: record.id,
              beautyScoreOverall: processedRecord.analysisResult.beauty_score.overall,
              immediateAdvice: processedRecord.analysisResult.immediate_advice.substring(0, 50)
            });
          } else {
            // 解析結果がない場合でもデフォルトの解析結果を設定
            processedRecord.analysisResult = {
              detected_foods: [],
              nutrition_analysis: {},
              beauty_score: {
                overall: 0, // 解析中を示すため0に設定
                skin_care: 0,
                anti_aging: 0,
                detox: 0,
                circulation: 0,
                hair_nails: 0
              },
              immediate_advice: '解析中...',
              next_meal_advice: '解析完了後に表示されます',
              beauty_benefits: [],
              confidence_score: 0
            };
          }
          
          return processedRecord;
        } catch (error) {
          console.warn('レコード処理失敗:', record.id, error);
          // エラーが発生した場合でもデフォルトの解析結果を設定
          return {
            ...record,
            signedImageUrl: record.image_url,
            analysisResult: {
              detected_foods: [],
              nutrition_analysis: {},
              beauty_score: {
                overall: 0,
                skin_care: 0,
                anti_aging: 0,
                detox: 0,
                circulation: 0,
                hair_nails: 0
              },
              immediate_advice: '解析中...',
              next_meal_advice: '解析完了後に表示されます',
              beauty_benefits: [],
              confidence_score: 0
            }
          };
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
  autoMealTiming: true, // デフォルトで自動選択を有効に
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

  // 食事タイミング自動選択設定更新
  async updateAutoMealTiming(autoMealTiming: boolean): Promise<void> {
    await this.saveProfile({ autoMealTiming });
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

// 食事タイミング自動判定関数
export const determineAutoMealTiming = (date?: Date): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
  const now = date || new Date();
  const hour = now.getHours();
  
  if (hour >= 6 && hour < 10) {
    return 'breakfast'; // 朝食: 6時-10時
  } else if (hour >= 11 && hour < 15) {
    return 'lunch'; // 昼食: 11時-15時
  } else if (hour >= 17 && hour < 21) {
    return 'dinner'; // 夕食: 17時-21時
  } else {
    return 'snack'; // 間食: その他の時間
  }
};

export default { UserProfileService, MealService }; 