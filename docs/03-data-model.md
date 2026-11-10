# 03 · 数据模型

> 8 个集合、字段含义、彼此关系，以及"为什么同一个数据要在三个地方各存一份"。

---

## 1. 集合总览

对应需求文档里的数据字典 D1–D8：

| # | 集合 | 存什么 | 主要写入方 |
|---|---|---|---|
| D1 | `users` | 用户、角色、积分余额 | `login` / `webLogin` / `user` |
| D2 | `packages` | 装备套餐（价格、可预约周期、含哪些装备） | `packageSite` / 后台套餐管理 |
| D3 | `sites` | 营地（容量、坐标、合作方） | `packageSite` / 后台场地管理 |
| D4 | `orders` | 订单（状态、金额、券、积分、改期续租留痕） | `order` |
| D5 | `equipments` | 单件装备（库存、状态） | `equipment` / 下单预占 |
| D6 | `deliveries` | 配送记录（派单、布置、回收） | `delivery` |
| D7 | `reviews` | 评价 / 晒单 | `order.submitReview` |
| D8 | `logs` | 操作日志（谁在什么时候改了什么） | `common/writeLog` |

另外 Mock 层还有三份数据没有独立集合（因为它们没有写操作，或暂时存在用户文档里）：

- `coupons` / `userCoupons` —— 券模板与用户领券记录
- `guides` —— 营地攻略
- `userAccount` —— 积分账户（真实部署时挂在 `users` 文档里）

> 云数据库导入用的种子在 `mock-data/cloud-import/*.json`，正好是上面 8 个集合各一份。

---

## 2. 核心字段

### 2.1 packages（套餐）

```js
{
  packageId: 'PKG001',
  name: '春日露营基础套餐',
  price: 199,
  items: '双人帐篷x1, 防潮垫x2, 营地灯x1, 折叠椅x2',  // 展示用文案
  seasonTheme: '春季',
  suitableFor: '情侣/双人',
  scene: '情侣',                 // 主线四：场景化筛选用
  capacityPeople: 2,             // 主线四：按人数筛
  budgetTier: '经济',            // 主线四：按预算筛
  onShelf: true,                 // 下架后下单会被拒（4003）
  bannerUrl: '',
  reservableStart: '2026-03-01', // 可预约周期，下单和改期都校验
  reservableEnd: '2026-05-31',
  equipRefs: [                   // ★ 装备清单：库存校验靠它
    { equipmentId: 'EQ001', qty: 1 },
    { equipmentId: 'EQ002', qty: 2 },
  ],
  setupTips: '先搭外帐用地钉固定四角…',  // 主线一：装备教程
}
```

**`equipRefs` 是这个表的关键设计。** 它把"套餐"和"装备"解耦：套餐只描述"包含什么、各几件"，实际库存查 `equipments`。这样同一个装备（比如帐篷）可以出现在多个套餐里，库存统一管理。

### 2.2 sites（场地）

```js
{
  siteId: 'SITE001',
  name: '东湖绿道营地A区',
  address: '武汉市东湖生态旅游风景区绿道1号',
  capacity: 50,                  // 当日可容纳的订单份数
  availableStatus: '可用',        // 停用后不能下单
  partner: '东湖文旅',
  latitude: 30.5528,             // 主线一：配送追踪地图用
  longitude: 114.3886,
}
```

`capacity` 的校验方式很特别：**不单独扣减字段，而是实时统计**。

```js
const used = orders
  .filter(o => o.siteId === siteId && o.useDate === useDate && o.orderStatus !== '已取消')
  .reduce((sum, o) => sum + o.quantity, 0);
if (site.capacity - used < quantity) → 约满
```

好处是不会出现"计数器算错"导致的数据漂移；代价是每次下单都要扫一遍订单表，订单量大时需要加索引或换方案。

### 2.3 orders（订单）

```js
{
  orderId: 'ORD_SEED_002',
  userId: 'mock_openid_001',
  packageId: 'PKG002',
  siteId: 'SITE002',
  useDate: '2026-11-08',
  quantity: 1,
  orderStatus: '配送中',          // 7 态之一
  payStatus: '已支付',            // 未支付 / 已支付 / 已退款
  amount: 399,
  contactName: '张三',
  contactPhone: '13800000002',
  isBatch: false,                // B 端批量下单标记
  createTime: '2026-11-04T09:00:00.000Z',
  payTime: '2026-11-04T09:12:00.000Z',
  couponId: 'CP_NEW20',          // 用了哪张券
  pointsUsed: 0,                 // 用了多少积分
}
```

外加几个"按需出现"的字段：

| 字段 | 什么时候有 | 用途 |
|---|---|---|
| `rider` | 配送中 | 骑手姓名、电话、车牌、ETA、当前坐标 |
| `rescheduleLog` | 改期后 | `[{ from, to, time }]` |
| `renewLogs` | 续租后 | `[{ days, extra, time }]` |
| `refundAmount` / `refundTime` | 退款后 | 退款金额与时间 |
| `payable` | 查询时计算 | 实付 = amount − 券 − 积分 |

### 2.4 equipments（装备）

```js
{
  equipmentId: 'EQ001',
  name: '双人帐篷',
  availableQty: 12,
  status: '可用',      // 可用 / 维修中 / 已报废
  // ...
}
```

`availableQty` 是**并发争抢的字段**。真实云函数在事务里预占：

```js
await transaction.collection('equipments').doc(id).update({
  availableQty: dbCmd.inc(-ref.qty * quantity),
});
```

取消 / 退款 / 回收时再 `+` 回来。这是整个系统里唯一需要事务的地方。

---

## 3. 表之间的关系

```
users ──1:N──> orders <──N:1── packages ──N:M──> equipments
                  │                                （通过 equipRefs）
                  ├──N:1──> sites
                  ├──1:N──> reviews
                  └──1:N──> deliveries
```

用文字说：

- **一个用户**可以有**多张订单**
- **一张订单**对应**一个套餐 + 一个场地**
- **一个套餐**包含**多种装备**（每种有数量），这是多对多
- **一张订单**最多有**一条评价**（一单一评，靠唯一约束保证）
- **一张订单**可以有多条**配送记录**（派单 / 布置 / 回收各一条）

draw.io 源的完整 ER 图在 `drawio/城野随行_图3-1_E-R图_.drawio`，逻辑结构设计在 `3-2 逻辑结构设计图`（仓库根目录的 `drawio/` 下）。

---

## 4. 同一个数据存在三个地方

这是接手这个项目第一个会困惑的点：

| 位置 | 用途 | 什么时候改 |
|---|---|---|
| `uniapp/mock/seed.js` | C 端 Mock（小程序离线跑） | 改业务数据时 |
| `web/src/utils/mock.js` | Web 端 Mock（后台离线跑） | 同上，**必须同步** |
| `mock-data/cloud-import/*.json` | 部署到云数据库的种子 | 同上，**必须同步** |

**为什么要忍受这个重复？**

因为小程序和 Web 是两个独立工程，前者跑在微信里、后者跑在浏览器里，无法共享一个文件。而云数据库导入用的是 JSON 格式。

**代价是真实的**：改一个套餐价格，要改三个地方，漏一个就会出现"小程序显示 ¥199、后台显示 ¥399"的穿帮。

这个坑在 `README.md` 的"二次开发"一节里明确警告了。更好的方案是做一个共享的 seed 生成脚本（`mock-data/gen_mock_csv.py` 已经做了类似的事，但没有覆盖到两端 Mock），这件事没做完，写在 [06 · 验收清单](06-acceptance.md) 的"未做"里。

---

## 5. 索引建议

当前是 Mock 模式，没有索引问题。切真实云后至少要加这几个：

| 集合 | 索引字段 | 为什么 |
|---|---|---|
| `orders` | `userId + orderStatus` | 订单列表按状态筛 |
| `orders` | `siteId + useDate` | 容量校验要扫这个组合 |
| `orders` | `orderId`（唯一） | 详情查询 |
| `reviews` | `orderId + userId`（唯一） | 一单一评 |
| `equipments` | `equipmentId`（唯一） | 库存预占要精确命中 |
| `logs` | `createTime`（降序） | 日志列表按时间倒序 |

---

## 6. 字段命名约定

- 主键统一 `<实体>Id`：`packageId` / `siteId` / `orderId` / `equipmentId`
- 状态字段统一 `xxxStatus`，值是中文（`'待支付'` / `'可用'`），不是数字枚举
- 时间统一 ISO 字符串（`'2026-11-04T09:00:00.000Z'`），不用时间戳
- 布尔值统一 `isXxx` / `onXxx`：`isBatch` / `onShelf`

**为什么状态用中文而不是数字？**

因为调试时看数据库能直接读懂，不用回头查枚举表。代价是占空间略大、排序不直观——但对这个体量的项目，可读性比性能重要。

> 这是一个可以商量的取舍。如果将来要做多语言，中文状态值会成为障碍，那时应该改成 `PENDING_PAY` 这类英文常量。当前 `models/constants.js` 已经是英文键 + 中文值，改起来只需要换值。
