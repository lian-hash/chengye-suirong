/**
 * 主线四·4.2 天气封装（mock）
 */
const request = require('../utils/request');

/** 按日期查询天气与出行提醒 */
function get(date) {
  return request.call('weather', 'get', { date });
}

module.exports = { get };
