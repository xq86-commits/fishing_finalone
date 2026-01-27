(function initAdvertisingManager() {
  var TAG = "[AdvertisingManager]";
  var STORAGE_KEY_DATE = "miniGameAdDate";
  var STORAGE_KEY_COUNT = "miniGameAdCount";
  var DAILY_LIMIT = 5;
  var REQUEST_TIMEOUT_MS = 45000;
  var DEFAULT_PARAMS = {
    source: "mini_game_h5",
    sceneType: "words-fishing-watch-advertising"
  };

  var listeners = [];
  var pendingRequest = null;

  function log() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(TAG);
    console.log.apply(console, args);
  }

  function warn() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(TAG);
    console.warn.apply(console, args);
  }

  function todayKey() {
    var now = new Date();
    var yyyy = now.getFullYear();
    var mm = String(now.getMonth() + 1).padStart(2, "0");
    var dd = String(now.getDate()).padStart(2, "0");
    return yyyy + "-" + mm + "-" + dd;
  }

  function readCount() {
    try {
      var storedDate = window.localStorage.getItem(STORAGE_KEY_DATE);
      if (storedDate !== todayKey()) {
        return 0;
      }
      var raw = window.localStorage.getItem(STORAGE_KEY_COUNT) || "0";
      var parsed = parseInt(raw, 10);
      return isFinite(parsed) && parsed >= 0 ? parsed : 0;
    } catch (error) {
      warn("failed to read count", error);
      return 0;
    }
  }

  function persistCount(count) {
    try {
      window.localStorage.setItem(STORAGE_KEY_DATE, todayKey());
      window.localStorage.setItem(STORAGE_KEY_COUNT, String(Math.max(0, count)));
    } catch (error) {
      warn("failed to persist count", error);
    }
  }

  function generateRequestId() {
    return "req_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
  }

  function hasIOSBridge() {
    return Boolean(window.webkit && window.webkit.messageHandlers);
  }

  function hasAndroidBridge() {
    return Boolean(window.hellotalk);
  }

  function callIOS(handlerName, payload) {
    if (!hasIOSBridge()) return false;
    var handler = window.webkit.messageHandlers[handlerName];
    if (!handler) return false;
    try {
      if (typeof handler.postMessage === "function") {
        handler.postMessage(payload);
      } else if (typeof handler === "function") {
        handler(payload);
      } else {
        return false;
      }
      return true;
    } catch (error) {
      warn(handlerName + " bridge error", error);
      return false;
    }
  }

  function callAndroid(methodName, payload) {
    if (!hasAndroidBridge()) return false;
    var handler = window.hellotalk[methodName];
    if (typeof handler !== "function") return false;
    try {
      var data = typeof payload === "string" ? payload : JSON.stringify(payload);
      handler.call(window.hellotalk, data);
      return true;
    } catch (error) {
      warn(methodName + " bridge error", error);
      return false;
    }
  }

  function invokeAdvertising(payload) {
    const { isAndroidPhone, isIOSPhone } = window.HTInteraction || {};
    if (isIOSPhone) {
      if (callIOS("callNativeAdvertising", payload)) return true;
    } else if (isAndroidPhone) {
      if (callAndroid("callNativeAdvertising", payload)) return true;
    }
    return false;
  }

  function invokePreload(payload) {
    const { isAndroidPhone, isIOSPhone } = window.HTInteraction || {};
    if (isIOSPhone) {
      if (callIOS("callNativeAdvertisingPreload", payload)) return true;
    } else if (isAndroidPhone) {
      if (callAndroid("callNativeAdvertisingPreload", payload)) return true;
    }
    return false;
  }

  function normalizeSceneType(sceneType) {
    var val = (sceneType || "").toLowerCase();
    if (val !== "interstitial" && val !== "reward") {
      return DEFAULT_PARAMS.sceneType;
    }
    return val;
  }

  function notifyListeners(payload) {
    listeners.forEach(function (listener) {
      try {
        listener(payload);
      } catch (error) {
        warn("listener error", error);
      }
    });
  }

  function clearPending() {
    if (pendingRequest && pendingRequest.timeoutId) {
      clearTimeout(pendingRequest.timeoutId);
    }
    pendingRequest = null;
  }

  var manager = {
    addListener: function (handler) {
      if (typeof handler === "function" && listeners.indexOf(handler) === -1) {
        listeners.push(handler);
      }
    },

    removeListener: function (handler) {
      listeners = listeners.filter(function (fn) { return fn !== handler; });
    },

    getDailyLimit: function () {
      return DAILY_LIMIT;
    },

    getWatchedCount: function () {
      return readCount();
    },

    canWatchMore: function () {
      return this.getWatchedCount() < this.getDailyLimit();
    },

    preload: function (params) {
      var merged = {
        source: DEFAULT_PARAMS.source,
        sceneType: normalizeSceneType(params && params.sceneType),
        advertisingConfig: (params && params.advertisingConfig) !== undefined
          ? params.advertisingConfig
          : this.advertisingConfig
      };
      if (!invokePreload(merged)) {
        log("preload skipped (no native bridge)");
      }
    },

    show: function (options) {
      if (pendingRequest) {
        warn("ad request already pending");
        return false;
      }

      if (!this.canWatchMore()) {
        notifyListeners({
          isGainReward: 0,
          isError: true,
          errorCode: "DAILY_LIMIT_REACHED",
          errorMessage: "Daily ad limit reached.",
          viewsNumber: this.getWatchedCount(),
          maximumViews: this.getDailyLimit()
        });
        return false;
      }

      var sceneType = normalizeSceneType(options && options.sceneType);
      var requestId = generateRequestId();
      var payload = {
        source: DEFAULT_PARAMS.source,
        sceneType: sceneType,
        requestId: requestId,
        advertisingConfig: this.advertisingConfig // 使用保存好的配置信息
      };
      if (options) {
        var key;
        for (key in options) {
          if (options.hasOwnProperty(key)) {
            payload[key] = options[key];
          }
        }
        payload.sceneType = sceneType;
        payload.requestId = requestId;
        // 如果 options 中没传，则使用缓存的
        if (options.advertisingConfig === undefined) {
          payload.advertisingConfig = this.advertisingConfig;
        }
      }

      if (!invokeAdvertising(payload)) {
        notifyListeners({
          isGainReward: 0,
          isError: true,
          errorCode: "BRIDGE_UNAVAILABLE",
          errorMessage: "Native advertising bridge unavailable.",
          sceneType: sceneType,
          requestId: requestId,
          viewsNumber: this.getWatchedCount(),
          maximumViews: this.getDailyLimit()
        });
        return false;
      }

      pendingRequest = {
        requestId: requestId,
        sceneType: sceneType,
        timeoutId: setTimeout(function () {
          warn("ad request timeout", requestId);
          clearPending();
          notifyListeners({
            isGainReward: 0,
            isError: true,
            errorCode: "TIMEOUT",
            errorMessage: "Ad request timed out.",
            sceneType: sceneType,
            requestId: requestId,
            viewsNumber: readCount(),
            maximumViews: DAILY_LIMIT
          });
        }, REQUEST_TIMEOUT_MS)
      };

      log("requested ad", payload);
      return true;
    },

    handleNativeCallback: function (payload) {
      log("native callback", payload);
      var normalized = payload || {};
      normalized.sceneType = normalizeSceneType(normalized.sceneType ||
        (pendingRequest && pendingRequest.sceneType));
      normalized.requestId = normalized.requestId || (pendingRequest && pendingRequest.requestId) || "";
      normalized.isGainReward = parseInt(normalized.isGainReward, 10) === 1 ? 1 : 0;
      normalized.isError = Boolean(normalized.isError);

      if (normalized.isGainReward === 1) {
        var newCount = this.getWatchedCount() + 1;
        persistCount(newCount);
        normalized.viewsNumber = newCount;
      } else {
        normalized.viewsNumber = this.getWatchedCount();
      }
      normalized.maximumViews = this.getDailyLimit();

      clearPending();
      notifyListeners(normalized);
    }
  };

  window.advertisingManager = manager;
  window.callNativeAdvertisingCallback = function (payload) {
    manager.handleNativeCallback(payload);
  };
})();
