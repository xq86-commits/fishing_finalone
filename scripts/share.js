(function initGameShareBridge() {
  const { isAndroidPhone, isIOSPhone } = window.HTInteraction || {};
  var currentOrigin = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, "");
  var SHARE_URL = currentOrigin + "/index.html?HS=1&HA=1&FC=1";
  var SHARE_ICON = currentOrigin + "/assets/icon.png";
  var MOMENT_CARD_IMAGE = currentOrigin + "/assets/shareimg.png";
  var MOMENT_CARD_WIDTH = 1024;
  var MOMENT_CARD_HEIGHT = 1536;
  var LEARN_CARD_HEIGHT = 655;
  var DEFAULT_URL = SHARE_URL;

  var DEFAULT_COPY = "Jump into this fun mini game today!";
  var DEFAULT_TITLE = "Words Fishing Lingo - language game center";
  var DEFAULT_SUBTITLE = "Join me for a quick gaming challenge.";

  var BASE_PAYLOAD = {
    title: DEFAULT_TITLE,
    content: DEFAULT_COPY,
    share_url: SHARE_URL,
    copy_url: SHARE_URL,
    url: SHARE_URL,
    link_url: SHARE_URL,
    share_text: DEFAULT_COPY + "\n" + DEFAULT_URL,
    images: {
      thumb_url: SHARE_ICON,
      big_url: SHARE_ICON,
      width: 256,
      height: 256
    },
    chat: {
      title: DEFAULT_TITLE,
      sub_title: DEFAULT_SUBTITLE,
      goto_url: SHARE_URL,
      pic_url: SHARE_ICON,
      url_info: {
        url: SHARE_URL,
        thumb_url: SHARE_ICON,
        title: DEFAULT_TITLE,
        description: DEFAULT_COPY
      }
    },
    moment: {
      content: DEFAULT_COPY,
      learn_card: {
        goto_url: SHARE_URL,
        pic_url: MOMENT_CARD_IMAGE,
        height: MOMENT_CARD_HEIGHT
      }
    },
    learn_card: {
      goto_url: SHARE_URL,
      pic_url: MOMENT_CARD_IMAGE,
      height: LEARN_CARD_HEIGHT
    },
    hide_copy_url: false,
    source: "Mini Game Hub",
    backgroundDimEnabled: 1,
    share_content_type: 2
  };

  function cloneSharePayload() {
    return {
      title: BASE_PAYLOAD.title,
      content: BASE_PAYLOAD.content,
      share_url: BASE_PAYLOAD.share_url,
      copy_url: BASE_PAYLOAD.copy_url,
      url: BASE_PAYLOAD.url,
      link_url: BASE_PAYLOAD.link_url,
      share_text: BASE_PAYLOAD.share_text,
      hide_copy_url: BASE_PAYLOAD.hide_copy_url,
      source: BASE_PAYLOAD.source,
      backgroundDimEnabled: BASE_PAYLOAD.backgroundDimEnabled,
      share_content_type: BASE_PAYLOAD.share_content_type,
      images: {
        thumb_url: BASE_PAYLOAD.images.thumb_url,
        big_url: BASE_PAYLOAD.images.big_url,
        width: BASE_PAYLOAD.images.width,
        height: BASE_PAYLOAD.images.height
      },
      chat: {
        title: BASE_PAYLOAD.chat.title,
        sub_title: BASE_PAYLOAD.chat.sub_title,
        goto_url: BASE_PAYLOAD.chat.goto_url,
        pic_url: BASE_PAYLOAD.chat.pic_url,
        url_info: {
          url: BASE_PAYLOAD.chat.url_info.url,
          thumb_url: BASE_PAYLOAD.chat.url_info.thumb_url,
          title: BASE_PAYLOAD.chat.url_info.title,
          description: BASE_PAYLOAD.chat.url_info.description
        }
      },
      moment: {
        content: BASE_PAYLOAD.moment.content,
        learn_card: {
          goto_url: BASE_PAYLOAD.moment.learn_card.goto_url,
          pic_url: BASE_PAYLOAD.moment.learn_card.pic_url,
          height: BASE_PAYLOAD.moment.learn_card.height
        }
      },
      learn_card: {
        goto_url: BASE_PAYLOAD.learn_card.goto_url,
        pic_url: BASE_PAYLOAD.learn_card.pic_url,
        height: BASE_PAYLOAD.learn_card.height
      }
    };
  }

  function mergePayload(overrides) {
    var result = cloneSharePayload();
    if (!overrides) {
      return result;
    }

    var key;
    for (key in overrides) {
      if (!overrides.hasOwnProperty(key)) continue;
      if (key === "images" || key === "chat" || key === "moment" || key === "learn_card") {
        continue;
      }
      result[key] = overrides[key];
    }

    if (overrides.images) {
      for (key in overrides.images) {
        if (overrides.images.hasOwnProperty(key)) {
          result.images[key] = overrides.images[key];
        }
      }
    }

    if (overrides.chat) {
      for (key in overrides.chat) {
        if (overrides.chat.hasOwnProperty(key)) {
          if (key === 'url_info' && overrides.chat.url_info) {
            var chatInfo = overrides.chat.url_info;
            for (var infoKey in chatInfo) {
              if (chatInfo.hasOwnProperty(infoKey)) {
                result.chat.url_info[infoKey] = chatInfo[infoKey];
              }
            }
          } else {
            result.chat[key] = overrides.chat[key];
          }
        }
      }
    }

    if (overrides.moment) {
      if (overrides.moment.content) {
        result.moment.content = overrides.moment.content;
      }
      if (overrides.moment.learn_card) {
        var info = overrides.moment.learn_card;
        if (!result.moment.learn_card) result.moment.learn_card = {};
        for (key in info) {
          if (info.hasOwnProperty(key)) {
            result.moment.learn_card[key] = info[key];
          }
        }
      }
    }

    if (overrides.learn_card) {
      for (key in overrides.learn_card) {
        if (overrides.learn_card.hasOwnProperty(key)) {
          result.learn_card[key] = overrides.learn_card[key];
        }
      }
    }

    if (!result.share_text) {
      var text = result.content || result.title || "";
      result.share_text = text + "\n" + (result.url || result.share_url || DEFAULT_URL);
    }
    return result;
  }

  function isIOS() {
    var ua = navigator.userAgent || "";
    return /iPhone|iPad|iPod/i.test(ua);
  }

  function isAndroid() {
    var ua = navigator.userAgent || "";
    return /Android/i.test(ua);
  }

  function shareViaNative(payload) {
    try {
      if (isIOS() && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.socialShare) {
        window.webkit.messageHandlers.socialShare.postMessage({ data: JSON.stringify(payload) });
        return true;
      }
    } catch (error) {
      console.error("[share] iOS bridge error", error);
    }

    try {
      if (isAndroid() && window.hellotalk && typeof window.hellotalk.socialShare === "function") {
        window.hellotalk.socialShare(JSON.stringify(payload));
        return true;
      }
    } catch (error) {
      console.error("[share] Android bridge error", error);
    }

    return false;
  }

  function shareFallback(payload) {
    var shareUrl = payload.url || payload.share_url || DEFAULT_URL;
    var baseText = payload.share_text || payload.content || "";
    var textBlock = shareUrl && baseText.indexOf(shareUrl) >= 0
      ? baseText
      : (baseText + "\n" + shareUrl).trim();
    if (navigator.share) {
      navigator.share({
        title: payload.title,
        text: textBlock,
        url: shareUrl
      }).catch(function () { });
      return;
    }
    if (shareUrl && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(function () { alert("Share link copied: " + shareUrl); })
        .catch(function () { alert("Share this link: " + shareUrl); });
      return;
    }
    alert("Share this link: " + shareUrl);
  }

  function shareViaLearnCard(options) {
    var card = {
      goto_url: options.goto_url || SHARE_URL,
      pic_url: options.pic_url || MOMENT_CARD_IMAGE,
      width: Number(options.width) || MOMENT_CARD_WIDTH,
      height: Number(options.height) || MOMENT_CARD_HEIGHT
    };

    try {
      if (isIOS() && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.learnCardShare) {
        window.webkit.messageHandlers.learnCardShare.postMessage(card);
        return true;
      }
    } catch (error) {
      console.error("[share] learnCardShare iOS error", error);
    }

    try {
      if (isAndroid() && window.hellotalk && typeof window.hellotalk.learnCardShare === "function") {
        window.hellotalk.learnCardShare(JSON.stringify(card));
        return true;
      }
    } catch (error) {
      console.error("[share] learnCardShare Android error", error);
    }

    return false;
  }

  function triggerShare(overrides) {
    var payload = mergePayload(overrides);
    if (!shareViaNative(payload)) {
      shareFallback(payload);
    }
  }

  function shareHome() {
    var cardOptions = {
      goto_url: SHARE_URL,
      pic_url: MOMENT_CARD_IMAGE,
      width: MOMENT_CARD_WIDTH,
      height: MOMENT_CARD_HEIGHT
    };
    /* Remove shareViaLearnCard priority to allow native menu selection
    if (shareViaLearnCard(cardOptions)) {
      return;
    }
    */
    triggerShare({
      chat: {
        url_info: {
          url: SHARE_URL,
          thumb_url: SHARE_ICON,
          title: DEFAULT_TITLE,
          description: DEFAULT_COPY
        }
      },
      moment: {
        learn_card: {
          goto_url: SHARE_URL,
          pic_url: MOMENT_CARD_IMAGE,
          height: MOMENT_CARD_HEIGHT
        }
      },
      learn_card: {
        goto_url: cardOptions.goto_url,
        pic_url: cardOptions.pic_url,
        height: LEARN_CARD_HEIGHT
      }
    });
  }

  function shareScore(score, level) {
    var levelLabel = level ? "level " + level : "this level";
    var message = 'I just finished "' + levelLabel + '" in this game, Can you beat me?';
    var cardOptions = {
      goto_url: SHARE_URL,
      pic_url: MOMENT_CARD_IMAGE,
      width: MOMENT_CARD_WIDTH,
      height: MOMENT_CARD_HEIGHT
    };
    /* Remove shareViaLearnCard priority
    if (shareViaLearnCard(cardOptions)) {
      return;
    }
    */
    triggerShare({
      content: message,
      share_text: message + "\n" + DEFAULT_URL,
      chat: {
        sub_title: message,
        goto_url: SHARE_URL,
        pic_url: SHARE_ICON,
        url_info: {
          url: SHARE_URL,
          thumb_url: SHARE_ICON,
          title: DEFAULT_TITLE,
          description: message
        }
      },
      moment: {
        content: message,
        learn_card: {
          goto_url: SHARE_URL,
          pic_url: MOMENT_CARD_IMAGE,
          height: MOMENT_CARD_HEIGHT
        }
      },
      learn_card: {
        goto_url: cardOptions.goto_url,
        pic_url: cardOptions.pic_url,
        height: LEARN_CARD_HEIGHT
      }
    });
  }

  function shareMomentCard() {
    if (shareViaLearnCard({
      goto_url: SHARE_URL,
      pic_url: MOMENT_CARD_IMAGE,
      width: MOMENT_CARD_WIDTH,
      height: MOMENT_CARD_HEIGHT
    })) {
      return;
    }
    triggerShare({
      images: {
        thumb_url: MOMENT_CARD_IMAGE,
        big_url: MOMENT_CARD_IMAGE
      },
      moment: {
        url_info: {
          thumb_url: MOMENT_CARD_IMAGE
        }
      }
    });
  }

  window.gameShare = {
    shareHome: shareHome,
    shareScore: shareScore,
    shareMomentCard: shareMomentCard,
    triggerShare: triggerShare,
    mergePayload: mergePayload
  };

  window.socialShare = shareHome;
  window.floatingControlsMoreCallback = shareHome;
})();
