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

// 統合された解析結果型（FoodAnalysisResultに全て含まれるように修正）
type AnalysisResult = FoodAnalysisResult;

export default function AnalysisResultScreen() {
  const { mealRecordId, analysisResult, imageUri, isPremium } = useLocalSearchParams();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [currentImageUri, setCurrentImageUri] = useState<string>('');
  const [currentIsPremium, setCurrentIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

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
          
          // 現在の状態を更新
          setCurrentImageUri(typeof imageUri === 'string' ? imageUri : '');
          setCurrentIsPremium(isPremium === 'true');
          
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
          
          // 状態を復元
          setCurrentImageUri(savedImageUri || '');
          setCurrentIsPremium(savedIsPremium === 'true');
          setAnalysis(parsedData);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('❌ AsyncStorageからの復元に失敗:', error);
      }

      // どちらからも取得できない場合はエラー
      console.error('❌ 解析結果データが見つかりません');
      setTimeout(() => {
        Alert.alert(
          'エラー', 
          '解析結果データが見つかりません。カメラ画面に戻ります。',
          [
            { text: 'OK', onPress: () => router.push('/(tabs)/camera' as any) }
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
                    {(currentIsPremium || isPremium === 'true') ? '🔥 Premium解析' : '✨ Standard解析'}
                  </Text>
                </View>
              </View>
              <View style={styles.imageInfo}>
                <Text style={styles.imageCaption}>解析対象の食事</Text>
                <Text style={styles.analysisInfo}>
                  {(currentIsPremium || isPremium === 'true')
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

  const handleSaveToHistory = () => {
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
                        {(currentIsPremium || isPremium === 'true') ? '🔥 Premium解析' : '✨ Standard解析'}
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
              {isPremium !== 'true' && (
                <TouchableOpacity style={styles.upgradeCard} onPress={() => {
                  Alert.alert(
                    '💎 プレミアムプランで更に詳しく',
                    '• GPT-4oによる高精度解析\n• 高解像度画像認識\n• より詳細な栄養分析\n• 個別化されたアドバイス\n• 詳細レポート機能',
                    [
                      { text: 'キャンセル', style: 'cancel' },
                      { text: 'プレミアムを見る', onPress: () => router.push('/(tabs)/profile' as any) }
                    ]
                  );
                }}>
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