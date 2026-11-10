// 优惠券管理（对应 coupon 云函数）
import { call } from '@/utils/request';

export function listCoupons(params = {}) {
  return call('coupon', 'list', params);
}
export function upsertCoupon(data) {
  return call('coupon', 'upsert', data);
}
export function setCouponShelf(data) {
  return call('coupon', 'setShelf', data);
}
