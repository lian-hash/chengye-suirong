# 城野随行 · City Wild Companion

**一个微露营装备租赁平台的三端实现，以及它背后完整的 AI 协作开发复盘。**

[![License: MIT](https://img.shields.io/badge/License-MIT-2E7D32.svg)](LICENSE)
[![uni-app](https://img.shields.io/badge/uni--app-Vue2-2E7D32.svg)](uniapp/)
[![Vue3](https://img.shields.io/badge/Vue3-Vite-42B883.svg)](web/)
[![uniCloud](https://img.shields.io/badge/uniCloud-cloudfunctions-007FFF.svg)](uniapp/uniCloud/cloudfunctions/)

---

## 这是什么

「城野随行」不是卖露营装备，而是卖 **一套装上就走、用完就收回的服务**：

> 用户在微信小程序上挑套餐、选营地、定日期 → 平台把装备 **配送到营地** → **现场布置** → **用完回收**。

平台服务三类角色：

| 角色 | 使用者 | 载体 |
|---|---|---|
| **C 端用户** | 去营地玩的个人 | uni-app 微信小程序（14 页） |
| **B 端企业客户** | 团建 / 企业套餐采购方 | Vue3 Web 后台（15 视图） |
| **平台管理员** | 运营、审核、财务 | Vue3 Web 后台（同一套，按角色切菜单） |

---

## 为什么值得看

GitHub 上不缺"学生三端项目"，缺的是**把 AI 协作开发的过程公开写清楚**的仓库。

这个仓库除了代码，还留下了一份 **[AI 协作开发复盘](docs/04-ai-playbook.md)**——记录了这个项目从 0 到 1 是怎么和 AI 一起做出来的：

- 哪些需求一次就写对了，哪些改了四五轮还在跑偏
- 哪些环节 AI 会把已有代码改坏，怎么防
- `pages.json` 被旧基线覆盖、整页代码消失，是怎么从会话日志里一行行重放捞回来的
- 取消订单的扣费规则和实际弹窗文案对不上，是怎么被发现的

配套还有一份 [成本与效率账本](docs/05-cost-ledger.md)：这个项目到底花了多少小时、返工了多少次、如果重做一遍能省掉哪一半。

代码是骨架，这两份文档才是这个仓库真正想留下的东西。

---

## 三分钟跑起来

**不需要云服务空间、不需要 appid、不需要后端。** 所有接口默认走本地 Mock，`clone` 完就能跑完整业务闭环。

### C 端小程序

```bash
cd uniapp
npm install
npm run dev:mp-weixin        # 产物输出到 uniapp/dist/dev/mp-weixin
```

然后打开**微信开发者工具** → 导入项目 → 选择目录 `uniapp/dist/dev/mp-weixin`（**注意是编译产物目录，不是 `uniapp/` 源码目录**）。

> 微信开发者工具需要先在"设置 → 安全设置"里开启**服务端口**，否则编译不会自动同步。

### Web 后台

```bash
cd web
npm install
npm run dev                  # 默认 http://localhost:5173/
```

测试账号（密码任意）：

| 账号 | 角色 | 能看到的菜单 |
|---|---|---|
| `admin` | 管理员 | 全量（含优惠券、积分、晒单审核） |
| `ent` | 企业客户 | 订单、配送、财务 |

> 路由是 hash 模式，进系统后地址形如 `http://localhost:5173/#/dashboard`。

### 常见启动报错

| 报错 | 原因 | 解决 |
|---|---|---|
| `ENOENT: no such file or directory, open '...\package.json'` | 在项目根目录跑了 `npm run dev` | `cd uniapp` 或 `cd web` 再跑 |
| `'vite' 不是内部或外部命令` | 没装依赖 | 在 `web/` 下 `npm install` |
| 微信开发者工具白屏 | 导入的是源码目录 | 改导 `uniapp/dist/dev/mp-weixin` |
| `dist` 目录不存在 | 只 `install` 没 `dev`/`build` | 先跑 `npm run dev:mp-weixin` 生成 |

---

## 仓库结构

```
chengye-suirong/
├── README.md                    ← 你在这里
├── LICENSE                      ← MIT
├── uniapp/                      C 端小程序（uni-app / Vue2）
│   ├── pages/                   14 个页面
│   ├── services/                8 个业务封装（页面不直接调 request）
│   ├── mock/                    seed.js 种子 + index.js 路由（离线可跑的核心）
│   ├── config/unicloud.js       FORCE_MOCK 开关 + 云空间配置（唯一开关）
│   ├── models/constants.js      状态机常量 + 错误码
│   └── uniCloud/cloudfunctions/ 11 个云函数（源码，未部署也能跑 Mock）
├── web/                         B 端 / 管理后台（Vue3 + Vite）
│   ├── src/views/               15 个视图
│   ├── src/api/                 10 个接口封装
│   ├── src/utils/mock.js        Web 端 Mock（与 C 端种子对齐）
│   ├── src/config/backend.js    FORCE_MOCK + URL 化基地址
│   └── .env.example             切真实后端的变量模板
├── docs/                        ★ 沉淀文档（先看这里）
├── design/                      架构设计 + Mermaid 时序/类图
├── drawio/                      draw.io 源文件（可直接改）
└── mock-data/                   CSV 种子 + 云数据库导入脚本
```

---

## 功能全景

四条业务主线，C 端和后台都有对应实现：

### 主线一 · 履约

| 能力 | C 端 | 后台 |
|---|---|---|
| 配送追踪（地图 + 司机位置漂移） | `pages/deliveryTrack` | 配送调度 |
| 订单改期 / 续租 | `pages/orderDetail` | 订单管理 |
| 按状态分级的取消扣费提示 | `pages/orderDetail` | — |

### 主线二 · 内容

| 能力 | C 端 | 后台 |
|---|---|---|
| 带图评价 | `pages/review` | — |
| 晒单广场 | `pages/feed` | 晒单审核 |
| 营地攻略 | `pages/packageDetail`（内嵌区块） | — |

### 主线三 · 营销

| 能力 | C 端 | 后台 |
|---|---|---|
| 优惠券（新人券 / 满减券 / 团建券） | `pages/coupons` | 券管理（发放 / 上下架） |
| 会员积分（100 积分 = 1 元，抵现上限 10%） | `pages/orderCreate`（抵现）/ `pages/mine`（余额） | 积分台账 |

### 主线四 · 智能

| 能力 | C 端 | 后台 |
|---|---|---|
| 场景化筛选（人数 / 天气 / 预算） | `pages/index` | — |
| 天气适配提醒 | `pages/index` | — |
| 收藏 / 心愿单 | `pages/favorites` | — |

---

## 三个值得看的设计

### 1. 一个开关切换 Mock 与真实后端

课程阶段没有云环境，但产品要能演示。做法是把"是否走 Mock"收敛到**唯一入口**：

```js
// uniapp/config/unicloud.js
const FORCE_MOCK = true;              // true = 全部走本地数据
const SPACE_ID = 'your-uni-cloud-space-id';
const CLIENT_SECRET = { appKey: '', appSecret: '' };

function isMock() {
  return FORCE_MOCK || !SPACE_ID || !hasClientSecret() || !isCloudReady();
}
```

补齐密钥、把 `FORCE_MOCK` 置 `false`、完成 `uniCloud.init()`，业务代码**零改动**就切到真实云。

### 2. 订单状态机靠映射表校验，不靠 if 堆

7 个状态 + 任意态可转「已取消」：

```
待支付 → 已支付 → 配送中 → 布置中 → 使用中 → 已回收 → 已完成
   └────────────── 任意态 → 已取消 ──────────────┘
```

合法迁移集中在一张表里，云函数校验时只查表：

```js
const ALLOWED_TRANSITIONS = {
  待支付: ['已支付', '已取消'],
  已支付: ['配送中', '已取消'],
  配送中: ['布置中', '已取消'],
  // ...
};
```

好处是**新增状态只需要改一处**，不用去翻十几个 `if`。

### 3. 统一接口契约

三端所有接口返回同一形状：

```json
{ "code": 0, "message": "success", "data": {} }
```

| code | 含义 |
|---|---|
| `0` | 成功 |
| `4001` | 参数错误 / 资源不存在 |
| `4002` | 状态非法（如"已完成"的订单不能取消） |
| `4003` | 资源非法（套餐下架 / 场地约满 / 库存不足） |
| `4004` | 无权限（角色越权访问） |
| `4009` | 重复操作（重复支付 / 重复评价） |

前端只在一处判断 `code !== 0` 就弹错，不用每个页面各写一套。

---

## 文档导航

| 文档 | 内容 |
|---|---|
| [01 · 架构与接口契约](docs/01-architecture.md) | 三端如何协作、为什么选 uniCloud、Mock 层设计 |
| [02 · 业务规则](docs/02-business-rules.md) | 状态机全表、券规则、积分规则、分状态扣费口径 |
| [03 · 数据模型](docs/03-data-model.md) | 8 个集合的字段、ER 图、种子数据一致性 |
| **[04 · AI 协作开发复盘](docs/04-ai-playbook.md)** | ★ 怎么和 AI 一起做这个项目，哪里翻车了 |
| [05 · 成本与效率账本](docs/05-cost-ledger.md) | 工时、返工次数、如果重做能省多少 |
| [06 · 验收清单](docs/06-acceptance.md) | 每条功能怎么验、当前成熟度自评 |

---

## 已知限制（诚实说明）

这个项目是在课程周期内完成的，有几处明确的取舍：

- **支付是模拟的**：`pay` 只把订单从「待支付」改成「已支付」，没有接微信支付
- **地图是占位实现**：配送追踪用固定坐标 + 定时漂移模拟司机位置，没有接真实地图 SDK
- **客服是静态弹窗**：显示占位联系方式，没有真实客服系统
- **云函数未部署**：11 个云函数只有源码，默认不参与运行；线上演示全走 Mock
- **数据不持久**：Mock 数据存在内存里，刷新页面就回到初始种子

这些限制不是遗漏，是**明确的范围边界**——[06 · 验收清单](docs/06-acceptance.md) 里逐条写清了哪些是"已实现"、哪些是"占位"、哪些是"未做"。

---

## 二次开发

- **新增功能**：先在 `mock/index.js` 把 action 跑通，再补真实云函数，保证离线可演示
- **改种子数据**：`uniapp/mock/seed.js`、`web/src/utils/mock.js`、`mock-data/*.csv` 三处要同步
- **改状态机**：只改 `models/constants.js` 的 `ALLOWED_TRANSITIONS`，不要散到页面里
- **切真实后端**：见 [01 · 架构与接口契约](docs/01-architecture.md) 的"从 Mock 切到真实云"

---

## License

[MIT](LICENSE) —— 随便用，改了也不用告诉我，但出问题别找我。

---

## 致谢

三个人，一个学期，从需求文档一路做到能跑的三端。

以及，和一个不会累但会改坏代码的搭档。
