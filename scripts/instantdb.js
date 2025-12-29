// InstantDB Service for storing game sessions and words
// Public App ID: abcc3c07-0f23-4731-bdf3-a9dc93eb7739

(function() {
  'use strict';

  class InstantDBService {
    constructor() {
      this.db = null;
      this.userId = null;
      this.initialized = false;
      this.storageKey = 'fishwordlingo_games';
      this.userIdKey = 'fishwordlingo_user_id';
      this.highlightKey = 'fishwordlingo_highlights';
    }

    // Initialize the service
    async init() {
      if (this.initialized) return;
      
      try {
        // Try to load InstantDB from CDN
        if (typeof window !== 'undefined' && window.fetch) {
          // Try dynamic import of InstantDB
          try {
            const { init } = await import('https://esm.sh/@instantdb/react@latest');
            
            // Initialize InstantDB
            const { db, id } = init({
              appId: 'abcc3c07-0f23-4731-bdf3-a9dc93eb7739',
              userId: this.getOrCreateUserId()
            });

            this.db = db;
            this.userId = id;
            this.initialized = true;
            
            console.log('[InstantDB] Initialized with userId:', this.userId);
          } catch (importError) {
            console.warn('[InstantDB] Failed to import InstantDB, using localStorage fallback:', importError);
            this.useLocalStorageFallback();
          }
        } else {
          this.useLocalStorageFallback();
        }
      } catch (error) {
        console.error('[InstantDB] Initialization failed, using localStorage:', error);
        this.useLocalStorageFallback();
      }
    }

    useLocalStorageFallback() {
      console.log('[InstantDB] Using localStorage fallback');
      this.initialized = true;
      this.userId = this.getOrCreateUserId();
    }

    // Get or create user ID
    getOrCreateUserId() {
      if (this.userId) {
        return this.userId;
      }

      try {
        let userId = localStorage.getItem(this.userIdKey);
        if (!userId) {
          userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem(this.userIdKey, userId);
        }
        this.userId = userId;
        return userId;
      } catch (error) {
        console.error('[InstantDB] Failed to get/create userId:', error);
        // Fallback to a default userId
        return 'user_default';
      }
    }

    // Get word ID from word object
    getWordId(word) {
      // Use furigana and english combination as unique ID
      return (word.furigana || '') + '|' + (word.english || '');
    }

    // Save game session and words
    async saveGameSession(sessionData, words) {
      if (!this.initialized) {
        await this.init();
      }

      if (!Array.isArray(words) || words.length === 0) {
        return Promise.resolve();
      }

      try {
        const userId = this.getOrCreateUserId();
        const timestamp = Date.now();
        const createdAt = new Date().toISOString();

        // Prepare session data
        const session = {
          userId: userId,
          timestamp: timestamp,
          score: sessionData.score || 0,
          level: sessionData.level || null,
          completionTimeMs: sessionData.completionTimeMs || null,
          words: words.map(function(word) {
            // Generate word ID and ensure all required fields
            const wordId = this.getWordId(word);
            return {
              ...word,
              id: wordId,
              createdAt: createdAt,
              gameTimestamp: timestamp,
              learningLang: word.learningLang || null,
              baseLang: word.baseLang || null
            };
          }.bind(this))
        };

        if (this.db) {
          // Use InstantDB if available
          try {
            await this.db.transact(async function(tx) {
              await tx.tables.gameSessions.insert({
                userId: userId,
                timestamp: timestamp,
                score: sessionData.score || 0,
                level: sessionData.level || null,
                completionTimeMs: sessionData.completionTimeMs || null,
                words: JSON.stringify(session.words)
              });
            });
            console.log('[InstantDB] Saved game session to InstantDB');
          } catch (dbError) {
            console.warn('[InstantDB] Failed to save to InstantDB, using localStorage:', dbError);
            this.saveToLocalStorage(session);
          }
        } else {
          // Use localStorage as fallback
          this.saveToLocalStorage(session);
        }

        return Promise.resolve();
      } catch (error) {
        console.error('[InstantDB] Save failed:', error);
        return Promise.reject(error);
      }
    }

    // Save to localStorage
    saveToLocalStorage(session) {
      try {
        let games = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        games.push(session);
        localStorage.setItem(this.storageKey, JSON.stringify(games));
        console.log('[InstantDB] Saved game session to localStorage');
      } catch (error) {
        console.error('[InstantDB] localStorage save failed:', error);
        throw error;
      }
    }

    // Get all user words
    async getAllUserWords(userId) {
      if (!this.initialized) {
        await this.init();
      }

      try {
        const targetUserId = userId || this.getOrCreateUserId();
        let allWords = [];

        if (this.db) {
          // Try to get from InstantDB
          try {
            const { data } = await this.db.query(
              this.db.tables.gameSessions
                .where('userId', '==', targetUserId)
                .orderBy('timestamp', 'desc')
            );
            
            // Flatten all words from sessions
            (data || []).forEach(function(session) {
              try {
                const words = typeof session.words === 'string' 
                  ? JSON.parse(session.words) 
                  : session.words;
                
                if (Array.isArray(words)) {
                  words.forEach(function(word) {
                    const wordId = this.getWordId(word);
                    allWords.push({
                      ...word,
                      id: wordId,
                      createdAt: word.createdAt || new Date(session.timestamp).toISOString(),
                      gameTimestamp: session.timestamp,
                      isHighlighted: this.isWordHighlighted(wordId),
                      learningLang: word.learningLang || null,
                      baseLang: word.baseLang || null
                    });
                  }.bind(this));
                }
              } catch (e) {
                console.warn('[InstantDB] Failed to parse words from session:', e);
              }
            }.bind(this));
          } catch (dbError) {
            console.warn('[InstantDB] Failed to load from InstantDB, using localStorage:', dbError);
            allWords = this.loadFromLocalStorage(targetUserId);
          }
        } else {
          // Use localStorage
          allWords = this.loadFromLocalStorage(targetUserId);
        }

        return Promise.resolve(allWords);
      } catch (error) {
        console.error('[InstantDB] Load failed:', error);
        return Promise.resolve([]); // Return empty array on error
      }
    }

    // Load words from localStorage
    loadFromLocalStorage(userId) {
      try {
        const games = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        const allWords = [];
        
        games.forEach(function(game) {
          // Filter by userId if provided
          if (userId && game.userId !== userId) {
            return;
          }

          if (Array.isArray(game.words)) {
            game.words.forEach(function(word) {
              const wordId = this.getWordId(word);
              allWords.push({
                ...word,
                id: wordId,
                createdAt: word.createdAt || new Date(game.timestamp).toISOString(),
                gameTimestamp: game.timestamp,
                isHighlighted: this.isWordHighlighted(wordId),
                learningLang: word.learningLang || null,
                baseLang: word.baseLang || null
              });
            }.bind(this));
          }
        }.bind(this));
        
        return allWords;
      } catch (error) {
        console.error('[InstantDB] localStorage load failed:', error);
        return [];
      }
    }

    // Check if word is highlighted
    isWordHighlighted(wordId) {
      try {
        const highlights = JSON.parse(localStorage.getItem(this.highlightKey) || '{}');
        return highlights[wordId] || false;
      } catch (error) {
        console.error('[InstantDB] Failed to check highlight:', error);
        return false;
      }
    }

    // Toggle word highlight
    async toggleWordHighlight(wordId, state) {
      try {
        const highlights = JSON.parse(localStorage.getItem(this.highlightKey) || '{}');
        
        if (state) {
          highlights[wordId] = true;
        } else {
          delete highlights[wordId];
        }
        
        localStorage.setItem(this.highlightKey, JSON.stringify(highlights));
        return Promise.resolve(state);
      } catch (error) {
        console.error('[InstantDB] Failed to toggle highlight:', error);
        return Promise.reject(error);
      }
    }
  }

  // Create global instance
  window.instantDBService = new InstantDBService();

  // Auto-initialize on load
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', function() {
      window.instantDBService.init().catch(function(error) {
        console.warn('[InstantDB] Auto-init failed:', error);
      });
    });
  }
})();

