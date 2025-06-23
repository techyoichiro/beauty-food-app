import { openai, createFoodAnalysisPrompt } from './openai';
import { supabase } from './supabase';

// 型定義
export interface DetectedFood {
  name: string;
  category: 'protein' | 'carb' | 'vegetable' | 'fruit' | 'fat' | 'other';
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
}

export interface UserProfile {
  beautyCategories: string[];
  beautyLevel: 'beginner' | 'intermediate' | 'advanced';
}

// 画像をbase64に変換する関数
const convertImageToBase64 = async (imageUri: string): Promise<string> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error('画像の変換に失敗しました');
  }
};

// 信頼度スコアの平均を計算
const calculateAverageConfidence = (foods: DetectedFood[]): number => {
  if (foods.length === 0) return 0;
  const totalConfidence = foods.reduce((sum, food) => sum + food.confidence, 0);
  return totalConfidence / foods.length;
};

// OpenAI APIで食事を解析
export const analyzeFoodImage = async (
  imageUri: string,
  userProfile: UserProfile,
  maxRetries: number = 3
): Promise<FoodAnalysisResult> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`食事解析開始 (試行 ${attempt}/${maxRetries})`);
      
      // 画像をbase64に変換
      const base64Image = await convertImageToBase64(imageUri);
      
      // プロンプトを生成
      const prompt = createFoodAnalysisPrompt(userProfile);
      
      // OpenAI APIを呼び出し
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // gpt-4-vision-preview の後継モデル
        messages: [
          {
            role: "system",
            content: "あなたは美容栄養学の専門家です。必ず有効なJSON形式でのみ回答してください。日本語のテキストや説明は一切含めず、純粋なJSONオブジェクトのみを返してください。"
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { 
                type: "image_url", 
                image_url: { 
                  url: base64Image,
                  detail: "high" // 高解像度で解析
                } 
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.3, // 一貫性のある結果を得るため低めに設定
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
      lastError = error as Error;
      console.error(`解析失敗 (試行 ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) {
        break;
      }
      
      // 指数バックオフでリトライ
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`${delay}ms後にリトライします...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`食事解析に失敗しました: ${lastError?.message}`);
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