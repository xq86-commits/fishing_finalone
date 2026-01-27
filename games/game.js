const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game Configuration
const GAME_DURATION = 90; // seconds
const FISH_COUNT = 6;
const FISH_WIDTH = 40;  // 80% of previous size
const FISH_HEIGHT = 40;
const TOTAL_FISH_TYPES = 14;
const TUTORIAL_STORAGE_KEY = "hasSeenTutorial";

// Assets
const ASSETS = {
  bg: { src: '../fish_assets/bg.png', img: null },
  people: { src: '../fish_assets/people.png', img: null },
  settings: { src: '../fish_assets/settings.png', img: null },
  note: { src: '../fish_assets/note.png', img: null },
  hint: { src: '../fish_assets/hint.png', img: null },
  musicOn: { src: '../fish_assets/open.png', img: null },
  musicOff: { src: '../fish_assets/mute.png', img: null },
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

// Map generic level to JLPT levels for vocabulary loading
function genericLevelToJLPTLevels(genericLevel) {
  const mapping = {
    "Beginner": ["N5", "N4"],      // 初级合并N5和N4
    "Intermediate": ["N3", "N2"],  // 中级合并N3和N2
    "Advanced": ["N1"]             // 高级使用N1
  };
  return mapping[genericLevel] || ["N5"];
}

// Minimal fallback vocabulary (used only if JSON files fail to load)
const N5_SEED_VOCAB = [];
const N4_SEED_VOCAB = [];
const N3_SEED_VOCAB = [];
const N2_SEED_VOCAB = [];
const N1_SEED_VOCAB = [];

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

// 字段映射函数：将压缩格式转换为标准格式
function normalizeVocabItem(item) {
  if (!item) return null;

  // 如果已经是标准格式（有furigana字段），直接返回
  if (item.furigana !== undefined) {
    return item;
  }

  // 如果是压缩格式（有f字段），转换为标准格式
  if (item.f !== undefined) {
    return {
      id: item.id,
      furigana: item.f,
      english: item.e || '',
      chinese: item.c || '',
      korean: item.k || '',
      spanish: item.s || '',
      french: item.fr || ''
    };
  }

  // 兼容其他可能的格式
  return item;
}

function enrichWord(raw) {
  // 先标准化字段
  const normalized = normalizeVocabItem(raw);
  const seed = translationSeed[normalized?.furigana] || translationSeed[(normalized?.english || "").toLowerCase()] || {};
  const furigana = cleanText(normalized?.furigana, seed.furigana);
  const english = cleanText(normalized?.english, seed.english) || furigana || "Word";
  const fallback = english || furigana;

  return {
    ...normalized,
    furigana,
    english,
    french: cleanText(normalized?.french, seed.french || fallback),
    chinese: cleanText(normalized?.chinese, seed.chinese || fallback),
    korean: cleanText(normalized?.korean, seed.korean || fallback),
    spanish: cleanText(normalized?.spanish, seed.spanish || fallback)
  };
}

function enrichVocabulary(list = []) {
  return list.map(enrichWord).filter(item => item.furigana && item.english);
}

// Helper function to merge vocabularies and remove duplicates based on furigana
function mergeVocabularies(vocabLists) {
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
  "Beginner": enrichVocabulary(mergeVocabularies([N5_SEED_VOCAB, N4_SEED_VOCAB])),
  "Intermediate": enrichVocabulary(mergeVocabularies([N3_SEED_VOCAB, N2_SEED_VOCAB])),
  "Advanced": enrichVocabulary(N1_SEED_VOCAB)
};

const vocabLoadedFromFile = {
  "Beginner": false,
  "Intermediate": false,
  "Advanced": false
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

function buildTranslationSeed(seedList) {
  const seed = {};
  seedList.forEach(item => {
    if (!item) return;
    const normalized = normalizeVocabItem(item);
    const furigana = typeof normalized?.furigana === 'string' ? normalized.furigana.trim() : null;
    const english = typeof normalized?.english === 'string' ? normalized.english.trim().toLowerCase() : null;
    if (furigana) seed[furigana] = normalized;
    if (english) seed[english] = normalized;
  });
  return seed;
}

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
  tutorialActive: false,
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
  musicEnabled: true,
  musicButtonRect: null,
  musicWaveAnim: { time: 0 },
  selectedLearningLang: "English",
  selectedBaseLang: "中文",
  selectedLevel: DEFAULT_LEVEL,
  activeLevel: DEFAULT_LEVEL,
  activeVocab: vocabCache[DEFAULT_LEVEL] || vocabCache["Beginner"],
  levelRects: [],
  isLoadingVocab: false,
  adSupport: null,

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
  gameStarted: false,

  // Note Scroll State
  noteScrollY: 0,
  isDraggingNote: false,
  lastPointerY: 0,
  speakerAnim: { word: null, start: 0 },

  // Countdown Effects
  timeShakeStart: null,
  countdownSoundPlaying: false,
  countdownSoundInterval: null,

  toastPosition: 0.7
};

// Timeout guard to ensure we advance even if speech events fail
let nextWordTimer = null;

const WATER_LEVEL = 0.36; // Water surface level (ratio of height)

let tutorialOverlay = null;

function hasSeenTutorial() {
  try {
    return localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
  } catch (e) {
    return false;
  }
}

function markTutorialSeen() {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, true);
  } catch (e) {
    console.warn("[game] Failed to save tutorial state", e);
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getLivesHighlightRect() {
  const uiOffsetY = 80;
  const fontSize = 20;
  const livesRaw = typeof state.displayLives === "number"
    ? state.displayLives
    : (typeof state.lives === "number" ? state.lives : 10);
  const livesValue = Math.round(livesRaw);
  const livesText = `Lives: ${livesValue}`;
  ctx.save();
  ctx.font = `bold ${fontSize}px Arial`;
  const textWidth = ctx.measureText(livesText).width;
  ctx.restore();

  const textX = 20;
  const textY = 136 + uiOffsetY;
  const paddingX = 12;
  const rectHeight = fontSize + 12;
  return {
    x: textX - paddingX,
    y: textY - rectHeight / 2,
    width: textWidth + paddingX * 2,
    height: rectHeight,
    radius: 10
  };
}

function getHintHighlightCircle(logicalWidth) {
  const uiOffsetY = 80;
  const iconSize = 40;
  const iconGap = 30;

  if (state.hintButtonRect) {
    const rect = state.hintButtonRect;
    return {
      cx: rect.x + rect.width / 2,
      cy: rect.y + rect.height / 2,
      r: Math.max(rect.width, rect.height) / 2 + 8
    };
  }

  const iconX = logicalWidth - iconSize - 20;
  const iconY = 110 + uiOffsetY + (iconSize + iconGap) * 2;
  return {
    cx: iconX + iconSize / 2,
    cy: iconY + iconSize / 2,
    r: iconSize / 2 + 8
  };
}

function getWordHighlightRect(logicalWidth, logicalHeight) {
  const personHeight = 100;
  const personY = logicalHeight * WATER_LEVEL - personHeight * 0.3;
  const vocabY = personY + personHeight * 0.8;
  const kanaFontSize = 26;
  const englishFontSize = 13;
  const englishOffset = 30;
  const englishY = vocabY + englishOffset;

  const joinedText = state.targetChars && state.targetChars.length
    ? state.targetChars.map((char, index) => state.revealedIndices[index] ? char : "_").join(" ")
    : "_ _ _ _";

  ctx.save();
  ctx.font = `bold ${kanaFontSize}px Arial`;
  const kanaWidth = ctx.measureText(joinedText).width;
  ctx.font = `${englishFontSize}px Arial`;
  let translation = "";
  if (state.currentWord) {
    translation = getWordText(state.currentWord, state.selectedBaseLang, false) || "";
  }
  const englishWidth = translation ? ctx.measureText(translation).width : kanaWidth * 0.6;
  ctx.restore();

  const padX = 14;
  const padY = 10;
  const boxWidth = Math.max(kanaWidth, englishWidth) + padX * 2;
  const boxTop = vocabY - kanaFontSize / 2 - padY;
  const boxBottom = englishY + englishFontSize / 2 + padY;
  const boxHeight = boxBottom - boxTop;
  const boxX = logicalWidth / 2 - boxWidth / 2;

  return {
    x: boxX,
    y: boxTop,
    width: boxWidth,
    height: boxHeight,
    radius: 10
  };
}

function getTutorialLayout() {
  const logicalWidth = canvas.width ? canvas.width / dpr : window.innerWidth;
  const logicalHeight = canvas.height ? canvas.height / dpr : window.innerHeight;

  return {
    width: logicalWidth,
    height: logicalHeight,
    lives: getLivesHighlightRect(),
    hint: getHintHighlightCircle(logicalWidth),
    word: getWordHighlightRect(logicalWidth, logicalHeight)
  };
}

function injectTutorialStyles() {
  if (document.getElementById("tutorial-overlay-styles")) return;
  const style = document.createElement("style");
  style.id = "tutorial-overlay-styles";
  style.textContent = `
.tutorial-overlay {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: none;
  cursor: pointer;
  touch-action: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.tutorial-overlay.is-visible {
  display: block;
}

.tutorial-overlay__mask,
.tutorial-overlay__labels {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.tutorial-label {
  position: absolute;
  max-width: 180px;
  color: #fff;
  font-size: 14px;
  line-height: 1.3;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.tutorial-label__title {
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 4px;
}

.tutorial-label--center {
  text-align: center;
  transform: translateX(-50%);
}

.tutorial-label--word > div {
  display: block;
  white-space: nowrap;
  min-height: 1.3em;
  line-height: 1.3;
}

.tutorial-label--lives {
  white-space: nowrap;
}

.tutorial-label--hint {
  white-space: pre-line;
}
  `;
  document.head.appendChild(style);
}

class TutorialOverlay {
  constructor(onDismiss) {
    injectTutorialStyles();
    this.onDismiss = onDismiss;
    this.root = document.createElement("div");
    this.root.className = "tutorial-overlay";
    this.root.setAttribute("role", "button");
    this.root.setAttribute("aria-label", "Start game");

    const maskId = "tutorial-mask";
    this.root.innerHTML = `
<svg class="tutorial-overlay__mask" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <mask id="${maskId}">
      <rect width="100%" height="100%" fill="white"></rect>
      <rect data-role="hole" data-target="lives" rx="12" ry="12" fill="black"></rect>
      <rect data-role="hole" data-target="word" rx="12" ry="12" fill="black"></rect>
      <circle data-role="hole" data-target="hint" r="24" fill="black"></circle>
    </mask>
  </defs>
  <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.6)" mask="url(#${maskId})"></rect>
  <rect data-role="outline" data-target="lives" rx="12" ry="12" fill="none" stroke="rgba(255, 255, 255, 0.9)" stroke-width="2"></rect>
  <rect data-role="outline" data-target="word" rx="12" ry="12" fill="none" stroke="rgba(255, 255, 255, 0.9)" stroke-width="2"></rect>
  <circle data-role="outline" data-target="hint" fill="none" stroke="rgba(255, 255, 255, 0.9)" stroke-width="2"></circle>
  <circle data-role="dot" data-target="lives" r="4" fill="rgba(255, 255, 255, 0.85)"></circle>
  <circle data-role="dot" data-target="word" r="4" fill="rgba(255, 255, 255, 0.85)"></circle>
  <circle data-role="dot" data-target="hint" r="4" fill="rgba(255, 255, 255, 0.85)"></circle>
</svg>
<div class="tutorial-overlay__labels">
  <div class="tutorial-label tutorial-label--lives">
    <div>Each wrong letter costs one life.</div>
  </div>
  <div class="tutorial-label tutorial-label--word tutorial-label--center">
    <div>Catch letters to complete the word.</div>
    <div>The meaning below is your clue.</div>
  </div>
  <div class="tutorial-label tutorial-label--hint">
    <div>Use hints when you're<br>stuck.Each hint<br>reveals one letter.</div>
  </div>
</div>
    `;

    this.svg = this.root.querySelector(".tutorial-overlay__mask");
    this.holes = {
      lives: this.root.querySelector('[data-role="hole"][data-target="lives"]'),
      word: this.root.querySelector('[data-role="hole"][data-target="word"]'),
      hint: this.root.querySelector('[data-role="hole"][data-target="hint"]')
    };
    this.outlines = {
      lives: this.root.querySelector('[data-role="outline"][data-target="lives"]'),
      word: this.root.querySelector('[data-role="outline"][data-target="word"]'),
      hint: this.root.querySelector('[data-role="outline"][data-target="hint"]')
    };
    this.dots = {
      lives: this.root.querySelector('[data-role="dot"][data-target="lives"]'),
      word: this.root.querySelector('[data-role="dot"][data-target="word"]'),
      hint: this.root.querySelector('[data-role="dot"][data-target="hint"]')
    };
    this.labels = {
      lives: this.root.querySelector(".tutorial-label--lives"),
      word: this.root.querySelector(".tutorial-label--word"),
      hint: this.root.querySelector(".tutorial-label--hint")
    };

    this.root.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (this.onDismiss) {
        this.onDismiss();
      }
    });
  }

  show() {
    if (!this.root.isConnected) {
      document.body.appendChild(this.root);
    }
    this.root.classList.add("is-visible");
  }

  hide() {
    this.root.classList.remove("is-visible");
    if (this.root.isConnected) {
      this.root.remove();
    }
  }

  update(layout) {
    if (!layout) return;
    this.svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);

    const setRect = (el, rect) => {
      if (!el || !rect) return;
      el.setAttribute("x", rect.x);
      el.setAttribute("y", rect.y);
      el.setAttribute("width", rect.width);
      el.setAttribute("height", rect.height);
      if (rect.radius !== undefined) {
        el.setAttribute("rx", rect.radius);
        el.setAttribute("ry", rect.radius);
      }
    };

    const setCircle = (el, circle) => {
      if (!el || !circle) return;
      el.setAttribute("cx", circle.cx);
      el.setAttribute("cy", circle.cy);
      el.setAttribute("r", circle.r);
    };

    setRect(this.holes.lives, layout.lives);
    setRect(this.outlines.lives, layout.lives);
    setRect(this.holes.word, layout.word);
    setRect(this.outlines.word, layout.word);
    setCircle(this.holes.hint, layout.hint);
    setCircle(this.outlines.hint, layout.hint);

    const labelWidth = 180;
    const safePadding = 12;
    const maxLeft = layout.width - labelWidth - safePadding;
    const maxTop = layout.height - 80;

    const dotRadius = 4;
    const dotOffset = 10;
    const dotBounds = {
      minX: safePadding + dotRadius,
      maxX: layout.width - safePadding - dotRadius,
      minY: safePadding + dotRadius,
      maxY: layout.height - safePadding - dotRadius
    };

    const livesDot = {
      cx: layout.lives.x + layout.lives.width + dotOffset,
      cy: layout.lives.y + layout.lives.height / 2,
      r: dotRadius
    };
    const wordDot = {
      cx: layout.word.x + layout.word.width / 2,
      cy: layout.word.y - dotOffset,
      r: dotRadius
    };
    const hintDot = {
      cx: layout.hint.cx,
      cy: layout.hint.cy + layout.hint.r + 8,
      r: dotRadius
    };

    const clampDot = (dot) => ({
      cx: clamp(dot.cx, dotBounds.minX, dotBounds.maxX),
      cy: clamp(dot.cy, dotBounds.minY, dotBounds.maxY),
      r: dot.r
    });

    setCircle(this.dots.lives, clampDot(livesDot));
    setCircle(this.dots.word, clampDot(wordDot));
    setCircle(this.dots.hint, clampDot(hintDot));

    const livesLeft = clamp(layout.lives.x + layout.lives.width + 12, safePadding, maxLeft);
    const livesTop = clamp(layout.lives.y - 6, safePadding, maxTop);
    this.labels.lives.style.left = `${livesLeft}px`;
    this.labels.lives.style.top = `${livesTop}px`;

    const hintLeft = clamp(layout.hint.cx - layout.hint.r - labelWidth - 12 + 90 + 40 + 30 + 70, safePadding, maxLeft);
    const hintTop = clamp(layout.hint.cy + 44 + 40 - 30 - 40, safePadding, maxTop);
    this.labels.hint.style.left = `${hintLeft}px`;
    this.labels.hint.style.top = `${hintTop}px`;

    const wordCenter = layout.word.x + layout.word.width / 2;
    const wordLeft = clamp(wordCenter, safePadding + labelWidth / 2, layout.width - safePadding - labelWidth / 2);
    const wordTop = Math.max(safePadding, layout.word.y - 64);
    this.labels.word.style.left = `${wordLeft}px`;
    this.labels.word.style.top = `${wordTop}px`;

    const spacing = 10;
    const getRect = (el) => el.getBoundingClientRect();
    const overlapsHorizontally = (a, b) => a.left < b.right && a.right > b.left;
    const moveLabelWithinBounds = (el, deltaY) => {
      const currentTop = parseFloat(el.style.top) || 0;
      const height = el.getBoundingClientRect().height;
      const minTop = safePadding;
      const maxTop = layout.height - safePadding - height;
      const newTop = clamp(currentTop + deltaY, minTop, maxTop);
      el.style.top = `${newTop}px`;
      return newTop - currentTop;
    };

    const separateLabels = (elA, elB) => {
      const rectA = getRect(elA);
      const rectB = getRect(elB);
      if (!overlapsHorizontally(rectA, rectB)) return;

      const isAAbove = rectA.top <= rectB.top;
      const upperRect = isAAbove ? rectA : rectB;
      const lowerRect = isAAbove ? rectB : rectA;
      const upperEl = isAAbove ? elA : elB;
      const lowerEl = isAAbove ? elB : elA;
      const gap = lowerRect.top - upperRect.bottom;
      if (gap >= spacing) return;

      const shift = spacing - gap;
      const moved = moveLabelWithinBounds(lowerEl, shift);
      if (moved < shift) {
        moveLabelWithinBounds(upperEl, -1 * (shift - moved));
      }
    };

    for (let i = 0; i < 2; i++) {
      separateLabels(this.labels.lives, this.labels.word);
      separateLabels(this.labels.lives, this.labels.hint);
      separateLabels(this.labels.word, this.labels.hint);
    }
  }
}

function ensureTutorialOverlay() {
  if (!tutorialOverlay) {
    tutorialOverlay = new TutorialOverlay(handleTutorialDismiss);
  }
  return tutorialOverlay;
}

function handleTutorialDismiss() {
  if (!state.tutorialActive) return;
  state.tutorialActive = false;
  markTutorialSeen();
  if (tutorialOverlay) {
    tutorialOverlay.hide();
    tutorialOverlay = null;
  }
  state.startTime = Date.now();
  state.lastFrameTime = Date.now();
}

async function ensureActiveVocab(level) {
  const targetLevel = LEVEL_OPTIONS.includes(level) ? level : DEFAULT_LEVEL;
  state.isLoadingVocab = true;
  const vocab = await loadVocabForLevel(targetLevel);
  state.isLoadingVocab = false;
  state.activeVocab = vocab && vocab.length ? vocab : (vocabCache[targetLevel] || vocabCache[DEFAULT_LEVEL] || vocabCache["Beginner"]);
  state.activeLevel = targetLevel;
  return state.activeVocab;
}

// Load and validate saved game settings from localStorage
function loadSavedGameSettings() {
  try {
    const savedLearningLang = localStorage.getItem('fishwordlingo_last_learningLang');
    const savedBaseLang = localStorage.getItem('fishwordlingo_last_baseLang');
    const savedLevel = localStorage.getItem('fishwordlingo_last_level');

    // Validate and apply learning language
    if (savedLearningLang && LANGUAGE_OPTIONS.includes(savedLearningLang)) {
      state.selectedLearningLang = savedLearningLang;
    }

    // Validate and apply base language
    if (savedBaseLang && LANGUAGE_OPTIONS.includes(savedBaseLang)) {
      state.selectedBaseLang = savedBaseLang;
    }

    // Validate and apply level
    if (savedLevel && LEVEL_OPTIONS.includes(savedLevel)) {
      state.selectedLevel = savedLevel;
    }

    // Ensure learning and base languages are different
    if (state.selectedLearningLang === state.selectedBaseLang) {
      // If they're the same, reset base language to a different one
      const availableBaseLang = LANGUAGE_OPTIONS.find(l => l !== state.selectedLearningLang);
      if (availableBaseLang) {
        state.selectedBaseLang = availableBaseLang;
      } else {
        state.selectedBaseLang = "中文"; // Fallback
      }
    }
  } catch (e) {
    console.warn('[game] Failed to load settings from localStorage', e);
  }
}

async function applyLanguageSettings() {
  if (state.selectedLearningLang === state.selectedBaseLang) {
    showToast("Please Choose Different Language");
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

  let parsedPayload;
  try {
    parsedPayload = typeof payload === 'string' ? JSON.parse(payload || '{}') : payload;
  } catch (e) {
    parsedPayload = {};
  }
  if (parsedPayload && parsedPayload.isGainReward === 1) {
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
    const errorMsg = parsedPayload && (parsedPayload.viewsNumber === parsedPayload.maximumViews)
      ? "Ad limit reached today"
      : "Ad not completed";
    showToast(errorMsg);
  }
}

async function requestHintAd() {
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
  // 检查客户端版本是否支持调用广告
  if (state.adSupport === null) {
    showToast("Ad loading...");
    return;
  }
  if (state.adSupport === false) {
    showToast("Please upgrade to the latest version");
    return;
  }
  state.waitingHintAd = true;
  const started = adManager.show({
    sceneType: "words-fishing-watch-advertising",
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

  // Get JLPT levels for this generic level
  const jlptLevels = genericLevelToJLPTLevels(targetLevel);
  const allLoadedVocab = [];
  const seen = new Set();

  // Load vocabularies for all mapped JLPT levels
  for (const jlptLevel of jlptLevels) {
    const file = LEVEL_FILES[jlptLevel];
    if (!file) continue;

    try {
      // Create a timeout controller for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

      const res = await fetch(file, { signal: controller.signal });
      clearTimeout(timeoutId);

      const text = await res.text();
      // Some source files may contain NaN; replace with null before parsing
      const safeText = text.replace(/\bNaN\b/g, "null");
      const rawList = JSON.parse(safeText);
      const normalized = enrichVocabulary(rawList);

      // Merge vocabularies, avoiding duplicates based on furigana
      normalized.forEach(item => {
        const key = item.furigana || item.english || '';
        if (key && !seen.has(key)) {
          seen.add(key);
          allLoadedVocab.push(item);
        }
      });
    } catch (err) {
      console.error(`Failed to load vocab for ${jlptLevel}`, err);
    }
  }

  // Merge with seed vocabulary if available
  if (vocabCache[targetLevel] && vocabCache[targetLevel].length) {
    const seedList = [...vocabCache[targetLevel]];
    seedList.forEach(item => {
      const key = item.furigana || item.english || '';
      if (key && !seen.has(key)) {
        seen.add(key);
        allLoadedVocab.push(item);
      }
    });
  }

  vocabCache[targetLevel] = allLoadedVocab.length ? allLoadedVocab : (vocabCache[targetLevel] || vocabCache[DEFAULT_LEVEL] || vocabCache["Beginner"]);
  vocabLoadedFromFile[targetLevel] = true;

  return vocabCache[targetLevel];
}

function getActiveVocabList() {
  if (state.activeVocab && state.activeVocab.length) return state.activeVocab;
  if (state.activeLevel && vocabCache[state.activeLevel]) return vocabCache[state.activeLevel];
  return vocabCache[DEFAULT_LEVEL] || vocabCache["Beginner"];
}

function getWordText(wordItem, langName, strictValidation = true) {
  const config = LANG_MAP[langName];
  if (!config) return "";
  // 优先使用指定语言的字段，如果不存在或为空，返回空字符串（不回退到其他语言）
  let text = wordItem[config.key];
  if (!text || (typeof text === 'string' && text.trim() === "")) {
    return ""; // 返回空字符串，让调用者知道这个单词没有该语言的翻译
  }
  // Clean up: take first part before delimiters
  text = text.split(/[,;\/]/)[0];
  text = text.trim();

  // 验证文本是否真的包含指定语言的字符（防止使用回退值）
  const charSet = CHAR_SETS[langName] || "";
  if (charSet && text.length > 0) {
    // 如果是基础语言（提示文本），使用宽松验证
    if (!strictValidation) {
      // 对于基础语言，即使字符不完全匹配字符集，也返回文本（因为可能是有效的翻译）
      // 只做基本检查：如果文本完全由空格和标点组成，返回空字符串
      const hasContent = text.split('').some(char => {
        return !/[\s\.,;:!?\-\(\)\[\]{}]/.test(char);
      });
      if (!hasContent) {
        return "";
      }
      // 对于基础语言，直接返回文本，不进行严格的字符集验证
      return text;
    }

    // 学习语言使用严格验证（现有逻辑）
    // 检查文本中的字符是否主要属于指定语言字符集
    let validCharCount = 0;
    let totalCharCount = 0;

    text.split('').forEach(char => {
      // 跳过空格和标点符号
      if (/[\s\.,;:!?\-\(\)\[\]{}]/.test(char)) {
        return;
      }
      totalCharCount++;

      // 对于大小写敏感的语言（如英语），检查小写和大写
      if (langName === "English" || langName === "Español" || langName === "Français") {
        if (charSet.includes(char.toLowerCase()) || charSet.includes(char.toUpperCase())) {
          validCharCount++;
        }
      } else {
        // 对于其他语言，直接检查
        if (charSet.includes(char)) {
          validCharCount++;
        }
      }
    });

    // 如果文本中大部分字符都不属于指定语言字符集，说明这是回退值，返回空字符串
    // 要求至少50%的字符属于指定语言字符集
    if (totalCharCount > 0 && validCharCount / totalCharCount < 0.5) {
      return "";
    }
  }

  return text;
}

function isPointInRect(x, y, rect) {
  if (!rect) return false;
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

let dpr = window.devicePixelRatio || 1;
// Toast State
let toastTimeout = null;
let toastLines = [];

function showToast(message, duration = 800, position = 0.7) {
  state.toastMessage = message; // Keep for compatibility if needed, but we use toastLines now
  state.toastPosition = position; // Set toast position
  toastLines = message.split('\n');

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  const captured = message;
  toastTimeout = setTimeout(() => {
    if (state.toastMessage === captured && !state.isEnding && !state.gameOver) {
      state.toastMessage = null;
      toastLines = [];
      state.toastPosition = 0.7; // Reset to default position
    }
    toastTimeout = null;
  }, duration);
}

// Initialization
function init() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  state.tutorialActive = !hasSeenTutorial();
  if (state.tutorialActive) {
    ensureTutorialOverlay();
  }

  // Load Images
  const imagesToLoad = [ASSETS.bg, ASSETS.people, ASSETS.settings, ASSETS.note, ASSETS.hint, ASSETS.musicOn, ASSETS.musicOff, ...ASSETS.fish];
  state.totalImages = imagesToLoad.length;
  let processedImages = 0;

  const onImageProcessed = () => {
    processedImages++;
    if (processedImages === state.totalImages) {
      if (state.gameStarted) return; // Prevent double start
      state.gameStarted = true;
      startGame();
    }
  };

  // Fail-safe: 5 seconds timeout to start game even if resources are stuck
  const loadTimeout = setTimeout(() => {
    if (!state.gameStarted) {
      console.warn("Resource loading timed out, starting game anyway...");
      state.gameStarted = true;
      startGame();
    }
  }, 5000);

  imagesToLoad.forEach(asset => {
    const img = new Image();
    img.src = asset.src;
    img.onload = () => {
      asset.img = img;
      state.imagesLoaded++;
      onImageProcessed();
    };
    img.onerror = () => {
      console.error(`Failed to load image: ${asset.src}`);
      onImageProcessed();
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
    // Handle music state updates from parent
    if (e.data && e.data.action === 'musicStateUpdate') {
      state.musicEnabled = e.data.enabled;
    }
    // Request music state on initialization
    if (e.data && e.data.action === 'getMusicState') {
      // This will be handled by parent page
    }
    // Handle unlock speech request from parent
    if (e.data && e.data.action === 'unlockSpeech') {
      unlockSpeech();
    }
    // Handle ad support info from parent
    if (e.data && e.data.action === 'adSupportUpdate') {
      state.adSupport = !!e.data.supported;
    }
  });

  // Request initial music state from parent
  window.parent.postMessage({
    action: "getMusicState"
  }, "*");
  window.parent.postMessage({
    action: "getAdSupport"
  }, "*");
}

async function startGame() {
  // Load saved game settings from localStorage
  loadSavedGameSettings();

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
  if (nextWordTimer) {
    clearTimeout(nextWordTimer);
    nextWordTimer = null;
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

  // Reset countdown effects
  stopCountdownSound();
  state.timeShakeStart = null;

  state.startTime = state.tutorialActive ? null : Date.now();
  state.lastFrameTime = Date.now();
  state.isTransitioning = false; // Ensure not transitioning at start

  pickNewWordAndSpawn(); // Initial word and fish spawn
  if (state.tutorialActive) {
    ensureTutorialOverlay();
    tutorialOverlay.show();
    tutorialOverlay.update(getTutorialLayout());
  }
  requestAnimationFrame(gameLoop);
}

function nextWord() {
  // If we are already transitioning, don't start another one?
  // But this is called from checkFish when word is complete.
  if (nextWordTimer) {
    clearTimeout(nextWordTimer);
    nextWordTimer = null;
  }

  // Start transition
  state.isTransitioning = true;
  state.transitionStartTime = Date.now();

  // We will fade out existing fish in update()
  // After fade out, we pick new word and spawn new fish
}

function pickNewWordAndSpawn() {
  // Stop countdown sound when starting a new word
  stopCountdownSound();

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

  // 如果还是找不到有对应学习语言字段的单词，尝试更严格的筛选
  if (!text) {
    const validWords = vocabList.filter(w => {
      const langText = getWordText(w, state.selectedLearningLang);
      return langText && langText.length > 0 && langText.length <= 12;
    });
    if (validWords.length > 0) {
      word = validWords[Math.floor(Math.random() * validWords.length)];
      text = getWordText(word, state.selectedLearningLang);
    }
  }

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
  const charSet = CHAR_SETS[state.selectedLearningLang] || "";
  state.targetChars.forEach((char, index) => {
    if (!state.revealedIndices[index]) {
      // 确保只添加学习语言的字符（过滤掉空格、标点等特殊字符）
      // 对于大小写敏感的语言（如英语），检查小写和大写
      let isValidChar = false;
      if (state.selectedLearningLang === "English" || state.selectedLearningLang === "Español" || state.selectedLearningLang === "Français") {
        isValidChar = charSet.includes(char.toLowerCase()) || charSet.includes(char.toUpperCase());
      } else {
        // 对于其他语言，直接检查
        isValidChar = charSet.includes(char);
      }

      if (isValidChar) {
        neededChars.push(char);
      }
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
  if (state.tutorialActive) return;
  if (state.isEnding) return;

  // Update music wave animation
  if (state.musicEnabled) {
    state.musicWaveAnim.time += dt * 0.001; // Convert ms to seconds
    if (state.musicWaveAnim.time >= 1.8) {
      state.musicWaveAnim.time = 0; // Reset animation loop
    }
  }

  // Timer
  const elapsed = (Date.now() - state.startTime) / 1000;
  state.timeLeft = Math.max(0, GAME_DURATION - elapsed);

  // Check if countdown reaches 10 seconds (trigger only once)
  if (state.timeLeft <= 10 && state.timeLeft > 9 && state.timeShakeStart === null) {
    state.timeShakeStart = Date.now();
    startCountdownSound();
  }

  // Clear shake effect after 1 second
  if (state.timeShakeStart !== null) {
    const shakeElapsed = Date.now() - state.timeShakeStart;
    if (shakeElapsed >= 1000) {
      state.timeShakeStart = null;
    }
  }

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
  stopCountdownSound();
  showToast(reason);

  setTimeout(() => {
    state.gameOver = true;

    // Save game settings to localStorage for next game
    try {
      localStorage.setItem('fishwordlingo_last_learningLang', state.selectedLearningLang);
      localStorage.setItem('fishwordlingo_last_baseLang', state.selectedBaseLang);
      localStorage.setItem('fishwordlingo_last_level', state.selectedLevel);
    } catch (e) {
      console.warn('[game] Failed to save settings to localStorage', e);
    }

    // Send message to parent
    window.parent.postMessage({
      action: "levelComplete",
      score: state.score,
      foundWords: state.foundWords,
      learningLang: state.selectedLearningLang,
      baseLang: state.selectedBaseLang,
      level: state.selectedLevel
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

      // Draw Fish - 使用图片的实际宽高比，避免身体显示不完整
      const img = asset.img;
      const imgAspect = img.naturalWidth / img.naturalHeight; // 图片原始宽高比
      const targetAspect = fish.width / fish.height; // 目标宽高比

      let drawWidth = fish.width;
      let drawHeight = fish.height;

      // 如果图片宽高比与目标不同，保持图片比例，以较大的尺寸为准
      if (imgAspect > targetAspect) {
        // 图片更宽，以宽度为准
        drawHeight = fish.width / imgAspect;
      } else {
        // 图片更高，以高度为准
        drawWidth = fish.height * imgAspect;
      }

      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

      // Draw Bubble and Char
      // Unflip for text/bubble
      if (fish.speed > 0) {
        ctx.scale(-1, 1);
      }

      const bubbleY = -drawHeight / 2 - 10; // 使用实际绘制高度
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
    console.log('正在绘制Toast:', state.toastMessage, '位置比例:', state.toastPosition); // 调试信息
    const logicalWidth = canvas.width / dpr;
    const logicalHeight = canvas.height / dpr;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';

    // Calculate size based on lines
    const lineHeight = 30;
    const paddingV = 0;
    const paddingH = 40;
    const boxHeight = toastLines.length * lineHeight + paddingV;
    const boxWidth = 300; // Fixed width for simplicity or measure

    // Use fillRect for compatibility if roundRect is not supported, or check support
    const boxX = logicalWidth / 2 - boxWidth / 2;
    const boxY = logicalHeight * state.toastPosition - boxHeight / 2;

    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
      ctx.fill();
    } else {
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw each line
    toastLines.forEach((line, index) => {
      const lineY = boxY + paddingV / 2 + lineHeight / 2 + index * lineHeight;
      ctx.fillText(line, logicalWidth / 2, lineY);
    });

    ctx.restore();
  }

  if (state.tutorialActive && tutorialOverlay) {
    tutorialOverlay.update(getTutorialLayout());
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

  // Timer now at former score slot (left side)
  ctx.textAlign = 'left';
  let timeX = 20;
  let timeY = 76 + uiOffsetY; // shifted further down by 6px

  if (state.timeShakeStart !== null) {
    const shakeElapsed = Date.now() - state.timeShakeStart;
    if (shakeElapsed < 1000) {
      // Calculate shake offset using sine/cosine waves
      const shakeProgress = shakeElapsed / 1000;
      const shakeFrequency = 20; // High frequency for rapid shaking
      const shakeAmount = 5; // ±5 pixels

      const offsetX = Math.sin(shakeElapsed * shakeFrequency * 0.01) * shakeAmount * (1 - shakeProgress);
      const offsetY = Math.cos(shakeElapsed * shakeFrequency * 0.01) * shakeAmount * (1 - shakeProgress);

      timeX += offsetX;
      timeY += offsetY;
    } else {
      // Shake duration ended, clear it
      state.timeShakeStart = null;
    }
  }

  ctx.fillText(`Time: ${Math.ceil(state.timeLeft)}s`, timeX, timeY);

  // Score shifted down by one slot below time
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#666';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(`Score: ${Math.round(state.displayScore)}`, 20, 106 + uiOffsetY); // keep 30px gap below time

  // Lives below score, preserving previous gap (30px)
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
  ctx.fillText(`Lives: ${Math.round(state.displayLives)}`, 20, 136 + uiOffsetY); // keep 30px gap below score

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
  const englishOffset = 30; // 增大上下行间距到 30px
  const englishY = vocabY + englishOffset;

  ctx.font = `bold ${kanaFontSize}px Arial`;
  const kanaWidth = ctx.measureText(joinedText).width;
  const kanaHeight = kanaFontSize;
  ctx.font = `${englishFontSize}px Arial`;

  // Translation: selectedBaseLang
  let translation = getWordText(state.currentWord, state.selectedBaseLang, false);

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

  // Icons (Music, Settings, Note, Hint) on the right
  const iconSize = 40;
  const musicIconSize = 50; // Music button has different size
  const iconGap = 30; // Gap between icon bottom and next icon top (including text)
  const iconX = logicalWidth - iconSize - 20; // Move icons to the right side
  let iconY = 110 + uiOffsetY;

  // Music button (first, at the top)
  const musicImg = state.musicEnabled ? ASSETS.musicOn.img : ASSETS.musicOff.img;
  if (musicImg) {
    // Align music button right edge with other buttons (music button is larger), then shift right by 5px
    const musicX = iconX - (musicIconSize - iconSize) + 5;
    const rect = { x: musicX, y: iconY, width: musicIconSize, height: musicIconSize };
    state.musicButtonRect = rect;
    ctx.drawImage(musicImg, rect.x, rect.y, rect.width, rect.height);

    // Draw sound waves animation when music is enabled
    if (state.musicEnabled) {
      const centerX = rect.x + rect.width / 2;
      const centerY = rect.y + rect.height / 2;
      const waveTime = state.musicWaveAnim.time;

      // Draw 3 sound waves with different delays
      const waves = [
        { delay: 0, radius: 15 },
        { delay: 0.2, radius: 18 },
        { delay: 0.4, radius: 21 }
      ];

      waves.forEach(wave => {
        const animTime = (waveTime + wave.delay) % 1.8;
        const opacity = 0.6 + Math.sin(animTime * Math.PI * 2 / 1.8) * 0.3;
        const scale = 0.8 + animTime * 0.2;

        ctx.save();
        ctx.strokeStyle = `rgba(242, 251, 255, ${opacity})`;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        // Draw arc (sound wave)
        ctx.beginPath();
        ctx.arc(centerX, centerY, wave.radius * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Music', rect.x + rect.width / 2, rect.y + rect.height + 4);
  }

  iconY += musicIconSize + iconGap;

  // Settings (Lang)
  if (ASSETS.settings.img) {
    const rect = { x: iconX, y: iconY, width: iconSize, height: iconSize };
    state.langButtonRect = rect;
    ctx.drawImage(ASSETS.settings.img, rect.x, rect.y, rect.width, rect.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Language', rect.x + rect.width / 2, rect.y + rect.height + 4);
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
      let translation = getWordText(w, state.selectedBaseLang, false);

      // Calculate available space
      const padding = 16;
      const speakerSize = 24;
      const speakerGap = 12;
      const translationGap = 12;
      const minTranslationWidth = 60; // Minimum space for translation

      // Available width for content
      const availableWidth = itemW - padding * 2;

      // Set font for learning text
      ctx.fillStyle = '#2c3e50';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';

      // Measure translation text first to calculate space needed
      ctx.font = '16px Arial';
      const translationText = `- ${translation}`;
      const translationWidth = ctx.measureText(translationText).width;

      // Calculate space needed for speaker and translation
      const fixedElementsWidth = speakerSize + speakerGap + translationWidth + translationGap;

      // Available width for learning text
      const maxLearningWidth = Math.max(availableWidth - fixedElementsWidth, availableWidth * 0.4);

      // Check if learning text fits, if not, truncate it
      ctx.font = 'bold 20px Arial';
      let displayLearningText = learningText;
      let learningWidth = ctx.measureText(displayLearningText).width;

      if (learningWidth > maxLearningWidth) {
        // Truncate text with ellipsis
        const ellipsis = '...';
        const ellipsisWidth = ctx.measureText(ellipsis).width;
        let truncatedWidth = maxLearningWidth - ellipsisWidth;

        // Binary search for the right truncation point
        let low = 0;
        let high = learningText.length;
        while (low < high) {
          const mid = Math.floor((low + high) / 2);
          const testText = learningText.substring(0, mid) + ellipsis;
          const testWidth = ctx.measureText(testText).width;
          if (testWidth <= maxLearningWidth) {
            low = mid + 1;
          } else {
            high = mid;
          }
        }
        displayLearningText = learningText.substring(0, Math.max(0, low - 1)) + ellipsis;
        learningWidth = ctx.measureText(displayLearningText).width;
      }

      // Draw learning text
      ctx.fillText(displayLearningText, itemX + padding, itemY + itemHeight / 2);

      // Speaker Icon
      const speakerX = itemX + padding + learningWidth + speakerGap;
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

      const startTransX = speakerX + speakerSize + translationGap;

      // Check if translation fits, if not, truncate it
      ctx.font = '16px Arial';
      let displayTranslation = translationText;
      let finalTranslationWidth = ctx.measureText(displayTranslation).width;
      const maxTranslationX = itemX + itemW - padding;
      const maxTranslationWidth = maxTranslationX - startTransX;

      if (finalTranslationWidth > maxTranslationWidth && maxTranslationWidth > 0) {
        // Truncate translation with ellipsis
        const ellipsis = '...';
        const ellipsisWidth = ctx.measureText(ellipsis).width;
        let truncatedWidth = maxTranslationWidth - ellipsisWidth;

        // Binary search for the right truncation point
        let low = 0;
        let high = translation.length;
        while (low < high) {
          const mid = Math.floor((low + high) / 2);
          const testText = `- ${translation.substring(0, mid)}${ellipsis}`;
          const testWidth = ctx.measureText(testText).width;
          if (testWidth <= maxTranslationWidth) {
            low = mid + 1;
          } else {
            high = mid;
          }
        }
        displayTranslation = `- ${translation.substring(0, Math.max(0, low - 1))}${ellipsis}`;
      }

      ctx.fillStyle = '#2c3e50'; // Dark blue-gray like image
      ctx.fillText(displayTranslation, startTransX, itemY + itemHeight / 2);
    });
  }
  ctx.restore(); // End list clip
}

// Helper function to draw enhanced button with gradient, highlight, and shadow
function drawEnhancedButton(ctx, x, y, width, height, radius, selected, text) {
  ctx.save();

  if (selected) {
    // Selected button: gradient from medium blue to lighter blue
    const grad = ctx.createLinearGradient(x, y, x, y + height);
    grad.addColorStop(0, '#5FB3D3');
    grad.addColorStop(0.5, '#4A9BCA');
    grad.addColorStop(1, '#3A9BC8');
    ctx.fillStyle = grad;

    // Shadow for depth (lighter)
    ctx.shadowColor = 'rgba(58, 155, 200, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    // Draw button
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, width, height);
    }

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Top highlight
    const highlightGrad = ctx.createLinearGradient(x, y, x, y + height * 0.3);
    highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGrad;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height * 0.3, radius);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, width, height * 0.3);
    }

    // Border
    ctx.strokeStyle = '#3A9BC8';
    ctx.lineWidth = 1;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.stroke();
    } else {
      ctx.strokeRect(x, y, width, height);
    }

    // Text
    ctx.fillStyle = '#FFFFFF';
  } else {
    // Unselected button: subtle gradient from light sky blue to white
    const grad = ctx.createLinearGradient(x, y, x, y + height);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(1, '#E8F4FF');
    ctx.fillStyle = grad;

    // Draw button
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, width, height);
    }

    // Border
    ctx.strokeStyle = '#87CEEB';
    ctx.lineWidth = 1.5;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.stroke();
    } else {
      ctx.strokeRect(x, y, width, height);
    }

    // Text
    ctx.fillStyle = '#1E3A5F';
  }

  ctx.restore();
}

// Helper function to draw bubble with highlight
function drawBubble(ctx, x, y, size) {
  ctx.save();

  // Main bubble
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Highlight (top-left)
  const highlightSize = size * 0.4;
  const highlightX = x - size * 0.3;
  const highlightY = y - size * 0.3;
  ctx.beginPath();
  ctx.arc(highlightX, highlightY, highlightSize, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fill();

  ctx.restore();
}

// Helper function to draw wave decoration
function drawWaveDecoration(ctx, x, y, width, amplitude, frequency) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  ctx.beginPath();
  for (let i = 0; i <= width; i += 2) {
    const waveY = y + amplitude * Math.sin((i / width) * Math.PI * frequency);
    if (i === 0) {
      ctx.moveTo(x + i, waveY);
    } else {
      ctx.lineTo(x + i, waveY);
    }
  }
  ctx.stroke();

  ctx.restore();
}

// Helper function to draw small starfish decoration
function drawStarfish(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2); // Rotate so top arm points up

  ctx.fillStyle = 'rgba(255, 200, 150, 0.6)';
  ctx.strokeStyle = 'rgba(255, 180, 120, 0.8)';
  ctx.lineWidth = 1;

  const arms = 5;
  const outerRadius = size;
  const innerRadius = size * 0.4;

  ctx.beginPath();
  for (let i = 0; i < arms * 2; i++) {
    const angle = (i * Math.PI) / arms;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

// Helper function to draw small shell decoration
function drawShell(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);

  // Shell body (semi-circle)
  ctx.fillStyle = 'rgba(255, 220, 180, 0.7)';
  ctx.strokeStyle = 'rgba(255, 200, 150, 0.9)';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI, false);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Shell lines
  ctx.strokeStyle = 'rgba(255, 180, 120, 0.6)';
  ctx.lineWidth = 0.5;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, size * (i / 4), 0, Math.PI, false);
    ctx.stroke();
  }

  ctx.restore();
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
  ctx.fillStyle = 'rgba(30, 95, 143, 0.3)';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  const chipHeight = 36;
  const chipGapY = 10;
  const chipGapX = 10;

  // Dynamic language options calculation
  const learningOptions = LANGUAGE_OPTIONS; // All languages can be selected as learning language
  const baseOptions = LANGUAGE_OPTIONS; // Show all 6 languages

  const learningRows = Math.ceil(learningOptions.length / 2);
  const learningSectionHeight = learningRows * (chipHeight + chipGapY) + 30;
  const baseRows = Math.ceil(baseOptions.length / 2);
  const baseSectionHeight = baseRows * (chipHeight + chipGapY) + 30;
  const levelRows = Math.ceil(LEVEL_OPTIONS.length / 3);
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

  // Background (Body) - with gradient
  const bgGrad = ctx.createLinearGradient(x, y, x, y + panelHeight);
  bgGrad.addColorStop(0, '#F0F8FF');
  bgGrad.addColorStop(0.5, '#E8F4FF');
  bgGrad.addColorStop(1, '#E0F0FF');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(x, y, panelWidth, panelHeight);

  // Enhanced decorative bubbles (ocean theme) - more bubbles with highlights
  const bubblePositions = [
    { x: x + 20, y: y + panelHeight - 40, size: 12 },
    { x: x + panelWidth - 35, y: y + panelHeight - 25, size: 8 },
    { x: x + panelWidth - 50, y: y + 70, size: 10 },
    { x: x + 30, y: y + 100, size: 6 },
    { x: x + panelWidth - 60, y: y + 120, size: 9 },
    { x: x + 15, y: y + 180, size: 7 },
    { x: x + panelWidth - 25, y: y + 200, size: 11 },
    { x: x + 45, y: y + 250, size: 8 },
    { x: x + panelWidth - 70, y: y + 280, size: 6 },
    { x: x + 25, y: y + 320, size: 9 }
  ];

  bubblePositions.forEach(bubble => {
    drawBubble(ctx, bubble.x, bubble.y, bubble.size);
  });

  // Ocean decorative elements (starfish and shells)
  drawStarfish(ctx, x + panelWidth - 20, y + panelHeight - 30, 8);
  drawShell(ctx, x + 12, y + panelHeight - 20, 6);
  drawStarfish(ctx, x + panelWidth - 65, y + 60, 6);
  drawShell(ctx, x + 35, y + 140, 5);

  const headerHeight = 50;
  // Header Background - with rich gradient
  const headerGrad = ctx.createLinearGradient(x, y, x, y + headerHeight);
  headerGrad.addColorStop(0, '#87CEEB');
  headerGrad.addColorStop(0.5, '#5FB3D3');
  headerGrad.addColorStop(1, '#3A9BC8');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(x, y, panelWidth, headerHeight);

  // Wave decoration at bottom of header
  drawWaveDecoration(ctx, x + 10, y + headerHeight - 8, panelWidth - 20, 3, 3);

  // Divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + headerHeight);
  ctx.lineTo(x + panelWidth, y + headerHeight);
  ctx.stroke();

  // Header Title
  ctx.fillStyle = '#FFFFFF';
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
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fill();

  // Close X
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const pad = 8;
  ctx.moveTo(closeX + pad, closeY + pad);
  ctx.lineTo(closeX + closeSize - pad, closeY + closeSize - pad);
  ctx.moveTo(closeX + closeSize - pad, closeY + pad);
  ctx.lineTo(closeX + pad, closeY + closeSize - pad);
  ctx.stroke();

  // Note: clip restore moved to end of function after all content is drawn

  // Border (Stroke) for the whole panel (draw inside clip for rounded corners)
  ctx.strokeStyle = 'rgba(30, 95, 143, 0.15)';
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
  // Calculate chipWidth for level buttons (3 columns) and language buttons (2 columns)
  const levelChipWidth = (panelWidth - 32 - 16 - chipGapX * 2) / 3; // 3 columns for level buttons
  const chipWidth = (panelWidth - 32 - 16 - chipGapX) / 2; // 2 columns for language buttons
  let cursorY = contentStartY;

  // Level Section
  const levelSectionY = cursorY;
  ctx.fillStyle = '#D6EBF5';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x + 16, levelSectionY, panelWidth - 32, levelSectionHeight, 12);
    ctx.fill();
  } else {
    ctx.fillRect(x + 16, levelSectionY, panelWidth - 32, levelSectionHeight);
  }

  ctx.fillStyle = '#1E3A5F';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const levelLabel = 'Difficulty Level';
  ctx.fillText(levelLabel, x + 28, levelSectionY + 12);
  ctx.font = '12px Arial';
  ctx.fillStyle = '#1E5F8F';
  const levelLabelWidth = ctx.measureText(levelLabel).width;
  ctx.fillText(`Current: ${state.activeLevel}`, x + 28 + levelLabelWidth + 40, levelSectionY + 14);

  state.levelRects = [];
  const levelGridStartY = levelSectionY + 40;
  LEVEL_OPTIONS.forEach((level, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const chipX = x + 28 + col * (levelChipWidth + chipGapX);
    const chipY = levelGridStartY + row * (chipHeight + chipGapY);
    const rect = { x: chipX, y: chipY, width: levelChipWidth, height: chipHeight, level, type: 'level' };
    state.levelRects.push(rect);

    const selected = state.selectedLevel === level;

    // Draw enhanced button
    drawEnhancedButton(ctx, chipX, chipY, levelChipWidth, chipHeight, 8, selected, level);

    // Draw text
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(level, chipX + levelChipWidth / 2, chipY + chipHeight / 2);
  });

  cursorY += levelSectionHeight + 16;

  // Learning Language Section
  ctx.fillStyle = '#D6EBF5';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x + 16, cursorY, panelWidth - 32, learningSectionHeight, 12);
    ctx.fill();
  } else {
    ctx.fillRect(x + 16, cursorY, panelWidth - 32, learningSectionHeight);
  }

  ctx.fillStyle = '#1E3A5F';
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

    // Draw enhanced button
    drawEnhancedButton(ctx, chipX, chipY, chipWidth, chipHeight, 8, selected, lang);

    // Draw text
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lang, chipX + chipWidth / 2, chipY + chipHeight / 2);
  });

  cursorY += learningSectionHeight + 16;

  // Base Language (Using)
  ctx.fillStyle = '#D6EBF5';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x + 16, cursorY, panelWidth - 32, baseSectionHeight, 12);
    ctx.fill();
  } else {
    ctx.fillRect(x + 16, cursorY, panelWidth - 32, baseSectionHeight);
  }

  ctx.fillStyle = '#1E3A5F';
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

    // Draw enhanced button
    drawEnhancedButton(ctx, chipX, chipY, chipWidth, chipHeight, 8, selected, lang);

    // Draw text
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

  // Enhanced Apply button with gradient, highlight, and shadow
  ctx.save();

  // Shadow (lighter)
  ctx.shadowColor = 'rgba(58, 155, 200, 0.4)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;

  // Gradient background (lighter)
  const applyGrad = ctx.createLinearGradient(confirmRect.x, confirmRect.y, confirmRect.x, confirmRect.y + confirmRect.height);
  applyGrad.addColorStop(0, '#5FB3D3');
  applyGrad.addColorStop(0.5, '#4A9BCA');
  applyGrad.addColorStop(1, '#3A9BC8');
  ctx.fillStyle = applyGrad;

  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(confirmRect.x, confirmRect.y, confirmRect.width, confirmRect.height, 22);
    ctx.fill();
  } else {
    ctx.fillRect(confirmRect.x, confirmRect.y, confirmRect.width, confirmRect.height);
  }

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Top highlight
  const highlightGrad = ctx.createLinearGradient(confirmRect.x, confirmRect.y, confirmRect.x, confirmRect.y + confirmRect.height * 0.4);
  highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = highlightGrad;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(confirmRect.x, confirmRect.y, confirmRect.width, confirmRect.height * 0.4, 22);
    ctx.fill();
  } else {
    ctx.fillRect(confirmRect.x, confirmRect.y, confirmRect.width, confirmRect.height * 0.4);
  }

  // Border with highlight
  ctx.strokeStyle = '#3A9BC8';
  ctx.lineWidth = 1.5;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(confirmRect.x, confirmRect.y, confirmRect.width, confirmRect.height, 22);
    ctx.stroke();
  } else {
    ctx.strokeRect(confirmRect.x, confirmRect.y, confirmRect.width, confirmRect.height);
  }

  // Text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Apply', confirmRect.x + confirmRect.width / 2, confirmRect.y + confirmRect.height / 2);

  ctx.restore();

  if (state.isLoadingVocab) {
    ctx.fillStyle = '#1E3A5F';
    ctx.font = '12px Arial';
    ctx.fillText('Loading vocab...', confirmRect.x + confirmRect.width / 2, confirmRect.y + confirmRect.height + 18);
  }

  ctx.restore(); // End clip

  ctx.restore(); // End outer save
}

function completeCurrentWord() {
  state.score += 100;
  state.foundWords.push(state.currentWord);

  // 确保语音事件失效时也能进入下一个单词
  if (nextWordTimer) {
    clearTimeout(nextWordTimer);
    nextWordTimer = null;
  }
  const triggerNextWord = () => {
    if (nextWordTimer) {
      clearTimeout(nextWordTimer);
      nextWordTimer = null;
    }
    if (!state.isTransitioning && !state.gameOver) {
      nextWord();
    }
  };
  nextWordTimer = setTimeout(triggerNextWord, 2500); // 兜底超时

  // 播放单词发音（使用学习语言）
  // 使用统一的 speak() 函数，确保在用户交互上下文中调用
  const wordText = getWordText(state.currentWord, state.selectedLearningLang);

  if (wordText) {
    // 使用 speak() 函数，它会在用户交互上下文中调用并处理所有错误
    // 为了等待发音完成后再进入下一个单词，我们需要监听发音完成事件
    // 但由于 speak() 函数内部已经处理了 utterance，我们需要创建一个自定义的 utterance
    if ('speechSynthesis' in window) {
      // 确保音频上下文已解锁
      unlockSpeech();

      // 取消之前的发音
      window.speechSynthesis.cancel();

      // 关键修复：Android Chrome 在 cancel() 后需要延迟才能正常 speak()
      setTimeout(() => {
        // 创建 utterance 并设置回调
        const utterance = new SpeechSynthesisUtterance(wordText);
        const mapItem = LANG_MAP[state.selectedLearningLang] || LANG_MAP["日本語"];
        utterance.lang = mapItem.locale;
        utterance.rate = 1.0;

        // 选择匹配的语音
        if (voices.length === 0) loadVoices();
        const voice = voices.find(v => v.lang === utterance.lang || v.lang.startsWith(utterance.lang.split('-')[0]));
        if (voice) {
          utterance.voice = voice;
        }

        // 等待发音完成后再进入下一个单词
        utterance.onend = triggerNextWord;

        utterance.onerror = (e) => {
          // 如果发音出错，立即进入下一个单词（避免卡住）
          console.error('[speech] error in completeCurrentWord:', e.error, wordText);
          triggerNextWord();
        };

        // 调用 speak
        try {
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.warn('[speech] speak failed in completeCurrentWord', e);
          // 如果失败，立即进入下一个单词
          triggerNextWord();
        }
      }, 100); // 100ms 延迟让 Android Chrome 有时间恢复
    } else {
      // 如果没有语音功能，立即进入下一个单词
      triggerNextWord();
    }
  } else {
    // 如果没有文本，立即进入下一个单词
    triggerNextWord();
  }
}

// Consolidated input handlers
function handleInputStart(e) {
  if (state.tutorialActive) return;

  // 在用户首次触摸屏幕时解锁音频上下文
  unlockSpeech();

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
  if (state.tutorialActive) return;
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
  if (state.tutorialActive) return;
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
  if (state.tutorialActive) return;
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
          const previousLearningLang = state.selectedLearningLang; // Save previous value
          state.selectedLearningLang = opt.lang;
          // If base language is the same as new learning language, revert and show toast
          if (state.selectedBaseLang === opt.lang) {
            state.selectedLearningLang = previousLearningLang; // Revert to previous value
            showToast("Please Choose Different Language");
          }
          handledLang = true;
          break;
        }
      }
    }

    if (!handledLang) {
      for (const opt of state.languageBaseRects) {
        if (isPointInRect(clickX, clickY, opt)) {
          const previousBaseLang = state.selectedBaseLang; // Save previous value
          state.selectedBaseLang = opt.lang;
          // If learning language is the same as new base language, revert and show toast
          if (state.selectedLearningLang === opt.lang) {
            state.selectedBaseLang = previousBaseLang; // Revert to previous value
            showToast("Please Choose Different Language");
          }
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

  // Music button
  if (state.musicButtonRect && isPointInRect(clickX, clickY, state.musicButtonRect)) {
    // Send message to parent page to toggle music
    window.parent.postMessage({
      action: "toggleBgm"
    }, "*");
    return;
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
    // Ensure base language is valid (but allow same as learning - will be validated on click)
    if (!LANGUAGE_OPTIONS.includes(state.selectedBaseLang)) {
      const availableBaseLang = LANGUAGE_OPTIONS.find(l => l !== state.selectedLearningLang);
      if (availableBaseLang) {
        state.selectedBaseLang = availableBaseLang;
      } else {
        state.selectedBaseLang = "中文"; // Fallback
      }
    }
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

  const pickIndex = missingIndices[0]; // 选择第一个（最左边的）缺失位置
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
  // 必须在用户交互事件中调用才有效
  try {
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    utterance.rate = 10; // 快速播放，几乎瞬间完成
    utterance.pitch = 0;
    utterance.onend = () => {
      // 解锁完成
    };
    utterance.onerror = () => {
      // 忽略错误，解锁可能失败但不影响后续使用
    };
    window.speechSynthesis.speak(utterance);
    speechUnlocked = true;
  } catch (e) {
    console.warn('[speech] unlock failed', e);
    // 即使失败也标记为已尝试，避免重复尝试
    speechUnlocked = true;
  }
}

// Helper: Speak
function speak(text, langName = "English") {
  if (!('speechSynthesis' in window)) return;

  // 确保音频上下文已解锁（每次调用时都尝试，以防之前解锁失败）
  unlockSpeech();

  // Resume if paused (fix for some Android/Chrome versions)
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  window.speechSynthesis.cancel();

  // 关键修复：Android Chrome 在 cancel() 后需要延迟才能正常 speak()
  // 这是一个已知的 Android WebView/Chrome bug
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text);

    const mapItem = LANG_MAP[langName] || LANG_MAP["English"];
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
    utterance.onerror = (e) => {
      console.error('[speech] error:', e.error, text);
      currentUtterance = null;
    };

    window.speechSynthesis.speak(utterance);
  }, 100); // 100ms 延迟让 Android Chrome 有时间恢复
}

// Countdown Sound Effects
let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported', e);
      return null;
    }
  }
  // Resume audio context if suspended (required for some browsers)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

function playTickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Create a short tick sound using oscillator
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Configure tick sound: 440Hz, 100ms duration
  oscillator.frequency.value = 440;
  oscillator.type = 'sine';

  // Envelope: quick attack, quick decay
  const now = ctx.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Attack
  gainNode.gain.linearRampToValueAtTime(0, now + 0.1); // Decay (100ms total)

  oscillator.start(now);
  oscillator.stop(now + 0.1);
}

function startCountdownSound() {
  if (state.countdownSoundPlaying) return;

  state.countdownSoundPlaying = true;

  // Play first tick immediately
  playTickSound();

  // Then play every second
  state.countdownSoundInterval = setInterval(() => {
    if (!state.countdownSoundPlaying) {
      stopCountdownSound();
      return;
    }
    playTickSound();
  }, 1000);
}

function stopCountdownSound() {
  state.countdownSoundPlaying = false;
  if (state.countdownSoundInterval) {
    clearInterval(state.countdownSoundInterval);
    state.countdownSoundInterval = null;
  }
}

// Start
init();
