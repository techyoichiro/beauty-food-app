import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  HelpCircle, 
  MessageCircle, 
  FileText, 
  ChevronRight,
  Send,
  Book,
  AlertCircle,
  Star,
  X,
  User,
  AtSign
} from 'lucide-react-native';
import { sendContactFormToSlack } from '../lib/slack-service';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'basic' | 'analysis' | 'premium' | 'account';
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'AI解析の精度はどの程度ですか？',
    answer: 'BeautyFoodのAI解析は、最新のGPT-4 Visionを使用し、栄養学・美容学の専門知識に基づいています。一般的な食材については90%以上の精度で識別・分析が可能ですが、特殊な料理や複雑な調理法の場合は精度が下がる可能性があります。',
    category: 'analysis'
  },
  {
    id: '2',
    question: '無料版と有料版の違いは何ですか？',
    answer: '無料版は1日3回まで解析可能で、基本的な美容スコアとアドバイスを提供します。プレミアム版では無制限解析、詳細な月次レポート、美容食材ランキング、パーソナライズされた食事プランなどの機能をご利用いただけます。',
    category: 'premium'
  },
  {
    id: '3',
    question: '美容カテゴリーはどのように選べばよいですか？',
    answer: '最も重視したい美容効果を1-3個選択することをお勧めします。複数選択することで、バランスの取れたアドバイスを受けられます。設定はプロフィール画面からいつでも変更可能です。',
    category: 'basic'
  },
  {
    id: '4',
    question: 'データの安全性について教えてください',
    answer: '撮影された写真や個人データは、業界標準の暗号化技術により保護されています。写真はAI解析後に自動削除され、個人を特定できる情報は一切保存されません。詳細はプライバシーポリシーをご確認ください。',
    category: 'account'
  },
  {
    id: '5',
    question: 'アカウントを削除したい場合はどうすればよいですか？',
    answer: 'プロフィール画面 → プライバシー設定 → 「すべてのデータを削除」から削除申請が可能です。申請後24時間以内にすべてのデータが完全に削除されます。',
    category: 'account'
  },
  {
    id: '6',
    question: '解析結果が間違っている場合はどうすればよいですか？',
    answer: 'AI解析は継続的に改善されていますが、完璧ではありません。明らかに間違った結果の場合は、サポートまでご連絡ください。フィードバックを基にAIの精度向上に努めています。',
    category: 'analysis'
  }
];

export default function HelpSupportScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'all', label: 'すべて' },
    { id: 'basic', label: '基本操作' },
    { id: 'analysis', label: 'AI解析' },
    { id: 'premium', label: 'プレミアム' },
    { id: 'account', label: 'アカウント' }
  ];

  const filteredFAQ = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const handleFAQPress = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleContactFormOpen = () => {
    setShowContactForm(true);
  };

  const handleContactFormClose = () => {
    setShowContactForm(false);
    setContactForm({ name: '', email: '', message: '' });
  };

  const handleContactSubmit = async () => {
    if (!contactForm.name.trim()) {
      Alert.alert('エラー', 'お名前を入力してください');
      return;
    }
    if (!contactForm.email.trim()) {
      Alert.alert('エラー', 'メールアドレスを入力してください');
      return;
    }
    if (!contactForm.message.trim()) {
      Alert.alert('エラー', 'お問い合わせ内容を入力してください');
      return;
    }

    // 簡単なメールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactForm.email)) {
      Alert.alert('エラー', '正しいメールアドレスを入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await sendContactFormToSlack({
        name: contactForm.name,
        email: contactForm.email,
        message: contactForm.message
      });
      
      if (result.success) {
        Alert.alert(
          'お問い合わせ送信完了',
          'お問い合わせありがとうございます。通常24時間以内にメールでご返信いたします。',
          [
            {
              text: 'OK',
              onPress: () => handleContactFormClose()
            }
          ]
        );
      } else {
        throw new Error(result.error || '送信に失敗しました');
      }
    } catch (error) {
      Alert.alert(
        'エラー',
        'お問い合わせの送信に失敗しました。しばらく時間をおいて再度お試しください。',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserGuide = () => {
    Alert.alert(
      '使い方ガイド',
      'BeautyFoodの詳しい使い方ガイドをブラウザで開きますか？',
      [
        { text: 'キャンセル' },
        {
          text: '開く',
          onPress: () => {
            Alert.alert('情報', '使い方ガイドページを開きました（デモ）');
          }
        }
      ]
    );
  };

  const handleAppReview = () => {
    Alert.alert(
      'アプリレビュー',
      'BeautyFoodを気に入っていただけましたか？\nApp Storeでレビューを書いていただけると嬉しいです！',
      [
        { text: 'あとで' },
        {
          text: 'レビューを書く',
          onPress: () => {
            Alert.alert('情報', 'App Storeを開きました（デモ）');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ヘルプ・サポート</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* クイックアクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>お困りですか？</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleUserGuide}>
            <Book size={24} color="#ec4899" />
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>使い方ガイド</Text>
              <Text style={styles.actionDescription}>基本的な使い方を確認する</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, styles.primaryActionCard]} onPress={handleContactFormOpen}>
            <MessageCircle size={24} color="#ec4899" />
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>お問い合わせフォーム</Text>
              <Text style={styles.actionDescription}>24時間以内にメールでご返信いたします</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* よくある質問 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>よくある質問</Text>
          
          {/* カテゴリーフィルター */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipSelected
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category.id && styles.categoryChipTextSelected
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* FAQ リスト */}
          {filteredFAQ.map((faq) => (
            <TouchableOpacity
              key={faq.id}
              style={styles.faqItem}
              onPress={() => handleFAQPress(faq.id)}
            >
              <View style={styles.faqQuestion}>
                <HelpCircle size={20} color="#ec4899" />
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                <ChevronRight 
                  size={20} 
                  color="#9ca3af"
                  style={[
                    styles.faqChevron,
                    expandedFAQ === faq.id && styles.faqChevronExpanded
                  ]}
                />
              </View>
              {expandedFAQ === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* アプリ情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アプリについて</Text>
          
          <TouchableOpacity style={styles.infoItem} onPress={handleAppReview}>
            <Star size={24} color="#f59e0b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>アプリを評価する</Text>
              <Text style={styles.infoDescription}>App Storeでレビューを書く</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.infoItem}>
            <AlertCircle size={24} color="#6b7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>アプリバージョン</Text>
              <Text style={styles.infoDescription}>BeautyFood v1.0.0</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            BeautyFood株式会社{'\n'}
            〒100-0001 東京都千代田区千代田1-1-1{'\n'}
            © 2024 BeautyFood Inc. All rights reserved.
          </Text>
        </View>
      </ScrollView>

      {/* お問い合わせフォーム（WebView Modal） */}
      <Modal
        visible={showContactForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleContactFormClose}
            >
              <X size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>お問い合わせ</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>お名前 *</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="山田 太郎"
                  value={contactForm.name}
                  onChangeText={(text) => setContactForm({...contactForm, name: text})}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>メールアドレス *</Text>
              <View style={styles.inputWrapper}>
                <AtSign size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="example@email.com"
                  value={contactForm.email}
                  onChangeText={(text) => setContactForm({...contactForm, email: text})}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>お問い合わせ内容 *</Text>
              <TextInput
                style={styles.textAreaInput}
                placeholder="お困りの内容を詳しくお聞かせください..."
                value={contactForm.message}
                onChangeText={(text) => setContactForm({...contactForm, message: text})}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
              onPress={handleContactSubmit}
              disabled={isSubmitting}
            >
              <Send size={16} color="white" />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? '送信中...' : '送信する'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.formNote}>
              * は必須項目です{'\n'}
              通常24時間以内にメールでご返信いたします。
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  primaryActionCard: {
    backgroundColor: '#fef7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#ec4899',
  },
  actionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Medium',
    color: '#1f2937',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
  },
  categoryScroll: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  categoryChipSelected: {
    backgroundColor: '#ec4899',
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Medium',
    color: '#6b7280',
  },
  categoryChipTextSelected: {
    color: 'white',
  },
  faqItem: {
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'NotoSansJP-Medium',
    color: '#1f2937',
    marginLeft: 12,
  },
  faqChevron: {
    transform: [{ rotate: '0deg' }],
  },
  faqChevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  faqAnswer: {
    paddingBottom: 16,
    paddingLeft: 32,
  },
  faqAnswerText: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    lineHeight: 22,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Medium',
    color: '#1f2937',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
  },
  footer: {
    padding: 20,
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansJP-SemiBold',
    color: '#1f2937',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Medium',
    color: '#1f2937',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'NotoSansJP-Regular',
    color: '#1f2937',
    paddingVertical: 12,
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'NotoSansJP-Regular',
    color: '#1f2937',
    backgroundColor: '#fafafa',
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: '#ec4899',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Medium',
    color: 'white',
    marginLeft: 8,
  },
  formNote: {
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 20,
  },
}); 