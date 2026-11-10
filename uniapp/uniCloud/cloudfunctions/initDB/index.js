/**
 * 数据初始化云函数
 * -------------------------------------------------------------
 * action：
 *   init    幂等创建后台账号（admin/admin123、ent/ent123），不灌业务数据
 *   import  按白名单集合批量写入（可选先清空），供 import_to_cloud.js 调用
 *   stats   统计 8 个集合各自条数
 *   clear   按白名单清空集合（需 confirm=true）
 *
 * 注意：入参结构与 mock-data/import_to_cloud.js 一致——
 *   import 返回需含 data.total / data.cleared；
 *   stats 返回需含 data.stats（对象）与 data.total（合计），同时保留扁平字段。
 */
const { success, fail, CODE, getCtx, getDB, writeLog } = require('common');

/** 允许导入/清空的集合白名单 */
const ALLOWED = ['users', 'packages', 'sites', 'equipments', 'orders', 'deliveries', 'reviews', 'logs'];

/** 待创建的后台账号（幂等） */
const ACCOUNTS = [
  {
    userId: 'admin',
    username: 'admin',
    password: 'admin123',
    nickname: '系统管理员',
    role: '管理员',
    phone: '',
    registerTime: new Date(),
  },
  {
    userId: 'ent',
    username: 'ent',
    password: 'ent123',
    nickname: '企业客户',
    role: 'B端',
    phone: '',
    registerTime: new Date(),
  },
];

/**
 * 分批清空集合（避免单次 remove 限量，循环直到删完）
 * @param {string} c 集合名
 * @returns {Promise<number>} 删除条数
 */
async function clearCollection(c) {
  const db = getDB();
  const dbCmd = db.command;
  let deleted = 0;
  while (true) {
    const res = await db.collection(c).where({ _id: dbCmd.exists(true) }).limit(100).get();
    if (res.data.length === 0) break;
    const ids = res.data.map((d) => d._id);
    await db
      .collection(c)
      .where({ _id: dbCmd.in(ids) })
      .remove();
    deleted += res.data.length;
  }
  return deleted;
}

/**
 * 统计单集合条数
 */
async function countColl(c) {
  return (await getDB().collection(c).count()).total;
}

/**
 * 写操作（import / clear）共享密钥校验
 * ==================================================
 * 背景：initDB 一旦开启 URL 化，任何拿到地址的人都能 POST
 *       {action:'import',clear:true} 或 {action:'clear',confirm:true}
 *       清空整个数据库，因此写操作必须用 ADMIN_KEY 保护。
 *
 * 策略：
 *  - 已配置环境变量 ADMIN_KEY → 入参必须带 adminKey 且严格相等，否则 4004 拒绝，
 *    且不执行任何写操作；
 *  - 未配置 ADMIN_KEY → 放行但打印醒目告警（保证课程演示在未配环境变量时
 *    仍能灌数据），生产/长期暴露必须配置。
 *
 * @param {object} data 业务参数（getCtx 解析后的 data）
 * @returns {object|null} null 表示校验通过；否则为 fail(...) 结果，直接 return
 */
function checkAdminKey(data) {
  const expected = String(process.env.ADMIN_KEY || '').trim();
  if (!expected) {
    console.warn(
      '[initDB] 未配置环境变量 ADMIN_KEY，写操作未受保护：任何人调用本函数的 URL 化地址都可清空数据库。' +
        '请尽快在 uniCloud 控制台 → 云函数 → initDB → 环境变量 中配置 ADMIN_KEY，' +
        '并在本地 export UNICLOUD_ADMIN_KEY=<同一密钥> 后再灌数据。'
    );
    return null;
  }
  const provided = String((data && data.adminKey) || '').trim();
  if (provided !== expected) {
    return fail(CODE.NO_PERMISSION, '缺少或错误的 adminKey');
  }
  return null;
}

exports.main = async (event, context) => {
  const { action, data } = getCtx(event);
  const db = getDB();

  try {
    switch (action) {
      /* ----------------- 幂等创建后台账号 ----------------- */
      case 'init': {
        const created = [];
        for (const acc of ACCOUNTS) {
          // 幂等：按 username 先查，已存在则不重复插入
          const res = await db.collection('users').where({ username: acc.username }).get();
          if (res.data.length === 0) {
            await db.collection('users').add({ data: acc });
            created.push(acc.username);
          }
        }
        await writeLog({
          operator: 'system',
          opType: 'INIT_DB',
          opTarget: 'users',
          opContent: '初始化后台账号（admin/ent）',
          opResult: 'SUCCESS',
        });
        return success({ created });
      }

      /* ----------------- 批量导入 ----------------- */
      case 'import': {
        // 安全加固：写操作先校验 ADMIN_KEY
        const deniedForImport = checkAdminKey(data);
        if (deniedForImport) return deniedForImport;

        const { collection, docs, clear } = data;
        if (!ALLOWED.includes(collection)) {
          return fail(CODE.PARAM_ERROR, '非法集合: ' + collection);
        }
        if (!Array.isArray(docs)) {
          return fail(CODE.PARAM_ERROR, 'docs 必须为数组');
        }

        // cleared 必须是「数字」：清空阶段实际删除的条数（未 clear 时为 0）
        // import_to_cloud.js 第 138 行会用 `清空 ${r.data.cleared} 条` 输出该值
        let cleared = 0;
        if (clear === true) {
          cleared = await clearCollection(collection);
        }

        // 清洗：去除 _id，交由数据库生成；分批 50 写入
        const BATCH = 50;
        for (let i = 0; i < docs.length; i += BATCH) {
          const slice = docs.slice(i, i + BATCH).map((d) => {
            const copy = Object.assign({}, d);
            delete copy._id;
            return copy;
          });
          await db.collection(collection).add({ data: slice });
        }

        const total = await countColl(collection);
        return success({ collection, inserted: docs.length, cleared, total });
      }

      /* ----------------- 统计各集合条数 ----------------- */
      case 'stats': {
        const counts = {};
        for (const c of ALLOWED) {
          counts[c] = await countColl(c);
        }
        const total = ALLOWED.reduce((sum, c) => sum + counts[c], 0);
        // 同时返回扁平字段（满足 §5 约定）与 stats/total（满足 import_to_cloud.js）
        return success(Object.assign({}, counts, { stats: counts, total }));
      }

      /* ----------------- 清空集合 ----------------- */
      case 'clear': {
        // 安全加固：写操作先校验 ADMIN_KEY
        const deniedForClear = checkAdminKey(data);
        if (deniedForClear) return deniedForClear;

        const { collection, confirm } = data;
        if (!ALLOWED.includes(collection)) {
          return fail(CODE.PARAM_ERROR, '非法集合: ' + collection);
        }
        if (confirm !== true) {
          return fail(CODE.PARAM_ERROR, '未确认清空（需 confirm=true）');
        }
        const deleted = await clearCollection(collection);
        await writeLog({
          operator: 'system',
          opType: 'CLEAR_COLLECTION',
          opTarget: collection,
          opContent: `清空集合 ${collection}（${deleted} 条）`,
          opResult: 'SUCCESS',
        });
        return success({ collection, deleted });
      }

      default:
        return fail(CODE.PARAM_ERROR, '未知 action: ' + action);
    }
  } catch (e) {
    console.error('[initDB] error', e);
    return fail(CODE.SYSTEM_ERROR, e.message);
  }
};
