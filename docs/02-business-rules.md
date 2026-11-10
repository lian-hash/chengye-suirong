# 02 · 业务规则

> 这份文档是"如果老师/面试官问某个按钮背后的规则，你能立刻答出来"的底稿。
> 每条规则都标注了代码位置，说到哪条能翻到哪行。

---

## 1. 订单状态机

### 1.1 七个状态

```
待支付 → 已支付 → 配送中 → 布置中 → 使用中 → 已回收 → 已完成
```

定义在 `uniapp/models/constants.js`：

```js
const ORDER_STATUS = {
  PENDING_PAY: '待支付',
  PAID: '已支付',
  DELIVERING: '配送中',
  SETTING_UP: '布置中',
  IN_USE: '使用中',
  RECOVERED: '已回收',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};
```

外加一个分支态「已取消」。

### 1.2 每个操作允许的状态（真实实现）

这是最容易被问到的部分，逐条对上代码：

| 操作 | 允许的当前状态 | 代码位置 |
|---|---|---|
| `pay` 支付 | 待支付 | `cloudfunctions/order/index.js` |
| `cancel` 取消 | **待支付 / 已支付** | `order/index.js:335` |
| `refund` 退款 | 已支付（且 payStatus = 已支付） | `order/index.js` |
| `reschedule` 改期 | 待支付 / 已支付 | `mock/index.js:233` |
| `renew` 续租 | **仅使用中** | `mock/index.js:259` |
| `submitReview` 评价 | **仅已完成** | `mock/index.js:272` |

### 1.3 一个必须说清楚的点：配送中不能取消

设计讨论阶段有过一个说法——"任意状态都可以转已取消，按状态分级扣费"。**但当前代码的实际限制是：只有「待支付」和「已支付」能取消。**

```js
// cloudfunctions/order/index.js:335
if (['待支付', '已支付'].indexOf(order.orderStatus) === -1) {
  return fail(CODE.ORDER_STATUS_INVALID, '仅待支付/已支付订单可取消');
}
```

为什么最后收紧成两种？

因为「配送中」之后装备已经装车、人工已经投入，取消要走线下协商和部分退款，这套流程（退款金额计算、财务对账、司机调度回滚）在一个学期里做不完。**与其做一个半成品的"扣 20%"，不如明确不开放。**

C 端界面上，取消按钮的显示条件也对应收窄了：

```js
// pages/orderDetail/orderDetail.vue:176
canCancel() {
  return this.order && this.order.orderStatus === '待支付';
},
canRefund() {
  return this.order && this.order.orderStatus === '已支付' && this.order.payStatus === '已支付';
},
```

所以真实口径是：

| 想取消的时机 | C 端怎么办 |
|---|---|
| 还没付款 | 点「取消订单」，订单关闭，无需退款 |
| 已付款、还没派车 | 点「申请退款」，全额退回，券和积分一并退回 |
| 已装车 / 已在场地布置 | C 端不开放，需联系客服人工处理 |

> ⚠️ **已知不一致**：`orderDetail.vue` 的 `onCancel()` 里还留着「配送中扣 20%」「布置中扣 50%」两段文案，但按钮不会在这两个状态出现，所以那两段是**死代码**。这是刻意保留的——业务规则想这么做，但当前版本没实现。这个坑的完整来龙去脉写在 [04 · AI 协作开发复盘](04-ai-playbook.md#案例三-讲法和界面打架)。

---

## 2. 下单的四重校验

`order.create` 不是"收下参数就建单"，它要过四道关。**Mock 层和云函数用的是同一套顺序**：

```js
// uniapp/mock/index.js:115 起
if (action === 'create') {
  // ① 套餐必须存在且在架
  if (!pkg || !pkg.onShelf) return { code: 4003, message: '套餐不存在或已下架' };

  // ② 使用日期必须在可预约周期内
  if (data.useDate < pkg.reservableStart || data.useDate > pkg.reservableEnd)
    return { code: 4003, message: '使用日期不在可预约周期内' };

  // ③ 场地必须可用 + 当日容量没满
  if (!site || site.availableStatus !== '可用') return { code: 4003, message: '场地不可用或已停用' };
  const used = _orders
    .filter((o) => o.siteId === data.siteId && o.useDate === data.useDate && o.orderStatus !== '已取消')
    .reduce((sum, o) => sum + o.quantity, 0);
  if (site.capacity - used < data.quantity) return { code: 4003, message: '该场地当日已约满' };

  // ④ 装备库存够不够（防超卖）
  for (const ref of pkg.equipRefs || []) {
    if (eq.availableQty < ref.qty * data.quantity)
      return { code: 4003, message: `装备「${eq.name}」库存不足` };
  }
}
```

**第 ④ 条是最关键的一条**：一个套餐包含多个装备（比如 PKG001 需要帐篷 1 顶 + 防潮垫 2 张 + 营地灯 1 个 + 折叠椅 2 把），下单 3 份就要乘以 3。只校验套餐价不校验装备，会出现"卖出去 10 单但只有 5 顶帐篷"。

真实云函数版本还多做了一层：**在事务里预占库存**（`dbCmd.inc` 递减 `availableQty`），取消/退款时加回来。Mock 层不做预占，因为它没有并发。

---

## 3. 优惠券规则

三张券，定义在 `uniapp/mock/seed.js`：

| 券 ID | 名称 | 减免 | 门槛 | 有效期 | 库存 |
|---|---|---|---|---|---|
| `CP_NEW20` | 新人立减券 | 减 20 | 无门槛 | 全年 | 999 |
| `CP_FULL50` | 满 300 减 50 | 减 50 | 满 300 | 全年 | 500 |
| `CP_TEAM120` | 团建满 800 减 120 | 减 120 | 满 800 | 9/1–11/30 | 100 |

### 3.1 领券的三重防呆

```js
// uniapp/mock/index.js:395
if (action === 'claim') {
  if (!c) return { code: 4001, message: '券不存在' };
  if (_userCoupons.some((uc) => uc.couponId === data.couponId))
    return { code: 4009, message: '已领取过该券' };      // 防重复领
  if (c.stock <= 0) return { code: 4003, message: '券已发完' };  // 防超发
  c.stock -= 1;
}
```

### 3.2 用券的两个条件

下单时传 `couponId`，后端校验两件事：

1. **这张券必须已经领了、且没用过**（查 `userCoupons` 里 `status === '未使用'`）
2. **订单金额必须够门槛**（`amount >= c.threshold`）

不够门槛直接拒绝，不会"部分抵扣"：

```js
if (c && amount < c.threshold) {
  return { code: 4003, message: `订单未满 ${c.threshold} 元，券不可用` };
}
```

### 3.3 券的生命周期

```
可领取（listAvailable）
   ↓ 领取 → status = 未使用
未使用
   ↓ 下单使用 → 支付成功时 status = 已使用
已使用
   ↓ 退款 → status 退回 未使用
未使用（可再用）
```

**退款把券退回**是个容易被忽略的细节，代码在 `mock/index.js` 的 `refund` 分支里：

```js
if (order.couponId) {
  const claim = _userCoupons.find((c) => c.couponId === order.couponId);
  if (claim) claim.status = '未使用';
}
```

积分同理，用多少退多少。

---

## 4. 积分规则

| 规则 | 值 | 代码位置 |
|---|---|---|
| 兑换比例 | **100 积分 = 1 元** | `POINTS_REDEEM_RATIO = 100` |
| 单笔抵现上限 | **订单金额的 10%** | `maxPoints = Math.floor(amount * 0.1 / POINTS_RATE)` |
| 评价返积分 | **+20 积分** | `_account.points += 20` |
| 积分不足 | 拒绝，`code 4003` | `mock/index.js:166` |

抵现上限的计算：

```js
// 1 积分 = 0.01 元
const POINTS_RATE = 0.01;

// 一单 399 元，最多抵 10% = 39.9 元
// 39.9 元 = 3990 积分 → 但积分是整数，向下取整
const maxPoints = Math.floor(399 * 0.1 / 0.01);  // = 3990
```

所以一单 399 元的订单，最多用 3990 积分抵 39.9 元。

**为什么设 10% 上限？**

防止积分变成主要支付方式，导致现金流断裂。这也是行业通行做法（积分通常只做"甜头"不做"主菜"）。

---

## 5. 改期与续租

### 5.1 改期（reschedule）

**允许状态**：待支付 / 已支付（还没派车的阶段）

**要校验两件事**：

1. 新日期在套餐的可预约周期内
2. 新日期该场地还有容量

```js
// mock/index.js:237-248
if (data.useDate < pkg.reservableStart || data.useDate > pkg.reservableEnd)
  return { code: 4003, message: '新日期不在可预约周期内' };

const used = _orders
  .filter((o) => o.siteId === order.siteId && o.useDate === data.useDate
              && o.orderStatus !== '已取消' && o.orderId !== order.orderId)
  .reduce((sum, o) => sum + o.quantity, 0);
if (site.capacity - used < order.quantity)
  return { code: 4003, message: '新日期该场地已约满' };
```

注意 `o.orderId !== order.orderId` 这个条件——**统计时要把自己排除掉**，否则改期到自己原来那天会误判"已约满"。

改期会留痕：

```js
order.rescheduleLog.push({ from, to, time });
```

> 小 bug：`from` 是在 `order.useDate` 已被赋值之后取的，所以日志里的 `from` 记的是新日期。这个没修，因为只是日志展示，不影响业务。写在这里是为了诚实。

### 5.2 续租（renew）

**只允许「使用中」的订单**，且只能按天续。

**计费**：套餐单价的 **50%** / 天，乘以份数。

```js
// mock/index.js:262
const extra = Number((pkg.price * 0.5 * days * order.quantity).toFixed(2));
order.amount = Number((order.amount + extra).toFixed(2));
```

举例：PKG002（¥399）下了 1 份，续 1 天 = 399 × 0.5 × 1 × 1 = ¥199.5。

**为什么是 50% 而不是原价？**

因为续租时装备已经在场地了，平台不需要再出一趟配送和布置的成本。收半价是覆盖"多占一天装备 + 多一次回收"的成本。

---

## 6. 评价与积分返还

**只允许「已完成」订单评价**，且**一单一评**：

```js
// mock/index.js:272-273
if (order.orderStatus !== '已完成') return { code: 4002, message: '仅已完成订单可评价' };
if (_reviewed.has(data.orderId)) return { code: 4009, message: '该订单已评价' };
```

评价成功后返 20 积分：

```js
_account.points += 20;
_account.totalPointsEarned += 20;
return { code: 0, data: { reviewId, pointsEarned: 20, totalPoints: _account.points } };
```

`_reviewed` 用 `Set` 而不是查数组，是因为评价列表在 Mock 里是可变数组，用 Set 判断重复更快也更不容易出错。

> 真实云函数里这个约束落在数据库唯一索引上（`orderId` + `userId`），比内存 Set 可靠。

---

## 7. 配送追踪

`delivery.track` 返回三样东西：

```js
{
  orderStatus: '配送中',
  rider: { name, phone, plate, etaMinutes, latitude, longitude, updatedAt },
  site:  { siteId, name, address, latitude, longitude },
}
```

**当前是模拟实现**：骑手坐标写死在种子数据里（`seed.js` 的 `ORD_SEED_002`），地图上做定时偏移制造"在移动"的观感。没有接真实地图 SDK，也没有 WebSocket 推送。

这一点在 [06 · 验收清单](06-acceptance.md) 里明确标为"占位实现"。

---

## 8. 权限规则

三个角色，权限差异靠路由守卫 + 云函数双重控制：

| 角色 | C 端 | Web 后台 |
|---|---|---|
| `C端` | 全部用户功能 | 不能登录 |
| `B端`（企业） | — | 订单、配送、财务（**看不到**券/积分/用户管理） |
| `管理员` | — | 全部，含券管理、积分台账、晒单审核 |

Web 端的路由守卫在 `web/src/router/index.js`，菜单按 `meta.roles` 过滤：

```js
{ path: '/points', meta: { roles: ['管理员'] } }
```

**但这只是前端隐藏菜单，不是安全边界。** 真正的权限校验在云函数里：`common/authGuard.js` 会验 JWT 的 `role` 字段，C 端用户拿管理员 token 调接口一样会被拒（`code 4004`）。

> 这点经常被问到："前端隐藏菜单够不够安全？" 答案是不够，必须服务端也校验。这个项目两边都做了。
