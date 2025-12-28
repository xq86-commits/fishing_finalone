// InstantDB 单词存储服务
// Public App ID: abcc3c07-0f23-4731-bdf3-a9dc93eb7739

class WordStorageService {
  constructor() {
    this.db = null;
    this.userId = null;
    this.initialized = false;
    this.schema = {
      gameSessions: {
        userId: { type: 'string' },
        timestamp: { type: 'number' },
        words: { type: 'json' }
      }
    };
  }

  async init() {
    if (this.initialized) return;
    
    try {
      // 动态导入 InstantDB
      const { init } = await import('https://esm.sh/@instantdb/react@latest');
      
      // 初始化 InstantDB
      const { db, id } = init({
        appId: 'abcc3c07-0f23-4731-bdf3-a9dc93eb7739',
        userId: this.getOrCreateUserId()
      });

      this.db = db;
      this.userId = id;
      this.initialized = true;
      
      console.log('[WordStorage] Initialized with userId:', this.userId);
    } catch (error) {
      console.error('[WordStorage] Initialization failed, using localStorage:', error);
      // 如果 InstantDB 加载失败，使用 localStorage 作为后备
      this.useLocalStorageFallback();
    }
  }

  getOrCreateUserId() {
    let userId = localStorage.getItem('fishwordlingo_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('fishwordlingo_user_id', userId);
    }
    return userId;
  }

  useLocalStorageFallback() {
    console.warn('[WordStorage] Using localStorage fallback');
    this.initialized = true;
  }

  async saveGameWords(foundWords) {
    if (!this.initialized) {
      await this.init();
    }

    if (!Array.isArray(foundWords) || foundWords.length === 0) {
      return;
    }

    try {
      if (this.db) {
        // 使用 InstantDB - 需要根据实际 API 调整
        // InstantDB 使用 schema 和 transact
        await this.db.transact(async (tx) => {
          await tx.tables.gameSessions.insert({
            userId: this.userId,
            timestamp: Date.now(),
            words: JSON.stringify(foundWords)
          });
        });
      } else {
        // 使用 localStorage 后备
        this.saveToLocalStorage(foundWords);
      }
    } catch (error) {
      console.error('[WordStorage] Save failed, using localStorage:', error);
      // 失败时使用 localStorage
      this.saveToLocalStorage(foundWords);
    }
  }

  saveToLocalStorage(foundWords) {
    try {
      const key = 'fishwordlingo_games';
      let games = JSON.parse(localStorage.getItem(key) || '[]');
      games.push({
        timestamp: Date.now(),
        words: foundWords
      });
      localStorage.setItem(key, JSON.stringify(games));
    } catch (error) {
      console.error('[WordStorage] localStorage save failed:', error);
    }
  }

  async getAllWords() {
    if (!this.initialized) {
      await this.init();
    }

    try {
      if (this.db) {
        // 从 InstantDB 获取
        const { data } = await this.db.query(
          this.db.tables.gameSessions
            .where('userId', '==', this.userId)
            .orderBy('timestamp', 'desc')
        );
        
        // 展平所有单词
        const allWords = [];
        (data || []).forEach(session => {
          try {
            const words = typeof session.words === 'string' 
              ? JSON.parse(session.words) 
              : session.words;
            if (Array.isArray(words)) {
              words.forEach(word => {
                const wordId = this.getWordId(word);
                allWords.push({
                  ...word,
                  gameTimestamp: session.timestamp,
                  wordId: wordId,
                  highlighted: this.isWordHighlighted(wordId)
                });
              });
            }
          } catch (e) {
            console.warn('[WordStorage] Failed to parse words:', e);
          }
        });
        
        return allWords;
      } else {
        // 从 localStorage 获取
        return this.loadFromLocalStorage();
      }
    } catch (error) {
      console.error('[WordStorage] Load failed, using localStorage:', error);
      return this.loadFromLocalStorage();
    }
  }

  loadFromLocalStorage() {
    try {
      const key = 'fishwordlingo_games';
      const games = JSON.parse(localStorage.getItem(key) || '[]');
      const allWords = [];
      
      games.forEach(game => {
        if (Array.isArray(game.words)) {
          game.words.forEach(word => {
            const wordId = this.getWordId(word);
            allWords.push({
              ...word,
              gameTimestamp: game.timestamp,
              wordId: wordId,
              highlighted: this.isWordHighlighted(wordId)
            });
          });
        }
      });
      
      return allWords;
    } catch (error) {
      console.error('[WordStorage] localStorage load failed:', error);
      return [];
    }
  }

  getWordId(word) {
    // 使用 furigana 和 english 组合作为唯一 ID
    return (word.furigana || '') + '|' + (word.english || '');
  }

  toggleWordHighlight(wordId) {
    const highlightKey = 'fishwordlingo_highlights';
    let highlights = JSON.parse(localStorage.getItem(highlightKey) || '{}');
    
    if (highlights[wordId]) {
      delete highlights[wordId];
      localStorage.setItem(highlightKey, JSON.stringify(highlights));
      return false;
    } else {
      highlights[wordId] = true;
      localStorage.setItem(highlightKey, JSON.stringify(highlights));
      return true;
    }
  }

  isWordHighlighted(wordId) {
    const highlightKey = 'fishwordlingo_highlights';
    const highlights = JSON.parse(localStorage.getItem(highlightKey) || '{}');
    return highlights[wordId] || false;
  }
}

// 创建全局实例
window.wordStorageService = new WordStorageService();

