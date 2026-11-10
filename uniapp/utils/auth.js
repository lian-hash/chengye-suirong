/**
 * 登录态管理（openid/role 存取 + 静默登录）
 * uni-app 端使用 uni.getStorageSync，不依赖 getApp().globalData。
 */
const request = require('./request');
const userStore = require('../store/user');

const STORAGE_ROLE = 'cy_role';
const STORAGE_USER = 'cy_user';

/** 读取本地缓存的角色 */
function getRole() {
  return uni.getStorageSync(STORAGE_ROLE) || '';
}

/** 读取本地缓存的用户信息 */
function getUserInfo() {
  return uni.getStorageSync(STORAGE_USER) || null;
}

/**
 * 写入登录态（同步 store + 本地缓存）
 * @param {object} param
 * @param {string} param.role
 * @param {object} [param.userInfo]
 */
function setAuth({ role, userInfo }) {
  if (role) uni.setStorageSync(STORAGE_ROLE, role);
  if (userInfo) uni.setStorageSync(STORAGE_USER, userInfo);
  userStore.setState({
    role: role || userStore.state.role,
    userInfo: userInfo || userStore.state.userInfo,
    loggedIn: true,
  });
}

/** 清除登录态 */
function clearAuth() {
  uni.removeStorageSync(STORAGE_ROLE);
  uni.removeStorageSync(STORAGE_USER);
  userStore.setState({ openid: '', role: '', userInfo: null, loggedIn: false });
}

/**
 * 静默登录：调用 login 云函数（Mock 模式下返回 mock 数据）
 * @returns {Promise<object>} { openid, role, nickname, isNew }
 */
function silentLogin() {
  return request.call('login', '', { code: 'mock' }).then((res) => {
    const d = res.data || {};
    setAuth({ role: d.role, userInfo: { nickname: d.nickname } });
    return d;
  });
}

module.exports = { getRole, getUserInfo, setAuth, clearAuth, silentLogin };
