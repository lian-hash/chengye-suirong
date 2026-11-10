# -*- coding: utf-8 -*-
"""
生成城野随行「模拟运行数据」CSV 文件（对齐 SRS 数据字典 D1-D8）。
用途：
  1) 作为课程设计/答辩的演示数据集；
  2) 可导入 DCloud uniCloud 云数据库（CSV 导入，每个集合一个文件）。
字段与 uniapp/mock/seed.js、uniapp/uniCloud/cloudfunctions/initDB/seed.js 保持一致。
注意：含逗号/JSON 的字段由 csv 模块自动加引号转义。
"""
import csv
import os

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------- 数据 ----------
packages = [
    ["PKG001", "春日露营基础套餐", 199, "帐篷x1, 防潮垫x2, 营地灯x1, 折叠椅x2", "春季", True, "",
     "2026-03-01", "2026-05-31", '[{"equipmentId":"EQ001","qty":1},{"equipmentId":"EQ002","qty":2},{"equipmentId":"EQ003","qty":1}]'],
    ["PKG002", "夏日星空进阶套餐", 399, "天幕x1, 帐篷x1, 充气床垫x2, 氛围灯串x1, 烧烤架x1", "夏季", True, "",
     "2026-06-01", "2026-08-31", '[{"equipmentId":"EQ001","qty":1},{"equipmentId":"EQ004","qty":1},{"equipmentId":"EQ005","qty":2}]'],
    ["PKG003", "秋日团建尊享套餐", 899, "大型帐篷x2, 长桌x3, 音响x1, 投影仪x1, 烤炉x2", "秋季", False, "",
     "2026-09-01", "2026-11-30", '[{"equipmentId":"EQ006","qty":2},{"equipmentId":"EQ007","qty":1},{"equipmentId":"EQ004","qty":1}]'],
]

sites = [
    ["SITE001", "东湖绿道营地A区", "武汉市东湖生态旅游风景区绿道1号", 50, "可用", "东湖文旅"],
    ["SITE002", "梁子湖畔露营基地", "武汉市江夏区梁子湖风景区", 80, "可用", "梁子湖度假区"],
    ["SITE003", "马鞍山森林营地", "武汉市洪山区马鞍山森林公园", 30, "停用", "森林公园管理处"],
]

equipments = [
    ["EQ001", "双人帐篷", 100, 100, 20, "可用", "已消杀", "2026-03-01T08:00:00", 0],
    ["EQ002", "防潮垫", 200, 200, 40, "可用", "已消杀", "2026-03-01T08:00:00", 0],
    ["EQ003", "营地灯", 150, 150, 30, "可用", "已消杀", "2026-03-01T08:00:00", 0],
    ["EQ004", "天幕", 60, 60, 15, "可用", "已消杀", "2026-03-01T08:00:00", 0],
    ["EQ005", "充气床垫", 120, 120, 25, "可用", "已消杀", "2026-03-01T08:00:00", 0],
    ["EQ006", "大型帐篷", 30, 30, 8, "可用", "已消杀", "2026-03-01T08:00:00", 0],
    ["EQ007", "投影仪", 20, 20, 5, "可用", "已消杀", "2026-03-01T08:00:00", 0],
]

users = [
    ["mock_openid_001", "微信用户A", "C端", "13800000001", "2026-03-01T08:00:00"],
    ["mock_openid_002", "微信用户B", "C端", "13800000002", "2026-03-05T08:00:00"],
    ["admin001", "系统管理员", "管理员", "13800000099", "2026-01-01T08:00:00"],
    ["ent001", "某科技公司", "B端", "13800000003", "2026-02-01T08:00:00"],
]

orders = [
    ["ORD_SEED_001", "mock_openid_001", "PKG001", "SITE001", "2026-04-05", 1, "已完成", "已支付", 199, "示例用户", "13800000001", False, "2026-04-01T10:00:00", "2026-04-01T10:05:00"],
    ["ORD202601", "mock_openid_001", "PKG001", "SITE001", "2026-04-10", 2, "待支付", "未支付", 398, "张三", "13800000011", False, "2026-03-20T09:00:00", ""],
    ["ORD202602", "mock_openid_002", "PKG002", "SITE002", "2026-07-15", 1, "已支付", "已支付", 399, "李四", "13800000012", False, "2026-07-01T09:00:00", "2026-07-01T09:05:00"],
    ["ORD202603", "mock_openid_001", "PKG002", "SITE002", "2026-07-16", 1, "配送中", "已支付", 399, "王五", "13800000013", False, "2026-07-02T09:00:00", "2026-07-02T09:05:00"],
    ["ORD202604", "mock_openid_002", "PKG001", "SITE001", "2026-04-12", 3, "布置中", "已支付", 597, "赵六", "13800000014", False, "2026-04-02T09:00:00", "2026-04-02T09:05:00"],
    ["ORD202605", "ent001", "PKG003", "SITE002", "2026-09-10", 2, "使用中", "已支付", 1798, "某科技公司", "13800000003", True, "2026-09-01T09:00:00", "2026-09-01T09:10:00"],
    ["ORD202606", "mock_openid_001", "PKG001", "SITE001", "2026-04-15", 1, "已回收", "已支付", 199, "孙七", "13800000015", False, "2026-04-03T09:00:00", "2026-04-03T09:05:00"],
    ["ORD202607", "mock_openid_002", "PKG002", "SITE002", "2026-07-20", 1, "已完成", "已支付", 399, "周八", "13800000016", False, "2026-07-05T09:00:00", "2026-07-05T09:05:00"],
    ["ORD202608", "mock_openid_001", "PKG003", "SITE003", "2026-09-12", 1, "已取消", "未支付", 899, "吴九", "13800000017", False, "2026-09-02T09:00:00", ""],
]

deliveries = [
    ["DLV001", "ORD202603", "配送", "2026-07-02T10:00:00", "admin001"],
    ["DLV002", "ORD202604", "配送", "2026-04-02T10:00:00", "admin001"],
    ["DLV003", "ORD202604", "布置", "2026-04-02T12:00:00", "admin001"],
    ["DLV004", "ORD202605", "配送", "2026-09-01T10:00:00", "admin001"],
    ["DLV005", "ORD202605", "布置", "2026-09-01T12:00:00", "admin001"],
    ["DLV006", "ORD202606", "回收", "2026-04-03T18:00:00", "admin001"],
]

reviews = [
    ["REV001", "ORD_SEED_001", "mock_openid_001", 5, "装备齐全，营地环境很好，下次还来！", "2026-04-06T20:00:00"],
    ["REV002", "ORD202607", "mock_openid_002", 4, "夏日星空很美，就是天幕有点小。", "2026-07-21T20:00:00"],
]

logs = [
    ["LOG001", "mock_openid_001", "CREATE_ORDER", "orders", "创建订单 ORD_SEED_001", "SUCCESS", "2026-04-01T10:00:00"],
    ["LOG002", "mock_openid_001", "PAY", "orders", "订单 ORD_SEED_001 模拟支付(MOCK)", "SUCCESS", "2026-04-01T10:05:00"],
    ["LOG003", "admin001", "DISPATCH", "orders", "订单 ORD202603 配送推进", "SUCCESS", "2026-07-02T10:00:00"],
    ["LOG004", "admin001", "RECOVER", "orders", "订单 ORD202606 回收完成", "SUCCESS", "2026-04-03T18:00:00"],
    ["LOG005", "mock_openid_002", "REVIEW", "reviews", "评价订单 ORD202607", "SUCCESS", "2026-07-21T20:00:00"],
]

files = {
    "users.csv": (["userId", "nickname", "role", "phone", "registerTime"], users),
    "packages.csv": (["packageId", "name", "price", "items", "seasonTheme", "onShelf", "bannerUrl", "reservableStart", "reservableEnd", "equipRefs"], packages),
    "sites.csv": (["siteId", "name", "address", "capacity", "availableStatus", "partner"], sites),
    "orders.csv": (["orderId", "userId", "packageId", "siteId", "useDate", "quantity", "orderStatus", "payStatus", "amount", "contactName", "contactPhone", "isBatch", "createTime", "payTime"], orders),
    "equipments.csv": (["equipmentId", "name", "totalQty", "availableQty", "warnThreshold", "status", "disinfectStatus", "lastDisinfectTime", "usedCount"], equipments),
    "deliveries.csv": (["deliveryId", "orderId", "opType", "opTime", "operator"], deliveries),
    "reviews.csv": (["reviewId", "orderId", "userId", "score", "content", "reviewTime"], reviews),
    "logs.csv": (["logId", "operator", "opType", "opTarget", "opContent", "opResult", "opTime"], logs),
}

for fname, (header, rows) in files.items():
    path = os.path.join(OUT_DIR, fname)
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(header)
        for r in rows:
            w.writerow(r)
    print("written:", fname, "rows=", len(rows))

print("ALL DONE ->", OUT_DIR)
