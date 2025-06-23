import OpenAI from 'openai';

// OpenAI APIキー（環境変数から取得）
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || 'your-api-key-here';

// OpenAIクライアントの初期化
export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // React Native/Expoで必要
});

// 食事解析用のプロンプトテンプレート
export const createFoodAnalysisPrompt = (userProfile: {
  beautyCategories: string[];
  beautyLevel: string;
}) => {
  return `
この食事画像を分析して、以下のJSON形式で回答してください。

ユーザープロフィール:
- 美容目標: ${userProfile.beautyCategories.join('、')}
- 美容レベル: ${userProfile.beautyLevel === 'beginner' ? '初心者' : userProfile.beautyLevel === 'intermediate' ? '中級者' : '上級者'}

以下のJSON形式で回答してください:

{
  "detected_foods": [
    {
      "name": "食材名（日本語）",
      "category": "protein|carb|vegetable|fruit|fat|other",
      "estimated_amount": "推定量（例：100g、1個）",
      "confidence": 0.95
    }
  ],
  "nutrition_analysis": {
    "calories": 推定カロリー数値,
    "protein": タンパク質(g),
    "carbohydrates": 炭水化物(g),
    "fat": 脂質(g),
    "fiber": 食物繊維(g),
    "vitamins": {
      "vitamin_c": ビタミンC(mg),
      "vitamin_e": ビタミンE(mg),
      "vitamin_a": ビタミンA(μg),
      "vitamin_b_complex": ビタミンB群総合スコア(1-10)
    },
    "minerals": {
      "iron": 鉄分(mg),
      "zinc": 亜鉛(mg),
      "calcium": カルシウム(mg),
      "magnesium": マグネシウム(mg)
    }
  },
  "beauty_score": {
    "skin_care": 美肌スコア(0-100),
    "anti_aging": アンチエイジングスコア(0-100),
    "detox": デトックススコア(0-100),
    "circulation": 血行促進スコア(0-100),
    "hair_nails": 髪・爪健康スコア(0-100),
    "overall": 総合美容スコア(0-100)
  },
  "immediate_advice": "今すぐできる改善提案：現在の食事に追加・組み合わせできる具体的な食材や飲み物（例：オレンジジュースを一緒に飲むとビタミンC摂取量がアップ）",
  "next_meal_advice": "次回向け改善提案：次の食事で意識すべき具体的な食材や調理法（例：トマトサラダを追加すると抗酸化作用がさらに高まります）",
  "beauty_benefits": [
    "この食事から得られる美容効果1",
    "この食事から得られる美容効果2"
  ]
}

重要事項:
- 有効なJSONオブジェクトのみを返してください
- 日本語のテキストを含めてください
- 数値は具体的に算出してください
- 美容スコアは科学的根拠に基づいて算出してください

アドバイスの詳細指示:
- immediate_advice: 今すぐ実行可能な具体的提案（現在の食事に追加できる食材・飲み物・調味料など）
- next_meal_advice: 次の食事で取り入れるべき具体的な食材や調理法（計画的な改善提案）
- 両方とも実践的で、すぐに行動に移せる内容にしてください
- 美容効果との関連性を明確にしてください
`;
};

export default openai; 