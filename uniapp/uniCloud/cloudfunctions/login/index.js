/**
 * 登录云函数（C 端微信小程序静默登录 / 注册）
 * -------------------------------------------------------------
 * 调用方式（uni-app 端）：request.call('login', '', { code: 'mock' })
 *  → uniCloud.callFunction 的 event 直接是 { action: '', code: 'mock' }
 *  → getCtx 解析后 action 为空串，走登录逻辑。
 *
 * action：
 *   '' 或 'login'  → 静默登录：取 openid，不存在则注册为 C端 用户
 *
 * 返回：success({ openid, role:'C端', nickname, isNew })
 */
const { success, fail, CODE, getOpenid, writeLog } = require('common');

exports.main = async (event, context) => {
  const { action } = event;
  try {
    // 空串 / 'login' / 未指定 都视为登录（C 端静默登录）
    if (action === '' || action === 'login' || action === undefined) {
      const openid = getOpenid();
      const db = uniCloud.database();
      const users = db.collection('users');
      const res = await users.where({ userId: openid }).get();

      let nickname = '微信用户';
      let isNew = false;

      if (res.data.length === 0) {
        await users.add({
          data: {
            userId: openid,
            nickname: '微信用户',
            role: 'C端',
            phone: '',
            registerTime: new Date(),
          },
        });
        isNew = true;
        await writeLog({
          operator: openid,
          opType: 'REGISTER',
          opTarget: 'users',
          opContent: '新用户注册（默认 C端）',
          opResult: 'SUCCESS',
        });
      } else {
        nickname = res.data[0].nickname || '微信用户';
      }

      return success({ openid, role: 'C端', nickname, isNew });
    }

    return fail(CODE.PARAM_ERROR, '未知 action: ' + action);
  } catch (e) {
    console.error('[login] error', e);
    return fail(CODE.SYSTEM_ERROR, e.message);
  }
};
