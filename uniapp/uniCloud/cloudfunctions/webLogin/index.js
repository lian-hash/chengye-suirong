/**
 * Web 后台登录云函数
 * -------------------------------------------------------------
 * action：
 *   login  入参 { username, password }
 *         查 users（role 为 管理员/B端），签发 JWT
 *         返回 success({ token, role, username })
 *
 * 管理员/企业账号由 initDB.init 幂等创建（admin/admin123、ent/ent123）。
 */
const { success, fail, CODE, getCtx, signToken, validate } = require('common');

exports.main = async (event, context) => {
  const { action, data } = getCtx(event);
  const db = uniCloud.database();
  const dbCmd = db.command;

  try {
    if (action === 'login') {
      const v = validate(data, {
        username: { type: 'string', required: true, minLength: 1 },
        password: { type: 'string', required: true, minLength: 1 },
      });
      if (!v.ok) return v.res;

      const { username, password } = data;
      const res = await db
        .collection('users')
        .where({ username, password, role: dbCmd.in(['管理员', 'B端']) })
        .get();
      if (res.data.length === 0) return fail(4001, '用户名或密码错误');

      const u = res.data[0];
      const token = signToken({ username: u.username, role: u.role });
      return success({ token, role: u.role, username: u.username });
    }

    return fail(CODE.PARAM_ERROR, '未知 action: ' + action);
  } catch (e) {
    console.error('[webLogin] error', e);
    return fail(CODE.SYSTEM_ERROR, e.message);
  }
};
