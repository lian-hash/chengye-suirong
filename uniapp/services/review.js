/**
 * 评价封装（对应 order/submitReview P3.4 + review/list 晒单广场）
 */
const request = require('../utils/request');

/** 提交评价（支持 images 数组） */
function submit(payload) {
  return request.call('order', 'submitReview', payload);
}

/** 主线二·2.1 晒单广场列表（可按 packageId/siteId 过滤） */
function list(params = {}) {
  return request.call('review', 'list', params);
}

/** 点赞 */
function like(reviewId) {
  return request.call('review', 'like', { reviewId });
}

module.exports = { submit, list, like };
