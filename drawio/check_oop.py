# -*- coding: utf-8 -*-
import glob, xml.etree.ElementTree as ET

NS = '{http://www.w3.org/1999/xhtml}'
def cells(f):
    t = ET.parse(f).getroot()
    verts, edges = {}, []
    for c in t.iter('mxCell'):
        if c.get('vertex') == '1':
            g = c.find('mxGeometry')
            if g is None or g.get('relative') == '1' or g.get('width') is None:
                continue
            verts[c.get('id')] = (float(g.get('x')), float(g.get('y')),
                                   float(g.get('width')), float(g.get('height')))
        if c.get('edge') == '1':
            edges.append((c.get('source'), c.get('target')))
    return verts, edges

def overlap(a, b):
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    return ax < bx + bw and ax + aw > bx and ay < by + bh and ay + ah > by

for f in sorted(glob.glob('城野随行_图OOP-*.drawio')):
    verts, edges = cells(f)
    used = {s for s, _ in edges if s} | {t for _, t in edges if t}
    orphans = [i for i in verts if i not in used and i not in ('0', '1')]
    ov = []
    ids = list(verts.keys())
    for k in range(len(ids)):
        for l in range(k + 1, len(ids)):
            if overlap(verts[ids[k]], verts[ids[l]]):
                ov.append((ids[k], ids[l]))
    print(f'{f.split("/")[-1]:36s} verts={len(verts):2d} edges={len(edges):2d} '
          f'orphan={orphans or "无"} overlaps={ov or "无"}')
