/**
 * 通用工具：日期/金额/状态文案映射
 */
const { ORDER_STATUS, PAY_STATUS, SITE_STATUS } = require('../models/constants');

/**
 * 简单日期格式化
 * @param {Date|string|number} date
 * @param {string} fmt 形如 'YYYY-MM-DD HH:mm'
 * @returns {string}
 */
function formatDate(date, fmt = 'YYYY-MM-DD') {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  const map = {
    YYYY: d.getFullYear(),
    MM: pad(d.getMonth() + 1),
    DD: pad(d.getDate()),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
  };
  return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, (k) => map[k]);
}

/** 金额格式化：¥199.00 */
function formatMoney(num) {
  const n = Number(num) || 0;
  return '¥' + n.toFixed(2);
}

/** 订单状态文案 */
function orderStatusText(status) {
  return ORDER_STATUS[status] || status || '';
}

/** 支付状态文案 */
function payStatusText(status) {
  return PAY_STATUS[status] || status || '';
}

/** 场地状态文案 */
function siteStatusText(status) {
  return SITE_STATUS[status] || status || '';
}

/**
 * 订单状态 → 徽章样式类（纯展示映射，贯穿订单列表/详情/时间线，保证多页一致）
 * 待支付=橙、已支付=蓝、配送中/布置中/使用中=主色浅底、已回收/已完成=绿、已取消=灰
 * @param {string} status 订单状态
 * @returns {string} 形如 'badge badge-orange'
 */
function orderStatusClass(status) {
  const MAP = {
    [ORDER_STATUS.PENDING_PAY]: 'badge badge-orange',
    [ORDER_STATUS.PAID]: 'badge badge-blue',
    [ORDER_STATUS.DELIVERING]: 'badge badge-primary',
    [ORDER_STATUS.SETTING_UP]: 'badge badge-primary',
    [ORDER_STATUS.IN_USE]: 'badge badge-primary',
    [ORDER_STATUS.RECOVERED]: 'badge badge-green',
    [ORDER_STATUS.COMPLETED]: 'badge badge-green',
    [ORDER_STATUS.CANCELLED]: 'badge badge-gray',
  };
  return MAP[status] || 'badge badge-gray';
}

/**
 * 支付状态 → 徽章样式类
 * @param {string} status 支付状态
 * @returns {string}
 */
function payStatusClass(status) {
  const MAP = {
    [PAY_STATUS.UNPAID]: 'badge badge-orange',
    [PAY_STATUS.PAID]: 'badge badge-green',
    [PAY_STATUS.REFUNDED]: 'badge badge-gray',
  };
  return MAP[status] || 'badge badge-gray';
}

/**
 * 场地状态 → 徽章样式类（可用=绿，停用/其他=灰）
 * @param {string} status 场地状态
 * @returns {string}
 */
function siteStatusClass(status) {
  return status === SITE_STATUS.AVAILABLE ? 'badge badge-green' : 'badge badge-gray';
}

/**
 * 季节主题 → 封面渐变背景（套餐卡片图片占位，bannerUrl 接入后可直接换真图）
 * @param {string} seasonTheme 季节主题（春季/夏季/秋季/冬季）
 * @returns {string} CSS background 值
 */
function seasonGradient(seasonTheme) {
  const MAP = {
    春季: 'linear-gradient(135deg, #66BB6A 0%, #A5D6A7 100%)',
    夏季: 'linear-gradient(135deg, #2E7D32 0%, #66BB6A 100%)',
    秋季: 'linear-gradient(135deg, #FF8F3F 0%, #FFB74D 100%)',
    冬季: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
  };
  return MAP[seasonTheme] || 'linear-gradient(135deg, #43A047 0%, #66BB6A 100%)';
}

/**
 * 季节主题 → 装饰 emoji（封面占位元素）
 * @param {string} seasonTheme 季节主题
 * @returns {string}
 */
function seasonEmoji(seasonTheme) {
  const MAP = { 春季: '🌸', 夏季: '🏕️', 秋季: '🍁', 冬季: '❄️' };
  return MAP[seasonTheme] || '⛺';
}

module.exports = {
  formatDate,
  formatMoney,
  orderStatusText,
  payStatusText,
  siteStatusText,
  orderStatusClass,
  payStatusClass,
  siteStatusClass,
  seasonGradient,
  seasonEmoji,
};
