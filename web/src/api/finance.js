// 财务接口封装（对应 finance 云函数）
import { call } from '@/utils/request';

export function financeStats(params = {}) {
  return call('finance', 'stats', params);
}
