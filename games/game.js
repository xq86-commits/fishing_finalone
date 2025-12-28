const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game Configuration
const GAME_DURATION = 90; // seconds
const FISH_COUNT = 6;
const FISH_WIDTH = 40;  // 80% of previous size
const FISH_HEIGHT = 40;
const TOTAL_FISH_TYPES = 14;

// Assets
const ASSETS = {
  bg: { src: '../fish_assets/bg.png', img: null },
  people: { src: '../fish_assets/people.png', img: null },
  settings: { src: '../fish_assets/settings.png', img: null },
  note: { src: '../fish_assets/note.png', img: null },
  hint: { src: '../fish_assets/hint.png', img: null },
  fish: []
};

for (let i = 1; i <= TOTAL_FISH_TYPES; i++) {
  ASSETS.fish.push({ src: `../fish_assets/fish${i}.png`, img: null });
}

const LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced"];
const DEFAULT_LEVEL = "Beginner";
const LEVEL_FILES = {
  N1: "../n1_vocab.json",
  N2: "../n2_vocab.json",
  N3: "../n3_vocab.json",
  N4: "../n4_vocab.json",
  N5: "../n5_vocab.json"
};

// 将通用级别映射到对应的JLPT级别数组（用于加载词汇文件）
function genericLevelToJLPTLevels(genericLevel) {
  const mapping = {
    "Beginner": ["N5", "N4"],      // 初级合并N5和N4
    "Intermediate": ["N3", "N2"],  // 中级合并N3和N2
    "Advanced": ["N1"]             // 高级使用N1
  };
  return mapping[genericLevel] || ["N5"];
}

// Vocabulary Data (N5 seed with multilingual translations)
const N5_SEED_VOCAB = [
  { "furigana": "ああ", "english": "Ah!, Oh!", "french": "Ah!, Oh!", "chinese": "啊！, 噢！", "korean": "아!, 오!", "spanish": "¡Ah!, ¡Oh!" },
  { "furigana": "あう", "english": "to meet, to see", "french": "rencontrer", "chinese": "遇见", "korean": "만나다", "spanish": "conocer/encontrar" },
  { "furigana": "あお", "english": "blue", "french": "bleu", "chinese": "蓝色", "korean": "파란색", "spanish": "azul" },
  { "furigana": "あかい", "english": "red", "french": "rouge", "chinese": "红色", "korean": "빨간색", "spanish": "rojo" },
  { "furigana": "あき", "english": "fall (season)", "french": "automne", "chinese": "秋天", "korean": "가을", "spanish": "otoño" },
  { "furigana": "あく", "english": "to open", "french": "ouvrir", "chinese": "打开", "korean": "열다", "spanish": "abrir" },
  { "furigana": "あさ", "english": "morning", "french": "matin", "chinese": "早上", "korean": "아침", "spanish": "mañana" },
  { "furigana": "あし", "english": "foot; leg", "french": "pied/jambe", "chinese": "脚/腿", "korean": "발/다리", "spanish": "pie/pierna" },
  { "furigana": "あした", "english": "tomorrow", "french": "demain", "chinese": "明天", "korean": "내일", "spanish": "mañana" },
  { "furigana": "あそこ", "english": "over there", "french": "là-bas", "chinese": "那里", "korean": "저기", "spanish": "allí" },
  { "furigana": "あそぶ", "english": "to play", "french": "jouer", "chinese": "玩", "korean": "놀다", "spanish": "jugar" },
  { "furigana": "あたま", "english": "head", "french": "tête", "chinese": "头", "korean": "머리", "spanish": "cabeza" },
  { "furigana": "あつい", "english": "hot", "french": "chaud", "chinese": "热", "korean": "덥다/뜨겁다", "spanish": "caliente" },
  { "furigana": "あと", "english": "afterwards", "french": "après", "chinese": "以后", "korean": "나중에", "spanish": "después" },
  { "furigana": "あなた", "english": "you", "french": "tu/vous", "chinese": "你", "korean": "당신", "spanish": "tú/usted" },
  { "furigana": "あに", "english": "older brother", "french": "grand frère", "chinese": "哥哥", "korean": "형/오빠", "spanish": "hermano mayor" },
  { "furigana": "あね", "english": "older sister", "french": "grande sœur", "chinese": "姐姐", "korean": "누나/언니", "spanish": "hermana mayor" },
  { "furigana": "あの", "english": "that over there", "french": "cela là-bas", "chinese": "那个（远）", "korean": "저것", "spanish": "aquello" },
  { "furigana": "あめ", "english": "rain", "french": "pluie", "chinese": "雨", "korean": "비", "spanish": "lluvia" },
  { "furigana": "あらう", "english": "to wash", "french": "laver", "chinese": "洗", "korean": "씻다", "spanish": "lavar" },
  { "furigana": "ある", "english": "to be, to have", "french": "avoir/être", "chinese": "有/在", "korean": "있다", "spanish": "haber/estar" },
  { "furigana": "あるく", "english": "to walk", "french": "marcher", "chinese": "走路", "korean": "걷다", "spanish": "caminar" },
  { "furigana": "あれ", "english": "that one", "french": "celui-là", "chinese": "那个", "korean": "그것", "spanish": "eso" },
  { "furigana": "いい", "english": "good", "french": "bon", "chinese": "好", "korean": "좋다", "spanish": "bueno" },
  { "furigana": "いいえ", "english": "no", "french": "non", "chinese": "不", "korean": "아니요", "spanish": "no" },
  { "furigana": "いう", "english": "to say", "french": "dire", "chinese": "说", "korean": "말하다", "spanish": "decir" },
  { "furigana": "いえ", "english": "house", "french": "maison", "chinese": "房子", "korean": "집", "spanish": "casa" },
  { "furigana": "いく", "english": "to go", "french": "aller", "chinese": "去", "korean": "가다", "spanish": "ir" },
  { "furigana": "いくつ", "english": "how many", "french": "combien", "chinese": "多少", "korean": "몇 개", "spanish": "cuántos" },
  { "furigana": "いくら", "english": "how much", "french": "combien (prix)", "chinese": "多少钱", "korean": "얼마", "spanish": "cuánto" },
  { "furigana": "いけ", "english": "pond", "french": "étang", "chinese": "池塘", "korean": "연못", "spanish": "estanque" },
  { "furigana": "いしゃ", "english": "doctor", "french": "médecin", "chinese": "医生", "korean": "의사", "spanish": "médico" },
  { "furigana": "いす", "english": "chair", "french": "chaise", "chinese": "椅子", "korean": "의자", "spanish": "silla" },
  { "furigana": "いち", "english": "one", "french": "un", "chinese": "一", "korean": "일/하나", "spanish": "uno" },
  { "furigana": "いつ", "english": "when", "french": "quand", "chinese": "什么时候", "korean": "언제", "spanish": "cuándo" },
  { "furigana": "いぬ", "english": "dog", "french": "chien", "chinese": "狗", "korean": "개", "spanish": "perro" },
  { "furigana": "いま", "english": "now", "french": "maintenant", "chinese": "现在", "korean": "지금", "spanish": "ahora" },
  { "furigana": "いみ", "english": "meaning", "french": "signification", "chinese": "意思", "korean": "의미", "spanish": "significado" },
  { "furigana": "いろ", "english": "color", "french": "couleur", "chinese": "颜色", "korean": "색깔", "spanish": "color" },
  { "furigana": "うえ", "english": "above", "french": "au-dessus", "chinese": "上面", "korean": "위", "spanish": "arriba" },
  { "furigana": "うしろ", "english": "behind", "french": "derrière", "chinese": "后面", "korean": "뒤", "spanish": "detrás" },
  { "furigana": "うた", "english": "song", "french": "chanson", "chinese": "歌", "korean": "노래", "spanish": "canción" },
  { "furigana": "うみ", "english": "sea", "french": "mer", "chinese": "海", "korean": "바다", "spanish": "mar" },
  { "furigana": "うる", "english": "to sell", "french": "vendre", "chinese": "卖", "korean": "팔다", "spanish": "vender" },
  { "furigana": "え", "english": "picture", "french": "image/photo", "chinese": "图片/照片", "korean": "그림/사진", "spanish": "imagen/foto" },
  { "furigana": "えいが", "english": "movie", "french": "film", "chinese": "电影", "korean": "영화", "spanish": "película" },
  { "furigana": "えき", "english": "station", "french": "gare", "chinese": "车站", "korean": "역", "spanish": "estación" },
  { "furigana": "えん", "english": "Yen", "french": "Yen", "chinese": "日元", "korean": "엔", "spanish": "Yen" },
  { "furigana": "おき", "english": "open sea", "french": "haute mer", "chinese": "公海", "korean": "먼 바다", "spanish": "alta mar" },
  { "furigana": "おく", "english": "to put", "french": "mettre", "chinese": "放", "korean": "두다", "spanish": "poner" },
  { "furigana": "おさけ", "english": "alcohol", "french": "alcool", "chinese": "酒", "korean": "술", "spanish": "alcohol" },
  { "furigana": "お皿", "english": "plate", "french": "assiette", "chinese": "盘子", "korean": "접시", "spanish": "plato" },
  { "furigana": "おと", "english": "sound", "french": "son", "chinese": "声音", "korean": "소리", "spanish": "sonido" },
  { "furigana": "おなか", "english": "stomach", "french": "estomac", "chinese": "肚子", "korean": "배", "spanish": "estómago" },
  { "furigana": "おなじ", "english": "same", "french": "même", "chinese": "一样", "korean": "같다", "spanish": "mismo" },
  { "furigana": "おび", "english": "belt", "french": "ceinture", "chinese": "腰带", "korean": "띠", "spanish": "cinturón" },
  { "furigana": "おもい", "english": "heavy", "french": "lourd", "chinese": "重", "korean": "무겁다", "spanish": "pesado" },
  { "furigana": "およぐ", "english": "to swim", "french": "nager", "chinese": "游泳", "korean": "수영하다", "spanish": "nadar" },
  { "furigana": "おわる", "english": "to end", "french": "finir", "chinese": "结束", "korean": "끝나다", "spanish": "terminar" }
];

const N4_SEED_VOCAB = [
  { "furigana": "ふむ", "english": "to step on, to tread on", "french": "marcher sur, fouler", "chinese": "踩，踏", "korean": "밟다", "spanish": "pisar" },
  { "furigana": "～く", "english": "~ district, ~ ward, ~ borough", "french": "~ arrondissement, ~ quartier", "chinese": "~区", "korean": "~구(행정구)", "spanish": "~ distrito, ~ barrio" },
  { "furigana": "すっと", "english": "straight, quickly", "french": "tout droit, rapidement", "chinese": "很快地，笔直地", "korean": "곧장, 재빨리", "spanish": "rápidamente, derecho" },
  { "furigana": "ぬすむ", "english": "to steal; to rob", "french": "voler, dérober", "chinese": "偷，抢", "korean": "훔치다", "spanish": "robar" },
  { "furigana": "たいてい", "english": "generally, usually", "french": "généralement, d'habitude", "chinese": "大多数，通常", "korean": "대부분, 대개", "spanish": "generalmente" },
  { "furigana": "とうとう", "english": "finally, at last", "french": "enfin, finalement", "chinese": "终于，最终", "korean": "마침내, 결국", "spanish": "finalmente, por fin" },
  { "furigana": "ガソリン", "english": "gasoline, petrol", "french": "essence", "chinese": "汽油", "korean": "가솔린, 휘발유", "spanish": "gasolina" },
  { "furigana": "なる", "english": "to sound, to ring (v.i.)", "french": "sonner, retentir", "chinese": "响，鸣", "korean": "울리다", "spanish": "sonar" },
  { "furigana": "しっかり", "english": "firmly, steady", "french": "fermement, solidement", "chinese": "牢固，结实", "korean": "단단히, 확실히", "spanish": "firmemente" },
  { "furigana": "いきる", "english": "to live", "french": "vivre", "chinese": "活着，生存", "korean": "살다", "spanish": "vivir" },
  { "furigana": "にがい", "english": "bitter", "french": "amer, amère", "chinese": "苦", "korean": "쓰다", "spanish": "amargo" },
  { "furigana": "わく", "english": "to boil, to grow hot", "french": "bouillir, chauffer", "chinese": "沸腾，变热", "korean": "끓다, 뜨거워지다", "spanish": "hervir, calentarse" },
  { "furigana": "いけん", "english": "opinion, view, idea", "french": "opinion, avis, idée", "chinese": "意见，观点", "korean": "의견, 생각", "spanish": "opinión, idea" },
  { "furigana": "やはり; やっぱり", "english": "as I thought, absolutely", "french": "comme je le pensais, en effet", "chinese": "果然，还是", "korean": "역시, 과연", "spanish": "como pensaba, efectivamente" },
  { "furigana": "まんが", "english": "comic (book), cartoon", "french": "bande dessinée, manga, dessin animé", "chinese": "漫画", "korean": "만화", "spanish": "cómic, manga, caricatura" },
  { "furigana": "ステレオ", "english": "stereo", "french": "stéréo", "chinese": "立体声", "korean": "스테레오", "spanish": "estéreo" },
  { "furigana": "いがく", "english": "medical science", "french": "médecine (science)", "chinese": "医学", "korean": "의학", "spanish": "medicina" },
  { "furigana": "テキスト", "english": "text; text book", "french": "texte; manuel", "chinese": "课本，教材", "korean": "교재, 텍스트", "spanish": "texto, libro de texto" },
  { "furigana": "～つき", "english": "month", "french": "~ mois", "chinese": "~月", "korean": "~월", "spanish": "~ mes" },
  { "furigana": "おる", "english": "to snap, to break; to bend", "french": "casser, briser, plier", "chinese": "折断，弯曲", "korean": "꺾다, 부러뜨리다, 굽히다", "spanish": "romper, doblar" },
  { "furigana": "～かい", "english": "~ meeting", "french": "~ réunion, rassemblement", "chinese": "~会，集会", "korean": "~회(모임)", "spanish": "~ reunión, ~ encuentro" },
  { "furigana": "うかがう", "english": "to ask", "french": "demander, s'informer (poli)", "chinese": "请教，询问（敬语）", "korean": "묻다 (존경어)", "spanish": "preguntar (formal)" },
  { "furigana": "きこえる", "english": "to be heard, to be audible", "french": "être entendu, s'entendre", "chinese": "听得见", "korean": "들리다", "spanish": "oírse" },
  { "furigana": "ぼく", "english": "I (used by men towards those of equal or lower status)", "french": "je, moi (masculin familier)", "chinese": "我（男性用语）", "korean": "나 (남성이 자신을 칭할 때)", "spanish": "yo (masculino, informal)" },
  { "furigana": "かならず", "english": "surely, certainly", "french": "sûrement, certainement", "chinese": "一定，必定", "korean": "반드시", "spanish": "seguramente, sin falta" },
  { "furigana": "こわす", "english": "to break, to break down", "french": "casser, détruire", "chinese": "弄坏，打碎", "korean": "망가뜨리다, 부수다", "spanish": "romper, estropear" },
  { "furigana": "おこる", "english": "to get angry; to scold angrily", "french": "se fâcher; gronder", "chinese": "生气，斥责", "korean": "화내다; 꾸짖다", "spanish": "enfadarse; regañar" },
  { "furigana": "とこや", "english": "barber's (shop)", "french": "salon de coiffure (hommes), barbier", "chinese": "理发店（男士）", "korean": "이발소", "spanish": "barbería" },
  { "furigana": "オートバイ", "english": "motorcycle (lit: auto-bi(ke))", "french": "moto", "chinese": "摩托车", "korean": "오토바이", "spanish": "motocicleta" },
  { "furigana": "うんどうする", "english": "exercise", "french": "faire de l'exercice", "chinese": "锻炼，运动", "korean": "운동하다", "spanish": "hacer ejercicio" },
  { "furigana": "やむ", "english": "to cease, to stop", "french": "cesser, s'arrêter", "chinese": "停止，停止下来", "korean": "멎다, 그치다", "spanish": "cesar, parar" },
  { "furigana": "もし", "english": "if", "french": "si, au cas où", "chinese": "如果", "korean": "만약", "spanish": "si (condicional)" },
  { "furigana": "おもて", "english": "surface; front; outside", "french": "surface; devant; extérieur", "chinese": "表面，外面，正面", "korean": "표면; 앞; 밖", "spanish": "superficie; frente; exterior" },
  { "furigana": "だいがくせい", "english": "college student, university student", "french": "étudiant universitaire", "chinese": "大学生", "korean": "대학생", "spanish": "estudiante universitario" },
  { "furigana": "うんてんしゅ", "english": "driver (by occupation)", "french": "chauffeur (de profession)", "chinese": "司机（职业）", "korean": "운전사", "spanish": "conductor (profesional)" },
  { "furigana": "よしゅう", "english": "preparation of lessons (for class)", "french": "préparation des leçons", "chinese": "预习课程", "korean": "예습", "spanish": "preparación de clase" },
  { "furigana": "しんぱいする", "english": "worry, concern", "french": "s'inquiéter, se soucier", "chinese": "担心，忧虑", "korean": "걱정하다", "spanish": "preocuparse" },
  { "furigana": "べつ", "english": "distinction, different", "french": "distinction, différence", "chinese": "区别，不同", "korean": "별, 다름", "spanish": "distinción, diferencia" },
  { "furigana": "ひじょうに", "english": "extremely; very", "french": "extrêmement, très", "chinese": "非常，极其", "korean": "매우, 대단히", "spanish": "extremadamente, muy" },
  { "furigana": "おたく", "english": "(someone else's) house; home -- polite word for 家 (いえ) --", "french": "chez quelqu'un (poli)", "chinese": "府上，您家（敬语）", "korean": "댁 (남의 집 높임)", "spanish": "su casa (cortesía)" },
  { "furigana": "やわらかい", "english": "soft (in reference to texture), tender", "french": "doux, tendre, mou", "chinese": "软，柔软", "korean": "부드럽다", "spanish": "suave, blando" },
  { "furigana": "ひろう", "english": "to pick up (something), to find", "french": "ramasser, trouver", "chinese": "捡起，拾到", "korean": "줍다, 집다", "spanish": "recoger, encontrar" },
  { "furigana": "～ございます", "english": "to be (polite), to exist", "french": "il y a (poli), exister", "chinese": "有（敬语）", "korean": "있습니다 (존경)", "spanish": "haber (cortés), existir" },
  { "furigana": "き", "english": "spirit, mood", "french": "esprit, humeur", "chinese": "精神，心情", "korean": "기운, 기분", "spanish": "espíritu, ánimo" },
  { "furigana": "くらべる", "english": "to compare", "french": "comparer", "chinese": "比较", "korean": "비교하다", "spanish": "comparar" },
  { "furigana": "ほとんど", "english": "mostly, almost", "french": "presque, la plupart", "chinese": "大部分，几乎", "korean": "거의, 대부분", "spanish": "casi, la mayoría" },
  { "furigana": "つもり", "english": "intention, plan", "french": "intention, plan", "chinese": "打算，计划", "korean": "의도, 계획", "spanish": "intención, plan" },
  { "furigana": "こうがい", "english": "suburb, outskirts", "french": "banlieue, périphérie", "chinese": "郊区，市郊", "korean": "교외, 변두리", "spanish": "suburbio, las afueras" },
  { "furigana": "だめ", "english": "useless, no good, hopeless", "french": "inutile, mauvais, sans espoir", "chinese": "没用，不行，无望", "korean": "안됨, 소용없음", "spanish": "inútil, no sirve" },
  { "furigana": "うりば", "english": "place where things are sold", "french": "point de vente, rayon", "chinese": "卖场，柜台", "korean": "판매소, 매장", "spanish": "lugar de venta, mostrador" },
  { "furigana": "しょうがつ", "english": "New Year, New Year's Day", "french": "Nouvel An", "chinese": "新年，元旦", "korean": "설날, 새해", "spanish": "Año Nuevo" },
  { "furigana": "きそく", "english": "rule, regulation", "french": "règle, règlement", "chinese": "规则，规定", "korean": "규칙, 규정", "spanish": "regla, norma" },
  { "furigana": "うん", "english": "yes (informal), all right (ok)", "french": "oui (familier), d'accord", "chinese": "嗯，是的", "korean": "응(비격식), 그래", "spanish": "sí (informal), vale" },
  { "furigana": "はつおん", "english": "pronunciation", "french": "prononciation", "chinese": "发音", "korean": "발음", "spanish": "pronunciación" },
  { "furigana": "やく", "english": "to bake, to grill", "french": "cuire, griller", "chinese": "烤，烘", "korean": "굽다", "spanish": "hornear, asar" },
  { "furigana": "おくじょう", "english": "rooftop", "french": "toit-terrasse", "chinese": "屋顶，楼顶", "korean": "옥상", "spanish": "azotea, tejado" },
  { "furigana": "しつれい", "english": "discourtesy, impoliteness; Excuse me", "french": "impolitesse, excusez-moi", "chinese": "失礼，冒犯，对不起", "korean": "실례, 무례; 실례합니다", "spanish": "descortesía; disculpe" },
  { "furigana": "ごみ", "english": "trash, garbage", "french": "ordures, déchets", "chinese": "垃圾", "korean": "쓰레기", "spanish": "basura" },
  { "furigana": "アフリカ", "english": "Africa", "french": "Afrique", "chinese": "非洲", "korean": "아프리카", "spanish": "África" },
  { "furigana": "てん", "english": "mark, score, grade; point, dot", "french": "point, note, marque", "chinese": "分数，点，标记", "korean": "점수, 점, 표", "spanish": "puntuación, punto" }
];

const N3_SEED_VOCAB = [
  { "furigana": "さほう", "english": "manners, etiquette, propriety", "french": "étiquette, bonnes manières, bienséance", "chinese": "礼节，礼仪", "korean": "예의, 예절", "spanish": "modales, etiqueta, decoro" },
  { "furigana": "さまざま", "english": "varied, various", "french": "divers, varié", "chinese": "各种各样，形形色色", "korean": "여러 가지, 다양한", "spanish": "variado, varios" },
  { "furigana": "さます", "english": "to cool, to let cool", "french": "refroidir, laisser refroidir", "chinese": "弄凉，使冷却", "korean": "식히다, 차게 하다", "spanish": "enfriar, dejar enfriar" },
  { "furigana": "さます", "english": "to awaken", "french": "éveiller, réveiller", "chinese": "唤醒，使醒来", "korean": "깨우다", "spanish": "despertar" },
  { "furigana": "さめる", "english": "to become cool, to wear off", "french": "refroidir, s’atténuer", "chinese": "变冷，冷却，消退", "korean": "식다, (열정 등이) 식다", "spanish": "enfriarse, apagarse (sentimiento)" },
  { "furigana": "さめる", "english": "to wake, to wake up", "french": "se réveiller, s’éveiller", "chinese": "醒来，觉醒", "korean": "깨다, 잠에서 깨다", "spanish": "despertar(se)" },
  { "furigana": "さゆう", "english": "left and right; influence", "french": "gauche et droite; influence", "chinese": "左右，影响", "korean": "좌우; 영향", "spanish": "izquierda y derecha; influencia" },
  { "furigana": "さら", "english": "plate, dish", "french": "assiette, plat", "chinese": "盘子", "korean": "접시", "spanish": "plato, vajilla" },
  { "furigana": "さらに", "english": "furthermore, moreover", "french": "de plus, en outre", "chinese": "而且，更加", "korean": "더욱이, 게다가", "spanish": "además, aún más" },
  { "furigana": "さる", "english": "to leave, to go away", "french": "partir, s’en aller, quitter", "chinese": "离开，走开", "korean": "떠나다, 물러가다", "spanish": "irse, marcharse" },
  { "furigana": "さる", "english": "monkey", "french": "singe", "chinese": "猴子", "korean": "원숭이", "spanish": "mono" },
  { "furigana": "さわぎ", "english": "uproar, disturbance", "french": "agitation, tumulte", "chinese": "骚动，喧闹", "korean": "소동, 소란", "spanish": "alboroto, disturbio" },
  { "furigana": "さんか", "english": "participation", "french": "participation", "chinese": "参加", "korean": "참가, 참여", "spanish": "participación" },
  { "furigana": "さんこう", "english": "reference, consultation", "french": "référence, consultation", "chinese": "参考，咨询", "korean": "참고, 참조", "spanish": "referencia, consulta" },
  { "furigana": "さんせい", "english": "approval, agreement", "french": "approbation, accord", "chinese": "赞成，同意", "korean": "찬성, 동의", "spanish": "aprobación, acuerdo" },
  { "furigana": "さんせい", "english": "acidity", "french": "acidité", "chinese": "酸性", "korean": "산성", "spanish": "acidez" },
  { "furigana": "さんそ", "english": "oxygen", "french": "oxygène", "chinese": "氧气", "korean": "산소", "spanish": "oxígeno" },
  { "furigana": "し", "english": "family name, lineage", "french": "nom de famille, lignée", "chinese": "姓氏，家族", "korean": "성씨, 혈통", "spanish": "apellido, linaje" },
  { "furigana": "し", "english": "poem; poetry", "french": "poème, poésie", "chinese": "诗，诗歌", "korean": "시, 시문학", "spanish": "poesía, poema" },
  { "furigana": "しあわせ", "english": "happiness, blessing", "french": "bonheur, chance, bénédiction", "chinese": "幸福，幸运", "korean": "행복, 행운", "spanish": "felicidad, bendición" },
  { "furigana": "ジーンズ", "english": "jeans", "french": "jean(s)", "chinese": "牛仔裤", "korean": "청바지", "spanish": "vaqueros, jeans" },
  { "furigana": "ジェットき", "english": "jet plane", "french": "avion à réaction", "chinese": "喷气式飞机", "korean": "제트기", "spanish": "avión a reacción, jet" },
  { "furigana": "しかく", "english": "square", "french": "carré", "chinese": "正方形", "korean": "정사각형", "spanish": "cuadrado" },
  { "furigana": "じかに", "english": "immediately, readily, directly", "french": "tout de suite, directement, immédiatement", "chinese": "直接，立刻", "korean": "즉시, 직접", "spanish": "inmediatamente, directamente" },
  { "furigana": "しかも", "english": "moreover, furthermore, besides, plus", "french": "de plus, en outre, qui plus est", "chinese": "而且，并且", "korean": "게다가, 더구나", "spanish": "además, incluso, también" },
  { "furigana": "しき", "english": "four seasons", "french": "quatre saisons", "chinese": "四季", "korean": "사계절", "spanish": "cuatro estaciones" },
  { "furigana": "じき", "english": "immediately, soon, shortly", "french": "bientôt, sous peu, immédiatement", "chinese": "马上，不久", "korean": "곧, 즉시", "spanish": "pronto, enseguida" },
  { "furigana": "じき", "english": "time, season, period", "french": "période, saison, temps", "chinese": "时期，时节", "korean": "시기, 기간", "spanish": "época, temporada, período" },
  { "furigana": "しきゅう", "english": "payment, allowance", "french": "paiement, allocation", "chinese": "支付，津贴", "korean": "지급, 수당", "spanish": "pago, subsidio" },
  { "furigana": "しきゅう", "english": "urgent, pressing", "french": "urgent, pressant", "chinese": "紧急，迫切", "korean": "긴급, 급히", "spanish": "urgente, apremiante" },
  { "furigana": "しきりに", "english": "frequently, repeatedly, eagerly", "french": "sans cesse, fréquemment, avidement", "chinese": "频繁地，不断地", "korean": "자주, 계속, 열심히", "spanish": "frecuentemente, repetidamente, con entusiasmo" },
  { "furigana": "しげき", "english": "stimulus, impetus, incentive", "french": "stimulation, impulsion, incitation", "chinese": "刺激，激励", "korean": "자극, 동기", "spanish": "estímulo, incentivo" },
  { "furigana": "しげん", "english": "resources", "french": "ressources", "chinese": "资源", "korean": "자원", "spanish": "recursos" },
  { "furigana": "じけん", "english": "event, affair, incident", "french": "événement, affaire, incident", "chinese": "事件，案件", "korean": "사건, 일", "spanish": "suceso, incidente" },
  { "furigana": "じこく", "english": "time, hour", "french": "heure, temps", "chinese": "时间，时刻", "korean": "시간, 시각", "spanish": "hora, tiempo" },
  { "furigana": "じさつ", "english": "suicide", "french": "suicide", "chinese": "自杀", "korean": "자살", "spanish": "suicidio" },
  { "furigana": "じじつ", "english": "fact, truth, reality", "french": "fait, réalité, vérité", "chinese": "事实，真相", "korean": "사실, 진실", "spanish": "hecho, realidad, verdad" },
  { "furigana": "ししゅつ", "english": "expenditure, expenses", "french": "dépense, frais", "chinese": "支出，开销", "korean": "지출, 비용", "spanish": "gasto, desembolso" },
  { "furigana": "じじょう", "english": "circumstances, situation, reasons", "french": "circonstances, situation, raisons", "chinese": "情况，缘由", "korean": "상황, 사정, 이유", "spanish": "circunstancias, situación, razones" },
  { "furigana": "しじん", "english": "poet", "french": "poète", "chinese": "诗人", "korean": "시인", "spanish": "poeta" },
  { "furigana": "じしん", "english": "oneself", "french": "soi-même", "chinese": "自己，自身", "korean": "자신, 자기", "spanish": "uno mismo, sí mismo" },
  { "furigana": "しずむ", "english": "to sink; to feel depressed", "french": "couler, sombrer; se déprimer", "chinese": "下沉；沮丧", "korean": "가라앉다; 침울해지다", "spanish": "hundirse; deprimirse" },
  { "furigana": "しぜん", "english": "nature, spontaneous", "french": "nature, spontané", "chinese": "自然，天然，随性", "korean": "자연, 자연스러운", "spanish": "naturaleza, espontáneo" },
  { "furigana": "しそう", "english": "thought, idea", "french": "pensée, idée", "chinese": "思想，想法", "korean": "사상, 생각", "spanish": "pensamiento, idea" },
  { "furigana": "した", "english": "tongue", "french": "langue (organe)", "chinese": "舌头", "korean": "혀", "spanish": "lengua (órgano)" },
  { "furigana": "しだい", "english": "order; circumstances; immediate(ly)", "french": "ordre; circonstances; aussitôt", "chinese": "顺序，情况；立刻", "korean": "순서; 상황; 즉시", "spanish": "orden; circunstancias; en cuanto" },
  { "furigana": "したがう", "english": "to abide (by the rules), to obey", "french": "obéir, suivre (les règles)", "chinese": "遵从，服从", "korean": "따르다, 복종하다", "spanish": "obedecer, seguir (las reglas)" },
  { "furigana": "したがって", "english": "therefore, consequently", "french": "par conséquent, aussi", "chinese": "因此，所以", "korean": "따라서, 그러므로", "spanish": "por lo tanto, por consiguiente" },
  { "furigana": "したしい", "english": "intimate, close (e.g., friend)", "french": "intime, proche (ami, etc.)", "chinese": "亲密的，亲近的", "korean": "친밀한, 가까운", "spanish": "íntimo, cercano (amigo)" },
  { "furigana": "しつ", "english": "quality, nature (of person)", "french": "qualité, nature (d'une personne)", "chinese": "质量，本质（人的）", "korean": "질, 성격(사람)", "spanish": "calidad, naturaleza (de una persona)" },
  { "furigana": "しつぎょう", "english": "unemployment", "french": "chômage", "chinese": "失业", "korean": "실업", "spanish": "desempleo, paro" },
  { "furigana": "しっけ", "english": "moisture, humidity, dampness", "french": "humidité", "chinese": "湿气，潮湿", "korean": "습기, 습함", "spanish": "humedad" },
  { "furigana": "じっけん", "english": "lab work; experiment", "french": "expérience; expérimentation", "chinese": "实验", "korean": "실험", "spanish": "experimento, laboratorio" },
  { "furigana": "じつげん", "english": "implementation, materialization, realization", "french": "réalisation, concrétisation", "chinese": "实现，落实", "korean": "실현, 구현", "spanish": "realización, materialización" },
  { "furigana": "じっこう", "english": "practice, execution (e.g., program), realization", "french": "exécution, mise en œuvre", "chinese": "执行，贯彻", "korean": "실행, 집행", "spanish": "ejecución, realización" },
  { "furigana": "じっさい", "english": "in fact; in actuality", "french": "en fait, effectivement", "chinese": "实际上，事实上", "korean": "실제로, 사실상", "spanish": "en realidad, de hecho" },
  { "furigana": "じっし", "english": "enforcement, carry out, operation", "french": "application, mise en œuvre, exécution", "chinese": "实施，执行，进行", "korean": "실시, 시행", "spanish": "ejecución, realización, implementación" },
  { "furigana": "しつど", "english": "humidity", "french": "humidité (taux)", "chinese": "湿度", "korean": "습도", "spanish": "humedad (nivel)" },
  { "furigana": "じっと", "english": "patiently, quietly", "french": "patiemment, calmement, sans bouger", "chinese": "一动不动地，静静地，耐心地", "korean": "가만히, 참을성 있게", "spanish": "pacientemente, en silencio, quieto" },
  { "furigana": "じつに", "english": "indeed, truly, surely", "french": "vraiment, effectivement, assurément", "chinese": "确实，的确", "korean": "정말, 참으로", "spanish": "verdaderamente, realmente, sin duda" }
];

const N2_SEED_VOCAB = [
  { "furigana": "アイデア; アイディア", "english": "idea", "french": "idée", "chinese": "主意，想法", "korean": "아이디어", "spanish": "idea" },
  { "furigana": "あいまい", "english": "vague, ambiguous", "french": "vague, ambigu", "chinese": "含糊，模糊", "korean": "애매한, 모호한", "spanish": "vago, ambiguo" },
  { "furigana": "あおぐ", "english": "to fan, to flap", "french": "éventer, agiter", "chinese": "扇，煽动", "korean": "부채질하다, 퍼덕이다", "spanish": "abanicar, agitar" },
  { "furigana": "あおじろい", "english": "pale", "french": "pâle", "chinese": "苍白", "korean": "창백한", "spanish": "pálido" },
  { "furigana": "あきれる", "english": "to be shocked, to be appalled", "french": "être stupéfait, être scandalisé", "chinese": "吃惊，惊讶", "korean": "어이없어하다, 깜짝 놀라다", "spanish": "quedarse asombrado, estar escandalizado" },
  { "furigana": "アクセント", "english": "accent", "french": "accent", "chinese": "重音，口音", "korean": "악센트, 강조", "spanish": "acento" },
  { "furigana": "あくび", "english": "yawn", "french": "bâillement", "chinese": "哈欠", "korean": "하품", "spanish": "bostezo" },
  { "furigana": "あくまで", "english": "to the end, to the last, stubbornly", "french": "jusqu'au bout, obstinément", "chinese": "坚持到底，固执地", "korean": "끝까지, 완강히", "spanish": "hasta el final, obstinadamente" },
  { "furigana": "あくる～", "english": "next, following", "french": "prochain, suivant", "chinese": "下一个，下…", "korean": "다음~, 이듬~", "spanish": "siguiente, próximo" },
  { "furigana": "あけがた", "english": "dawn", "french": "aube, au petit matin", "chinese": "黎明，拂晓", "korean": "새벽", "spanish": "amanecer, alba" },
  { "furigana": "あこがれる", "english": "to long for, to yearn after", "french": "aspirer à, désirer ardemment", "chinese": "憧憬，向往", "korean": "동경하다, 그리워하다", "spanish": "anhelar, añorar" },
  { "furigana": "あさねぼう", "english": "oversleeping, late riser", "french": "grasse matinée, lève-tard", "chinese": "贪睡，赖床", "korean": "늦잠꾸러기", "spanish": "dormilón, quedarse dormido" },
  { "furigana": "あしあと", "english": "footprint", "french": "empreinte, trace de pas", "chinese": "脚印", "korean": "발자국", "spanish": "huella, pisada" },
  { "furigana": "あしもと", "english": "at one's feet", "french": "aux pieds, sous les pieds", "chinese": "脚下", "korean": "발밑, 발 아래", "spanish": "a los pies, bajo los pies" },
  { "furigana": "あじわう", "english": "to taste, to savor", "french": "goûter, savourer", "chinese": "品尝，体会", "korean": "맛보다, 음미하다", "spanish": "saborear, degustar" },
  { "furigana": "あずかる", "english": "to keep in custody, to receive on deposit, to take charge of", "french": "garder, prendre en charge", "chinese": "保管，托管", "korean": "맡다, 보관하다", "spanish": "guardar, encargarse de" },
  { "furigana": "あたたまる", "english": "to warm oneself", "french": "se réchauffer", "chinese": "暖和起来，取暖", "korean": "따뜻해지다, 몸을 녹이다", "spanish": "calentarse" },
  { "furigana": "あたりまえ", "english": "natural, reasonable, obvious, usual, common, ordinary, commonplace, the norm", "french": "naturel, évident, habituel, normal", "chinese": "理所当然，普通", "korean": "당연한, 평범한", "spanish": "natural, obvio, habitual, normal" },
  { "furigana": "あちらこちら", "english": "here and there", "french": "ici et là", "chinese": "到处", "korean": "여기저기", "spanish": "aquí y allá, por todas partes" },
  { "furigana": "あつかましい", "english": "impudent, shameless,", "french": "effronté, sans gêne", "chinese": "厚脸皮，无耻", "korean": "뻔뻔한, 철면피", "spanish": "descarado, sinvergüenza" },
  { "furigana": "あっしゅく", "english": "compression, condensation, pressure", "french": "compression, condensation, pression", "chinese": "压缩，凝结", "korean": "압축, 응결, 압력", "spanish": "compresión, condensación, presión" },
  { "furigana": "あてな", "english": "address, direction", "french": "adresse, intitulé", "chinese": "地址，收件人姓名", "korean": "주소, 수신인명", "spanish": "dirección, destinatario" },
  { "furigana": "あてはまる", "english": "to be applicable, to come under (a category)", "french": "correspondre à, s’appliquer à", "chinese": "适用于，相符于", "korean": "해당하다, 들어맞다", "spanish": "aplicar(se), encajar" },
  { "furigana": "あてはめる", "english": "to apply, to adapt", "french": "appliquer, adapter", "chinese": "应用，套用", "korean": "적용하다, 대입하다", "spanish": "aplicar, adaptar" },
  { "furigana": "あばれる", "english": "to act violently, to rage", "french": "se déchaîner, faire des ravages", "chinese": "胡闹，暴躁", "korean": "난동부리다, 날뛰다", "spanish": "revolverse, comportarse violentamente" },
  { "furigana": "あぶら", "english": "fat, tallow, lard", "french": "graisse, suif, lard", "chinese": "脂肪，油脂", "korean": "기름, 지방", "spanish": "grasa, sebo, manteca" },
  { "furigana": "あぶる", "english": "to scorch, to roast", "french": "griller, rôtir", "chinese": "烤，炙", "korean": "쬐다, 그을리다", "spanish": "asar, tostar" },
  { "furigana": "あふれる", "english": "to flood, to overflow", "french": "déborder, inonder", "chinese": "溢出，充满", "korean": "넘치다, 범람하다", "spanish": "desbordarse, rebosar" },
  { "furigana": "あまど", "english": "sliding storm door", "french": "volet coulissant", "chinese": "滑动雨门、护窗板", "korean": "미닫이 덧문", "spanish": "contraventana corrediza" },
  { "furigana": "あまやかす", "english": "to pamper, to spoil", "french": "gâter, dorloter", "chinese": "娇惯，溺爱", "korean": "응석받이하다, 귀하게 키우다", "spanish": "mimar, malcriar" },
  { "furigana": "あまる", "english": "to be left over, to be in excess", "french": "rester, être en excès", "chinese": "剩余，过多", "korean": "남다, 여유가 있다", "spanish": "sobrar, quedar en exceso" },
  { "furigana": "あみもの", "english": "knitting", "french": "tricot, tricotage", "chinese": "编织物，编织", "korean": "뜨개질, 편물", "spanish": "tejido, punto" },
  { "furigana": "あみもの", "english": "knitting, web", "french": "tricot, toile d’araignée", "chinese": "编织物，织网", "korean": "뜨개질, 그물", "spanish": "tejido, red (telaraña)" },
  { "furigana": "あむ", "english": "to knit", "french": "tricoter", "chinese": "编织", "korean": "뜨다(편물)", "spanish": "tejer" },
  { "furigana": "あやうい", "english": "dangerous, critical", "french": "dangereux, critique", "chinese": "危险，危急", "korean": "위태로운, 위험한", "spanish": "peligroso, crítico" },
  { "furigana": "あやしい", "english": "suspicious, dubious, doubtful", "french": "suspect, douteux", "chinese": "可疑，靠不住", "korean": "수상한, 의심스러운", "spanish": "sospechoso, dudoso" },
  { "furigana": "あらい", "english": "rough, rude, wild", "french": "grossier, brutal, sauvage", "chinese": "粗暴，野蛮", "korean": "거친, 난폭한", "spanish": "tosco, rudo, salvaje" },
  { "furigana": "あらい", "english": "coarse, rough", "french": "rugueux, grossier", "chinese": "粗糙，粗略", "korean": "거친, 굵은", "spanish": "áspero, grueso" },
  { "furigana": "あらすじ", "english": "outline, synopsis", "french": "résumé, synopsis", "chinese": "概要，梗概", "korean": "줄거리, 개요", "spanish": "resumen, sinopsis" },
  { "furigana": "あらそう", "english": "to compete, to contest, to contend to quarrel, to argue, to dispute, to be at variance, to oppose", "french": "se disputer, rivaliser, contester, s’opposer", "chinese": "争夺，争论，对抗", "korean": "다투다, 싸우다, 경쟁하다", "spanish": "competir, disputar, discutir, oponerse" },
  { "furigana": "あらためて", "english": "another time, again", "french": "une autre fois, de nouveau", "chinese": "另一次，再次", "korean": "다시, 또", "spanish": "otra vez, de nuevo" },
  { "furigana": "あらためる", "english": "to change, to reform, to revise", "french": "changer, réformer, réviser", "chinese": "改变，修正", "korean": "개선하다, 바꾸다, 수정하다", "spanish": "cambiar, reformar, revisar" },
  { "furigana": "あらわす", "english": "to write, to publish", "french": "écrire, publier", "chinese": "写作，发表", "korean": "쓰다, 출판하다", "spanish": "escribir, publicar" },
  { "furigana": "ありがたい", "english": "grateful, thankful, appreciated", "french": "reconnaissant, apprécié", "chinese": "感激，珍贵", "korean": "고맙다, 감사하다", "spanish": "agradecido, apreciado" },
  { "furigana": "あれこれ", "english": "one thing or another, this and that", "french": "ci et là, ceci ou cela", "chinese": "这个那个，各种", "korean": "이것저것, 여러 가지", "spanish": "esto y lo otro, varias cosas" },
  { "furigana": "あれる", "english": "to be stormy, to be rough, to be ruined", "french": "être orageux, ravagé", "chinese": "变乱，变糟", "korean": "거칠어지다, 난폭해지다", "spanish": "estár tormentoso, arruinarse" },
  { "furigana": "あわただしい", "english": "busy, hurried", "french": "pressé, affairé", "chinese": "匆忙，繁忙", "korean": "분주하다, 바쁘다", "spanish": "ocupado, apresurado" },
  { "furigana": "あわてる", "english": "to become confused (disconcerted, disorganized), to be flustered, to panic, to hurry, to rush, to hasten", "french": "se troubler, s’affoler, se presser", "chinese": "慌张，着急", "korean": "허둥대다, 당황하다", "spanish": "ponerse nervioso, precipitarse, apurarse" },
  { "furigana": "あんい", "english": "easy-going", "french": "sans souci, relax", "chinese": "轻松，随和", "korean": "느긋한, 편안한", "spanish": "relajado, fácil de tratar" },
  { "furigana": "あんがい", "english": "unexpectedly, surprisingly", "french": "de façon inattendue, étonnamment", "chinese": "出乎意料，没想到", "korean": "의외로, 뜻밖에", "spanish": "inesperadamente, sorprendentemente" },
  { "furigana": "アンテナ", "english": "antenna", "french": "antenne", "chinese": "天线", "korean": "안테나", "spanish": "antena" },
  { "furigana": "いいだす", "english": "to start talking, to suggest", "french": "commencer à parler, proposer", "chinese": "开口，说出，提出", "korean": "말을 꺼내다, 제안하다", "spanish": "empezar a hablar, sugerir" },
  { "furigana": "いいつける", "english": "to tell, to order", "french": "ordonner, dire à quelqu’un", "chinese": "吩咐，命令", "korean": "말하다, 명령하다", "spanish": "ordenar, decir" },
  { "furigana": "いぎ", "english": "meaning, significance", "french": "sens, signification", "chinese": "意义，意思", "korean": "의미, 뜻", "spanish": "significado, sentido" },
  { "furigana": "いきいき", "english": "vividly, lively", "french": "vivement, plein de vie", "chinese": "生动，有活力", "korean": "생기있게, 활기차게", "spanish": "vivazmente, animado" },
  { "furigana": "いきなり", "english": "all of a sudden", "french": "tout à coup", "chinese": "突然，冷不防", "korean": "갑자기", "spanish": "de repente" },
  { "furigana": "いく～", "english": "several ~", "french": "plusieurs ~", "chinese": "几个～，若干～", "korean": "몇 ~, 수 ~", "spanish": "varios ~" },
  { "furigana": "いくじ", "english": "childcare, nursing", "french": "garde d’enfants, soins", "chinese": "育儿，抚养", "korean": "육아, 어린이 돌봄", "spanish": "cuidado de niños, crianza" },
  { "furigana": "いくぶん", "english": "somewhat", "french": "quelque peu, en partie", "chinese": "有点，稍微", "korean": "약간, 다소", "spanish": "algo, en parte" },
  { "furigana": "いけばな", "english": "flower arrangement", "french": "composition florale", "chinese": "插花", "korean": "꽃꽃이", "spanish": "arreglo floral" }
];

const N1_SEED_VOCAB = [
  { "furigana": "げんぞう", "english": "developing (film)", "french": "développement (photo)", "chinese": "冲洗（胶卷）", "korean": "현상(필름)", "spanish": "revelado (de película)" },
  { "furigana": "げんそく", "english": "principle, general rule", "french": "principe, règle générale", "chinese": "原则，基本规则", "korean": "원칙, 일반 규칙", "spanish": "principio, regla general" },
  { "furigana": "けんち", "english": "point of view", "french": "point de vue", "chinese": "观点，视角", "korean": "관점, 시각", "spanish": "punto de vista" },
  { "furigana": "げんち", "english": "actual place, local", "french": "lieu réel, local", "chinese": "实地，本地", "korean": "현지, 현장", "spanish": "lugar real, local" },
  { "furigana": "げんてい", "english": "limit, restriction", "french": "limite, restriction", "chinese": "限定，限制", "korean": "한정, 제한", "spanish": "límite, restricción" },
  { "furigana": "げんてん", "english": "origin (coordinates, starting point)", "french": "origine (coordonnées, point de départ)", "chinese": "原点（坐标，起点）", "korean": "원점(좌표, 출발점)", "spanish": "origen (coordenadas, punto inicial)" },
  { "furigana": "げんてん", "english": "original, source", "french": "original, source", "chinese": "原本，出处", "korean": "원본, 출처", "spanish": "original, fuente" },
  { "furigana": "げんばく", "english": "atomic bomb", "french": "bombe atomique", "chinese": "原子弹", "korean": "원자 폭탄", "spanish": "bomba atómica" },
  { "furigana": "げんぶん", "english": "the text, original", "french": "texte original", "chinese": "原文", "korean": "원문", "spanish": "texto original" },
  { "furigana": "げんみつ", "english": "strict, close", "french": "strict, précis", "chinese": "严密，严格", "korean": "엄밀한, 철저한", "spanish": "estricto, preciso" },
  { "furigana": "けんめい", "english": "wisdom, intelligence, prudence", "french": "sagesse, intelligence, prudence", "chinese": "聪明，智慧，慎重", "korean": "지혜, 지성, 신중함", "spanish": "sabiduría, inteligencia, prudencia" },
  { "furigana": "けんやく", "english": "thrift, economy, frugality", "french": "économie, frugalité", "chinese": "节俭，节约", "korean": "검소, 절약", "spanish": "ahorro, frugalidad" },
  { "furigana": "げんゆ", "english": "crude oil", "french": "pétrole brut", "chinese": "原油", "korean": "원유", "spanish": "petróleo crudo" },
  { "furigana": "けんよう", "english": "multi-use, combined use", "french": "usage multiple, usage combiné", "chinese": "多用途，混合使用", "korean": "겸용, 복합 사용", "spanish": "uso múltiple, uso combinado" },
  { "furigana": "けんりょく", "english": "(political) power, authority, influence", "french": "pouvoir (politique), autorité, influence", "chinese": "（政治）权力，影响力", "korean": "(정치적) 권력, 영향력", "spanish": "poder (político), autoridad, influencia" },
  { "furigana": "げんろん", "english": "discussion, speech", "french": "discussion, discours", "chinese": "讨论，言论", "korean": "언론, 토론", "spanish": "discusión, discurso" },
  { "furigana": "こ～", "english": "deceased, late", "french": "feu, défunt", "chinese": "已故，去世的", "korean": "고(故) ~, 돌아가신", "spanish": "difunto, fallecido" },
  { "furigana": "ごい", "english": "vocabulary, glossary", "french": "vocabulaire, glossaire", "chinese": "词汇，词表", "korean": "어휘, 용어집", "spanish": "vocabulario, glosario" },
  { "furigana": "こいする", "english": "to fall in love with, to love", "french": "tomber amoureux, aimer", "chinese": "恋爱，爱上", "korean": "사랑에 빠지다, 사랑하다", "spanish": "enamorarse, amar" },
  { "furigana": "こう", "english": "1st in rank; shell", "french": "premier rang ; coquille", "chinese": "甲，第一位；贝壳", "korean": "갑(1등급); 조개", "spanish": "primer rango; concha" },
  { "furigana": "～こう", "english": "light", "french": "lumière", "chinese": "光", "korean": "빛", "spanish": "luz" },
  { "furigana": "こうい", "english": "good will, favor, courtesy", "french": "bienveillance, faveur, courtoisie", "chinese": "好意，恩惠，礼貌", "korean": "호의, 친절, 예의", "spanish": "buena voluntad, favor, cortesía" },
  { "furigana": "こうい", "english": "act, deed, conduct", "french": "acte, action, conduite", "chinese": "行为，举动", "korean": "행위, 행동", "spanish": "acto, acción, conducta" },
  { "furigana": "ごうい", "english": "agreement, consent, mutual understanding", "french": "accord, consentement, entente", "chinese": "协议，同意，达成共识", "korean": "합의, 동의, 상호 이해", "spanish": "acuerdo, consentimiento, comprensión mutua" },
  { "furigana": "こうがく", "english": "engineering", "french": "génie, ingénierie", "chinese": "工程学", "korean": "공학", "spanish": "ingeniería" },
  { "furigana": "こうぎ", "english": "protest, objection", "french": "protestation, objection", "chinese": "抗议，反对", "korean": "항의, 이의", "spanish": "protesta, objeción" },
  { "furigana": "ごうぎ", "english": "consultation, conference", "french": "consultation, conférence", "chinese": "协商，会议", "korean": "협의, 회의", "spanish": "consulta, conferencia" },
  { "furigana": "こうきょ", "english": "Imperial Palace", "french": "Palais impérial", "chinese": "皇宫，皇居", "korean": "황궁", "spanish": "Palacio Imperial" },
  { "furigana": "こうきょう", "english": "prosperous conditions, healthy economy", "french": "conditions prospères, économie en bonne santé", "chinese": "繁荣状况，经济繁荣", "korean": "호황, 경기 호조", "spanish": "condiciones prósperas, economía saludable" },
  { "furigana": "こうぎょう", "english": "mining industry", "french": "industrie minière", "chinese": "矿业", "korean": "광업", "spanish": "industria minera" },
  { "furigana": "こうぎょう", "english": "starting a business; industry", "french": "création d'entreprise ; industrie", "chinese": "创业；工业", "korean": "창업; 산업", "spanish": "emprender; industria" },
  { "furigana": "こうげん", "english": "tableland, plateau", "french": "plateau, table", "chinese": "高原", "korean": "고원", "spanish": "meseta, altiplano" },
  { "furigana": "こうご", "english": "mutual, reciprocal, alternate", "french": "mutuel, réciproque, alterné", "chinese": "相互，交替", "korean": "상호, 호혜, 교대", "spanish": "mutuo, recíproco, alterno" },
  { "furigana": "こうこうと", "english": "brightly", "french": "brillamment", "chinese": "明亮地", "korean": "밝게", "spanish": "luminosamente" },
  { "furigana": "こうこがく", "english": "archeology", "french": "archéologie", "chinese": "考古学", "korean": "고고학", "spanish": "arqueología" },
  { "furigana": "こうさく", "english": "handicraft, maneuvering", "french": "artisanat, manœuvre", "chinese": "手工艺，操作", "korean": "수공예, 조작", "spanish": "artesanía, maniobra" },
  { "furigana": "こうさく", "english": "cultivation, farming", "french": "culture, agriculture", "chinese": "耕作，种植", "korean": "경작, 농사", "spanish": "cultivo, agricultura" },
  { "furigana": "こうざん", "english": "mine", "french": "mine", "chinese": "矿山", "korean": "광산", "spanish": "mina" },
  { "furigana": "こうしゅう", "english": "short course, training", "french": "stage court, formation", "chinese": "短期课程，培训", "korean": "단기 강좌, 연수", "spanish": "curso corto, capacitación" },
  { "furigana": "こうじゅつ", "english": "verbal statement", "french": "déclaration verbale", "chinese": "口述，口头陈述", "korean": "구술, 진술", "spanish": "declaración verbal" },
  { "furigana": "こうじょ", "english": "subsidy, deduction", "french": "subvention, déduction", "chinese": "补贴，扣除", "korean": "보조금, 공제", "spanish": "subsidio, deducción" },
  { "furigana": "こうしょう", "english": "negotiation", "french": "négociation", "chinese": "谈判", "korean": "교섭, 협상", "spanish": "negociación" },
  { "furigana": "こうしょう", "english": "high, noble, refined", "french": "haut, noble, raffiné", "chinese": "高尚，高贵", "korean": "고상한, 고귀한", "spanish": "alto, noble, refinado" },
  { "furigana": "こうじょう", "english": "rise, improvement, progress", "french": "amélioration, progrès, augmentation", "chinese": "提升，改善，进步", "korean": "향상, 개선, 발전", "spanish": "mejora, progreso, aumento" },
  { "furigana": "こうしん", "english": "march, parade", "french": "défilé, parade", "chinese": "行进，游行", "korean": "행진, 퍼레이드", "spanish": "desfile, marcha" },
  { "furigana": "こうしんりょう", "english": "spices", "french": "épices", "chinese": "香料", "korean": "향신료", "spanish": "especias" },
  { "furigana": "こうすい", "english": "rainfall, precipitation", "french": "précipitations, pluie", "chinese": "降水，降雨量", "korean": "강수, 강수량", "spanish": "lluvia, precipitación" },
  { "furigana": "こうずい", "english": "flood", "french": "inondation", "chinese": "洪水", "korean": "홍수", "spanish": "inundación" },
  { "furigana": "ごうせい", "english": "synthetic, mixed", "french": "synthétique, mélangé", "chinese": "合成的，混合的", "korean": "합성, 혼합", "spanish": "sintético, mezclado" },
  { "furigana": "こうぜん", "english": "openly", "french": "ouvertement", "chinese": "公开地，坦率地", "korean": "공개적으로, 솔직히", "spanish": "abiertamente" },
  { "furigana": "こうそう", "english": "dispute, resistance", "french": "dispute, résistance", "chinese": "争议，对抗", "korean": "분쟁, 반항", "spanish": "disputa, resistencia" },
  { "furigana": "こうそう", "english": "plan, plot, idea, conception", "french": "plan, projet, idée, conception", "chinese": "计划，构想", "korean": "계획, 구상, 아이디어", "spanish": "plan, idea, concepción" },
  { "furigana": "こうたい", "english": "retreat, backspace", "french": "retraite, retour arrière", "chinese": "后退，退格", "korean": "퇴각, 백스페이스", "spanish": "retroceso, retirada" },
  { "furigana": "こうたく", "english": "luster, glossy finish (of photographs)", "french": "lustre, fini brillant (photo)", "chinese": "光泽，光面（照片）", "korean": "윤택, 광택 (사진)", "spanish": "brillo, acabado brillante (de fotos)" },
  { "furigana": "こうだん", "english": "public corporation", "french": "entreprise publique", "chinese": "公共机构，公社", "korean": "공사, 공기업", "spanish": "corporación pública" },
  { "furigana": "こうちょう", "english": "satisfactory, in good shape", "french": "satisfaisant, en bonne forme", "chinese": "良好，顺利", "korean": "순조로운, 양호한", "spanish": "satisfactorio, en buen estado" },
  { "furigana": "こうとう", "english": "oral", "french": "oral", "chinese": "口头的", "korean": "구두의", "spanish": "oral" },
  { "furigana": "こうどく", "english": "reading", "french": "lecture", "chinese": "阅读", "korean": "독서", "spanish": "lectura" },
  { "furigana": "こうどく", "english": "subscription", "french": "abonnement", "chinese": "订阅", "korean": "구독", "spanish": "suscripción" },
  { "furigana": "こうにゅう", "english": "purchase, buy", "french": "achat, acquisition", "chinese": "购买，采购", "korean": "구입, 구매", "spanish": "compra, adquisición" }
];
function buildTranslationSeed(seedList) {
  const seed = {};
  seedList.forEach(item => {
    if (!item) return;
    const furigana = typeof item.furigana === 'string' ? item.furigana.trim() : null;
    const english = typeof item.english === 'string' ? item.english.trim().toLowerCase() : null;
    if (furigana) seed[furigana] = item;
    if (english) seed[english] = item;
  });
  return seed;
}

const ALL_SEED_VOCABS = [
  ...N5_SEED_VOCAB,
  ...N4_SEED_VOCAB,
  ...N3_SEED_VOCAB,
  ...N2_SEED_VOCAB,
  ...N1_SEED_VOCAB
];

const translationSeed = buildTranslationSeed(ALL_SEED_VOCABS);

function cleanText(value, fallback = "") {
  if (typeof value === "string") return value.trim();
  if (typeof fallback === "string") return fallback.trim();
  return "";
}

function enrichWord(raw) {
  const seed = translationSeed[raw?.furigana] || translationSeed[(raw?.english || "").toLowerCase()] || {};
  const furigana = cleanText(raw?.furigana, seed.furigana);
  const english = cleanText(raw?.english, seed.english) || furigana || "Word";
  const fallback = english || furigana;

  return {
    ...raw,
    furigana,
    english,
    french: cleanText(raw?.french, seed.french || fallback),
    chinese: cleanText(raw?.chinese, seed.chinese || fallback),
    korean: cleanText(raw?.korean, seed.korean || fallback),
    spanish: cleanText(raw?.spanish, seed.spanish || fallback)
  };
}

function enrichVocabulary(list = []) {
  return list.map(enrichWord).filter(item => item.furigana && item.english);
}

// Helper function to merge vocabularies and remove duplicates based on furigana
function mergeVocabularies(...vocabLists) {
  const merged = [];
  const seen = new Set();
  vocabLists.forEach(vocabList => {
    vocabList.forEach(item => {
      const key = item.furigana || item.english || '';
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    });
  });
  return merged;
}

const vocabCache = {
  Beginner: enrichVocabulary(mergeVocabularies(N5_SEED_VOCAB, N4_SEED_VOCAB)),
  Intermediate: enrichVocabulary(mergeVocabularies(N3_SEED_VOCAB, N2_SEED_VOCAB)),
  Advanced: enrichVocabulary(N1_SEED_VOCAB)
};

const vocabLoadedFromFile = {
  Beginner: false,
  Intermediate: false,
  Advanced: false
};

const CHAR_SETS = {
  "日本語": "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん",
  "English": "abcdefghijklmnopqrstuvwxyz",
  "中文": "的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取完热志反目华快难早照鱼水",
  "한국어": "가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허고노도로모보소오조초코토포호구누두루무부수우주추쿠투푸후그느드르므브스으즈츠크트프흐기니디리미비시이지치키티피히애에얘예와왜외워웨위의",
  "Español": "abcdefghijklmnopqrstuvwxyzñáéíóúü",
  "Français": "abcdefghijklmnopqrstuvwxyzàâçéèêëîïôûùüÿ"
};

const LANG_MAP = {
  "日本語": { key: "furigana", locale: "ja-JP" },
  "English": { key: "english", locale: "en-US" },
  "中文": { key: "chinese", locale: "zh-CN" },
  "한국어": { key: "korean", locale: "ko-KR" },
  "Español": { key: "spanish", locale: "es-ES" },
  "Français": { key: "french", locale: "fr-FR" }
};
const LANGUAGE_OPTIONS = ["中文", "日本語", "한국어", "English", "Español", "Français"];
// BASE_LANGUAGE_OPTIONS is now computed dynamically based on selectedLearningLang
// Legacy: kept for backward compatibility, but will be computed dynamically
const BASE_LANGUAGE_OPTIONS = LANGUAGE_OPTIONS.filter(l => l !== "日本語"); // Deprecated: use dynamic calculation instead
let hintAdListenerAttached = false;

function getAdManager() {
  if (typeof window !== "undefined") {
    if (window.advertisingManager) return window.advertisingManager;
    if (window.parent && window.parent !== window && window.parent.advertisingManager) {
      return window.parent.advertisingManager;
    }
  }
  return null;
}

// Game State
let state = {
  score: 0,
  lives: 10,
  timeLeft: GAME_DURATION,
  gameOver: false,
  startTime: 0,
  lastFrameTime: 0,

  // Visual State
  displayScore: 0,
  targetScore: 0,
  displayLives: 10,
  targetLives: 10,
  floatingTexts: [],
  hintsLeft: 3,
  waitingHintAd: false,
  noteOpen: false,
  hintButtonRect: null,
  noteButtonRect: null,
  notePanelRect: null,
  noteCloseRect: null,
  langButtonRect: null,
  langPanelRect: null,
  langCloseRect: null,
  langConfirmRect: null,
  languageLearningRects: [],
  languageBaseRects: [],
  languageOpen: false,
  selectedLearningLang: "日本語",
  selectedBaseLang: "English",
  selectedLevel: "Beginner",
  activeLevel: "Beginner",
  activeVocab: vocabCache[DEFAULT_LEVEL],
  levelRects: [],
  isLoadingVocab: false,

  currentWord: null,
  targetChars: [], // ['あ', 'か', 'な']
  progressIndex: 0, // 0 means waiting for first char
  revealedIndices: [],
  noteSpeakerRects: [],

  foundWords: [],

  fishes: [], // Array of fish objects
  person: { x: 0, y: 0, angle: 0, swaySpeed: 0.002, swayTime: 0 },

  imagesLoaded: 0,
  totalImages: 0,

  // Note Scroll State
  noteScrollY: 0,
  isDraggingNote: false,
  lastPointerY: 0,
  speakerAnim: { word: null, start: 0 }
};

const WATER_LEVEL = 0.36; // Water surface level (ratio of height)

async function ensureActiveVocab(level) {
  const targetLevel = LEVEL_OPTIONS.includes(level) ? level : DEFAULT_LEVEL;
  state.isLoadingVocab = true;
  const vocab = await loadVocabForLevel(targetLevel);
  state.isLoadingVocab = false;
  state.activeVocab = vocab && vocab.length ? vocab : vocabCache[DEFAULT_LEVEL];
  state.activeLevel = targetLevel;
  return state.activeVocab;
}

async function applyLanguageSettings() {
  if (state.selectedLearningLang === state.selectedBaseLang) {
    showToast("Please choose another language");
    return;
  }

  const levelChanged = state.selectedLevel !== state.activeLevel || !(state.activeVocab && state.activeVocab.length);
  if (levelChanged) {
    await ensureActiveVocab(state.selectedLevel);
  }

  state.languageOpen = false;
  pickNewWordAndSpawn();
}

function attachHintAdListener() {
  if (hintAdListenerAttached) return;
  const adManager = getAdManager();
  if (adManager && typeof adManager.addListener === "function") {
    adManager.addListener(handleAdEvent);
    hintAdListenerAttached = true;
  }
}

function handleAdEvent(payload) {
  if (!state.waitingHintAd) return;
  state.waitingHintAd = false;

  if (payload && payload.isGainReward === 1) {
    state.hintsLeft = (state.hintsLeft || 0) + 1;
    showToast("Hint +1");
    if (state.hintButtonRect) {
      state.floatingTexts.push({
        x: state.hintButtonRect.x + state.hintButtonRect.width / 2,
        y: state.hintButtonRect.y,
        startX: state.hintButtonRect.x + state.hintButtonRect.width / 2,
        startY: state.hintButtonRect.y,
        targetX: state.hintButtonRect.x + state.hintButtonRect.width / 2,
        targetY: state.hintButtonRect.y - 60,
        text: "+1",
        color: "#27ae60",
        progress: 0,
        value: 0,
        type: 'decoration'
      });
    }
  } else {
    const errorMsg = payload && payload.errorCode === "DAILY_LIMIT_REACHED"
      ? "Ad limit reached today"
      : "Ad not completed";
    showToast(errorMsg);
  }
}

function requestHintAd() {
  attachHintAdListener();

  const adManager = getAdManager();
  if (!adManager || typeof adManager.show !== "function") {
    showToast("Ad unavailable");
    return;
  }

  if (state.waitingHintAd) {
    showToast("Ad loading...");
    return;
  }

  state.waitingHintAd = true;
  const started = adManager.show({
    sceneType: "reward",
    slot: "hint",
    position: "hint_button"
  });

  if (!started) {
    state.waitingHintAd = false;
    showToast("Ad unavailable");
  } else {
    showToast("Loading ad...");
  }
}

// Helper: Random Range
function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Helper: Random Int
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: Random Char for Language
function randomChar(lang) {
  const chars = CHAR_SETS[lang] || CHAR_SETS["English"];
  return chars[Math.floor(Math.random() * chars.length)];
}

async function loadVocabForLevel(level = DEFAULT_LEVEL) {
  const targetLevel = LEVEL_OPTIONS.includes(level) ? level : DEFAULT_LEVEL;
  if (vocabCache[targetLevel] && vocabLoadedFromFile[targetLevel]) return vocabCache[targetLevel];

  // Get the JLPT levels that correspond to this generic level
  const jlptLevels = genericLevelToJLPTLevels(targetLevel);
  
  try {
    // Load vocabularies from all corresponding JLPT levels
    const loadedVocabs = [];
    for (const jlptLevel of jlptLevels) {
      const file = LEVEL_FILES[jlptLevel];
      if (!file) continue;
      
      try {
        const res = await fetch(file);
        const text = await res.text();
        // Some source files may contain NaN; replace with null before parsing
        const safeText = text.replace(/\bNaN\b/g, "null");
        const rawList = JSON.parse(safeText);
        const enriched = enrichVocabulary(rawList);
        loadedVocabs.push(enriched);
      } catch (err) {
        console.warn(`Failed to load vocab for ${jlptLevel}`, err);
      }
    }

    // Merge all loaded vocabularies and remove duplicates
    let normalized = loadedVocabs.length > 0 ? mergeVocabularies(...loadedVocabs) : [];
    normalized = enrichVocabulary(normalized);

    // Merge with seed vocabulary to keep richer translations
    const seedList = vocabCache[targetLevel] ? [...vocabCache[targetLevel]] : [];
    const seen = new Set(normalized.map(item => item.furigana));
    seedList.forEach(item => {
      if (!seen.has(item.furigana)) {
        normalized.push(item);
      }
    });

    vocabCache[targetLevel] = normalized.length ? normalized : vocabCache[DEFAULT_LEVEL];
    vocabLoadedFromFile[targetLevel] = true;
  } catch (err) {
    console.error(`Failed to load vocab for level ${targetLevel}`, err);
    showToast(`Failed to load vocab\nFallback to ${DEFAULT_LEVEL}`);
    vocabCache[targetLevel] = vocabCache[DEFAULT_LEVEL];
    vocabLoadedFromFile[targetLevel] = false;
  }

  return vocabCache[targetLevel];
}

function getActiveVocabList() {
  if (state.activeVocab && state.activeVocab.length) return state.activeVocab;
  if (state.activeLevel && vocabCache[state.activeLevel]) return vocabCache[state.activeLevel];
  return vocabCache[DEFAULT_LEVEL];
}

function getWordText(wordItem, langName) {
  const config = LANG_MAP[langName];
  if (!config) return "";
  let text = wordItem[config.key] || wordItem.english || wordItem.furigana || "";
  // Clean up: take first part before delimiters
  text = text.split(/[,;\/]/)[0];
  return text.trim();
}

function isPointInRect(x, y, rect) {
  if (!rect) return false;
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

let dpr = window.devicePixelRatio || 1;
// Toast State
let toastTimeout = null;
let toastLines = [];

function showToast(message, duration = 900) {
  state.toastMessage = message; // Keep for compatibility if needed, but we use toastLines now
  toastLines = message.split('\n');

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  const captured = message;
  toastTimeout = setTimeout(() => {
    if (state.toastMessage === captured && !state.isEnding && !state.gameOver) {
      state.toastMessage = null;
      toastLines = [];
    }
    toastTimeout = null;
  }, duration);
}

// Initialization
function init() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Load Images
  const imagesToLoad = [ASSETS.bg, ASSETS.people, ASSETS.settings, ASSETS.note, ASSETS.hint, ...ASSETS.fish];
  state.totalImages = imagesToLoad.length;

  imagesToLoad.forEach(asset => {
    const img = new Image();
    img.src = asset.src;
    img.onload = () => {
      asset.img = img;
      state.imagesLoaded++;
      if (state.imagesLoaded === state.totalImages) {
        startGame();
      }
    };
  });

  // Input Handling
  canvas.addEventListener('pointerdown', handleInputStart);
  canvas.addEventListener('pointermove', handleInputMove);
  canvas.addEventListener('pointerup', handleInputEnd);
  canvas.addEventListener('pointercancel', handleInputEnd);

  // Message Handling
  window.addEventListener('message', (e) => {
    if (e.data && e.data.action === 'nextLevel') {
      startGame();
    }
  });
}

async function startGame() {
  await ensureActiveVocab(state.selectedLevel || DEFAULT_LEVEL);

  state.score = 0;
  state.lives = 10;
  state.timeLeft = GAME_DURATION;
  state.gameOver = false;
  state.foundWords = [];
  state.hintsLeft = 3;
  state.noteOpen = false;
  state.noteScrollY = 0; // Reset scroll
  state.hintButtonRect = null;
  state.noteButtonRect = null;
  state.notePanelRect = null;
  state.noteCloseRect = null;
  state.languageOpen = false;
  state.langButtonRect = null;
  state.langPanelRect = null;
  state.langCloseRect = null;
  state.langConfirmRect = null;
  state.languageLearningRects = [];
  state.languageBaseRects = [];
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }

  // Reset Visual State
  state.displayScore = 0;
  state.targetScore = 0;
  state.displayLives = 10;
  state.targetLives = 10;
  state.floatingTexts = [];
  state.waitingHintAd = false;

  state.isEnding = false;
  state.toastMessage = null;

  state.startTime = Date.now();
  state.lastFrameTime = Date.now();
  state.isTransitioning = false; // Ensure not transitioning at start

  pickNewWordAndSpawn(); // Initial word and fish spawn
  requestAnimationFrame(gameLoop);
}

function nextWord() {
  // If we are already transitioning, don't start another one?
  // But this is called from checkFish when word is complete.

  // Start transition
  state.isTransitioning = true;
  state.transitionStartTime = Date.now();

  // We will fade out existing fish in update()
  // After fade out, we pick new word and spawn new fish
}

function pickNewWordAndSpawn() {
  const vocabList = getActiveVocabList();
  if (!vocabList || !vocabList.length) return;

  let word, text;
  let attempts = 0;
  // Try to pick a word that has content for the selected language
  do {
    word = vocabList[Math.floor(Math.random() * vocabList.length)];
    text = getWordText(word, state.selectedLearningLang);
    attempts++;
  } while ((!text || text.length > 12) && attempts < 50); // Avoid overly long words if possible

  if (!text) text = "Error"; // Fallback

  state.currentWord = word;
  state.targetChars = text.split('');

  // Fill-in-the-blank logic
  const len = state.targetChars.length;
  state.revealedIndices = new Array(len).fill(false);

  // Auto-reveal non-learning characters (spaces, punctuation)
  // Simple check: if char is not in the set (loosely) or is a space
  const charSet = CHAR_SETS[state.selectedLearningLang] || "";
  for (let i = 0; i < len; i++) {
    const c = state.targetChars[i].toLowerCase();
    // Verify if char is roughly in our random set or is a special char
    // Actually, just check for spaces or special punctuation
    if (!charSet.includes(c) && !charSet.includes(state.targetChars[i])) {
      // If it's a space or hyphen, reveal it
      if (/[^a-zA-Z0-9\u3040-\u309f\u4e00-\u9fa5\uac00-\ud7af\u00c0-\u00ff]/.test(state.targetChars[i])) {
        state.revealedIndices[i] = true;
      }
    }
  }

  // Count unrevealed
  const unrevealedIndices = state.revealedIndices.map((r, i) => r ? -1 : i).filter(i => i !== -1);
  const totalUnrevealed = unrevealedIndices.length;

  let revealCount = Math.max(1, Math.floor(totalUnrevealed / 2));
  if (totalUnrevealed <= 1) revealCount = 0;

  // Shuffle unrevealed indices to pick which ones to reveal initially
  for (let i = unrevealedIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unrevealedIndices[i], unrevealedIndices[j]] = [unrevealedIndices[j], unrevealedIndices[i]];
  }

  for (let i = 0; i < revealCount; i++) {
    state.revealedIndices[unrevealedIndices[i]] = true;
  }

  state.progressIndex = 0;

  spawnFishes(true); // Spawn from sides
}

function spawnFishes(fromSides = false) {
  state.fishes = [];

  const neededChars = [];
  state.targetChars.forEach((char, index) => {
    if (!state.revealedIndices[index]) {
      neededChars.push(char);
    }
  });

  const fishChars = [];
  neededChars.forEach(c => fishChars.push({ char: c, needed: true }));
  while (fishChars.length < FISH_COUNT) {
    fishChars.push({ char: randomChar(state.selectedLearningLang), needed: false });
  }

  for (let i = fishChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fishChars[i], fishChars[j]] = [fishChars[j], fishChars[i]];
  }

  for (let i = 0; i < FISH_COUNT; i++) {
    const fishTypeIndex = Math.floor(Math.random() * TOTAL_FISH_TYPES);
    // Logical height
    const logicalHeight = canvas.height / dpr;
    const logicalWidth = canvas.width / dpr;

    const yMinLogical = logicalHeight * (WATER_LEVEL + 0.2);
    const yMaxLogical = logicalHeight * 0.9;

    let startX, startY;

    if (fromSides) {
      // Spawn left or right
      const side = Math.random() < 0.5 ? -1 : 1;
      startX = side === -1 ? -FISH_WIDTH - randomRange(0, 100) : logicalWidth + FISH_WIDTH + randomRange(0, 100);
      startY = randomRange(yMinLogical, yMaxLogical);
    } else {
      startX = randomRange(0, logicalWidth);
      startY = randomRange(yMinLogical, yMaxLogical);
    }

    // Determine speed direction: if spawned left, must go right. If right, must go left.
    // If random spawn, random direction.
    let speed = randomRange(0.5, 2.5) * 0.75;
    if (fromSides) {
      if (startX < 0) speed = Math.abs(speed); // Go right
      else speed = -Math.abs(speed); // Go left
    } else {
      speed *= (Math.random() < 0.5 ? 1 : -1);
    }

    state.fishes.push({
      x: startX,
      y: startY,
      speed: speed,
      typeIndex: fishTypeIndex,
      char: fishChars[i].char,
      width: FISH_WIDTH,
      height: FISH_HEIGHT,
      wobbleOffset: Math.random() * Math.PI * 2,
      bobOffset: Math.random() * Math.PI * 2,
      opacity: fromSides ? 1 : 1 // Start visible
    });
  }
}

function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.scale(dpr, dpr);
}

function gameLoop() {
  if (state.gameOver) return;

  const now = Date.now();
  const dt = now - state.lastFrameTime;
  state.lastFrameTime = now;

  update(dt);
  draw();

  requestAnimationFrame(gameLoop);
}

function update(dt) {
  if (state.isEnding) return;

  // Timer
  const elapsed = (Date.now() - state.startTime) / 1000;
  state.timeLeft = Math.max(0, GAME_DURATION - elapsed);

  if (state.timeLeft <= 0 && !state.gameOver) {
    endGame("Time Over");
    return;
  }

  if (state.gameOver) return;

  // Floating Texts Logic
  for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
    const ft = state.floatingTexts[i];
    ft.progress += dt * 0.001; // Speed of flight

    if (ft.progress >= 1) {
      ft.progress = 1;
      // Arrived
      if (ft.type === 'score') {
        state.targetScore += ft.value;
      } else if (ft.type === 'life') {
        state.targetLives += ft.value;
      }
      state.floatingTexts.splice(i, 1);
    } else {
      // Lerp position
      ft.x = ft.startX + (ft.targetX - ft.startX) * ft.progress;
      ft.y = ft.startY + (ft.targetY - ft.startY) * ft.progress;
    }
  }

  // Number Scrolling Logic
  // Score
  if (Math.abs(state.displayScore - state.targetScore) > 0.1) {
    state.displayScore += (state.targetScore - state.displayScore) * 0.1;
  } else {
    state.displayScore = state.targetScore;
  }

  // Lives
  if (Math.abs(state.displayLives - state.targetLives) > 0.01) {
    state.displayLives += (state.targetLives - state.displayLives) * 0.1;
  } else {
    state.displayLives = state.targetLives;
    if (state.targetLives <= 0 && !state.isEnding && !state.gameOver) {
      endGame("Out of Lives");
    }
  }

  // Transition Logic
  if (state.isTransitioning) {
    const transitionElapsed = Date.now() - state.transitionStartTime;
    const fadeDuration = 500; // 0.5s fade out

    if (transitionElapsed < fadeDuration) {
      // Fading out
      const alpha = 1 - (transitionElapsed / fadeDuration);
      state.fishes.forEach(f => f.opacity = alpha);
    } else {
      // Fade done, switch word
      state.isTransitioning = false;
      pickNewWordAndSpawn();
    }
  }

  // Person Sway
  state.person.swayTime += dt * 0.002;
  state.person.angle = Math.sin(state.person.swayTime) * 0.1;

  // Logical dimensions
  const logicalWidth = canvas.width / dpr;
  const logicalHeight = canvas.height / dpr;
  const yMin = logicalHeight * (WATER_LEVEL + 0.2);
  const yMax = logicalHeight * 0.9;

  // Fish Movement
  state.fishes.forEach(fish => {
    if (fish.isWrong) {
      // Wrong Fish Animation (Vibrate & Fade)
      fish.opacity -= dt * 0.002; // Fade out speed
      if (fish.opacity < 0) fish.opacity = 0;

      // Shake
      const shakeAmount = 5;
      fish.shakeX = (Math.random() - 0.5) * shakeAmount;
      fish.shakeY = (Math.random() - 0.5) * shakeAmount;

      // Respawn if fully faded
      if (fish.opacity <= 0) {
        fish.isWrong = false;
        fish.opacity = 1;
        fish.shakeX = 0;
        fish.shakeY = 0;
        fish.char = randomChar(state.selectedLearningLang);

        // Respawn logic
        fish.x = (fish.speed > 0) ? -50 : logicalWidth + 50;
        fish.y = randomRange(yMin, yMax);
      }
    } else {
      // Normal Movement
      fish.x += fish.speed * (dt / 16);

      // Bobbing
      fish.bobOffset += dt * 0.003;
      fish.currentBob = Math.sin(fish.bobOffset) * 5; // +/- 5px amplitude

      // Wrap around (only if not transitioning out)
      if (!state.isTransitioning) {
        if (fish.speed > 0 && fish.x > logicalWidth + 50) {
          fish.x = -50;
          fish.y = randomRange(yMin, yMax);
        } else if (fish.speed < 0 && fish.x < -50) {
          fish.x = logicalWidth + 50;
          fish.y = randomRange(yMin, yMax);
        }
      }
    }
  });
}

function endGame(reason) {
  if (state.isEnding || state.gameOver) return;

  state.isEnding = true;
  showToast(reason);

  setTimeout(() => {
    state.gameOver = true;
    // Send message to parent
    window.parent.postMessage({
      action: "levelComplete",
      score: state.score,
      foundWords: state.foundWords
    }, "*");
  }, 500);
}

function draw() {
  const logicalWidth = canvas.width / dpr;
  const logicalHeight = canvas.height / dpr;

  // Clear
  ctx.clearRect(0, 0, logicalWidth, logicalHeight);

  // Background
  if (ASSETS.bg.img) {
    ctx.drawImage(ASSETS.bg.img, 0, 0, logicalWidth, logicalHeight);
  }

  // Person
  if (ASSETS.people.img) {
    ctx.save();
    const pW = 100;
    const pH = 100;
    const pX = logicalWidth / 2;
    const pY = logicalHeight * WATER_LEVEL - pH * 0.3;

    ctx.translate(pX, pY);
    ctx.rotate(state.person.angle);
    ctx.drawImage(ASSETS.people.img, -pW / 2, -pH / 2, pW, pH);
    ctx.restore();
  }

  // Fish
  state.fishes.forEach(fish => {
    const asset = ASSETS.fish[fish.typeIndex];
    if (asset && asset.img) {
      ctx.save();
      ctx.globalAlpha = fish.opacity !== undefined ? fish.opacity : 1;

      // Apply bobbing to Y
      const drawY = fish.y + (fish.currentBob || 0);

      // Apply shake
      const drawX = fish.x + (fish.shakeX || 0);
      const finalDrawY = drawY + (fish.shakeY || 0);

      ctx.translate(drawX, finalDrawY);
      if (fish.speed > 0) {
        ctx.scale(-1, 1); // Flip if swimming right (assuming sprite faces left)
      }

      // Draw Fish
      ctx.drawImage(asset.img, -fish.width / 2, -fish.height / 2, fish.width, fish.height);

      // Draw Bubble and Char
      // Unflip for text/bubble
      if (fish.speed > 0) {
        ctx.scale(-1, 1);
      }

      const bubbleY = -fish.height / 2 - 10;
      const bubbleRadius = 20;

      // Bubble (Frosted Glass Effect)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(0, bubbleY, bubbleRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Char
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 29px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fish.char, 0, bubbleY);

      ctx.restore();
    }
  });

  // UI
  drawUI();

  // Draw Floating Texts
  state.floatingTexts.forEach(ft => {
    ctx.save();
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  });

  // Draw Floating Texts
  state.floatingTexts.forEach(ft => {
    ctx.save();
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  });

  drawNoteOverlay();
  drawLanguageOverlay();

  // Draw Toast
  if (state.toastMessage) {
    const logicalWidth = canvas.width / dpr;
    const logicalHeight = canvas.height / dpr;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';

    // Font and sizing (reduced to 60% of original)
    const fontSize = 12; // 20 * 0.6 = 12
    const lineHeight = fontSize * 1.2; // Auto-calculated, approximately 14.4px
    const paddingV = 12; // 20 * 0.6 = 12
    const paddingH = 24; // 40 * 0.6 = 24

    // Set font before measuring text
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calculate dynamic width based on text width
    let maxLineWidth = 0;
    toastLines.forEach(line => {
      const metrics = ctx.measureText(line);
      if (metrics.width > maxLineWidth) {
        maxLineWidth = metrics.width;
      }
    });

    // Calculate box dimensions
    const boxWidth = Math.max(150, Math.min(maxLineWidth + paddingH, logicalWidth * 0.8)); // Min 150px, max 80% of screen width
    const boxHeight = toastLines.length * lineHeight + paddingV;

    // Use fillRect for compatibility if roundRect is not supported, or check support
    const boxX = logicalWidth / 2 - boxWidth / 2;
    const boxY = logicalHeight / 2 - boxHeight / 2;

    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
      ctx.fill();
    } else {
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    }

    ctx.fillStyle = '#fff';

    // Draw each line
    toastLines.forEach((line, index) => {
      const lineY = boxY + paddingV / 2 + lineHeight / 2 + index * lineHeight;
      ctx.fillText(line, logicalWidth / 2, lineY);
    });

    ctx.restore();
  }
}

function drawUI() {
  const logicalWidth = canvas.width / dpr;
  const logicalHeight = canvas.height / dpr;
  const uiOffsetY = 80;

  // Score
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#666';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(`Score: ${Math.round(state.displayScore)}`, 20, 40 + uiOffsetY);

  // Timer
  ctx.textAlign = 'right';
  ctx.fillStyle = '#666';
  ctx.fillText(`Time: ${Math.ceil(state.timeLeft)}s`, logicalWidth - 20, 40 + uiOffsetY);

  // Lives
  if (Math.abs(state.displayLives - state.targetLives) > 0.01) {
    state.displayLives += (state.targetLives - state.displayLives) * 0.1;
  } else {
    state.displayLives = state.targetLives;
    if (state.targetLives <= 0 && !state.isEnding && !state.gameOver) {
      endGame("Out of Lives");
    }
  }
  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Lives: ${Math.round(state.displayLives)}`, 20, 70 + uiOffsetY);

  // Current word placed beside the fisherman
  const personWidth = 100;
  const personHeight = 100;
  const personX = logicalWidth / 2;
  const personY = logicalHeight * WATER_LEVEL - personHeight * 0.3;
  const vocabX = personX;
  const vocabY = personY + personHeight * 0.8;
  const kanaText = state.targetChars.map((char, index) => state.revealedIndices[index] ? char : '_').join(''); // Remove spaces in join for cleaner look? Or keep space? ' ' is good.
  const joinedText = state.targetChars.map((char, index) => state.revealedIndices[index] ? char : '_').join(' ');
  const kanaFontSize = 26; // 80% of previous 32px
  const englishFontSize = 13; // 80% of previous 16px
  const englishOffset = kanaFontSize * 0.85;
  const englishY = vocabY + englishOffset;

  ctx.font = `bold ${kanaFontSize}px Arial`;
  const kanaWidth = ctx.measureText(joinedText).width;
  const kanaHeight = kanaFontSize;
  ctx.font = `${englishFontSize}px Arial`;

  // Translation: selectedBaseLang
  let translation = getWordText(state.currentWord, state.selectedBaseLang);

  const englishWidth = ctx.measureText(translation).width;
  const englishHeight = englishFontSize;

  const padX = 14;
  const padY = 10;
  const boxWidth = Math.max(kanaWidth, englishWidth) + padX * 2;
  const boxTop = vocabY - kanaHeight / 2 - padY;
  const boxBottom = englishY + englishHeight / 2 + padY;
  const boxHeight = boxBottom - boxTop;
  const boxX = vocabX - boxWidth / 2;
  const textCenterX = vocabX;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.strokeStyle = 'rgba(44, 62, 80, 0.25)';
  ctx.lineWidth = 2;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(boxX, boxTop, boxWidth, boxHeight, 10);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(boxX, boxTop, boxWidth, boxHeight);
    ctx.strokeRect(boxX, boxTop, boxWidth, boxHeight);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2c3e50';
  ctx.font = `bold ${kanaFontSize}px Arial`;
  ctx.fillText(joinedText, textCenterX, vocabY);

  ctx.fillStyle = '#3a3a3a';
  ctx.font = `${englishFontSize}px Arial`;
  ctx.fillText(translation, textCenterX, englishY);

  // Icons (Settings, Note, Hint) on the left
  const iconSize = 40;
  const iconGap = 30; // Gap between icon bottom and next icon top (including text)
  const iconX = 30;
  let iconY = 110 + uiOffsetY;

  // Settings (Lang)
  if (ASSETS.settings.img) {
    const rect = { x: iconX, y: iconY, width: iconSize, height: iconSize };
    state.langButtonRect = rect;
    ctx.drawImage(ASSETS.settings.img, rect.x, rect.y, rect.width, rect.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Settings', rect.x + rect.width / 2, rect.y + rect.height + 4);
  }

  iconY += iconSize + iconGap;

  // Note
  if (ASSETS.note.img) {
    const rect = { x: iconX, y: iconY, width: iconSize, height: iconSize };
    state.noteButtonRect = rect;
    ctx.drawImage(ASSETS.note.img, rect.x, rect.y, rect.width, rect.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Note', rect.x + rect.width / 2, rect.y + rect.height + 4);
  }

  iconY += iconSize + iconGap;

  // Hint
  if (ASSETS.hint.img) {
    const rect = { x: iconX, y: iconY, width: iconSize, height: iconSize };
    state.hintButtonRect = rect;
    ctx.drawImage(ASSETS.hint.img, rect.x, rect.y, rect.width, rect.height);

    // Badge for remaining hints or AD (scaled down to 80%)
    const badgeText = state.hintsLeft > 0 ? String(state.hintsLeft) : "AD";
    const badgeColor = "#e74c3c"; // red badge
    const badgeRadius = 12 * 0.8; // 80% size
    const badgeX = rect.x + rect.width - badgeRadius * 1.0; // shift left to overlap the bulb
    const badgeY = rect.y + badgeRadius * 0.3;
    ctx.fillStyle = badgeColor;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = 'bold 9.6px Arial'; // 12px * 0.8
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, badgeX, badgeY);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Hint', rect.x + rect.width / 2, rect.y + rect.height + 4);
  }
}

function drawGameOver() {
  // Do nothing, handled by parent
}

function drawNoteOverlay() {
  if (!state.noteOpen) {
    state.notePanelRect = null;
    state.noteCloseRect = null;
    state.noteSpeakerRects = [];
    return;
  }
  state.noteSpeakerRects = [];

  const logicalWidth = canvas.width / dpr;
  const logicalHeight = canvas.height / dpr;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  const panelWidth = Math.min(320, logicalWidth - 40);
  const panelHeight = Math.min(360, logicalHeight - 120);
  const x = (logicalWidth - panelWidth) / 2;
  const y = (logicalHeight - panelHeight) / 2;

  state.notePanelRect = { x, y, width: panelWidth, height: panelHeight };

  state.notePanelRect = { x, y, width: panelWidth, height: panelHeight };

  // Clip for rounded corners
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, panelWidth, panelHeight, 12);
  } else {
    ctx.rect(x, y, panelWidth, panelHeight);
  }
  ctx.clip();

  // Background (Body)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, panelWidth, panelHeight);

  const headerHeight = 50;
  // Header Background
  ctx.fillStyle = '#F5F9FF';
  ctx.fillRect(x, y, panelWidth, headerHeight);

  // Divider
  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + headerHeight);
  ctx.lineTo(x + panelWidth, y + headerHeight);
  ctx.stroke();

  // Header Title
  ctx.fillStyle = '#2c3e50';
  ctx.font = '600 18px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('📓 Notes', x + 16, y + headerHeight / 2);

  // Close Button
  const closeSize = 26;
  const closeX = x + panelWidth - closeSize - 12;
  const closeY = y + (headerHeight - closeSize) / 2;
  const closeRect = { x: closeX, y: closeY, width: closeSize, height: closeSize };
  state.noteCloseRect = closeRect;

  // Close Button Background (Circle)
  ctx.beginPath();
  ctx.arc(closeX + closeSize / 2, closeY + closeSize / 2, closeSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
  ctx.fill();

  // Close X
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const pad = 8;
  ctx.moveTo(closeX + pad, closeY + pad);
  ctx.lineTo(closeX + closeSize - pad, closeY + closeSize - pad);
  ctx.moveTo(closeX + closeSize - pad, closeY + pad);
  ctx.lineTo(closeX + pad, closeY + closeSize - pad);
  ctx.stroke();

  ctx.restore(); // End clip

  // Border (Stroke) for the whole panel
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, panelWidth, panelHeight, 12);
    ctx.stroke();
  } else {
    ctx.strokeRect(x, y, panelWidth, panelHeight);
  }

  // Content
  const listStartY = y + headerHeight;
  const listHeight = panelHeight - headerHeight;

  // Clip content area for scrolling
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, listStartY, panelWidth, listHeight);
  ctx.clip();

  const contentOffsetY = listStartY + 20 - state.noteScrollY;

  if (!state.foundWords.length) {
    // Empty State
    ctx.textAlign = 'center';

    // Fish Image
    let fishY = contentOffsetY + 20;
    if (ASSETS.fish && ASSETS.fish.length > 0 && ASSETS.fish[0].img) {
      const fishW = 60;
      const fishH = 60;
      // Draw a random fish or just the first one
      ctx.drawImage(ASSETS.fish[0].img, x + panelWidth / 2 - fishW / 2, fishY, fishW, fishH);
      fishY += fishH + 20;
    } else {
      ctx.font = '40px Arial';
      ctx.fillText('🐟', x + panelWidth / 2, fishY + 20);
      fishY += 50;
    }

    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Your word album is empty', x + panelWidth / 2, fishY);

    ctx.fillStyle = '#7f8c8d';
    ctx.font = '14px Arial';
    ctx.fillText('Catch fish to unlock new words!', x + panelWidth / 2, fishY + 26);

  } else {

    // List Content with Cards
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const itemsToShow = state.foundWords.slice().reverse(); // Show latest first, all of them
    const itemHeight = 50;
    const itemGap = 12;

    // Calculate total Content Height for scroll limits
    state.noteContentHeight = itemsToShow.length * (itemHeight + itemGap) + 40; // + padding

    itemsToShow.forEach((w, i) => {
      const itemY = contentOffsetY + i * (itemHeight + itemGap);

      // Optimization: Skip drawing if out of view
      if (itemY + itemHeight < listStartY || itemY > listStartY + listHeight) return;

      const itemX = x + 20;
      const itemW = panelWidth - 40;

      // Card Background
      ctx.fillStyle = '#FFFBF0'; // Light beige/yellow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;

      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(itemX, itemY, itemW, itemHeight, 8);
        ctx.fill();
      } else {
        ctx.fillRect(itemX, itemY, itemW, itemHeight);
      }
      // Reset Shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Text Content
      // Target Word (Learning Lang) - We usually store entire word object, but we need to display the learning lang part.
      // Ideally foundWords stores the mode it was found in, but simplest is just show it in current valid modes?
      // Or we can just show the furigana for now, or update foundWords structure.
      // Let's deduce it. state.selectedLearningLang might have changed.
      // Displaying in current settings is best.
      const learningText = getWordText(w, state.selectedLearningLang);

      ctx.fillStyle = '#2c3e50';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(learningText, itemX + 16, itemY + itemHeight / 2);

      const learningWidth = ctx.measureText(learningText).width;

      // Speaker Icon
      const speakerSize = 24;
      const speakerX = itemX + 16 + learningWidth + 12;
      const speakerY = itemY + itemHeight / 2;

      // Draw Speaker
      ctx.save();
      ctx.translate(speakerX + speakerSize / 2, speakerY);

      // Animation
      if (state.speakerAnim && state.speakerAnim.word === w) {
        const elapsed = Date.now() - state.speakerAnim.start;
        const duration = 200;
        if (elapsed < duration) {
          const scale = 1 + Math.sin((elapsed / duration) * Math.PI) * 0.4;
          ctx.scale(scale, scale);
        } else {
          // End animation for this word if passed (optional cleanup, or just let it fail check next time)
        }
      }

      ctx.fillStyle = '#1F6FCF';

      // Speaker Body
      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.lineTo(-2, -4);
      ctx.lineTo(4, -8);
      ctx.lineTo(4, 8);
      ctx.lineTo(-2, 4);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fill();

      // Sound Waves
      ctx.strokeStyle = '#1F6FCF';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(2, 0, 5, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(2, 0, 9, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();

      ctx.restore();

      // Hit Area
      state.noteSpeakerRects.push({
        x: speakerX,
        y: speakerY - speakerSize / 2,
        width: speakerSize,
        height: speakerSize,
        word: w
      });

      const startTransX = speakerX + speakerSize + 12;

      let translation = getWordText(w, state.selectedBaseLang);


      ctx.fillStyle = '#2c3e50'; // Dark blue-gray like image
      ctx.font = '16px Arial';
      ctx.fillText(`- ${translation}`, startTransX, itemY + itemHeight / 2);
    });
  }
  ctx.restore(); // End list clip
}

function drawLanguageOverlay() {
  if (!state.languageOpen) {
  state.langPanelRect = null;
  state.langCloseRect = null;
  state.langConfirmRect = null;
  state.languageLearningRects = [];
  state.languageBaseRects = [];
  state.levelRects = [];
  return;
}

  const logicalWidth = canvas.width / dpr;
  const logicalHeight = canvas.height / dpr;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  const chipHeight = 36;
  const chipGapY = 10;
  const chipGapX = 10;
  
  // Dynamic language options calculation
  const learningOptions = LANGUAGE_OPTIONS; // All languages can be selected as learning language
  const baseOptions = LANGUAGE_OPTIONS; // Show all languages, validation happens on click
  
  const learningRows = Math.ceil(learningOptions.length / 2);
  const learningSectionHeight = learningRows * (chipHeight + chipGapY) + 30;
  const baseRows = Math.ceil(baseOptions.length / 2);
  const baseSectionHeight = baseRows * (chipHeight + chipGapY) + 30;
  // 难度级别按钮改为一行显示（3个按钮）
  const levelRows = 1;
  const levelSectionHeight = levelRows * (chipHeight + chipGapY) + 30;
  const sectionsHeight = levelSectionHeight + learningSectionHeight + baseSectionHeight;
  const neededHeight = 50 + 16 + sectionsHeight + 20 + 44 + 24;

  const panelWidth = Math.min(380, logicalWidth - 40);
  const panelHeight = Math.min(neededHeight, logicalHeight - 40);
  const x = (logicalWidth - panelWidth) / 2;
  const y = (logicalHeight - panelHeight) / 2;

  state.langPanelRect = { x, y, width: panelWidth, height: panelHeight };

  // Clip for rounded corners
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, panelWidth, panelHeight, 12);
  } else {
    ctx.rect(x, y, panelWidth, panelHeight);
  }
  ctx.clip();

  // Background (Body)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, panelWidth, panelHeight);

  const headerHeight = 50;
  // Header Background
  ctx.fillStyle = '#F5F9FF';
  ctx.fillRect(x, y, panelWidth, headerHeight);

  // Divider
  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + headerHeight);
  ctx.lineTo(x + panelWidth, y + headerHeight);
  ctx.stroke();

  // Header Title
  ctx.fillStyle = '#2c3e50';
  ctx.font = '600 18px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Language Settings', x + 16, y + headerHeight / 2);

  // Close Button
  const closeSize = 26;
  const closeX = x + panelWidth - closeSize - 12;
  const closeY = y + (headerHeight - closeSize) / 2;
  const closeRect = { x: closeX, y: closeY, width: closeSize, height: closeSize };
  state.langCloseRect = closeRect;

  // Close Button Background (Circle)
  ctx.beginPath();
  ctx.arc(closeX + closeSize / 2, closeY + closeSize / 2, closeSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
  ctx.fill();

  // Close X
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const pad = 8;
  ctx.moveTo(closeX + pad, closeY + pad);
  ctx.lineTo(closeX + closeSize - pad, closeY + closeSize - pad);
  ctx.moveTo(closeX + closeSize - pad, closeY + pad);
  ctx.lineTo(closeX + pad, closeY + closeSize - pad);
  ctx.stroke();

  // Note: clip restore moved to end of function to protect all content areas

  // Border (Stroke) for the whole panel
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, panelWidth, panelHeight, 12);
    ctx.stroke();
  } else {
    ctx.strokeRect(x, y, panelWidth, panelHeight);
  }

  // Content Area
  const contentStartY = y + headerHeight + 16;
  // 难度级别按钮使用更小的宽度（一行3个）
  const levelChipWidth = (panelWidth - 32 - 16 - chipGapX * 2) / 3; // 3个按钮一行
  const chipWidth = (panelWidth - 32 - 16 - chipGapX) / 2; // 其他区域保持2列布局
  let cursorY = contentStartY;

  // Level Section
  const levelSectionY = cursorY;
  ctx.fillStyle = '#E8F3FF';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x + 16, levelSectionY, panelWidth - 32, levelSectionHeight, 12);
    ctx.fill();
  } else {
    ctx.fillRect(x + 16, levelSectionY, panelWidth - 32, levelSectionHeight);
  }

  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const levelLabel = 'Difficulty Level';
  ctx.fillText(levelLabel, x + 28, levelSectionY + 12);
  ctx.font = '12px Arial';
  ctx.fillStyle = '#57738c';
  const levelLabelWidth = ctx.measureText(levelLabel).width;
  ctx.fillText(`Current: ${state.activeLevel}`, x + 28 + levelLabelWidth + 32, levelSectionY + 14);

  state.levelRects = [];
  const levelGridStartY = levelSectionY + 40;
  LEVEL_OPTIONS.forEach((level, idx) => {
    // 一行显示3个按钮
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const chipX = x + 28 + col * (levelChipWidth + chipGapX);
    const chipY = levelGridStartY + row * (chipHeight + chipGapY);
    const rect = { x: chipX, y: chipY, width: levelChipWidth, height: chipHeight, level, type: 'level' };
    state.levelRects.push(rect);

    const selected = state.selectedLevel === level;

    if (selected) {
      const grad = ctx.createLinearGradient(chipX, chipY, chipX, chipY + chipHeight);
      grad.addColorStop(0, '#57C3FF');
      grad.addColorStop(1, '#1E94F5');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#1C7BC8';
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#C4D7EB';
    }

    ctx.lineWidth = 1;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, levelChipWidth, chipHeight, 8);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(chipX, chipY, levelChipWidth, chipHeight);
      ctx.strokeRect(chipX, chipY, levelChipWidth, chipHeight);
    }

    ctx.fillStyle = selected ? '#fff' : '#2c3e50';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(level, chipX + levelChipWidth / 2, chipY + chipHeight / 2);
  });

  cursorY += levelSectionHeight + 16;

  // Learning Language Section
  ctx.fillStyle = '#E8F5E9';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x + 16, cursorY, panelWidth - 32, learningSectionHeight, 12);
    ctx.fill();
  } else {
    ctx.fillRect(x + 16, cursorY, panelWidth - 32, learningSectionHeight);
  }

  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Learning', x + 28, cursorY + 12);

  state.languageLearningRects = [];
  const learningKeyStartY = cursorY + 36;
  learningOptions.forEach((lang, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const chipX = x + 28 + col * (chipWidth + chipGapX);
    const chipY = learningKeyStartY + row * (chipHeight + chipGapY);
    const rect = { x: chipX, y: chipY, width: chipWidth, height: chipHeight, lang, type: 'learning' };
    state.languageLearningRects.push(rect);

    const selected = state.selectedLearningLang === lang;

    if (selected) {
      const grad = ctx.createLinearGradient(chipX, chipY, chipX, chipY + chipHeight);
      grad.addColorStop(0, '#4CAF50');
      grad.addColorStop(1, '#388E3C');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#2E7D32';
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#C8E6C9';
    }

    ctx.lineWidth = 1;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, chipWidth, chipHeight, 8);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(chipX, chipY, chipWidth, chipHeight);
      ctx.strokeRect(chipX, chipY, chipWidth, chipHeight);
    }

    ctx.fillStyle = selected ? '#fff' : '#2c3e50';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lang, chipX + chipWidth / 2, chipY + chipHeight / 2);
  });

  cursorY += learningSectionHeight + 16;

  // Base Language (Using)
  ctx.fillStyle = '#FFF0D4';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x + 16, cursorY, panelWidth - 32, baseSectionHeight, 12);
    ctx.fill();
  } else {
    ctx.fillRect(x + 16, cursorY, panelWidth - 32, baseSectionHeight);
  }

  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Using', x + 28, cursorY + 12);

  state.languageBaseRects = [];
  const baseKeyStartY = cursorY + 36;
  baseOptions.forEach((lang, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const chipX = x + 28 + col * (chipWidth + chipGapX);
    const chipY = baseKeyStartY + row * (chipHeight + chipGapY);
    const rect = { x: chipX, y: chipY, width: chipWidth, height: chipHeight, lang, type: 'base' };
    state.languageBaseRects.push(rect);

    const selected = state.selectedBaseLang === lang;

    if (selected) {
      const grad = ctx.createLinearGradient(chipX, chipY, chipX, chipY + chipHeight);
      grad.addColorStop(0, '#1EA0F2');
      grad.addColorStop(1, '#0F83D1');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#0C70B6';
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#E2D1B3'; // Light border for unselected
    }

    ctx.lineWidth = 1;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, chipWidth, chipHeight, 8);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(chipX, chipY, chipWidth, chipHeight);
      ctx.strokeRect(chipX, chipY, chipWidth, chipHeight);
    }

    ctx.fillStyle = selected ? '#fff' : '#2c3e50';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lang, chipX + chipWidth / 2, chipY + chipHeight / 2);
  });

  cursorY += baseSectionHeight + 20;

  // Apply Button
  const confirmWidth = 170;
  const confirmHeight = 30;
  const confirmRect = {
    x: x + (panelWidth - confirmWidth) / 2,
    y: cursorY,
    width: confirmWidth,
    height: confirmHeight
  };
  state.langConfirmRect = confirmRect;

  const btnGrad = ctx.createLinearGradient(confirmRect.x, confirmRect.y, confirmRect.x, confirmRect.y + confirmHeight);
  btnGrad.addColorStop(0, '#1E94F5');
  btnGrad.addColorStop(1, '#1074CF');

  ctx.fillStyle = btnGrad;
  ctx.strokeStyle = '#0E63B0';
  ctx.lineWidth = 1;
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;

  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(confirmRect.x, confirmRect.y, confirmRect.width, confirmRect.height, 22);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(confirmRect.x, confirmRect.y, confirmRect.width, confirmRect.height);
    ctx.strokeRect(confirmRect.x, confirmRect.y, confirmRect.width, confirmRect.height);
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Apply', confirmRect.x + confirmRect.width / 2, confirmRect.y + confirmRect.height / 2);

  if (state.isLoadingVocab) {
    ctx.fillStyle = '#2c3e50';
    ctx.font = '12px Arial';
    ctx.fillText('Loading vocab...', confirmRect.x + confirmRect.width / 2, confirmRect.y + confirmRect.height + 18);
  }

  ctx.restore(); // End clip - moved here to protect all content areas (Difficulty Level, Learning Language, Using Language, Apply button)
}

function completeCurrentWord() {
  state.score += 100;
  state.foundWords.push(state.currentWord);
  nextWord();
}

// Consolidated input handlers
function handleInputStart(e) {
  const logicalWidth = canvas.width / dpr;
  const logicalHeight = canvas.height / dpr;
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  state.lastPointerY = clickY;

  // Note Scroll Init
  if (state.noteOpen && state.notePanelRect && isPointInRect(clickX, clickY, state.notePanelRect)) {
    // Check if dragging inside content area (below header)
    if (clickY > state.notePanelRect.y + 50) { // 50 is header height
      state.isDraggingNote = true;
      // Don't return, allow clicks to propagate if it's a tap, but strictly we handle clicks on UP
      // For now, let's treat move as scroll, up as tap
    }
  }

  // Passing down to logic that was in handleInput, but we should move "Click" logic to pointerup (or handle click separately)
  // For dragging, we split logic.
  // Actually, simplest refactor is: pointerdown initiates drag. pointerup executes click if not dragged much.
  state.pointerDownPos = { x: clickX, y: clickY };
}

function handleInputMove(e) {
  if (!state.isDraggingNote) return;

  const rect = canvas.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const deltaY = y - state.lastPointerY;
  state.lastPointerY = y;

  state.noteScrollY -= deltaY;

  // Clamp Scroll
  // content height needed. Assigned in drawNoteOverlay
  const panelHeight = state.notePanelRect ? state.notePanelRect.height - 50 : 300;
  const maxScroll = Math.max(0, (state.noteContentHeight || 0) - panelHeight);

  if (state.noteScrollY < 0) state.noteScrollY = 0;
  if (state.noteScrollY > maxScroll) state.noteScrollY = maxScroll;
}

function handleInputEnd(e) {
  state.isDraggingNote = false;

  // Determine if it was a click
  const rect = canvas.getBoundingClientRect();
  const upX = e.clientX - rect.left;
  const upY = e.clientY - rect.top;

  if (state.pointerDownPos) {
    const dist = Math.abs(upX - state.pointerDownPos.x) + Math.abs(upY - state.pointerDownPos.y);
    if (dist < 10) {
      handleInputClick(e);
    }
  }
  state.pointerDownPos = null;
}

async function handleInputClick(e) {
  unlockSpeech();
  const logicalWidth = canvas.width / dpr;
  const logicalHeight = canvas.height / dpr;

  if (state.gameOver) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);

    if (x > logicalWidth / 2 - 80 && x < logicalWidth / 2 + 80 &&
      y > logicalHeight / 2 + 60 && y < logicalHeight / 2 + 110) {
      startGame();
    }
    return;
  }

  if (state.isTransitioning) return;
  if (state.lives <= 0) return;

  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  // Handle language overlay interactions first
  if (state.languageOpen) {
    if (state.langCloseRect && isPointInRect(clickX, clickY, state.langCloseRect)) {
      state.languageOpen = false;
      state.selectedLevel = state.activeLevel;
      return;
    }
    if (state.langConfirmRect && isPointInRect(clickX, clickY, state.langConfirmRect)) {
      await applyLanguageSettings();
      return;
    }

    let handledLang = false;

    for (const opt of state.levelRects) {
      if (isPointInRect(clickX, clickY, opt)) {
        state.selectedLevel = opt.level;
        loadVocabForLevel(opt.level); // Prefetch in the background
        handledLang = true;
        break;
      }
    }

    if (!handledLang) {
      for (const opt of state.languageLearningRects) {
        if (isPointInRect(clickX, clickY, opt)) {
          // Check if the selected language is the same as current base language
          if (opt.lang === state.selectedBaseLang) {
            showToast("Please choose another language");
            return;
          }
          state.selectedLearningLang = opt.lang;
          handledLang = true;
          break;
        }
      }
    }

    if (!handledLang) {
      for (const opt of state.languageBaseRects) {
        if (isPointInRect(clickX, clickY, opt)) {
          // Check if the selected language is the same as current learning language
          if (opt.lang === state.selectedLearningLang) {
            showToast("Please choose another language");
            return;
          }
          state.selectedBaseLang = opt.lang;
          handledLang = true;
          break;
        }
      }
    }
    if (handledLang) return;

    if (state.langPanelRect && !isPointInRect(clickX, clickY, state.langPanelRect)) {
      state.languageOpen = false;
      state.selectedLevel = state.activeLevel;
      return;
    }
    if (state.langPanelRect && isPointInRect(clickX, clickY, state.langPanelRect)) {
      return;
    }
  }

  // Handle note overlay interactions
  if (state.noteOpen) {
    if (state.noteCloseRect && isPointInRect(clickX, clickY, state.noteCloseRect)) {
      state.noteOpen = false;
      return;
    }
    if (state.notePanelRect && !isPointInRect(clickX, clickY, state.notePanelRect)) {
      state.noteOpen = false;
      return;
    }
    // Consume clicks inside panel without closing
    if (state.notePanelRect && isPointInRect(clickX, clickY, state.notePanelRect)) {
      // Check Speaker Clicks
      if (state.noteSpeakerRects) {
        for (const spk of state.noteSpeakerRects) {
          if (clickX >= spk.x && clickX <= spk.x + spk.width &&
            clickY >= spk.y && clickY <= spk.y + spk.height) {

            state.speakerAnim = { word: spk.word, start: Date.now() };
            const txt = getWordText(spk.word, state.selectedLearningLang);
            speak(txt, state.selectedLearningLang);
            return;
          }
        }
      }
      return;
    }
  }

  // Hint button
  if (state.hintButtonRect && isPointInRect(clickX, clickY, state.hintButtonRect)) {
    if (state.hintsLeft > 0) {
      useHint();
    } else {
      requestHintAd();
    }
    return;
  }

  // Language button
  if (state.langButtonRect && isPointInRect(clickX, clickY, state.langButtonRect)) {
    state.selectedLevel = state.activeLevel || state.selectedLevel || DEFAULT_LEVEL;
    // Note: Language validation now happens on click, not when opening the panel
    state.languageOpen = true;
    state.noteOpen = false;
    return;
  }

  // Note button
  if (state.noteButtonRect && isPointInRect(clickX, clickY, state.noteButtonRect)) {
    state.languageOpen = false;
    state.noteOpen = true;
    return;
  }

  for (let i = state.fishes.length - 1; i >= 0; i--) {
    const fish = state.fishes[i];

    if (fish.isWrong) continue; // Ignore dying fish

    // Fish coordinates are logical.
    // Apply bobbing to Y for collision check
    const fishY = fish.y + (fish.currentBob || 0);

    const dx = clickX - fish.x;
    const dy = clickY - fishY;

    const bubbleY = fishY - fish.height / 2 - 10;
    const dyBubble = clickY - bubbleY;

    const distFish = (dx * dx + dy * dy);
    const distBubble = (dx * dx + dyBubble * dyBubble);

    if (distFish < (FISH_WIDTH / 2 + 15) ** 2 || distBubble < (25) ** 2) {
      checkFish(fish);
      break;
    }
  }
}

function useHint() {
  if (state.hintsLeft <= 0 || !state.currentWord || state.isTransitioning) return;
  const missingIndices = state.revealedIndices
    .map((revealed, index) => (!revealed ? index : null))
    .filter(index => index !== null);
  if (!missingIndices.length) return;

  const pickIndex = missingIndices[Math.floor(Math.random() * missingIndices.length)];
  state.revealedIndices[pickIndex] = true;
  state.hintsLeft--;
  state.score += 100;

  // Score reward floating text (to Score UI)
  const uiOffsetY = 80;
  if (state.hintButtonRect) {
    state.floatingTexts.push({
      x: state.hintButtonRect.x + state.hintButtonRect.width / 2,
      y: state.hintButtonRect.y,
      startX: state.hintButtonRect.x + state.hintButtonRect.width / 2,
      startY: state.hintButtonRect.y,
      targetX: 60,
      targetY: 40 + uiOffsetY,
      text: "+100",
      color: "#F36900",
      progress: 0,
      value: 100,
      type: 'score'
    });
  }

  // Hint Effect: specific floating text
  if (state.hintButtonRect) {
    state.floatingTexts.push({
      x: state.hintButtonRect.x + state.hintButtonRect.width / 2,
      y: state.hintButtonRect.y,
      startX: state.hintButtonRect.x + state.hintButtonRect.width / 2,
      startY: state.hintButtonRect.y,
      targetX: state.hintButtonRect.x + state.hintButtonRect.width / 2,
      targetY: state.hintButtonRect.y - 60,
      text: "-1",
      color: "#e74c3c",
      progress: 0,
      value: 0,
      type: 'decoration'
    });
  }

  if (state.revealedIndices.every(r => r)) {
    completeCurrentWord();
  }
}

function checkFish(fish) {
  // Play sound
  speak(fish.char, state.selectedLearningLang);

  let nextMissingIndex = -1;
  for (let i = 0; i < state.targetChars.length; i++) {
    if (!state.revealedIndices[i]) {
      nextMissingIndex = i;
      break;
    }
  }

  if (nextMissingIndex === -1) return;

  const targetChar = state.targetChars[nextMissingIndex];
  const uiOffsetY = 80;

  if (fish.char === targetChar) {
    // Correct!
    state.revealedIndices[nextMissingIndex] = true;

    // Spawn Floating Text (+100)
    // Target: Score area (approx 20, 40 + uiOffsetY)
    state.floatingTexts.push({
      x: fish.x,
      y: fish.y,
      startX: fish.x,
      startY: fish.y,
      targetX: 60, // approximate score x center
      targetY: 40 + uiOffsetY,
      text: "+100",
      color: "#F36900",
      progress: 0,
      value: 100,
      type: 'score'
    });

    state.score += 100; // Logic update immediately
    // Visual target update happens when text arrives

    fish.char = randomChar(state.selectedLearningLang);

    const logicalWidth = canvas.width / dpr;
    const logicalHeight = canvas.height / dpr;

    fish.x = (fish.speed > 0) ? -50 : logicalWidth + 50;
    const yMin = logicalHeight * (WATER_LEVEL + 0.05);
    const yMax = logicalHeight * 0.9;
    fish.y = randomRange(yMin, yMax);

    if (state.revealedIndices.every(r => r)) {
      completeCurrentWord();
    }
  } else {
    // Wrong!
    state.lives--;

    // Mark as wrong for animation
    fish.isWrong = true;
    fish.shakeX = 0;
    fish.shakeY = 0;

    // Spawn Floating Text (-1)
    // Target: Lives area (approx 20, 70 + uiOffsetY)
    state.floatingTexts.push({
      x: fish.x,
      y: fish.y,
      startX: fish.x,
      startY: fish.y,
      targetX: 60, // approximate lives x center
      targetY: 70 + uiOffsetY,
      text: "-1",
      color: "#e74c3c",
      progress: 0,
      value: -1,
      type: 'life'
    });
  }
}

// Helper: Speak
// Speech Synthesis State
let voices = [];
let currentUtterance = null;
let speechUnlocked = false;

function loadVoices() {
  if ('speechSynthesis' in window) {
    voices = window.speechSynthesis.getVoices();
  }
}

if ('speechSynthesis' in window) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

function unlockSpeech() {
  if (speechUnlocked || !('speechSynthesis' in window)) return;

  // Play silent utterance to unlock audio context on mobile
  const utterance = new SpeechSynthesisUtterance('');
  utterance.volume = 0;
  window.speechSynthesis.speak(utterance);
  speechUnlocked = true;
}

// Helper: Speak
function speak(text, langName = "日本語") {
  if (!('speechSynthesis' in window)) return;

  // Resume if paused (fix for some Android/Chrome versions)
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  const mapItem = LANG_MAP[langName] || LANG_MAP["日本語"];
  const targetLocale = mapItem.locale;

  utterance.lang = targetLocale;
  utterance.rate = 1.0;

  // Try to select a voice explicitly
  if (voices.length === 0) loadVoices();
  // Find voice matching locale
  const voice = voices.find(v => v.lang === targetLocale || v.lang.startsWith(targetLocale.split('-')[0]));
  if (voice) {
    utterance.voice = voice;
  }

  // Keep reference to prevent Garbage Collection
  currentUtterance = utterance;
  utterance.onend = () => { currentUtterance = null; };
  utterance.onerror = () => { currentUtterance = null; };

  window.speechSynthesis.speak(utterance);
}

// Start
init();
