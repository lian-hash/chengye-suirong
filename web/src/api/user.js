// 用户接口封装（对应 user 云函数）
import { call } from '@/utils/request';

export function userList(params = {}) {
  return call('user', 'list', params);
}
export function updateRole(data) {
  return call('user', 'updateRole', data);
}
