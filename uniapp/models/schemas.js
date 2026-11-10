/**
 * 集合字段常量（与 D1–D8 对齐，便于前后端校验/对齐）
 * 命名：集合名复数小写下划线
 */

const COLLECTIONS = [
  'users',
  'packages',
  'sites',
  'orders',
  'equipments',
  'deliveries',
  'reviews',
  'logs',
];

const SCHEMAS = {
  users: ['userId', 'nickname', 'role', 'phone', 'registerTime'],
  packages: [
    'packageId',
    'name',
    'price',
    'items',
    'seasonTheme',
    'onShelf',
    'bannerUrl',
    'reservableStart',
    'reservableEnd',
    'equipRefs',
  ],
  sites: ['siteId', 'name', 'address', 'capacity', 'availableStatus', 'partner'],
  orders: [
    'orderId',
    'userId',
    'packageId',
    'siteId',
    'useDate',
    'quantity',
    'orderStatus',
    'payStatus',
    'amount',
    'contactName',
    'contactPhone',
    'isBatch',
    'createTime',
    'payTime',
  ],
  equipments: [
    'equipmentId',
    'name',
    'totalQty',
    'availableQty',
    'warnThreshold',
    'status',
    'disinfectStatus',
    'lastDisinfectTime',
    'usedCount',
  ],
  deliveries: ['deliveryId', 'orderId', 'opType', 'opTime', 'operator'],
  reviews: ['reviewId', 'orderId', 'userId', 'score', 'content', 'reviewTime'],
  logs: ['logId', 'operator', 'opType', 'opTarget', 'opContent', 'opResult', 'opTime'],
};

module.exports = { COLLECTIONS, SCHEMAS };
