/**
 * tabBar 图标生成器（零依赖）
 *
 * 用途：为 pages.json 的 tabBar 生成 6 个线性图标 PNG（首页 / 订单 / 我的 × 普通态 + 选中态）
 * 规格：81×81 RGBA PNG，线性风格，普通态灰色 #999999，选中态主色 #2E7D32
 *
 * 用法：node scripts/gen-tabbar-icons.js
 * 产物：static/tabbar/{home,order,mine}[_active].png
 *
 * 实现说明：
 *  - 内置极简 PNG 编码器（zlib deflate + CRC32），不依赖任何第三方库
 *  - 内置软件光栅器：4× 超采样 + 下采样平均，得到平滑抗锯齿的边缘
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/** 输出尺寸（微信 tabBar 推荐 81×81） */
const SIZE = 81;
/** 超采样倍数（抗锯齿） */
const SS = 4;
/** 线宽（最终像素） */
const STROKE = 6;
/** 内边距（最终像素） */
const PAD = 15;

const OUT_DIR = path.resolve(__dirname, '../static/tabbar');
const COLOR_NORMAL = { r: 0x99, g: 0x99, b: 0x99 };
const COLOR_ACTIVE = { r: 0x2e, g: 0x7d, b: 0x32 };

/* ============================ PNG 编码 ============================ */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

/**
 * CRC32 校验和
 * @param {Buffer} buf 数据
 * @returns {number}
 */
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * 构造 PNG 数据块
 * @param {string} type 块类型（IHDR/IDAT/IEND）
 * @param {Buffer} data 块数据
 * @returns {Buffer}
 */
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/**
 * 将 RGBA 像素缓冲编码为 PNG
 * @param {number} width 宽
 * @param {number} height 高
 * @param {Buffer} rgba RGBA 像素（width*height*4）
 * @returns {Buffer} PNG 二进制
 */
function encodePNG(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const dst = y * (stride + 1);
    raw[dst] = 0; // filter type: None
    rgba.copy(raw, dst + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ============================ 光栅器 ============================ */

/** 超采样画布尺寸 */
const M = SIZE * SS;
/** 半线宽（超采样像素） */
const HALF = (STROKE / 2) * SS;

/**
 * 创建覆盖掩码（超采样分辨率，0/1 二值）
 * @returns {{w:number,h:number,data:Uint8Array}}
 */
function createMask() {
  return { w: M, h: M, data: new Uint8Array(M * M) };
}

/**
 * 单位坐标（0..1）→ 超采样像素坐标
 * @param {number} u 单位坐标
 * @returns {number}
 */
function toPx(u) {
  return (PAD + u * (SIZE - 2 * PAD)) * SS;
}

/**
 * 填充圆（掩码坐标）
 * @param {object} mask 掩码
 * @param {number} cx 圆心 x
 * @param {number} cy 圆心 y
 * @param {number} r 半径
 */
function fillCircle(mask, cx, cy, r) {
  const x0 = Math.max(0, Math.floor(cx - r - 1));
  const x1 = Math.min(mask.w - 1, Math.ceil(cx + r + 1));
  const y0 = Math.max(0, Math.floor(cy - r - 1));
  const y1 = Math.min(mask.h - 1, Math.ceil(cy + r + 1));
  const r2 = r * r;
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        mask.data[y * mask.w + x] = 1;
      }
    }
  }
}

/**
 * 画点（单位坐标）
 * @param {object} mask 掩码
 * @param {number} ux 单位 x
 * @param {number} uy 单位 y
 */
function dotUnit(mask, ux, uy) {
  fillCircle(mask, toPx(ux), toPx(uy), HALF);
}

/**
 * 画线段（单位坐标）：沿线密集打点形成圆头线条
 * @param {object} mask 掩码
 * @param {number} x0 起点 x
 * @param {number} y0 起点 y
 * @param {number} x1 终点 x
 * @param {number} y1 终点 y
 */
function lineUnit(mask, x0, y0, x1, y1) {
  const dx = toPx(x1) - toPx(x0);
  const dy = toPx(y1) - toPx(y0);
  const dist = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(1, Math.ceil(dist / (SS * 0.5)));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    fillCircle(mask, toPx(x0) + dx * t, toPx(y0) + dy * t, HALF);
  }
}

/**
 * 画折线（单位坐标）
 * @param {object} mask 掩码
 * @param {Array<number[]>} points 顶点序列 [[x,y],...]
 */
function polylineUnit(mask, points) {
  for (let i = 0; i < points.length - 1; i += 1) {
    lineUnit(mask, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
  }
}

/**
 * 画矩形描边（单位坐标）
 * @param {object} mask 掩码
 * @param {number} x0 左上 x
 * @param {number} y0 左上 y
 * @param {number} x1 右下 x
 * @param {number} y1 右下 y
 */
function rectUnit(mask, x0, y0, x1, y1) {
  polylineUnit(mask, [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]);
}

/**
 * 画圆描边（单位坐标）
 * @param {object} mask 掩码
 * @param {number} cx 圆心 x
 * @param {number} cy 圆心 y
 * @param {number} r 半径
 */
function circleUnit(mask, cx, cy, r) {
  for (let deg = 0; deg < 360; deg += 0.5) {
    const rad = (deg * Math.PI) / 180;
    dotUnit(mask, cx + r * Math.cos(rad), cy + r * Math.sin(rad));
  }
}

/**
 * 画圆弧描边（单位坐标，角度制，y 轴向下，90° 为正下方）
 * @param {object} mask 掩码
 * @param {number} cx 圆心 x
 * @param {number} cy 圆心 y
 * @param {number} r 半径
 * @param {number} fromDeg 起始角度
 * @param {number} toDeg 结束角度
 */
function arcUnit(mask, cx, cy, r, fromDeg, toDeg) {
  const step = fromDeg <= toDeg ? 0.5 : -0.5;
  for (let deg = fromDeg; step > 0 ? deg <= toDeg : deg >= toDeg; deg += step) {
    const rad = (deg * Math.PI) / 180;
    dotUnit(mask, cx + r * Math.cos(rad), cy + r * Math.sin(rad));
  }
}

/**
 * 掩码下采样 → RGBA PNG 像素
 * @param {object} mask 掩码
 * @param {{r:number,g:number,b:number}} color 图标颜色
 * @returns {Buffer} RGBA 像素
 */
function toRGBA(mask, color) {
  const rgba = Buffer.alloc(SIZE * SIZE * 4);
  const area = SS * SS;
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      let sum = 0;
      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          sum += mask.data[(y * SS + sy) * mask.w + (x * SS + sx)];
        }
      }
      const alpha = Math.round((sum / area) * 255);
      const off = (y * SIZE + x) * 4;
      rgba[off] = color.r;
      rgba[off + 1] = color.g;
      rgba[off + 2] = color.b;
      rgba[off + 3] = alpha;
    }
  }
  return rgba;
}

/* ============================ 图标定义 ============================ */

/** 图标绘制函数集合：每个接收 mask，绘制对应图形（单位坐标 0..1） */
const ICONS = {
  /** 首页：房子（屋顶折线 + 房体矩形） */
  home(mask) {
    polylineUnit(mask, [[0.04, 0.53], [0.5, 0.1], [0.96, 0.53]]);
    rectUnit(mask, 0.22, 0.48, 0.78, 0.92);
  },
  /** 订单：清单（外框 + 三行） */
  order(mask) {
    rectUnit(mask, 0.16, 0.12, 0.84, 0.9);
    lineUnit(mask, 0.32, 0.36, 0.68, 0.36);
    lineUnit(mask, 0.32, 0.53, 0.68, 0.53);
    lineUnit(mask, 0.32, 0.7, 0.68, 0.7);
  },
  /** 我的：人像（头部圆 + 肩部弧） */
  mine(mask) {
    circleUnit(mask, 0.5, 0.32, 0.19);
    arcUnit(mask, 0.5, 0.4, 0.42, 150, 30);
  },
};

/**
 * 生成单个图标 PNG 并落盘
 * @param {string} name 图标名（home/order/mine）
 * @param {{r:number,g:number,b:number}} color 颜色
 * @param {string} suffix 文件名后缀（'' / '_active'）
 */
function render(name, color, suffix) {
  const mask = createMask();
  ICONS[name](mask);
  const png = encodePNG(SIZE, SIZE, toRGBA(mask, color));
  const file = path.join(OUT_DIR, `${name}${suffix}.png`);
  fs.writeFileSync(file, png);
  console.log(`  ✔ ${path.relative(process.cwd(), file)}  (${png.length} bytes)`);
}

/**
 * 主流程
 * @returns {void}
 */
function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('[城野随行] 生成 tabBar 图标 →', path.relative(process.cwd(), OUT_DIR));
  Object.keys(ICONS).forEach((name) => {
    render(name, COLOR_NORMAL, '');
    render(name, COLOR_ACTIVE, '_active');
  });
  console.log('[城野随行] tabBar 图标生成完成（共 6 个，81×81 PNG）');
}

main();
