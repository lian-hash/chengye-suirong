/**
 * Axios 封装（Web 端）
 * 统一暴露 call(fn, action, data)
 *  - Mock 模式：返回本地数据（src/utils/mock.js），保证离线可跑
 *  - 真实模式：带 JWT POST 到 uniCloud URL 化路由（每个云函数是独立 URL，
 *    baseURL 末尾带 /http/，POST 路径为云函数名 fn，body 携带 {action, ...data}）
 *  - 响应统一处理 {code,message,data}
 *
 * 「是否 Mock」与「后端基地址」不再写死，统一由 src/config/backend.js 管理，
 * 切换方式见该文件或 web/.env.example。
 */
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { getToken, isTokenExpired } from './auth';
import { mockHandle } from './mock';
import { FORCE_MOCK, IS_PLACEHOLDER_BASE, REQUEST_TIMEOUT, UNICLOUD_HTTP_BASE } from '@/config/backend';

const service = axios.create({
  baseURL: UNICLOUD_HTTP_BASE,
  timeout: REQUEST_TIMEOUT,
});

// 一次性提示：真实模式下地址仍是占位符时，明确告知配置缺失
if (!FORCE_MOCK && IS_PLACEHOLDER_BASE) {
  console.warn(
    '[request] 已关闭 Mock，但 UNICLOUD_HTTP_BASE 仍是占位地址。' +
      '请在 web/.env.local 配置 VITE_UNICLOUD_HTTP_BASE，' +
      '或修改 web/src/config/backend.js 的 DEFAULT_HTTP_BASE。'
  );
}

// 请求拦截：自动带 JWT（Bearer <token>）
service.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && !isTokenExpired()) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截：统一处理 {code,message,data}
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res && res.code === 0) return res;
    ElMessage.error((res && res.message) || '请求失败');
    return Promise.reject(res);
  },
  (error) => {
    ElMessage.error('网络错误，请稍后重试');
    return Promise.reject(error);
  }
);

/**
 * 统一调用（对齐 uniCloud 云函数 action 语义）
 * @param {string} fn 云函数名（如 webLogin/order/packageSite/delivery...）
 * @param {string} action 动作（小驼峰，如 login/listPackages/dispatch）
 * @param {object} data 业务参数
 * @returns {Promise<{code:number,message:string,data:*}>}
 */
export async function call(fn, action, data = {}) {
  if (FORCE_MOCK) {
    // Mock 模式：以 `${fn}.${action}` 复合键路由
    return mockHandle(fn, action, data);
  }
  // 真实模式：POST 到云函数独立 URL，body 携带 {action, ...data}
  return service.post(fn, { action, ...data });
}

export default call;
