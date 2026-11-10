// 晒单管理（对应 feed 云函数）
import { call } from '@/utils/request';

export function listFeeds(params = {}) {
  return call('feed', 'list', params);
}
export function removeFeed(data) {
  return call('feed', 'remove', data);
}
export function toggleFeed(data) {
  return call('feed', 'toggle', data);
}
