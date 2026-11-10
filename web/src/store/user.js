/**
 * 当前用户态（Pinia）：JWT / 角色 / 用户名
 */
import { defineStore } from 'pinia';
import { getToken, getRole, setAuth as setLocalAuth, clearAuth as clearLocalAuth } from '@/utils/auth';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    role: getRole() || '',
    username: '',
    userInfo: null,
  }),
  getters: {
    isAdmin: (state) => state.role === '管理员',
    isEnterprise: (state) => state.role === 'B端',
    isLoggedIn: (state) => !!state.token,
  },
  actions: {
    setAuth({ token, role, username, userInfo }) {
      this.token = token || '';
      this.role = role || '';
      this.username = username || '';
      this.userInfo = userInfo || null;
      setLocalAuth({ token: this.token, role: this.role, username: this.username });
    },
    logout() {
      clearLocalAuth();
      this.token = '';
      this.role = '';
      this.username = '';
      this.userInfo = null;
    },
  },
});
