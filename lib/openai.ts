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

// 料理ジャンル別の典型的な食材・調味料データベース
const CUISINE_INGREDIENTS = {
  japanese: {
    name: '和食',
    typical_ingredients: ['醤油', '味噌', '出汁', 'みりん', '酒', '米', '海苔', 'わかめ', '豆腐'],
    spices: ['七味唐辛子', '山椒', '柚子胡椒', '生姜', 'わさび']
  },
  italian: {
    name: 'イタリア料理',
    typical_ingredients: ['トマト', 'オリーブオイル', 'チーズ', 'パスタ', 'バジル'],
    spices: ['オレガノ', 'ローズマリー', 'タイム', 'ガーリック', 'ブラックペッパー']
  },
  indian: {
    name: 'インド料理',
    typical_ingredients: ['ココナッツミルク', 'ヨーグルト', '玉ねぎ', 'トマト', '生姜', 'にんにく'],
    spices: ['ターメリック', 'クミン', 'コリアンダー', 'ガラムマサラ', 'カルダモン', 'シナモン']
  },
  thai: {
    name: 'タイ料理',
    typical_ingredients: ['ココナッツミルク', 'ライム', 'もやし', 'パクチー', 'ナンプラー'],
    spices: ['唐辛子', 'レモングラス', 'ガランガル', 'こぶみかんの葉']
  },
  chinese: {
    name: '中華料理',
    typical_ingredients: ['醤油', 'ごま油', '紹興酒', 'オイスターソース', '生姜', 'にんにく'],
    spices: ['八角', '花椒', '五香粉', '豆板醤', '甜麺醤']
  }
};

// 今すぐ実践可能！家庭常備食材優先のアドバイスシステム
const IMMEDIATE_ADVICE_INGREDIENTS = {
  vitamin_c: [
    { item: 'レモン汁を数滴絞って', availability: 0.95, time: '10秒', action: '手軽にビタミンC追加＆風味もアップ！' },
    { item: 'トマトを1個スライスして添えて', availability: 0.90, time: '30秒', action: '生野菜でフレッシュビタミンC補給！' },
    { item: 'みかんを1個むいて', availability: 0.85, time: '30秒', action: 'デザート感覚で手軽にビタミンC！' },
    { item: '青のりをパラパラと', availability: 0.80, time: '5秒', action: 'ビタミンCとミネラルを同時に！' },
    { item: 'キャベツの千切りを一掴み添えて', availability: 0.75, time: '1分', action: 'シャキシャキ食感とビタミンCをプラス！' },
    { item: 'ピーマンを細切りでトッピング', availability: 0.70, time: '30秒', action: '彩りとビタミンCを同時にゲット！' }
  ],
  protein: [
    { item: 'ゆで卵を1個追加', availability: 0.95, time: '5分', action: '完全栄養食材で即タンパク質補給！' },
    { item: 'とろけるチーズを一切れ乗せて', availability: 0.90, time: '10秒', action: 'コクと高タンパク質を同時にプラス！' },
    { item: '納豆1パックをトッピング', availability: 0.85, time: '10秒', action: '発酵パワー＋植物性タンパク質の最強コンビ！' },
    { item: 'ツナ缶を開けて混ぜるだけ', availability: 0.80, time: '30秒', action: '手軽な動物性タンパク質でパワーアップ！' },
    { item: 'きな粉を大さじ1振りかけて', availability: 0.75, time: '5秒', action: '大豆パワーで植物性タンパク質を追加！' },
    { item: '冷奴を一丁追加', availability: 0.70, time: '10秒', action: '大豆イソフラボンとタンパク質のダブル効果！' }
  ],
  iron: [
    { item: 'ごま（黒）をパラパラと', availability: 0.95, time: '5秒', action: '香ばしさと鉄分を同時にプラス！' },
    { item: 'のりを手でちぎって乗せて', availability: 0.90, time: '10秒', action: '海のミネラルと鉄分を手軽にゲット！' },
    { item: 'ほうれん草を一掴み茹でて添えて', availability: 0.75, time: '2分', action: '緑の鉄分パワーでエネルギーチャージ！' },
    { item: 'ひじき（乾燥）を水で戻して', availability: 0.70, time: '1分', action: '海藻の鉄分とミネラルでデトックス！' },
    { item: 'かつお節をふりかけて', availability: 0.85, time: '5秒', action: '旨味と鉄分の和の最強コンビ！' },
    { item: '小松菜を軽く茹でて', availability: 0.65, time: '1分', action: 'カルシウムと鉄分のダブル補給！' }
  ],
  fiber: [
    { item: 'わかめ（乾燥）をパラパラと', availability: 0.90, time: '10秒', action: '海藻の食物繊維で腸内環境改善！' },
    { item: 'りんごを薄切りして添えて', availability: 0.85, time: '1分', action: 'ペクチンで整腸作用＋自然な甘み！' },
    { item: 'バナナを輪切りでトッピング', availability: 0.80, time: '30秒', action: '水溶性食物繊維とカリウムで美容効果アップ！' },
    { item: 'オクラを輪切りして', availability: 0.70, time: '30秒', action: 'ネバネバ食物繊維で腸活パワー！' },
    { item: 'もやしをサッと茹でて', availability: 0.75, time: '1分', action: 'シャキシャキ食物繊維とビタミンCを追加！' },
    { item: 'コーンを缶から出して', availability: 0.85, time: '10秒', action: '甘みと食物繊維で満足度アップ！' }
  ],
  healthy_fat: [
    { item: 'オリーブオイルを小さじ1かけて', availability: 0.90, time: '5秒', action: '良質な脂質で栄養吸収率アップ！' },
    { item: 'ナッツ類を一掴み追加', availability: 0.80, time: '5秒', action: 'ビタミンEと良質脂質でアンチエイジング！' },
    { item: 'ごま油を数滴たらして', availability: 0.85, time: '5秒', action: '香りと良質脂質で満足度アップ！' },
    { item: 'アボカド半分をスライスして', availability: 0.60, time: '1分', action: '美容に最強の良質脂質とビタミンE！' }
  ],
  calcium: [
    { item: 'しらすを一掴み乗せて', availability: 0.75, time: '10秒', action: '小さな体に大きなカルシウムパワー！' },
    { item: 'ヨーグルトを大さじ2添えて', availability: 0.90, time: '10秒', action: 'カルシウムと乳酸菌のダブル効果！' },
    { item: 'チーズを細切りでトッピング', availability: 0.85, time: '20秒', action: 'カルシウムとタンパク質を同時補給！' },
    { item: '小魚せんべいを砕いて', availability: 0.70, time: '10秒', action: 'カリカリ食感とカルシウムをプラス！' },
    { item: '牛乳をグラス1杯追加', availability: 0.95, time: '5秒', action: '液体カルシウムで手軽に骨活！' },
    { item: '海苔を手でちぎってパラパラ', availability: 0.85, time: '10秒', action: '海のカルシウムとミネラルを追加！' }
  ],
  // 新カテゴリー：手軽な調味料系（バラエティ増強）
  quick_seasoning: [
    { item: '醤油を数滴たらして', availability: 0.98, time: '3秒', action: '旨味と塩分のバランスを整えて！' },
    { item: 'マヨネーズを小さじ1添えて', availability: 0.92, time: '5秒', action: 'まろやかさと良質脂質をプラス！' },
    { item: 'ポン酢をかけて', availability: 0.85, time: '5秒', action: 'さっぱり風味とビタミンCを同時に！' },
    { item: 'ケチャップを少量添えて', availability: 0.90, time: '5秒', action: 'トマトのリコピンで抗酸化力アップ！' },
    { item: 'バターを一欠け乗せて', availability: 0.88, time: '5秒', action: '風味とビタミンAで満足度アップ！' },
    { item: 'はちみつを小さじ1かけて', availability: 0.80, time: '5秒', action: '自然な甘みとエネルギーチャージ！' }
  ],
  // 新カテゴリー：手軽な香辛料系（さらなるバラエティ）
  quick_spices: [
    { item: 'こしょうをパラパラと', availability: 0.95, time: '3秒', action: 'ピリッとした刺激で代謝アップ！' },
    { item: '七味唐辛子をひとふり', availability: 0.80, time: '5秒', action: 'カプサイシンで体ポカポカ＆血行促進！' },
    { item: 'ガーリックパウダーを少々', availability: 0.75, time: '5秒', action: 'にんにくパワーで疲労回復！' },
    { item: '青じそ（乾燥）をパラパラ', availability: 0.70, time: '5秒', action: '爽やかな香りとβカロテンを追加！' },
    { item: 'パセリ（乾燥）をふりかけて', availability: 0.75, time: '5秒', action: '鮮やかな緑とビタミンKで血液サラサラ！' }
  ]
};

// 次の食事アドバイス専用データベース（バラエティ重視・計画的食材）
const NEXT_MEAL_ADVICE_INGREDIENTS = {
  vitamin_c: [
    { item: 'ブロッコリー', action: '茹でても炒めても美肌効果抜群', category: 'vegetable', beauty: 'ビタミンCとスルフォラファンで美白効果' },
    { item: 'パプリカ（赤・黄）', action: 'サラダや炒め物に彩りプラス', category: 'vegetable', beauty: 'カロテノイドとビタミンCのダブル美容効果' },
    { item: 'キウイフルーツ', action: 'デザートや朝食で手軽にビタミンC', category: 'fruit', beauty: '食物繊維とビタミンCで腸活＆美肌' },
    { item: 'いちご', action: '旬の時期に美味しく美容チャージ', category: 'fruit', beauty: 'アントシアニンとビタミンCで抗酸化作用' },
    { item: '小松菜', action: 'お浸しや炒め物で手軽に栄養補給', category: 'vegetable', beauty: 'カルシウムとビタミンCで骨と肌の健康' },
    { item: 'ゴーヤ', action: '苦味が効いた夏の美容食材', category: 'vegetable', beauty: 'モモルデシンとビタミンCで代謝アップ' }
  ],
  protein: [
    { item: '鶏むね肉', action: '低脂肪・高タンパクの美容食材', category: 'protein', beauty: 'イミダゾールペプチドで疲労回復と美肌' },
    { item: '鮭', action: 'アスタキサンチンで美肌効果抜群', category: 'protein', beauty: 'オメガ3脂肪酸とアスタキサンチンで美容効果' },
    { item: '豆腐', action: '大豆イソフラボンで女性ホルモンサポート', category: 'protein', beauty: '植物性タンパク質と大豆イソフラボンで美肌' },
    { item: 'サバ', action: '青魚のDHA・EPAで美容と健康', category: 'protein', beauty: 'オメガ3脂肪酸で血行促進と美肌効果' },
    { item: '卵', action: '完全栄養食品で美容をサポート', category: 'protein', beauty: 'ビオチンとコリンで髪と肌の健康' },
    { item: 'ギリシャヨーグルト', action: '高タンパク＆乳酸菌で美腸効果', category: 'protein', beauty: 'プロバイオティクスで腸内環境改善' }
  ],
  iron: [
    { item: 'ほうれん草', action: '緑の鉄分で血色美人を目指して', category: 'vegetable', beauty: '非ヘム鉄とビタミンCで吸収率アップ' },
    { item: 'レバー', action: '鉄分含有量ナンバー1の美容食材', category: 'protein', beauty: 'ヘム鉄とビタミンAで美肌効果' },
    { item: 'あさり', action: '海の恵みで鉄分とミネラル補給', category: 'protein', beauty: 'ヘム鉄とタウリンで血行促進' },
    { item: 'ひじき', action: '海藻の鉄分で和風美容ケア', category: 'vegetable', beauty: 'ミネラル豊富で代謝促進効果' },
    { item: '大豆', action: '植物性鉄分と大豆パワーで美容サポート', category: 'protein', beauty: '大豆イソフラボンと鉄分のダブル効果' },
    { item: 'カツオ', action: '血合いの鉄分で元気と美容を両立', category: 'protein', beauty: 'ヘム鉄とビタミンB12で血液サラサラ' }
  ],
  fiber: [
    { item: 'さつまいも', action: '自然な甘みと食物繊維で美腸活', category: 'carb', beauty: 'β-カロテンと食物繊維で美肌＆デトックス' },
    { item: 'アボカド', action: '良質脂質と食物繊維の美容食材', category: 'fat', beauty: 'オレイン酸とビタミンEで美肌効果' },
    { item: 'りんご', action: 'ペクチンで腸内環境を整えて', category: 'fruit', beauty: '水溶性食物繊維で腸内フローラ改善' },
    { item: 'オクラ', action: 'ネバネバ食物繊維で美腸効果', category: 'vegetable', beauty: 'ムチンと食物繊維で消化促進' },
    { item: 'きのこ類', action: '低カロリー・高食物繊維の美容食材', category: 'vegetable', beauty: 'β-グルカンで免疫力アップ' },
    { item: 'ごぼう', action: '根菜の食物繊維で腸活美容', category: 'vegetable', beauty: 'イヌリンで腸内環境改善' }
  ],
  healthy_fat: [
    { item: 'くるみ', action: 'オメガ3脂肪酸で脳と美容をサポート', category: 'fat', beauty: 'α-リノレン酸で抗炎症作用' },
    { item: 'アーモンド', action: 'ビタミンEたっぷりの美容ナッツ', category: 'fat', beauty: 'ビタミンEで抗酸化作用と美肌効果' },
    { item: 'オリーブ', action: '地中海式美容法の代表食材', category: 'fat', beauty: 'オレイン酸とポリフェノールで美肌' },
    { item: 'ココナッツオイル', action: '中鎖脂肪酸で代謝アップ', category: 'fat', beauty: 'ラウリン酸で抗菌・美肌効果' },
    { item: 'チアシード', action: 'スーパーフードで美容と健康', category: 'fat', beauty: 'オメガ3とタンパク質で美容効果' },
    { item: 'えごま油', action: '和のオメガ3オイルで美容ケア', category: 'fat', beauty: 'α-リノレン酸で美肌と血行促進' }
  ],
  calcium: [
    { item: 'チーズ', action: '発酵パワーとカルシウムで美容効果', category: 'protein', beauty: '乳酸菌とカルシウムで骨と美肌' },
    { item: '小魚', action: '丸ごと食べてカルシウム補給', category: 'protein', beauty: 'カルシウムとタンパク質で骨密度アップ' },
    { item: '胡麻', action: 'セサミンとカルシウムのダブル効果', category: 'fat', beauty: 'ゴマリグナンで抗酸化作用' },
    { item: '牛乳', action: '液体カルシウムで手軽に骨活', category: 'protein', beauty: 'カゼインプロテインで美肌サポート' },
    { item: 'モロヘイヤ', action: '王様の野菜でカルシウム補給', category: 'vegetable', beauty: 'ネバネバ成分と豊富なミネラル' },
    { item: '桜えび', action: '小さな体に大きなカルシウムパワー', category: 'protein', beauty: 'アスタキサンチンとカルシウム' }
  ]
};

// 次の食事アドバイス生成（バラエティ重視・重複防止）
const getNextMealAdvice = (
  nutritionType: keyof typeof NEXT_MEAL_ADVICE_INGREDIENTS,
  previousNextMealAdvice: string[] = [],
  beautyCategory: string = 'skin_care'
): string => {
  const allIngredients = NEXT_MEAL_ADVICE_INGREDIENTS[nutritionType] || [];
  
  // Step 1: 完全重複排除（過去5回分をチェック）
  const recentAdvice = previousNextMealAdvice.slice(-5);
  const unused = allIngredients.filter(ingredient => 
    !recentAdvice.some(prev => {
      const prevItemName = prev.split('には')[1]?.split('を')[0]?.toLowerCase() || '';
      const currentItemName = ingredient.item.toLowerCase();
      return prevItemName.includes(currentItemName) || currentItemName.includes(prevItemName);
    })
  );
  
  // Step 2: 美容カテゴリーに適した食材を優先
  let priorityIngredients = unused;
  if (beautyCategory === 'skin_care' && nutritionType === 'vitamin_c') {
    priorityIngredients = unused.filter(item => item.beauty.includes('美肌') || item.beauty.includes('美白'));
  } else if (beautyCategory === 'anti_aging') {
    priorityIngredients = unused.filter(item => item.beauty.includes('抗酸化') || item.beauty.includes('アンチ'));
  } else if (beautyCategory === 'detox') {
    priorityIngredients = unused.filter(item => item.beauty.includes('腸') || item.beauty.includes('デトックス'));
  }
  
  // Step 3: 優先食材がない場合は全体から選択
  const finalCandidates = priorityIngredients.length > 0 ? priorityIngredients : 
    (unused.length > 0 ? unused : allIngredients);
  
  if (finalCandidates.length === 0) {
    return '次の食事には栄養バランスを意識した食材を取り入れてみて！';
  }
  
  // Step 4: ランダム選択（真の多様性確保）
  const randomChoice = finalCandidates[Math.floor(Math.random() * finalCandidates.length)];
  
  // Step 5: 多様な表現パターン
  const actionPatterns = [
    `${randomChoice.item}を使ってみて！${randomChoice.beauty}`,
    `${randomChoice.item}を取り入れて！${randomChoice.action}`,
    `${randomChoice.item}を試してみて！${randomChoice.beauty}で美容効果アップ`,
    `${randomChoice.item}でプラス栄養！${randomChoice.action}`,
    `${randomChoice.item}をメニューに加えて！${randomChoice.beauty}`
  ];
  
  const randomPattern = actionPatterns[Math.floor(Math.random() * actionPatterns.length)];
  
  return `次の食事には${randomPattern}`;
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

// 料理ジャンル検出
const detectCuisineType = (detectedFoods: string[]): string => {
  const foods = detectedFoods.join(' ').toLowerCase();
  
  if (foods.includes('curry') || foods.includes('カレー') || foods.includes('ターメリック') || foods.includes('クミン')) {
    return 'indian';
  }
  if (foods.includes('pasta') || foods.includes('パスタ') || foods.includes('tomato') || foods.includes('トマト')) {
    return 'italian';
  }
  if (foods.includes('pad thai') || foods.includes('パッタイ') || foods.includes('coconut') || foods.includes('ココナッツ')) {
    return 'thai';
  }
  if (foods.includes('rice') || foods.includes('米') || foods.includes('miso') || foods.includes('味噌')) {
    return 'japanese';
  }
  if (foods.includes('noodle') || foods.includes('麺') || foods.includes('soy sauce') || foods.includes('醤油')) {
    return 'chinese';
  }
  
  return 'general';
};

// バラエティ重視＆簡単さ重視のアドバイス生成（同優先度）
const getImmediateAdvice = (
  nutritionType: keyof typeof IMMEDIATE_ADVICE_INGREDIENTS,
  cuisineType: string = 'general',
  previousAdvice: string[] = [],
  allowCrossCategory: boolean = true // クロスカテゴリー提案を許可
): string => {
  let allIngredients = IMMEDIATE_ADVICE_INGREDIENTS[nutritionType] || [];
  
  // バラエティ増強：不足栄養素に加えて、汎用的な調味料・香辛料も候補に
  if (allowCrossCategory && allIngredients.length < 8) {
    // 調味料系を追加（どんな料理にも合う）
    const seasoningOptions = IMMEDIATE_ADVICE_INGREDIENTS['quick_seasoning'] || [];
    // 香辛料系を追加（風味と栄養を同時に）
    const spiceOptions = IMMEDIATE_ADVICE_INGREDIENTS['quick_spices'] || [];
    
    allIngredients = [...allIngredients, ...seasoningOptions, ...spiceOptions];
  }
  
  // Step 1: 重複完全排除（最優先）
  const unused = allIngredients.filter(ingredient => 
    !previousAdvice.some(prev => {
      const prevFoodName = prev.split('！')[0].toLowerCase();
      const currentFoodName = ingredient.item.split('を')[0].toLowerCase();
      return prevFoodName.includes(currentFoodName) || currentFoodName.includes(prevFoodName);
    })
  );
  
  // Step 2: 重複がない場合は全候補、ある場合は未使用のみ
  let candidates = unused.length > 0 ? unused : allIngredients;
  
  // Step 3: 料理ジャンル適合性フィルター
  let cuisineFilteredCandidates = candidates;
  
  if (cuisineType === 'japanese') {
    cuisineFilteredCandidates = candidates.filter(item => 
      item.item.includes('ごま') || item.item.includes('のり') || 
      item.item.includes('わかめ') || item.item.includes('納豆') ||
      item.item.includes('かつお節') || item.item.includes('しらす') ||
      item.item.includes('ひじき') || item.item.includes('青のり') ||
      item.item.includes('きな粉')
    );
  } else if (cuisineType === 'italian') {
    cuisineFilteredCandidates = candidates.filter(item => 
      item.item.includes('チーズ') || item.item.includes('オリーブオイル') ||
      item.item.includes('トマト') || item.item.includes('ナッツ')
    );
  } else if (cuisineType === 'chinese') {
    cuisineFilteredCandidates = candidates.filter(item => 
      item.item.includes('ごま油') || item.item.includes('もやし') ||
      item.item.includes('ナッツ') || item.item.includes('青のり') ||
      item.item.includes('ごま')
    );
  } else if (cuisineType === 'thai') {
    cuisineFilteredCandidates = candidates.filter(item => 
      item.item.includes('ナッツ') || item.item.includes('レモン') ||
      item.item.includes('もやし')
    );
  }
  
  // Step 4: 簡単さ最優先フィルター（1分以内）
  const easyCandidates = (cuisineFilteredCandidates.length > 0 ? cuisineFilteredCandidates : candidates)
    .filter(item => {
      const timeValue = parseFloat(item.time);
      const timeUnit = item.time.includes('秒') ? 'second' : 'minute';
      return (timeUnit === 'second') || (timeUnit === 'minute' && timeValue <= 1);
    });
  
  // Step 5: 最終候補決定（簡単さ優先、なければ全体から）
  const finalCandidates = easyCandidates.length > 0 ? easyCandidates : 
    (cuisineFilteredCandidates.length > 0 ? cuisineFilteredCandidates : candidates);
  
  // Step 6: バラエティ確保のためランダム選択（家庭常備率も考慮）
  if (finalCandidates.length === 0) {
    return '手軽に栄養をプラスしてみましょう！';
  }
  
  // 家庭常備率90%以上を優先しつつ、ランダム選択でバラエティ確保
  const highAvailability = finalCandidates.filter(item => item.availability >= 0.9);
  const choicePool = highAvailability.length > 0 ? highAvailability : finalCandidates;
  
  // バラエティのため完全ランダム選択
  const randomChoice = choicePool[Math.floor(Math.random() * choicePool.length)];
  
  return `${randomChoice.item}！${randomChoice.action}（${randomChoice.time}で完了）`;
};

// 食事解析用のプロンプトテンプレート（改善版）
export const createFoodAnalysisPrompt = (userProfile: {
  beautyCategories: string[];
  beautyLevel: string;
}, previousAdvice: string[] = []) => {
  const categoryInfo = generateCategorySpecificAdvice(userProfile.beautyCategories, userProfile.beautyLevel);
  
  return `
この食事画像を詳細に分析して、以下のJSON形式で回答してください。

【重要】解析精度向上のための段階的アプローチ：
1. **料理ジャンル特定**: まず全体の料理スタイル（和食/洋食/中華/エスニック等）を判定
2. **メイン食材検出**: 視覚的に明確に確認できる主要食材から特定
3. **典型的食材推測**: 料理ジャンルから推測される一般的な食材・調味料を含める
4. **栄養価算出**: 日本食品標準成分表2020年版を基準に、調理による変化も考慮
5. **信頼度評価**: 各検出項目の確実性を適切に評価

ユーザープロフィール:
- 美容目標: ${categoryInfo.categoryNames}
- 美容レベル: ${BEAUTY_LEVEL_STYLES[userProfile.beautyLevel as keyof typeof BEAUTY_LEVEL_STYLES]?.name || '中級者'}
- 重点フォーカス: ${categoryInfo.focusAreas}

【アドバイス生成の重要原則】
1. **既存食材回避**: 現在の食事に含まれている食材は絶対に推奨しない（最重要）
2. **簡単さ＆バラエティの両立**: 30秒〜1分で実践可能＋毎回異なる食材提案
3. **重複完全回避**: ${previousAdvice.length > 0 ? `前回提案「${previousAdvice.slice(-3).join('、')}」とは完全に異なる食材・方法を提案` : '多様性を最重視した食材提案'}
4. **家庭常備食材基本**: 冷蔵庫・調味料棚にある確率85%以上の食材を基本とする
5. **料理適合性**: 現在の料理スタイルに味覚・見た目・文化的に調和する提案のみ
6. **具体的アクション**: 「パラパラと」「ひとふり」「数滴」「一掴み」など分量も含む明確な指示

【次の食事アドバイス特別指示】
- 必ず「次の食事には○○を使ってみて/取り入れて/試してみて」の形式
- アボカド以外の多様な食材を提案（特に前回と違う食材カテゴリー）
- 計画的に購入・準備できる食材を優先
- 美容目標（${categoryInfo.categoryNames}）に最適な栄養素を含む食材選択

【食材検出の詳細ガイドライン】
- **具体性**: 「魚」→「サバ」「鮭」「マグロ」など種類まで特定
- **分量精度**: 一般的な1人前を基準とした現実的な推定
- **調理法考慮**: 生/茹で/焼き/炒めなどによる栄養価変化を反映
- **隠れ食材**: 料理に通常含まれる調味料・香辛料も含める
- **信頼度**: 不確実な推測は控えめに評価（0.6-0.8）

【栄養解析の科学的基準】
- 日本食品標準成分表2020年版準拠
- 調理による栄養素損失/増加を考慮
- ビタミンCは加熱で20-50%減少
- リコピンは加熱で吸収率2-3倍向上
- タンパク質は加熱で変性・消化率向上

以下のJSON形式で回答してください:

{
  "cuisine_type": "検出された料理ジャンル（japanese/italian/chinese/thai/indian/general）",
  "detected_foods": [
    {
      "name": "具体的な食材名（種類まで特定）",
      "category": "protein|carb|vegetable|fruit|fat|spice|sauce|other",
      "estimated_amount": "推定量（例：100g、1個、大さじ1）",
      "confidence": 0.75,
      "detection_method": "visual|typical|inferred"
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
  "deficient_nutrients": ["不足している主要栄養素のリスト"],
  "immediate_advice": "今すぐ追加できる食材・調理法の提案（料理適合性重視、重複回避）",
  "next_meal_advice": "次の食事での改善提案（美容目標特化、計画的改善）",
  "beauty_benefits": [
    "今回の食事で期待できる美容効果1（短期的効果）",
    "今回の食事で期待できる美容効果2（中期的効果）",
    "今回の食事で期待できる美容効果3（長期的効果）"
  ],
  "analysis_confidence": "解析全体の信頼度（低/中/高）",
  "improvement_priority": "最優先で改善すべき栄養素（美容目標ベース）"
}

【アドバイス具体例】
◆ 今すぐアドバイス（家庭常備食材×即座実践）:
✅ 和食: "ごまをパラパラと！香ばしさと鉄分を同時にプラス（5秒で完了）"
✅ サラダ: "オリーブオイルを小さじ1かけて！良質な脂質で栄養吸収率アップ（5秒で完了）"  
✅ スープ: "わかめ（乾燥）をパラパラと！海藻の食物繊維で腸内環境改善（10秒で完了）"

◆ 次の食事アドバイス（計画的改善提案）:
✅ 美肌重視: "次の食事にはアボカドを使ってみて！良質脂質とビタミンEで美肌効果アップ"
✅ デトックス: "次の食事にはブロッコリーを取り入れて！食物繊維とビタミンCで体内浄化"
✅ 血行促進: "次の食事には生姜を使ってみて！体を温めて血流改善効果を実感"

❌ 避けるべき例: 
- 今すぐ: 「パプリカを買ってきて」等の入手が必要なもの
- 今すぐ: 「オートミールを振りかけて」等の現在の食事に含まれている食材の推奨
- 次の食事: 「アボカドを追加して」等の現在の食事と混同する表現
- 今すぐ: 検出された食材名と同じ・類似する食材の推奨

重要事項:
- 有効なJSONオブジェクトのみを返してください
- 数値は科学的根拠に基づいて算出してください
- アドバイスは実用性と料理適合性を最重視してください
- 美容効果は根拠のある内容のみ記載してください
- 解析の不確実性がある場合は適切に confidence で表現してください
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

// アドバイス品質チェック機能（強化版）
export const validateAdviceQuality = (advice: string, detectedFoods: any[], previousAdvice: string[] = []): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  containsExistingFood: boolean;
} => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let containsExistingFood = false;
  
  // 既存食材の厳密チェック（より詳細な検出）
  const existingFoodNames = detectedFoods.map(f => {
    // 食材名を正規化（「の」「と」「、」などで区切られた複合食材名も考慮）
    const name = f.name.toLowerCase()
      .replace(/[の・と、]/g, ' ')
      .split(' ')
      .filter(part => part.length > 1); // 1文字以下は除外
    return name;
  }).flat();
  
  const adviceLower = advice.toLowerCase()
    .replace(/[！!？?。、]/g, ' '); // 句読点を空白に変換
  
  // 既存食材が含まれているかチェック
  for (const foodName of existingFoodNames) {
    if (foodName.length > 1 && adviceLower.includes(foodName)) {
      issues.push(`既存食材「${foodName}」を推奨している`);
      suggestions.push(`「${foodName}」以外の新しい食材を提案してください`);
      containsExistingFood = true;
    }
  }
  
  // 主要食材キーワードの重複チェック（オートミール、フルーツなど）
  const mainIngredients = ['オートミール', 'フルーツ', 'サラダ', 'チキン', '鮭', 'サバ', 'ご飯', 'パン', 'パスタ', 'うどん', 'そば'];
  for (const ingredient of mainIngredients) {
    const lowerIngredient = ingredient.toLowerCase();
    if (detectedFoods.some(food => food.name.toLowerCase().includes(lowerIngredient)) && 
        adviceLower.includes(lowerIngredient)) {
      issues.push(`メイン食材「${ingredient}」の重複推奨`);
      suggestions.push(`「${ingredient}」以外の補助食材を提案してください`);
      containsExistingFood = true;
    }
  }
  
  // 「振りかけて」「追加して」などの動詞が既存食材と組み合わされているかチェック
  const addActionWords = ['振りかけ', '追加', 'のせ', 'かけ', '混ぜ', 'トッピング'];
  for (const action of addActionWords) {
    if (adviceLower.includes(action)) {
      // この動詞の前後にある食材名をチェック
      const beforeAction = adviceLower.split(action)[0];
      const afterAction = adviceLower.split(action)[1] || '';
      
      for (const foodName of existingFoodNames) {
        if (foodName.length > 1 && (beforeAction.includes(foodName) || afterAction.includes(foodName))) {
          issues.push(`既存食材「${foodName}」を${action}として推奨`);
          suggestions.push(`別の食材で${action}アドバイスを作成してください`);
          containsExistingFood = true;
        }
      }
    }
  }
  
  // 具体的な食材名が含まれているかチェック
  const foodMentions = advice.match(/[ア-ヲ]{2,}|[a-zA-Z]{3,}/g);
  if (!foodMentions || foodMentions.length === 0) {
    issues.push('具体的な食材名がない');
    suggestions.push('具体的な食材名を含めてください');
  }
  
  // 重複チェック
  const duplicates = previousAdvice.filter(prev => {
    const prevFood = prev.split('！')[0].toLowerCase();
    const currentFood = advice.split('！')[0].toLowerCase();
    return prevFood.includes(currentFood) || currentFood.includes(prevFood);
  });
  
  if (duplicates.length > 0) {
    issues.push('過去のアドバイスと重複している');
    suggestions.push('異なる食材や方法を提案してください');
  }
  
  // 実用性チェック
  const impracticalWords = ['高級', '特別な', '珍しい', '入手困難', '特殊', '専門'];
  if (impracticalWords.some(word => advice.includes(word))) {
    issues.push('実用性に欠ける提案');
    suggestions.push('一般的で入手しやすい食材を提案してください');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
    containsExistingFood
  };
};

// 栄養価算出の信頼性評価
export const evaluateNutritionConfidence = (detectedFoods: any[]): {
  overallConfidence: 'low' | 'medium' | 'high';
  reasoning: string[];
} => {
  const reasoning: string[] = [];
  let confidenceScore = 0;
  
  // 検出された食材の信頼度評価
  const avgFoodConfidence = detectedFoods.reduce((sum, food) => sum + (food.confidence || 0), 0) / detectedFoods.length;
  confidenceScore += avgFoodConfidence * 40; // 40点満点
  
  if (avgFoodConfidence > 0.8) {
    reasoning.push('食材検出の精度が高い');
  } else if (avgFoodConfidence < 0.6) {
    reasoning.push('食材検出の精度に不安がある');
  }
  
  // 視覚的に確認できる食材の割合
  const visuallyConfirmed = detectedFoods.filter(f => f.detection_method === 'visual').length;
  const visualRatio = visuallyConfirmed / detectedFoods.length;
  confidenceScore += visualRatio * 30; // 30点満点
  
  if (visualRatio > 0.7) {
    reasoning.push('大部分の食材が視覚的に確認できる');
  } else if (visualRatio < 0.3) {
    reasoning.push('推測に依存する食材が多い');
  }
  
  // 食材の多様性（栄養計算の正確性に影響）
  const uniqueCategories = new Set(detectedFoods.map(f => f.category)).size;
  confidenceScore += Math.min(uniqueCategories * 5, 30); // 30点満点
  
  if (uniqueCategories >= 4) {
    reasoning.push('栄養バランスの分析に十分な食材カテゴリーを検出');
  } else {
    reasoning.push('限定的な食材カテゴリーのため栄養分析に制約');
  }
  
  // 総合判定
  let overallConfidence: 'low' | 'medium' | 'high';
  if (confidenceScore >= 80) {
    overallConfidence = 'high';
  } else if (confidenceScore >= 60) {
    overallConfidence = 'medium';
  } else {
    overallConfidence = 'low';
  }
  
  return { overallConfidence, reasoning };
};

// 美容スコア算出の詳細ロジック
export const calculateBeautyScore = (nutritionData: any, beautyCategories: string[]): {
  scores: { [key: string]: number };
  explanations: { [key: string]: string };
} => {
  const scores: { [key: string]: number } = {};
  const explanations: { [key: string]: string } = {};
  
  // 美肌スコア算出
  let skinScore = 0;
  const skinFactors: string[] = [];
  
  if (nutritionData.vitamins.vitamin_c > 50) {
    skinScore += 25;
    skinFactors.push('ビタミンC豊富');
  }
  if (nutritionData.vitamins.vitamin_e > 5) {
    skinScore += 20;
    skinFactors.push('ビタミンE含有');
  }
  if (nutritionData.vitamins.vitamin_a > 200) {
    skinScore += 15;
    skinFactors.push('ビタミンA充実');
  }
  if (nutritionData.protein > 15) {
    skinScore += 20;
    skinFactors.push('コラーゲン材料確保');
  }
  if (nutritionData.minerals.zinc > 3) {
    skinScore += 20;
    skinFactors.push('亜鉛で肌修復促進');
  }
  
  scores.skin_care = Math.min(skinScore, 100);
  explanations.skin_care = skinFactors.join('、') || '美肌成分が不足気味';
  
  // アンチエイジングスコア算出
  let antiAgingScore = 0;
  const antiAgingFactors: string[] = [];
  
  if (nutritionData.vitamins.vitamin_c > 80) {
    antiAgingScore += 30;
    antiAgingFactors.push('強力な抗酸化作用');
  }
  if (nutritionData.vitamins.vitamin_e > 8) {
    antiAgingScore += 25;
    antiAgingFactors.push('細胞膜保護');
  }
  if (nutritionData.fiber > 10) {
    antiAgingScore += 20;
    antiAgingFactors.push('腸内環境改善');
  }
  if (nutritionData.minerals.magnesium > 100) {
    antiAgingScore += 15;
    antiAgingFactors.push('酵素活性化');
  }
  if (nutritionData.protein > 20) {
    antiAgingScore += 10;
    antiAgingFactors.push('筋肉量維持');
  }
  
  scores.anti_aging = Math.min(antiAgingScore, 100);
  explanations.anti_aging = antiAgingFactors.join('、') || 'アンチエイジング成分を補強必要';
  
  // デトックススコア算出
  let detoxScore = 0;
  const detoxFactors: string[] = [];
  
  if (nutritionData.fiber > 8) {
    detoxScore += 35;
    detoxFactors.push('食物繊維で腸内浄化');
  }
  if (nutritionData.minerals.magnesium > 80) {
    detoxScore += 25;
    detoxFactors.push('マグネシウムで代謝促進');
  }
  if (nutritionData.vitamins.vitamin_c > 60) {
    detoxScore += 20;
    detoxFactors.push('ビタミンCで解毒酵素活性化');
  }
  if (nutritionData.minerals.calcium > 200) {
    detoxScore += 20;
    detoxFactors.push('カルシウムで有害物質排出');
  }
  
  scores.detox = Math.min(detoxScore, 100);
  explanations.detox = detoxFactors.join('、') || 'デトックス成分の補強が必要';
  
  // 血行促進スコア算出
  let circulationScore = 0;
  const circulationFactors: string[] = [];
  
  if (nutritionData.minerals.iron > 5) {
    circulationScore += 30;
    circulationFactors.push('鉄分で酸素運搬改善');
  }
  if (nutritionData.vitamins.vitamin_e > 6) {
    circulationScore += 25;
    circulationFactors.push('ビタミンEで血流改善');
  }
  if (nutritionData.vitamins.vitamin_b_complex > 6) {
    circulationScore += 20;
    circulationFactors.push('ビタミンB群で代謝活性化');
  }
  if (nutritionData.protein > 18) {
    circulationScore += 15;
    circulationFactors.push('タンパク質で血管強化');
  }
  if (nutritionData.minerals.magnesium > 90) {
    circulationScore += 10;
    circulationFactors.push('マグネシウムで血管拡張');
  }
  
  scores.circulation = Math.min(circulationScore, 100);
  explanations.circulation = circulationFactors.join('、') || '血行促進成分の補強が必要';
  
  // 髪・爪健康スコア算出
  let hairNailsScore = 0;
  const hairNailsFactors: string[] = [];
  
  if (nutritionData.protein > 20) {
    hairNailsScore += 35;
    hairNailsFactors.push('タンパク質でケラチン生成');
  }
  if (nutritionData.minerals.zinc > 4) {
    hairNailsScore += 25;
    hairNailsFactors.push('亜鉛で毛髪成長促進');
  }
  if (nutritionData.minerals.iron > 6) {
    hairNailsScore += 20;
    hairNailsFactors.push('鉄分で毛根に栄養供給');
  }
  if (nutritionData.vitamins.vitamin_b_complex > 7) {
    hairNailsScore += 20;
    hairNailsFactors.push('ビタミンB群で毛髪代謝促進');
  }
  
  scores.hair_nails = Math.min(hairNailsScore, 100);
  explanations.hair_nails = hairNailsFactors.join('、') || '髪・爪に必要な栄養素の補強が必要';
  
  // 総合スコア（選択されたカテゴリーの平均）
  const selectedScores = beautyCategories.map(cat => {
    switch (cat) {
      case 'skin_care': return scores.skin_care;
      case 'anti_aging': return scores.anti_aging;
      case 'detox': return scores.detox;
      case 'circulation': return scores.circulation;
      case 'hair_nails': return scores.hair_nails;
      default: return 0;
    }
  });
  
  scores.overall = Math.round(selectedScores.reduce((sum, score) => sum + score, 0) / selectedScores.length);
  
  return { scores, explanations };
};

// 季節別アドバイス生成
export const generateSeasonalAdvice = (currentSeason: 'spring' | 'summer' | 'autumn' | 'winter', deficientNutrients: string[]): string[] => {
  const seasonalAdvice: { [key: string]: { [key: string]: string[] } } = {
    spring: {
      vitamin_c: ['次の食事には春キャベツを使ってみて！新陳代謝を高めて美肌効果を実感', '次の食事にはたけのこを取り入れて！食物繊維とビタミンCで春の体内リセット'],
      iron: ['次の食事には春の山菜（ふきのとう）を試してみて！鉄分とミネラルでデトックス効果', '次の食事にはあさりを使ってみて！春の鉄分補給で旬の美味しさも楽しめます'],
      fiber: ['次の食事には新玉ねぎを取り入れて！食物繊維とケルセチンで春のアレルギー対策']
    },
    summer: {
      vitamin_c: ['次の食事には夏野菜のトマトを使ってみて！紫外線対策にリコピンパワー', '次の食事にはパプリカを取り入れて！夏の美肌ケアにビタミンC補給'],
      fiber: ['次の食事にはきゅうりを使ってみて！水分補給と食物繊維で夏の美容ケア', '次の食事にはとうもろこしを試してみて！食物繊維と抗酸化成分で疲労回復'],
      iron: ['次の食事にはうなぎを取り入れて！夏バテ防止に鉄分とビタミンB群でスタミナアップ']
    },
    autumn: {
      vitamin_c: ['次の食事には柿を使ってみて！秋の乾燥肌対策に最適な和の美容食材', '次の食事にはさつまいもを取り入れて！ビタミンCと食物繊維で秋の美肌作り'],
      protein: ['次の食事には秋鮭を使ってみて！アスタキサンチンとタンパク質で肌荒れ対策', '次の食事にはきのこ類を取り入れて！タンパク質と食物繊維で秋の免疫力アップ'],
      fiber: ['次の食事にはかぼちゃを使ってみて！βカロテンと食物繊維で秋の乾燥対策']
    },
    winter: {
      vitamin_c: ['次の食事にはみかんを取り入れて！冬の乾燥と風邪予防にビタミンC補給', '次の食事には白菜を使ってみて！鍋料理で温活しながら美容ケア'],
      iron: ['次の食事には冬の根菜（大根・人参）を試してみて！体を温めて血行促進効果', '次の食事にはほうれん草を使ってみて！鉄分とビタミンCで冬の貧血対策'],
      protein: ['次の食事には冬の魚（ぶり・たら）を取り入れて！良質なタンパク質で寒さに負けない美肌作り']
    }
  };
  
  const currentAdvice: string[] = [];
  
  for (const nutrient of deficientNutrients) {
    const seasonalOptions = seasonalAdvice[currentSeason]?.[nutrient];
    if (seasonalOptions && seasonalOptions.length > 0) {
      const randomAdvice = seasonalOptions[Math.floor(Math.random() * seasonalOptions.length)];
      currentAdvice.push(randomAdvice);
    }
  }
  
  return currentAdvice;
};

// アドバイス履歴管理
interface AdviceHistory {
  immediate: string[];
  nextMeal: string[];
}

// AsyncStorageからアドバイス履歴を取得
const getAdviceHistory = async (): Promise<AdviceHistory> => {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    const stored = await AsyncStorage.default.getItem('adviceHistory');
    if (stored) {
      return JSON.parse(stored);
    }
    return { immediate: [], nextMeal: [] };
  } catch (error) {
    console.warn('アドバイス履歴取得エラー:', error);
    return { immediate: [], nextMeal: [] };
  }
};

// アドバイス履歴を保存
const saveAdviceHistory = async (newImmediate: string, newNextMeal: string): Promise<void> => {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    const current = await getAdviceHistory();
    
    // 最新20件のみ保持
    const updated: AdviceHistory = {
      immediate: [newImmediate, ...current.immediate].slice(0, 20),
      nextMeal: [newNextMeal, ...current.nextMeal].slice(0, 20)
    };
    
    await AsyncStorage.default.setItem('adviceHistory', JSON.stringify(updated));
  } catch (error) {
    console.warn('アドバイス履歴保存エラー:', error);
  }
};

// メイン食事解析関数（改善版）
export const analyzeFoodImage = async (
  imageUri: string, 
  userProfile: { beautyCategories: string[]; beautyLevel: string },
  previousAdvice: string[] = []
): Promise<any> => {
  try {
    console.log('食事解析API呼び出し開始');
    
    // まず食べ物判定
    const foodDetection = await detectFoodInImage(imageUri);
    if (!foodDetection.isFood) {
      return generateNonFoodResponse(foodDetection.detectedObject || 'unclear');
    }
    
    // 画像をBase64に変換
    const base64Image = await convertImageToBase64(imageUri);
    console.log('Base64変換完了');
    
    // 食事解析実行
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "あなたは栄養学と美容学の専門家です。食事画像を正確に分析し、科学的根拠に基づいたアドバイスを提供します。必ず有効なJSON形式でのみ回答してください。"
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: createFoodAnalysisPrompt(userProfile, previousAdvice)
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
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI API response is empty');
    }

    console.log('OpenAI解析API生レスポンス:', content);
    
    // Markdownのコードブロックを除去
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('クリーニング後のレスポンス:', cleanedContent);
    const result = JSON.parse(cleanedContent);
    
    // 品質チェック実行
    const immediateAdviceQuality = validateAdviceQuality(
      result.immediate_advice, 
      result.detected_foods, 
      previousAdvice
    );
    
    const nextAdviceQuality = validateAdviceQuality(
      result.next_meal_advice, 
      result.detected_foods, 
      previousAdvice
    );
    
    console.log('アドバイス品質チェック結果:', {
      immediate: { isValid: immediateAdviceQuality.isValid, containsExisting: immediateAdviceQuality.containsExistingFood },
      nextMeal: { isValid: nextAdviceQuality.isValid, containsExisting: nextAdviceQuality.containsExistingFood }
    });
    
    // 信頼性評価
    const confidenceEvaluation = evaluateNutritionConfidence(result.detected_foods);
    
    // アドバイス履歴を取得して改善
    const adviceHistory = await getAdviceHistory();
    
    // 次の食事アドバイスの改善（AIのアドバイスが不適切な場合に独自システムで置き換え）
    let improvedNextMealAdvice = result.next_meal_advice;
    
    // アボカド重複チェック＆改善
    if (improvedNextMealAdvice.includes('アボカド') && 
        adviceHistory.nextMeal.some(prev => prev.includes('アボカド'))) {
      console.log('アボカド重複を検出、独自システムで改善中...');
      
      // 不足している栄養素を特定
      const deficientNutrients = result.deficient_nutrients || ['vitamin_c'];
      const primaryNutrient = deficientNutrients[0] as keyof typeof NEXT_MEAL_ADVICE_INGREDIENTS;
      const primaryBeautyCategory = userProfile.beautyCategories[0] || 'skin_care';
      
      // 独自のアドバイス生成システムを使用
      improvedNextMealAdvice = getNextMealAdvice(
        primaryNutrient, 
        adviceHistory.nextMeal, 
        primaryBeautyCategory
      );
    }
    
    // 今すぐアドバイスの改善（既存食材チェック＋重複チェック）
    let improvedImmediateAdvice = result.immediate_advice;
    
    // 既存食材を推奨している場合は必ず改善
    if (immediateAdviceQuality.containsExistingFood) {
      console.log('今すぐアドバイスに既存食材検出、改善中...');
      const deficientNutrients = result.deficient_nutrients || ['vitamin_c'];
      const primaryNutrient = deficientNutrients[0] as keyof typeof IMMEDIATE_ADVICE_INGREDIENTS;
      const cuisineType = result.cuisine_type || 'general';
      
      improvedImmediateAdvice = getImmediateAdvice(
        primaryNutrient,
        cuisineType,
        [...adviceHistory.immediate, result.immediate_advice], // 元のアドバイスも除外対象に
        true
      );
    }
    // 重複チェック
    else if (adviceHistory.immediate.length > 3) {
      const recentImmediate = adviceHistory.immediate.slice(0, 3);
      const hasRecentSimilarity = recentImmediate.some(prev => {
        const prevFood = prev.split('！')[0];
        const currentFood = improvedImmediateAdvice.split('！')[0];
        return prevFood.includes(currentFood.split('を')[0]) || 
               currentFood.includes(prevFood.split('を')[0]);
      });
      
      if (hasRecentSimilarity) {
        console.log('今すぐアドバイス重複を検出、改善中...');
        const deficientNutrients = result.deficient_nutrients || ['vitamin_c'];
        const primaryNutrient = deficientNutrients[0] as keyof typeof IMMEDIATE_ADVICE_INGREDIENTS;
        const cuisineType = result.cuisine_type || 'general';
        
        improvedImmediateAdvice = getImmediateAdvice(
          primaryNutrient,
          cuisineType,
          adviceHistory.immediate,
          true
        );
      }
    }
    
    // 改善されたアドバイスを履歴に保存
    await saveAdviceHistory(improvedImmediateAdvice, improvedNextMealAdvice);
    
    // 結果に品質情報を追加
    const enhancedResult = {
      ...result,
      immediate_advice: improvedImmediateAdvice,
      next_meal_advice: improvedNextMealAdvice,
      quality_check: {
        immediate_advice: immediateAdviceQuality,
        next_meal_advice: nextAdviceQuality
      },
      confidence_evaluation: confidenceEvaluation,
      advice_improvements: {
        immediate_improved: improvedImmediateAdvice !== result.immediate_advice,
        next_meal_improved: improvedNextMealAdvice !== result.next_meal_advice
      },
      is_food: true
    };
    
    console.log('解析完了（アドバイス改善済み）:', {
      immediate_improved: enhancedResult.advice_improvements.immediate_improved,
      next_meal_improved: enhancedResult.advice_improvements.next_meal_improved
    });
    return enhancedResult;
    
  } catch (error) {
    console.error('Food analysis error:', error);
    throw new Error(`食事解析に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
};

export default openai;