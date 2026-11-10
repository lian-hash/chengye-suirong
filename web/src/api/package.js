// 套餐 / 场地 接口封装（对应 packageSite 云函数）
import { call } from '@/utils/request';

export function listPackages(params = {}) {
  return call('packageSite', 'listPackages', params);
}
export function getPackage(packageId) {
  return call('packageSite', 'getPackage', { packageId });
}
export function upsertPackage(data) {
  return call('packageSite', 'upsertPackage', data);
}
export function setShelf(data) {
  return call('packageSite', 'setShelf', data);
}
export function siteList(params = {}) {
  return call('packageSite', 'siteList', params);
}
export function upsertSite(data) {
  return call('packageSite', 'upsertSite', data);
}
