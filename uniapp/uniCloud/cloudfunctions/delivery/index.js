/**
 * 配送调度云函数（Web 管理员）
 * -------------------------------------------------------------
 * action：
 *   list     配送记录列表（分页）
 *   dispatch 派送：已支付 → 配送中
 *   setup    布置：配送中 → 布置中
 *   recover  回收：布置中/使用中 → 已回收 → 已完成，并释放装备库存
 *
 * 除 list 外均需 authGuard(['管理员'])。
 */
const {
  success,
  fail,
  CODE,
  getCtx,
  validate,
  writeLog,
  paginate,
  getBearerToken,
  verifyToken,
  authGuard,
} = require('common');

/**
 * 通用：取操作员（优先入参 operator，其次 token username）
 */
function resolveOperator(data, payload) {
  return data.operator || (payload && payload.username) || 'admin';
}

/**
 * 释放订单预占的装备库存（与 order.cancel/refund 一致）
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
      /* ----------------- 配送记录列表 ----------------- */
      case 'list': {
        const filter = data.filter || {};
        const where = {};
        if (filter.orderId) where.orderId = filter.orderId;
        if (filter.opType) where.opType = filter.opType;
        const result = await paginate('deliveries', where, data.page, 'opTime', 'desc');
        return success(result);
      }

      /* ----------------- 派送 ----------------- */
      case 'dispatch': {
        const token = getBearerToken(headers);
        const payload = verifyToken(token);
        const guard = authGuard((payload && payload.role) || 'C端', ['管理员']);
        if (!guard.passed) return guard.res;

        const v = validate(data, { orderId: { type: 'string', required: true, minLength: 1 } });
        if (!v.ok) return v.res;

        const operator = resolveOperator(data, payload);
        const res = await db.collection('orders').where({ orderId: data.orderId }).get();
        if (res.data.length === 0) return fail(CODE.PARAM_ERROR, '订单不存在');
        const order = res.data[0];
        if (order.orderStatus !== '已支付') {
          return fail(CODE.ORDER_STATUS_INVALID, '仅已支付订单可派送');
        }

        const fromStatus = order.orderStatus;
        const toStatus = '配送中';
        await db
          .collection('orders')
          .doc(order._id)
          .update({ data: { orderStatus: toStatus } });
        await db.collection('deliveries').add({
          data: {
            deliveryId: 'DLV' + Date.now(),
            orderId: data.orderId,
            opType: 'DISPATCH',
            operator,
            fromStatus,
            toStatus,
            opTime: new Date(),
          },
        });
        await writeLog({
          operator,
          opType: 'DISPATCH',
          opTarget: 'orders',
          opContent: `派送订单 ${data.orderId}`,
          opResult: 'SUCCESS',
          orderId: data.orderId,
        });
        return success({ orderId: data.orderId, orderStatus: toStatus });
      }

      /* ----------------- 布置 ----------------- */
      case 'setup': {
        const token = getBearerToken(headers);
        const payload = verifyToken(token);
        const guard = authGuard((payload && payload.role) || 'C端', ['管理员']);
        if (!guard.passed) return guard.res;

        const v = validate(data, { orderId: { type: 'string', required: true, minLength: 1 } });
        if (!v.ok) return v.res;

        const operator = resolveOperator(data, payload);
        const res = await db.collection('orders').where({ orderId: data.orderId }).get();
        if (res.data.length === 0) return fail(CODE.PARAM_ERROR, '订单不存在');
        const order = res.data[0];
        if (order.orderStatus !== '配送中') {
          return fail(CODE.ORDER_STATUS_INVALID, '仅配送中订单可布置');
        }

        const fromStatus = order.orderStatus;
        const toStatus = '布置中';
        await db
          .collection('orders')
          .doc(order._id)
          .update({ data: { orderStatus: toStatus } });
        await db.collection('deliveries').add({
          data: {
            deliveryId: 'DLV' + Date.now(),
            orderId: data.orderId,
            opType: 'SETUP',
            operator,
            fromStatus,
            toStatus,
            opTime: new Date(),
          },
        });
        await writeLog({
          operator,
          opType: 'SETUP',
          opTarget: 'orders',
          opContent: `布置订单 ${data.orderId}`,
          opResult: 'SUCCESS',
          orderId: data.orderId,
        });
        return success({ orderId: data.orderId, orderStatus: toStatus });
      }

      /* ----------------- 回收（回收即完成） ----------------- */
      case 'recover': {
        const token = getBearerToken(headers);
        const payload = verifyToken(token);
        const guard = authGuard((payload && payload.role) || 'C端', ['管理员']);
        if (!guard.passed) return guard.res;

        const v = validate(data, { orderId: { type: 'string', required: true, minLength: 1 } });
        if (!v.ok) return v.res;

        const operator = resolveOperator(data, payload);
        const res = await db.collection('orders').where({ orderId: data.orderId }).get();
        if (res.data.length === 0) return fail(CODE.PARAM_ERROR, '订单不存在');
        const order = res.data[0];
        if (['布置中', '使用中'].indexOf(order.orderStatus) === -1) {
          return fail(CODE.ORDER_STATUS_INVALID, '仅布置中/使用中订单可回收');
        }

        const fromStatus = order.orderStatus;
        const toStatus = '已完成'; // 回收即完成
        // 先标记已回收再完成（状态机连贯），最终落完成态
        await db
          .collection('orders')
          .doc(order._id)
          .update({ data: { orderStatus: '已回收' } });
        await db
          .collection('orders')
          .doc(order._id)
          .update({ data: { orderStatus: toStatus } });
        // 释放装备库存
        await releaseEquipmentStock(db, dbCmd, order.packageId, order.quantity);
        await db.collection('deliveries').add({
          data: {
            deliveryId: 'DLV' + Date.now(),
            orderId: data.orderId,
            opType: 'RECOVER',
            operator,
            fromStatus,
            toStatus,
            opTime: new Date(),
          },
        });
        await writeLog({
          operator,
          opType: 'RECOVER',
          opTarget: 'orders',
          opContent: `回收订单 ${data.orderId}`,
          opResult: 'SUCCESS',
          orderId: data.orderId,
        });
        return success({ orderId: data.orderId, orderStatus: toStatus });
      }

      default:
        return fail(CODE.PARAM_ERROR, '未知 action: ' + action);
    }
  } catch (e) {
    console.error('[delivery] error', e);
    return fail(CODE.SYSTEM_ERROR, e.message);
  }
};
