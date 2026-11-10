/**
 * 套餐/场地/攻略查询封装（对应 packageSite 云函数）
 */
const request = require('../utils/request');

/** 前台套餐列表（自动过滤上架套餐 + 可用场地） */
function listPackages(params = {}) {
  return request.call('packageSite', 'listPackages', params);
}

/** 套餐详情 */
function getPackage(packageId) {
  return request.call('packageSite', 'getPackage', { packageId });
}

/** 主线二·2.2 营地攻略列表（可按 siteId 过滤） */
function listGuides(siteId) {
  return request.call('packageSite', 'listGuides', siteId ? { siteId } : {});
}

module.exports = { listPackages, getPackage, listGuides };
