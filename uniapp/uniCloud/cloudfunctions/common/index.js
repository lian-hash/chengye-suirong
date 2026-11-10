/**
 * 城野随行 —— uniCloud 公共模块（common）
 * ================================================================
 * 被所有云函数以 `require('common')` 方式引用。
 *
 * 导出成员：
 *   success(data, message)       统一成功响应
 *   fail(code, message, data)    统一失败响应
 *   CODE                        错误码常量
 *   validate(data, schema)      入参校验 + NoSQL 注入防护
 *   writeLog({...})             写操作日志（logs 集合）
 *   getDB()                     返回 uniCloud.database()
 *   getCtx(event)               双调用模式解析（C端/Web）
 *   getOpenid()                 从 WXContext 取 openid/uid（兜底 dev_user）
 *   signToken(payload)          签发 HS256 JWT（2h）
 *   verifyToken(token)          校验 JWT，返回 payload 或 null
 *   authGuard(role, allowed)    角色守卫
 *   getBearerToken(headers)     从 headers 提取 Bearer token（辅助）
 *   paginate(coll, where, page) 分页查询（辅助）
 *   getAll(coll)                游标拉取集合全量（辅助）
 *
 * 注意：uniCloud 下 `uniCloud` 为全局对象，无需 require；本模块只在函数内部引用它。
 */

/* ===================== 1. 统一响应 ===================== */

/**
 * 成功响应
 * @param {*} data 业务数据，缺省为 {}
 * @param {string} [message] 提示信息
 * @returns {{code:number,message:string,data:*}}
 */
function success(data, message) {
  return {
    code: 0,
    message: message || 'success',
    data: data === undefined ? {} : data,
  };
}

/**
 * 失败响应
 * @param {number} [code] 错误码
 * @param {string} [message] 错误信息
 * @param {*} [data] 附加数据
 * @returns {{code:number,message:string,data:*}}
 */
function fail(code, message, data) {
  return {
    code: code || 5000,
    message: message || 'error',
    data: data === null ? null : data,
  };
}

/** 统一错误码（与旧 common/response.js 对齐） */
const CODE = {
  SUCCESS: 0,
  PARAM_ERROR: 4001, // 参数错误/非法
  ORDER_STATUS_INVALID: 4002, // 订单状态非法
  RESOURCE_INVALID: 4003, // 套餐下架/场地约满/装备库存不足
  NO_PERMISSION: 4004, // 无权限
  DUPLICATE: 4009, // 重复操作
  SYSTEM_ERROR: 5000, // 系统异常
};

/* ===================== 2. 数据库 ===================== */

/**
 * 获取数据库实例
 * @returns {object} uniCloud.database()
 */
function getDB() {
  return uniCloud.database();
}

/* ===================== 3. 双调用模式解析 ===================== */

/**
 * 解析 event，兼容两种调用方式：
 *   - C 端 uniCloud.callFunction：event 直接是 { action, ...data }
 *   - Web 后台 URL 化 HTTP：event 为 HTTP 触发结构，body 是 JSON 字符串
 * @param {object} event
 * @returns {{action:string, data:object, headers:object}}
 */
function getCtx(event) {
  let data = event || {};
  let headers = {};
  if (event && (event.body !== undefined || event.httpMethod)) {
    try {
      data = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
    } catch (e) {
      data = {};
    }
    headers = event.headers || {};
  }
  const action = data.action;
  return { action, data, headers };
}

/* ===================== 4. openid 解析 ===================== */

/**
 * 从 WXContext 取用户标识。
 * C 端微信小程序取 OPENID；支付宝云其他端取 UID；无真实鉴权时回退 dev_user。
 * @returns {string}
 */
function getOpenid() {
  const wx = uniCloud.getWXContext();
  return wx.OPENID || wx.UID || 'dev_user';
}

/* ===================== 5. 入参校验 + NoSQL 注入防护 ===================== */

/**
 * 递归检测对象中是否包含以 $ 开头的键（防 NoSQL 注入）
 * @param {*} value
 * @returns {boolean}
 */
function containsNoSqlOperator(value) {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) {
    return value.some((item) => containsNoSqlOperator(item));
  }
  return Object.keys(value).some((key) => {
    if (key.indexOf('$') === 0) return true;
    return containsNoSqlOperator(value[key]);
  });
}

/**
 * 校验单个字段
 * @param {*} value
 * @param {object} schema { type, required, minLength, maxLength, minimum, maximum, pattern }
 * @returns {string|null}
 */
function validateField(value, schema) {
  const { type, required, minLength, maxLength, minimum, maximum, pattern } = schema;
  if (required && (value === undefined || value === null || value === '')) {
    return '缺少必填字段';
  }
  if (value === undefined || value === null) return null;

  if (type === 'string' && typeof value !== 'string') return '字段类型应为 string';
  if (type === 'integer' || type === 'number') {
    const num = Number(value);
    if (Number.isNaN(num)) return '字段类型应为 number';
    if (minimum !== undefined && num < minimum) return `数值不得小于 ${minimum}`;
    if (maximum !== undefined && num > maximum) return `数值不得大于 ${maximum}`;
  }
  if (type === 'boolean' && typeof value !== 'boolean') return '字段类型应为 boolean';

  if (type === 'string') {
    if (minLength !== undefined && value.length < minLength) return `长度不得小于 ${minLength}`;
    if (maxLength !== undefined && value.length > maxLength) return `长度不得大于 ${maxLength}`;
    if (pattern && !new RegExp(pattern).test(value)) return '格式不合法';
  }
  return null;
}

/**
 * 根据 schema 校验 data（含 NoSQL 注入防护）
 * @param {object} data 入参对象
 * @param {object} schema 形如 { field: { type, required, ... } }
 * @returns {{ok:boolean, error?:string, res?:object}}
 */
function validate(data, schema) {
  if (containsNoSqlOperator(data)) {
    return {
      ok: false,
      error: '检测到非法 NoSQL 操作符',
      res: fail(CODE.PARAM_ERROR, '检测到非法 NoSQL 操作符'),
    };
  }
  for (const field of Object.keys(schema)) {
    const err = validateField(data ? data[field] : undefined, schema[field]);
    if (err) {
      const msg = `${field}: ${err}`;
      return { ok: false, error: msg, res: fail(CODE.PARAM_ERROR, msg) };
    }
  }
  return { ok: true };
}

/* ===================== 6. 操作日志 ===================== */

/**
 * 写入一条操作日志到 logs 集合
 * @param {object} param
 * @param {string} param.operator 操作人（openid / 管理员账号）
 * @param {string} param.opType 操作类型
 * @param {string} param.opTarget 操作对象
 * @param {string} param.opContent 操作内容描述
 * @param {string} [param.opResult] 操作结果，默认 SUCCESS
 * @param {string} [param.orderId] 关联订单
 * @returns {Promise<boolean>}
 */
async function writeLog({ operator, opType, opTarget, opContent, opResult, orderId }) {
  try {
    const doc = {
      operator: operator || 'system',
      opType: opType || 'UNKNOWN',
      opTarget: opTarget || '',
      opContent: opContent || '',
      opResult: opResult || 'SUCCESS',
      orderId: orderId || '',
      opTime: new Date(),
    };
    await getDB().collection('logs').add({ data: doc });
    return true;
  } catch (e) {
    console.error('[common.writeLog] failed', e);
    return false;
  }
}

/* ===================== 7. JWT (HS256) ===================== */

const crypto = require('crypto');
const JWT_SECRET = 'chengye-suixing-secret';

/** base64url 编码 */
function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/** base64url 解码为字符串 */
function base64urlDecode(input) {
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64').toString();
}

/** HMAC-SHA256 并 base64url 编码 */
function hmacSha256(data, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * 签发 JWT（HS256，有效期 2 小时）
 * @param {object} payload 至少含 { username, role }
 * @returns {string} header.payload.signature
 */
function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const nowSec = Math.floor(Date.now() / 1000);
  const body = Object.assign({ iat: nowSec, exp: nowSec + 7200 }, payload);
  const headerStr = base64url(JSON.stringify(header));
  const payloadStr = base64url(JSON.stringify(body));
  const signature = hmacSha256(`${headerStr}.${payloadStr}`, JWT_SECRET);
  return `${headerStr}.${payloadStr}.${signature}`;
}

/**
 * 校验 JWT
 * @param {string} token
 * @returns {object|null} 校验通过返回 payload，否则 null
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerStr, payloadStr, signature] = parts;
  const expected = hmacSha256(`${headerStr}.${payloadStr}`, JWT_SECRET);
  if (expected !== signature) return null;
  let payload;
  try {
    payload = JSON.parse(base64urlDecode(payloadStr));
  } catch (e) {
    return null;
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp && nowSec > payload.exp) return null;
  return payload;
}

/* ===================== 8. 角色守卫 ===================== */

/**
 * 校验角色是否满足要求
 * @param {string} role 当前用户角色
 * @param {string[]} allowedRoles 允许的角色数组
 * @returns {{passed:boolean, res?:object}}
 */
function authGuard(role, allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) return { passed: true };
  if (allowedRoles.indexOf(role) !== -1) return { passed: true };
  return { passed: false, res: fail(CODE.NO_PERMISSION, '无权限') };
}

/* ===================== 9. 辅助函数 ===================== */

/**
 * 从 headers 提取 Bearer token（兼容大小写）
 * @param {object} headers
 * @returns {string}
 */
function getBearerToken(headers) {
  const auth =
    (headers && (headers.Authorization || headers.authorization)) || '';
  if (typeof auth === 'string' && auth.indexOf('Bearer ') === 0) {
    return auth.slice('Bearer '.length).trim();
  }
  return '';
}

/**
 * 分页查询（根据 page.size / page.num，默认 20/1，按字段倒序）
 * @param {string} collectionName
 * @param {object} where 查询条件
 * @param {object} [page] { size, num }
 * @param {string} [orderByField] 默认 createTime
 * @param {string} [order] 默认 desc
 * @returns {Promise<{list:Array, total:number}>}
 */
async function paginate(collectionName, where, page, orderByField, order) {
  const db = getDB();
  const size = (page && page.size) || 20;
  const num = (page && page.num) || 1;
  const obField = orderByField || 'createTime';
  const obOrder = order || 'desc';
  const total = (await db.collection(collectionName).where(where).count()).total;
  const list = (
    await db
      .collection(collectionName)
      .where(where)
      .orderBy(obField, obOrder)
      .skip((num - 1) * size)
      .limit(size)
      .get()
  ).data;
  return { list, total };
}

/**
 * 游标拉取集合全量（用于聚合统计，单批上限 1000）
 * @param {string} collectionName
 * @returns {Promise<Array>}
 */
async function getAll(collectionName) {
  const db = getDB();
  const size = 1000;
  let all = [];
  let skip = 0;
  while (true) {
    const res = await db.collection(collectionName).skip(skip).limit(size).get();
    all = all.concat(res.data);
    if (res.data.length < size) break;
    skip += size;
  }
  return all;
}

/* ===================== 导出 ===================== */

module.exports = {
  success,
  fail,
  CODE,
  validate,
  writeLog,
  getDB,
  getCtx,
  getOpenid,
  signToken,
  verifyToken,
  authGuard,
  getBearerToken,
  paginate,
  getAll,
};
