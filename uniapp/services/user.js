/**
 * 用户域接口封装（对应 user 云函数）
 */
const request = require('../utils/request');

/** 获取当前用户信息（角色/昵称） */
function getInfo() {
  return request.call('user', 'getUserInfo', {});
}

module.exports = { getInfo };
