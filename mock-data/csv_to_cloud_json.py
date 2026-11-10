#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
城野随行 —— CSV 模拟数据 → uniCloud 云数据库可导入 JSON
=========================================================

用途
----
uniCloud 云数据库控制台支持「导入 JSON」，但直接导入 CSV 会把
- onShelf / isBatch 的 True|False 变成字符串 "True"|"False"
- equipRefs 的 [{...}] 变成一整串字符串
导致云函数 `where({onShelf: true})`、`equipRefs[0].equipmentId` 全部失效。

本脚本把 mock-data/*.csv 转成类型正确的 JSON，放在
mock-data/cloud-import/*.json，可直接拖进 uniCloud 控制台导入。

类型映射（按列名，与 initDB/seed.js 的字段约定一致）
---------------------------------------------------
- 数字：price quantity amount score capacity totalQty availableQty
        warnThreshold usedCount
- 布尔：onShelf isBatch
- JSON：equipRefs（解析为数组）
- 其余：字符串（时间字段保持 ISO 字符串，与 seed.js 一致）

用法：python csv_to_cloud_json.py
"""

import csv
import json
import os
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = BASE
OUT_DIR = os.path.join(BASE, 'cloud-import')

# 8 个集合，顺序按依赖（先主数据，后业务数据）
COLLECTIONS = [
    'users', 'packages', 'sites', 'equipments',
    'orders', 'deliveries', 'reviews', 'logs',
]

NUMERIC_FIELDS = {
    'price', 'quantity', 'amount', 'score', 'capacity',
    'totalQty', 'availableQty', 'warnThreshold', 'usedCount',
}
BOOL_FIELDS = {'onShelf', 'isBatch'}
JSON_FIELDS = {'equipRefs'}


def convert_value(col, raw):
    """把 CSV 的字符串单元格转成云数据库里的正确类型"""
    if raw is None:
        return ''
    val = raw.strip()

    # 布尔：True/False（Python 生成）、true/false、1/0
    if col in BOOL_FIELDS:
        if val.lower() in ('true', '1', 'yes'):
            return True
        if val.lower() in ('false', '0', 'no', ''):
            return False
        return val

    # JSON 数组/对象
    if col in JSON_FIELDS:
        if not val:
            return []
        try:
            return json.loads(val)
        except (ValueError, TypeError):
            # 解析失败就原样保留，避免整批导入失败
            print('  [warn] %s 字段 JSON 解析失败，保留原字符串: %s' % (col, val[:60]))
            return val

    # 数字
    if col in NUMERIC_FIELDS:
        if val == '':
            return 0
        try:
            return int(val)
        except ValueError:
            try:
                return float(val)
            except ValueError:
                print('  [warn] %s 字段非数字，保留原字符串: %s' % (col, val))
                return val

    return val


def convert_file(name):
    src = os.path.join(SRC_DIR, name + '.csv')
    if not os.path.exists(src):
        print('  [skip] 缺少 %s.csv' % name)
        return None

    # utf-8-sig 去掉 BOM
    with open(src, 'r', encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            doc = {}
            for col, raw in row.items():
                if col is None:
                    continue
                doc[col] = convert_value(col, raw)
            rows.append(doc)

    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, name + '.json')
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)

    print('  [ok] %-12s %2d 条 -> cloud-import/%s.json' % (name, len(rows), name))
    return len(rows)


def main():
    print('CSV -> uniCloud 导入 JSON')
    print('=' * 50)
    total = 0
    summary = {}
    for name in COLLECTIONS:
        n = convert_file(name)
        if n is not None:
            total += n
            summary[name] = n
    print('=' * 50)
    print('合计 %d 条记录，输出目录：%s' % (total, OUT_DIR))
    print()
    print('各集合条数：')
    for k in COLLECTIONS:
        if k in summary:
            print('  %-12s %d' % (k, summary[k]))
    print()
    print('下一步：uniCloud 控制台 -> 云数据库 -> 选中集合 -> 导入 -> 选对应 .json')
    return 0


if __name__ == '__main__':
    sys.exit(main())
