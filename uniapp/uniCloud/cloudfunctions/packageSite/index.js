/**
 * 套餐与场地云函数
 * -------------------------------------------------------------
 * action：
 *   listPackages （公开）上架套餐 + 可用场地
 *   getPackage   （公开）套餐详情（下架则 4003）
 *   siteList     （Web）全部场地列表（分页）
 *   upsertPackage（Web 管理员）新增/更新套餐
 *   setShelf     （Web 管理员）上/下架套餐
 *   upsertSite   （Web 管理员）新增/更新场地
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
    switch (action) {
      /* ----------------- 公开：上架套餐 + 可用场地 ----------------- */
      case 'listPackages': {
        const [pkgRes, siteRes] = await Promise.all([
          db.collection('packages').where({ onShelf: true }).get(),
          db.collection('sites').where({ availableStatus: '可用' }).get(),
        ]);
        return success({ packages: pkgRes.data, sites: siteRes.data });
      }

      /* ----------------- 公开：套餐详情 ----------------- */
      case 'getPackage': {
        const v = validate(data, {
          packageId: { type: 'string', required: true, minLength: 1, maxLength: 20 },
        });
        if (!v.ok) return v.res;
        const res = await db.collection('packages').where({ packageId: data.packageId }).get();
        if (res.data.length === 0) return fail(CODE.RESOURCE_INVALID, '套餐不存在或已下架');
        return success(res.data[0]);
      }

      /* ----------------- Web：全部场地列表 ----------------- */
      case 'siteList': {
        const filter = data.filter || {};
        const where = {};
        if (filter.availableStatus) where.availableStatus = filter.availableStatus;
        if (filter.keyword) where.name = new RegExp(filter.keyword, 'i');
        const result = await paginate('sites', where, data.page, 'siteId', 'asc');
        return success(result);
      }

      /* ----------------- Web 管理员：新增/更新套餐 ----------------- */
      case 'upsertPackage': {
        const token = getBearerToken(headers);
        const payload = verifyToken(token);
        const role = (payload && payload.role) || 'C端';
        const guard = authGuard(role, ['管理员']);
        if (!guard.passed) return guard.res;

        const v = validate(data, {
          name: { type: 'string', required: true, minLength: 1, maxLength: 50 },
          price: { type: 'number', required: true, minimum: 0 },
          reservableStart: { type: 'string', required: true, pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          reservableEnd: { type: 'string', required: true, pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        });
        if (!v.ok) return v.res;

        const packageId = data.packageId || 'PKG' + Date.now();
        const pkgDoc = Object.assign({}, data, { packageId });
        const exist = await db.collection('packages').where({ packageId }).get();
        if (exist.data.length === 0) {
          await db.collection('packages').add({ data: pkgDoc });
        } else {
          const { _id } = exist.data[0];
          await db.collection('packages').doc(_id).update({ data: pkgDoc });
        }
        await writeLog({
          operator: (payload && payload.username) || 'admin',
          opType: 'UPSERT_PACKAGE',
          opTarget: 'packages',
          opContent: `保存套餐 ${packageId}`,
          opResult: 'SUCCESS',
        });
        return success({ packageId });
      }

      /* ----------------- Web 管理员：上/下架 ----------------- */
      case 'setShelf': {
        const token = getBearerToken(headers);
        const payload = verifyToken(token);
        const role = (payload && payload.role) || 'C端';
        const guard = authGuard(role, ['管理员']);
        if (!guard.passed) return guard.res;

        const v = validate(data, {
          packageId: { type: 'string', required: true, minLength: 1 },
          onShelf: { type: 'boolean', required: true },
        });
        if (!v.ok) return v.res;

        const { packageId, onShelf } = data;
        const exist = await db.collection('packages').where({ packageId }).get();
        if (exist.data.length === 0) return fail(CODE.RESOURCE_INVALID, '套餐不存在');
        await db.collection('packages').where({ packageId }).update({ data: { onShelf } });
        await writeLog({
          operator: (payload && payload.username) || 'admin',
          opType: 'SET_SHELF',
          opTarget: 'packages',
          opContent: `套餐 ${packageId} 上架=${onShelf}`,
          opResult: 'SUCCESS',
        });
        return success({ packageId, onShelf });
      }

      /* ----------------- Web 管理员：新增/更新场地 ----------------- */
      case 'upsertSite': {
        const token = getBearerToken(headers);
        const payload = verifyToken(token);
        const role = (payload && payload.role) || 'C端';
        const guard = authGuard(role, ['管理员']);
        if (!guard.passed) return guard.res;

        const siteId = data.siteId || 'SITE' + Date.now();
        const siteDoc = Object.assign({}, data, { siteId });
        const exist = await db.collection('sites').where({ siteId }).get();
        if (exist.data.length === 0) {
          await db.collection('sites').add({ data: siteDoc });
        } else {
          const { _id } = exist.data[0];
          await db.collection('sites').doc(_id).update({ data: siteDoc });
        }
        await writeLog({
          operator: (payload && payload.username) || 'admin',
          opType: 'UPSERT_SITE',
          opTarget: 'sites',
          opContent: `保存场地 ${siteId}`,
          opResult: 'SUCCESS',
        });
        return success({ siteId });
      }

      default:
        return fail(CODE.PARAM_ERROR, '未知 action: ' + action);
    }
  } catch (e) {
    console.error('[packageSite] error', e);
    return fail(CODE.SYSTEM_ERROR, e.message);
  }
};
