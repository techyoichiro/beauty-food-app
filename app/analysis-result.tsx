import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, TrendingUp, Utensils, Lightbulb, HelpCircle } from 'lucide-react-native';
import { FoodAnalysisResult, DetectedFood } from '../lib/food-analysis';
import PremiumModal from '../components/PremiumModal';
import { useAuth } from '../contexts/AuthContext';

// 統合された解析結果型（FoodAnalysisResultに全て含まれるように修正）
type AnalysisResult = FoodAnalysisResult;

export default function AnalysisResultScreen() {
  const { mealRecordId, analysisResult, imageUri, isPremium, isFromAlbum, selectedDateTime, mealTiming } = useLocalSearchParams();
  const { user, isPremium: authIsPremium } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [currentImageUri, setCurrentImageUri] = useState<string>('');
  const [currentIsPremium, setCurrentIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // 実際のプレミアム状態を計算（AuthContextの状態を優先）
  const actualIsPremium = authIsPremium || currentIsPremium || isPremium === 'true';

  // AuthContextのプレミアム状態が変更された時にローカル状態も更新
  useEffect(() => {
    if (authIsPremium && !currentIsPremium) {
      console.log('🔄 AuthContextのプレミアム状態変更を検出、ローカル状態を更新');
      setCurrentIsPremium(true);
    }
  }, [authIsPremium]);

  // デバッグ用：プレミアム状態をログ出力
  useEffect(() => {
    console.log('🎯 プレミアム状態デバッグ:', {
      authIsPremium,
      currentIsPremium,
      isPremiumParam: isPremium,
      actualIsPremium
    });
  }, [authIsPremium, currentIsPremium, isPremium, actualIsPremium]);

  useEffect(() => {
    const loadAnalysisResult = async () => {
      console.log('📊 解析結果画面: パラメータ受信', {
        hasAnalysisResult: !!analysisResult,
        hasImageUri: !!imageUri,
        isPremium,
        analysisResultType: typeof analysisResult,
        analysisResultLength: typeof analysisResult === 'string' ? analysisResult.length : 0
      });

      // まず、パラメータから解析結果を取得を試行
      if (analysisResult && typeof analysisResult === 'string') {
        try {
          const parsedData = JSON.parse(analysisResult);
          console.log('✅ 解析データ解析成功:', {
            detectedFoodsCount: parsedData.detected_foods?.length || 0,
            overallScore: parsedData.beauty_score?.overall || 0
          });
          
          // AsyncStorageに保存（次回のために）
          await AsyncStorage.setItem('latest_analysis_result', analysisResult);
          await AsyncStorage.setItem('latest_analysis_image', typeof imageUri === 'string' ? imageUri : '');
          await AsyncStorage.setItem('latest_analysis_premium', isPremium === 'true' ? 'true' : 'false');
          
          // 現在の状態を更新（AuthContextの状態も考慮）
          setCurrentImageUri(typeof imageUri === 'string' ? imageUri : '');
          setCurrentIsPremium(authIsPremium || isPremium === 'true');
          
          setAnalysis(parsedData);
          setLoading(false);
          return;
        } catch (error) {
          console.error('❌ 解析データのパースに失敗:', error);
          console.error('問題のあるデータ:', analysisResult.substring(0, 200));
        }
      }

      // パラメータから取得できない場合は、AsyncStorageから復元を試行
      try {
        console.log('🔄 AsyncStorageから解析結果を復元中...');
        const savedResult = await AsyncStorage.getItem('latest_analysis_result');
        const savedImageUri = await AsyncStorage.getItem('latest_analysis_image');
        const savedIsPremium = await AsyncStorage.getItem('latest_analysis_premium');
        
        if (savedResult) {
          const parsedData = JSON.parse(savedResult);
          console.log('✅ 保存済み解析データを復元:', {
            detectedFoodsCount: parsedData.detected_foods?.length || 0,
            overallScore: parsedData.beauty_score?.overall || 0
          });
          
          // 状態を復元（AuthContextの状態も考慮）
          setCurrentImageUri(savedImageUri || '');
          setCurrentIsPremium(authIsPremium || savedIsPremium === 'true');
          setAnalysis(parsedData);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('❌ AsyncStorageからの復元に失敗:', error);
      }

      // 最後の手段: mealRecordIdがある場合はダミーデータで表示
      if (mealRecordId) {
        console.log('📝 mealRecordIdがあるためダミーデータで表示:', mealRecordId);
        
        // 履歴からのアクセス用のダミーデータを生成
        const dummyAnalysis: AnalysisResult = {
          detected_foods: [
            { name: '食材を再分析中', category: 'unknown', estimated_amount: '-', confidence: 0.8 }
          ],
          nutrition_analysis: {
            calories: Math.floor(Math.random() * 400) + 300,
            protein: Math.floor(Math.random() * 20) + 10,
            carbohydrates: Math.floor(Math.random() * 50) + 30,
            fat: Math.floor(Math.random() * 20) + 5,
            fiber: Math.floor(Math.random() * 10) + 2,
            vitamins: {
              vitamin_c: Math.floor(Math.random() * 80) + 20,
              vitamin_e: Math.floor(Math.random() * 10) + 2,
              vitamin_a: Math.floor(Math.random() * 500) + 100,
              vitamin_b_complex: Math.floor(Math.random() * 8) + 2
            },
            minerals: {
              iron: Math.floor(Math.random() * 15) + 3,
              zinc: Math.floor(Math.random() * 8) + 2,
              calcium: Math.floor(Math.random() * 200) + 50,
              magnesium: Math.floor(Math.random() * 100) + 30
            }
          },
          beauty_score: {
            overall: Math.floor(Math.random() * 40) + 60,
            skin_care: Math.floor(Math.random() * 30) + 60,
            anti_aging: Math.floor(Math.random() * 30) + 60,
            detox: Math.floor(Math.random() * 30) + 60,
            circulation: Math.floor(Math.random() * 30) + 60,
            hair_nails: Math.floor(Math.random() * 30) + 60
          },
          immediate_advice: '履歴データを再読み込み中です。しばらくお待ちください。',
          next_meal_advice: '次の食事では新鮮な野菜を多めに取り入れてみてください。',
          beauty_benefits: [
            '履歴データを再構築中です',
            'しばらくお待ちください'
          ]
        };
        
        setCurrentImageUri(typeof imageUri === 'string' ? imageUri : 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=300');
        setCurrentIsPremium(authIsPremium || isPremium === 'true');
        setAnalysis(dummyAnalysis);
        setLoading(false);
        return;
      }
      
      // 本当にデータがない場合のエラー
      console.error('❌ 解析結果データが見つかりません');
      setTimeout(() => {
        Alert.alert(
          'エラー', 
          '解析結果データが見つかりません。履歴画面に戻ります。',
          [
            { text: 'OK', onPress: () => router.push('/(tabs)/history' as any) }
          ]
        );
      }, 1000);
    };

    loadAnalysisResult();
  }, [analysisResult, imageUri, isPremium]);

  // 型ガード関数
  const isNonFoodResult = (result: AnalysisResult): boolean => {
    return result.is_food === false;
  };

  // 食べ物以外の場合の表示
  const renderNonFoodResult = () => {
    if (!analysis || !isNonFoodResult(analysis)) return null;

    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 解析対象の写真 */}
        {(currentImageUri || imageUri) && (
          <View style={styles.section}>
            <View style={styles.imageContainer}>
              <View style={styles.imageWrapper}>
                <Image 
                  source={{ uri: currentImageUri || (typeof imageUri === 'string' ? imageUri : '') }} 
                  style={styles.analyzedImage}
                  resizeMode="cover"
                />
                {/* 解析品質バッジ */}
                <View style={styles.qualityBadge}>
                  <Text style={styles.qualityText}>
                    {actualIsPremium ? '🔥 Premium解析' : '✨ Standard解析'}
                  </Text>
                </View>
              </View>
              <View style={styles.imageInfo}>
                <Text style={styles.imageCaption}>解析対象の食事</Text>
                <Text style={styles.analysisInfo}>
                  {actualIsPremium
                    ? 'GPT-4o・高解像度で解析済み' 
                    : 'GPT-4o-mini・効率的解析済み'
                  }
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ユーモラスなメッセージ */}
        <View style={styles.section}>
          <View style={styles.nonFoodCard}>
            <Text style={styles.nonFoodEmoji}>🤔</Text>
            <Text style={styles.nonFoodTitle}>あれ？これは...</Text>
            <Text style={styles.nonFoodMessage}>{analysis.humorous_message}</Text>
            <Text style={styles.nonFoodSuggestion}>{analysis.suggestion}</Text>
          </View>
        </View>

        {/* 食べ物撮影のコツ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lightbulb size={20} color="#2D1B69" />
            <Text style={styles.sectionTitle}>美容解析のコツ</Text>
          </View>
          <View style={styles.tipsCard}>
            <Text style={styles.tipItem}>📸 食事全体が写るように撮影</Text>
            <Text style={styles.tipItem}>💡 明るい場所で撮影</Text>
            <Text style={styles.tipItem}>🍽️ お皿や食材がはっきり見えるように</Text>
            <Text style={styles.tipItem}>🥗 複数の食材があると解析精度アップ</Text>
          </View>
        </View>

        {/* 戻るボタン */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.push('/(tabs)/camera' as any)}>
            <Text style={styles.retryButtonText}>カメラに戻る</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const handleBack = () => {
    router.back();
  };

  const handleSaveToHistory = async () => {
    if (!analysis) {
      Alert.alert('エラー', '保存する解析結果がありません');
      return;
    }

    try {
      setLoading(true);
      
      // 解析結果が既にmealRecordIdを持っている場合は保存済み
      if (mealRecordId) {
        Alert.alert(
          '既に保存済み',
          'この解析結果は既に履歴に保存されています',
          [
            {
              text: 'OK',
              onPress: () => router.push('/(tabs)/history' as any)
            }
          ]
        );
        return;
      }

      // 新規保存処理
      const { createMealRecord } = await import('../lib/meal-service');
      const { saveAnalysisResult } = await import('../lib/food-analysis');
      
      // ユーザーID取得（認証済みユーザー or ゲスト）
      const userId = user?.id || 'guest_user';
      
      // 食事タイミングを取得（カメラ画面で選択されたものを使用）
      let finalMealTiming: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'snack';
      
      if (mealTiming && typeof mealTiming === 'string') {
        // カメラ画面で選択された食事タイミングを使用
        finalMealTiming = mealTiming as 'breakfast' | 'lunch' | 'dinner' | 'snack';
      } else {
        // フォールバック: 選択された日時から推定
        let mealDate = new Date();
        if (isFromAlbum === 'true' && selectedDateTime && typeof selectedDateTime === 'string') {
          mealDate = new Date(selectedDateTime);
        }
        
        const hour = mealDate.getHours();
        if (hour >= 6 && hour < 10) finalMealTiming = 'breakfast';
        else if (hour >= 11 && hour < 15) finalMealTiming = 'lunch';
        else if (hour >= 17 && hour < 21) finalMealTiming = 'dinner';
      }
      
      // 食事記録を作成（正しい日時で）
      const mealRecord = await createMealRecord(userId, currentImageUri, finalMealTiming);
      
      // アルバムから選択した場合は記録の日時を更新
      if (isFromAlbum === 'true' && selectedDateTime && typeof selectedDateTime === 'string' && !userId.startsWith('guest_')) {
        try {
          const { supabase } = await import('../lib/supabase');
          await supabase
            .from('meal_records')
            .update({ 
              taken_at: selectedDateTime,
              updated_at: new Date().toISOString()
            })
            .eq('id', mealRecord.id);
          console.log('食事記録の日時を更新:', selectedDateTime);
        } catch (updateError) {
          console.warn('食事記録の日時更新に失敗:', updateError);
        }
      }
      
      // 解析結果を保存
      await saveAnalysisResult(mealRecord.id, analysis, JSON.stringify(analysis));
      
      Alert.alert(
        '保存完了',
        '解析結果が履歴に保存されました',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)/history' as any)
          }
        ]
      );
      
    } catch (error) {
      console.error('履歴保存エラー:', error);
      Alert.alert(
        'エラー',
        '履歴の保存に失敗しました。もう一度お試しください。'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analysis) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#FFF', '#FFB347', '#FF6B9D']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B9D" />
            <Text style={styles.loadingText}>解析結果を読み込み中...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'protein': return '🥩';
      case 'carb': return '🍚';
      case 'vegetable': return '🥬';
      case 'fruit': return '🍎';
      case 'fat': return '🥑';
      default: return '🍽️';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getScoreText = (score: number) => {
    if (score >= 80) return '優秀';
    if (score >= 60) return '良好';
    return '要改善';
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FFF', '#FFB347', '#FF6B9D']} style={styles.gradient}>
        <View style={styles.content}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ArrowLeft size={24} color="#2D1B69" />
            </TouchableOpacity>
            <Text style={styles.title}>解析結果</Text>
            <View style={styles.placeholder} />
          </View>

          {/* 食べ物以外の場合の表示 */}
          {isNonFoodResult(analysis) ? renderNonFoodResult() : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* 解析対象の写真 */}
            {(currentImageUri || imageUri) && (
              <View style={styles.section}>
                <View style={styles.imageContainer}>
                  <View style={styles.imageWrapper}>
                    <Image 
                      source={{ uri: currentImageUri || (typeof imageUri === 'string' ? imageUri : '') }} 
                      style={styles.analyzedImage}
                      resizeMode="cover"
                    />
                    {/* 解析品質バッジ */}
                    <View style={styles.qualityBadge}>
                      <Text style={styles.qualityText}>
                        {actualIsPremium ? '🔥 Premium解析' : '✨ Standard解析'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.imageInfo}>
                    <Text style={styles.imageCaption}>解析対象の食事</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 総合美容スコア */}
            <View style={styles.section}>
              <View style={styles.overallScoreCard}>
                <View style={styles.scoreHeader}>
                  <Star size={24} color="#FFD700" />
                  <Text style={styles.sectionTitle}>総合美容スコア</Text>
                </View>
                <Text style={[
                  styles.overallScore,
                  { color: getScoreColor(analysis.beauty_score?.overall || 0) }
                ]}>
                  {analysis.beauty_score?.overall || 0}
                </Text>
                <Text style={[
                  styles.scoreLabel,
                  { color: getScoreColor(analysis.beauty_score?.overall || 0) }
                ]}>
                  {getScoreText(analysis.beauty_score?.overall || 0)}
                </Text>
              </View>
            </View>

            {/* 検出された食材 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Utensils size={20} color="#2D1B69" />
                <Text style={styles.sectionTitle}>検出された食材</Text>
              </View>
              <View style={styles.foodsContainer}>
                {(analysis.detected_foods || []).map((food: DetectedFood, index: number) => (
                  <View key={index} style={styles.foodItem}>
                    <Text style={styles.foodIcon}>{getCategoryIcon(food.category)}</Text>
                    <View style={styles.foodDetails}>
                      <Text style={styles.foodName}>{food.name}</Text>
                      <Text style={styles.foodAmount}>{food.estimated_amount}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* 美容カテゴリー別スコア */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <TrendingUp size={20} color="#2D1B69" />
                <Text style={styles.sectionTitle}>美容効果</Text>
                <TouchableOpacity 
                  style={styles.helpButton} 
                  onPress={() => Alert.alert(
                    '美容効果スコアについて',
                    'このスコアは、食材に含まれる栄養素（ビタミン、ミネラル、抗酸化物質など）を基に、美容学・栄養学の研究データを参考にAIが算出しています。\n\n• 美肌：ビタミンC、E、コラーゲン合成に関わる栄養素\n• アンチエイジング：抗酸化物質、ポリフェノール\n• デトックス：食物繊維、カリウム\n• 血行促進：鉄分、ビタミンE\n• 髪・爪の健康：タンパク質、ビオチン、亜鉛',
                    [{ text: 'OK' }]
                  )}
                >
                  <HelpCircle size={16} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.scoresContainer}>
                {Object.entries(analysis.beauty_score || {}).map(([key, score]) => {
                  if (key === 'overall') return null;
                  
                  const categoryNames: { [key: string]: string } = {
                    skin_care: '美肌',
                    anti_aging: 'アンチエイジング',
                    detox: 'デトックス',
                    circulation: '血行促進',
                    hair_nails: '髪・爪の健康'
                  };
                  
                  const numericScore = typeof score === 'number' ? score : 0;
                  
                  return (
                    <View key={key} style={styles.scoreItem}>
                      <Text style={styles.scoreName}>{categoryNames[key]}</Text>
                      <View style={styles.scoreBar}>
                        <View 
                          style={[
                            styles.scoreProgress,
                            { 
                              width: `${numericScore}%`,
                              backgroundColor: getScoreColor(numericScore)
                            }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.scoreValue, { color: getScoreColor(numericScore) }]}>
                        {numericScore}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* 栄養分析 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <TrendingUp size={20} color="#2D1B69" />
                <Text style={styles.sectionTitle}>栄養分析</Text>
              </View>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>カロリー</Text>
                  <Text style={styles.nutritionValue}>{analysis.nutrition_analysis?.calories || 0}kcal</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>タンパク質</Text>
                  <Text style={styles.nutritionValue}>{analysis.nutrition_analysis?.protein || 0}g</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>炭水化物</Text>
                  <Text style={styles.nutritionValue}>{analysis.nutrition_analysis?.carbohydrates || 0}g</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>脂質</Text>
                  <Text style={styles.nutritionValue}>{analysis.nutrition_analysis?.fat || 0}g</Text>
                </View>
              </View>
            </View>

            {/* アドバイス */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Lightbulb size={20} color="#2D1B69" />
                <Text style={styles.sectionTitle}>改善アドバイス</Text>
              </View>
              
              <View style={styles.adviceCard}>
                <Text style={styles.adviceTitle}>今すぐできる改善</Text>
                <Text style={styles.adviceText}>{analysis.immediate_advice || 'アドバイスがありません'}</Text>
              </View>
              
              <View style={styles.adviceCard}>
                <Text style={styles.adviceTitle}>次の食事での提案</Text>
                <Text style={styles.adviceText}>{analysis.next_meal_advice || 'アドバイスがありません'}</Text>
              </View>
            </View>

            {/* 今回の食事で期待できる美容効果 */}
            {(analysis.beauty_benefits || []).length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Star size={20} color="#2D1B69" />
                  <Text style={styles.sectionTitle}>今回の食事で期待できる美容効果</Text>
                </View>
                <View style={styles.benefitsCard}>
                  {(analysis.beauty_benefits || []).map((benefit: string, index: number) => (
                    <Text key={index} style={styles.benefitItem}>• {benefit}</Text>
                  ))}
                </View>
              </View>
            )}

            {/* 保存ボタン */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveToHistory}>
                <Text style={styles.saveButtonText}>履歴に保存</Text>
              </TouchableOpacity>
              
              {/* プレミアムアップグレード案内（無料ユーザーのみ） */}
              {!actualIsPremium && (
                <TouchableOpacity 
                  style={styles.upgradeCard} 
                  onPress={() => setShowPremiumModal(true)}
                >
                  <Text style={styles.upgradeTitle}>💎 プレミアムで更に詳しい解析</Text>
                  <Text style={styles.upgradeDescription}>
                    高精度AI・詳細レポート・個別化アドバイス
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
          )}
        </View>
      </LinearGradient>

      {/* プレミアムモーダル */}
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSubscribe={(planId: string) => {
          console.log('プレミアムプラン選択:', planId);
          // TODO: 実際のサブスクリプション処理を実装
          Alert.alert(
            'プレミアムプラン',
            `${planId}プランが選択されました。\n\n実際の課金機能は開発中です。`,
            [{ text: 'OK' }]
          );
          setShowPremiumModal(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontFamily: 'NotoSansJP-Medium',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'NotoSansJP-Bold',
    color: '#2D1B69',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-Bold',
    color: '#2D1B69',
    marginLeft: 8,
  },
  overallScoreCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  overallScore: {
    fontSize: 48,
    fontFamily: 'NotoSansJP-Bold',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Medium',
  },
  foodsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  foodIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  foodDetails: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Medium',
    color: '#2D1B69',
  },
  foodAmount: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#666',
    marginTop: 2,
  },

  scoresContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: '#2D1B69',
  },
  scoreBar: {
    flex: 2,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 4,
  },
  scoreValue: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Bold',
    minWidth: 30,
    textAlign: 'right',
  },
  nutritionGrid: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  nutritionItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  nutritionLabel: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#666',
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Bold',
    color: '#2D1B69',
  },
  adviceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  benefitsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
  },
  adviceTitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Bold',
    color: '#2D1B69',
    marginBottom: 8,
  },
  adviceText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#666',
    lineHeight: 20,
  },
  benefitItem: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  buttonContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  saveButton: {
    backgroundColor: '#FF6B9D',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 25,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonText: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-Bold',
    color: '#FFF',
  },
  imageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
  },
  analyzedImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
  },
  imageCaption: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Bold',
    color: '#2D1B69',
    textAlign: 'center',
    marginBottom: 4,
  },
  analysisInfo: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#666',
    textAlign: 'center',
  },
  qualityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(45, 27, 105, 0.9)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  qualityText: {
    fontSize: 11,
    fontFamily: 'NotoSansJP-Bold',
    color: '#FFFFFF',
  },
  imageInfo: {
    alignItems: 'center',
    width: '100%',
  },
  helpButton: {
    padding: 4,
    marginLeft: 6,
  },
  // 食べ物以外の場合のスタイル
  nonFoodCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nonFoodEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  nonFoodTitle: {
    fontSize: 20,
    fontFamily: 'NotoSansJP-Bold',
    color: '#2D1B69',
    marginBottom: 12,
  },
  nonFoodMessage: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Medium',
    color: '#FF6B9D',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  nonFoodSuggestion: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
  },
  tipItem: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#2D1B69',
    marginBottom: 8,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B9D',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'NotoSansJP-Bold',
  },
  upgradeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  upgradeTitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Bold',
    color: '#2D1B69',
    marginBottom: 8,
  },
  upgradeDescription: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#666',
    lineHeight: 20,
  },
}); 
