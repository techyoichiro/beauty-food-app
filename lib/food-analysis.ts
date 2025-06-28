import * as FileSystem from 'expo-file-system';
import { analyzeFoodImage as analyzeFood } from './openai';
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

// 画像変換機能はopenai.tsに統合済み

// 信頼度スコア計算機能はopenai.tsに統合済み

// 分析設定機能はopenai.tsに統合済み

// openai.tsの統合されたanalyzeFood関数を使用する薄いラッパー
export const analyzeFoodImage = async (
  imageUri: string, 
  isPremium: boolean = false,
  userProfile?: UserProfile
): Promise<FoodAnalysisResult> => {
  try {
    console.log('🍽️ food-analysis.ts: openai.tsに処理を委譲', { isPremium });
    
    // openai.tsの統合されたanalyzeFood関数を呼び出し
    const result = await analyzeFood(imageUri, {
      beautyCategories: userProfile?.beautyCategories || ['skin_care'],
      beautyLevel: userProfile?.beautyLevel || 'intermediate'
    });
    
    return result;
  } catch (error) {
    console.error('food-analysis wrapper error:', error);
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
    
    // ai_analysis_resultsテーブルに保存（美容スコアも含める）
    const { error: analysisError } = await supabase
      .from('ai_analysis_results')
      .insert({
        meal_record_id: mealRecordId,
        detected_foods: analysisResult.detected_foods,
        nutrition_analysis: {
          ...analysisResult.nutrition_analysis,
          beauty_score: analysisResult.beauty_score // 美容スコアも栄養分析に含める
        },
        raw_ai_response: rawResponse,
        confidence_score: analysisResult.detected_foods.reduce((sum: number, food: any) => sum + (food.confidence || 0), 0) / analysisResult.detected_foods.length || 0
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