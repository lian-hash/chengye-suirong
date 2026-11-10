#!/usr/bin/env node
/**
 * 城野随行 —— 把模拟数据一键灌入 uniCloud 云数据库
 * ==================================================
 *
 * 前置条件
 * --------
 * 1. uniCloud 服务空间已创建，且 8 个集合已建好（或允许导入时自动创建）。
 * 2. `initDB` 云函数已上传。
 * 3. `initDB` 云函数已开启「URL 化」，拿到形如
 *      https://xxxx.service.tcloudbase.com/initDB
 *    的基础地址（Web 后台 UNICLOUD_HTTP_BASE 用的就是这类地址）。
 *
 * 用法
 * ----
 *   # 1) 先查看各集合现有条数（验证连通性）
 *   node import_to_cloud.js --url https://xxx/initDB --stats
 *
 *   # 2) 灌入全部 8 个集合（不清空，追加）
 *   node import_to_cloud.js --url https://xxx/initDB --all
 *
 *   # 3) 重灌：先清空每个集合再灌入（演示前复位推荐）
 *   node import_to_cloud.js --url https://xxx/initDB --all --clear
 *
 *   # 4) 只灌某一个集合
 *   node import_to_cloud.js --url https://xxx/initDB --only packages
 *
 * 也可以把地址放进环境变量，省得每次敲：
 *   export UNICLOUD_HTTP_BASE=https://xxx.service.tcloudbase.com
 *   node import_to_cloud.js --all --clear
 *
 * 安全加固（配合 initDB 的 ADMIN_KEY 校验）
 * --------------------------------------
 * 若云端 initDB 云函数配置了环境变量 ADMIN_KEY，则其写操作 import / clear
 * 会校验入参中的 adminKey；未配置 ADMIN_KEY 时云端放行（仅打印告警），
 * 保持课程演示可灌数据。
 * 本脚本从**本地环境变量 UNICLOUD_ADMIN_KEY** 读取该密钥：
 *
 *   export UNICLOUD_ADMIN_KEY=<你的密钥>          # Linux / macOS / Git Bash
 *   set UNICLOUD_ADMIN_KEY=<你的密钥>             # Windows CMD
 *   $env:UNICLOUD_ADMIN_KEY='<你的密钥>'          # Windows PowerShell
 *
 * 读取到就随 body 带上 adminKey 字段；**不存在则不带该字段**（向后兼容，
 * 行为与旧版一致）。注意 UNICLOUD_ADMIN_KEY 必须与云端 ADMIN_KEY 完全一致。
 *
 * 说明：本脚本只做 HTTP 转发，数据来自 cloud-import/*.json
 *      （由 csv_to_cloud_json.py 生成，类型已修正为布尔/数组/数字）。
 */

const fs = require('fs');
const path = require('path');

const BASE = __dirname;
const IMPORT_DIR = path.join(BASE, 'cloud-import');

/** 按依赖顺序灌入：主数据 → 订单 → 订单附属 */
const ORDER = [
  'users', 'packages', 'sites', 'equipments',
  'orders', 'deliveries', 'reviews', 'logs',
];

/** 解析命令行参数 */
function parseArgs(argv) {
  const args = { stats: false, all: false, clear: false, only: null, url: '' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--stats') args.stats = true;
    else if (a === '--all') args.all = true;
    else if (a === '--clear') args.clear = true;
    else if (a === '--only') args.only = argv[++i];
    else if (a === '--url') args.url = argv[++i];
    else if (a === '-h' || a === '--help') args.help = true;
  }
  return args;
}

/** 计算云函数 URL */
function resolveUrl(explicit) {
  let base = explicit || process.env.UNICLOUD_HTTP_BASE || '';
  if (!base) return '';
  base = base.replace(/\/+$/, '');
  // 允许传「空间根地址」或「已带 /initDB 的完整地址」
  if (/\/initDB$/i.test(base)) return base;
  if (/\/initdb$/i.test(base)) return base;
  return base + '/initDB';
}

/**
 * 读取本地管理密钥，构造写操作要附带的 adminKey 字段
 * ------------------------------------------------
 * 从环境变量 UNICLOUD_ADMIN_KEY 取值；未配置时返回空对象（不带 adminKey），
 * 与旧版行为一致，便于在未做安全加固的环境中继续使用。
 *
 * @returns {{adminKey?: string}} 待合并进 POST body 的字段
 */
function adminKeyPayload() {
  const key = String(process.env.UNICLOUD_ADMIN_KEY || '').trim();
  return key ? { adminKey: key } : {};
}

/** 调用云函数 */
async function invoke(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error(`响应不是合法 JSON（HTTP ${res.status}）：${text.slice(0, 200)}`);
  }
  return json;
}

/** 读取某个集合的 JSON 数据 */
function readDocs(name) {
  const file = path.join(IMPORT_DIR, name + '.json');
  if (!fs.existsSync(file)) {
    console.log(`  [skip] ${name}: 未找到 cloud-import/${name}.json`);
    return null;
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function doStats(url) {
  console.log('查询各集合条数...');
  const r = await invoke(url, { action: 'stats' });
  if (r.code !== 0) {
    console.error('  [fail]', r.message);
    process.exitCode = 1;
    return;
  }
  const { stats, total } = r.data;
  console.log('  集合          条数');
  console.log('  ' + '-'.repeat(24));
  for (const k of ORDER) {
    console.log(`  ${k.padEnd(12)} ${stats[k]}`);
  }
  console.log('  ' + '-'.repeat(24));
  console.log(`  合计         ${total}`);
}

async function doImport(url, names, clear) {
  let ok = 0;
  let skipped = 0;
  for (const name of names) {
    const docs = readDocs(name);
    if (!docs || docs.length === 0) {
      skipped++;
      continue;
    }
    process.stdout.write(`  导入 ${name.padEnd(12)} ${String(docs.length).padStart(3)} 条 ... `);
    try {
      const r = await invoke(url, {
        action: 'import',
        collection: name,
        docs,
        clear: !!clear,
        operator: 'import_script',
        ...adminKeyPayload(),
      });
      if (r.code === 0) {
        console.log(`OK（现存 ${r.data.total} 条${clear ? `，清空 ${r.data.cleared} 条` : ''}）`);
        ok++;
      } else {
        console.log(`失败：${r.message}`);
        if (r.message && String(r.message).includes('adminKey')) {
          console.log('       ↑ 云端 initDB 已启用 ADMIN_KEY 校验，请 export UNICLOUD_ADMIN_KEY=<同一密钥> 后重试。');
        }
        process.exitCode = 1;
      }
    } catch (e) {
      console.log(`异常：${e.message}`);
      process.exitCode = 1;
    }
  }
  console.log(`\n完成：成功 ${ok} 个集合${skipped ? `，跳过 ${skipped} 个` : ''}`);
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]);
    return;
  }

  const url = resolveUrl(args.url);
  if (!url) {
    console.error('缺少云函数地址。用法：');
    console.error('  node import_to_cloud.js --url https://xxx.service.tcloudbase.com/initDB --all');
    console.error('或设置环境变量 UNICLOUD_HTTP_BASE');
    process.exitCode = 1;
    return;
  }
  console.log(`云函数地址：${url}`);
  if (!String(process.env.UNICLOUD_ADMIN_KEY || '').trim()) {
    console.log(
      '提示：未检测到环境变量 UNICLOUD_ADMIN_KEY，写操作将不带 adminKey。\n' +
        '      若云端 initDB 已配置 ADMIN_KEY，import 会被拒绝，届时执行：\n' +
        '      export UNICLOUD_ADMIN_KEY=<与云端一致> 后重试。\n'
    );
  } else {
    console.log('检测到本地 UNICLOUD_ADMIN_KEY，写操作将携带 adminKey。\n');
  }

  if (args.stats) {
    await doStats(url);
    if (!args.all && !args.only) return;
    console.log('');
  }

  if (args.only) {
    if (!ORDER.includes(args.only)) {
      console.error(`未知集合：${args.only}，可选 ${ORDER.join('/')}`);
      process.exitCode = 1;
      return;
    }
    console.log(`导入单个集合：${args.only}${args.clear ? '（先清空）' : ''}`);
    await doImport(url, [args.only], args.clear);
    return;
  }

  if (args.all) {
    console.log(`导入全部 8 个集合${args.clear ? '（每个先清空，重灌模式）' : '（追加模式）'}`);
    await doImport(url, ORDER, args.clear);
    console.log('\n最终条数：');
    await doStats(url);
    return;
  }

  console.log('未指定动作。可选：--stats / --all / --only <集合> （可加 --clear）');
}

main().catch((e) => {
  console.error('执行异常：', e.message);
  process.exitCode = 1;
});
