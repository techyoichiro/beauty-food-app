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

interface BeautyLevel {
  id: string;
  name: string;
  description: string;
  icon: string;
  details: string[];
}

const beautyLevels: BeautyLevel[] = [
  {
    id: 'beginner',
    name: '初心者',
    description: '美容食事を始めたばかり',
    icon: '🌱',
    details: [
      '基本的な栄養知識を学びたい',
      'シンプルなアドバイスが欲しい',
      '美容効果を実感したい',
    ],
  },
  {
    id: 'intermediate',
    name: '中級者',
    description: 'ある程度の知識がある',
    icon: '🌸',
    details: [
      '栄養バランスを意識している',
      '具体的な改善点を知りたい',
      '効果的な食材を取り入れたい',
    ],
  },
  {
    id: 'advanced',
    name: '上級者',
    description: '美容食事に詳しい',
    icon: '🌟',
    details: [
      '高度な栄養分析を求める',
      '細かい成分まで把握したい',
      '最適化されたアドバイスが欲しい',
    ],
  },
];

export default function BeautyLevelScreen() {
  const [selectedLevel, setSelectedLevel] = useState<string>('');

  const handleBack = () => {
    router.back();
  };

  const handleLevelSelect = (levelId: string) => {
    setSelectedLevel(levelId);
  };

  const handleNext = () => {
    if (selectedLevel) {
      router.push('/onboarding/apple-signin' as any);
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
            <Text style={styles.title}>美容レベルを選択</Text>
            <View style={styles.placeholder} />
          </View>

          {/* プログレスバー */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '66%' }]} />
            </View>
            <Text style={styles.progressText}>2 / 3</Text>
          </View>

          {/* 説明 */}
          <Text style={styles.description}>
            あなたの美容食事に関する{'\n'}
            知識レベルを教えてください
          </Text>

          {/* レベル一覧 */}
          <ScrollView style={styles.levelsContainer} showsVerticalScrollIndicator={false}>
            {beautyLevels.map((level) => {
              const isSelected = selectedLevel === level.id;
              
              return (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.levelCard,
                    isSelected && styles.levelCardSelected,
                  ]}
                  onPress={() => handleLevelSelect(level.id)}
                >
                  <View style={styles.levelContent}>
                    <View style={styles.levelHeader}>
                      <Text style={styles.levelIcon}>{level.icon}</Text>
                      <View style={styles.levelInfo}>
                        <Text style={[
                          styles.levelName,
                          isSelected && styles.levelNameSelected,
                        ]}>
                          {level.name}
                        </Text>
                        <Text style={[
                          styles.levelDescription,
                          isSelected && styles.levelDescriptionSelected,
                        ]}>
                          {level.description}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkIcon}>
                          <Check size={20} color="#FFF" />
                        </View>
                      )}
                    </View>
                    
                    {/* 詳細リスト */}
                    <View style={styles.detailsList}>
                      {level.details.map((detail, index) => (
                        <View key={index} style={styles.detailItem}>
                          <Text style={styles.detailBullet}>•</Text>
                          <Text style={[
                            styles.detailText,
                            isSelected && styles.detailTextSelected,
                          ]}>
                            {detail}
                          </Text>
                        </View>
                      ))}
                    </View>
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
                !selectedLevel && styles.nextButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={!selectedLevel}
            >
              <Text style={[
                styles.nextButtonText,
                !selectedLevel && styles.nextButtonTextDisabled,
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
  levelsContainer: {
    flex: 1,
  },
  levelCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  levelCardSelected: {
    backgroundColor: '#FF6B9D',
    borderColor: '#FF6B9D',
  },
  levelContent: {
    width: '100%',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-Bold',
    color: '#2D1B69',
    marginBottom: 4,
  },
  levelNameSelected: {
    color: '#FFF',
  },
  levelDescription: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#666',
  },
  levelDescriptionSelected: {
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
  detailsList: {
    paddingLeft: 48,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailBullet: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Regular',
    color: '#666',
    marginRight: 8,
    marginTop: 2,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#666',
    lineHeight: 20,
  },
  detailTextSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
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