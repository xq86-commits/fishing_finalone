(function initGameDataService() {
  var assign = (typeof Object.assign === "function")
    ? Object.assign
    : function(target) {
        if (target === null || target === undefined) {
          throw new TypeError("Cannot convert undefined or null to object");
        }
        var to = Object(target);
        for (var index = 1; index < arguments.length; index++) {
          var nextSource = arguments[index];
          if (nextSource === null || nextSource === undefined) {
            continue;
          }
          for (var key in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, key)) {
              to[key] = nextSource[key];
            }
          }
        }
        return to;
      };
  function isFiniteNumber(value) {
    return typeof value === "number" && isFinite(value);
  }

  var DEFAULT_AVATAR = "assets/handy.png";

  var FALLBACK_LEADERBOARD = [
    { playerId: "demo-1", nickname: "Nova", avatar: DEFAULT_AVATAR, isVip: true, score: 980, completionTimeMs: 73210 },
    { playerId: "demo-2", nickname: "Kai", avatar: DEFAULT_AVATAR, isVip: false, score: 870, completionTimeMs: 80110 },
    { playerId: "demo-3", nickname: "Mira", avatar: DEFAULT_AVATAR, isVip: true, score: 820, completionTimeMs: 84560 },
    { playerId: "demo-4", nickname: "Eli", avatar: DEFAULT_AVATAR, isVip: false, score: 750, completionTimeMs: null },
    { playerId: "demo-5", nickname: "Zara", avatar: DEFAULT_AVATAR, isVip: false, score: 700, completionTimeMs: 90320 },
    { playerId: "demo-6", nickname: "Theo", avatar: DEFAULT_AVATAR, isVip: false, score: 680, completionTimeMs: 92110 }
  ];

  var DEFAULT_CONFIG = {
    leaderboardUrl: "",
    submitUrl: "",
    fallbackLeaderboard: FALLBACK_LEADERBOARD,
    cacheTtlMs: 30000
  };

  var config = assign({}, DEFAULT_CONFIG);
  var cache = {
    leaderboard: null,
    fetchedAt: 0
  };

  function mergeConfig(target, source) {
    if (!source) return target;
    var key;
    for (key in source) {
      if (!source.hasOwnProperty(key)) continue;
      if (key === "fallbackLeaderboard" && Array.isArray(source[key])) {
        target[key] = source[key].slice();
      } else if (source[key] !== undefined) {
        target[key] = source[key];
      }
    }
    return target;
  }

  function applyExternalConfig() {
    if (window.GAME_API_CONFIG) {
      mergeConfig(config, window.GAME_API_CONFIG);
    }
  }

  function hasEndpoint(url) {
    return typeof url === "string" && url.trim().length > 0;
  }

  function toNumber(value) {
    var parsed = Number(value);
    return isFiniteNumber(parsed) ? parsed : null;
  }

  function normalizeEntry(entry, index) {
    var nickname = entry && (entry.nickname || entry.name || ("Player " + (index + 1)));
    var avatar = entry && (entry.avatar || entry.headurl || entry.pic || "");
    if (!avatar) {
      avatar = DEFAULT_AVATAR;
    }
    var score = entry && entry.score !== undefined ? Number(entry.score) : 0;
    var completion = entry && entry.completionTimeMs !== undefined ? toNumber(entry.completionTimeMs) : null;
    return {
      playerId: entry && (entry.playerId || entry.id || ("demo-" + (index + 1))) || ("demo-" + (index + 1)),
      nickname: nickname,
      avatar: avatar,
      isVip: Boolean(entry && (entry.isVip || entry.vip || entry.is_vip)),
      score: isFiniteNumber(score) ? score : 0,
      completionTimeMs: completion,
      raw: entry || null
    };
  }

  function normalizeList(list) {
    if (!Array.isArray(list)) return [];
    return list.map(function(entry, index) {
      return normalizeEntry(entry, index);
    });
  }

  function sortLeaderboard(list) {
    return list.slice().sort(function(a, b) {
      var timeA = a.completionTimeMs;
      var timeB = b.completionTimeMs;
      var hasTimeA = isFiniteNumber(timeA);
      var hasTimeB = isFiniteNumber(timeB);
      if (hasTimeA && hasTimeB && timeA !== timeB) {
        return timeA - timeB;
      }
      if (hasTimeA !== hasTimeB) {
        return hasTimeA ? -1 : 1;
      }
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      var nameA = (a.nickname || "").toLowerCase();
      var nameB = (b.nickname || "").toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
  }

  function getFallbackLeaderboard() {
    return sortLeaderboard(normalizeList(config.fallbackLeaderboard || FALLBACK_LEADERBOARD));
  }

  function isCacheValid() {
    if (!cache.leaderboard) return false;
    var ttl = config.cacheTtlMs || 0;
    if (ttl <= 0) return false;
    return (Date.now() - cache.fetchedAt) < ttl;
  }

  function fetchLeaderboard() {
    if (isCacheValid()) {
      return Promise.resolve(cache.leaderboard.slice());
    }

    if (!hasEndpoint(config.leaderboardUrl) || typeof fetch !== "function") {
      var fallback = getFallbackLeaderboard();
      cache.leaderboard = fallback.slice();
      cache.fetchedAt = Date.now();
      return Promise.resolve(fallback);
    }

    return fetch(config.leaderboardUrl, {
      method: "GET",
      credentials: "include",
      headers: {
        "Accept": "application/json"
      }
    })
      .then(function(response) {
        if (!response.ok) {
          throw new Error("Leaderboard request failed with status " + response.status);
        }
        return response.json();
      })
      .then(function(payload) {
        var list = sortLeaderboard(normalizeList(payload));
        if (!list.length) {
          list = getFallbackLeaderboard();
        }
        cache.leaderboard = list.slice();
        cache.fetchedAt = Date.now();
        return list;
      })
      .catch(function(error) {
        console.warn("[gameDataService] fetchLeaderboard fallback", error);
        var fallback = getFallbackLeaderboard();
        cache.leaderboard = fallback.slice();
        cache.fetchedAt = Date.now();
        return fallback;
      });
  }

  function submitResult(result) {
    if (!result || typeof result !== "object") {
      return Promise.reject(new Error("Result payload is required"));
    }

    if (!hasEndpoint(config.submitUrl) || typeof fetch !== "function") {
      console.info("[gameDataService] submitResult (mocked)", result);
      return Promise.resolve({ mocked: true });
    }

    return fetch(config.submitUrl, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(result)
    }).then(function(response) {
      if (response.status === 204) {
        return { success: true };
      }
      if (response.ok) {
        var contentType = response.headers.get("content-type") || "";
        if (contentType.indexOf("application/json") >= 0) {
          return response.json();
        }
        return response.text().then(function(text) {
          return { success: true, message: text };
        });
      }
      return response.text().then(function(text) {
        throw new Error(text || "Submit request failed with status " + response.status);
      });
    });
  }

  function setConfig(nextConfig) {
    mergeConfig(config, nextConfig);
    if (nextConfig && nextConfig.resetCache) {
      cache.leaderboard = null;
      cache.fetchedAt = 0;
    }
  }

  function getConfig() {
    return assign({}, config);
  }

  function buildSubmissionPayload(result, userInfo) {
    var nowIso = new Date().toISOString();
    var user = userInfo || {};
    var payload = assign({
      playerId: user.userId || user.userid || user.playerId || "",
      nickname: user.nickname || user.name || "Guest",
      avatar: user.avatar || user.headurl || "",
      isVip: Boolean(user.isVip),
      score: 0,
      level: null,
      completionTimeMs: null,
      attempts: null,
      target: null,
      submittedAt: nowIso
    }, result || {});
    if (!payload.playerId && user.userId === undefined && user.userid === undefined) {
      payload.playerId = "guest-" + nowIso;
    }
    return payload;
  }

  applyExternalConfig();

  window.gameDataService = {
    fetchLeaderboard: fetchLeaderboard,
    submitResult: submitResult,
    setConfig: setConfig,
    getConfig: getConfig,
    buildSubmissionPayload: buildSubmissionPayload,
    getFallbackLeaderboard: getFallbackLeaderboard
  };
})();
