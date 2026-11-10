// 配送接口封装（对应 delivery 云函数）
import { call } from '@/utils/request';

export function deliveryList(params = {}) {
  return call('delivery', 'list', params);
}
export function dispatch(data) {
  return call('delivery', 'dispatch', data);
}
export function setup(data) {
  return call('delivery', 'setup', data);
}
export function recover(data) {
  return call('delivery', 'recover', data);
}
