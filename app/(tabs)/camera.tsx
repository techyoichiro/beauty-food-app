import React, { useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { 
  Camera as CameraIcon, 
  FlipHorizontal, 
  X, 
  Coffee, 
  Sun, 
  Moon, 
  Utensils,
  Image as ImageIcon,
  Check,
  RotateCcw,
  TestTube,
  CheckCircle,
  Sparkles,
  Calendar
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { analyzeMealImage, getTodayMealCount, UserProfileService, determineAutoMealTiming } from '../../lib/meal-service';

const mealTimes = [
  { id: 'breakfast', label: '朝食', icon: Sun, color: '#f59e0b' },
  { id: 'lunch', label: '昼食', icon: Sun, color: '#ec4899' },
  { id: 'dinner', label: '夕食', icon: Moon, color: '#8b5cf6' },
  { id: 'snack', label: '間食', icon: Coffee, color: '#10b981' },
];

// 開発用のテスト画像データ
const DEV_TEST_IMAGES = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop', // ピザ
  'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop', // サラダ
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop', // パンケーキ
  'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=400&h=300&fit=crop', // 寿司
];

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [showMealModal, setShowMealModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFromAlbum, setIsFromAlbum] = useState(false); // アルバムから選択かどうか
  const [selectedDate, setSelectedDate] = useState(new Date());
  const cameraRef = useRef<CameraView>(null);
  const { session, isPremium } = useAuth();
  const insets = useSafeAreaInsets();

  console.log('📱 カメラ画面:', { isPremium, facing });

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <CameraIcon size={64} color="#ec4899" />
          <Text style={styles.permissionTitle}>カメラへのアクセスが必要です</Text>
          <Text style={styles.permissionText}>
            食事の写真を撮影してAI解析を行うため、カメラへのアクセスを許可してください。
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>カメラを許可</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        // 課金状態に応じた品質設定
        const quality = isPremium ? 0.8 : 0.65;
        console.log('📸 撮影品質:', { isPremium, quality: `${quality * 100}%` });

        const photo = await cameraRef.current.takePictureAsync({
          quality: quality,
          base64: false,
        });
        if (photo) {
          setCapturedImage(photo.uri);
          setIsFromAlbum(false); // カメラ撮影フラグを設定
          setShowConfirmModal(true);
        }
      } catch (error) {
        Alert.alert('エラー', '写真の撮影に失敗しました。もう一度お試しください。');
      }
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      // 課金状態に応じた品質設定
      const quality = isPremium ? 0.8 : 0.65;
      console.log('🖼️ ライブラリ品質:', { isPremium, quality: `${quality * 100}%` });

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: quality,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        setIsFromAlbum(true); // アルバムから選択フラグを設定
        setShowConfirmModal(true);
      }
    } catch (error) {
      Alert.alert('エラー', '写真の選択に失敗しました。もう一度お試しください。');
    }
  };

  const useTestImage = () => {
    const randomImage = DEV_TEST_IMAGES[Math.floor(Math.random() * DEV_TEST_IMAGES.length)];
    setCapturedImage(randomImage);
    setShowConfirmModal(true);
  };

  const confirmImage = async () => {
    setShowConfirmModal(false);
    
    // ユーザープロフィールを取得して自動タイミング設定を確認
    const userProfile = await UserProfileService.getProfile();
    
    if (isFromAlbum) {
      // アルバムから選択時は必ず手動選択
      setShowMealModal(true);
    } else if (userProfile.autoMealTiming) {
      // カメラ撮影 + 自動タイミング設定ONの場合
      const autoTiming = determineAutoMealTiming(selectedDate);
      handleMealSelection(autoTiming);
    } else {
      // カメラ撮影 + 自動タイミング設定OFFの場合
      setShowMealModal(true);
    }
  };

  const retakeImage = () => {
    setCapturedImage(null);
    setShowConfirmModal(false);
    setIsFromAlbum(false); // フラグをリセット
    setSelectedDate(new Date()); // 日付をリセット
  };

  const handleMealSelection = async (mealType: string) => {
    if (!capturedImage) {
      Alert.alert('エラー', '写真が選択されていません');
      return;
    }

    setSelectedMeal(mealType);
    setShowMealModal(false);
    setIsAnalyzing(true);

    try {
      // 認証済みユーザーの場合のみ制限チェック
      if (session?.user) {
        const todayCount = await getTodayMealCount(session.user.id);
        if (todayCount >= 3 && !session.user.user_metadata?.premium) {
          Alert.alert(
            '制限に達しました',
            '無料版では1日3回まで解析できます。プレミアム版にアップグレードすると無制限で解析できます。',
            [
              { text: 'キャンセル', onPress: () => setIsAnalyzing(false) },
              { 
                text: 'プレミアム版を見る', 
                onPress: () => {
                  setIsAnalyzing(false);
                  router.push('/(tabs)/profile');
                }
              }
            ]
          );
          return;
        }
      }

      // ユーザープロフィールを取得
      const userProfile = await UserProfileService.getProfile();

      // AI解析を実行（保存なし）
      const analysisResult = await analyzeMealImage(
        capturedImage,
        userProfile,
        isPremium
      );

      // 解析結果画面に遷移（保存なしフラグ付き）
      router.push({
        pathname: '/analysis-result' as any,
        params: {
          imageUri: capturedImage,
          mealTiming: mealType, // 選択された食事タイミングを正しく渡す
          analysisResult: JSON.stringify(analysisResult),
          isPremium: isPremium.toString(),
          saveToHistory: 'false', // 履歴保存フラグ
          isFromAlbum: isFromAlbum.toString(), // アルバム選択フラグ
          selectedDateTime: isFromAlbum ? selectedDate.toISOString() : undefined, // 選択された日時
        }
      });

    } catch (error) {
      console.error('解析エラー:', error);
      
      // エラーメッセージをより具体的に表示
      const errorMessage = error instanceof Error ? error.message : '解析に失敗しました。';
      
      Alert.alert(
        '解析エラー',
        errorMessage + '\n\n別の写真で試すか、しばらく時間をおいてから再度お試しください。',
        [
          { text: 'OK' },
          { 
            text: '別の写真で試す', 
            onPress: () => {
              setCapturedImage(null);
              setSelectedMeal(null);
            }
          }
        ]
      );
    } finally {
      setIsAnalyzing(false);
      setCapturedImage(null);
      setSelectedMeal(null);
    }
  };



  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
      
      {/* Header - SafeAreaを考慮した絶対位置で配置 */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>食事を撮影</Text>
          {isPremium ? (
            <View style={styles.premiumBadge}>
              <Sparkles size={12} color="#FFD700" />
              <Text style={styles.premiumText}>無制限解析</Text>
            </View>
          ) : (
            <View style={styles.limitBadge}>
              <Text style={styles.limitText}>1日3回まで</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
          <FlipHorizontal size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Guide - 絶対位置で配置 */}
      <View style={styles.guide}>
        <Text style={styles.guideText}>
          食事全体が見えるように撮影してください
        </Text>
      </View>

      {/* Controls - SafeAreaを考慮した絶対位置で配置 */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 40 }]}>
        <TouchableOpacity style={styles.libraryButton} onPress={pickImageFromLibrary}>
          <ImageIcon size={24} color="white" />
          <Text style={styles.libraryButtonText}>ライブラリ</Text>
        </TouchableOpacity>
        
        <View style={styles.captureContainer}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureInner}>
              <CameraIcon size={32} color="white" />
            </View>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.testButton} onPress={useTestImage}>
          <TestTube size={24} color="white" />
          <Text style={styles.testButtonText}>テスト</Text>
        </TouchableOpacity>
      </View>

      {/* Image Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.imageContainer}>
              {capturedImage && (
                <Image source={{ uri: capturedImage }} style={styles.previewImage} />
              )}
            </View>
            
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.retakeButton} onPress={retakeImage}>
                <RotateCcw size={20} color="#6b7280" />
                <Text style={styles.retakeButtonText}>撮り直し</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.confirmButton} onPress={confirmImage}>
                <Check size={20} color="white" />
                <Text style={styles.confirmButtonText}>この写真を使用</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Meal Time Selection Modal */}
      <Modal
        visible={showMealModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMealModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isFromAlbum && styles.expandedModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isFromAlbum ? '食事の詳細を設定' : '食事のタイミングを選択'}
              </Text>
              <TouchableOpacity onPress={() => setShowMealModal(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            {isFromAlbum && (
              <ScrollView style={styles.dateTimeSection}>
                <Text style={styles.sectionTitle}>日付・時刻</Text>
                
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => {
                    // より柔軟な日付選択
                    Alert.alert(
                      '日付を選択',
                      '食事を食べた日付を選択してください',
                      [
                        { text: '7日前', onPress: () => {
                          const date = new Date();
                          date.setDate(date.getDate() - 7);
                          setSelectedDate(date);
                        }},
                        { text: '3日前', onPress: () => {
                          const date = new Date();
                          date.setDate(date.getDate() - 3);
                          setSelectedDate(date);
                        }},
                        { text: '一昨日', onPress: () => {
                          const date = new Date();
                          date.setDate(date.getDate() - 2);
                          setSelectedDate(date);
                        }},
                        { text: '昨日', onPress: () => {
                          const date = new Date();
                          date.setDate(date.getDate() - 1);
                          setSelectedDate(date);
                        }},
                        { text: '今日', onPress: () => setSelectedDate(new Date()) },
                        { text: 'キャンセル', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <Calendar size={20} color="#ec4899" />
                  <Text style={styles.dateTimeText}>
                    {selectedDate.toLocaleDateString('ja-JP')}
                  </Text>
                </TouchableOpacity>
                

                
                <Text style={styles.sectionTitle}>食事タイミング</Text>
              </ScrollView>
            )}
            
            <View style={styles.mealOptions}>
              {mealTimes.map((meal) => {
                const IconComponent = meal.icon;
                return (
                  <TouchableOpacity
                    key={meal.id}
                    style={[styles.mealOption, { borderColor: meal.color }]}
                    onPress={() => handleMealSelection(meal.id)}
                  >
                    <IconComponent size={24} color={meal.color} />
                    <Text style={[styles.mealOptionText, { color: meal.color }]}>
                      {meal.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* 解析中ローディング */}
      <Modal
        visible={isAnalyzing}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#ec4899" />
            <Text style={styles.loadingText}>AI解析中...</Text>
            <Text style={styles.loadingSubText}>
              食材を識別し、美容効果を分析しています
            </Text>
          </View>
        </View>
      </Modal>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-SemiBold',
    color: 'white',
  },
  camera: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  closeButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-SemiBold',
    color: 'white',
  },
  premiumBadge: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  premiumText: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-SemiBold',
    color: 'white',
  },
  flipButton: {
    padding: 8,
  },
  guide: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  guideText: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Medium',
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  libraryButton: {
    alignItems: 'center',
    padding: 12,
  },
  libraryButtonText: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Medium',
    color: 'white',
    marginTop: 4,
  },
  captureContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ec4899',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 48,
  },
  testButton: {
    alignItems: 'center',
    padding: 12,
  },
  testButtonText: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Medium',
    color: 'white',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  confirmModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  imageContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  confirmButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  retakeButtonText: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#6b7280',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ec4899',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-SemiBold',
    color: 'white',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '50%',
  },
  expandedModalContent: {
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
  },
  dateTimeSection: {
    marginBottom: 20,
    maxHeight: 200,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
    marginBottom: 12,
    marginTop: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateTimeText: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Medium',
    color: '#1f2937',
    marginLeft: 12,
  },
  mealOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
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
  mealOptionText: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-SemiBold',
    marginTop: 8,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 250,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  limitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  limitText: {
    fontSize: 10,
    fontFamily: 'NotoSansJP-SemiBold',
    color: 'white',
  },

});
