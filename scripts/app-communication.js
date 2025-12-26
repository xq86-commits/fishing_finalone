(function initAppCommunication() {
  function AppCommunication() {
    this.userInfo = null;
    this.isReady = false;
    this.init();
  }

  AppCommunication.prototype.init = function () {
    var self = this;
    window.addEventListener("message", function (event) {
      self.handleMessage(event);
    });

    window.addEventListener("load", function () {
      self.notifyAppReady();
    });

    if (window.advertisingManager && typeof window.advertisingManager.addListener === "function") {
      window.advertisingManager.addListener(function (payload) {
        self.sendMessageToApp({
          type: "adEvent",
          data: payload
        });
      });
    }
  };

  AppCommunication.prototype.handleMessage = function (event) {
    var data = event.data || {};
    var type = data.type;
    if (!type) {
      return;
    }
    try {
      switch (type) {
        case "userInfo":
          this.handleUserInfo(data.userInfo);
          break;
        case "gameConfig":
          this.handleGameConfig(data.config);
          break;
        case "showAd":
        case "requestAd":
          this.requestAd(data.options || {});
          break;
        case "preloadAd":
          this.preloadAd(data.options || {});
          break;
        case "share":
        case "shareScore":
          this.handleShareRequest(data);
          break;
        default:
          console.log("[appCommunication] Unhandled message:", data);
      }
    } catch (error) {
      console.error("[appCommunication] handleMessage error", error);
    }
  };

  AppCommunication.prototype.handleUserInfo = function (userInfo) {
    this.userInfo = userInfo || null;
    this.sendMessageToApp({
      type: "userInfoAck",
      received: Boolean(this.userInfo)
    });
  };

  AppCommunication.prototype.handleGameConfig = function (config) {
    if (config && typeof window.gameManager !== "undefined" && window.gameManager && typeof window.gameManager.updateConfig === "function") {
      window.gameManager.updateConfig(config);
    }
  };

  AppCommunication.prototype.handleShareRequest = function (payload) {
    if (!window.gameShare) return;

    var score = payload && payload.score;
    var level = payload && payload.level;

    if (score !== undefined && typeof window.gameShare.shareScore === "function") {
      window.gameShare.shareScore(score, level);
    } else {
      // If payload has custom share styling/content, try to use triggerShare
      var hasCustomData = payload && (payload.title || payload.content || payload.url || payload.share_url);
      if (hasCustomData && typeof window.gameShare.triggerShare === "function") {
        window.gameShare.triggerShare(payload);
      } else if (typeof window.gameShare.shareHome === "function") {
        window.gameShare.shareHome();
      }
    }
  };

  AppCommunication.prototype.requestAd = function (options) {
    if (!window.advertisingManager || typeof window.advertisingManager.show !== "function") {
      console.warn("[appCommunication] advertisingManager unavailable");
      return;
    }
    window.advertisingManager.show(options || {});
  };

  AppCommunication.prototype.preloadAd = function (options) {
    if (!window.advertisingManager || typeof window.advertisingManager.preload !== "function") {
      return;
    }
    window.advertisingManager.preload(options || {});
  };

  AppCommunication.prototype.notifyAppReady = function () {
    if (this.isReady) {
      return;
    }
    this.isReady = true;
    this.sendMessageToApp({
      type: "gameReady",
      data: {
        version: "1.1.0",
        features: ["share", "advertising", "userInfo"]
      }
    });
  };

  AppCommunication.prototype.sendMessageToApp = function (message) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(message, "*");
      } else {
        console.log("[appCommunication] message to app:", message);
      }
    } catch (error) {
      console.error("[appCommunication] sendMessage error", error);
    }
  };

  AppCommunication.prototype.getUserInfo = function () {
    return this.userInfo;
  };

  window.appCommunication = new AppCommunication();
})();
