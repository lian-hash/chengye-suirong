/**
 * 主线三·3.2 积分封装
 */
const request = require('../utils/request');

/** 查询积分账户 */
function get() {
  return request.call('points', 'get', {});
}

module.exports = { get };
