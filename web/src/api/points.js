// 积分管理（对应 points 云函数）
import { call } from '@/utils/request';

export function listPoints(params = {}) {
  return call('points', 'list', params);
}
export function listPointsLogs(params = {}) {
  return call('points', 'logs', params);
}
export function grantPoints(data) {
  return call('points', 'grant', data);
}
