import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';

interface BeautyCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const beautyCategories: BeautyCategory[] = [
  {
    id: 'skin_care',
    name: '美肌',
    description: 'ハリ・ツヤのある健康的な肌を目指す',
    icon: '✨',
  },
  {
    id: 'anti_aging',
    name: 'アンチエイジング',
    description: '若々しさを保ち、老化を防ぐ',
    icon: '🌟',
  },
  {
    id: 'detox',
    name: 'デトックス',
    description: '体内の毒素を排出し、内側から美しく',
    icon: '🌿',
  },
  {
    id: 'circulation',
    name: '血行促進',
    description: '血流を改善し、顔色や冷え性を改善',
    icon: '💫',
  },
  {
    id: 'hair_nails',
    name: '髪・爪の健康',
    description: '美しい髪と強い爪を育てる',
    icon: '💅',
  },
];

export default function BeautyCategoriesScreen() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleBack = () => {
    router.back();
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleNext = () => {
    if (selectedCategories.length > 0) {
      router.push('/onboarding/beauty-level' as any);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFF', '#FFB347', '#FF6B9D']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ArrowLeft size={24} color="#2D1B69" />
            </TouchableOpacity>
            <Text style={styles.title}>美容の目標を選択</Text>
            <View style={styles.placeholder} />
          </View>

          {/* プログレスバー */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '33%' }]} />
            </View>
            <Text style={styles.progressText}>1 / 3</Text>
          </View>

          {/* 説明 */}
          <Text style={styles.description}>
            あなたが重視する美容の目標を選んでください{'\n'}
            （複数選択可能）
          </Text>

          {/* カテゴリー一覧 */}
          <ScrollView style={styles.categoriesContainer} showsVerticalScrollIndicator={false}>
            {beautyCategories.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    isSelected && styles.categoryCardSelected,
                  ]}
                  onPress={() => handleCategoryToggle(category.id)}
                >
                  <View style={styles.categoryContent}>
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <View style={styles.categoryText}>
                      <Text style={[
                        styles.categoryName,
                        isSelected && styles.categoryNameSelected,
                      ]}>
                        {category.name}
                      </Text>
                      <Text style={[
                        styles.categoryDescription,
                        isSelected && styles.categoryDescriptionSelected,
                      ]}>
                        {category.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkIcon}>
                        <Check size={20} color="#FFF" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 次へボタン */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.nextButton,
                selectedCategories.length === 0 && styles.nextButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={selectedCategories.length === 0}
            >
              <Text style={[
                styles.nextButtonText,
                selectedCategories.length === 0 && styles.nextButtonTextDisabled,
              ]}>
                次へ
              </Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
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
  progressContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B9D',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: '#666',
  },
  description: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  categoriesContainer: {
    flex: 1,
  },
  categoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    backgroundColor: '#FF6B9D',
    borderColor: '#FF6B9D',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  categoryText: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-Bold',
    color: '#2D1B69',
    marginBottom: 4,
  },
  categoryNameSelected: {
    color: '#FFF',
  },
  categoryDescription: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#666',
    lineHeight: 20,
  },
  categoryDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  nextButton: {
    backgroundColor: '#FF6B9D',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 25,
    shadowColor: '#FF6B9D',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#CCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-Bold',
    color: '#FFF',
  },
  nextButtonTextDisabled: {
    color: '#999',
  },
}); 