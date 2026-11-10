# -*- coding: utf-8 -*-
"""几何自检：验证六张 UML 图满足
   1) 任意两个节点框不重叠（容器/背景框除外）；
   2) 任意连线的折线段不穿过任何非端点节点框（容器/背景框、细条生命线除外）。
按 draw.io 的绘制规则复原折线：起点=source 上的 (exitX,exitY) 比例点，
中间为 waypoints，终点=target 上的 (entryX,entryY) 比例点，段与段之间是直线。
"""
import glob
import os
import xml.etree.ElementTree as ET

BASE = os.path.dirname(os.path.abspath(__file__))
EPS = 1.0


def f(v, d=0.5):
    try:
        return float(v)
    except (TypeError, ValueError):
        return d


def seg_rect_hit(p1, p2, r, tol=0.0):
    """线段 p1p2 是否进入矩形 r=(x,y,w,h) 内部（不含仅擦边）。"""
    x, y, w, h = r
    x0, x1 = x + tol, x + w - tol
    y0, y1 = y + tol, y + h - tol
    # 端点在矩形内 -> 命中
    for (px, py) in (p1, p2):
        if x0 <= px <= x1 and y0 <= py <= y1:
            return True
    # 逐边求交（轴对齐矩形），交点落在开边内部 -> 命中
    xs, ys = p1
    xe, ye = p2
    if abs(xe - xs) < 1e-9 and abs(ye - ys) < 1e-9:
        return False
    # 与两条竖边 x=x0 / x=x1 求交
    for bx in (x0, x1):
        if abs(xe - xs) > 1e-9:
            t = (bx - xs) / (xe - xs)
            if -1e-6 < t < 1.000001:
                by = ys + t * (ye - ys)
                if y0 + 1e-6 < by < y1 - 1e-6:
                    return True
    # 与两条横边 y=y0 / y=y1 求交
    for by in (y0, y1):
        if abs(ye - ys) > 1e-9:
            t = (by - ys) / (ye - ys)
            if -1e-6 < t < 1.000001:
                bx = xs + t * (xe - xs)
                if x0 + 1e-6 < bx < x1 - 1e-6:
                    return True
    return False


def load(path):
    tree = ET.parse(path)
    root = tree.getroot()
    gm = root.find("diagram/mxGraphModel")
    if gm is None:
        gm = root
    cells = gm.find("root")
    nodes, edges = {}, []
    for c in cells.findall("mxCell"):
        cid = c.get("id")
        if cid in ("0", "1"):
            continue
        st = c.get("style") or ""
        geo = c.find("mxGeometry")
        if c.get("edge") == "1":
            pts = []
            if geo is not None:
                arr = geo.find("Array")
                if arr is not None:
                    for p in arr.findall("mxPoint"):
                        pts.append((f(p.get("x")), f(p.get("y"))))
            edges.append((cid, c.get("source"), c.get("target"), c.get("style") or "", pts))
            continue
        if geo is None or geo.get("relative") == "1":
            continue
        w, h = f(geo.get("width"), 0), f(geo.get("height"), 0)
        if w <= 0 or h <= 0:
            continue
        nodes[cid] = dict(id=cid, x=f(geo.get("x")), y=f(geo.get("y")), w=w, h=h,
                          style=st, label=(c.get("value") or ""))
    return nodes, edges


def containers(nodes):
    cs = set()
    for a in nodes.values():
        for b in nodes.values():
            if a["id"] == b["id"]:
                continue
            bx = b["x"] >= a["x"] - 1 and b["x"] + b["w"] <= a["x"] + a["w"] + 1
            by = b["y"] >= a["y"] - 1 and b["y"] + b["h"] <= a["y"] + a["h"] + 1
            if bx and by:
                cs.add(a["id"])
    return cs


def main():
    files = sorted(glob.glob(os.path.join(BASE, "城野随行_图OOP-*.drawio")))
    for path in files:
        nodes, edges = load(path)
        cons = containers(nodes)
        # 细条（生命线 2px）与时序图激活块（14px）允许被消息线穿过
        thin = {i for i, n in nodes.items() if min(n["w"], n["h"]) <= 16}
        solids = [n for i, n in nodes.items() if i not in cons and i not in thin]
        print("=" * 72)
        print(os.path.basename(path))
        print("  节点 %d（实体框 %d，容器 %d，细条 %d） 连线 %d"
              % (len(nodes), len(solids), len(cons), len(thin), len(edges)))

        # 1) 框与框重叠
        bad = []
        keys = list(solids)
        for i in range(len(keys)):
            for j in range(i + 1, len(keys)):
                a, b = keys[i], keys[j]
                ox = min(a["x"] + a["w"], b["x"] + b["w"]) - max(a["x"], b["x"])
                oy = min(a["y"] + a["h"], b["y"] + b["h"]) - max(a["y"], b["y"])
                if ox > EPS and oy > EPS:
                    bad.append((a["label"][:18] or a["id"], b["label"][:18] or b["id"]))
        print("  框重叠: %s" % ("无" if not bad else bad))

        # 2) 连线穿框
        hits = []
        for cid, src, tgt, st, pts in edges:
            if src not in nodes or tgt not in nodes:
                continue
            s, t = nodes[src], nodes[tgt]
            ex, ey = f(st.split("exitX=")[1].split(";")[0]) if "exitX=" in st else 0.5, \
                     f(st.split("exitY=")[1].split(";")[0]) if "exitY=" in st else 0.5
            nx, ny = f(st.split("entryX=")[1].split(";")[0]) if "entryX=" in st else 0.5, \
                     f(st.split("entryY=")[1].split(";")[0]) if "entryY=" in st else 0.5
            p0 = (s["x"] + ex * s["w"], s["y"] + ey * s["h"])
            p1 = (t["x"] + nx * t["w"], t["y"] + ny * t["h"])
            line = [p0] + pts + [p1]
            for k in range(len(line) - 1):
                for n in solids:
                    if n["id"] in (src, tgt):
                        continue
                    if seg_rect_hit(line[k], line[k + 1], (n["x"], n["y"], n["w"], n["h"]), 0.5):
                        hits.append("边%s %s→%s 段%d 穿过[%s]"
                                    % (cid, (s["label"][:10] or src), (t["label"][:10] or tgt),
                                       k + 1, (n["label"][:16] or n["id"])))
        print("  连线穿框: %d" % len(hits))
        for hh in hits:
            print("    -", hh)


if __name__ == "__main__":
    main()
