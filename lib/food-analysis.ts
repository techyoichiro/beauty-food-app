import * as FileSystem from 'expo-file-system';
import { openai, createFoodAnalysisPrompt } from './openai';
import { supabase } from './supabase';

// 型定義
export interface DetectedFood {
  name: string;
  category: 'protein' | 'carb' | 'vegetable' | 'fruit' | 'fat' | 'spice' | 'sauce' | 'other';
  estimated_amount: string;
  confidence: number;
}

export interface NutritionAnalysis {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  vitamins: {
    vitamin_c: number;
    vitamin_e: number;
    vitamin_a: number;
    vitamin_b_complex: number;
  };
  minerals: {
    iron: number;
    zinc: number;
    calcium: number;
    magnesium: number;
  };
}

export interface BeautyScore {
  skin_care: number;
  anti_aging: number;
  detox: number;
  circulation: number;
  hair_nails: number;
  overall: number;
}

export interface FoodAnalysisResult {
  detected_foods: DetectedFood[];
  nutrition_analysis: NutritionAnalysis;
  beauty_score: BeautyScore;
  immediate_advice: string;
  next_meal_advice: string;
  beauty_benefits: string[];
  // 食べ物以外の場合のプロパティ（オプショナル）
  is_food?: boolean;
  detected_object?: string;
  humorous_message?: string;
  suggestion?: string;
}

export interface UserProfile {
  beautyCategories: string[];
  beautyLevel: 'beginner' | 'intermediate' | 'advanced';
}

// 画像をリサイズしてbase64に変換する関数（コスト削減）
const convertImageToBase64 = async (imageUri: string, maxImageSize: number, imageQuality: number): Promise<string> => {
  try {
    console.log('画像処理開始:', { imageUri: imageUri.substring(0, 50), maxImageSize, imageQuality });

    // URIの検証
    if (!imageUri || imageUri.trim() === '') {
      throw new Error('画像URIが無効です');
    }

    // 外部URLの場合は一度ローカルにダウンロード
    let processImageUri = imageUri;
    if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
      console.log('外部画像をダウンロード中...');
      const downloadResult = await FileSystem.downloadAsync(
        imageUri,
        FileSystem.documentDirectory + 'temp_image.jpg'
      );
      processImageUri = downloadResult.uri;
    }

    // 一時的にリサイズを無効化し、元の画像をそのまま使用
    console.log('画像処理完了（リサイズスキップ）:', { 
      originalUri: processImageUri.substring(0, 50)
    });

    // base64に変換
    const base64 = await FileSystem.readAsStringAsync(processImageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // base64の検証
    if (!base64 || base64.length === 0) {
      throw new Error('画像のbase64変換に失敗しました');
    }

    // 外部URLからダウンロードした一時ファイルを削除
    try {
      if (processImageUri !== imageUri) {
        await FileSystem.deleteAsync(processImageUri, { idempotent: true });
      }
    } catch (deleteError) {
      console.warn('一時ファイル削除失敗:', deleteError);
    }

    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('画像変換エラー:', error);
    
    // より具体的なエラーメッセージ
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('No such file')) {
      throw new Error('画像ファイルが見つかりません。もう一度撮影してください。');
    } else if (errorMessage.includes('permission')) {
      throw new Error('画像ファイルへのアクセス権限がありません。');
    } else if (errorMessage.includes('memory') || errorMessage.includes('Memory')) {
      throw new Error('画像が大きすぎます。もう一度撮影してください。');
    } else {
      throw new Error('画像の処理に失敗しました。もう一度お試しください。');
    }
  }
};

// 信頼度スコアの平均を計算
const calculateAverageConfidence = (foods: DetectedFood[]): number => {
  if (foods.length === 0) return 0;
  const totalConfidence = foods.reduce((sum, food) => sum + food.confidence, 0);
  return totalConfidence / foods.length;
};

// 戦略的品質設定（フリーミアムモデル）
interface AnalysisConfig {
  imageQuality: number;
  imageDetail: 'low' | 'high';
  model: 'gpt-4o-mini' | 'gpt-4o';
  maxImageSize: number;
}

// ユーザータイプ別の品質設定
const getAnalysisConfig = (isPremium: boolean): AnalysisConfig => {
  if (isPremium) {
    // 課金ユーザー: 最高品質・詳細分析
    return {
      imageQuality: 0.9,        // 最高品質（90%）
      imageDetail: 'high',      // 高解像度解析
      model: 'gpt-4o',          // 最新・最高性能モデル（詳細食材検出に優秀）
      maxImageSize: 1536        // 大きなサイズ（詳細分析のため）
    };
  } else {
    // 無料ユーザー: 良品質（課金への誘導品質）
    return {
      imageQuality: 0.7,        // 良品質（70%）- 改善された品質
      imageDetail: 'low',       // 低解像度（コスト削減）
      model: 'gpt-4o-mini',     // コスト効率の良いモデル
      maxImageSize: 768         // 適度なサイズ（品質向上のため増加）
    };
  }
};

// OpenAI APIで食事を解析
export const analyzeFoodImage = async (
  imageUri: string, 
  isPremium: boolean = false,
  userProfile?: UserProfile
): Promise<FoodAnalysisResult> => {
  try {
    console.log('🍽️ 食事解析開始:', { isPremium, imageUri: imageUri.substring(0, 50) + '...' });
    
    // ユーザータイプに応じた設定を取得
    const config = getAnalysisConfig(isPremium);
    console.log('📊 解析設定:', config);

    // 画像をリサイズしてbase64に変換
    const base64Image = await convertImageToBase64(imageUri, config.maxImageSize, config.imageQuality);
    console.log('🖼️ 画像処理完了:', { 
      size: `${config.maxImageSize}px`, 
      quality: `${config.imageQuality * 100}%`,
      model: config.model 
    });

    // OpenAI APIで解析
    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: "system",
          content: "あなたは美容栄養学の専門家です。必ず有効なJSON形式でのみ回答してください。日本語のテキストや説明は一切含めず、純粋なJSONオブジェクトのみを返してください。"
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: createFoodAnalysisPrompt({
                beautyCategories: userProfile?.beautyCategories || ['skin_care'],
                beautyLevel: userProfile?.beautyLevel || 'intermediate'
              }) 
            },
            { 
              type: "image_url", 
              image_url: { 
                url: base64Image,
                detail: config.imageDetail
              } 
            }
          ]
        }
      ],
      max_tokens: isPremium ? 2000 : 1500, // プレミアムユーザーはより詳細な分析
      temperature: 0.3,
      response_format: { type: "json_object" } // JSON形式を強制
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('AIからの応答が空です');
    }
    
    console.log('AI応答の最初の100文字:', content.substring(0, 100));
    
    // JSONをパース（エラーハンドリング強化）
    let analysisResult: FoodAnalysisResult;
    try {
      analysisResult = JSON.parse(content);
      console.log('JSON解析成功');
    } catch (parseError) {
      console.error('JSON解析エラー:', parseError);
      console.error('問題のある応答:', content);
      
      // JSON解析に失敗した場合は明確なエラーを投げる
      throw new Error('AI解析の結果を正しく処理できませんでした。もう一度お試しください。');
    }
    
    // 結果の検証
    if (!analysisResult.detected_foods || !analysisResult.nutrition_analysis) {
      throw new Error('解析結果の形式が正しくありません');
    }
    
    console.log('食事解析完了:', {
      foodsCount: analysisResult.detected_foods.length,
      overallScore: analysisResult.beauty_score.overall
    });
    
    return analysisResult;
    
  } catch (error) {
    console.error('食事解析に失敗:', error);
    throw error;
  }
};

// 解析結果をSupabaseに保存（ゲストユーザー対応）
export const saveAnalysisResult = async (
  mealRecordId: string,
  analysisResult: FoodAnalysisResult,
  rawResponse: string
): Promise<void> => {
  try {
    // ゲストユーザーの場合はデータベース保存をスキップ
    if (mealRecordId.startsWith('guest_')) {
      console.log('ゲストユーザー: 解析結果保存スキップ:', mealRecordId);
      return;
    }
    
    // ai_analysis_resultsテーブルに保存
    const { error: analysisError } = await supabase
      .from('ai_analysis_results')
      .insert({
        meal_record_id: mealRecordId,
        detected_foods: analysisResult.detected_foods,
        nutrition_analysis: analysisResult.nutrition_analysis,
        raw_ai_response: rawResponse,
        confidence_score: calculateAverageConfidence(analysisResult.detected_foods)
      });
    
    if (analysisError) {
      throw analysisError;
    }
    
    // advice_recordsテーブルに保存
    const adviceRecords = [
      {
        meal_record_id: mealRecordId,
        advice_type: 'immediate',
        beauty_category: 'general',
        advice_text: analysisResult.immediate_advice,
        suggested_foods: [],
        nutrition_reasoning: '即座の改善提案'
      },
      {
        meal_record_id: mealRecordId,
        advice_type: 'next_meal',
        beauty_category: 'general',
        advice_text: analysisResult.next_meal_advice,
        suggested_foods: [],
        nutrition_reasoning: '次回食事での改善提案'
      }
    ];
    
    const { error: adviceError } = await supabase
      .from('advice_records')
      .insert(adviceRecords);
    
    if (adviceError) {
      throw adviceError;
    }
    
    // meal_recordsのステータスを更新
    const { error: updateError } = await supabase
      .from('meal_records')
      .update({ analysis_status: 'completed' })
      .eq('id', mealRecordId);
    
    if (updateError) {
      throw updateError;
    }
    
    console.log('解析結果の保存完了');
    
  } catch (error) {
    console.error('解析結果の保存に失敗:', error);
    
    // エラー時はステータスを失敗に更新（ゲストユーザー以外）
    if (!mealRecordId.startsWith('guest_')) {
      await supabase
        .from('meal_records')
        .update({ analysis_status: 'failed' })
        .eq('id', mealRecordId);
    }
    
    throw error;
  }
};

export default {
  analyzeFoodImage,
  saveAnalysisResult
}; 