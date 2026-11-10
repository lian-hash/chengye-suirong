/**
 * 小程序端 Mock 种子数据（对齐 §3.2 字段，保证离线可跑）
 * 与 uniCloud/cloudfunctions/initDB/seed.js 字段保持一致
 * 2026-11-04 扩展：场地坐标、套餐推荐字段、优惠券、攻略、晒单评价、配送中演示订单
 */

const packages = [
  {
    packageId: 'PKG001',
    name: '春日露营基础套餐',
    price: 199,
    items: '双人帐篷x1, 防潮垫x2, 营地灯x1, 折叠椅x2',
    seasonTheme: '春季',
    suitableFor: '情侣/双人',
    scene: '情侣',
    capacityPeople: 2,
    budgetTier: '经济',
    onShelf: true,
    bannerUrl: '',
    reservableStart: '2026-03-01',
    reservableEnd: '2026-05-31',
    equipRefs: [{ equipmentId: 'EQ001', qty: 1 }, { equipmentId: 'EQ002', qty: 2 }, { equipmentId: 'EQ003', qty: 1 }, { equipmentId: 'EQ007', qty: 2 }],
    setupTips: '1. 先搭外帐用地钉固定四角；2. 内帐挂入拉链闭合；3. 营地灯挂在帐杆中央。',
  },
  {
    packageId: 'PKG002',
    name: '夏日星空进阶套餐',
    price: 399,
    items: '双人帐篷x1, 天幕x1, 充气床垫x2',
    seasonTheme: '夏季',
    suitableFor: '情侣/好友',
    scene: '情侣',
    capacityPeople: 2,
    budgetTier: '中端',
    onShelf: true,
    bannerUrl: '',
    reservableStart: '2026-06-01',
    reservableEnd: '2026-08-31',
    equipRefs: [{ equipmentId: 'EQ001', qty: 1 }, { equipmentId: 'EQ004', qty: 1 }, { equipmentId: 'EQ005', qty: 2 }],
    setupTips: '1. 天幕选上风向展开，拉绳 45 度固定；2. 充气床垫睡前 10 分钟用脚踏泵充气。',
  },
  {
    packageId: 'PKG003',
    name: '秋日团建尊享套餐',
    price: 899,
    items: '大型帐篷x2, 长桌x3, 音响x1, 投影仪x1, 烤炉x2',
    seasonTheme: '秋季',
    suitableFor: '企业团建 8-12 人',
    scene: '团建',
    capacityPeople: 10,
    budgetTier: '高端',
    onShelf: false,
    bannerUrl: '',
    reservableStart: '2026-09-01',
    reservableEnd: '2026-11-30',
    equipRefs: [{ equipmentId: 'EQ006', qty: 2 }, { equipmentId: 'EQ008', qty: 3 }, { equipmentId: 'EQ009', qty: 1 }, { equipmentId: 'EQ010', qty: 1 }, { equipmentId: 'EQ011', qty: 2 }],
    setupTips: '1. 两顶大型帐篷背风摆放；2. 烤炉远离帐篷 3 米以上，备灭火器；3. 投影仪需夜间使用。',
  },
];

const sites = [
  {
    siteId: 'SITE001',
    name: '东湖绿道营地A区',
    address: '武汉市东湖生态旅游风景区绿道1号',
    capacity: 50,
    availableStatus: '可用',
    partner: '东湖文旅',
    latitude: 30.5528,
    longitude: 114.3886,
  },
  {
    siteId: 'SITE002',
    name: '梁子湖畔露营基地',
    address: '武汉市江夏区梁子湖风景区',
    capacity: 80,
    availableStatus: '可用',
    partner: '梁子湖度假区',
    latitude: 30.3456,
    longitude: 114.4289,
  },
  {
    siteId: 'SITE003',
    name: '马鞍山森林营地',
    address: '武汉市洪山区马鞍山森林公园',
    capacity: 30,
    availableStatus: '停用',
    partner: '森林公园管理处',
    latitude: 30.5389,
    longitude: 114.4392,
  },
];

const equipments = [
  { equipmentId: 'EQ001', name: '双人帐篷', totalQty: 100, availableQty: 100, warnThreshold: 20, status: '可用', disinfectStatus: '已消杀', usedCount: 0 },
  { equipmentId: 'EQ002', name: '防潮垫', totalQty: 200, availableQty: 200, warnThreshold: 40, status: '可用', disinfectStatus: '已消杀', usedCount: 0 },
  { equipmentId: 'EQ003', name: '营地灯', totalQty: 150, availableQty: 150, warnThreshold: 30, status: '可用', disinfectStatus: '已消杀', usedCount: 0 },
  { equipmentId: 'EQ004', name: '天幕', totalQty: 60, availableQty: 60, warnThreshold: 15, status: '可用', disinfectStatus: '已消杀', usedCount: 0 },
  { equipmentId: 'EQ005', name: '充气床垫', totalQty: 120, availableQty: 120, warnThreshold: 25, status: '可用', disinfectStatus: '已消杀', usedCount: 0 },
  { equipmentId: 'EQ006', name: '大型帐篷', totalQty: 40, availableQty: 40, warnThreshold: 10, status: '可用', disinfectStatus: '已消杀', usedCount: 0 },
  { equipmentId: 'EQ007', name: '折叠椅', totalQty: 80, availableQty: 80, warnThreshold: 15, status: '可用', disinfectStatus: '已消杀', usedCount: 0 },
  { equipmentId: 'EQ008', name: '长桌', totalQty: 30, availableQty: 30, warnThreshold: 8, status: '可用', disinfectStatus: '已消杀', usedCount: 0 },
  { equipmentId: 'EQ009', name: '音响', totalQty: 20, availableQty: 20, warnThreshold: 5, status: '可用', disinfectStatus: '已消杀', usedCount: 0 },
  { equipmentId: 'EQ010', name: '投影仪', totalQty: 15, availableQty: 15, warnThreshold: 4, status: '可用', disinfectStatus: '已消杀', usedCount: 0 },
  { equipmentId: 'EQ011', name: '烤炉', totalQty: 25, availableQty: 25, warnThreshold: 6, status: '可用', disinfectStatus: '已消杀', usedCount: 0 },
];

// 预置订单：一条已完成（演示评价闭环）、一条配送中（演示配送追踪）
const orders = [
  {
    orderId: 'ORD_SEED_001',
    userId: 'mock_openid_001',
    packageId: 'PKG001',
    siteId: 'SITE001',
    useDate: '2026-04-05',
    quantity: 1,
    orderStatus: '已完成',
    payStatus: '已支付',
    amount: 199,
    contactName: '示例用户',
    contactPhone: '13800000001',
    isBatch: false,
    createTime: '2026-04-01T10:00:00.000Z',
    payTime: '2026-04-01T10:05:00.000Z',
    couponId: '',
    pointsUsed: 0,
  },
  {
    orderId: 'ORD_SEED_002',
    userId: 'mock_openid_001',
    packageId: 'PKG002',
    siteId: 'SITE002',
    useDate: '2026-11-08',
    quantity: 1,
    orderStatus: '配送中',
    payStatus: '已支付',
    amount: 399,
    contactName: 'lian-hash',
    contactPhone: '13800000002',
    isBatch: false,
    createTime: '2026-11-04T09:00:00.000Z',
    payTime: '2026-11-04T09:12:00.000Z',
    couponId: 'CP_NEW20',
    pointsUsed: 0,
    // 配送中演示字段：骑手当前位置（相对场地的偏移，用于地图点位演示）
    rider: {
      name: '骑手小李',
      phone: '13800001111',
      plate: '鄂A·D8888',
      etaMinutes: 25,
      // 模拟骑手当前坐标（梁子湖营地附近）
      latitude: 30.3489,
      longitude: 114.4235,
      updatedAt: '2026-11-04T10:30:00.000Z',
    },
  },
];

// 优惠券种子：新人立减 20、满 300 减 50、团建满 800 减 120
const coupons = [
  { couponId: 'CP_NEW20', name: '新人立减券', type: 'fixed', value: 20, threshold: 0, validFrom: '2026-01-01', validTo: '2026-12-31', stock: 999, claimed: 0, desc: '新用户注册即领，无门槛抵扣 20 元' },
  { couponId: 'CP_FULL50', name: '满 300 减 50', type: 'fixed', value: 50, threshold: 300, validFrom: '2026-01-01', validTo: '2026-12-31', stock: 500, claimed: 0, desc: '订单满 300 元可用' },
  { couponId: 'CP_TEAM120', name: '团建满 800 减 120', type: 'fixed', value: 120, threshold: 800, validFrom: '2026-09-01', validTo: '2026-11-30', stock: 100, claimed: 0, desc: '企业团建套餐专享' },
];

// 用户已领券（mock 内存）：新用户默认发一张新人券
const userCoupons = [
  { couponId: 'CP_NEW20', status: '未使用', claimTime: '2026-11-04T09:00:00.000Z' },
];

// 攻略种子：挂在场地下
const guides = [
  {
    guideId: 'G001',
    siteId: 'SITE001',
    title: '东湖绿道半日露营攻略',
    cover: '🌿',
    author: '城野小助手',
    publishTime: '2026-04-10',
    content: '推荐周五傍晚到场，日落方向朝东，适合拍星空。营地旁 500 米有便利店。',
    tags: ['新手友好', '看日落'],
  },
  {
    guideId: 'G002',
    siteId: 'SITE002',
    title: '梁子湖钓鱼 + 露营全攻略',
    cover: '🎣',
    author: '老陈',
    publishTime: '2026-07-15',
    content: '湖边可钓鱼，装备需自备钓竿。夏季傍晚蚊虫多，建议带驱蚊水。',
    tags: ['钓鱼', '夏季'],
  },
];

// 晒单评价种子（带图，mock 图为纯色块占位）
const seedReviews = [
  {
    reviewId: 'REV_SEED_001',
    orderId: 'ORD_SEED_001',
    packageId: 'PKG001',
    siteId: 'SITE001',
    userId: 'mock_openid_001',
    nickname: '星星眼',
    avatar: '🌟',
    score: 5,
    content: '帐篷很好搭，营地灯氛围绝了，下次还来！',
    images: [],
    emoji: '⛺',
    createTime: '2026-04-06T08:00:00.000Z',
    likes: 12,
  },
];

// 用户积分账户
const userAccount = {
  userId: 'mock_openid_001',
  nickname: '微信用户',
  points: 500,
  totalPointsEarned: 500,
};

module.exports = {
  packages,
  sites,
  equipments,
  orders,
  coupons,
  userCoupons,
  guides,
  seedReviews,
  userAccount,
};
