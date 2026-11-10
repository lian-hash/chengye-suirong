/**
 * 装备管理云函数（Web 管理员）
 * -------------------------------------------------------------
 * action：
 *   list       装备列表（分页，可 name/status 过滤）
 *   disinfect  消毒：更新 disinfectStatus / lastDisinfectTime
 *   update     更新装备（totalQty/availableQty/warnThreshold/status 等）
 *
 * 全部动作需 authGuard(['管理员'])。
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

exports.main = async (event, context) => {
  const { action, data, headers } = getCtx(event);
  const db = uniCloud.database();
  const dbCmd = db.command;

  try {
    // 鉴权（所有动作均要求管理员）
    const token = getBearerToken(headers);
    const payload = verifyToken(token);
    const role = (payload && payload.role) || 'C端';
    const guard = authGuard(role, ['管理员']);
    if (!guard.passed) return guard.res;

    switch (action) {
      /* ----------------- 列表 ----------------- */
      case 'list': {
        const filter = data.filter || {};
        const where = {};
        if (filter.name) where.name = new RegExp(filter.name, 'i');
        if (filter.status) where.status = filter.status;
        if (filter.disinfectStatus) where.disinfectStatus = filter.disinfectStatus;
        const result = await paginate('equipments', where, data.page, 'equipmentId', 'asc');
        return success(result);
      }

      /* ----------------- 消毒 ----------------- */
      case 'disinfect': {
        const v = validate(data, {
          equipmentId: { type: 'string', required: true, minLength: 1 },
        });
        if (!v.ok) return v.res;

        const { equipmentId } = data;
        const res = await db.collection('equipments').where({ equipmentId }).get();
        if (res.data.length === 0) return fail(CODE.RESOURCE_INVALID, '装备不存在');
        await db
          .collection('equipments')
          .where({ equipmentId })
          .update({
            data: { disinfectStatus: '已消毒', lastDisinfectTime: new Date() },
          });
        await writeLog({
          operator: (payload && payload.username) || 'admin',
          opType: 'DISINFECT',
          opTarget: 'equipments',
          opContent: `消毒装备 ${equipmentId}`,
          opResult: 'SUCCESS',
        });
        return success({ equipmentId, disinfectStatus: '已消毒' });
      }

      /* ----------------- 更新 ----------------- */
      case 'update': {
        const v = validate(data, {
          equipmentId: { type: 'string', required: true, minLength: 1 },
        });
        if (!v.ok) return v.res;

        const { equipmentId, _id, ...rest } = data;
        const res = await db.collection('equipments').where({ equipmentId }).get();
        if (res.data.length === 0) return fail(CODE.RESOURCE_INVALID, '装备不存在');
        await db
          .collection('equipments')
          .where({ equipmentId })
          .update({ data: rest });
        await writeLog({
          operator: (payload && payload.username) || 'admin',
          opType: 'UPDATE_EQUIPMENT',
          opTarget: 'equipments',
          opContent: `更新装备 ${equipmentId}`,
          opResult: 'SUCCESS',
        });
        return success({ equipmentId });
      }

      default:
        return fail(CODE.PARAM_ERROR, '未知 action: ' + action);
    }
  } catch (e) {
    console.error('[equipment] error', e);
    return fail(CODE.SYSTEM_ERROR, e.message);
  }
};
