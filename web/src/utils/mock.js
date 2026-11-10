/**
 * Web 端 Mock 数据（离线可跑，对齐 §3.2 / §3.3）
 * call 在 Mock 模式下调用本模块：mockHandle(fn, action, data)
 * 使用复合键 `${fn}.${action}` 做 switch（多个 fn 都用 list/detail，不能只按 action 区分）
 * 写动作会就地修改内存数组，保证交互（新增/编辑/上下架/推进/消杀/退款等）在 Mock 下可视。
 */

let packages = [
  { packageId: 'PKG001', name: '春日露营基础套餐', price: 199, items: '双人帐篷x1, 防潮垫x2, 营地灯x1, 折叠椅x2', seasonTheme: '春季', onShelf: true, bannerUrl: '', reservableStart: '2026-03-01', reservableEnd: '2026-05-31', equipRefs: [{ equipmentId: 'EQ001', qty: 1 }, { equipmentId: 'EQ002', qty: 2 }, { equipmentId: 'EQ003', qty: 1 }, { equipmentId: 'EQ007', qty: 2 }] },
  { packageId: 'PKG002', name: '夏日星空进阶套餐', price: 399, items: '双人帐篷x1, 天幕x1, 充气床垫x2', seasonTheme: '夏季', onShelf: true, bannerUrl: '', reservableStart: '2026-06-01', reservableEnd: '2026-08-31', equipRefs: [{ equipmentId: 'EQ001', qty: 1 }, { equipmentId: 'EQ004', qty: 1 }, { equipmentId: 'EQ005', qty: 2 }] },
  { packageId: 'PKG003', name: '秋日团建尊享套餐', price: 899, items: '大型帐篷x2, 长桌x3, 音响x1, 投影仪x1, 烤炉x2', seasonTheme: '秋季', onShelf: false, bannerUrl: '', reservableStart: '2026-09-01', reservableEnd: '2026-11-30', equipRefs: [{ equipmentId: 'EQ006', qty: 2 }, { equipmentId: 'EQ008', qty: 3 }, { equipmentId: 'EQ009', qty: 1 }, { equipmentId: 'EQ010', qty: 1 }, { equipmentId: 'EQ011', qty: 2 }] },
];

let sites = [
  { siteId: 'SITE001', name: '东湖绿道营地A区', address: '武汉市东湖生态旅游风景区绿道1号', capacity: 50, availableStatus: '可用', partner: '东湖文旅' },
  { siteId: 'SITE002', name: '梁子湖畔露营基地', address: '武汉市江夏区梁子湖风景区', capacity: 80, availableStatus: '可用', partner: '梁子湖度假区' },
  { siteId: 'SITE003', name: '马鞍山森林营地', address: '武汉市洪山区马鞍山森林公园', capacity: 30, availableStatus: '停用', partner: '森林公园管理处' },
];

let equipments = [
  { equipmentId: 'EQ001', name: '双人帐篷', totalQty: 100, availableQty: 100, warnThreshold: 20, status: '可用', disinfectStatus: '已消杀', usedCount: 0, lastDisinfectTime: '2026-10-01T08:00:00' },
  { equipmentId: 'EQ002', name: '防潮垫', totalQty: 200, availableQty: 200, warnThreshold: 40, status: '可用', disinfectStatus: '已消杀', usedCount: 0, lastDisinfectTime: '2026-10-01T08:00:00' },
  { equipmentId: 'EQ003', name: '营地灯', totalQty: 150, availableQty: 150, warnThreshold: 30, status: '可用', disinfectStatus: '已消杀', usedCount: 0, lastDisinfectTime: '2026-10-01T08:00:00' },
  { equipmentId: 'EQ004', name: '天幕', totalQty: 60, availableQty: 60, warnThreshold: 15, status: '可用', disinfectStatus: '已消杀', usedCount: 0, lastDisinfectTime: '2026-10-01T08:00:00' },
  { equipmentId: 'EQ005', name: '充气床垫', totalQty: 120, availableQty: 120, warnThreshold: 25, status: '可用', disinfectStatus: '已消杀', usedCount: 0, lastDisinfectTime: '2026-10-01T08:00:00' },
  { equipmentId: 'EQ006', name: '大型帐篷', totalQty: 40, availableQty: 40, warnThreshold: 10, status: '可用', disinfectStatus: '已消杀', usedCount: 0, lastDisinfectTime: '2026-10-01T08:00:00' },
  { equipmentId: 'EQ007', name: '折叠椅', totalQty: 80, availableQty: 80, warnThreshold: 15, status: '可用', disinfectStatus: '已消杀', usedCount: 0, lastDisinfectTime: '2026-10-01T08:00:00' },
  { equipmentId: 'EQ008', name: '长桌', totalQty: 30, availableQty: 30, warnThreshold: 8, status: '可用', disinfectStatus: '已消杀', usedCount: 0, lastDisinfectTime: '2026-10-01T08:00:00' },
  { equipmentId: 'EQ009', name: '音响', totalQty: 20, availableQty: 20, warnThreshold: 5, status: '可用', disinfectStatus: '已消杀', usedCount: 0, lastDisinfectTime: '2026-10-01T08:00:00' },
  { equipmentId: 'EQ010', name: '投影仪', totalQty: 15, availableQty: 15, warnThreshold: 4, status: '可用', disinfectStatus: '已消杀', usedCount: 0, lastDisinfectTime: '2026-10-01T08:00:00' },
  { equipmentId: 'EQ011', name: '烤炉', totalQty: 25, availableQty: 25, warnThreshold: 6, status: '可用', disinfectStatus: '已消杀', usedCount: 0, lastDisinfectTime: '2026-10-01T08:00:00' },
];

let orders = [
  { orderId: 'ORD1001', userId: 'mock_openid_001', packageId: 'PKG001', siteId: 'SITE001', useDate: '2026-04-12', quantity: 2, orderStatus: '已支付', payStatus: '已支付', amount: 398, contactName: '张三', contactPhone: '13800000001', isBatch: false, createTime: '2026-04-01T10:00:00', payTime: '2026-04-01T10:01:00' },
  { orderId: 'ORD1002', userId: 'mock_openid_002', packageId: 'PKG002', siteId: 'SITE002', useDate: '2026-07-20', quantity: 1, orderStatus: '配送中', payStatus: '已支付', amount: 399, contactName: '李四', contactPhone: '13800000002', isBatch: false, createTime: '2026-07-10T09:00:00', payTime: '2026-07-10T09:05:00' },
  { orderId: 'ORD1003', userId: 'ent', packageId: 'PKG001', siteId: 'SITE001', useDate: '2026-04-18', quantity: 5, orderStatus: '已完成', payStatus: '已支付', amount: 995, contactName: '某科技公司', contactPhone: '13800000003', isBatch: true, createTime: '2026-04-02T14:00:00', payTime: '2026-04-02T14:10:00' },
  { orderId: 'ORD1004', userId: 'ent', packageId: 'PKG002', siteId: 'SITE002', useDate: '2026-08-01', quantity: 3, orderStatus: '使用中', payStatus: '已支付', amount: 1197, contactName: '某科技公司', contactPhone: '13800000003', isBatch: true, createTime: '2026-07-28T14:00:00', payTime: '2026-07-28T14:10:00' },
];

let users = [
  { userId: 'mock_openid_001', nickname: '微信用户A', role: 'C端', phone: '13800000001', registerTime: '2026-03-01T08:00:00' },
  { userId: 'mock_openid_002', nickname: '微信用户B', role: 'C端', phone: '13800000002', registerTime: '2026-03-05T08:00:00' },
  { userId: 'admin', nickname: '系统管理员', role: '管理员', phone: '13800000099', registerTime: '2026-01-01T08:00:00' },
  { userId: 'ent', nickname: '某科技公司', role: 'B端', phone: '13800000003', registerTime: '2026-02-01T08:00:00' },
];

let logs = [
  { logId: 'LOG0001', operator: 'system', opType: 'INIT_DB', opTarget: 'all', opContent: '初始化数据库集合与种子数据', opResult: 'SUCCESS', orderId: '', opTime: '2026-01-01T08:00:00' },
  { logId: 'LOG0002', operator: 'admin', opType: 'LOGIN', opTarget: 'web', opContent: '管理员登录后台', opResult: 'SUCCESS', orderId: '', opTime: '2026-04-01T09:00:00' },
];

// ============ 优惠券（对应小程序端 coupon/* action） ============
let coupons = [
  { couponId: 'CP_NEW20', name: '新人立减券', value: 20, threshold: 0, type: '新人券', totalStock: 1000, sentCount: 156, usedCount: 42, onShelf: true, validDays: 30, desc: '新用户注册自动发放，无门槛立减 20 元' },
  { couponId: 'CP_FULL50', name: '满 300 减 50', value: 50, threshold: 300, type: '满减券', totalStock: 500, sentCount: 89, usedCount: 17, onShelf: true, validDays: 30, desc: '订单满 300 元可用，限工作日下单' },
  { couponId: 'CP_TEAM120', name: '团建满 800 减 120', value: 120, threshold: 800, type: '团建券', totalStock: 200, sentCount: 23, usedCount: 6, onShelf: true, validDays: 45, desc: '企业团建批量订单满 800 可用' },
];

// ============ 积分账户（对应小程序端 points/get action） ============
let pointsAccounts = [
  { userId: 'mock_openid_001', nickname: '微信用户A', points: 120, totalEarn: 140, totalSpend: 20 },
  { userId: 'mock_openid_002', nickname: '微信用户B', points: 60, totalEarn: 60, totalSpend: 0 },
  { userId: 'ent', nickname: '某科技公司', points: 300, totalEarn: 300, totalSpend: 0 },
];
let pointsLogs = [
  { logId: 'PL001', userId: 'mock_openid_001', nickname: '微信用户A', change: 20, balance: 120, reason: '完成订单评价返积分', refId: 'ORD1001', time: '2026-04-05T10:00:00' },
  { logId: 'PL002', userId: 'mock_openid_001', nickname: '微信用户A', change: 100, balance: 100, reason: '新人注册赠送', refId: 'REGISTER', time: '2026-03-01T08:00:00' },
  { logId: 'PL003', userId: 'mock_openid_002', nickname: '微信用户B', change: 20, balance: 20, reason: '完成订单评价返积分', refId: 'ORD1002', time: '2026-07-15T10:00:00' },
  { logId: 'PL004', userId: 'ent', nickname: '某科技公司', change: 200, balance: 200, reason: '企业签约赠送', refId: 'CONTRACT', time: '2026-02-01T08:00:00' },
];

// ============ 晒单 feed（对应小程序端 feed/list、review/like） ============
let feeds = [
  { feedId: 'F001', userId: 'mock_openid_001', nickname: '微信用户A', avatar: '🏕️', packageId: 'PKG001', packageName: '春日露营基础套餐', siteId: 'SITE001', siteName: '东湖绿道营地A区', content: '周末东湖露营，装备很齐全，帐篷一搭就能用！', images: [], likeCount: 12, status: '已发布', createTime: '2026-04-13T18:00:00' },
  { feedId: 'F002', userId: 'mock_openid_002', nickname: '微信用户B', avatar: '✨', packageId: 'PKG002', packageName: '夏日星空进阶套餐', siteId: 'SITE002', siteName: '梁子湖畔露营基地', content: '梁子湖的星空太美了，天幕一撑氛围感拉满～', images: [], likeCount: 28, status: '已发布', createTime: '2026-07-22T20:00:00' },
  { feedId: 'F003', userId: 'ent', nickname: '某科技公司', avatar: '🎉', packageId: 'PKG003', packageName: '秋日团建尊享套餐', siteId: 'SITE001', siteName: '东湖绿道营地A区', content: '公司 20 人团建，长桌和音响效果超棒，明年还订！', images: [], likeCount: 45, status: '已发布', createTime: '2026-10-18T15:00:00' },
];

/** 生成序列号 */
let seq = 1000;
function nextId(prefix) {
  seq += 1;
  return `${prefix}${Date.now()}${seq}`;
}

/** 当前 ISO 时间 */
function now() {
  return new Date().toISOString();
}

/**
 * 生成 mock JWT（payload 含 role / exp），仅供离线演示
 * @param {string} role
 * @returns {string}
 */
function mockJwt(role) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { role, exp: Math.floor(Date.now() / 1000) + 86400 };
  const b = (o) => window.btoa(unescape(encodeURIComponent(JSON.stringify(o))));
  return `${b(header)}.${b(payload)}.mock-signature`;
}

/** 写一条日志到内存 */
function pushLog({ operator, opType, opTarget, opContent, opResult, orderId }) {
  logs.unshift({
    logId: nextId('LOG'),
    operator: operator || 'system',
    opType: opType || 'UNKNOWN',
    opTarget: opTarget || '',
    opContent: opContent || '',
    opResult: opResult || 'SUCCESS',
    orderId: orderId || '',
    opTime: now(),
  });
}

/** 配送推进映射：动作 → 前态/后态/操作名（对齐 uniCloud/delivery 云函数） */
const ADVANCE = {
  dispatch: { from: '已支付', to: '配送中', op: '配送' },
  setup: { from: '配送中', to: '布置中', op: '布置' },
  recover: { from: ['布置中', '使用中'], to: '已完成', op: '回收' }, // 回收即完成，兼容布置中/使用中
};

/** 统一成功 */
function ok(data = {}, message = 'success') {
  return { code: 0, message, data };
}
/** 统一失败 */
function err(code, message, data = null) {
  return { code, message, data };
}

/**
 * 处理 Mock 请求（复合键路由）
 * @param {string} fn 云函数名
 * @param {string} action 动作
 * @param {object} data 业务参数
 * @returns {{code:number,message:string,data:*}}
 */
export function mockHandle(fn, action, data = {}) {
  const key = `${fn}.${action}`;
  switch (key) {
    // ============ webLogin ============
    case 'webLogin.login': {
      const username = (data.username || 'admin').toString();
      const role = username === 'ent' ? 'B端' : '管理员';
      const nickname = role === 'B端' ? '某科技公司' : '系统管理员';
      pushLog({ operator: username, opType: 'LOGIN', opTarget: 'web', opContent: `${nickname} 登录后台` });
      return ok({ token: mockJwt(role), role, nickname, username });
    }

    // ============ packageSite ============
    case 'packageSite.listPackages':
      return ok({ packages, sites });
    case 'packageSite.getPackage': {
      const pkg = packages.find((p) => p.packageId === data.packageId) || null;
      return ok(pkg);
    }
    case 'packageSite.siteList':
      return ok({ list: sites });
    case 'packageSite.upsertPackage': {
      const payload = { ...data };
      if (payload.packageId && packages.some((p) => p.packageId === payload.packageId)) {
        const idx = packages.findIndex((p) => p.packageId === payload.packageId);
        packages[idx] = { ...packages[idx], ...payload };
        pushLog({ operator: data._operator || 'admin', opType: 'UPSERT_PACKAGE', opTarget: 'packages', opContent: `编辑套餐 ${payload.packageId}` });
      } else {
        payload.packageId = payload.packageId || nextId('PKG');
        packages.push(payload);
        pushLog({ operator: data._operator || 'admin', opType: 'UPSERT_PACKAGE', opTarget: 'packages', opContent: `新增套餐 ${payload.packageId}` });
      }
      return ok({ packageId: payload.packageId });
    }
    case 'packageSite.setShelf': {
      const pkg = packages.find((p) => p.packageId === data.packageId);
      if (!pkg) return err(4003, '套餐不存在');
      pkg.onShelf = !!data.onShelf;
      pushLog({ operator: data._operator || 'admin', opType: 'SET_SHELF', opTarget: 'packages', opContent: `套餐 ${data.packageId} ${pkg.onShelf ? '上架' : '下架'}` });
      return ok({ onShelf: pkg.onShelf });
    }
    case 'packageSite.upsertSite': {
      const payload = { ...data };
      if (payload.siteId && sites.some((s) => s.siteId === payload.siteId)) {
        const idx = sites.findIndex((s) => s.siteId === payload.siteId);
        sites[idx] = { ...sites[idx], ...payload };
        pushLog({ operator: data._operator || 'admin', opType: 'UPSERT_SITE', opTarget: 'sites', opContent: `编辑场地 ${payload.siteId}` });
      } else {
        payload.siteId = payload.siteId || nextId('SITE');
        sites.push(payload);
        pushLog({ operator: data._operator || 'admin', opType: 'UPSERT_SITE', opTarget: 'sites', opContent: `新增场地 ${payload.siteId}` });
      }
      return ok({ siteId: payload.siteId });
    }

    // ============ order ============
    case 'order.list': {
      const { filter = {}, page = { size: 999, num: 1 } } = data;
      let list = orders.slice();
      if (filter.orderStatus) list = list.filter((o) => o.orderStatus === filter.orderStatus);
      if (filter.orderId) list = list.filter((o) => o.orderId.indexOf(filter.orderId) !== -1);
      if (filter.dateStart) list = list.filter((o) => o.useDate >= filter.dateStart);
      if (filter.dateEnd) list = list.filter((o) => o.useDate <= filter.dateEnd);
      const total = list.length;
      const start = (page.num - 1) * page.size;
      list = list.slice(start, start + page.size);
      return ok({ list, total });
    }
    case 'order.detail': {
      const order = orders.find((o) => o.orderId === data.orderId) || null;
      return ok({ order });
    }
    case 'order.cancel': {
      const order = orders.find((o) => o.orderId === data.orderId);
      if (!order) return err(4003, '订单不存在');
      if (order.orderStatus === '已取消') return err(4009, '订单已取消');
      order.orderStatus = '已取消';
      pushLog({ operator: data._operator || 'admin', opType: 'CANCEL_ORDER', opTarget: 'orders', opContent: `取消订单 ${data.orderId}`, orderId: data.orderId });
      return ok({ orderId: data.orderId, orderStatus: '已取消' });
    }
    case 'order.refund': {
      const order = orders.find((o) => o.orderId === data.orderId);
      if (!order) return err(4003, '订单不存在');
      if (order.payStatus !== '已支付') return err(4002, '仅已支付订单可退款');
      if (order.refunded) return err(4009, '订单已退款');
      order.payStatus = '已退款';
      order.orderStatus = '已退款';
      order.refunded = true;
      order.refundAmount = order.amount;
      order.refundTime = now();
      pushLog({ operator: data._operator || 'admin', opType: 'REFUND', opTarget: 'orders', opContent: `退款订单 ${data.orderId} ¥${order.amount}`, orderId: data.orderId });
      return ok({ orderId: data.orderId, refundAmount: order.amount });
    }
    case 'order.batchCreate': {
      const details = Array.isArray(data.details) ? data.details : [data];
      const userId = data.userId || 'ent';
      const created = [];
      for (const d of details) {
        const pkg = packages.find((p) => p.packageId === d.packageId);
        const orderId = nextId('ORD');
        const amount = pkg ? pkg.price * (d.quantity || 1) : 0;
        const order = {
          orderId,
          userId,
          packageId: d.packageId,
          siteId: d.siteId,
          useDate: d.useDate,
          quantity: d.quantity || 1,
          orderStatus: '待支付',
          payStatus: '未支付',
          amount,
          contactName: d.contactName || data.contactName || '',
          contactPhone: d.contactPhone || data.contactPhone || '',
          isBatch: true,
          createTime: now(),
        };
        orders.push(order);
        created.push(orderId);
      }
      pushLog({ operator: userId, opType: 'BATCH_CREATE', opTarget: 'orders', opContent: `批量下单 ${created.length} 笔` });
      return ok({ orderIds: created, count: created.length });
    }

    // ============ delivery ============
    case 'delivery.list': {
      // 含已支付，使「已支付→配送中」也能在后台推进（对齐真实后端 dispatch 入口）
      const advState = ['已支付', '配送中', '布置中', '使用中'];
      const list = orders.filter((o) => advState.indexOf(o.orderStatus) !== -1);
      return ok({ list });
    }
    case 'delivery.dispatch':
    case 'delivery.setup':
    case 'delivery.recover': {
      const act = action;
      const rule = ADVANCE[act];
      const order = orders.find((o) => o.orderId === data.orderId);
      if (!order) return err(4003, '订单不存在');
      const fromOk = Array.isArray(rule.from)
        ? rule.from.indexOf(order.orderStatus) !== -1
        : order.orderStatus === rule.from;
      if (!fromOk) {
        return err(4002, `当前状态「${order.orderStatus}」无法执行${rule.op}`);
      }
      order.orderStatus = rule.to;
      // 装备出入库：配送扣减、回收归还
      if (act === 'dispatch' || act === 'recover') {
        const pkg = packages.find((p) => p.packageId === order.packageId);
        const refs = (pkg && pkg.equipRefs) || [];
        for (const ref of refs) {
          const eq = equipments.find((e) => e.equipmentId === ref.equipmentId);
          if (!eq) continue;
          const delta = act === 'dispatch' ? -ref.qty * order.quantity : ref.qty * order.quantity;
          eq.availableQty = Math.max(0, eq.availableQty + delta);
          eq.usedCount = Math.max(0, eq.usedCount + (act === 'dispatch' ? ref.qty * order.quantity : 0));
        }
      }
      pushLog({ operator: data.operator || 'admin', opType: rule.op, opTarget: 'orders', opContent: `订单 ${data.orderId} ${rule.op} → ${rule.to}`, orderId: data.orderId });
      return ok({ orderId: data.orderId, orderStatus: rule.to });
    }

    // ============ equipment ============
    case 'equipment.list':
      return ok({ list: equipments });
    case 'equipment.disinfect': {
      const eq = equipments.find((e) => e.equipmentId === data.equipmentId);
      if (!eq) return err(4003, '装备不存在');
      eq.disinfectStatus = '已消杀';
      eq.lastDisinfectTime = now();
      pushLog({ operator: data._operator || 'admin', opType: 'DISINFECT', opTarget: 'equipments', opContent: `消杀登记 ${data.equipmentId}` });
      return ok({ equipmentId: data.equipmentId, disinfectStatus: '已消杀' });
    }
    case 'equipment.update': {
      const eq = equipments.find((e) => e.equipmentId === data.equipmentId);
      if (!eq) return err(4003, '装备不存在');
      if (data.status) eq.status = data.status;
      if (typeof data.availableQty === 'number') eq.availableQty = data.availableQty;
      if (typeof data.warnThreshold === 'number') eq.warnThreshold = data.warnThreshold;
      if (typeof data.totalQty === 'number') eq.totalQty = data.totalQty;
      pushLog({ operator: data._operator || 'admin', opType: 'UPDATE_EQUIP', opTarget: 'equipments', opContent: `编辑装备 ${data.equipmentId}` });
      return ok({ equipmentId: data.equipmentId });
    }

    // ============ finance ============
    case 'finance.stats': {
      const paid = orders.filter((o) => o.payStatus === '已支付');
      const refunded = orders.filter((o) => o.refunded);
      const orderCount = paid.length;
      const revenue = paid.reduce((s, o) => s + (o.amount || 0), 0);
      const refundAmount = refunded.reduce((s, o) => s + (o.refundAmount || o.amount || 0), 0);
      // 热门套餐排行
      const map = {};
      for (const o of paid) map[o.packageId] = (map[o.packageId] || 0) + 1;
      const nameMap = {};
      for (const p of packages) nameMap[p.packageId] = p.name;
      const topPackages = Object.keys(map)
        .map((pid) => ({ packageId: pid, name: nameMap[pid] || pid, count: map[pid] }))
        .sort((a, b) => b.count - a.count);
      // 对账单明细（已支付订单）
      const statement = paid.map((o) => ({
        orderId: o.orderId,
        packageId: o.packageId,
        packageName: nameMap[o.packageId] || o.packageId,
        useDate: o.useDate,
        quantity: o.quantity,
        amount: o.amount,
        payTime: o.payTime || o.createTime,
        contactName: o.contactName,
      }));
      return ok({ orderCount, revenue, refundAmount, topPackages, orders: statement });
    }

    // ============ log ============
    case 'log.list': {
      const { orderId, operator, page = { size: 999, num: 1 } } = data;
      let list = logs.slice();
      if (orderId) list = list.filter((l) => l.orderId === orderId);
      if (operator) list = list.filter((l) => (l.operator || '').indexOf(operator) !== -1);
      const total = list.length;
      const start = (page.num - 1) * page.size;
      list = list.slice(start, start + page.size);
      return ok({ list, total });
    }

    // ============ user ============
    case 'user.list':
      return ok({ list: users, total: users.length });
    case 'user.updateRole': {
      const u = users.find((x) => x.userId === data.userId);
      if (!u) return err(4003, '用户不存在');
      u.role = data.role;
      pushLog({ operator: data._operator || 'admin', opType: 'UPDATE_ROLE', opTarget: 'users', opContent: `用户 ${data.userId} 角色调整为 ${data.role}` });
      return ok({ userId: data.userId, role: data.role });
    }

    // ============ coupon（优惠券管理） ============
    case 'coupon.list':
      return ok({ list: coupons, total: coupons.length });
    case 'coupon.upsert': {
      const payload = { ...data };
      delete payload._operator;
      if (payload.couponId && coupons.some((c) => c.couponId === payload.couponId)) {
        const idx = coupons.findIndex((c) => c.couponId === payload.couponId);
        coupons[idx] = { ...coupons[idx], ...payload };
        pushLog({ operator: data._operator || 'admin', opType: 'UPSERT_COUPON', opTarget: 'coupons', opContent: `编辑优惠券 ${payload.couponId}` });
      } else {
        payload.couponId = payload.couponId || nextId('CP');
        payload.sentCount = payload.sentCount || 0;
        payload.usedCount = payload.usedCount || 0;
        payload.onShelf = payload.onShelf !== false;
        coupons.push(payload);
        pushLog({ operator: data._operator || 'admin', opType: 'UPSERT_COUPON', opTarget: 'coupons', opContent: `新增优惠券 ${payload.couponId}` });
      }
      return ok({ couponId: payload.couponId });
    }
    case 'coupon.setShelf': {
      const c = coupons.find((x) => x.couponId === data.couponId);
      if (!c) return err(4003, '优惠券不存在');
      c.onShelf = !!data.onShelf;
      pushLog({ operator: data._operator || 'admin', opType: 'COUPON_SHELF', opTarget: 'coupons', opContent: `优惠券 ${data.couponId} ${c.onShelf ? '上架' : '下架'}` });
      return ok({ couponId: data.couponId, onShelf: c.onShelf });
    }

    // ============ points（积分管理） ============
    case 'points.list':
      return ok({ list: pointsAccounts, total: pointsAccounts.length });
    case 'points.logs': {
      let list = pointsLogs.slice();
      if (data.userId) list = list.filter((l) => l.userId === data.userId);
      list.sort((a, b) => (a.time < b.time ? 1 : -1));
      return ok({ list, total: list.length });
    }
    case 'points.grant': {
      // 管理员手动给用户加积分
      const u = pointsAccounts.find((x) => x.userId === data.userId);
      if (!u) return err(4003, '用户不存在');
      const delta = Number(data.points) || 0;
      if (delta === 0) return err(4001, '积分数不能为 0');
      u.points = Math.max(0, u.points + delta);
      u.totalEarn = Math.max(0, u.totalEarn + Math.max(0, delta));
      u.totalSpend = Math.max(0, u.totalSpend + Math.max(0, -delta));
      const log = {
        logId: nextId('PL'),
        userId: u.userId,
        nickname: u.nickname,
        change: delta,
        balance: u.points,
        reason: data.reason || '管理员手动调整',
        refId: 'ADMIN',
        time: now(),
      };
      pointsLogs.unshift(log);
      pushLog({ operator: data._operator || 'admin', opType: 'GRANT_POINTS', opTarget: 'points', opContent: `给用户 ${u.nickname} ${delta > 0 ? '加' : '扣'} ${Math.abs(delta)} 积分` });
      return ok({ userId: u.userId, points: u.points });
    }

    // ============ feed（晒单审核） ============
    case 'feed.list': {
      let list = feeds.slice();
      if (data.status) list = list.filter((f) => f.status === data.status);
      list.sort((a, b) => (a.createTime < b.createTime ? 1 : -1));
      return ok({ list, total: list.length });
    }
    case 'feed.remove': {
      const idx = feeds.findIndex((f) => f.feedId === data.feedId);
      if (idx === -1) return err(4003, '晒单不存在');
      const removed = feeds.splice(idx, 1)[0];
      pushLog({ operator: data._operator || 'admin', opType: 'FEED_REMOVE', opTarget: 'feeds', opContent: `下架违规晒单 ${data.feedId}（${removed.nickname}）` });
      return ok({ feedId: data.feedId });
    }
    case 'feed.toggle': {
      const f = feeds.find((x) => x.feedId === data.feedId);
      if (!f) return err(4003, '晒单不存在');
      f.status = f.status === '已发布' ? '已屏蔽' : '已发布';
      pushLog({ operator: data._operator || 'admin', opType: 'FEED_TOGGLE', opTarget: 'feeds', opContent: `晒单 ${data.feedId} → ${f.status}` });
      return ok({ feedId: data.feedId, status: f.status });
    }

    default:
      // 未知 fn.action 默认返回空成功，保证 stub 视图不报错
      return ok({}, 'no-op');
  }
}
