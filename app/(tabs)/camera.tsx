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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  TestTube
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { processMealAnalysis, getTodayMealCount } from '../../lib/meal-service';

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
  const cameraRef = useRef<CameraView>(null);
  const { session } = useAuth();

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
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        if (photo) {
          setCapturedImage(photo.uri);
          setShowConfirmModal(true);
        }
      } catch (error) {
        Alert.alert('エラー', '写真の撮影に失敗しました。もう一度お試しください。');
      }
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
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

  const confirmImage = () => {
    setShowConfirmModal(false);
    setShowMealModal(true);
  };

  const retakeImage = () => {
    setCapturedImage(null);
    setShowConfirmModal(false);
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
            '無料版では1日3回まで解析できます。プレミアム版にアップグレードしてください。',
            [
              { text: 'OK', onPress: () => setIsAnalyzing(false) }
            ]
          );
          return;
        }
      }

      // ユーザープロフィールを取得（仮のデータ）
      const userProfile = {
        beautyCategories: ['skin_care', 'anti_aging'], // 実際はSupabaseから取得
        beautyLevel: 'beginner' as const
      };

      // ゲストユーザーの場合は一時的なIDを使用
      const userId = session?.user?.id || 'guest_user';

      // AI解析を実行
      const result = await processMealAnalysis(
        capturedImage,
        mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        userId,
        userProfile
      );

      // 解析結果画面に遷移
      router.push({
        pathname: '/analysis-result' as any,
        params: {
          mealRecordId: result.mealRecord.id,
          analysisData: JSON.stringify(result.analysisResult)
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
    <SafeAreaView style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>食事を撮影</Text>
          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <FlipHorizontal size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Guide */}
        <View style={styles.guide}>
          <Text style={styles.guideText}>食事全体が見えるように撮影してください</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
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
      </CameraView>

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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>食事のタイミングを選択</Text>
              <TouchableOpacity onPress={() => setShowMealModal(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
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
    </SafeAreaView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
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
    bottom: 40,
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
});