/**
 * 后端连接配置（Web 管理后台）
 * ==================================================
 *
 * 本文件是「是否使用 Mock 数据」与「uniCloud URL 化基地址」的**唯一配置源**，
 * web/src/utils/request.js 从这里读取，不再写死常量。
 *
 * 读取优先级（高 → 低）
 * --------------------
 *   1. Vite 环境变量（.env / .env.local / 系统环境变量，需 VITE_ 前缀）
 *        VITE_UNICLOUD_HTTP_BASE   uniCloud URL 化基地址
 *        VITE_FORCE_MOCK           是否强制走 Mock（'true'/'false'）
 *        VITE_REQUEST_TIMEOUT      请求超时（毫秒，可选）
 *   2. 本文件顶部的 DEFAULT_* / FALLBACK_* 常量
 *
 * 如何切换到真实后端（部署后执行）
 * ------------------------------
 *   方式 A（推荐，不入库）：在 web/ 目录新建 `.env.local`，写入
 *        VITE_FORCE_MOCK=false
 *        VITE_UNICLOUD_HTTP_BASE=https://<你的空间域名>/http/
 *     然后重启 `npm run dev`（Vite 环境变量改动必须重启才生效）。
 *
 *   方式 B（改默认值）：直接修改本文件的 `FALLBACK_FORCE_MOCK = false`，
 *     并把 `DEFAULT_HTTP_BASE` 换成真实地址。适合交付演示、
 *     不方便使用 .env 的场景；注意这会进版本库。
 *
 * ⚠️ 默认仍为 FORCE_MOCK = true（离线可跑、演示不依赖后端）。
 *    只有在云函数已上传、集合已建、URL 化已开之后才切换为 false。
 */

/** Vite 环境变量 key（必须以 VITE_ 开头才会被暴露到客户端） */
const ENV_KEY_BASE = 'VITE_UNICLOUD_HTTP_BASE';
const ENV_KEY_MOCK = 'VITE_FORCE_MOCK';
const ENV_KEY_TIMEOUT = 'VITE_REQUEST_TIMEOUT';

/**
 * 默认 uniCloud URL 化基地址占位符。
 * 必须以 `/http/` 结尾：call(fn, ...) 会 POST 到 `基地址 + 云函数名`。
 * 真实地址形如 `https://xxxxxxxx.service.tcloudbase.com/http/`
 * （路径以 uniCloud 控制台「云函数 → URL 化」实际给出的为准）。
 */
const DEFAULT_HTTP_BASE = 'https://<你的空间域名>/http/';

/** 未读到环境变量时，是否强制 Mock（默认 true：离线可跑） */
const FALLBACK_FORCE_MOCK = true;

/** 未读到环境变量时的请求超时（毫秒） */
const FALLBACK_TIMEOUT = 8000;

/** 明确判定为「占位/无效」的基地址值：读到就回退到默认值 */
const PLACEHOLDER_PATTERNS = [
  '<你的空间域名>',
  'your-uni-cloud-http-api.example.com',
  'example.com',
];

/**
 * 安全读取 Vite 环境变量集合。
 * 在非 Vite 环境（如 Node 侧工具、单元测试）中 `import.meta.env` 可能不存在，
 * 这里做兜底，返回空对象而不是抛错。
 *
 * @returns {Record<string, string|boolean|undefined>} 环境变量字典
 */
function readViteEnv() {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env;
    }
  } catch (error) {
    // ignore：部分打包/测试环境下访问 import.meta.env 可能抛错
  }
  return {};
}

/**
 * 读取字符串型环境变量并做去空白处理。
 *
 * @param {Record<string, *>} env 环境变量字典
 * @param {string} key 变量名
 * @returns {string} 变量值，不存在时返回空串
 */
function readString(env, key) {
  const value = env[key];
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

/**
 * 解析布尔型环境变量。
 * 支持 'true'/'1'/'yes'/'on' 与 'false'/'0'/'no'/'off'（不区分大小写）。
 *
 * @param {Record<string, *>} env 环境变量字典
 * @param {string} key 变量名
 * @param {boolean} fallback 未配置或无法解析时的默认值
 * @returns {boolean} 解析结果
 */
function readBool(env, key, fallback) {
  const raw = readString(env, key).toLowerCase();
  if (!raw) return fallback;
  if (['true', '1', 'yes', 'on'].includes(raw)) return true;
  if (['false', '0', 'no', 'off'].includes(raw)) return false;
  return fallback;
}

/**
 * 解析正整数型环境变量。
 *
 * @param {Record<string, *>} env 环境变量字典
 * @param {string} key 变量名
 * @param {number} fallback 未配置或非法时的默认值
 * @returns {number} 正整数毫秒值
 */
function readInt(env, key, fallback) {
  const raw = readString(env, key);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

/**
 * 规范化 URL 化基地址：
 *  - 去掉结尾多余斜杠，再补且仅补一个 `/`
 *  - 若读到占位符地址，回退到默认占位地址
 *
 * @param {string} raw 原始地址
 * @returns {string} 以单个 `/` 结尾的基地址
 */
function normalizeBase(raw) {
  const value = String(raw || '').trim();
  if (!value) return DEFAULT_HTTP_BASE;
  if (PLACEHOLDER_PATTERNS.some((pattern) => value.includes(pattern))) {
    return DEFAULT_HTTP_BASE;
  }
  return value.replace(/\/+$/, '') + '/';
}

const ENV = readViteEnv();

/**
 * uniCloud URL 化（HTTP 触发）基地址。
 * call(fn, action, data) 会 POST 到 `${UNICLOUD_HTTP_BASE}${fn}`。
 * @type {string}
 */
export const UNICLOUD_HTTP_BASE = normalizeBase(readString(ENV, ENV_KEY_BASE));

/**
 * 是否强制走本地 Mock（true = 不请求网络，直接用 src/utils/mock.js）。
 * @type {boolean}
 */
export const FORCE_MOCK = readBool(ENV, ENV_KEY_MOCK, FALLBACK_FORCE_MOCK);

/**
 * 请求超时时间（毫秒）。
 * @type {number}
 */
export const REQUEST_TIMEOUT = readInt(ENV, ENV_KEY_TIMEOUT, FALLBACK_TIMEOUT);

/**
 * 当前基地址是否仍是未替换的占位地址。
 * 真实模式下若为 true，说明环境变量没配上，request.js 会给出明确提示。
 * @type {boolean}
 */
export const IS_PLACEHOLDER_BASE = UNICLOUD_HTTP_BASE === DEFAULT_HTTP_BASE;

/** 环境变量 key 常量，便于调试与外部复用 */
export const ENV_KEYS = {
  base: ENV_KEY_BASE,
  mock: ENV_KEY_MOCK,
  timeout: ENV_KEY_TIMEOUT,
};

export default {
  UNICLOUD_HTTP_BASE,
  FORCE_MOCK,
  REQUEST_TIMEOUT,
  IS_PLACEHOLDER_BASE,
  ENV_KEYS,
};
