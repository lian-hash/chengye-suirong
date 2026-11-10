/**
 * uniCloud 连接配置（C 端小程序统一配置入口）
 *
 * 说明：
 *  - 本文件是「是否走真实云服务」的唯一开关，main.js 与 utils/request.js 都从这里取值，
 *    不再各自硬编码 FORCE_MOCK / UNICLOUD_ENV。
 *  - 默认 FORCE_MOCK = true：无需云服务空间、无需 appid 即可离线编译与演示（课程答辩场景）。
 *  - 接入真实 uniCloud：把 CLIENT_SECRET 补齐 + 把 FORCE_MOCK 置 false 即可，业务代码零改动。
 */

/** 是否强制走本地 Mock 数据（默认 true：保持离线可跑） */
const FORCE_MOCK = true;

/** 云服务厂商：支付宝云（与 uniCloud/uniCloud.config.json 的 provider 一致） */
const PROVIDER = 'alipay';

/** uniCloud 服务空间 ID（与 uniCloud/uniCloud.config.json 的 spaceId 一致） */
const SPACE_ID = 'your-uni-cloud-space-id';

/**
 * 客户端密钥 clientSecret
 *
 * 获取路径：DCloud uniCloud 控制台 → 支付宝云服务空间（your-uni-cloud-space-id）
 *           → 空间详情 / 密钥管理 → 复制「AppKey」「AppSecret」填入下方。
 *
 * 留空表示尚未配置：main.js 会明确 warn「未配置 clientSecret，保持 Mock 模式」，
 * 且 utils/request.js 的 isMock() 会自动保持 true，不影响离线演示与编译。
 */
const CLIENT_SECRET = {
  appKey: '',
  appSecret: '',
};

/** 运行时标记：uniCloud.init() 是否已成功执行（由 main.js 回填） */
let _cloudReady = false;

/**
 * 是否已填写完整的 clientSecret
 * @returns {boolean}
 */
function hasClientSecret() {
  return !!(CLIENT_SECRET && CLIENT_SECRET.appKey && CLIENT_SECRET.appSecret);
}

/**
 * uniCloud 是否已完成初始化
 * @returns {boolean}
 */
function isCloudReady() {
  return _cloudReady;
}

/**
 * 回填初始化结果（仅 main.js 调用）
 * @param {boolean} ready 是否初始化成功
 * @returns {boolean}
 */
function setCloudReady(ready) {
  _cloudReady = !!ready;
  return _cloudReady;
}

/**
 * 是否处于 Mock 模式（唯一判定入口）
 * 满足任一条件即走 Mock：强制开关开启 / 空间 ID 缺失 / 密钥缺失 / 初始化未成功
 * @returns {boolean}
 */
function isMock() {
  return FORCE_MOCK || !SPACE_ID || !hasClientSecret() || !isCloudReady();
}

module.exports = {
  FORCE_MOCK,
  PROVIDER,
  SPACE_ID,
  CLIENT_SECRET,
  hasClientSecret,
  isCloudReady,
  setCloudReady,
  isMock,
};
