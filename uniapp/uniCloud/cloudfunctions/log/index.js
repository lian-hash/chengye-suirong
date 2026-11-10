/**
 * 操作日志云函数（Web 管理员）
 * -------------------------------------------------------------
 * action：
 *   list  查询 logs 集合（可按 opType / dateStart / dateEnd 过滤 + 分页），按 opTime 倒序
 *
 * 需 authGuard(['管理员'])。
 */
const {
  success,
  fail,
  CODE,
  getCtx,
  validate,
  paginate,
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

    if (action === 'list') {
      const filter = data.filter || {};
      const where = {};
      if (filter.opType) where.opType = filter.opType;

      const opTimeCond = {};
      if (filter.dateStart) opTimeCond.$gte = new Date(filter.dateStart);
      if (filter.dateEnd) {
        // 包含当天结束：设为次日 0 点前
        const end = new Date(filter.dateEnd);
        end.setDate(end.getDate() + 1);
        opTimeCond.$lt = end;
      }
      if (Object.keys(opTimeCond).length) where.opTime = opTimeCond;

      const result = await paginate('logs', where, data.page, 'opTime', 'desc');
      return success(result);
    }

    return fail(CODE.PARAM_ERROR, '未知 action: ' + action);
  } catch (e) {
    console.error('[log] error', e);
    return fail(CODE.SYSTEM_ERROR, e.message);
  }
};
