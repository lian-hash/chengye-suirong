// 订单接口封装（对应 order 云函数）
import { call } from '@/utils/request';

export function orderList(params = {}) {
  return call('order', 'list', params);
}
export function orderDetail(orderId) {
  return call('order', 'detail', { orderId });
}
export function orderCancel(data) {
  return call('order', 'cancel', data);
}
export function orderRefund(data) {
  return call('order', 'refund', data);
}
export function batchCreate(data) {
  return call('order', 'batchCreate', data);
}
