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
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, TrendingUp, Utensils, Lightbulb, HelpCircle } from 'lucide-react-native';
import { FoodAnalysisResult, DetectedFood } from '../lib/food-analysis';

export default function AnalysisResultScreen() {
  const { mealRecordId, analysisData, imageUri } = useLocalSearchParams();
  const [analysis, setAnalysis] = useState<FoodAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (analysisData && typeof analysisData === 'string') {
      try {
        const parsedData = JSON.parse(analysisData);
        setAnalysis(parsedData);
        setLoading(false);
      } catch (error) {
        console.error('解析データのパースに失敗:', error);
        Alert.alert('エラー', '解析結果の読み込みに失敗しました');
        router.back();
      }
    }
  }, [analysisData]);

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

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* 解析対象の写真 */}
            {imageUri && (
              <View style={styles.section}>
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ uri: typeof imageUri === 'string' ? imageUri : '' }} 
                    style={styles.analyzedImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.imageCaption}>解析対象の食事</Text>
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
                  { color: getScoreColor(analysis.beauty_score.overall) }
                ]}>
                  {analysis.beauty_score.overall}
                </Text>
                <Text style={[
                  styles.scoreLabel,
                  { color: getScoreColor(analysis.beauty_score.overall) }
                ]}>
                  {getScoreText(analysis.beauty_score.overall)}
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
                {analysis.detected_foods.map((food: DetectedFood, index: number) => (
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
                {Object.entries(analysis.beauty_score).map(([key, score]) => {
                  if (key === 'overall') return null;
                  
                  const categoryNames: { [key: string]: string } = {
                    skin_care: '美肌',
                    anti_aging: 'アンチエイジング',
                    detox: 'デトックス',
                    circulation: '血行促進',
                    hair_nails: '髪・爪の健康'
                  };
                  
                  return (
                    <View key={key} style={styles.scoreItem}>
                      <Text style={styles.scoreName}>{categoryNames[key]}</Text>
                      <View style={styles.scoreBar}>
                        <View 
                          style={[
                            styles.scoreProgress,
                            { 
                              width: `${score}%`,
                              backgroundColor: getScoreColor(score)
                            }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
                        {score}
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
                  <Text style={styles.nutritionValue}>{analysis.nutrition_analysis.calories}kcal</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>タンパク質</Text>
                  <Text style={styles.nutritionValue}>{analysis.nutrition_analysis.protein}g</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>炭水化物</Text>
                  <Text style={styles.nutritionValue}>{analysis.nutrition_analysis.carbohydrates}g</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>脂質</Text>
                  <Text style={styles.nutritionValue}>{analysis.nutrition_analysis.fat}g</Text>
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
                <Text style={styles.adviceText}>{analysis.immediate_advice}</Text>
              </View>
              
              <View style={styles.adviceCard}>
                <Text style={styles.adviceTitle}>次の食事での提案</Text>
                <Text style={styles.adviceText}>{analysis.next_meal_advice}</Text>
              </View>
            </View>

            {/* 期待できる美容効果 */}
            {analysis.beauty_benefits.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Star size={20} color="#2D1B69" />
                  <Text style={styles.sectionTitle}>期待できる美容効果</Text>
                </View>
                <View style={styles.benefitsCard}>
                  {analysis.beauty_benefits.map((benefit: string, index: number) => (
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
            </View>
          </ScrollView>
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
  },
  analyzedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  imageCaption: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: '#666',
  },
  helpButton: {
    padding: 4,
    marginLeft: 6,
  },
}); 