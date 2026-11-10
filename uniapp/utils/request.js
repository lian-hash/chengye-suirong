/**
 * 云函数调用封装（uni-app 端，核心）
 * 导出 call(name, action, data) —— 与 Web 端 request 语义对齐
 *
 * 逻辑：
 *  - 默认开启 Mock 模式（config/unicloud.js → FORCE_MOCK = true），无需 appid / 云环境即可离线跑通
 *  - Mock 模式：走 mock/index.js 本地数据，返回与 §3.3 接口契约一致的响应
 *  - 真实模式：走 uniCloud.callFunction，统一处理 {code,message,data}
 *
 * 接入真实 uniCloud：在 config/unicloud.js 中填写 CLIENT_SECRET 并置 FORCE_MOCK = false，
 * main.js 会执行 uniCloud.init()，本文件自动切换到真实模式（调用名与返回契约均不变）。
 */

const mock = require('../mock/index');
const unicloudConfig = require('../config/unicloud');

/** 强制 Mock 开关（来源于统一配置，默认 true） */
const FORCE_MOCK = unicloudConfig.FORCE_MOCK;

/** 真实 uniCloud 空间标识（来源于统一配置） */
const UNICLOUD_ENV = unicloudConfig.SPACE_ID;

/**
 * 是否处于 Mock 模式
 * 判定统一收敛到 config/unicloud.js，避免各处硬编码开关不一致
 * @returns {boolean}
 */
function isMock() {
  return unicloudConfig.isMock();
}

/**
 * 统一调用云函数
 * @param {string} name 云函数名（login/order/packageSite/user...）
 * @param {string} action 动作（小驼峰，如 listPackages/create/pay）
 * @param {object} data 业务参数
 * @returns {Promise<{code:number,message:string,data:*}>}
 */
function call(name, action, data = {}) {
  if (isMock()) {
    // Mock 模式同样返回 Promise，且对非 0 返回统一 reject（与真实模式行为一致）
    return new Promise((resolve, reject) => {
      const result = mock.handle(name, action, data);
      if (result.code === 0) {
        resolve(result);
      } else {
        uni.showToast({ title: result.message || '请求失败', icon: 'none' });
        reject(result);
      }
    });
  }

  return uniCloud
    .callFunction({ name, data: { action, ...data } })
    .then((res) => {
      const result = (res && res.result) || {};
      if (result.code === 0) {
        return result;
      }
      uni.showToast({ title: result.message || '请求失败', icon: 'none' });
      return Promise.reject(result);
    })
    .catch((err) => {
      uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
      return Promise.reject(err);
    });
}

module.exports = { call, isMock, FORCE_MOCK, UNICLOUD_ENV };
