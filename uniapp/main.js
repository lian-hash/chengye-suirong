import Vue from 'vue';
import App from './App';
import unicloudConfig from './config/unicloud';

Vue.config.productionTip = false;
App.mpType = 'app';

/**
 * uniCloud 客户端初始化
 *
 * 背景：vue-cli（非 HBuilderX）方式编译的 uni-app 不会自动初始化 uniCloud，
 * 必须先调用 uniCloud.init() 传入 clientSecret，否则真实模式下 uniCloud.callFunction 会报错。
 *
 * 策略（默认 Mock 可跑，配置不完整时明确 warn 而不是静默失败）：
 *  1. FORCE_MOCK = true  → 保持 Mock 模式，不初始化
 *  2. 未配置 clientSecret → warn「未配置 clientSecret，保持 Mock 模式」后保持 Mock
 *  3. 配置完整 → uniCloud.init()，成功后置 cloudReady = true，request.js 自动切到真实模式
 *
 * @returns {boolean} 是否成功进入真实云模式
 */
function initUniCloud() {
  const { FORCE_MOCK, PROVIDER, SPACE_ID, CLIENT_SECRET } = unicloudConfig;

  if (FORCE_MOCK) {
    console.log('[城野随行] Mock 模式已开启（config/unicloud.js → FORCE_MOCK = true），云函数走本地 mock/index.js');
    unicloudConfig.setCloudReady(false);
    return false;
  }

  if (!unicloudConfig.hasClientSecret()) {
    console.warn('[城野随行] 未配置 clientSecret，保持 Mock 模式。请在 config/unicloud.js 的 CLIENT_SECRET 中填入 uniCloud 控制台（支付宝云空间 → 空间详情/密钥管理）的 AppKey 与 AppSecret。');
    unicloudConfig.setCloudReady(false);
    return false;
  }

  if (typeof uniCloud === 'undefined' || typeof uniCloud.init !== 'function') {
    console.warn('[城野随行] 当前环境不存在 uniCloud.init，保持 Mock 模式（请确认使用 mp-weixin 平台编译）');
    unicloudConfig.setCloudReady(false);
    return false;
  }

  try {
    uniCloud.init({
      provider: PROVIDER,
      spaceId: SPACE_ID,
      clientSecret: CLIENT_SECRET,
    });
    unicloudConfig.setCloudReady(true);
    console.log('[城野随行] uniCloud 初始化成功 →', PROVIDER, SPACE_ID);
    return true;
  } catch (err) {
    console.error('[城野随行] uniCloud 初始化失败，回退 Mock 模式 →', err);
    unicloudConfig.setCloudReady(false);
    return false;
  }
}

initUniCloud();

// 便于页面调试：this.$cloudMode = 'mock' | 'cloud'
Vue.prototype.$cloudMode = unicloudConfig.isMock() ? 'mock' : 'cloud';

const app = new Vue({
  ...App,
});
app.$mount();
