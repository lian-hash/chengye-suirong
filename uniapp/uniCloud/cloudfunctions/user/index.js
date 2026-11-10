/**
 * 用户云函数
 * -------------------------------------------------------------
 * action：
 *   getUserInfo / profile  （C 端）读取当前用户信息
 *   list                   （Web 管理员）用户列表（分页）
 *   updateRole             （Web 管理员）变更用户角色
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

exports.main = async (event, context) => {
  const { action, data, headers } = getCtx(event);
  const db = uniCloud.database();
  const dbCmd = db.command;

  try {
    switch (action) {
      /* ----------------- C 端：读取当前用户 ----------------- */
      case 'getUserInfo':
      case 'profile': {
        const openid = getOpenid();
        const res = await db.collection('users').where({ userId: openid }).get();
        if (res.data.length === 0) return fail(CODE.PARAM_ERROR, '用户不存在');
        const u = res.data[0];
        return success({
          userId: u.userId,
          nickname: u.nickname,
          role: u.role,
          phone: u.phone,
        });
      }

      /* ----------------- Web 管理员：用户列表 ----------------- */
      case 'list': {
        const token = getBearerToken(headers);
        const payload = verifyToken(token);
        const role = (payload && payload.role) || 'C端';
        const guard = authGuard(role, ['管理员']);
        if (!guard.passed) return guard.res;

        const filter = data.filter || {};
        const where = {};
        if (filter.role) where.role = filter.role;
        if (filter.keyword) where.nickname = new RegExp(filter.keyword, 'i');
        const result = await paginate('users', where, data.page, 'registerTime', 'desc');
        return success(result);
      }

      /* ----------------- Web 管理员：变更角色 ----------------- */
      case 'updateRole': {
        const token = getBearerToken(headers);
        const payload = verifyToken(token);
        const role = (payload && payload.role) || 'C端';
        const guard = authGuard(role, ['管理员']);
        if (!guard.passed) return guard.res;

        const v = validate(data, {
          userId: { type: 'string', required: true, minLength: 1 },
          role: { type: 'string', required: true, minLength: 1 },
        });
        if (!v.ok) return v.res;

        const { userId, role: newRole } = data;
        const res = await db.collection('users').where({ userId }).get();
        if (res.data.length === 0) return fail(CODE.PARAM_ERROR, '用户不存在');

        await db.collection('users').where({ userId }).update({ data: { role: newRole } });
        await writeLog({
          operator: (payload && payload.username) || 'admin',
          opType: 'UPDATE_ROLE',
          opTarget: 'users',
          opContent: `变更 ${userId} 角色为 ${newRole}`,
          opResult: 'SUCCESS',
          orderId: '',
        });
        return success({ userId, role: newRole });
      }

      default:
        return fail(CODE.PARAM_ERROR, '未知 action: ' + action);
    }
  } catch (e) {
    console.error('[user] error', e);
    return fail(CODE.SYSTEM_ERROR, e.message);
  }
};
