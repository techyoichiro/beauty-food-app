import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, User, Check } from 'lucide-react-native';

interface EditNameModalProps {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (newName: string) => void;
}

export default function EditNameModal({ 
  visible, 
  currentName, 
  onClose, 
  onSave 
}: EditNameModalProps) {
  const [name, setName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('エラー', '名前を入力してください。');
      return;
    }

    if (name.trim().length < 2) {
      Alert.alert('エラー', '名前は2文字以上で入力してください。');
      return;
    }

    if (name.trim().length > 20) {
      Alert.alert('エラー', '名前は20文字以内で入力してください。');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSave(name.trim());
      onClose();
    } catch (error) {
      Alert.alert('エラー', '名前の更新に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName(currentName);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        >
          <TouchableOpacity 
            style={styles.modal} 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
              <Text style={styles.title}>名前を編集</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Content */}
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <User size={24} color="#ec4899" />
              </View>
              
              <Text style={styles.label}>お名前</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="名前を入力してください"
                placeholderTextColor="#9ca3af"
                maxLength={20}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
              
              <Text style={styles.characterCount}>
                {name.length}/20文字
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleClose}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.saveButton,
                  (!name.trim() || isLoading) && styles.saveButtonDisabled
                ]} 
                onPress={handleSave}
                disabled={!name.trim() || isLoading}
              >
                {isLoading ? (
                  <Text style={styles.saveButtonText}>保存中...</Text>
                ) : (
                  <>
                    <Check size={16} color="white" />
                    <Text style={styles.saveButtonText}>保存</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-Bold',
    color: '#1f2937',
  },
  placeholder: {
    width: 28,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'NotoSansJP-Regular',
    color: '#1f2937',
    backgroundColor: '#fafafa',
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#ec4899',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-SemiBold',
    color: 'white',
  },
});