/**
 * 财务统计云函数（Web 管理员）
 * -------------------------------------------------------------
 * action：
 *   stats  聚合 orders：totalOrders / byStatus / paidAmount /
 *         completedAmount / refundedAmount
 *
 * 需 authGuard(['管理员'])。
 */
const {
  success,
  fail,
  CODE,
  getCtx,
  getAll,
  getBearerToken,
  verifyToken,
  authGuard,
} = require('common');

exports.main = async (event, context) => {
  const { action, data, headers } = getCtx(event);

  try {
    const token = getBearerToken(headers);
    const payload = verifyToken(token);
    const role = (payload && payload.role) || 'C端';
    const guard = authGuard(role, ['管理员']);
    if (!guard.passed) return guard.res;

    if (action === 'stats') {
      const orders = await getAll('orders');
      const totalOrders = orders.length;
      const byStatus = {};
      let paidAmount = 0;
      let completedAmount = 0;
      let refundedAmount = 0;

      for (const o of orders) {
        const st = o.orderStatus || '未知';
        byStatus[st] = (byStatus[st] || 0) + 1;
        const amt = Number(o.amount) || 0;
        if (o.orderStatus === '已支付' || o.orderStatus === '已完成') paidAmount += amt;
        if (o.orderStatus === '已完成') completedAmount += amt;
        if (o.payStatus === '已退款') refundedAmount += amt;
      }

      return success({
        totalOrders,
        byStatus,
        paidAmount,
        completedAmount,
        refundedAmount,
      });
    }

    return fail(CODE.PARAM_ERROR, '未知 action: ' + action);
  } catch (e) {
    console.error('[finance] error', e);
    return fail(CODE.SYSTEM_ERROR, e.message);
  }
};
