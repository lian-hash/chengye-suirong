# -*- coding: utf-8 -*-
"""按《城野随行_设计图drawio绘制说明_V1.1》生成 4 个 .drawio 文件。
规范：白底 #ffffff、描边 #333333、正交折线、全中文、零交叉。"""
import html, os

OUT = "D:/path/to/chengye-suirong/drawio"
os.makedirs(OUT, exist_ok=True)

N = "rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;strokeWidth=1;fontColor=#333333;fontSize=12;align=center;verticalAlign=middle;"
NR = "rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;strokeWidth=1;fontColor=#333333;fontSize=12;align=center;verticalAlign=middle;"
NP = "shape=parallelogram;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;strokeWidth=1;fontColor=#333333;fontSize=12;align=center;verticalAlign=middle;"
ND = "rhombus;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;strokeWidth=1;fontColor=#333333;fontSize=12;align=center;verticalAlign=middle;"
E = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#333333;strokeWidth=1;fontColor=#333333;"
EOPEN = E + "endArrow=open;endFill=0;"
ESTRAIGHT = "html=1;strokeColor=#333333;strokeWidth=1;fontColor=#333333;endArrow=none;"
EFLOW = E + "endArrow=block;"
EER = "edgeStyle=entityRelationEdgeStyle;rounded=0;html=1;strokeColor=#333333;strokeWidth=1;fontColor=#333333;"
LBL = "edgeLabel;html=1;fillColor=#ffffff;strokeColor=#666666;fontColor=#666666;fontSize=10;"

def esc(s):
    return html.escape(s, quote=True)

class Doc:
    def __init__(self, name, pw, ph):
        self.name = name
        self.pw, self.ph = pw, ph
        self.cells = []
        self.n = 1  # 系统层已占 id=0/1，自定义 id 从 2 起
    def nid(self):
        self.n += 1
        return str(self.n)
    def node(self, value, style, x, y, w, h, parent="1", gid=None, extra=""):
        i = gid or self.nid()
        self.cells.append(
            f'        <mxCell id="{i}" value="{esc(value)}" style="{style}{extra}" vertex="1" parent="{parent}">\n'
            f'          <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>\n'
            f'        </mxCell>')
        return i
    def edge(self, src, dst, style, gid=None, value="", ex=None, ey=None, nx=None, ny=None,
             waypoints=None):
        i = gid or self.nid()
        st = style
        if ex is not None: st += f"exitX={ex};exitY={ey};"
        if nx is not None: st += f"entryX={nx};entryY={ny};"
        body = ""
        if waypoints:
            pts = "".join(f'<mxPoint x="{px}" y="{py}"/>' for px, py in waypoints)
            body = (f'          <mxGeometry relative="1" as="geometry">\n'
                    f'            <Array as="points">\n              {pts}\n            </Array>\n'
                    f'          </mxGeometry>\n')
        else:
            body = '          <mxGeometry relative="1" as="geometry"/>\n'
        self.cells.append(
            f'        <mxCell id="{i}" value="{esc(value)}" style="{st}" edge="1" parent="1" '
            f'source="{src}" target="{dst}">\n{body}        </mxCell>')
        return i
    def label(self, value, src, style=LBL, pos="-0.75"):
        i = self.nid()
        self.cells.append(
            f'        <mxCell id="{i}" value="{esc(value)}" style="{style}" connectable="0" '
            f'vertex="1" parent="{src}">\n'
            f'          <mxGeometry x="{pos}" relative="1" as="geometry">\n'
            f'            <mxPoint as="offset"/>\n'
            f'          </mxGeometry>\n'
            f'        </mxCell>')
        return i
    def dump(self, path, diagram_id):
        cells = "\n".join(self.cells)
        xml = (f'<mxfile host="drawio" type="device">\n'
               f'  <diagram name="{esc(self.name)}" id="{diagram_id}">\n'
               f'    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" '
               f'tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" '
               f'pageWidth="{self.pw}" pageHeight="{self.ph}" background="#ffffff">\n'
               f'      <root>\n'
               f'        <mxCell id="0"/>\n'
               f'        <mxCell id="1" parent="0"/>\n'
               f'{cells}\n'
               f'      </root>\n'
               f'    </mxGraphModel>\n'
               f'  </diagram>\n'
               f'</mxfile>\n')
        with open(path, "w", encoding="utf-8") as f:
            f.write(xml)
        print("write:", path, "| nodes+edges:", len(self.cells))

# ============================================================
# 文件 1：图 2-1 系统软件结构图（SA 版：区分变换流 / 事务流）
#   全局 = 事务流：主模块 → 取得事务〔入〕→ 事务调度中心〔事〕→ P1~P6 并列动作分支〔动〕
#   局部 = 变换流：P3 订单创建内含 输入→变换中心→输出
# ============================================================
d = Doc("图2-1 系统软件结构图（SA：变换流·事务流）", 2900, 820)
# —— 顶部控制层（事务流骨架）——
l0  = d.node("城野随行平台系统（主模块）", N + "fontSize=13;fontStyle=1;", 840, 30, 320, 60)
cin = d.node("取得事务·鉴别类型〔入〕", N + "fontSize=11;fontStyle=1;", 560, 150, 280, 60)
# 事务中心 = 菱形（教材惯例：菱形表"判别·分派"，是事务流的标志图元）
ctx = d.node("事务调度中心〔事〕", ND + "fontSize=11;fontStyle=1;", 1040, 125, 400, 110)
# —— 第二层：六大动作分支（事务流的并列动作分支）——
mods = [("用户服务模块〔动〕", "（P1）"), ("套餐与场地模块〔动〕", "（P2）"),
        ("订单服务模块〔动〕★", "（P3）"), ("配送调度模块〔动〕", "（P4）"),
        ("装备管理模块〔动〕", "（P5）"), ("财务与日志模块〔动〕", "（P6）")]
centers = [410, 830, 1250, 1670, 2090, 2510]
l2 = [
    ["微信授权登录", "角色识别与<br>权限加载<br>〔变·判别〕", "个人中心与<br>信息维护"],
    ["套餐浏览<br>与查询", "套餐详情与<br>场地选择", "套餐信息<br>维护", "场地信息<br>维护"],
    ["订单创建", "模拟支付", "订单查询与<br>状态跟踪", "订单评价", "订单取消<br>与退款", "批量下单"],
    ["配送执行", "现场布置", "回收处理", "配送记录管理"],
    ["装备信息<br>维护", "装备出入库", "消杀登记", "低库存预警"],
    ["营收统计", "退款统计", "热门套餐<br>排行", "对账单导出", "操作日志<br>检索"],
]
sw = {3: (112, 8), 4: (80, 8), 5: (66, 6), 6: (60, 6)}
l1_ids, l2_ids = [], []
for i, (m, p) in enumerate(mods):
    cx = centers[i]
    l1_ids.append(d.node(m + "<br>" + p, N + "fontStyle=1;", cx - 125, 300, 250, 60))
    n = len(l2[i]); w, g = sw[n]
    total = n * w + (n - 1) * g
    start = cx - total // 2
    row = []
    for j, lab in enumerate(l2[i]):
        row.append(d.node(lab, N + "fontSize=9;", start + j * (w + g), 480, w, 60))
    l2_ids.append(row)
# —— 控制层连线 ——
# 两条控制线从主模块底部不同 x 引出，避免竖线段重叠
d.edge(l0, cin, EOPEN, ex=0.35, ey=1, nx=0.5, ny=0, waypoints=[(952, 110), (700, 110), (700, 150)])
d.edge(l0, ctx, EOPEN, ex=0.65, ey=1, nx=0.5, ny=0, waypoints=[(1048, 110), (1240, 110), (1240, 125)])
d.edge(cin, ctx, EOPEN, ex=1, ey=0.5, nx=0, ny=0.5)
# —— 事务调度中心（菱形底顶点）→ 六个动作分支（事务分派总线，y=255 水平汇集后下落）——
for i, cx in enumerate(centers):
    d.edge(ctx, l1_ids[i], EOPEN, ex=0.5, ey=1, nx=0.5, ny=0,
           waypoints=[(1240, 255), (cx, 255), (cx, 300)])
# —— 动作分支 → 子功能 ——
for i, lid in enumerate(l1_ids):
    for ch in l2_ids[i]:
        d.edge(lid, ch, EOPEN, ex=0.5, ey=1, nx=0.5, ny=0)
# —— 流型注解（仅标注，不连线）——
d.node("全局为【事务流】：事务调度中心〔事〕按事务类型，将请求分派至 P1~P6 六个并列动作分支〔动〕；各动作分支相互独立。",
       N + "dashed=1;strokeColor=#666666;fontSize=10;align=left;verticalAlign=middle;", 1480, 130, 520, 80)
d.node("P3 订单服务内部含【局部变换流】：输入（接收下单+四重校验）→ 变换中心（生成订单·防超卖写库）→ 输出（返回订单·触发支付/配送）。",
       N + "dashed=1;strokeColor=#666666;fontSize=10;align=left;verticalAlign=middle;", 880, 560, 740, 80)
# —— 图例 ——
legend = ("图例（SA 模块角色标记）：<br>"
          "◆ 菱形格 = 事务中心〔事〕：判别事务类型并分派，是事务流的标志图元<br>"
          "〔入〕传入模块：接收外部请求/数据，向上传递<br>"
          "〔出〕传出模块：向外部输出结果或写库<br>"
          "〔变〕变换模块 / 变换中心：加工处理（如 P3 订单创建）<br>"
          "〔动〕动作分支：独立业务域，彼此并列<br>"
          "矩形 = 普通模块；★ = 含局部变换流的动作分支；〔变·判别〕＝模块内含判别逻辑（仍画矩形）")
d.node(legend, N + "dashed=1;strokeColor=#666666;fontSize=10;align=left;verticalAlign=middle;", 120, 590, 760, 175)
d.dump(f"{OUT}/城野随行_图2-1_系统软件结构图.drawio", "cysx-fig21")

# ============================================================
# 文件 2：图 3-1 E-R 图（13 节点 / 12 连线 / 12 基数标注）
# ============================================================
d = Doc("图3-1 E-R图", 1400, 900)
ents = {
    "订单":   (620, 470, 140, 55),
    "用户":   (120, 170, 140, 55),
    "套餐":   (600, 170, 140, 55),
    "场地":   (1060, 170, 140, 55),
    "配送记录": (1060, 470, 140, 55),
    "评价":   (1060, 760, 140, 55),
    "装备":   (1200, 300, 140, 55),
}
eid = {}
for k, (x, y, w, h) in ents.items():
    eid[k] = d.node(k, N + "fontSize=12;", x, y, w, h)
dias = {
    "提交":     (340, 360, 120, 80),
    "包含":     (610, 310, 120, 80),
    "位于":     (880, 340, 120, 80),
    "产生":     (850, 457, 120, 80),
    "获得":     (840, 660, 120, 80),
    "领用归还": (1165, 365, 150, 90),
}
did = {}
for k, (x, y, w, h) in dias.items():
    did[k] = d.node(k, ND + "fontSize=11;", x, y, w, h)

# (实体A, 菱形, 实体B, A端出, A端入菱形, 菱形出, B端入, A基数, B基数)
rels = [
    ("用户", "提交", "订单",     1, 0.5, 0, 0.5, 1, 0.5, 0.25, 0, "1", "n"),
    ("套餐", "包含", "订单",     0.5, 1, 0.5, 0, 0.5, 1, 0.5, 0, "1", "n"),
    ("场地", "位于", "订单",     0, 0.5, 1, 0.5, 0, 0.5, 1, 0.25, "1", "n"),
    ("订单", "产生", "配送记录", 1, 0.5, 0, 0.5, 1, 0.5, 0, 0.5, "1", "n"),
    ("订单", "获得", "评价",     0.75, 1, 0.25, 0, 0.5, 1, 0, 0.5, "1", "1"),
    ("装备", "领用归还", "配送记录", 0.5, 1, 0.5, 0, 0, 0.5, 0.75, 0, "m", "n"),
]
for a, r, b, aex, aey, rnx, rny, rex, rey, bnx, bny, ca, cb in rels:
    e1 = d.edge(eid[a], did[r], ESTRAIGHT, ex=aex, ey=aey, nx=rnx, ny=rny)
    d.label(ca, e1, pos="-0.8")
    e2 = d.edge(did[r], eid[b], ESTRAIGHT, ex=rex, ey=rey, nx=bnx, ny=bny)
    d.label(cb, e2, pos="0.8")
d.dump(f"{OUT}/城野随行_图3-1_E-R图.drawio", "cysx-fig31")

# ============================================================
# 文件 3：图 3-2 逻辑结构设计图（8 张中文表 / 7 连线）
# ============================================================
d = Doc("图3-2 逻辑结构设计图", 1600, 1200)
TBL = ("shape=table;startSize=30;container=0;collapsible=0;childLayout=tableLayout;"
       "fixedRows=1;rowLines=1;html=1;fillColor=#ffffff;strokeColor=#333333;strokeWidth=1;"
       "fontSize=11;align=center;verticalAlign=middle;fontColor=#333333;")
ROW = ("shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;html=1;"
       "fillColor=#ffffff;strokeColor=#333333;strokeWidth=1;fontSize=10;align=left;"
       "verticalAlign=middle;fontColor=#333333;spacingLeft=8;")
ROWH = ROW.replace("fontSize=10", "fontSize=11").replace("align=left", "align=center") + "fontStyle=1;"

tables = [
    ("t_users", "用户表（users）", 40, 40, 250,
     [("用户ID（主键）", 1), ("昵称", 0), ("角色（顾客/商家/管理员）", 0), ("手机号", 0), ("注册时间", 0)]),
    ("t_pkg", "套餐表（packages）", 340, 40, 280,
     [("套餐ID（主键）", 1), ("套餐名称", 0), ("单价", 0), ("包含项目", 0), ("季节主题", 0),
      ("是否上架", 0), ("宣传图URL", 0), ("可预约起始日期", 0), ("可预约截止日期", 0), ("关联装备", 0)]),
    ("t_site", "场地表（sites）", 670, 40, 260,
     [("场地ID（主键）", 1), ("场地名称", 0), ("地址", 0), ("容量", 0), ("可用状态", 0), ("合作方", 0)]),
    ("t_log", "操作日志表（logs）", 960, 40, 250,
     [("日志ID（主键）", 1), ("操作员", 0), ("操作类型", 0), ("操作对象", 0), ("操作内容", 0),
      ("操作结果", 0), ("操作时间", 0)]),
    ("t_eq", "装备表（equipments）", 1260, 40, 270,
     [("装备ID（主键）", 1), ("名称", 0), ("总量", 0), ("可用量", 0), ("预警阈值", 0), ("状态", 0),
      ("消杀状态", 0), ("最近消杀时间", 0), ("累计使用次数", 0)]),
    ("t_order", "订单表（orders）", 600, 560, 300,
     [("订单ID（主键）", 1), ("用户ID（外键）", 0), ("套餐ID（外键）", 0), ("场地ID（外键）", 0),
      ("使用日期", 0), ("份数", 0), ("订单状态", 0), ("支付状态", 0), ("金额", 0), ("联系人姓名", 0),
      ("联系电话", 0), ("是否批量", 0), ("创建时间", 0), ("支付时间", 0)]),
    ("t_dlv", "配送记录表（deliveries）", 1020, 760, 300,
     [("配送ID（主键）", 1), ("订单ID（外键）", 0), ("操作类型（配送/布置/回收）", 0),
      ("操作时间", 0), ("操作员", 0)]),
    ("t_rev", "评价表（reviews）", 1340, 740, 250,
     [("评价ID（主键）", 1), ("订单ID（外键）", 0), ("用户ID（外键）", 0), ("评分", 0),
      ("评价内容", 0), ("评价时间", 0)]),
]
tid = {}
for key, title, x, y, w, fields in tables:
    h = 30 + len(fields)*24
    tid[key] = d.node("", TBL, x, y, w, h, gid=key)
    d.node(title, ROWH, 0, 0, w, 30, parent=key, gid=key+"_h")
    for i, (fname, ispk) in enumerate(fields):
        val = f"<u>{esc(fname)}</u>" if ispk else esc(fname)
        st = ROW + ("fontStyle=1;" if ispk else "")
        d.node(val, st, 0, 30 + i*24, w, 24, parent=key, gid=f"{key}_r{i}")

# 连线（ER 鸡爪线）
d.edge("t_users", "t_order", EER + "startArrow=ERone;startFill=0;endArrow=ERmany;endFill=0;",
       ex=0.5, ey=1, nx=0.167, ny=0, waypoints=[(165, 500), (650, 500)])
d.edge("t_pkg", "t_order", EER + "startArrow=ERone;startFill=0;endArrow=ERmany;endFill=0;",
       ex=0.5, ey=1, nx=0.4, ny=0, waypoints=[(480, 520), (720, 520)])
d.edge("t_site", "t_order", EER + "startArrow=ERone;startFill=0;endArrow=ERmany;endFill=0;",
       ex=0.5, ey=1, nx=0.6, ny=0, waypoints=[(800, 540), (780, 540)])
d.edge("t_order", "t_dlv", EER + "startArrow=ERone;startFill=0;endArrow=ERmany;endFill=0;"
       "exitX=1;exitY=0.38;entryX=0;entryY=0.5;", waypoints=[(960, 699), (960, 835)])
d.edge("t_order", "t_rev", EER + "startArrow=ERone;startFill=0;endArrow=ERone;endFill=0;"
       "exitX=1;exitY=0.25;entryX=0.5;entryY=0;", waypoints=[(1465, 651)])
d.edge("t_eq", "t_pkg", EER + "dashed=1;startArrow=ERmany;startFill=0;endArrow=ERmany;endFill=0;"
       "exitX=0.5;exitY=0;entryX=0.5;entryY=0;", value="关联装备（多对多）",
       waypoints=[(1395, 15), (480, 15)])
d.edge("t_log", "t_order", EER + "dashed=1;startArrow=none;endArrow=none;",
       ex=0.5, ey=1, nx=0.5, ny=0, value="记录全部敏感操作",
       waypoints=[(1085, 440), (750, 440)])
d.dump(f"{OUT}/城野随行_图3-2_逻辑结构设计图.drawio", "cysx-fig32")

# ============================================================
# 文件 4：图 3-3 订单创建算法流程图（18 节点 / 20 连线）
# ============================================================
d = Doc("图3-3 订单创建算法流程图", 1000, 1600)
n1  = d.node("开始", NR + "fontStyle=1;", 290, 40, 200, 55)
n2  = d.node("接收下单请求<br>（用户ID+套餐ID+场地ID+使用日期+份数+是否批量）", NP, 150, 140, 450, 70)
n3  = d.node("读取套餐与场地信息（读 D2、D3）", N, 190, 250, 380, 55)
n4  = d.node("套餐已上架<br>且场地可用？", ND, 190, 345, 380, 100)
n5  = d.node("校验使用日期（读 D2）", N, 190, 485, 380, 55)
n6  = d.node("日期在可预约周期内？", ND, 190, 580, 380, 100)
n7  = d.node("校验场地剩余容量（读 D3）", N, 190, 720, 380, 55)
n8  = d.node("剩余容量≥订购份数？", ND, 190, 815, 380, 100)
n9  = d.node("校验装备可用数量（读 D5）", N, 190, 955, 380, 55)
n10 = d.node("可用数量≥订购份数？", ND, 190, 1050, 380, 100)
n11 = d.node("生成订单号<br>写订单表 D4（状态=待支付）", N, 190, 1190, 380, 70)
n12 = d.node("写操作日志 D8", N, 190, 1300, 380, 55)
n13 = d.node("结束：返回订单号与状态", NR + "fontStyle=1;", 270, 1395, 300, 60)
n14 = d.node("提示：套餐或<br>场地无效", NP, 700, 365, 250, 60)
n15 = d.node("提示：该日期<br>不可预约", NP, 700, 600, 250, 60)
n16 = d.node("提示：该场地<br>当日已约满", NP, 700, 835, 250, 60)
n17 = d.node("提示：装备<br>库存不足", NP, 700, 1070, 250, 60)
n18 = d.node("结束（失败）", NR + "fontStyle=1;", 725, 1395, 200, 60)

# 主链（12 条）
for a, b in [(n1, n2), (n2, n3), (n3, n4), (n5, n6), (n7, n8),
             (n9, n10), (n11, n12), (n12, n13)]:
    d.edge(a, b, EFLOW, ex=0.5, ey=1, nx=0.5, ny=0)
for a, b in [(n4, n5), (n6, n7), (n8, n9), (n10, n11)]:
    e = d.edge(a, b, EFLOW, ex=0.5, ey=1, nx=0.5, ny=0)
    d.label("是", e, pos="0.3")
# 否分支（4 条）
for a, b in [(n4, n14), (n6, n15), (n8, n16), (n10, n17)]:
    e = d.edge(a, b, EFLOW, ex=1, ey=0.5, nx=0, ny=0.5)
    d.label("否", e, pos="-0.3")
# 失败链（4 条）
for a, b in [(n14, n15), (n15, n16), (n16, n17), (n17, n18)]:
    d.edge(a, b, EFLOW, ex=0.5, ey=1, nx=0.5, ny=0)
d.dump(f"{OUT}/城野随行_图3-3_订单创建算法流程图.drawio", "cysx-fig33")
print("all done")
