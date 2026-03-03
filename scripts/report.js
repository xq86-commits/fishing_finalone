const REPORT_URL = {
  0: {
    // 生产
    THINKINGDATA_SERVER_URL: "https://ta-upload.hellotalk8.com/",
    THINKINGDATA_APP_ID: "a1c4c6ad1eee41ebba02c8b4653933e3",
  },
  1: {
    // 测试
    THINKINGDATA_SERVER_URL: "https://ta-upload.hellotalk8.com/",
    THINKINGDATA_APP_ID: "b745e4113a63449dbf161c35c1042550",
  },
  2: {
    // 开发
    THINKINGDATA_SERVER_URL: "https://ta-upload.hellotalk8.com/",
    THINKINGDATA_APP_ID: "b745e4113a63449dbf161c35c1042550",
  },
};
// 将 SDK 实例赋给全局变量 ta，或者其他您指定的变量
const DataReport = window["DataReport"];

// const env =
//       process.env.VUE_APP_CURENV === "production"
//       ? 0
//       : process.env.VUE_APP_CURENV === "development"
//       ? 1
//       : 2;

const env = 1;

let ta;

function initThinkingData(id, isProd) {
  const env = isProd ? 0 : 2;
  ta = new DataReport({
    appId: REPORT_URL[env].THINKINGDATA_APP_ID,
  });
  ta.quick("autoTrack");
  ta.login(id);
}

window.onShow = () => {
  reportPageEnter();
};

window.onHide = () => {
  reportPageLeave();
};

var _enter_time_ = Date.now();

function reportPageEnter() {
  // 页面展示时上报事件
  ta.track("MiniGameHomePageEnter", {
    game_name: "Words Fishing", // Words Fishing=单词钓鱼
    source: "Talk Top Toolbar", // Talk Top Toolbar=聊天页顶部工具栏
  });
}

function reportPageLeave() {
  // 页面隐藏时上报事件
  ta.track("MiniGameHomePageLeave", {
    game_name: "Words Fishing", // Words Fishing=单词钓鱼
    source: "Talk Top Toolbar", // Talk Top Toolbar=聊天页顶部工具栏
    event_duration: (Date.now() - _enter_time_) / 1000, // 单位：秒，计算方式：页面隐藏时间 - 页面展示时间
  });
}
