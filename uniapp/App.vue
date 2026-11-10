<script>
import auth from './utils/auth';
import unicloudConfig from './config/unicloud';

export default {
  // 兼容旧 globalData 用法（uni-app 中 getApp().globalData 可用）
  globalData: {
    // 真实 uniCloud 空间标识（从统一配置读取，不再硬编码空串）
    envId: unicloudConfig.SPACE_ID,
    // 当前运行模式：mock / cloud
    cloudMode: unicloudConfig.isMock() ? 'mock' : 'cloud',
  },

  onLaunch() {
    // uniCloud.init() 已在 main.js 中完成，这里仅输出当前模式，便于开发者工具排查
    const mode = unicloudConfig.isMock() ? 'mock' : 'cloud';
    console.log(`[城野随行] 启动模式：${mode === 'cloud' ? '真实 uniCloud' : '本地 Mock'}，spaceId=${unicloudConfig.SPACE_ID || '(未配置)'}`);
    // 静默登录（Mock 模式下由 utils/auth.silentLogin 直接返回 mock 数据）
    auth.silentLogin().catch(() => {});
  },
};
</script>

<style>
/* ==========================================================================
   全局样式 + 主题 token（营地绿 · 升级版）
   色彩 / 圆角 / 阴影 / 间距 统一在这里定义，页面与组件只做组合，不各写一套
   ========================================================================== */
page {
  /* ---- 色彩 ---- */
  --primary: #2E7D32;          /* 主色 营地绿 */
  --primary-light: #4CAF50;    /* 浅主色 */
  --primary-lighter: #66BB6A;  /* 更浅主色（渐变/装饰） */
  --accent: #FF8F3F;           /* 强调色（价格/促销） */
  --bg: #F5F7F4;               /* 页面背景 */
  --card: #FFFFFF;             /* 卡片背景 */
  --text: #333333;             /* 主文本 */
  --text-sub: #666666;         /* 次级文本 */
  --muted: #999999;            /* 弱化文本 */
  --border: #EEF0EE;           /* 分隔线 */
  --chip-bg: #E8F5E9;          /* 浅绿标签底 */

  /* ---- 阴影（带主色倾向）---- */
  --shadow-card: 0 8rpx 24rpx rgba(46, 125, 50, 0.08);
  --shadow-hover: 0 12rpx 32rpx rgba(46, 125, 50, 0.14);

  /* ---- 圆角 ---- */
  --radius-card: 20rpx;
  --radius-btn: 16rpx;
  --radius-chip: 8rpx;
  --radius-img: 16rpx;

  background-color: var(--bg);
  color: var(--text);
  font-size: 28rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, sans-serif;
}

/* ---------- 布局容器 ---------- */
.container {
  padding: 24rpx;
  box-sizing: border-box;
  min-height: 100vh;
}

.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ---------- 卡片 ---------- */
.card {
  background: var(--card);
  border-radius: var(--radius-card);
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: var(--shadow-card);
}

.card-hover {
  box-shadow: var(--shadow-hover);
}

/* ---------- 标题 / 文本 ---------- */
.title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--text);
}

.section-title {
  position: relative;
  font-size: 30rpx;
  font-weight: 700;
  color: var(--text);
  padding-left: 18rpx;
  margin: 24rpx 0 20rpx;
}

/* 左侧竖线装饰 */
.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6rpx;
  height: 28rpx;
  border-radius: 3rpx;
  background: linear-gradient(180deg, var(--primary-lighter), var(--primary));
}

.muted {
  color: var(--muted);
  font-size: 24rpx;
}

.sub {
  color: var(--text-sub);
  font-size: 26rpx;
}

.price {
  color: var(--accent);
  font-weight: 700;
}

/* ---------- 分隔线 ---------- */
.divider {
  height: 1rpx;
  background: var(--border);
  margin: 20rpx 0;
}

/* ---------- 标签 chip ---------- */
.chip {
  display: inline-block;
  padding: 4rpx 14rpx;
  margin-right: 12rpx;
  border-radius: var(--radius-chip);
  font-size: 22rpx;
  line-height: 34rpx;
  background: #F1F3F0;
  color: var(--text-sub);
}

.chip-green {
  background: var(--chip-bg);
  color: var(--primary);
}

.chip-orange {
  background: #FFF3E0;
  color: var(--accent);
}

.chip-glass {
  background: rgba(255, 255, 255, 0.92);
  color: var(--primary);
  font-weight: 600;
}

/* ---------- 状态徽章 badge ---------- */
.badge {
  display: inline-block;
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  line-height: 32rpx;
  background: #F5F5F5;
  color: var(--muted);
}

.badge-orange { background: #FFF3E0; color: #FF8F3F; }  /* 待支付 */
.badge-blue   { background: #E3F2FD; color: #1976D2; }  /* 已支付 */
.badge-green  { background: #E8F5E9; color: #2E7D32; }  /* 已回收 / 已完成 */
.badge-primary{ background: #E8F5E9; color: #2E7D32; }  /* 配送中 / 布置中 / 使用中 */
.badge-gray   { background: #F5F5F5; color: #999999; }  /* 已取消 / 停用 */

/* ---------- 按钮 ---------- */
.btn-primary {
  background: linear-gradient(135deg, var(--primary-light), var(--primary));
  color: #ffffff;
  border-radius: var(--radius-btn);
  height: 88rpx;
  line-height: 88rpx;
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 20rpx rgba(46, 125, 50, 0.18);
}

button.btn-primary::after {
  border: none;
}

.btn-primary[disabled] {
  background: #CFCFCF;
  color: #ffffff;
  box-shadow: none;
}

.btn-ghost {
  background: #ffffff;
  color: var(--primary);
  border: 2rpx solid var(--primary);
  border-radius: var(--radius-btn);
  height: 88rpx;
  line-height: 88rpx;
  font-size: 30rpx;
  font-weight: 600;
}

/* 按压反馈（配合 hover-class="btn-hover" 使用） */
.btn-hover {
  opacity: 0.88;
  transform: scale(0.985);
}

/* ---------- 骨架屏 ---------- */
.skeleton {
  background: linear-gradient(90deg, #EDEFF0 25%, #F7F9F8 37%, #EDEFF0 63%);
  background-size: 400% 100%;
  border-radius: 12rpx;
  animation: sk-shimmer 1.4s ease-in-out infinite;
}

@keyframes sk-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

/* ---------- 空状态 ---------- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 24rpx;
}

.empty-illus {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72rpx;
  box-shadow: 0 8rpx 24rpx rgba(46, 125, 50, 0.1);
  margin-bottom: 28rpx;
}

.empty-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-sub);
}

.empty-desc {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: var(--muted);
}

.empty-btn {
  margin-top: 32rpx;
  padding: 0 40rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 36rpx;
  background: var(--primary);
  color: #ffffff;
  font-size: 26rpx;
}
</style>
