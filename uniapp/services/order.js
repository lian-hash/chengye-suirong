/**
 * 订单域封装（对应 order 云函数）：创建/支付/查询/详情/时间线/改期/续租
 */
const request = require('../utils/request');

/** 创建订单 P3.1 */
function create(payload) {
  return request.call('order', 'create', payload);
}

/** 模拟支付 P3.2 */
function pay(payload) {
  return request.call('order', 'pay', payload);
}

/** 订单列表 P3.5 */
function list(payload = {}) {
  return request.call('order', 'list', payload);
}

/** 订单详情 */
function detail(orderId) {
  return request.call('order', 'detail', { orderId });
}

/** 订单状态时间线（7 态）P3.3 */
function track(orderId) {
  return request.call('order', 'track', { orderId });
}

/** C 端取消订单（待支付/已支付，本人） */
function cancel(orderId) {
  return request.call('order', 'cancel', { orderId });
}

/** C 端申请退款（已支付，本人） */
function refund(orderId) {
  return request.call('order', 'refund', { orderId });
}

/** 主线一·1.2 改期：已支付未配送订单改使用日期 */
function reschedule(orderId, useDate) {
  return request.call('order', 'reschedule', { orderId, useDate });
}

/** 主线一·1.2 续租：使用中订单续租 N 天 */
function renew(orderId, days) {
  return request.call('order', 'renew', { orderId, days });
}

module.exports = { create, pay, list, detail, track, cancel, refund, reschedule, renew };
