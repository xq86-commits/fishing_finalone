const shareParams = ref({
  content: "",
  tags: [
    {
      tag_id: topicInformation.value.topic_id,
      tag_name: topicInformation.value.topic_name
    }
  ],
  learn_card: {
    goto_url: "",
    pic_url: "",
    height: 655
  }
});


export const dynamicCardShare = (shareInfo: ShareCardInter) => {
  if (isIOSPhone) {
    const info = {
      data: JSON.stringify(shareInfo)
    };
    window.webkit.messageHandlers.dynamicShare.postMessage(info);
  } else if (isAndroidPhone) {
    const info = JSON.stringify(shareInfo);
    const URL = `hellotalk://share/moment?info=${info}`;
    window.hellotalk.onDeepLinkCallback(URL);
  }
};


 * @description 分享卡片到聊天
 * @param {String} goto_url 链接URL
 * @param {String} pic_url 图片URL地址
 * @param {Number} width 图片展示宽
 * @param {Number} height 图片展示高
 */
export interface LearnCardShareInter {
  goto_url: string;
  pic_url: string;
  width: number;
  height: number;
}


/**
 * @description 分享卡片到聊天 大图
 * @param {Object} shareInfo - 分享信息
 * @example learnCardShare({
        goto_url: 'https://qtest.hellotalk8.com/liveclass/home/',
        pic_url: 'https://ali-hk-cdn.hellotalk8.com/ht-global/liveclass/1/221207/3/10284963/s/0/f64d6ddb3fc8c56180832a06c847d933.png',
        width: 315,
        height: 455,
    });
 */
export const learnCardShare = (shareInfo: LearnCardShareInter) => {
  if (isIOSPhone) {
    window.webkit.messageHandlers.learnCardShare.postMessage(shareInfo);
  } else if (isAndroidPhone) {
    const info = JSON.stringify(shareInfo);
    window.hellotalk.learnCardShare(info);
  }
};