/**
 * Mock 响应处理器
 * 根据 (name, action, data) 返回与 §3.3 接口契约一致的 {code,message,data}
 * 内存维护 orders / reviews，使 create → pay → list → detail → track → review 离线闭环自洽
 * 下单校验链与 uniCloud/cloudfunctions/order/index.js 的 P3.1 保持一致
 *
 * 2026-11-04 扩展：delivery/track、order/reschedule、order/renew、
 *   review/list（晒单）、guide/list、coupon/*、points/*、weather/get
 */
const seed = require('./seed');

// 运行时可变内存表（直接复用 seed 引用，保证跨 action 自洽）
const _orders = seed.orders;
const _coupons = seed.coupons;
const _userCoupons = seed.userCoupons;
const _guides = seed.guides;
const _reviews = seed.seedReviews.slice();
const _account = seed.userAccount;
// 已评价订单集合（防止重复评价，对应 4009）
const _reviewed = new Set();

const ORDER_STATUS_FLOW = ['待支付', '已支付', '配送中', '布置中', '使用中', '已回收', '已完成'];

/** 1 积分 = 0.01 元，抵现上限：订单金额的 10% */
const POINTS_RATE = 0.01;
const POINTS_REDEEM_RATIO = 100;

/**
 * 生成订单号：ORD + 时间戳
 */
function genOrderId() {
  return 'ORD' + Date.now();
}

/** 按订单号找订单 */
function findOrder(orderId) {
  return _orders.find((o) => o.orderId === orderId) || null;
}

/** 按 packageId 找套餐 */
function findPackage(packageId) {
  return seed.packages.find((p) => p.packageId === packageId) || null;
}

/** 按 siteId 找场地 */
function findSite(siteId) {
  return seed.sites.find((s) => s.siteId === siteId) || null;
}

/** 计算订单实付金额（基础金额 - 券抵扣 - 积分抵现） */
function calcPayable(order) {
  let amount = Number(order.amount) || 0;
  if (order.couponId) {
    const c = _coupons.find((x) => x.couponId === order.couponId);
    if (c && amount >= c.threshold) amount -= c.value;
  }
  if (order.pointsUsed > 0) amount -= order.pointsUsed * POINTS_RATE;
  return Math.max(0, Number(amount.toFixed(2)));
}

/**
 * 处理 Mock 请求
 */
function handle(name, action, data = {}) {
  switch (name) {
    case 'login':
      return {
        code: 0,
        message: 'success',
        data: { openid: 'mock_openid_001', role: 'C端', nickname: _account.nickname, isNew: false },
      };

    case 'user':
      if (action === 'getUserInfo' || action === 'profile') {
        return {
          code: 0,
          message: 'success',
          data: {
            userId: _account.userId,
            nickname: _account.nickname,
            role: 'C端',
            phone: '',
            points: _account.points,
          },
        };
      }
      break;

    case 'packageSite':
      if (action === 'listPackages') {
        const onShelfPackages = seed.packages.filter((p) => p.onShelf);
        const availableSites = seed.sites.filter((s) => s.availableStatus === '可用');
        return { code: 0, message: 'success', data: { packages: onShelfPackages, sites: availableSites } };
      }
      if (action === 'getPackage') {
        const pkg = findPackage(data.packageId);
        if (!pkg || !pkg.onShelf) return { code: 4003, message: '套餐不存在或已下架', data: null };
        const enriched = {
          ...pkg,
          equipRefs: (pkg.equipRefs || []).map((ref) => {
            const eq = seed.equipments.find((e) => e.equipmentId === ref.equipmentId);
            return { ...ref, name: eq ? eq.name : '' };
          }),
        };
        return { code: 0, message: 'success', data: enriched };
      }
      if (action === 'listGuides') {
        // 可按 siteId 过滤
        const list = data.siteId ? _guides.filter((g) => g.siteId === data.siteId) : _guides.slice();
        return { code: 0, message: 'success', data: { list, total: list.length } };
      }
      break;

    case 'order':
      if (action === 'create') {
        const pkg = findPackage(data.packageId);
        if (!pkg || !pkg.onShelf) return { code: 4003, message: '套餐不存在或已下架', data: null };
        if (data.useDate < pkg.reservableStart || data.useDate > pkg.reservableEnd) {
          return { code: 4003, message: '使用日期不在可预约周期内', data: null };
        }
        const site = findSite(data.siteId);
        if (!site || site.availableStatus !== '可用') return { code: 4003, message: '场地不可用或已停用', data: null };
        const used = _orders
          .filter((o) => o.siteId === data.siteId && o.useDate === data.useDate && o.orderStatus !== '已取消')
          .reduce((sum, o) => sum + o.quantity, 0);
        if (site.capacity - used < data.quantity) return { code: 4003, message: '该场地当日已约满', data: null };
        for (const ref of pkg.equipRefs || []) {
          const eq = seed.equipments.find((e) => e.equipmentId === ref.equipmentId);
          if (!eq) return { code: 4003, message: '装备不存在', data: null };
          if (eq.availableQty < ref.qty * data.quantity) {
            return { code: 4003, message: `装备「${eq.name}」库存不足`, data: null };
          }
        }
        const quantity = data.quantity || 1;
        const amount = pkg.price * quantity;
        const orderId = genOrderId();
        const order = {
          orderId,
          userId: 'mock_openid_001',
          packageId: data.packageId,
          siteId: data.siteId,
          useDate: data.useDate,
          quantity,
          orderStatus: '待支付',
          payStatus: '未支付',
          amount,
          contactName: data.contactName || '',
          contactPhone: data.contactPhone || '',
          isBatch: !!data.isBatch,
          couponId: data.couponId || '',
          pointsUsed: Number(data.pointsUsed) || 0,
          createTime: new Date().toISOString(),
          payTime: '',
        };
        // 校验券是否可用
        if (order.couponId) {
          const claim = _userCoupons.find((c) => c.couponId === order.couponId && c.status === '未使用');
          if (!claim) return { code: 4003, message: '优惠券不可用', data: null };
          const c = _coupons.find((x) => x.couponId === order.couponId);
          if (c && amount < c.threshold) {
            return { code: 4003, message: `订单未满 ${c.threshold} 元，券不可用`, data: null };
          }
        }
        // 校验积分是否足够
        if (order.pointsUsed > 0) {
          if (order.pointsUsed > _account.points) return { code: 4003, message: '积分不足', data: null };
          // 抵现上限：订单金额 10%
          const maxPoints = Math.floor(amount * 0.1 / POINTS_RATE);
          if (order.pointsUsed > maxPoints) {
            return { code: 4003, message: `本单最多可用 ${maxPoints} 积分`, data: null };
          }
        }
        _orders.unshift(order);
        const payable = calcPayable(order);
        return { code: 0, message: 'success', data: { orderId, orderStatus: '待支付', amount: payable } };
      }

      if (action === 'pay') {
        const order = findOrder(data.orderId);
        if (!order) return { code: 4001, message: '订单不存在', data: null };
        if (order.payStatus === '已支付') return { code: 4009, message: '重复支付', data: null };
        if (order.orderStatus !== '待支付') return { code: 4002, message: '订单状态不允许支付', data: null };
        // 核销券 + 扣积分
        if (order.couponId) {
          const claim = _userCoupons.find((c) => c.couponId === order.couponId);
          if (claim) claim.status = '已使用';
        }
        if (order.pointsUsed > 0) _account.points -= order.pointsUsed;
        order.payStatus = '已支付';
        order.orderStatus = '已支付';
        order.payTime = new Date().toISOString();
        order.payable = calcPayable(order);
        return { code: 0, message: 'success', data: { payStatus: '已支付', payTime: order.payTime, amount: order.payable } };
      }

      if (action === 'list') {
        const filter = data.filter || {};
        let list = _orders.slice();
        if (filter.orderStatus) list = list.filter((o) => o.orderStatus === filter.orderStatus);
        if (filter.orderId) list = list.filter((o) => o.orderId === filter.orderId);
        if (filter.dateStart) list = list.filter((o) => o.useDate >= filter.dateStart);
        if (filter.dateEnd) list = list.filter((o) => o.useDate <= filter.dateEnd);
        list = list.map((o) => ({ ...o, payable: calcPayable(o) }));
        return { code: 0, message: 'success', data: { list, total: list.length } };
      }

      if (action === 'detail') {
        const order = findOrder(data.orderId);
        if (!order) return { code: 4001, message: '订单不存在', data: null };
        return { code: 0, message: 'success', data: { ...order, payable: calcPayable(order) } };
      }

      if (action === 'track') {
        const order = findOrder(data.orderId);
        const idx = order ? ORDER_STATUS_FLOW.indexOf(order.orderStatus) : -1;
        return {
          code: 0,
          message: 'success',
          data: {
            orderId: data.orderId,
            current: order ? order.orderStatus : '',
            steps: ORDER_STATUS_FLOW,
            currentIndex: idx,
            order: order ? { ...order, payable: calcPayable(order) } : null,
          },
        };
      }

      // 主线一·1.2 改期：已支付未配送（已支付/待配送）可改使用日期
      if (action === 'reschedule') {
        const order = findOrder(data.orderId);
        if (!order) return { code: 4001, message: '订单不存在', data: null };
        if (order.orderStatus !== '已支付' && order.orderStatus !== '待支付') {
          return { code: 4002, message: '仅已支付未配送订单可改期', data: null };
        }
        if (!data.useDate) return { code: 4000, message: '请选择新的使用日期', data: null };
        const pkg = findPackage(order.packageId);
        if (data.useDate < pkg.reservableStart || data.useDate > pkg.reservableEnd) {
          return { code: 4003, message: '新日期不在可预约周期内', data: null };
        }
        // 校验新日期场地容量
        const used = _orders
          .filter((o) => o.siteId === order.siteId && o.useDate === data.useDate && o.orderStatus !== '已取消' && o.orderId !== order.orderId)
          .reduce((sum, o) => sum + o.quantity, 0);
        const site = findSite(order.siteId);
        if (site.capacity - used < order.quantity) {
          return { code: 4003, message: '新日期该场地已约满', data: null };
        }
        order.useDate = data.useDate;
        order.rescheduleLog = order.rescheduleLog || [];
        order.rescheduleLog.push({ from: order.useDate, to: data.useDate, time: new Date().toISOString() });
        return { code: 0, message: 'success', data: { orderId: order.orderId, useDate: data.useDate } };
      }

      // 主线一·1.2 续租：使用中订单可续租 1 天，按套餐单价 50% 加收
      if (action === 'renew') {
        const order = findOrder(data.orderId);
        if (!order) return { code: 4001, message: '订单不存在', data: null };
        if (order.orderStatus !== '使用中') return { code: 4002, message: '仅使用中订单可续租', data: null };
        const days = Number(data.days) || 1;
        const pkg = findPackage(order.packageId);
        const extra = Number((pkg.price * 0.5 * days * order.quantity).toFixed(2));
        order.amount = Number((order.amount + extra).toFixed(2));
        order.renewLogs = order.renewLogs || [];
        order.renewLogs.push({ days, extra, time: new Date().toISOString() });
        return { code: 0, message: 'success', data: { orderId: order.orderId, extra, totalAmount: order.amount } };
      }

      if (action === 'submitReview') {
        const order = findOrder(data.orderId);
        if (!order) return { code: 4001, message: '订单不存在', data: null };
        if (order.orderStatus !== '已完成') return { code: 4002, message: '仅已完成订单可评价', data: null };
        if (_reviewed.has(data.orderId)) return { code: 4009, message: '该订单已评价', data: null };
        _reviewed.add(data.orderId);
        const reviewId = 'REV' + Date.now();
        // 返积分：评价得 20 积分
        _account.points += 20;
        _account.totalPointsEarned += 20;
        _reviews.unshift({
          reviewId,
          orderId: data.orderId,
          packageId: order.packageId,
          siteId: order.siteId,
          userId: _account.userId,
          nickname: _account.nickname,
          avatar: '😊',
          score: Number(data.score) || 5,
          content: data.content || '',
          images: Array.isArray(data.images) ? data.images : [],
          createTime: new Date().toISOString(),
          likes: 0,
        });
        return { code: 0, message: 'success', data: { reviewId, pointsEarned: 20, totalPoints: _account.points } };
      }

      if (action === 'cancel') {
        const order = findOrder(data.orderId);
        if (!order) return { code: 4001, message: '订单不存在', data: null };
        if (order.orderStatus === '已取消') return { code: 4009, message: '订单已取消', data: null };
        if (['待支付', '已支付'].indexOf(order.orderStatus) === -1) {
          return { code: 4002, message: '当前状态不可取消', data: null };
        }
        order.orderStatus = '已取消';
        return { code: 0, message: 'success', data: { orderId: data.orderId, orderStatus: '已取消' } };
      }

      if (action === 'refund') {
        const order = findOrder(data.orderId);
        if (!order) return { code: 4001, message: '订单不存在', data: null };
        if (order.payStatus === '已退款') return { code: 4009, message: '订单已退款', data: null };
        if (order.payStatus !== '已支付') return { code: 4002, message: '仅已支付订单可退款', data: null };
        // 退回券和积分
        if (order.couponId) {
          const claim = _userCoupons.find((c) => c.couponId === order.couponId);
          if (claim) claim.status = '未使用';
        }
        if (order.pointsUsed > 0) _account.points += order.pointsUsed;
        order.payStatus = '已退款';
        order.orderStatus = '已取消';
        order.refundAmount = calcPayable(order);
        order.refundTime = new Date().toISOString();
        return { code: 0, message: 'success', data: { orderId: data.orderId, payStatus: '已退款' } };
      }
      break;

    // 主线一·1.1 配送追踪：返回骑手位置 + 场地坐标
    case 'delivery':
      if (action === 'track') {
        const order = findOrder(data.orderId);
        if (!order) return { code: 4001, message: '订单不存在', data: null };
        const site = findSite(order.siteId);
        // 未到配送阶段：模拟一个骑手对象
        const rider = order.rider || {
          name: '待派单',
          phone: '',
          etaMinutes: order.orderStatus === '已支付' ? 120 : 0,
          latitude: site ? site.latitude : 0,
          longitude: site ? site.longitude : 0,
        };
        return {
          code: 0,
          message: 'success',
          data: {
            orderId: order.orderId,
            orderStatus: order.orderStatus,
            rider,
            site: site ? {
              siteId: site.siteId,
              name: site.name,
              address: site.address,
              latitude: site.latitude,
              longitude: site.longitude,
            } : null,
          },
        };
      }
      break;

    // 主线二·2.1 晒单广场
    case 'review':
      if (action === 'list') {
        let list = _reviews.slice();
        if (data.packageId) list = list.filter((r) => r.packageId === data.packageId);
        if (data.siteId) list = list.filter((r) => r.siteId === data.siteId);
        list.sort((a, b) => (b.createTime > a.createTime ? 1 : -1));
        return { code: 0, message: 'success', data: { list, total: list.length } };
      }
      if (action === 'like') {
        const r = _reviews.find((x) => x.reviewId === data.reviewId);
        if (!r) return { code: 4001, message: '评价不存在', data: null };
        r.likes = (r.likes || 0) + 1;
        return { code: 0, message: 'success', data: { reviewId: r.reviewId, likes: r.likes } };
      }
      break;

    // 主线三·3.1 优惠券
    case 'coupon':
      if (action === 'listAvailable') {
        // 未领取且仍在有效期内的券
        const claimedIds = _userCoupons.map((c) => c.couponId);
        const now = new Date().toISOString().slice(0, 10);
        const list = _coupons.filter((c) =>
          !claimedIds.includes(c.couponId) && c.validFrom <= now && c.validTo >= now
        );
        return { code: 0, message: 'success', data: { list } };
      }
      if (action === 'my') {
        // 我的券包：合并券模板信息
        const list = _userCoupons.map((uc) => {
          const tpl = _coupons.find((c) => c.couponId === uc.couponId);
          return { ...uc, ...tpl };
        });
        return { code: 0, message: 'success', data: { list } };
      }
      if (action === 'claim') {
        const c = _coupons.find((x) => x.couponId === data.couponId);
        if (!c) return { code: 4001, message: '券不存在', data: null };
        if (_userCoupons.some((uc) => uc.couponId === data.couponId)) {
          return { code: 4009, message: '已领取过该券', data: null };
        }
        if (c.stock <= 0) return { code: 4003, message: '券已发完', data: null };
        c.stock -= 1;
        _userCoupons.push({ couponId: c.couponId, status: '未使用', claimTime: new Date().toISOString() });
        return { code: 0, message: 'success', data: { couponId: c.couponId, name: c.name } };
      }
      break;

    // 主线三·3.2 积分
    case 'points':
      if (action === 'get') {
        return {
          code: 0,
          message: 'success',
          data: {
            points: _account.points,
            totalEarned: _account.totalPointsEarned,
            rate: `每 ${POINTS_REDEEM_RATIO} 积分抵 1 元`,
          },
        };
      }
      break;

    // 主线四·4.2 天气适配（mock）
    case 'weather':
      if (action === 'get') {
        const date = data.date || '';
        // 根据月份简单 mock
        const month = date ? Number(date.slice(5, 7)) : 11;
        let cond = '晴', temp = '18℃', tip = '适合露营，记得防晒';
        if (month >= 6 && month <= 8) { cond = '多云'; temp = '32℃'; tip = '夏季酷暑，建议带天幕和充足饮用水'; }
        else if (month >= 9 && month <= 11) { cond = '晴'; temp = '15℃'; tip = '秋季温差大，带件外套；可考虑烤炉套餐'; }
        else if (month >= 12 || month <= 2) { cond = '小雪'; temp = '2℃'; tip = '冬季注意保暖，帐篷需防风加固'; }
        else if (month >= 3 && month <= 5) { cond = '小雨'; temp = '16℃'; tip = '春季多阵雨，务必带天幕防水'; }
        return { code: 0, message: 'success', data: { date, condition: cond, temperature: temp, tip } };
      }
      break;
  }

  return { code: 4001, message: `未实现的 mock 接口: ${name}/${action}`, data: null };
}

module.exports = { handle, ORDER_STATUS_FLOW, calcPayable };
