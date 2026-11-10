/**
 * 订单云函数
 * -------------------------------------------------------------
 * action：
 *   create         C 端创建订单（完整校验链 + 事务防超卖，并预占装备库存）
 *   pay            C 端模拟支付
 *   list           C 端按 openid / Web 管理员查全量（按 token 区分）
 *   detail         订单详情
 *   track          状态时间线（7 态）
 *   submitReview   提交评价（仅已完成、未评价）
 *   cancel         C 端本人取消 / Web 管理员取消（释放库存）
 *   refund         C 端本人退款 / Web 管理员退款（释放库存）
 *   batchCreate    Web B 端批量下单（复用校验链）
 *
 * 设计说明：为防止超卖，create 在事务内预占（递减）装备 availableQty；
 *          与之对应，取消/退款/回收均把库存加回（dbCmd.inc）。站点容量
 *          通过统计非取消订单数约束，不单独扣减字段。
 */
const {
  success,
  fail,
  CODE,
  getCtx,
  getOpenid,
  validate,
  writeLog,
  paginate,
  getBearerToken,
  verifyToken,
  authGuard,
} = require('common');

/** 订单状态机 7 态 */
const ORDER_STATUS_FLOW = ['待支付', '已支付', '配送中', '布置中', '使用中', '已回收', '已完成'];

/** order/create 入参校验 Schema */
const ORDER_CREATE_SCHEMA = {
  packageId: { type: 'string', required: true, minLength: 1, maxLength: 20 },
  siteId: { type: 'string', required: true, minLength: 1, maxLength: 20 },
  useDate: { type: 'string', required: true, pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
  quantity: { type: 'integer', required: true, minimum: 1 },
  contactName: { type: 'string', maxLength: 30 },
  contactPhone: { type: 'string', pattern: '^1\\d{10}$' },
  isBatch: { type: 'boolean' },
};

/** 资源类校验失败前缀（事务内区分，统一映射 4003） */
const RESOURCE_PREFIX = 'RESOURCE:';

/**
 * 在事务内完成校验链 + 写入订单 + 预占装备库存
 * @param {object} db
 * @param {object} dbCmd
 * @param {string} userId
 * @param {object} payload { packageId, siteId, useDate, quantity, contactName, contactPhone, isBatch }
 * @param {string} [salt] 用于同一毫秒内生成唯一 orderId
 * @returns {Promise<{orderId:string, amount:number}|{error:string}>}
 */
async function createOrderWithTx(db, dbCmd, userId, payload, salt) {
  const transaction = await db.startTransaction();
  try {
    // 1) 套餐上架
    const pkgRes = await transaction
      .collection('packages')
      .where({ packageId: payload.packageId, onShelf: true })
      .get();
    if (pkgRes.data.length === 0) throw new Error(RESOURCE_PREFIX + '套餐不存在或已下架');
    const pkg = pkgRes.data[0];

    // 2) 使用日期 ∈ 可预约周期
    if (payload.useDate < pkg.reservableStart || payload.useDate > pkg.reservableEnd) {
      throw new Error(RESOURCE_PREFIX + '使用日期不在可预约周期内');
    }

    // 3) 场地当日剩余容量 ≥ quantity（按非取消订单数统计占用）
    const siteRes = await transaction
      .collection('sites')
      .where({ siteId: payload.siteId, availableStatus: '可用' })
      .get();
    if (siteRes.data.length === 0) throw new Error(RESOURCE_PREFIX + '场地不可用或已停用');
    const site = siteRes.data[0];
    const usedRes = await transaction
      .collection('orders')
      .where({ siteId: payload.siteId, useDate: payload.useDate, orderStatus: dbCmd.neq('已取消') })
      .count();
    if (site.capacity - usedRes.total < payload.quantity) {
      throw new Error(RESOURCE_PREFIX + '该场地当日已约满');
    }

    // 4) 装备可用数量 ≥ 需求，并预占库存（防超卖）
    for (const ref of pkg.equipRefs || []) {
      const eqRes = await transaction
        .collection('equipments')
        .where({ equipmentId: ref.equipmentId })
        .get();
      if (eqRes.data.length === 0) throw new Error(RESOURCE_PREFIX + '装备不存在');
      const eq = eqRes.data[0];
      if (eq.availableQty < ref.qty * payload.quantity) {
        throw new Error(RESOURCE_PREFIX + `装备「${eq.name}」库存不足`);
      }
      await transaction
        .collection('equipments')
        .doc(eq._id)
        .update({ data: { availableQty: dbCmd.inc(-ref.qty * payload.quantity) } });
    }

    // 5) 写入订单（待支付/未支付）
    const orderId = 'ORD' + Date.now() + (salt || '');
    const amount = pkg.price * payload.quantity;
    await transaction.collection('orders').add({
      data: {
        orderId,
        userId,
        packageId: payload.packageId,
        siteId: payload.siteId,
        useDate: payload.useDate,
        quantity: payload.quantity,
        orderStatus: '待支付',
        payStatus: '未支付',
        amount,
        contactName: payload.contactName || '',
        contactPhone: payload.contactPhone || '',
        isBatch: !!payload.isBatch,
        createTime: new Date(),
      },
    });

    await transaction.commit();
    return { orderId, amount };
  } catch (err) {
    await transaction.rollback(-100);
    const msg = (err && err.message) || '';
    if (msg.indexOf(RESOURCE_PREFIX) === 0) return { error: msg.slice(RESOURCE_PREFIX.length) };
    throw err;
  }
}

/**
 * 释放订单占用的装备库存（加回 availableQty）
 * @param {object} db
 * @param {object} dbCmd
 * @param {string} packageId
 * @param {number} quantity
 */
async function releaseEquipmentStock(db, dbCmd, packageId, quantity) {
  const pkgRes = await db.collection('packages').where({ packageId }).get();
  if (pkgRes.data.length === 0) return;
  const pkg = pkgRes.data[0];
  for (const ref of pkg.equipRefs || []) {
    await db
      .collection('equipments')
      .where({ equipmentId: ref.equipmentId })
      .update({ data: { availableQty: dbCmd.inc(ref.qty * quantity) } });
  }
}

exports.main = async (event, context) => {
  const { action, data, headers } = getCtx(event);
  const db = uniCloud.database();
  const dbCmd = db.command;

  try {
    switch (action) {
      /* ----------------- C 端：创建订单 ----------------- */
      case 'create': {
        const v = validate(data, ORDER_CREATE_SCHEMA);
        if (!v.ok) return v.res;

        const openid = getOpenid();
        const payload = {
          packageId: data.packageId,
          siteId: data.siteId,
          useDate: data.useDate,
          quantity: data.quantity,
          contactName: data.contactName,
          contactPhone: data.contactPhone,
          isBatch: false,
        };
        const r = await createOrderWithTx(db, dbCmd, openid, payload, '');
        if (r.error) return fail(CODE.RESOURCE_INVALID, r.error);

        await writeLog({
          operator: openid,
          opType: 'CREATE_ORDER',
          opTarget: 'orders',
          opContent: `创建订单 ${r.orderId}`,
          opResult: 'SUCCESS',
          orderId: r.orderId,
        });
        return success({ orderId: r.orderId, orderStatus: '待支付', amount: r.amount });
      }

      /* ----------------- C 端：模拟支付 ----------------- */
      case 'pay': {
        const v = validate(data, {
          orderId: { type: 'string', required: true, minLength: 1, maxLength: 20 },
          payMethod: { type: 'string', required: true },
        });
        if (!v.ok) return v.res;

        const { orderId, payMethod } = data;
        const openid = getOpenid();
        const res = await db.collection('orders').where({ orderId }).get();
        if (res.data.length === 0) return fail(CODE.PARAM_ERROR, '订单不存在');
        const order = res.data[0];
        if (openid && order.userId !== openid) return fail(CODE.NO_PERMISSION, '非本人订单');
        if (order.payStatus === '已支付') return fail(CODE.DUPLICATE, '重复支付');
        if (order.orderStatus !== '待支付') return fail(CODE.ORDER_STATUS_INVALID, '订单状态不允许支付');

        await db
          .collection('orders')
          .doc(order._id)
          .update({ data: { payStatus: '已支付', orderStatus: '已支付', payTime: new Date() } });
        await writeLog({
          operator: openid,
          opType: 'PAY',
          opTarget: 'orders',
          opContent: `订单 ${orderId} 模拟支付(${payMethod})`,
          opResult: 'SUCCESS',
          orderId,
        });
        return success({ payStatus: '已支付', payTime: new Date().toISOString(), amount: order.amount });
      }

      /* ----------------- 列表（C 端/openid，或 Web 管理员全量） ----------------- */
      case 'list': {
        const token = getBearerToken(headers);
        const payload = verifyToken(token);
        const isAdmin = !!(payload && payload.role && payload.role !== 'C端');
        const openid = getOpenid();

        const filter = data.filter || {};
        const where = {};
        if (!isAdmin) {
          where.userId = openid; // C 端仅看自己
        }
        if (filter.orderStatus) where.orderStatus = filter.orderStatus;
        if (filter.orderId) where.orderId = filter.orderId;
        const useDateCond = {};
        if (filter.dateStart) useDateCond.$gte = filter.dateStart;
        if (filter.dateEnd) useDateCond.$lte = filter.dateEnd;
        if (Object.keys(useDateCond).length) where.useDate = useDateCond;

        const result = await paginate('orders', where, data.page, 'createTime', 'desc');
        return success(result);
      }

      /* ----------------- 详情 ----------------- */
      case 'detail': {
        const v = validate(data, {
          orderId: { type: 'string', required: true, minLength: 1, maxLength: 20 },
        });
        if (!v.ok) return v.res;
        const res = await db.collection('orders').where({ orderId: data.orderId }).get();
        if (res.data.length === 0) return fail(CODE.PARAM_ERROR, '订单不存在');
        return success(res.data[0]);
      }

      /* ----------------- 状态时间线 ----------------- */
      case 'track': {
        const v = validate(data, {
          orderId: { type: 'string', required: true, minLength: 1, maxLength: 20 },
        });
        if (!v.ok) return v.res;
        const res = await db.collection('orders').where({ orderId: data.orderId }).get();
        if (res.data.length === 0) return fail(CODE.PARAM_ERROR, '订单不存在');
        const order = res.data[0];
        const currentIndex = ORDER_STATUS_FLOW.indexOf(order.orderStatus);
        return success({
          orderId: data.orderId,
          current: order.orderStatus,
          steps: ORDER_STATUS_FLOW,
          currentIndex,
          order,
        });
      }

      /* ----------------- 提交评价 ----------------- */
      case 'submitReview': {
        const v = validate(data, {
          orderId: { type: 'string', required: true, minLength: 1, maxLength: 20 },
          score: { type: 'integer', required: true, minimum: 1, maximum: 5 },
          content: { type: 'string', required: true, minLength: 1 },
        });
        if (!v.ok) return v.res;

        const { orderId, score, content } = data;
        const openid = getOpenid();
        const res = await db.collection('orders').where({ orderId }).get();
        if (res.data.length === 0) return fail(CODE.PARAM_ERROR, '订单不存在');
        const order = res.data[0];
        if (openid && order.userId !== openid) return fail(CODE.NO_PERMISSION, '非本人订单');
        if (order.orderStatus !== '已完成') return fail(CODE.ORDER_STATUS_INVALID, '仅已完成订单可评价');
        const revCount = (await db.collection('reviews').where({ orderId }).count()).total;
        if (revCount > 0) return fail(CODE.DUPLICATE, '该订单已评价');

        const reviewId = 'REV' + Date.now();
        await db.collection('reviews').add({
          data: { reviewId, orderId, userId: openid, score, content, reviewTime: new Date() },
        });
        await writeLog({
          operator: openid,
          opType: 'REVIEW',
          opTarget: 'reviews',
          opContent: `评价订单 ${orderId}`,
          opResult: 'SUCCESS',
          orderId,
        });
        return success({ reviewId });
      }

      /* ----------------- C 端本人 / Web 管理员：取消订单 ----------------- */
      case 'cancel': {
        const v = validate(data, {
          orderId: { type: 'string', required: true, minLength: 1 },
        });
        if (!v.ok) return v.res;

        const { orderId } = data;
        const openid = getOpenid();
        // 管理员 / B 端凭有效 token 可取消任意订单；否则按 C 端本人校验 openid
        const token = getBearerToken(headers);
        const payload = verifyToken(token);
        const role = (payload && payload.role) || 'C端';
        const isAdmin = payload && (role === '管理员' || role === 'B端');

        const res = await db.collection('orders').where({ orderId }).get();
        if (res.data.length === 0) return fail(CODE.PARAM_ERROR, '订单不存在');
        const order = res.data[0];

        if (!isAdmin) {
          // C 端本人：校验归属
          if (openid && order.userId !== openid) return fail(CODE.NO_PERMISSION, '非本人订单');
        }
        if (['待支付', '已支付'].indexOf(order.orderStatus) === -1) {
          return fail(CODE.ORDER_STATUS_INVALID, '仅待支付/已支付订单可取消');
        }
        // 取消即释放预占库存（create 时已预占）
        await releaseEquipmentStock(db, dbCmd, order.packageId, order.quantity);
        await db
          .collection('orders')
          .doc(order._id)
          .update({ data: { orderStatus: '已取消' } });
        await writeLog({
          operator: (payload && payload.username) || openid || 'C端',
          opType: 'CANCEL',
          opTarget: 'orders',
          opContent: `取消订单 ${orderId}`,
          opResult: 'SUCCESS',
          orderId,
        });
        return success({ orderId });
      }

      /* ----------------- C 端本人 / Web 管理员：退款 ----------------- */
      case 'refund': {
        const v = validate(data, {
          orderId: { type: 'string', required: true, minLength: 1 },
        });
        if (!v.ok) return v.res;

        const { orderId } = data;
        const openid = getOpenid();
        // 管理员凭有效 token 可退款任意订单；否则按 C 端本人校验 openid
        const token = getBearerToken(headers);
        const payload = verifyToken(token);
        const role = (payload && payload.role) || 'C端';
        const isAdmin = payload && role === '管理员';

        const res = await db.collection('orders').where({ orderId }).get();
        if (res.data.length === 0) return fail(CODE.PARAM_ERROR, '订单不存在');
        const order = res.data[0];

        if (!isAdmin) {
          // C 端本人：校验归属
          if (openid && order.userId !== openid) return fail(CODE.NO_PERMISSION, '非本人订单');
        }
        if (order.payStatus !== '已支付') {
          return fail(CODE.ORDER_STATUS_INVALID, '仅已支付订单可退款');
        }
        await releaseEquipmentStock(db, dbCmd, order.packageId, order.quantity);
        await db.collection('orders').doc(order._id).update({
          data: { payStatus: '已退款', orderStatus: '已取消' },
        });
        await writeLog({
          operator: (payload && payload.username) || openid || 'C端',
          opType: 'REFUND',
          opTarget: 'orders',
          opContent: `退款订单 ${orderId}`,
          opResult: 'SUCCESS',
          orderId,
        });
        return success({ orderId });
      }

      /* ----------------- Web B 端：批量下单 ----------------- */
      case 'batchCreate': {
        const token = getBearerToken(headers);
        const payload = verifyToken(token);
        const role = (payload && payload.role) || 'C端';
        const guard = authGuard(role, ['管理员', 'B端']);
        if (!guard.passed) return guard.res;

        const userId = (payload && payload.username) || getOpenid();
        const items = Array.isArray(data.list) ? data.list : [data];
        const created = [];
        let index = 0;
        for (const item of items) {
          const v = validate(item, ORDER_CREATE_SCHEMA);
          if (!v.ok) return v.res;
          const r = await createOrderWithTx(
            db,
            dbCmd,
            userId,
            Object.assign({}, item, { isBatch: true }),
            '_' + index++
          );
          if (r.error) return fail(CODE.RESOURCE_INVALID, r.error);
          created.push({ orderId: r.orderId, amount: r.amount });
        }
        await writeLog({
          operator: userId,
          opType: 'BATCH_CREATE_ORDER',
          opTarget: 'orders',
          opContent: `批量创建 ${created.length} 条订单`,
          opResult: 'SUCCESS',
        });
        return success({ created });
      }

      default:
        return fail(CODE.PARAM_ERROR, '未知 action: ' + action);
    }
  } catch (e) {
    console.error('[order] error', e);
    return fail(CODE.SYSTEM_ERROR, e.message);
  }
};
