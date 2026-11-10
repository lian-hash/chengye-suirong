// 日志接口封装（对应 log 云函数）
import { call } from '@/utils/request';

export function logList(params = {}) {
  return call('log', 'list', params);
}
