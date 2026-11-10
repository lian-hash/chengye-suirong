// 装备接口封装（对应 equipment 云函数）
import { call } from '@/utils/request';

export function equipmentList(params = {}) {
  return call('equipment', 'list', params);
}
export function disinfect(data) {
  return call('equipment', 'disinfect', data);
}
export function equipmentUpdate(data) {
  return call('equipment', 'update', data);
}
