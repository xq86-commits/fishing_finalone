(function () {
  var locales = {};
  var currentLocale = "English";
  var fallbackLocale = "English";

  var VALID_LOCALES = [
    "Arabic", "Chinese", "Chinese_yy", "English", "French", "German",
    "Indonesian", "Italian", "Japanese", "Korean", "Portuguese",
    "Russian", "Spanish", "Thai", "Turkish", "Vietnamese"
  ];

  function isValidLocale(name) {
    if (!name || typeof name !== "string") return false;
    for (var i = 0; i < VALID_LOCALES.length; i++) {
      if (VALID_LOCALES[i] === name) return true;
    }
    return false;
  }

  function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function resolveLocale(raw) {
    if (!raw || typeof raw !== "string") return null;
    var name = capitalize(raw.trim());
    return isValidLocale(name) ? name : null;
  }

  window.i18n = {
    setLocale: function (locale) {
      var resolved = resolveLocale(locale) || fallbackLocale;
      currentLocale = locales[resolved] ? resolved : fallbackLocale;
      console.log("[i18n] setLocale:", locale, "→", currentLocale);
    },

    getLocale: function () {
      return currentLocale;
    },

    t: function (key, params) {
      var text = (locales[currentLocale] && locales[currentLocale][key])
        || (locales[fallbackLocale] && locales[fallbackLocale][key])
        || key;
      if (params) {
        var keys = Object.keys(params);
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          text = text.replace(new RegExp("\\{" + k + "\\}", "g"), String(params[k]));
        }
      }
      return text;
    },

    loadLocale: function (locale, basePath, callback) {
      var resolved = resolveLocale(locale) || fallbackLocale;
      if (locales[resolved]) {
        if (callback) callback(resolved);
        return;
      }
      var url = (basePath || "locales/") + resolved + ".json";
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.onload = function () {
        if (xhr.status === 200) {
          try {
            locales[resolved] = JSON.parse(xhr.responseText);
          } catch (e) {
            console.warn("[i18n] Failed to parse locale JSON: " + resolved, e);
          }
        } else {
          console.warn("[i18n] Failed to load locale: " + resolved + " (HTTP " + xhr.status + ")");
        }
        if (callback) callback(locales[resolved] ? resolved : fallbackLocale);
      };
      xhr.onerror = function () {
        console.warn("[i18n] Network error loading locale: " + resolved);
        if (callback) callback(fallbackLocale);
      };
      xhr.send();
    },

    init: function (basePath, callback) {
      var self = this;
      self.loadLocale(fallbackLocale, basePath, function () {
        if (callback) callback(currentLocale);
      });
    }
  };
})();
