import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { 
  Camera as CameraIcon, 
  FlipHorizontal, 
  X, 
  Coffee, 
  Sun, 
  Moon, 
  Utensils 
} from 'lucide-react-native';
import { router } from 'expo-router';

const mealTimes = [
  { id: 'breakfast', label: '朝食', icon: Sun, color: '#f59e0b' },
  { id: 'lunch', label: '昼食', icon: Sun, color: '#ec4899' },
  { id: 'dinner', label: '夕食', icon: Moon, color: '#8b5cf6' },
  { id: 'snack', label: '間食', icon: Coffee, color: '#10b981' },
];

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [showMealModal, setShowMealModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

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
        const photo = await cameraRef.current.takePictureAsync();
        if (photo) {
          setShowMealModal(true);
        }
      } catch (error) {
        Alert.alert('エラー', '写真の撮影に失敗しました。もう一度お試しください。');
      }
    }
  };

  const handleMealSelection = (mealType: string) => {
    setSelectedMeal(mealType);
    setShowMealModal(false);
    // 解析画面に遷移（実装時）
    Alert.alert('解析開始', `${mealTimes.find(m => m.id === mealType)?.label}として解析を開始します。`);
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
          <View style={styles.captureContainer}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureInner}>
                <CameraIcon size={32} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>

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
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
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
});