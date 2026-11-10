# 01 · 架构与接口契约

> 这份文档回答三个问题：三端各自负责什么、它们怎么连起来、为什么这样连。

---

## 1. 三端与职责

| 端 | 技术 | 运行在哪 | 负责什么 |
|---|---|---|---|
| C 端小程序 | uni-app（Vue2 语法）→ 编译成微信小程序 | 微信 | 用户浏览、下单、支付、追踪、评价 |
| B 端 / 管理后台 | Vue3 + Vite + Element Plus | 浏览器 | 订单调度、装备管理、财务、内容审核 |
| 后端 | uniCloud 云函数（Node.js） | 阿里云/支付宝云 | 业务校验、库存事务、日志 |

**为什么是三个端而不是一个后台？**

因为使用者不是同一批人。C 端用户要在手机上完成"选套餐 → 下单 → 看司机到哪了"，这些操作放到网页后台没有意义；B 端运营要在电脑上批量处理订单、看财务报表，塞进小程序也做不了。

三端共享同一套数据语义，但交互形态完全不同——这是分开的理由，不是"为了显得完整"。

---

## 2. 请求链路

三个端的调用链长得一样，只是具体实现不同：

```
页面/视图
   ↓  只调用业务语义方法（orderService.create / api.order.list）
services（C端 8 个） / api（Web 10 个）
   ↓  只传 (云函数名, action, data)，不关心底层
request.js（两端各一份）
   ↓  这里是唯一的开关点
   ├─ Mock 模式 → mock/index.js（C端）/ utils/mock.js（Web）
   └─ 真实模式 → uniCloud.callFunction / axios POST 到 URL 化地址
```

**这条链的设计原则**：页面永远不知道数据从哪来。

`pages/orderDetail.vue` 里写的是 `orderService.detail(orderId)`，不是 `uniCloud.callFunction(...)`。所以把 `FORCE_MOCK` 从 `true` 改成 `false`，**页面代码一行都不用动**。

---

## 3. 为什么选 uniCloud 而不是自己写后端

这是一个真实的取舍，不是"因为它方便"。

| 方案 | 优点 | 为什么不选 |
|---|---|---|
| 自建 Node/Java 后端 | 完全可控，能部署到任何地方 | 需要服务器、域名、备案，课程周期内不现实 |
| 微信云开发 | 和小程序天然集成 | 只能服务微信端，Web 后台要额外对接 |
| **uniCloud** | 一个空间同时服务小程序和 Web（HTTP 化），有免费额度 | 选它 |
| 纯前端 Mock | 零成本 | 只能演示，不能验证真实链路 |

uniCloud 的关键好处是：**同一批云函数，小程序走 `callFunction`，Web 后台走「URL 化」的 HTTP 接口**。业务逻辑只写一份。

代价是它绑定 DCloud 生态，迁不走。这在课程项目里可以接受，但要在文档里说清楚——见本文末尾的"取舍"。

---

## 4. Mock 层是怎么设计的

Mock 不是"随便返回假数据"，它要满足两个条件：

1. **和真实接口返回同一个形状** `{code, message, data}`
2. **状态要能串起来**：下单之后能支付、支付之后能在列表里看到

所以 Mock 层被设计成一个**内存状态机**：

```js
// uniapp/mock/index.js
const seed = require('./seed');

// 直接复用 seed 的引用，让 create → pay → list 跨调用自洽
const _orders = seed.orders;
const _account = seed.userAccount;
const _reviewed = new Set();   // 防重复评价

function handle(name, action, data = {}) {
  switch (name) {
    case 'order':
      if (action === 'create') { /* 完整校验链，和云函数一致 */ }
      if (action === 'pay')    { /* 核销券 + 扣积分 + 改状态 */ }
      // ...
  }
  return { code: 4001, message: `未实现的 mock 接口: ${name}/${action}`, data: null };
}
```

几个刻意的设计：

**① 校验链和云函数逐条对齐。** `mock/index.js` 的 `create` 里有 4 重校验（套餐上架 / 可预约周期 / 场地容量 / 装备库存），和 `cloudfunctions/order/index.js` 的 P3.1 校验顺序一致。这样 Mock 阶段就能发现业务漏洞，而不是等接真云才暴露。

**② 非 0 也 reject。** `request.js` 里 Mock 和真实模式对错误码的处理完全一致（都弹 toast + reject），页面里的 `.catch` 不需要区分模式。

**③ 未实现的接口显式报错。** 返回 `4001 未实现的 mock 接口: xxx/yyy`，而不是返回空数据。这样漏实现的 action 会在控制台立刻暴露，不会伪装成"没数据"。

---

## 5. 从 Mock 切到真实云：三个步骤

### 步骤一：C 端填密钥

```js
// uniapp/config/unicloud.js
const FORCE_MOCK = false;                        // ← 改这里
const SPACE_ID = '你的空间ID';
const CLIENT_SECRET = {
  appKey: '你的AppKey',
  appSecret: '你的AppSecret',
};
```

`main.js` 检测到密钥齐全后会执行 `uniCloud.init()`，`request.js` 的 `isMock()` 自动返回 `false`。

### 步骤二：Web 端配地址

```bash
# web/.env.local（这个文件不入库）
VITE_FORCE_MOCK=false
VITE_UNICLOUD_HTTP_BASE=https://<你的空间域名>/http/
```

**注意**：每个被 Web 调用的云函数都要在 uniCloud 控制台单独开「URL 化」，漏开一个就报 404。

### 步骤三：灌种子数据

部署后先跑一次 `initDB` 云函数导入初始数据，否则所有列表都是空的。

---

## 6. 接口契约

三端所有接口返回同一个形状，没有例外：

```json
{ "code": 0, "message": "success", "data": {} }
```

| code | 语义 | 典型触发 |
|---|---|---|
| `0` | 成功 | — |
| `4000` | 参数缺失 | 改期时没选新日期 |
| `4001` | 参数错误 / 资源不存在 | 订单号查不到 |
| `4002` | 状态非法 | 已完成订单去支付 |
| `4003` | 资源非法 | 套餐下架、场地约满、库存不足、券不满足门槛 |
| `4004` | 无权限 | C 端用户操作别人的订单 |
| `4009` | 重复操作 | 重复支付、重复评价、重复领券 |

**为什么不用 HTTP 状态码区分？**

因为小程序端 `callFunction` 拿不到 HTTP 状态码（它走的是私有协议），Web 端走 HTTP 但为了和小程序保持同一套判断逻辑，也把业务结果放在 body 的 `code` 里。

代价是：HTTP 层面永远是 200，监控系统看不出业务失败率。这个坑下面会写。

---

## 7. 状态机放在哪

状态的**合法迁移表**应该在服务端，不应该在页面里。

当前实现的位置：

- `uniapp/models/constants.js` —— 定义 7 个状态和流转顺序 `ORDER_STATUS_FLOW`，给前端时间线展示用
- `cloudfunctions/order/index.js` —— 真正裁决每个 action 允许什么状态

前端的时间线只是"画出来给人看"，即使有人篡改前端，服务端仍会拒绝非法迁移。

> 具体每个 action 允许哪些状态，见 [02 · 业务规则](02-business-rules.md)。

---

## 8. 关键取舍

诚实列出这个架构的代价：

| 取舍 | 代价 | 为什么还是这么选 |
|---|---|---|
| 用 uniCloud | 绑定 DCloud 生态，迁不到自己的服务器 | 一个空间同时服务两端，课程周期内最省事 |
| C 端用 Vue2 语法 | uni-app 的 Vue3 支持当时不成熟 | Vue2 的 uni-app 生态最稳，官方模板就是 Vue2 |
| 不用 TypeScript | 接口字段靠注释和种子数据约束 | 团队三人都不熟 TS，强上会拖慢进度 |
| 状态码放 body | HTTP 监控看不到业务失败 | 为了三端判断逻辑统一 |
| Mock 层手写 | 和云函数有两份校验代码，要手动同步 | 换来完全离线可演示 |

最后一条是真实痛点：**Mock 和云函数的校验链是两份代码**，改了一处忘了另一处就会不一致。这个问题的具体案例见 [04 · AI 协作开发复盘](04-ai-playbook.md)。
