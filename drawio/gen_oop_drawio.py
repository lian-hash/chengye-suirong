# -*- coding: utf-8 -*-
"""按《城野随行_面向对象规格说明书 V1.0》六张 UML 图的绘制说明，生成 6 个 .drawio 初始文件。
规范：白底 #ffffff、描边 #333333、正交折线、全中文、局部零交叉；沿用 gen_drawio_files.py 的 Doc 类约定。
绘制说明对应：1 上下文模型图 / 2 用例图 / 3 带泳道活动图 / 4 类图 / 5 时序图 / 6 状态图。
"""
import html, os

OUT = "D:/path/to/chengye-suirong/drawio"
os.makedirs(OUT, exist_ok=True)

# —— 基础样式（与现有脚本一致）——
N  = "rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;strokeWidth=1;fontColor=#333333;fontSize=12;align=center;verticalAlign=middle;"
NR = "rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;strokeWidth=1;fontColor=#333333;fontSize=12;align=center;verticalAlign=middle;"
NP = "shape=parallelogram;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;strokeWidth=1;fontColor=#333333;fontSize=12;align=center;verticalAlign=middle;"
ND = "rhombus;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;strokeWidth=1;fontColor=#333333;fontSize=12;align=center;verticalAlign=middle;"
ELL= "ellipse;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;strokeWidth=1;fontColor=#333333;fontSize=11;align=center;verticalAlign=middle;"
LANE="rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;strokeWidth=1;fontColor=#333333;fontSize=12;align=left;verticalAlign=middle;dashed=0;"
NOTE="rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#666666;strokeWidth=1;fontColor=#333333;fontSize=10;align=left;verticalAlign=middle;dashed=1;"

# —— UML 专用样式 ——
U_ACTOR = "shape=umlActor;html=1;fillColor=#ffffff;strokeColor=#333333;strokeWidth=1;fontColor=#333333;fontSize=11;verticalAlign=bottom;"
U_SYS   = "rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;strokeWidth=2;fontColor=#333333;fontSize=11;align=center;verticalAlign=middle;"
U_BOUNDARY = "rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#666666;strokeWidth=1;dashed=1;fontColor=#666666;fontSize=11;align=left;verticalAlign=top;"
U_EXTSYS = "rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;strokeWidth=1;fontColor=#333333;fontSize=11;align=center;verticalAlign=middle;"
U_CLASS = "rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;strokeWidth=1;fontColor=#333333;fontSize=10;align=center;verticalAlign=top;"
U_STATE = "rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;strokeWidth=1;fontColor=#333333;fontSize=11;align=center;verticalAlign=middle;"
U_INIT  = "ellipse;html=1;fillColor=#333333;strokeColor=#333333;strokeWidth=1;"
U_FINAL = "ellipse;html=1;fillColor=#ffffff;strokeColor=#333333;strokeWidth=2;"
U_LIFE  = "rounded=0;html=1;fillColor=#333333;strokeColor=#333333;strokeWidth=1;"
U_ACT   = "rounded=0;html=1;fillColor=#ffffff;strokeColor=#333333;strokeWidth=1;fontColor=#333333;fontSize=10;align=center;verticalAlign=middle;"

# —— 连线样式 ——
E_ASSOC = "html=1;strokeColor=#333333;strokeWidth=1;endArrow=open;endFill=0;"
E_GEN   = "html=1;strokeColor=#333333;strokeWidth=1;endArrow=block;endFill=0;"
E_DEP   = "html=1;strokeColor=#333333;strokeWidth=1;endArrow=open;endFill=0;dashed=1;"
E_FLOW  = "html=1;strokeColor=#333333;strokeWidth=1;endArrow=block;endFill=1;"
E_OPEN  = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#333333;strokeWidth=1;endArrow=open;endFill=0;"
E_RET   = "html=1;strokeColor=#333333;strokeWidth=1;endArrow=open;endFill=0;dashed=1;"
# —— 按华为云 CodeArts Modeling 官方规范补充的关系/图元 ——
E_USE   = "html=1;strokeColor=#333333;strokeWidth=1;endArrow=open;endFill=0;"
E_COMP  = "html=1;strokeColor=#333333;strokeWidth=1;endArrow=open;endFill=0;startArrow=diamondThin;startFill=1;"
E_AGGR  = "html=1;strokeColor=#333333;strokeWidth=1;endArrow=open;endFill=0;startArrow=diamondThin;startFill=0;"
U_ACTIV = "rounded=0;html=1;fillColor=#ffffff;strokeColor=#333333;strokeWidth=1;"
LBL = "edgeLabel;html=1;fillColor=#ffffff;strokeColor=#666666;fontColor=#333333;fontSize=10;"

def esc(s):
    # 关键：XML 会把属性内的字面换行规范化成空格，导致 draw.io 里多行标签被压成单行。
    # 必须写成字符实体 &#10;，draw.io 与后续解析才能正确还原换行。
    return html.escape(s, quote=True).replace("\n", "&#10;")

class Doc:
    def __init__(self, name, pw, ph):
        self.name = name; self.pw, self.ph = pw, ph
        self.cells = []; self.n = 1  # 系统层已占 id=0/1，自定义 id 从 2 起
    def nid(self):
        self.n += 1; return str(self.n)
    def node(self, value, style, x, y, w, h, parent="1", extra=""):
        i = self.nid()
        self.cells.append(
            f'        <mxCell id="{i}" value="{esc(value)}" style="{style}{extra}" vertex="1" parent="{parent}">\n'
            f'          <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>\n'
            f'        </mxCell>')
        return i
    def edge(self, src, dst, style, value="", ex=None, ey=None, nx=None, ny=None, waypoints=None):
        i = self.nid(); st = style
        if ex is not None: st += f"exitX={ex};exitY={ey};"
        if nx is not None: st += f"entryX={nx};entryY={ny};"
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
    def label(self, value, src, pos="-0.5"):
        i = self.nid()
        self.cells.append(
            f'        <mxCell id="{i}" value="{esc(value)}" style="{LBL}" connectable="0" '
            f'vertex="1" parent="{src}">\n'
            f'          <mxGeometry x="{pos}" relative="1" as="geometry">\n'
            f'            <mxPoint as="offset"/>\n          </mxGeometry>\n        </mxCell>')
        return i
    def dump(self, path, diagram_id):
        cells = "\n".join(self.cells)
        xml = (f'<mxfile host="draw.io" type="device">\n'
               f'  <diagram name="{esc(self.name)}" id="{diagram_id}">\n'
               f'    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" '
               f'tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" '
               f'pageWidth="{self.pw}" pageHeight="{self.ph}" background="#ffffff">\n'
               f'      <root>\n        <mxCell id="0"/>\n        <mxCell id="1" parent="0"/>\n'
               f'{cells}\n      </root>\n    </mxGraphModel>\n  </diagram>\n</mxfile>\n')
        with open(path, "w", encoding="utf-8") as f:
            f.write(xml)
        print("write:", path, "| cells:", len(self.cells))

# ============================================================
# 图 OOP-1 上下文模型图（系统边界图）
#   中央大矩形=目标系统；四周外部参与者；连线标注数据流，不穿越系统方框。
# ============================================================
d = Doc("图OOP-1 上下文模型图（系统边界图）", 1180, 760)
# 系统边界（Boundary 框，按 CodeArts Modeling 上下文模型规范包住目标系统）
bnd = d.node("系统边界", U_BOUNDARY, 390, 210, 400, 340)
SYS = d.node("城野随行平台\n（目标系统）", U_SYS + "fontSize=14;fontStyle=1;", 430, 250, 320, 260)
# 人参与者（actor）
a_user = d.node("C 端用户", U_ACTOR, 90, 150, 90, 90)
a_op   = d.node("B 端运营人员", U_ACTOR, 90, 430, 90, 90)
a_adm  = d.node("系统管理员", U_ACTOR, 980, 480, 90, 90)
# 外部系统参与者（方框，标注 «external system» 版型，与目标 System 区分）
s_wx   = d.node("«external system»\n微信开放平台", U_EXTSYS, 980, 110, 150, 70)
s_pay  = d.node("«external system»\n微信支付（模拟）", U_EXTSYS, 980, 280, 150, 70)
# 数据流（标注名称；连到系统边界，不穿越方框）
d.edge(a_user, SYS, E_OPEN, "登录授权请求/凭证", ex=1, ey=0.5, nx=0, ny=0.15, waypoints=[(185,195),(420,295)])
d.edge(a_user, SYS, E_OPEN, "浏览查询请求/套餐场地数据", ex=1, ey=0.5, nx=0, ny=0.4, waypoints=[(185,195),(420,360)])
d.edge(a_user, SYS, E_OPEN, "下单请求/订单数据", ex=1, ey=0.5, nx=0, ny=0.6, waypoints=[(185,195),(420,410)])
d.edge(a_user, SYS, E_OPEN, "支付请求/支付结果", ex=1, ey=0.5, nx=0, ny=0.8, waypoints=[(185,195),(420,470)])
d.edge(a_user, SYS, E_OPEN, "评价/退款请求/结果", ex=1, ey=0.5, nx=0.15, ny=0.95, waypoints=[(185,195),(420,500)])
d.edge(a_op, SYS, E_OPEN, "套餐/场地/装备维护数据", ex=1, ey=0.5, nx=0, ny=0.5, waypoints=[(185,475),(420,480)])
d.edge(a_op, SYS, E_OPEN, "配送调度指令/状态", ex=1, ey=0.5, nx=0.1, ny=0.7, waypoints=[(185,475),(420,520)])
d.edge(a_op, SYS, E_OPEN, "批量下单数据", ex=1, ey=0.5, nx=0.1, ny=0.85, waypoints=[(185,475),(420,560)])
d.edge(a_op, SYS, E_OPEN, "统计查询/报表", ex=1, ey=0.5, nx=0, ny=0.95, waypoints=[(185,475),(420,590)])
d.edge(a_adm, SYS, E_OPEN, "权限配置", ex=0, ey=0.3, nx=1, ny=0.7, waypoints=[(975,510),(755,470)])
d.edge(a_adm, SYS, E_OPEN, "日志检索/审计数据", ex=0, ey=0.5, nx=1, ny=0.82, waypoints=[(975,510),(755,510)])
d.edge(a_adm, SYS, E_OPEN, "统计查询", ex=0, ey=0.7, nx=1, ny=0.92, waypoints=[(975,510),(755,540)])
d.edge(SYS, s_wx, E_OPEN, "授权 code", ex=1, ey=0.25, nx=0, ny=0.5, waypoints=[(750,310),(970,140)])
d.edge(s_wx, SYS, E_OPEN, "openid", ex=0, ey=0.5, nx=1, ny=0.35, waypoints=[(980,140),(750,340)])
d.edge(SYS, s_pay, E_OPEN, "支付请求", ex=1, ey=0.6, nx=0, ny=0.5, waypoints=[(750,410),(970,300)])
d.edge(s_pay, SYS, E_OPEN, "模拟回执", ex=0, ey=0.5, nx=1, ny=0.5, waypoints=[(980,300),(750,430)])
d.node("绘制提示：以 Boundary 边界框界定系统范围，目标系统(System)置于框内、外部角色(Actor)与外部系统(«external system»)一律在框外；连线不穿越系统方框，每条连线标注交互的数据流名称。",
       NOTE, 90, 640, 1040, 70)
d.dump(f"{OUT}/城野随行_图OOP-1_上下文模型图.drawio", "cysx-oop1")

# ============================================================
# 图 OOP-2 UML 用例图
#   参与者：游客/已登录用户/运营人员/管理员(人)；微信开放平台/微信支付(外部系统)
#   关系：<<include>> 下单→校验、支付→应用支付方式；<<extend>> 取消/退款→评价；泛化 已登录用户──▷游客
# ============================================================
d = Doc("图OOP-2 UML 用例图", 1180, 900)
# 人参与者（左）
p_yk  = d.node("游客", U_ACTOR, 70, 120, 90, 90)
p_yh  = d.node("已登录用户", U_ACTOR, 70, 320, 90, 90)
p_yy  = d.node("运营人员", U_ACTOR, 70, 540, 90, 90)
p_gl  = d.node("管理员", U_ACTOR, 70, 700, 90, 90)
# 外部系统参与者（右，方框，标注 «external system» 版型）
p_wx  = d.node("«external system»\n微信开放平台", U_EXTSYS, 1000, 200, 150, 70)
p_pay = d.node("«external system»\n微信支付（模拟）", U_EXTSYS, 1000, 420, 150, 70)
# 系统边界（Boundary）：包住全部用例，Actor 与外部系统在边界外
uc_bnd = d.node("系统边界", U_BOUNDARY, 200, 40, 800, 780)
# 用例（椭圆，中）
uc_browse = d.node("浏览套餐与场地", ELL, 430, 70, 150, 60)
uc_order  = d.node("下单(UC-01)", ELL, 430, 180, 150, 60)
uc_pay    = d.node("模拟支付(UC-02)", ELL, 430, 290, 150, 60)
uc_query  = d.node("查询订单", ELL, 250, 290, 130, 60)
uc_review = d.node("评价", ELL, 250, 400, 130, 60)
uc_refund = d.node("取消/退款", ELL, 250, 510, 130, 60)
uc_batch  = d.node("批量下单(UC-03)", ELL, 430, 400, 150, 60)
uc_chk    = d.node("四重校验", ELL, 620, 180, 130, 60)
uc_app    = d.node("应用支付方式", ELL, 620, 290, 130, 60)
uc_maint  = d.node("维护套餐/场地/装备", ELL, 620, 420, 150, 70)
uc_disp   = d.node("配送调度", ELL, 620, 530, 130, 60)
uc_stat   = d.node("查看统计", ELL, 620, 640, 130, 60)
uc_perm   = d.node("权限管理", ELL, 850, 540, 130, 60)
uc_log    = d.node("日志审计", ELL, 850, 640, 130, 60)
uc_gstat  = d.node("查看全局统计", ELL, 850, 730, 140, 60)
# 参与者→用例 用官方 Use 连线关系（CodeArts：Actor与用例用的是Use连线关系）
# 跨越其它用例椭圆的连线统一绕行：先垂直出到空白横巷，再横向进入目标椭圆边缘
d.edge(p_yk, uc_browse, E_USE)
d.edge(p_yh, uc_browse, E_USE)
d.edge(p_yh, uc_order, E_USE, ex=0.5, ey=0, nx=0.5, ny=0,
       waypoints=[(175, 320), (175, 165), (505, 165)])
d.edge(p_yh, uc_query, E_USE)
d.edge(p_yh, uc_review, E_USE)
d.edge(p_yh, uc_refund, E_USE)
d.edge(p_yy, uc_batch, E_USE, ex=0.5, ey=0, nx=0.5, ny=0,
       waypoints=[(115, 495), (505, 495)])
d.edge(p_yy, uc_maint, E_USE, ex=1, ey=0.5, nx=0.5, ny=0,
       waypoints=[(600, 585), (600, 405), (695, 405)])
d.edge(p_yy, uc_disp, E_USE)
d.edge(p_yy, uc_stat, E_USE)
d.edge(p_gl, uc_perm, E_USE)
d.edge(p_gl, uc_log, E_USE, ex=1, ey=0.5, nx=0, ny=0.5,
       waypoints=[(830, 745), (830, 670)])
d.edge(p_gl, uc_gstat, E_USE)
# 泛化：已登录用户 ──▷ 游客
d.edge(p_yh, p_yk, E_GEN, "泛化")
# <<include>>
d.edge(uc_order, uc_chk, E_DEP, "«include»")
d.edge(uc_pay, uc_app, E_DEP, "«include»")
d.edge(p_wx, uc_order, E_DEP, "«include»", ex=0, ey=0.5, nx=0.5, ny=0,
       waypoints=[(1000, 150), (505, 150)])
d.edge(p_pay, uc_pay, E_DEP, "«include»", ex=0, ey=0.5, nx=0.5, ny=1,
       waypoints=[(1000, 390), (505, 390)])
# <<extend>>
d.edge(uc_refund, uc_review, E_DEP, "«extend»")
d.node("绘制提示：参与者=小人；外部系统=方框；«include»/«extend» 用虚线箭头并标注构造型；泛化用空心三角；用例用椭圆。",
       NOTE, 70, 820, 1040, 50)
d.dump(f"{OUT}/城野随行_图OOP-2_UML用例图.drawio", "cysx-oop2")

# ============================================================
# 图 OOP-3 带泳道 UML 活动图
#   泳道：C端用户 / 系统 / 运营人员；含初始、分支(校验/支付)、汇合、终止(已完成/已取消)
# ============================================================
d = Doc("图OOP-3 带泳道 UML 活动图", 1080, 1320)
# 三条泳道（官方称 Partition 分区；背景带 + 标题）
lane_c = d.node("分区(Partition)：C 端用户", LANE + "fontStyle=1;", 40, 60, 920, 340)
lane_s = d.node("分区(Partition)：系统", LANE + "fontStyle=1;", 40, 420, 920, 560)
lane_o = d.node("分区(Partition)：运营人员", LANE + "fontStyle=1;", 40, 1000, 920, 300)
# 初始节点
init = d.node("", U_INIT, 110, 90, 24, 24)
# C 端用户泳道活动
a1 = d.node("选择套餐与场地\n并提交预约", NR, 90, 150, 200, 60)
a2 = d.node("发起模拟支付", NR, 90, 270, 200, 60)
a4 = d.node("使用", NR, 90, 350, 200, 60)
# 系统泳道：四重校验(菱形分支) + 处理节点
s_chk = d.node("四重校验\n(套餐上架/周期/容量/库存)", ND, 430, 450, 240, 110)
s_ok  = d.node("生成订单并锁库存", NR, 410, 600, 200, 60)
s_payok = d.node("订单置已支付", NR, 410, 720, 200, 60)
s_disp = d.node("创建配送任务并派单", NR, 410, 860, 220, 60)
s_fail= d.node("提示原因并终止", NP, 720, 510, 200, 60)
# 运营人员泳道活动
a3 = d.node("现场布置", NR, 700, 1020, 200, 60)
a5 = d.node("回收处理", NR, 700, 1150, 200, 60)
# 终止节点
end_ok = d.node("已完成", U_FINAL, 110, 1230, 30, 30)
end_ca = d.node("已取消", U_FINAL, 430, 1230, 30, 30)
# 主流程连线
d.edge(init, a1, E_FLOW, ex=0.5, ey=1, nx=0.5, ny=0)
d.edge(a1, s_chk, E_FLOW, ex=1, ey=0.5, nx=0, ny=0.5, value="提交")
e = d.edge(s_chk, s_ok, E_FLOW, ex=0.5, ey=1, nx=0.5, ny=0); d.label("通过", e)
e = d.edge(s_chk, s_fail, E_FLOW, ex=1, ey=0.5, nx=0, ny=0.5); d.label("不通过", e)
d.edge(s_ok, a2, E_FLOW, ex=0, ey=0.5, nx=1, ny=0.5)
e = d.edge(a2, s_payok, E_FLOW, ex=1, ey=0.5, nx=0, ny=0.5); d.label("成功", e)
d.edge(s_payok, s_disp, E_FLOW, ex=0.5, ey=1, nx=0.5, ny=0)
d.edge(s_disp, a3, E_FLOW, ex=1, ey=0.5, nx=0, ny=0.5)
# 跨泳道的长流程线一律沿右侧空白纵巷绕行，不穿过任何活动框
d.edge(a3, a4, E_FLOW, ex=1, ey=0.5, nx=1, ny=0.5,
       waypoints=[(955, 1050), (955, 380)])
d.edge(a4, a5, E_FLOW, ex=1, ey=0.75, nx=1, ny=0.75,
       waypoints=[(1040, 400), (1040, 1195)])
d.edge(a5, end_ok, E_FLOW, ex=0.5, ey=1, nx=0.5, ny=0, value="确认完成")
# 取消/退款分支（任意态→已取消）：各自占用一条左侧空白纵巷，从上方接入终止节点
d.edge(s_ok, end_ca, E_FLOW, ex=0, ey=0.5, nx=0.5, ny=0,
       waypoints=[(330, 630), (330, 1180), (445, 1180)], value="取消/退款")
d.edge(a2, end_ca, E_FLOW, ex=1, ey=0.5, nx=0.167, ny=0,
       waypoints=[(60, 300), (60, 1215), (435, 1215)], value="取消/退款")
d.node("绘制提示：自顶向下设三条泳道；分支用菱形(监护条件)，汇合对齐；终止可为「已完成」与「已取消」两个。",
       NOTE, 40, 1270, 1000, 40)
d.dump(f"{OUT}/城野随行_图OOP-3_带泳道活动图.drawio", "cysx-oop3")

# ============================================================
# 图 OOP-4 UML 类图
#   布局：6 列 × 4 行网格。实体类两行，控制类与其主管实体同列（依赖为短竖线），
#         边界类在末行。跨列长连线一律走预留通道（上方 y=30、纵巷 260/490/720、
#         横巷 250/490/685/945），保证连线不穿过任何类框。
#   游客 / 已登录用户不再单列子类，由 User.role 枚举区分（见属性行）。
# ============================================================
d = Doc("图OOP-4 UML 类图", 1500, 1080)
def klass(name, attrs, ops, x, y, w=170, h=130):
    txt = f"{name}\n——\n" + "\n".join(attrs) + "\n——\n" + "\n".join(ops)
    return d.node(txt, U_CLASS + "fontSize=11;", x, y, w, h)
# 实体类：上排（列 1/3/5）
c_user  = klass("User", ["- userId: String","- openid: String","- role: Enum{guest,user}"], ["+ login()","+ loadPermission()"], 60, 60)
# 注：游客 / 已登录用户不单列子类，由 User.role 枚举区分（完整取值域 guest/user/operator/admin 见数据字典 A03）
c_order = klass("Order", ["- orderId: String","- status: Enum","- amount: Decimal"], ["+ create()","+ pay()","+ cancel()"], 520, 60)
c_item  = klass("OrderItem", ["- itemId: String","- qty: Int"], ["+ computeSub()"], 980, 60)
# 实体类：下排（列 2/4/5/6）
c_site  = klass("Site", ["- siteId: String","- capacity: Int","- available: Bool"], ["+ queryAvailable()"], 290, 330)
c_pkg   = klass("Package", ["- pkgId: String","- price: Decimal","- onShelf: Bool"], ["+ isOnShelf()","+ checkPeriod()"], 750, 330)
c_eq    = klass("Equipment", ["- eqId: String","- stock: Int"], ["+ checkStock()","+ inOut()"], 980, 330)
c_dlv   = klass("DeliveryTask", ["- taskId: String","- status: Enum"], ["+ dispatch()"], 1210, 330)
# 控制类（列 1..6，与主管实体同列）
c_ua = klass("UserAuthService", ["«control»"], ["+ auth()"], 60, 620)
c_fs = klass("FinanceService", ["«control»"], ["+ revenue()","+ refund()"], 290, 620)
c_os = klass("OrderService", ["«control»"], ["+ create()","+ pay()"], 520, 620)
c_ps = klass("PackageService", ["«control»"], ["+ savePkg()"], 750, 620)
c_es = klass("EquipmentService", ["«control»"], ["+ inOut()","+ sterilize()"], 980, 620)
c_ds = klass("DeliveryService", ["«control»"], ["+ dispatch()"], 1210, 620)
# 边界类（末行）
c_mp = klass("MiniProgramView", ["«boundary»"], ["+ submitOrder()","+ showResult()"], 60, 880)
c_wa = klass("WebAdminView", ["«boundary»"], ["+ maintain()","+ dispatchUI()"], 290, 880)
# —— 关联（走上方通道 / 纵巷，避免横穿类框）——
d.edge(c_user, c_order, E_ASSOC, "1 —— *", ex=0.5, ey=0, nx=0.5, ny=0,
       waypoints=[(145, 30), (605, 30)])
d.edge(c_order, c_item, E_COMP, "1 —— * 组合", ex=0.5, ey=0, nx=0.5, ny=0,
       waypoints=[(690, 30), (1065, 30)])
d.edge(c_order, c_pkg, E_ASSOC, "* —— 1", ex=1, ey=0.27, nx=0, ny=0.5,
       waypoints=[(720, 95), (720, 395)])
d.edge(c_order, c_site, E_ASSOC, "* —— 1", ex=0, ey=0.885, nx=0.5, ny=1,
       waypoints=[(260, 175), (260, 490), (375, 490)])
d.edge(c_pkg, c_eq, E_AGGR, "聚合 *", ex=1, ey=0.5, nx=0, ny=0.5)
# —— 控制类 依赖 实体类（同列者为短竖线）——
d.edge(c_ua, c_user, E_DEP, "依赖", ex=0.5, ey=0, nx=0.5, ny=1)
d.edge(c_os, c_order, E_DEP, "依赖", ex=0.5, ey=0, nx=0.5, ny=1)
d.edge(c_ps, c_pkg, E_DEP, "依赖", ex=0.5, ey=0, nx=0.5, ny=1)
d.edge(c_es, c_eq, E_DEP, "依赖", ex=0.5, ey=0, nx=0.5, ny=1)
d.edge(c_ds, c_dlv, E_DEP, "依赖", ex=0.5, ey=0, nx=0.5, ny=1)
d.edge(c_fs, c_order, E_DEP, "依赖", ex=1, ey=0.5, nx=0.235, ny=1,
       waypoints=[(500, 685), (500, 250), (560, 250)])
# —— 边界类 依赖 控制类 ——
d.edge(c_mp, c_ua, E_DEP, "依赖", ex=0.5, ey=0, nx=0.5, ny=1)
d.edge(c_wa, c_ps, E_DEP, "依赖", ex=1, ey=0.5, nx=0, ny=0.5,
       waypoints=[(720, 945), (720, 685)])
d.node("绘制提示：三类（实体/«boundary»/«control»）用同一矩形并注明版型；每类写 类名/属性/操作；关联标多重度，组合实心菱形、聚合空心菱形；控制类与主管实体同列，依赖画短竖线；跨列连线走预留通道，不穿过任何类框。游客与已登录用户由 User.role 枚举区分，不单列子类。",
       NOTE, 60, 1030, 1380, 45)
d.dump(f"{OUT}/城野随行_图OOP-4_UML类图.drawio", "cysx-oop4")

# ============================================================
# 图 OOP-5 UML 时序图
#   对象 :MiniProgramView :OrderController :OrderService :Package :Site :Equipment :Order :DeliveryService
#   消息自上而下，返回消息虚线；消息名对应类图操作
# ============================================================
d = Doc("图OOP-5 UML 时序图", 1320, 920)
objs = [":MiniProgramView", ":OrderController", ":OrderService", ":Package",
        ":Site", ":Equipment", ":Order", ":DeliveryService"]
xs = [60, 210, 360, 515, 670, 825, 980, 1140]
heads = []
lifes = []
for name, x in zip(objs, xs):
    heads.append(d.node(name, U_ACT + "fontStyle=1;", x, 40, 120, 40))
    lifes.append(d.node("", U_LIFE, x + 59, 80, 2, 760))
# 激活块（CodeArts 官方规范：绘制消息线和激活块，对象执行期间画细长方块）
for i, y1, y2 in [(1, 140, 220), (2, 220, 820), (6, 500, 620), (3, 300, 340),
                  (4, 360, 400), (5, 420, 460), (7, 700, 760)]:
    d.node("", U_ACTIV, xs[i] + 53, y1, 14, y2 - y1)
# 消息（横向箭头；y 为高度）
def msg(src, dst, text, y, dashed=False, label=None):
    s, t = lifes[src], lifes[dst]
    e = d.edge(s, t, E_RET if dashed else E_OPEN, text, ex=0.5, ey=0.5, nx=0.5, ny=0.5,
               waypoints=[(xs[src]+60, y), (xs[dst]+60, y)])
    if label: d.label(label, e)
    return e
msg(0, 1, "①提交订单(预约信息)", 140)
msg(1, 2, "②receive(预约信息)→create()", 220)
msg(2, 3, "③isOnShelf()/checkPeriod()", 300)
msg(2, 4, "③queryAvailable()", 360)
msg(2, 5, "③checkStock()", 420)
msg(2, 6, "④create() 生成订单·锁库存", 500)
msg(6, 2, "（订单对象）", 560, dashed=True)
msg(2, 6, "⑤pay() 模拟支付", 620)
msg(6, 7, "⑥dispatch() 创建配送任务", 700)
msg(7, 2, "（订单号/待支付）", 760, dashed=True)
msg(2, 0, "⑦返回订单号与待支付", 820)
d.node("绘制提示：每个对象向下拉垂直生命线；消息自上而下、返回用虚线；消息名须与类图操作方法一致（create/isOnShelf/checkPeriod/queryAvailable/checkStock/pay/dispatch）。",
       NOTE, 40, 860, 1240, 50)
d.dump(f"{OUT}/城野随行_图OOP-5_UML时序图.drawio", "cysx-oop5")

# ============================================================
# 图 OOP-6 UML 状态图
#   主体 Order；状态链 待支付→已支付→配送中→布置中→使用中→已回收→已完成；任意态→已取消
# ============================================================
d = Doc("图OOP-6 UML 状态图", 1000, 1000)
init = d.node("", U_INIT, 100, 80, 24, 24)
st_dp = d.node("待支付", U_STATE + "fontStyle=1;", 80, 140, 130, 50)
st_yp = d.node("已支付", U_STATE, 80, 240, 130, 50)
st_ps = d.node("配送中", U_STATE, 80, 340, 130, 50)
st_bz = d.node("布置中", U_STATE, 80, 440, 130, 50)
st_sy = d.node("使用中", U_STATE, 80, 540, 130, 50)
st_hs = d.node("已回收", U_STATE, 80, 640, 130, 50)
st_wc = d.node("已完成", U_FINAL, 90, 740, 32, 32)
st_cx = d.node("已取消", U_FINAL, 420, 440, 32, 32)
# 主链
d.edge(init, st_dp, E_OPEN, ex=0.5, ey=1, nx=0.5, ny=0)
d.edge(st_dp, st_yp, E_OPEN, "pay()[支付回执有效]", ex=0.5, ey=1, nx=0.5, ny=0)
d.edge(st_yp, st_ps, E_OPEN, "dispatch()", ex=0.5, ey=1, nx=0.5, ny=0)
d.edge(st_ps, st_bz, E_OPEN, "arrange()", ex=0.5, ey=1, nx=0.5, ny=0)
d.edge(st_bz, st_sy, E_OPEN, "useStart()", ex=0.5, ey=1, nx=0.5, ny=0)
d.edge(st_sy, st_hs, E_OPEN, "recycle()", ex=0.5, ey=1, nx=0.5, ny=0)
d.edge(st_hs, st_wc, E_OPEN, "confirm()", ex=0.5, ey=0, nx=0.5, ny=0.5)
# 取消/退款（任意态→已取消）
d.edge(st_dp, st_cx, E_OPEN, "cancel()/refund()", ex=1, ey=0.5, nx=0, ny=0.5, waypoints=[(210,165),(420,165),(420,440)])
d.edge(st_yp, st_cx, E_OPEN, "cancel()/refund()", ex=1, ey=0.5, nx=0, ny=0.5, waypoints=[(210,265),(420,265),(420,440)])
d.edge(st_sy, st_cx, E_OPEN, "cancel()/refund()", ex=1, ey=0.5, nx=0, ny=0.5, waypoints=[(210,565),(420,565),(420,440)])
d.node("绘制提示：以 Order 单一对象为状态机主体；完整画出 7 主状态 + 2 终态；每条迁移标 触发事件[监护]；初始=实心圆，终止=牛眼。",
       NOTE, 80, 920, 900, 50)
d.dump(f"{OUT}/城野随行_图OOP-6_UML状态图.drawio", "cysx-oop6")

print("all oop drawio generated.")
