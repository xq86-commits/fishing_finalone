(function setupWordleAdvertisingManager() {
    const TAG = '[WordleAdvertising]';
    const STORAGE_KEY_DATE = 'wordleAdWatchDate';
    const STORAGE_KEY_COUNT = 'wordleAdWatchCount';
    const DAILY_LIMIT = 5;
    const REQUEST_TIMEOUT_MS = 45000;
    const DEFAULT_PARAMS = {
        source: 'wordle_h5',
        sceneType: 'reward'
    };

    let listeners = [];
    let pendingRequest = null;

    function log(...args) {
        console.log(TAG, ...args);
    }

    function warn(...args) {
        console.warn(TAG, ...args);
    }

    function todayStr() {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    function readStoredCount() {
        try {
            const storedDate = window.localStorage.getItem(STORAGE_KEY_DATE);
            if (storedDate !== todayStr()) {
                return 0;
            }
            const raw = window.localStorage.getItem(STORAGE_KEY_COUNT);
            const parsed = Number.parseInt(raw || '0', 10);
            return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
        } catch (error) {
            warn('Failed to read count', error);
            return 0;
        }
    }

    function persistCount(count) {
        try {
            window.localStorage.setItem(STORAGE_KEY_DATE, todayStr());
            window.localStorage.setItem(STORAGE_KEY_COUNT, String(Math.max(0, count)));
        } catch (error) {
            warn('Failed to persist count', error);
        }
    }

    function dispatchToListeners(payload) {
        listeners.forEach((listener) => {
            try {
                listener(payload);
            } catch (error) {
                warn('Listener error', error);
            }
        });
    }

    function hasIOSBridge() {
        return Boolean(window.webkit && window.webkit.messageHandlers);
    }

    function hasAndroidBridge() {
        return Boolean(window.hellotalk);
    }

    function callIOSHandler(handlerName, params) {
        if (!hasIOSBridge()) {
            return false;
        }
        const handler = window.webkit.messageHandlers[handlerName];
        if (!handler) {
            return false;
        }
        try {
            if (typeof handler.postMessage === 'function') {
                handler.postMessage(params);
            } else if (typeof handler === 'function') {
                handler(params);
            } else {
                return false;
            }
            return true;
        } catch (error) {
            warn(`${handlerName} bridge error`, error);
            return false;
        }
    }

    function callAndroidHandler(methodName, params) {
        if (!hasAndroidBridge()) {
            return false;
        }
        const handler = window.hellotalk[methodName];
        if (typeof handler !== 'function') {
            return false;
        }
        try {
            const payload = typeof params === 'string' ? params : JSON.stringify(params);
            handler.call(window.hellotalk, payload);
            return true;
        } catch (error) {
            warn(`${methodName} bridge error`, error);
            return false;
        }
    }

    function invokeNativeAdvertising(params) {
        if (callIOSHandler('callNativeAdvertising', params)) {
            return true;
        }
        if (callAndroidHandler('callNativeAdvertising', params)) {
            return true;
        }
        return false;
    }

    function invokeNativePreload(params) {
        if (callIOSHandler('callNativeAdvertisingPreload', params)) {
            return true;
        }
        if (callAndroidHandler('callNativeAdvertisingPreload', params)) {
            return true;
        }
        return false;
    }

    function clearPendingRequest() {
        if (!pendingRequest) {
            return;
        }
        if (pendingRequest.timeoutId) {
            clearTimeout(pendingRequest.timeoutId);
        }
        pendingRequest = null;
    }

    function generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    function normalizeSceneType(sceneType) {
        if (typeof sceneType !== 'string' || !sceneType.trim()) {
            return DEFAULT_PARAMS.sceneType;
        }
        return sceneType.trim();
    }

    const AdvertisingManager = {
        addListener(handler) {
            if (typeof handler === 'function' && !listeners.includes(handler)) {
                listeners.push(handler);
            }
        },

        removeListener(handler) {
            listeners = listeners.filter((fn) => fn !== handler);
        },

        getTodayWatchedCount() {
            return readStoredCount();
        },

        getConfigLimit() {
            return DAILY_LIMIT;
        },

        canWatchMore() {
            return this.getTodayWatchedCount() < this.getConfigLimit();
        },

        preload(params = {}) {
            const mergedParams = {
                ...DEFAULT_PARAMS,
                ...params,
                sceneType: normalizeSceneType(params.sceneType)
            };
            if (!invokeNativePreload(mergedParams)) {
                log('Preload skipped (bridge unavailable)');
            } else {
                log('Requested ad preload', mergedParams);
            }
        },

        show(options = {}) {
            if (pendingRequest) {
                warn('Ad request already in progress');
                return false;
            }

            const sceneType = normalizeSceneType(options.sceneType);

            if (!this.canWatchMore()) {
                const payload = {
                    isGainReward: 0,
                    isError: true,
                    errorCode: 'DAILY_LIMIT_REACHED',
                    errorMessage: 'Daily ad limit reached.',
                    sceneType,
                    viewsNumber: this.getTodayWatchedCount(),
                    maximumViews: this.getConfigLimit()
                };
                dispatchToListeners(payload);
                return false;
            }

            const requestId = generateRequestId();
            const params = {
                ...DEFAULT_PARAMS,
                ...options,
                sceneType,
                requestId
            };

            const invoked = invokeNativeAdvertising(params);
            if (!invoked) {
                const payload = {
                    isGainReward: 0,
                    isError: true,
                    errorCode: 'BRIDGE_UNAVAILABLE',
                    errorMessage: 'Rewarded ads are not supported in this environment.',
                    sceneType,
                    requestId,
                    viewsNumber: this.getTodayWatchedCount(),
                    maximumViews: this.getConfigLimit()
                };
                dispatchToListeners(payload);
                return false;
            }

            pendingRequest = {
                requestId,
                sceneType,
                timeoutId: setTimeout(() => {
                    warn('Ad request timed out', requestId);
                    clearPendingRequest();
                    dispatchToListeners({
                        isGainReward: 0,
                        isError: true,
                        errorCode: 'TIMEOUT',
                        errorMessage: 'Rewarded ad request timed out. Please try again later.',
                        sceneType,
                        requestId,
                        viewsNumber: readStoredCount(),
                        maximumViews: DAILY_LIMIT
                    });
                }, REQUEST_TIMEOUT_MS)
            };

            log('Requested ad playback', params);
            return true;
        },

        handleNativeCallback(payload = {}) {
            log('Received native callback', payload);

            const normalized = { ...payload };
            normalized.sceneType = normalizeSceneType(
                payload.sceneType
                    || (pendingRequest && pendingRequest.sceneType)
                    || DEFAULT_PARAMS.sceneType
            );
            normalized.requestId = payload.requestId || (pendingRequest && pendingRequest.requestId) || '';
            normalized.isGainReward = Number(payload.isGainReward) === 1 ? 1 : 0;
            normalized.isError = Boolean(payload.isError) || (normalized.isGainReward !== 1);

            if (normalized.isGainReward === 1) {
                const newCount = this.getTodayWatchedCount() + 1;
                persistCount(newCount);
                normalized.viewsNumber = newCount;
            } else {
                normalized.viewsNumber = this.getTodayWatchedCount();
            }
            normalized.maximumViews = this.getConfigLimit();

            clearPendingRequest();
            dispatchToListeners(normalized);
        }
    };

    window.AdvertisingManager = AdvertisingManager;
    window.callNativeAdvertisingCallback = AdvertisingManager.handleNativeCallback.bind(AdvertisingManager);
})();
