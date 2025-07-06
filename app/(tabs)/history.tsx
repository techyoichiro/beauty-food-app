import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, TrendingUp, ChartBar as BarChart3, Crown, ChevronLeft, ChevronRight, X } from 'lucide-react-native';

import { router } from 'expo-router';
import { FoodAnalysisResult } from '../../lib/food-analysis';
import { UserProfileService, ExtendedUserProfile, getUserMealRecords, MealRecord } from '../../lib/meal-service';
import { useAuth } from '../../contexts/AuthContext';
import WeeklyAnalysisService, { WeeklyAnalysisData } from '../../lib/weekly-analysis-service';

const { width } = Dimensions.get('window');

// 美容カテゴリー別のアドバイス生成
const generateCategoryAdvice = (score: number, categories: string[]) => {
  const adviceMap = {
    skin_care: {
      high: "レモンを絞ってビタミンCをプラス！鮭のアスタキサンチンとの相乗効果で美肌力アップ",
      medium: "トマトを追加してリコピンを摂取しましょう。コラーゲン生成を促進します",
      low: "ビタミンCが豊富な食材を追加して美肌効果を高めましょう"
    },
    anti_aging: {
      high: "緑茶と一緒に摂取すると抗酸化作用が倍増！カテキンが活性酸素を除去します",
      medium: "ナッツ類を追加してビタミンEを補給し、細胞の老化を防ぎましょう",
      low: "抗酸化物質が豊富な食材を取り入れて老化防止効果を高めましょう"
    },
    detox: {
      high: "食後に白湯を飲んで代謝アップ！消化を助けて老廃物の排出を促進",
      medium: "食物繊維を増やして腸内環境を改善しましょう",
      low: "デトックス効果のある食材を増やして体内浄化を促進しましょう"
    },
    circulation: {
      high: "生姜をすりおろして追加！体を温めて血流改善効果を高めます",
      medium: "鉄分豊富な食材を追加して血行を促進しましょう",
      low: "血行促進効果のある食材を取り入れて冷え性を改善しましょう"
    },
    hair_nails: {
      high: "ごまをふりかけて亜鉛とビオチンをプラス！髪の成長に必要な栄養素です",
      medium: "タンパク質を強化して髪と爪の材料を補給しましょう",
      low: "髪と爪の健康に必要な栄養素を意識的に摂取しましょう"
    }
  };

  const level = score >= 85 ? 'high' : score >= 75 ? 'medium' : 'low';
  const primaryCategory = categories[0] || 'skin_care';
  
  return adviceMap[primaryCategory as keyof typeof adviceMap]?.[level] || 
         "バランスの良い食事を心がけましょう";
};

// ダミーの食事記録データ生成
const generateDummyMealRecords = (userProfile: ExtendedUserProfile): MealRecord[] => {
  const today = new Date();
  const records: MealRecord[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // 1日あたり1-3食のランダムな食事記録を生成
    const mealsPerDay = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < mealsPerDay; j++) {
      const mealTypes = ['朝食', '昼食', '夕食'];
      const score = Math.floor(Math.random() * 40) + 60; // 60-100のスコア
      
      records.push({
        id: `dummy-${i}-${j}`,
        user_id: 'guest',
        taken_at: date,
        meal_timing: (j === 0 ? 'breakfast' : j === 1 ? 'lunch' : j === 2 ? 'dinner' : 'snack') as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        image_url: `https://images.pexels.com/photos/${1640770 + (i * 3 + j) % 10}/pexels-photo-${1640770 + (i * 3 + j) % 10}.jpeg?auto=compress&cs=tinysrgb&w=300`,
        analysis_status: 'completed' as const,
        created_at: date,
        updated_at: date,
        analysisResult: createDummyAnalysisResult(score, userProfile)
      });
    }
  }
  
  return records.sort((a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime());
};

// ダミーの解析結果データ（ユーザープロフィール対応）
const createDummyAnalysisResult = (score: number, userProfile: ExtendedUserProfile): FoodAnalysisResult => {
  const advice = generateCategoryAdvice(score, userProfile.beautyCategories);
  
  return {
    detected_foods: [
      {
        name: score >= 85 ? "鮭の塩焼き" : score >= 75 ? "チキンサラダ" : "ハンバーガー",
        category: "protein",
        estimated_amount: "100g",
        confidence: 0.92
      },
      {
        name: score >= 85 ? "キノコとブロッコリーの炒め物" : score >= 75 ? "アボカドサラダ" : "フライドポテト",
        category: "vegetable",
        estimated_amount: "80g",
        confidence: 0.88
      },
      {
        name: "玄米",
        category: "carb",
        estimated_amount: "150g",
        confidence: 0.85
      }
    ],
    nutrition_analysis: {
      calories: score >= 85 ? 420 : score >= 75 ? 380 : 650,
      protein: score >= 85 ? 28 : score >= 75 ? 25 : 22,
      carbohydrates: score >= 85 ? 45 : score >= 75 ? 42 : 58,
      fat: score >= 85 ? 12 : score >= 75 ? 15 : 35,
      fiber: score >= 85 ? 8 : score >= 75 ? 6 : 3,
      vitamins: {
        vitamin_c: score >= 85 ? 80 : score >= 75 ? 60 : 40,
        vitamin_e: score >= 85 ? 70 : score >= 75 ? 50 : 30,
        vitamin_a: score >= 85 ? 75 : score >= 75 ? 55 : 35,
        vitamin_b_complex: score >= 85 ? 85 : score >= 75 ? 65 : 45
      },
      minerals: {
        iron: score >= 85 ? 15 : score >= 75 ? 12 : 8,
        zinc: score >= 85 ? 10 : score >= 75 ? 8 : 5,
        calcium: score >= 85 ? 120 : score >= 75 ? 100 : 80,
        magnesium: score >= 85 ? 90 : score >= 75 ? 70 : 50
      }
    },
    beauty_score: {
      overall: score,
      skin_care: score >= 85 ? 88 : score >= 75 ? 75 : 60,
      anti_aging: score >= 85 ? 82 : score >= 75 ? 72 : 55,
      detox: score >= 85 ? 85 : score >= 75 ? 70 : 50,
      circulation: score >= 85 ? 80 : score >= 75 ? 68 : 45,
      hair_nails: score >= 85 ? 78 : score >= 75 ? 65 : 50
    },
    immediate_advice: advice,
    next_meal_advice: score >= 85
      ? `次の食事でも${userProfile.beautyCategories.map(cat => 
          cat === 'skin_care' ? '美肌' : 
          cat === 'anti_aging' ? 'アンチエイジング' : 
          cat === 'detox' ? 'デトックス' : 
          cat === 'circulation' ? '血行促進' : '髪・爪の健康'
        ).join('・')}を意識した食材選びを続けましょう。`
      : `次の食事では、${userProfile.beautyCategories.map(cat => 
          cat === 'skin_care' ? '美肌効果の高い' : 
          cat === 'anti_aging' ? '抗酸化作用のある' : 
          cat === 'detox' ? 'デトックス効果のある' : 
          cat === 'circulation' ? '血行促進効果のある' : '髪・爪に良い'
        ).join('・')}食材を意識的に取り入れましょう。`,
    beauty_benefits: score >= 85
      ? userProfile.beautyCategories.map(cat => 
          cat === 'skin_care' ? '肌のハリと弾力向上' : 
          cat === 'anti_aging' ? '抗酸化作用による老化防止' : 
          cat === 'detox' ? '体内浄化・代謝促進' : 
          cat === 'circulation' ? '血行促進・冷え性改善' : '髪・爪の健康促進'
        )
      : userProfile.beautyCategories.map(cat => 
          cat === 'skin_care' ? '基本的な美肌効果' : 
          cat === 'anti_aging' ? '軽度の老化防止効果' : 
          cat === 'detox' ? '軽度のデトックス効果' : 
          cat === 'circulation' ? '軽度の血行改善' : '基本的な髪・爪ケア'
        )
  };
};

export default function HistoryScreen() {
  const [selectedTab, setSelectedTab] = useState<'daily' | 'weekly'>('daily');
  const [userProfile, setUserProfile] = useState<ExtendedUserProfile | null>(null);
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([]);
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<WeeklyAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { session, isPremium } = useAuth();
  
  // カレンダー関連のstate
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [mealDates, setMealDates] = useState<Set<string>>(new Set());
  const [filteredRecords, setFilteredRecords] = useState<MealRecord[]>([]);
  const isFreePlan = !isPremium;

  // カレンダーヘルパー関数
  const formatDateKey = (date: Date): string => {
    // タイムゾーン対応: 現地時間での日付文字列を生成
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return formatDateKey(date1) === formatDateKey(date2);
  };

  const getCalendarDays = (month: Date): Array<{date: Date | null, isCurrentMonth: boolean, hasMeals: boolean}> => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // 週の最初の日に調整

    const days = [];
    const current = new Date(startDate);

    // 6週分（42日）のカレンダーを作成
    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = current.getMonth() === month.getMonth();
      const dateKey = formatDateKey(current);
      const hasMeals = mealDates.has(dateKey);
      
      days.push({
        date: new Date(current),
        isCurrentMonth,
        hasMeals
      });
      
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const filterRecordsByDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    const filtered = mealRecords.filter(record => {
      const recordDate = new Date(record.taken_at);
      return formatDateKey(recordDate) === dateKey;
    });
    setFilteredRecords(filtered);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  useEffect(() => {
    loadData();
  }, [session]);

  // 食事記録が変更されたときに食事日付セットを更新
  useEffect(() => {
    const dates = new Set<string>();
    mealRecords.forEach(record => {
      const dateKey = formatDateKey(new Date(record.taken_at));
      dates.add(dateKey);
    });
    setMealDates(dates);
  }, [mealRecords]);

  const loadData = async () => {
    setLoading(true);
    try {
      // ユーザープロフィール取得
      const profile = await UserProfileService.getProfile();
      setUserProfile(profile);

      // 食事記録取得
      if (session?.user?.id) {
        // 認証済みユーザーの場合は実際のデータを取得
        const records = await getUserMealRecords(session.user.id, 20);
        setMealRecords(records);
        
        // 週間分析データを取得
        const weeklyData = await WeeklyAnalysisService.getWeeklyAnalysis(session.user.id);
        setWeeklyAnalysis(weeklyData);
        console.log('📊 週間分析データ取得完了:', weeklyData);
      } else {
        // ゲストユーザーの場合はダミーデータを生成
        const dummyRecords = generateDummyMealRecords(profile);
        setMealRecords(dummyRecords);
        
        // ゲスト用週間分析データを取得
        const weeklyData = await WeeklyAnalysisService.getWeeklyAnalysis('guest');
        setWeeklyAnalysis(weeklyData);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
      // エラー時はデフォルトプロフィールとダミーデータを設定
      const defaultProfile: ExtendedUserProfile = {
        beautyCategories: ['skin_care'],
        beautyLevel: 'intermediate',
        weeklyGoalScore: 70,
        dailyMealGoal: 3,
        notifications: { meal: true, analysis: true, weekly: true },
        autoMealTiming: true
      };
      setUserProfile(defaultProfile);
      setMealRecords(generateDummyMealRecords(defaultProfile));
      
      // エラー時はサンプル週間データを表示
      const weeklyData = await WeeklyAnalysisService.getWeeklyAnalysis('guest');
      setWeeklyAnalysis(weeklyData);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // プロフィールまたはデータが読み込まれていない場合のローディング
  if (!userProfile || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ec4899" />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 実際の食事記録データを日付別にグループ化（直近1週間のみ）
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const recentMealRecords = mealRecords.filter(record => {
    const recordDate = new Date(record.taken_at);
    return recordDate >= oneWeekAgo;
  });
  
  const groupedMealRecords = recentMealRecords.reduce((groups: { [key: string]: MealRecord[] }, record) => {
    const date = new Date(record.taken_at).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '/');
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(record);
    return groups;
  }, {});

  // 日付別履歴データを生成
  const historyData = Object.entries(groupedMealRecords).map(([date, meals]) => {
    const scores = meals
      .filter(meal => meal.analysisResult?.beauty_score?.overall)
      .map(meal => meal.analysisResult.beauty_score.overall);
    
    const averageScore = scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;

    return {
      date,
      meals: meals.map(meal => ({
        id: meal.id,
        type: getMealTypeJapanese(meal.meal_timing),
        image: meal.signedImageUrl || meal.image_url, // 署名付きURLを優先
        imageUri: meal.signedImageUrl || meal.image_url, // 詳細画面用のURI
        score: meal.analysisResult?.beauty_score?.overall || 0,
        advice: meal.analysisResult?.immediate_advice || '解析中...',
        analysisResult: meal.analysisResult
      })),
      averageScore
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 食事タイミングを日本語に変換
  function getMealTypeJapanese(timing: string): string {
    switch (timing) {
      case 'breakfast': return '朝食';
      case 'lunch': return '昼食';
      case 'dinner': return '夕食';
      case 'snack': return '間食';
      default: return '食事';
    }
  }

  const weeklyScores = [65, 72, 78, 82, 85, 79, 88];
  const days = ['月', '火', '水', '木', '金', '土', '日'];

  const renderChart = () => {
    if (!weeklyAnalysis) return null;
    
    const scores = weeklyAnalysis.dailyScores.map(day => day.averageScore);
    const maxScore = Math.max(...scores, 100);
    const chartHeight = 120;
    const dayLabels = ['月', '火', '水', '木', '金', '土', '日'];
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>週間美容スコア推移</Text>
        <View style={styles.chart}>
          {scores.map((score, index) => (
            <View key={index} style={styles.chartBar}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: (score / maxScore) * chartHeight,
                    backgroundColor: score >= 80 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ec4899'
                  }
                ]} 
              />
              <Text style={styles.barValue}>{score || 0}</Text>
              <Text style={styles.barLabel}>{dayLabels[index]}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const handleMealCardPress = (meal: any) => {
    // 解析結果データをJSONStringifyして画面に渡す
    const analysisDataString = JSON.stringify(meal.analysisResult);
    console.log('履歴カード押下:', {
      mealId: meal.id,
      hasAnalysisResult: !!meal.analysisResult,
      beautyScore: meal.analysisResult?.beauty_score?.overall,
      imageUri: meal.imageUri || meal.image
    });
    
    // パラメータのデバッグログ
    const imageUri = meal.imageUri || meal.image || 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=300';
    
    console.log('🔗 詳細画面遷移パラメータ:', {
      mealRecordId: meal.id,
      hasAnalysisData: !!meal.analysisResult,
      imageUri: imageUri.substring(0, 50) + '...',
      analysisDataLength: analysisDataString.length
    });
    
    router.push({
      pathname: '/analysis-result',
      params: {
        mealRecordId: meal.id,
        analysisData: analysisDataString,
        imageUri: imageUri
      }
    } as any);
  };

  const renderMealCard = (meal: any) => {
    // 画像URIのフォールバック処理
    const imageUri = meal.image || meal.imageUri || 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=300';
    
    console.log('🖼️ 食事カード画像URI:', {
      mealId: meal.id,
      hasImage: !!meal.image,
      hasImageUri: !!meal.imageUri,
      finalUri: imageUri.substring(0, 50) + '...'
    });
    
    return (
      <TouchableOpacity 
        key={meal.id} 
        style={styles.mealCard}
        onPress={() => handleMealCardPress(meal)}
      >
        <Image 
          source={{ uri: imageUri }} 
          style={styles.mealImage}
          onError={(error) => {
            console.warn('📷 画像読み込みエラー:', {
              mealId: meal.id,
              uri: imageUri,
              error
            });
          }}
        />
        <View style={styles.mealInfo}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealType}>{meal.type}</Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>美容スコア</Text>
            <Text style={[
              styles.score,
              { color: meal.score >= 80 ? '#10b981' : meal.score >= 70 ? '#f59e0b' : '#ec4899' }
            ]}>
              {meal.score || 0}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // カレンダーモーダルのレンダリング
  const renderCalendarModal = () => {
    const calendarDays = getCalendarDays(currentMonth);
    const monthName = currentMonth.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long' 
    });

    const renderCalendarDay = ({ item, index }: { item: any, index: number }) => {
      const isSelected = item.date && isSameDay(item.date, selectedDate);
      const isToday = item.date && isSameDay(item.date, new Date());
      
      return (
        <TouchableOpacity
          style={[
            styles.calendarDay,
            !item.isCurrentMonth && styles.calendarDayInactive,
            isSelected && styles.calendarDaySelected,
            isToday && styles.calendarDayToday,
          ]}
          onPress={() => {
            if (item.date) {
              setSelectedDate(item.date);
              filterRecordsByDate(item.date);
              setShowCalendar(false);
            }
          }}
          disabled={!item.date}
        >
          <Text style={[
            styles.calendarDayText,
            !item.isCurrentMonth && styles.calendarDayTextInactive,
            isSelected && styles.calendarDayTextSelected,
            isToday && styles.calendarDayTextToday,
          ]}>
            {item.date ? item.date.getDate() : ''}
          </Text>
          {item.hasMeals && (
            <View style={styles.mealIndicator} />
          )}
        </TouchableOpacity>
      );
    };

    return (
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            {/* ヘッダー */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={styles.monthNavButton}
                onPress={() => navigateMonth('prev')}
              >
                <ChevronLeft size={24} color="#374151" />
              </TouchableOpacity>
              
              <Text style={styles.monthTitle}>{monthName}</Text>
              
              <TouchableOpacity
                style={styles.monthNavButton}
                onPress={() => navigateMonth('next')}
              >
                <ChevronRight size={24} color="#374151" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCalendar(false)}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* 曜日ヘッダー */}
            <View style={styles.weekdayHeader}>
              {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                <Text key={index} style={styles.weekdayText}>{day}</Text>
              ))}
            </View>

            {/* カレンダーグリッド */}
            <FlatList
              data={calendarDays}
              renderItem={renderCalendarDay}
              numColumns={7}
              keyExtractor={(item, index) => index.toString()}
              style={styles.calendarGrid}
              scrollEnabled={false}
            />

            {/* 凡例 */}
            <View style={styles.calendarLegend}>
              <View style={styles.legendItem}>
                <View style={styles.mealIndicator} />
                <Text style={styles.legendText}>食事記録あり</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.todayIndicator} />
                <Text style={styles.legendText}>今日</Text>
              </View>
            </View>

            {/* 選択した日付の表示 */}
            <View style={styles.selectedDateInfo}>
              <Text style={styles.selectedDateText}>
                選択中: {selectedDate.toLocaleDateString('ja-JP', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
              <Text style={styles.selectedDateMealCount}>
                食事記録: {filteredRecords.length}件
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>食事履歴</Text>
        <TouchableOpacity 
          style={styles.calendarButton}
          onPress={() => setShowCalendar(true)}
        >
          <Calendar size={20} color="#ec4899" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'daily' && styles.activeTab]}
          onPress={() => setSelectedTab('daily')}
        >
          <Text style={[styles.tabText, selectedTab === 'daily' && styles.activeTabText]}>
            日別履歴
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'weekly' && styles.activeTab]}
          onPress={() => setSelectedTab('weekly')}
        >
          <Text style={[styles.tabText, selectedTab === 'weekly' && styles.activeTabText]}>
            週間分析
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ec4899']}
            tintColor="#ec4899"
          />
        }
      >
        {selectedTab === 'daily' ? (
          <>
            {/* 日付フィルタが適用されている場合の表示 */}
            {!isSameDay(selectedDate, new Date()) && (
              <View style={styles.filterInfo}>
                <Text style={styles.filterText}>
                  📅 {selectedDate.toLocaleDateString('ja-JP', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} の食事記録
                </Text>
                <TouchableOpacity 
                  style={styles.clearFilterButton}
                  onPress={() => {
                    setSelectedDate(new Date());
                    setFilteredRecords([]);
                  }}
                >
                  <Text style={styles.clearFilterText}>一覧に戻る</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* フィルタされた記録または全記録を表示 */}
            {(filteredRecords.length > 0 || (!isSameDay(selectedDate, new Date()) && filteredRecords.length === 0)) ? (
              // 特定の日付が選択されている場合
              <>
                {filteredRecords.length > 0 ? (
                  <View style={styles.daySection}>
                    <View style={styles.dayHeader}>
                      <Text style={styles.dayDate}>
                        {selectedDate.toLocaleDateString('ja-JP', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Text>
                      <View style={styles.dayScore}>
                        <Text style={styles.dayScoreLabel}>平均スコア</Text>
                        <Text style={[
                          styles.dayScoreValue,
                          { color: (() => {
                            const scores = filteredRecords
                              .filter(record => record.analysisResult?.beauty_score?.overall)
                              .map(record => record.analysisResult.beauty_score.overall);
                            const avgScore = scores.length > 0 
                              ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
                              : 0;
                            return avgScore >= 80 ? '#10b981' : avgScore >= 70 ? '#f59e0b' : '#ec4899';
                          })() }
                        ]}>
                          {(() => {
                            const scores = filteredRecords
                              .filter(record => record.analysisResult?.beauty_score?.overall)
                              .map(record => record.analysisResult.beauty_score.overall);
                            return scores.length > 0 
                              ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
                              : 0;
                          })()}
                        </Text>
                      </View>
                    </View>
                    {filteredRecords.map(record => renderMealCard({
                      id: record.id,
                      type: getMealTypeJapanese(record.meal_timing),
                      image: record.signedImageUrl || record.image_url,
                      imageUri: record.signedImageUrl || record.image_url,
                      score: record.analysisResult?.beauty_score?.overall || 0,
                      advice: record.analysisResult?.immediate_advice || '解析中...',
                      analysisResult: record.analysisResult
                    }))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateTitle}>
                      {selectedDate.toLocaleDateString('ja-JP', { 
                        month: 'long', 
                        day: 'numeric' 
                      })} の食事記録はありません
                    </Text>
                    <Text style={styles.emptyStateSubtitle}>
                      この日は食事を記録していませんでした
                    </Text>
                  </View>
                )}
              </>
            ) : (
              // 全記録を表示（デフォルト）
              <>
                {historyData.length > 0 ? (
                  historyData.map((dayData, dayIndex) => (
                    <View key={dayIndex} style={styles.daySection}>
                      <View style={styles.dayHeader}>
                        <Text style={styles.dayDate}>{dayData.date}</Text>
                        <View style={styles.dayScore}>
                          <Text style={styles.dayScoreLabel}>平均スコア</Text>
                          <Text style={[
                            styles.dayScoreValue,
                            { color: dayData.averageScore >= 80 ? '#10b981' : dayData.averageScore >= 70 ? '#f59e0b' : '#ec4899' }
                          ]}>
                            {dayData.averageScore}
                          </Text>
                        </View>
                      </View>
                      {dayData.meals.map(renderMealCard)}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateTitle}>食事記録がありません</Text>
                    <Text style={styles.emptyStateSubtitle}>
                      カメラで食事を撮影して、美容スコアを記録しましょう！
                    </Text>
                  </View>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {renderChart()}
            
            {/* Weekly Stats */}
            {weeklyAnalysis && (
              <View style={styles.statsSection}>
                <Text style={styles.statsTitle}>今週の統計</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <TrendingUp size={24} color="#10b981" />
                    <Text style={styles.statValue}>{weeklyAnalysis.weeklyStats.averageScore}</Text>
                    <Text style={styles.statLabel}>平均スコア</Text>
                  </View>
                  <View style={styles.statCard}>
                    <BarChart3 size={24} color="#ec4899" />
                    <Text style={styles.statValue}>{weeklyAnalysis.weeklyStats.totalMeals}</Text>
                    <Text style={styles.statLabel}>解析回数</Text>
                  </View>
                </View>
                
                {/* 追加統計情報 */}
                <View style={styles.additionalStats}>
                  <View style={styles.statRow}>
                    <Text style={styles.statRowLabel}>最高の日:</Text>
                    <Text style={styles.statRowValue}>{weeklyAnalysis.weeklyStats.bestDay}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statRowLabel}>改善傾向:</Text>
                    <Text style={[
                      styles.statRowValue,
                      { color: weeklyAnalysis.weeklyStats.improvementTrend === 'up' ? '#10b981' : 
                               weeklyAnalysis.weeklyStats.improvementTrend === 'down' ? '#ef4444' : '#6b7280' }
                    ]}>
                      {weeklyAnalysis.weeklyStats.improvementTrend === 'up' ? '↗️ 向上中' : 
                       weeklyAnalysis.weeklyStats.improvementTrend === 'down' ? '↘️ 下降中' : '→ 安定'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* レコメンデーション */}
            {weeklyAnalysis && weeklyAnalysis.recommendations.length > 0 && (
              <View style={styles.recommendationsSection}>
                <Text style={styles.statsTitle}>今週のアドバイス</Text>
                {weeklyAnalysis.recommendations.map((recommendation, index) => (
                  <View key={index} style={styles.recommendationCard}>
                    <Text style={styles.recommendationText}>{recommendation}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 達成度 */}
            {weeklyAnalysis && weeklyAnalysis.achievements.length > 0 && (
              <View style={styles.achievementsSection}>
                <Text style={styles.statsTitle}>今週の達成度</Text>
                <View style={styles.achievementsGrid}>
                  {weeklyAnalysis.achievements.map((achievement, index) => (
                    <View key={index} style={[
                      styles.achievementCard,
                      { opacity: achievement.achieved ? 1 : 0.5 }
                    ]}>
                      <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                      <Text style={styles.achievementTitle}>{achievement.title}</Text>
                      <Text style={styles.achievementDescription}>{achievement.description}</Text>
                      {achievement.achieved && (
                        <View style={styles.achievedBadge}>
                          <Text style={styles.achievedText}>達成!</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Premium Feature */}
            {isFreePlan && (
              <TouchableOpacity style={styles.premiumFeature}>
                <Crown size={24} color="#f59e0b" />
                <View style={styles.premiumText}>
                  <Text style={styles.premiumTitle}>プレミアム限定</Text>
                  <Text style={styles.premiumSubtitle}>
                    月次詳細レポート・美容食材ランキング・達成度トラッキング
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
      
      {/* カレンダーモーダル */}
      {renderCalendarModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
  },
  calendarButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ec4899',
  },
  content: {
    flex: 1,
  },
  daySection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayDate: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
  },
  dayScore: {
    alignItems: 'center',
  },
  dayScoreLabel: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
  },
  dayScoreValue: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    marginTop: 2,
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  mealInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mealType: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
  },

  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    marginRight: 8,
  },
  score: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
  chartContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 4,
    marginBottom: 4,
  },
  barValue: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Medium',
    color: '#6b7280',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Medium',
    color: '#6b7280',
    marginTop: 4,
  },
  premiumFeature: {
    backgroundColor: '#fef3c7',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumText: {
    flex: 1,
    marginLeft: 16,
  },
  premiumTitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#92400e',
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#92400e',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
    marginTop: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  additionalStats: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statRowLabel: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: '#6b7280',
  },
  statRowValue: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
  },
  recommendationsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  recommendationCard: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  recommendationText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#0f172a',
    lineHeight: 20,
  },
  achievementsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  achievedBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  achievedText: {
    fontSize: 10,
    fontFamily: 'NotoSansJP-Bold',
    color: 'white',
  },

  // カレンダー関連スタイル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  monthTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#6b7280',
    paddingVertical: 8,
  },
  calendarGrid: {
    marginBottom: 20,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    position: 'relative',
  },
  calendarDayInactive: {
    backgroundColor: '#f3f4f6',
  },
  calendarDaySelected: {
    backgroundColor: '#ec4899',
  },
  calendarDayToday: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  calendarDayText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#374151',
  },
  calendarDayTextInactive: {
    color: '#9ca3af',
  },
  calendarDayTextSelected: {
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
  },
  calendarDayTextToday: {
    color: '#f59e0b',
    fontFamily: 'Poppins-SemiBold',
  },
  mealIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  todayIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f59e0b',
    marginRight: 8,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#6b7280',
    marginLeft: 4,
  },
  selectedDateInfo: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginBottom: 4,
  },
  selectedDateMealCount: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#6b7280',
  },
  filterInfo: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: 16,
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#1e40af',
    flex: 1,
  },
  clearFilterButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearFilterText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: 'white',
  },
});
