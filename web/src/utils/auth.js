/**
 * JWT 存取 + 过期校验（Web 端）
 */
const TOKEN_KEY = 'cy_web_token';
const ROLE_KEY = 'cy_web_role';
const USER_KEY = 'cy_web_user';

/** 读取 JWT */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

/** 写入 JWT */
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

/** 读取角色 */
export function getRole() {
  return localStorage.getItem(ROLE_KEY) || '';
}

/** 写入角色 */
export function setRole(role) {
  if (role) localStorage.setItem(ROLE_KEY, role);
}

/** 写入登录态 */
export function setAuth({ token, role, username }) {
  setToken(token);
  setRole(role);
  if (username) localStorage.setItem(USER_KEY, username);
}

/** 清除登录态 */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * 校验 JWT 是否过期（解析 payload.exp）
 * @returns {boolean} true 表示已过期或无效
 */
export function isTokenExpired() {
  const token = getToken();
  if (!token) return true;
  try {
    const payload = JSON.parse(decodeURIComponent(escape(window.atob(token.split('.')[1]))));
    if (payload.exp && Date.now() >= payload.exp * 1000) return true;
    return false;
  } catch (e) {
    return true;
  }
}
