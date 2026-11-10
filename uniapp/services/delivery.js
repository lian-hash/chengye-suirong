/**
 * 主线一·1.1 配送追踪封装（对应 delivery 云函数）
 */
const request = require('../utils/request');

/** 查询骑手实时位置 + 场地坐标 */
function track(orderId) {
  return request.call('delivery', 'track', { orderId });
}

module.exports = { track };
