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

// 美容スタイル別の説明深度
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
この食事画像を詳細に分析して、以下のJSON形式で回答してください。

【食材検出の重要指針】
1. 具体的な食材名を特定してください（例：「魚」→「サバ」「鮭」「マグロ」など）
2. 野菜は種類を詳しく分析してください（例：「野菜」→「玉ねぎ」「人参」「ピーマン」など）
3. 調理法や料理名も考慮してください（例：「カレー」「炒め物」「煮物」など）
4. 香辛料やソース、調味料も可能な限り検出してください
5. 部分的に見える食材も推測して含めてください
6. 信頼度は控えめに設定し、不確実な場合は0.6-0.8程度にしてください
7. 料理の文化的背景を考慮してください（例：スリランカカレー、タイ料理、イタリア料理など）
8. 典型的な組み合わせの食材も推測して含めてください（例：カレーならココナッツミルク、ガラムマサラなど）

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
      "name": "具体的な食材名（例：鮭の切り身、玉ねぎ、ココナッツミルク、ターメリック等）",
      "category": "protein|carb|vegetable|fruit|fat|spice|sauce|other",
      "estimated_amount": "推定量（例：100g、1個、大さじ1）",
      "confidence": 0.75
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
    "今回の食事で期待できる美容効果1（${categoryInfo.categoryNames}観点）",
    "今回の食事で期待できる美容効果2（${categoryInfo.categoryNames}観点）",
    "今回の食事で期待できる美容効果3（${categoryInfo.categoryNames}観点）"
  ]
}

【アドバイス生成の重要原則】
1. 同じ栄養素でも多様な食材・方法を提案する
2. 現在の食事に含まれる食材を活かした提案をする
3. 季節や時間帯を考慮した実用的なアドバイス
4. ワンパターンを避け、バリエーション豊かな提案をする

【栄養素別アドバイスバリエーション例】
ビタミンC不足の場合（レモン以外の多様な提案）:
- "ブロッコリーを蒸し野菜で追加！ビタミンCがレモンの2倍含まれています"
- "いちごを3-4個デザートに。甘みとビタミンCを同時に摂取できます"
- "パプリカ（赤・黄）をサラダに追加。色鮮やかでビタミンC豊富！"
- "キウイフルーツ1個で1日分のビタミンC。食後のデザートに最適"
- "芽キャベツを炒め物に。小さくても栄養価は抜群です"
- "ゴーヤチャンプルーで苦味とビタミンCを。沖縄の美容食材"
- "ローズヒップティーで温活しながらビタミンC補給"

タンパク質不足の場合（卵以外の多様な提案）:
- "納豆を追加して植物性タンパク質と発酵パワーをプラス"
- "ギリシャヨーグルトでタンパク質と乳酸菌を同時摂取"
- "豆腐ハンバーグで低カロリー・高タンパク質の美容食"
- "アーモンドバターをパンに塗って植物性タンパク質を"
- "ささみのサラダチキンで低脂質・高タンパク質"
- "レンズ豆のスープで食物繊維とタンパク質を同時に"

鉄分不足の場合（ほうれん草以外の多様な提案）:
- "あさりの味噌汁で鉄分とビタミンB12を同時摂取"
- "ひじきの煮物で海藻ミネラルと鉄分を補給"
- "レバーペーストをクラッカーに。鉄分の王様です"
- "プルーンを3個間食に。自然な甘みと鉄分補給"
- "牛赤身肉のステーキで吸収率の高いヘム鉄を"
- "かつおのたたきで鉄分とDHAを同時に"

【アドバイス生成の具体例】
美肌重視の場合:
- immediate_advice: "パプリカを追加して彩りアップ！ビタミンCがレモンの3倍で美肌効果抜群"
- next_meal_advice: "次回はアボカドトーストを。ビタミンEで肌の潤いを内側から"

アンチエイジング重視の場合:
- immediate_advice: "ブルーベリーをトッピング！アントシアニンで活性酸素を撃退"
- next_meal_advice: "明日はくるみを間食に。オメガ3脂肪酸で脳と肌の老化防止"

デトックス重視の場合:
- immediate_advice: "大根おろしを添えて消化酵素をプラス！代謝アップで老廃物排出"
- next_meal_advice: "次回はわかめスープを。海藻の食物繊維で腸内クレンジング"

血行促進重視の場合:
- immediate_advice: "シナモンパウダーをふりかけて血行促進！体がポカポカ温まります"
- next_meal_advice: "次回はにんにくを効かせた料理を。血液サラサラ効果で美肌に"

髪・爪重視の場合:
- immediate_advice: "アーモンドスライスをトッピング！ビタミンEで髪にツヤを"
- next_meal_advice: "次回は牡蠣を使った料理を。亜鉛で髪の成長を促進しましょう"

【時間帯・季節別アドバイス例】
朝食時のアドバイス:
- "朝のビタミンC補給にはグレープフルーツがおすすめ。目覚めもスッキリ！"
- "朝食にベリー類をプラス。抗酸化作用で1日の美容をサポート"

昼食時のアドバイス:
- "ランチにはトマトサラダを。リコピンは昼間の紫外線対策に効果的"
- "お昼には緑黄色野菜を。午後の活動エネルギーと美容効果を両立"

夕食時のアドバイス:
- "夜は消化の良いアボカドを。良質な脂質で夜間の肌修復をサポート"
- "夕食後にはハーブティー。リラックス効果と美容効果を同時に"

春のアドバイス:
- "春キャベツでデトックス！新陳代謝を高めて美肌を目指しましょう"
- "たけのこで食物繊維補給。春の体内リセットに最適です"

夏のアドバイス:
- "夏野菜のトマトで紫外線対策！リコピンが肌を内側から守ります"
- "きゅうりで水分補給と美肌効果。夏の定番美容食材です"

秋のアドバイス:
- "秋鮭でアスタキサンチン補給！季節の変わり目の肌荒れ対策に"
- "かぼちゃでβカロテン摂取。秋の乾燥肌対策に効果的"

冬のアドバイス:
- "冬の根菜で体を温めて血行促進。美肌効果もアップします"
- "みかんでビタミンC補給。冬の乾燥と風邪予防に一石二鳥"

【食材検出の具体例】
カレー料理の場合:
- ❌ 悪い例: "魚", "野菜", "ご飯", "スープ"
- ✅ 良い例: "マグロの刺身", "玉ねぎ", "人参", "ピーマン", "ココナッツミルク", "ターメリック", "クミン", "コリアンダー", "ガラムマサラ", "バスマティライス", "カレールー"

サラダの場合:
- ❌ 悪い例: "野菜", "ドレッシング"
- ✅ 良い例: "レタス", "トマト", "きゅうり", "アボカド", "オリーブオイル", "バルサミコ酢", "パルメザンチーズ", "クルトン"

重要事項:
- 有効なJSONオブジェクトのみを返してください
- 日本語のテキストを含めてください
- 数値は具体的に算出してください
- 美容スコアは科学的根拠に基づいて算出してください
- ユーザーの美容目標に特化したアドバイスを生成してください
- 説明レベルは「${categoryInfo.levelStyle}」に合わせてください
- beauty_benefitsは「今回の食事を摂取することで期待できる具体的な美容効果」を記載してください
- 美容効果は短期的（数時間〜数日）で実感できるものと中長期的（数週間〜数ヶ月）なものの両方を含めてください
- 食材名は可能な限り具体的に特定してください（曖昧な「魚」「野菜」ではなく「サバ」「玉ねぎ」など）

【アドバイス生成の必須ルール】
- 同じ栄養素でも毎回異なる食材を提案してください（例：ビタミンC → レモン、パプリカ、ブロッコリー、キウイなどローテーション）
- 現在の食事内容を分析し、既に含まれる食材と相性の良い提案をしてください
- 「レモンを絞る」「緑茶を飲む」などの定番フレーズを避け、多様な表現を使ってください
- 季節感のある食材や、時間帯に適した提案を心がけてください
- 実用性を重視し、すぐに実践できる具体的なアドバイスを提供してください
- 栄養素の組み合わせによる相乗効果も考慮してください
`;
};

// 食べ物以外の物体に対するユーモラスなメッセージ
const NON_FOOD_MESSAGES = {
  person: [
    "え！！これは人間...ですよね？？まさか食べてないですよね...",
    "人間は美容食材ではありませんよ！😅",
    "お友達の写真ですか？美容効果は...測定不能です！"
  ],
  animal: [
    "猫ちゃんは判定できませんよ！🐱",
    "わんちゃんは可愛いですが、美容スコアは出せません！🐕",
    "動物さんの美容効果は...愛でることでしょうか？💕"
  ],
  electronics: [
    "パソコンは固くて食べるのには向いてませんね...",
    "スマホのカロリーは0kcalですが、栄養価も0です📱",
    "電子機器の美容効果は...ブルーライトカットでしょうか？"
  ],
  furniture: [
    "椅子は座るものであって、食べるものではありません！",
    "テーブルの木材は食物繊維豊富ですが...おすすめしません😅",
    "家具の美容効果は、お部屋が綺麗になることでしょうか？"
  ],
  vehicle: [
    "車は鉄分豊富ですが、消化に悪そうです🚗",
    "自転車のカロリー消費効果はありますが、食べ物ではありません！",
    "乗り物の美容効果は...移動による運動でしょうか？"
  ],
  nature: [
    "お花は美しいですが、食用花でない限り美容解析できません🌸",
    "木や石の美容効果は...自然に癒されることでしょうか？",
    "景色は心の栄養になりますが、カロリー計算はできません！"
  ],
  object: [
    "これは...食べ物ではないようですね？🤔",
    "美容解析には食事の写真が必要です！",
    "この物体の栄養価は...測定不能です！"
  ],
  unclear: [
    "う〜ん、これが何なのかよくわかりません🤷‍♀️",
    "もしかして、とても珍しい食材でしょうか？",
    "画像がぼやけているか、食べ物以外のようです"
  ]
};

// 食べ物判定用のプロンプト
export const createFoodDetectionPrompt = () => {
  return `
この画像を見て、食べ物（食事、料理、食材、飲み物、お菓子など）が含まれているかを判定してください。

以下のJSON形式で回答してください:

{
  "is_food": true/false,
  "detected_object": "person|animal|electronics|furniture|vehicle|nature|object|unclear",
  "confidence": 0.95,
  "description": "画像に写っているものの簡潔な説明（日本語）"
}

判定基準:
- is_food: true = 食べ物、料理、食材、飲み物、お菓子など食事に関連するもの
- is_food: false = 人、動物、電子機器、家具、乗り物、自然、その他の物体

detected_object の分類:
- person: 人間、顔、体の一部
- animal: 動物、ペット、昆虫など
- electronics: スマホ、パソコン、テレビ、電子機器
- furniture: 椅子、テーブル、ベッド、家具
- vehicle: 車、自転車、電車、乗り物
- nature: 花、木、石、風景、自然物
- object: その他の物体、道具、建物など
- unclear: 判別困難、ぼやけている、暗い

重要: 有効なJSONオブジェクトのみを返してください。
`;
};

// 食べ物以外の場合のユーモラスなレスポンス生成
export const generateNonFoodResponse = (detectedObject: string): any => {
  const category = detectedObject as keyof typeof NON_FOOD_MESSAGES;
  const messages = NON_FOOD_MESSAGES[category] || NON_FOOD_MESSAGES.object;
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  return {
    is_food: false,
    detected_object: detectedObject,
    humorous_message: randomMessage,
    suggestion: "美容効果を分析するには、食事や食材の写真を撮影してくださいね！📸✨",
    detected_foods: [],
    nutrition_analysis: {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      vitamins: {
        vitamin_c: 0,
        vitamin_e: 0,
        vitamin_a: 0,
        vitamin_b_complex: 0
      },
      minerals: {
        iron: 0,
        zinc: 0,
        calcium: 0,
        magnesium: 0
      }
    },
    beauty_score: {
      skin_care: 0,
      anti_aging: 0,
      detox: 0,
      circulation: 0,
      hair_nails: 0,
      overall: 0
    },
    immediate_advice: "まずは食事の写真を撮影してみましょう！",
    next_meal_advice: "次回は美味しそうな料理の写真をお待ちしています🍽️",
    beauty_benefits: [
      "食事の写真を撮ることで、食生活への意識が高まります",
      "美容に良い食材を意識的に選ぶきっかけになります",
      "栄養バランスを考える習慣が身につきます"
    ]
  };
};

// 画像をBase64に変換する関数
const convertImageToBase64 = async (imageUri: string): Promise<string> => {
  try {
    if (imageUri.startsWith('data:')) {
      // 既にBase64の場合はそのまま返す
      return imageUri;
    }
    
    // React Nativeのファイルシステムを使用してBase64変換
    const FileSystem = await import('expo-file-system');
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Base64変換エラー:', error);
    throw new Error('画像の変換に失敗しました');
  }
};

// 食べ物判定を行う関数
export const detectFoodInImage = async (imageUri: string): Promise<{
  isFood: boolean;
  detectedObject?: string;
  confidence?: number;
  description?: string;
}> => {
  try {
    console.log('OpenAI食べ物判定API呼び出し開始');
    
    // 画像をBase64に変換
    const base64Image = await convertImageToBase64(imageUri);
    console.log('Base64変換完了');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "あなたは画像判定の専門家です。必ず有効なJSON形式でのみ回答してください。Markdownやその他の形式は使用せず、純粋なJSONオブジェクトのみを返してください。"
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: createFoodDetectionPrompt()
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
              },
            },
          ],
        },
      ],
      max_tokens: 200,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI API response is empty');
    }

    console.log('OpenAI食べ物判定API生レスポンス:', content);
    
    // Markdownのコードブロックを除去
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('クリーニング後のレスポンス:', cleanedContent);
    const result = JSON.parse(cleanedContent);
    console.log('パース後の判定結果:', result);
    
    return {
      isFood: result.is_food,
      detectedObject: result.detected_object,
      confidence: result.confidence,
      description: result.description
    };
    
  } catch (error) {
    console.error('Food detection error:', error);
    // エラーの場合は食べ物以外として処理（安全側に倒す）
    return {
      isFood: false,
      detectedObject: 'unclear',
      confidence: 0.5,
      description: '判定できませんでした'
    };
  }
};

export default openai; 