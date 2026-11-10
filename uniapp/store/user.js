/**
 * 轻量全局用户态（订阅式），不引入第三方状态库
 * 原小程序依赖 app.globalData，uni-app 端改为自包含 store + uni.getStorageSync。
 */

const listeners = [];

const userStore = {
  state: {
    openid: '',
    role: '',
    userInfo: null,
    loggedIn: false,
  },

  /** 获取当前状态（返回副本避免外部直接修改） */
  getState() {
    return Object.assign({}, this.state);
  },

  /** 合并更新状态并通知订阅者 */
  setState(patch) {
    this.state = Object.assign({}, this.state, patch);
    listeners.forEach((fn) => {
      try {
        fn(this.getState());
      } catch (e) {
        console.error('[userStore] listener error', e);
      }
    });
  },

  /** 订阅状态变化，返回取消订阅函数 */
  subscribe(fn) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  },
};

module.exports = userStore;
