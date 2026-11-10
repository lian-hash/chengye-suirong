# 城野随行 · uniCloud 部署与联调操作单

> **适用范围**：把「城野随行」从 Mock 数据切换到**真实 uniCloud（支付宝云）**后端，并完成 C 端小程序 + B 端 Web 后台端到端联调。
>
> **本文约定**：所有路径以仓库根目录 `城野随行/` 为基准；本机绝对路径为 `D:/path/to/chengye-suirong`。
>
> **环境速查**
>
> | 项 | 值 |
> |---|---|
> | 服务空间 spaceId | `your-uni-cloud-space-id` |
> | 服务商 | `alipay`（支付宝云，**不是**微信云开发） |
> | 空间配置文件 | `uniapp/uniCloud/uniCloud.config.json` |
> | 云函数目录 | `uniapp/uniCloud/cloudfunctions/`（公共模块 `common` + 10 个业务函数，共 11 个） |
> | HBuilderX | `D:/HTML/HBuilderX/HBuilderX.exe` |
> | 微信开发者工具 | `C:/Program Files (x86)/Tencent/微信web开发者工具` |
> | Node（本机托管版，≥18） | `C:\Users\Lenovo\.workbuddy\binaries\node\versions\24.14.0\node.exe` |
>
> **总体顺序**：① 准备工程 → ② 处理公共模块 → ③ 上传云函数 → ④ 建集合 → ⑤ 建后台账号 → ⑥ 开 URL 化（含 **§6.1 initDB 安全加固**）→ ⑦ 灌模拟数据 → ⑧ 切真实数据（两处开关）→ ⑨ 运行验证 → ⑩ 排障。
> **任何一步失败都不要往下走**，先按文末「九、常见问题速查」处理。

---

## 零、开工前 30 秒自检

- [ ] 已能联网登录 [uniCloud 控制台](https://unicloud.dcloud.net.cn/)（用创建该服务空间的同一 DCloud 账号）。
- [ ] 控制台左上角空间切换处，能看到 `your-uni-cloud-space-id`（支付宝云）。
- [ ] 本地 `uniapp/uniCloud/cloudfunctions/` 下存在 **11 个目录**：`common`、`login`、`user`、`packageSite`、`order`、`delivery`、`equipment`、`finance`、`log`、`webLogin`、`initDB`。
- [ ] 仓库根 `城野随行/` 下**不应**再存在 `uniCloud/` 目录（若发现残留说明迁移未完成，先完成迁移再继续）。
- [ ] 已备份一份当前仓库（部署要改配置，出错可回滚）。

> ✅ **目录结构已定稿**：`uniCloud/` 已迁入 uni-app 工程根下，即 `城野随行/uniapp/uniCloud/`，与 `pages.json` / `manifest.json` 处在同一棵工程树。
> 因此 HBuilderX 导入 `城野随行/uniapp` 后即可直接右键上传云函数，**无需任何迁移**。`uniCloud.config.json` 原样保留（spaceId `your-uni-cloud-space-id`、provider `alipay`），关联关系依然有效。

---

## 一、HBuilderX 准备

### 1.1 打开 / 导入 uni-app 工程

- [ ] 双击启动 `D:/HTML/HBuilderX/HBuilderX.exe`。
- [ ] 菜单 `文件 → 导入 → 导入本地目录`（或直接在项目管理器 `右键 → 导入`）。
- [ ] **导入目录选 `城野随行/uniapp`**，不要选仓库根 `城野随行`（仓库根没有 `manifest.json`，HBuilderX 会识别失败或识别成普通目录）。
- [ ] ⚠️ **只能保留这一个项目条目**：如果之前导入过仓库根 `城野随行`，请在项目管理器里 `右键该项目 → 从项目管理器移除 / 移除项目`，只保留 `城野随行/uniapp`。
      > 同时存在两个条目时，容易误操作到旧路径、也会让 `@todo` 类跳转混乱；**磁盘上绝不允许出现两份 `uniCloud/`**。
- [ ] 导入成功后，项目管理器出现 `uniapp` 节点，展开可见 `pages.json`、`manifest.json`、`App.vue`、`main.js`、**`uniCloud`**（与 pages.json 同级）。
- [ ] 若 HBuilderX 提示缺少 uni-app 编译插件，点「安装」并等待完成，重启 HBuilderX。

### 1.2 确认 HBuilderX 已识别 `uniCloud`（10 秒复核）

`uniCloud` 目录已在 uni-app 工程根下（`uniapp/uniCloud`），与 §1.1 导入的项目树一致，**无需迁移**。

- [ ] 在项目管理器展开 `uniapp → uniCloud → cloudfunctions`，应能看到 11 个函数目录。
- [ ] 选中任一云函数右键，菜单应出现「上传部署」「上传并运行」等项 —— 即识别成功。
- [ ] 若没有这些菜单项：在项目管理器空白处 `右键 → 刷新` → 仍无效则重启 HBuilderX → 仍无效回到 §1.1，确认导入的是 `城野随行/uniapp` 而非其它目录。

### 1.3 绑定服务空间

- [ ] 右键 `uniCloud` 目录 → `关联云服务空间或项目`（若已关联则可忽略）。
- [ ] 选择 `your-uni-cloud-space-id`（支付宝云）。若列表为空，先在 uniCloud 控制台确认该空间归属当前登录账号。
- [ ] 打开 `uniapp/uniCloud/uniCloud.config.json` 复核内容应为：
      ```json
      { "spaceId": "your-uni-cloud-space-id", "provider": "alipay" }
      ```
- [ ] 若 association 后 `uniCloud` 图标上无云朵标记，尝试 `右键 uniCloud → 刷新`，或重启 HBuilderX。

---

## 二、公共模块 `common`（最容易踩坑，务必先做）

**为什么先做**：`login`、`webLogin`、`initDB` 等所有业务云函数内部都用 `require('common')` 取数据库连接、工具方法、JWT 密钥等。若 `common` 不是「公共模块」，上传后运行时会报 `Cannot find module 'common'`，表现为**所有接口统一失败**。

- [ ] 在项目管理器确认 `uniapp/uniCloud/cloudfunctions/common` 存在，且里面有 `index.js`（以及必要的 `package.json`）。
- [ ] **判断现状**：右键 `uniapp/uniCloud/cloudfunctions/common` 目录：
  - 菜单中有「**上传公共模块**」→ ✅ 已被识别为公共模块，跳到 §2.2；
  - 菜单中只有「上传部署」等普通云函数项，或看不到公共模块相关项 → ⚠️ 未被识别，走 §2.1 重建。

### 2.1 右键看不到「公共模块」时的重建办法

- [ ] 右键 `uniapp/uniCloud/cloudfunctions` → `新建云函数/公共模块`。
- [ ] 在弹出框中：类型选「**公共模块**」（不是云函数），名称填 `common`，勾选要关联的云服务空间 `your-uni-cloud-space-id`。
- [ ] 新建完成后（若自动打开了向导模板先关闭），把**旧 `common/index.js` 的完整内容**复制粘贴到**新建的 `common/index.js`** 中并保存；若旧 `common` 还有 `package.json` 或其他文件，一并迁过来。
- [ ] 确认旧目录已清空/删除，**不要留下两个同名目录**。
- [ ] 再次右键 `common` 复查，此时应出现「上传公共模块」。

> 替代办法（不想走向导时）：直接编辑 `uniapp/uniCloud/cloudfunctions/common/package.json`，确认存在 `"cloudfunction-type": "common"` 字段并写 `"name": "common"`；改完后在 HBuilderX 里刷新项目再右键复查。

### 2.2 上传公共模块

- [ ] 右键 `uniapp/uniCloud/cloudfunctions/common` → `上传公共模块`（或 `上传部署`）。
- [ ] 控制台输出出现 `上传公共模块成功` / `部署成功` 类提示。
- [ ] 到 uniCloud 控制台 `云函数 → 公共模块` 列表里能看到 `common`。

---

## 三、上传全部云函数

- [ ] 右键 `uniapp/uniCloud/cloudfunctions` → `上传所有云函数`（若没有该项，逐个右键 → `上传部署`）。
- [ ] 逐个确认上传目标空间为 **`your-uni-cloud-space-id`（支付宝云）**，不要误传到腾讯云/阿里云的其他空间。
- [ ] 需上传清单（勾选复查）：

  | # | 云函数 | 用途 | 上传完成 |
  |---|---|---|---|
  | 1 | `common` | 公共模块（上一节已完成） | ☐ |
  | 2 | `login` | C 端微信登录 | ☐ |
  | 3 | `webLogin` | 后台登录、JWT 签发 | ☐ |
  | 4 | `user` | 用户列表 / 角色管理 | ☐ |
  | 5 | `packageSite` | 套餐 CRUD、上下架、场地 CRUD | ☐ |
  | 6 | `order` | 下单、列表、详情、取消、退款、B 端批量下单 | ☐ |
  | 7 | `delivery` | 配送列表、分派、布置、回收 | ☐ |
  | 8 | `equipment` | 装备列表、消毒、更新 | ☐ |
  | 9 | `finance` | 财务统计 | ☐ |
  | 10 | `log` | 操作日志 | ☐ |
  | 11 | `initDB` | 初始化账号 + 批量灌数据（§5、§7 要用） | ☐ |

- [ ] ✅ 全部上传后，在 uniCloud 控制台 `云函数` 列表逐个点开，确认状态「正常 / 已部署」、文件大小非 0（应为 **11 个**：`common` + 10 个业务函数）。
- [ ] **冒烟：用控制台自带调试跑一次 `login`**（body 填 `{"action":"code2Session","code":"x"}` 之类非法入参），期望返回 `{"code":非0,"message":"..."}` 形状的**结构**（说明函数已加载可执行）；若返回 `Cannot find module 'common'` → 回 §2 重做公共模块。

---

## 四、手动创建 8 个数据库集合（漏了必报错）

> uniCloud **不支持用代码创建集合**，必须由控制台手工建。漏建集合时，写入会报「集合不存在」（`collection not exists` / `DATABASE_COLLECTION_NOT_EXISTS`），且常常只在写操作才暴露，查列表会伪装成「空数据」。

- [ ] 登录 uniCloud 控制台 → 确认当前空间为 `your-uni-cloud-space-id`（支付宝云）。
- [ ] 左侧进入 `云数据库 → 数据库集合` → `新建集合`（不同版本可能叫「创建集合」）。
- [ ] 逐个创建下列 **8 个**集合（名称必须**完全一致**，区分大小写，不要加前缀/后缀）：

  | # | 集合名 | 内容 | 创建完成 |
  |---|---|---|---|
  | 1 | `users` | C 端用户 + 后台账号（admin/ent 也在这里） | ☐ |
  | 2 | `packages` | 微露营套餐 | ☐ |
  | 3 | `sites` | 营地场地 | ☐ |
  | 4 | `equipments` | 装备库存 | ☐ |
  | 5 | `orders` | 订单主表 | ☐ |
  | 6 | `deliveries` | 配送单 | ☐ |
  | 7 | `reviews` | 评价 | ☐ |
  | 8 | `logs` | 操作日志 | ☐ |

- [ ] 创建时权限/表结构一律保持默认即可（本项目全部读写走云函数，不做客户端直连，无需配权限规则）。
- [ ] 复核：控制台集合列表应恰好显示上述 8 个；多出的历史/误建集合可删除。
- [ ] （可选，推荐）给每个集合添加一条任意空白记录再删除，确认可写 —— 这一步能提前暴露权限问题。

---

## 五、创建后台登录账号

`initDB` 的 `init` 动作**幂等**：已存在同名账号则跳过，重复执行安全。

- [ ] 方式一（推荐）：HBuilderX 项目管理器右键 `uniapp/uniCloud/cloudfunctions/initDB` → `运行 / 上传并运行`，在运行参数框填入：
      ```json
      { "action": "init" }
      ```
      > 若 HBuilderX 弹出「本地运行 / 连接云端」请选择**连接云端**（本地没有数据库）。
- [ ] 方式二（URL 化之后，见 §6）：`POST <initDB 的 URL 化地址>`，body `{"action":"init"}`。
- [ ] 返回结果中确认：`code = 0`，且 `message` / `data` 表明已创建或已存在：

  | 账号 | 密码 | 角色 | 期望结果 |
  |---|---|---|---|
  | `admin` | `admin123` | 管理员（全部菜单可见） | 已创建 或 已存在跳过 |
  | `ent` | `ent123` | B端（企业：批量下单、订单管理） | 已创建 或 已存在跳过 |

- [ ] 到控制台 `users` 集合里检索 `username = admin` 与 `username = ent`，应各有 1 条文档（不要出现 2 条以上，出现说明被反复创建，检查幂等逻辑）。
- [ ] ⚠️ 若返回「集合不存在」→ 回 §4 确认 `users` 已创建。

---

## 六、开启 URL 化（每个函数单独开）

> Web 后台是通过 HTTP 直接调用云函数的（POST 到 `UNICLOUD_HTTP_BASE + 函数名`）。**URL 化必须逐个云函数单独开启**，开了 `webLogin` 不代表 `order` 可用；没开的函数线上表现就是 **404**。

- [ ] uniCloud 控制台 → `云函数`（列表）逐个进入 → `URL 化 / HTTP 触发` → 开启 → 复制生成的域名**基础地址**并统一记录：

  ```
  https://<你的空间域名>/http/          ← 结尾必须有 "/"
  ```
  > 记到下面的表里，§7、§8 都要用。

- [ ] 需开启清单（勾选复查）：

  | 云函数 | Web 后台用到的 action | 必开 | 已开 |
  |---|---|---|---|
  | `webLogin` | `login` | ✅ | ☐ |
  | `user` | `list`、`updateRole` | ✅ | ☐ |
  | `packageSite` | `listPackages`、`getPackage`、`upsertPackage`、`setShelf`、`siteList`、`upsertSite` | ✅ | ☐ |
  | `order` | `list`、`detail`、`cancel`、`refund`、`batchCreate` | ✅ | ☐ |
  | `delivery` | `list`、`dispatch`、`setup`、`recover` | ✅ | ☐ |
  | `equipment` | `list`、`disinfect`、`update` | ✅ | ☐ |
  | `finance` | `stats` | ✅ | ☐ |
  | `log` | `list` | ✅ | ☐ |
  | `initDB` | `init`、`stats`、`import`、`clear` | ✅（灌数据用） | ☐ |
  | `initDB` | **灌完数据后关闭或保留 ADMIN_KEY** | ⚠️ 演示/交付前 | ☐ |
  | `login` | C 端走小程序端 SDK 调用，Web 不用 | ❌ 可不选 | ☐ |

- [ ] **⚠️ 强烈建议：开完 `initDB` 的 URL 化后，立刻按 §6.1 给它配置环境变量 `ADMIN_KEY`**（已内置共享密钥校验），否则任何人可以 POST `{action:'import',clear:true}` 或 `{action:'clear',confirm:true}` **清空整个数据库**。这是本项目最重要的一个线上风险点。
- [ ] 连通性冒烟（命令行执行，Windows 可用 Git Bash）：
      ```bash
      BASE='https://<你的空间域名>/http'
      curl -s -X POST "$BASE/webLogin" \
        -H 'Content-Type: application/json' \
        -d '{"action":"login","username":"admin","password":"admin123"}'
      ```
      - 期望：返回 JSON 且 `code = 0`，`data` 内含 `token`。
      - 返回 404 / "function not found" → 该函数 URL 化没开。
      - 返回 HTML 而非 JSON → 地址不对（少了 `/http` 或域名复制错了）。

### 6.1 initDB 安全加固（建议部署前完成）

> **风险**：`initDB` 一旦开启 URL 化，写操作 `import` / `clear` 就是**无鉴权开放**的——任何人拿到地址即可 POST `{action:'import',clear:true}` 或 `{action:'clear',confirm:true}` 清空全部 8 个集合。
> **现状**：代码已内置共享密钥守卫 `checkAdminKey()`（见 `uniapp/uniCloud/cloudfunctions/initDB/index.js`），只需在云端配一个环境变量即可生效。

**规则（已实现）**

| 云端是否配置 `ADMIN_KEY` | 请求是否带 `adminKey` | 行为 |
|---|---|---|
| 已配置 | 未带 / 值不相等 | ❌ 拒绝，返回 `code=4004 缺少或错误的 adminKey`，**不执行任何写操作** |
| 已配置 | 严格相等 | ✅ 执行写操作 |
| 未配置 | 任意 | ⚠️ **放行**，但云端日志打印告警「未配置 ADMIN_KEY，写操作未受保护」（保证未配环境变量时课程演示仍能灌数据） |

> 只读的 `stats` 与幂等的 `init` **不校验**，方便随时排障；生产环境如需一并保护，可另行评估。

**操作步骤**

- [ ] uniCloud 控制台 → `云函数` → 进入 `initDB` → 找到「**环境变量 / 配置**」区域（不同版本可能叫「函数配置 → 环境变量」）。
- [ ] 新增环境变量：`ADMIN_KEY` = `<自定义强随机串>`（建议 16 位以上字母+数字，例如用密码管理器生成或执行 `openssl rand -hex 12`）。
- [ ] 保存后**必须重新部署/上传一次 `initDB`**（环境变量改动要随部署生效；不确定就右键 `initDB` → `上传部署` 重传一遍）。
- [ ] 把同一个密钥记到本机（**不要写进任何入库文件**），灌数据时用：
      ```bash
      # Linux / macOS / Git Bash
      export UNICLOUD_ADMIN_KEY='<与云端 ADMIN_KEY 完全一致>'

      # Windows CMD
      set UNICLOUD_ADMIN_KEY=<你的密钥>

      # Windows PowerShell
      $env:UNICLOUD_ADMIN_KEY='<你的密钥>'
      ```
- [ ] 本地 `mock-data/import_to_cloud.js` 会自动读取 `UNICLOUD_ADMIN_KEY`，并在写操作 body 里带上 `adminKey`；**未设置该变量时不带此字段**（向后兼容旧环境）。启动时脚本会打印「检测到本地 UNICLOUD_ADMIN_KEY，写操作将携带 adminKey」或对应的缺失提示。
- [ ] 自检成果（把 BASE 换成你的地址）：
      ```bash
      # 期望被拒绝：code=4004
      curl -s -X POST "$BASE/initDB" -H 'Content-Type: application/json' \
        -d '{"action":"clear","collection":"users","confirm":true}'

      # 期望成功：code=0
      curl -s -X POST "$BASE/initDB" -H 'Content-Type: application/json' \
        -d '{"action":"clear","collection":"users","confirm":true,"adminKey":"<你的密钥>"}'
      ```
- [ ] **演示/交付收尾：灌完数据后建议直接关闭 `initDB` 的 URL 化**（控制台 → `initDB` → URL 化 → 关闭）。若保留 URL 化，则**必须**保留 `ADMIN_KEY`，二者至少有一个生效。
- [ ] ⚠️ 密钥不要写进 README / 截图 / 录屏演示不要露出；`.env` 类文件已在 `web/.gitignore` 中忽略。

---

## 七、灌入 39 条模拟数据

> 数据文件已备好：`mock-data/cloud-import/*.json`（8 个集合共 **39 条**：users 4 / packages 3 / sites 3 / equipments 7 / orders 9 / deliveries 6 / reviews 2 / logs 5）。
> 脚本 `mock-data/import_to_cloud.js` 只做 HTTP 转发，实际写入由云端 `initDB` 完成。

> **接口返回约定（用于核对结果）**
> - `stats` 返回：`{ users, packages, sites, equipments, orders, deliveries, reviews, logs, stats:{ 同上 8 项 }, total:<8 项合计> }`；
>   **灌数据前后都可以用 `--stats` 核对**，一致即可确认写入成功。
> - `import` 会**先剔除每条数据的 `_id`** 再按 **每批 50 条**写入，所以 `cloud-import/*.json` 里即使带 `_id` 也不会与云端 ID 冲突（云端 ID 由数据库生成）；
>   带 `--clear` 时返回的 `cleared` 是**数字**（该集合实际被清空的条数），脚本会打印「清空 N 条」。

- [ ] 确认 Node ≥ 18（脚本使用内置 `fetch`）。本机可直接用托管版：
      `C:\Users\Lenovo\.workbuddy\binaries\node\versions\24.14.0\node.exe -v` → 应输出 `v24.x`。
- [ ] **前置**：若已按 §6.1 给 `initDB` 配置了 `ADMIN_KEY`，先在本机导出同一密钥，否则下面的写操作会返回 `4004 缺少或错误的 adminKey`：
      ```bash
      export UNICLOUD_ADMIN_KEY='<与云端 ADMIN_KEY 一致>'
      ```
      （脚本检测到该变量时会打印「写操作将携带 adminKey」；未配置云端密钥则可跳过本步）
- [ ] （可选）设置环境变量省得每次敲地址：
      ```bash
      export UNICLOUD_HTTP_BASE='https://<你的空间域名>/http'
      ```
- [ ] **第 1 步：先看统计，验证连通**（`stats` 是只读动作，不受 ADMIN_KEY 影响）：
      ```bash
      cd D:/path/to/chengye-suirong
      node mock-data/import_to_cloud.js --url https://<你的空间域名>/http/initDB --stats
      ```
      （等价写法：`--url https://<你的空间域名>/http`，脚本会自动补 `/initDB`）
      期望输出 8 个集合的条数表格。若报错：回到 §6 检查 `initDB` 的 URL 化与 §4 的集合是否建全。
- [ ] **第 2 步：灌入全部数据（清空后重灌）**：
      ```bash
      node mock-data/import_to_cloud.js --url https://<你的空间域名>/http/initDB --all --clear
      ```
      期望：每个集合打印 `OK（现存 N 条，清空 M 条）`（`M` 即 `cleared`，为空集合时是 0），最后输出「最终条数」合计 **39**。
      写完后脚本会自动再跑一次 `--stats`，可直接与上一步的条数对比确认。
      若某集合报 `失败：缺少或错误的 adminKey` → 按上面「前置」步骤 `export UNICLOUD_ADMIN_KEY` 后重试（脚本也会打印对应提示）。
- [ ] （备选）只要补某个集合：`node mock-data/import_to_cloud.js --url <地址> --only orders --clear`
- [ ] （备选）只要追加不清空：去掉 `--clear`（注意可能造成重复数据）。
- [ ] 控制台复查：`users 4 / packages 3 / sites 3 / equipments 7 / orders 9 / deliveries 6 / reviews 2 / logs 5`。
- [ ] 数据灌完后 **回到 §6.1 收尾**：关闭 `initDB` 的 URL 化（或确保 `ADMIN_KEY` 已生效）。

---

## 八、切换到真实数据（两处开关）

### 8.1 Web 管理后台（本次改动点）

配置文件：`web/src/config/backend.js`（**唯一数据源**，读 Vite 环境变量，读不到用默认值）。

- [ ] **方式 A（推荐，不入库）**：在 `web/` 目录新建 `.env.local`（模板见 `web/.env.example`）：
      ```env
      VITE_FORCE_MOCK=false
      VITE_UNICLOUD_HTTP_BASE=https://<你的空间域名>/http/
      ```
- [ ] **方式 B（改默认值）**：编辑 `web/src/config/backend.js`，把 `FALLBACK_FORCE_MOCK` 改为 `false`、`DEFAULT_HTTP_BASE` 改为真实地址。适合交付演示环境，注意会进版本库。
- [ ] ⚠️ Vite 环境变量改动**必须重启** `npm run dev` 才生效。
- [ ] 启动后开浏览器控制台，确认**没有** `[request] 已关闭 Mock，但 UNICLOUD_HTTP_BASE 仍是占位地址` 这条 warn —— 有则说明地址没配上。
- [ ] 确认 `web/.env.local` 不会被提交（`web/.gitignore` 已忽略 `.env*`；`.env.example` 是模板，保留入库）。

### 8.2 小程序端（由另一位同事改造，此处说明位置与含义）

配置文件：`uniapp/config/unicloud.js`。

- [ ] 该文件把 `FORCE_MOCK` 置为 `false`，表示小程序走真实 uniCloud 调用（不再用本地假数据）。
- [ ] 填写 `CLIENT_SECRET.appKey` 与 `CLIENT_SECRET.appSecret`（uniCloud 控制台 `服务空间 → 密钥` 获取）。
      > 客户端直连数据库/云函数时需要这两个值；**请勿上传代码仓库**，本地开发用即可。
- [ ] 与 Web 端共用同一个服务空间 `your-uni-cloud-space-id`。
- [ ] C 端（`login` 云函数）走 uniCloud 客户端 SDK，**不需要**开 URL 化；URL 化只给 Web 后台用。
- [ ] 改完需在 HBuilderX 重新运行到微信开发者工具（增量热更新有时不生效配置层文件）。

---

## 九、运行验证

### 9.1 Web 管理后台

- [ ] `cd 城野随行/web && npm install`（已装过可跳过）→ `npm run dev`。
- [ ] 浏览器打开 `http://localhost:5173`。
- [ ] 用 `admin / admin123` 登录 → 应能进入，左侧菜单完整（含套餐管理、订单管理、配送调度、装备管理、财务统计、操作日志、用户管理）。
- [ ] 用 `ent / ent123` 登录 → 应只能看到 B 端菜单（批量下单、订单管理等），看不到管理员专属菜单。
- [ ] 逐个页面走查并确认「列表有数据、不是空表」：套餐列表（3 条）、场地（3 条）、订单列表（9 条）、配送单（6 条）、装备（7 条）、财务统计（有图表数据）、操作日志（5 条）、用户（4 条含 admin/ent）。
- [ ] 做一次写操作：新增/上下架一个套餐或取消一笔订单，然后回控制台确认数据库该文档字段确实变了（验证走的是真实后端而非 Mock）。
- [ ] 退出登录后重新登录，确认路由权限与 token 刷新正常。

### 9.2 微信小程序

- [ ] 打开微信开发者工具：`C:/Program Files (x86)/Tencent/微信web开发者工具`。
- [ ] **先开启服务端口**：工具右上 `设置 → 安全 → 安全设置/服务端口` → 打开（否则 HBuilderX 无法唤起该工具）。
- [ ] 导入 / 打开目录：HBuilderX 编译产物 `城野随行/uniapp/dist/build/mp-weixin`。
- [ ] 若该目录不存在：先在 HBuilderX 里 `运行 → 运行到小程序模拟器 → 微信开发者工具`（会自动编译并生成 `dist/build/mp-weixin`）。
- [ ] AppID 使用测试号（`touristappid`）即可跑通本地演示。
- [ ] 真机/模拟器上走一遍主链路：首页套餐浏览 → 选场地 → 下单 → 模拟支付 → 订单列表/详情 → 评价。
- [ ] 回到 Web 后台，**确认刚才小程序下的订单能在「订单管理」里看到**（这是两端打通的判定标准）。

---

## 十、常见问题速查

| 现象 | 原因 | 处理 |
|---|---|---|
| `集合不存在` / `collection not exists` | §4 的 8 个集合没建全或名字拼错 | 控制台逐个核对 `users/packages/sites/equipments/orders/deliveries/reviews/logs`，注意大小写与前后空格 |
| `Cannot find module 'common'`（所有接口全挂） | `common` 没作为「公共模块」上传 | 回 §2 重建/重新上传公共模块，然后**重新上传**依赖它的所有云函数 |
| Web 页面报 `网络错误`/404，`{"code":...}` 都拿不到 | 目标云函数**没开 URL 化**，或地址少了 `/http` | §6 逐个开启；复核 `UNICLOUD_HTTP_BASE` 末尾斜杠 |
| 返回 HTML 而不是 JSON | 基地址填成了云函数详情页或控制台地址 | 用 URL 化给出的 **域名** + `/http/`，不是控制台 URL |
| 列表查询返回空但无报错 | 集合为空（没灌数据）或集合名不一致 | §7 灌数据；用 `--stats` 复核条数 |
| C 端数据在控制台看不到 / 只看到 `dev_user` | 使用 `touristappid` 测试号时，uniCloud 把所有本地用户归到同一 `dev_user` 标识下 | **单人演示属正常现象**；要区分真实用户需填真实小程序 AppID 并走正式 `wx.login` |
| 登录成功 2 小时后操作全部跳登录 / 401 | JWT（HS256）有效期 2 小时，已过期 | 重新登录即可；演示前可提前登录或延后过期时间（改动 `webLogin` 云函数后需重新上传） |
| `admin` 账号登录失败：账号或密码错误 | `admin` 不存在/密码不对 | §5 重跑 `initDB` 的 `init`；再到 `users` 集合确认文档存在（幂等，可重复执行） |
| 灌数据脚本报 `fetch is not defined` | Node 版本 < 18 | 用本机托管版 Node：`C:\Users\Lenovo\.workbuddy\binaries\node\versions\24.14.0\node.exe` |
| 灌数据返回「数据库写入失败 / code 非 0」 | 集合没建、`initDB` 未上传、或 URL 化没开 | 依次复核 §3 / §4 / §6 |
| 改了 `.env.local` 但页面还走 Mock | Vite 环境变量需重启生效；或变量名缺 `VITE_` 前缀 | 重启 `npm run dev`；确认变量名为 `VITE_FORCE_MOCK`、`VITE_UNICLOUD_HTTP_BASE` |
| 灌数据返回 `缺少或错误的 adminKey`（`code=4004`） | 云端 `initDB` 已配 `ADMIN_KEY`，但请求没带/带错了密钥 | 本地 `export UNICLOUD_ADMIN_KEY=<与云端一致>` 后重跑；确认两个值完全相同（注意前后空格会被 trim） |
| 配了 `ADMIN_KEY` 但仍然放行了任意请求 | 环境变量改动**没有重新部署** `initDB` | 右键 `initDB` → `上传部署` 重传一遍再验证 |
| `--stats` 正常但导入被拒 | 正常：`stats` 是只读不校验，`import`/`clear` 才校验 ADMIN_KEY | 导出密钥后重跑 `--all --clear` |
| 云端日志出现「未配置 ADMIN_KEY，写操作未受保护」 | 环境变量没配或为空 | 按 §6.1 配置并重新部署；在 demo 可接受期间务必在灌完数据后关闭 URL 化 |
| HBuilderX 右键没有「上传云函数」 | 当前打开的不是含 `uniCloud` 的工程树 | 回 §1.1/§1.2：导入 `城野随行/uniapp`，并在项目树里确认 `uniapp/uniCloud` 存在 |
| 仓库根还留着一份 `uniCloud/` | 迁移未完成，两份可能不同步 | 确认 `uniapp/uniCloud` 为唯一有效副本后清理残留，勿同时在两处改代码 |
| 数据被人清空了 | `initDB` URL 化长期对外开放且未配 ADMIN_KEY | §6.1 收尾：**灌完即关** URL 化，或保留 `ADMIN_KEY` |
| 每个人都看不到各自的数据（多人演示） | 测试号下统一落 `dev_user` | 换真实 AppID；或接受单人演示，文档里说明这一课程设计阶段的限制 |

---

## 附：一句话回滚

若真机演示前发现后端不可用，需要退回离线演示状态：

```bash
# 方式 A：编辑 web/.env.local，改回 VITE_FORCE_MOCK=true，重启 npm run dev
# 方式 B：编辑 web/src/config/backend.js，FALLBACK_FORCE_MOCK 改回 true，重启 npm run dev
```

改回 `true` 后 Web 后台立刻回到 Mock 数据（离线可跑），小程序端同理把 `uniapp/config/unicloud.js` 的 `FORCE_MOCK` 改回 `true`。
