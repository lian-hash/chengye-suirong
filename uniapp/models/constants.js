/**
 * 前后端共享语义的枚举常量（与云函数 common/authGuard.ROLES 对齐）
 */

/** 角色 */
const ROLE = {
  C: 'C端',
  B: 'B端',
  ADMIN: '管理员',
};

/** 订单状态机（7 态 + 已取消，见 §3.2） */
const ORDER_STATUS = {
  PENDING_PAY: '待支付',
  PAID: '已支付',
  DELIVERING: '配送中',
  SETTING_UP: '布置中',
  IN_USE: '使用中',
  RECOVERED: '已回收',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

/** 订单状态流转顺序（用于前端时间线展示，裁决仍在云函数） */
const ORDER_STATUS_FLOW = [
  ORDER_STATUS.PENDING_PAY,
  ORDER_STATUS.PAID,
  ORDER_STATUS.DELIVERING,
  ORDER_STATUS.SETTING_UP,
  ORDER_STATUS.IN_USE,
  ORDER_STATUS.RECOVERED,
  ORDER_STATUS.COMPLETED,
];

/** 支付状态 */
const PAY_STATUS = {
  UNPAID: '未支付',
  PAID: '已支付',
  REFUNDED: '已退款',
};

/** 场地状态 */
const SITE_STATUS = {
  AVAILABLE: '可用',
  DISABLED: '停用',
};

/** 装备状态 */
const EQUIP_STATUS = {
  AVAILABLE: '可用',
  MAINTENANCE: '维修中',
  SCRAPPED: '已报废',
};

/** 配送操作类型（delivery 云函数 opType） */
const DELIVERY_OP = {
  DISPATCH: '配送',
  SETUP: '布置',
  RECOVER: '回收',
};

module.exports = {
  ROLE,
  ORDER_STATUS,
  ORDER_STATUS_FLOW,
  PAY_STATUS,
  SITE_STATUS,
  EQUIP_STATUS,
  DELIVERY_OP,
};
