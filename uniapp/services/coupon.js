/**
 * 主线三·3.1 优惠券封装
 */
const request = require('../utils/request');

/** 可领取券列表 */
function listAvailable() {
  return request.call('coupon', 'listAvailable', {});
}

/** 我的券包 */
function my() {
  return request.call('coupon', 'my', {});
}

/** 领取券 */
function claim(couponId) {
  return request.call('coupon', 'claim', { couponId });
}

module.exports = { listAvailable, my, claim };
