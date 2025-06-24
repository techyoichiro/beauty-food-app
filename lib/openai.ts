import OpenAI from 'openai';

// OpenAI APIキー（環境変数から取得）
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-api-key-here') {
  throw new Error('Missing OpenAI API key. Please check your .env file.');
}

// OpenAIクライアントの初期化
export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // React Native/Expoで必要
});

// 美容カテゴリー別の詳細情報
const BEAUTY_CATEGORY_DETAILS = {
  skin_care: {
    name: '美肌',
    focus: 'コラーゲン生成、ビタミンC・E、抗酸化物質、セラミド、ヒアルロン酸の材料',
    keywords: ['ビタミンC', 'ビタミンE', 'コラーゲン', 'アスタキサンチン', 'リコピン', 'ベータカロテン'],
    adviceStyle: '肌のハリ・ツヤ・透明感を重視した食材組み合わせ'
  },
  anti_aging: {
    name: 'アンチエイジング',
    focus: '活性酸素除去、抗酸化作用、細胞修復、DNA保護、老化防止',
    keywords: ['ポリフェノール', 'カテキン', 'アントシアニン', 'レスベラトロール', 'セサミン', 'クルクミン'],
    adviceStyle: '細胞レベルでの老化防止と修復を重視した栄養素'
  },
  detox: {
    name: 'デトックス',
    focus: '肝機能サポート、腸内環境改善、老廃物排出、水分代謝促進',
    keywords: ['食物繊維', 'カリウム', 'グルタチオン', '硫黄化合物', '乳酸菌', 'オリゴ糖'],
    adviceStyle: '体内浄化と代謝促進を重視した食材選択'
  },
  circulation: {
    name: '血行促進',
    focus: '血流改善、冷え性改善、酸素・栄養素の運搬効率向上',
    keywords: ['鉄分', 'ビタミンE', 'ナイアシン', 'カプサイシン', 'ショウガオール', 'EPA・DHA'],
    adviceStyle: '血流と体温向上を重視した温活食材'
  },
  hair_nails: {
    name: '髪・爪の健康',
    focus: 'ケラチン生成、タンパク質合成、ミネラル補給、毛髪成長促進',
    keywords: ['タンパク質', '亜鉛', 'ビオチン', 'シスチン', 'メチオニン', 'ケイ素'],
    adviceStyle: '髪と爪の構造材料となる栄養素を重視'
  }
};

// 美意識レベル別の説明深度
const BEAUTY_LEVEL_STYLES = {
  beginner: {
    name: '初心者',
    style: 'わかりやすく簡潔に、基本的な栄養素の効果を説明',
    example: '「ビタミンCは美肌に良い」'
  },
  intermediate: {
    name: '中級者',
    style: '栄養素の具体的な働きと美容効果の関連を説明',
    example: '「ビタミンCはコラーゲン合成を促進し、肌のハリを保つ」'
  },
  advanced: {
    name: '上級者',
    style: '生化学的メカニズムと科学的根拠を含む詳細説明',
    example: '「アスコルビン酸がプロリン・リジンの水酸化を促進しコラーゲン三重らせん構造を安定化」'
  }
};

// 美容カテゴリー別のアドバイス生成
const generateCategorySpecificAdvice = (categories: string[], level: string) => {
  const selectedCategories = categories.map(cat => BEAUTY_CATEGORY_DETAILS[cat as keyof typeof BEAUTY_CATEGORY_DETAILS]).filter(Boolean);
  const levelInfo = BEAUTY_LEVEL_STYLES[level as keyof typeof BEAUTY_LEVEL_STYLES] || BEAUTY_LEVEL_STYLES.intermediate;

  const focusAreas = selectedCategories.map(cat => cat.focus).join('、');
  const keywords = selectedCategories.flatMap(cat => cat.keywords).join('、');
  const adviceStyles = selectedCategories.map(cat => cat.adviceStyle).join('、');

  return {
    focusAreas,
    keywords,
    adviceStyles,
    levelStyle: levelInfo.style,
    categoryNames: selectedCategories.map(cat => cat.name).join('・')
  };
};

// 食事解析用のプロンプトテンプレート
export const createFoodAnalysisPrompt = (userProfile: {
  beautyCategories: string[];
  beautyLevel: string;
}) => {
  const categoryInfo = generateCategorySpecificAdvice(userProfile.beautyCategories, userProfile.beautyLevel);
  
  return `
この食事画像を分析して、以下のJSON形式で回答してください。

ユーザープロフィール:
- 美容目標: ${categoryInfo.categoryNames}
- 美容レベル: ${BEAUTY_LEVEL_STYLES[userProfile.beautyLevel as keyof typeof BEAUTY_LEVEL_STYLES]?.name || '中級者'}
- 重点フォーカス: ${categoryInfo.focusAreas}

【重要】アドバイス生成の指針:
1. 説明レベル: ${categoryInfo.levelStyle}
2. 重視する栄養素: ${categoryInfo.keywords}
3. アドバイススタイル: ${categoryInfo.adviceStyles}

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
  "immediate_advice": "今すぐできる改善提案（ユーザーの美容目標「${categoryInfo.categoryNames}」に特化）",
  "next_meal_advice": "次回向け改善提案（ユーザーの美容目標「${categoryInfo.categoryNames}」に特化）",
  "beauty_benefits": [
    "この食事から得られる美容効果1（${categoryInfo.categoryNames}観点）",
    "この食事から得られる美容効果2（${categoryInfo.categoryNames}観点）"
  ]
}

【アドバイス生成の具体例】
美肌重視の場合:
- immediate_advice: "レモンを絞ってビタミンCをプラス！鮭のアスタキサンチンとの相乗効果で美肌力アップ"
- next_meal_advice: "次回はトマトサラダを追加。リコピンでコラーゲン生成をさらに促進しましょう"

アンチエイジング重視の場合:
- immediate_advice: "緑茶と一緒に摂取すると抗酸化作用が倍増！カテキンが活性酸素を除去します"
- next_meal_advice: "ナッツ類（特にアーモンド）を間食に。ビタミンEで細胞の老化を防ぎましょう"

デトックス重視の場合:
- immediate_advice: "食後に白湯を飲んで代謝アップ！消化を助けて老廃物の排出を促進"
- next_meal_advice: "明日の朝食にアボカドをプラス。食物繊維で腸内環境を整えましょう"

血行促進重視の場合:
- immediate_advice: "生姜をすりおろして追加！体を温めて血流改善効果を高めます"
- next_meal_advice: "次回は赤身肉や小松菜で鉄分補給。貧血予防で血行をさらに良くしましょう"

髪・爪重視の場合:
- immediate_advice: "ごまをふりかけて亜鉛とビオチンをプラス！髪の成長に必要な栄養素です"
- next_meal_advice: "卵料理を追加してタンパク質強化。髪と爪の主成分ケラチンの材料です"

重要事項:
- 有効なJSONオブジェクトのみを返してください
- 日本語のテキストを含めてください
- 数値は具体的に算出してください
- 美容スコアは科学的根拠に基づいて算出してください
- ユーザーの美容目標に特化したアドバイスを生成してください
- 説明レベルは「${categoryInfo.levelStyle}」に合わせてください
`;
};

export default openai; 