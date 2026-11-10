<template>
  <view class="pkg-card" hover-class="pkg-card-hover" :hover-stay-time="80" @tap="onTap">
    <!-- 顶部图片区（bannerUrl 接入后自动替换为真图，当前用季节渐变 + emoji 占位） -->
    <view class="pkg-cover" :style="coverStyle">
      <image v-if="pkg.bannerUrl" class="pkg-cover-img" :src="pkg.bannerUrl" mode="aspectFill" />
      <block v-else>
        <text class="pkg-cover-emoji">{{ coverEmoji }}</text>
        <text class="pkg-cover-slogan">{{ pkg.name }}</text>
      </block>
      <view class="pkg-cover-tag chip chip-glass">{{ seasonLabel }}</view>
    </view>

    <view class="pkg-body">
      <view class="pkg-name">{{ pkg.name }}</view>

      <view v-if="equipTags.length > 0" class="pkg-tags">
        <text v-for="(t, i) in equipTags" :key="i" class="chip chip-green">{{ t }}</text>
      </view>

      <view class="pkg-foot">
        <view class="pkg-price">
          <text class="pkg-price-symbol">¥</text>
          <text class="pkg-price-num">{{ priceText }}</text>
          <text class="pkg-price-unit">/份</text>
        </view>
        <view class="pkg-btn">立即预订</view>
      </view>
    </view>
  </view>
</template>

<script>
import util from '../../utils/util';

export default {
  name: 'PackageCard',
  props: {
    pkg: { type: Object, default: () => ({}) },
  },
  computed: {
    /** 封面渐变背景（季节主题决定，bannerUrl 为空时的占位视觉） */
    coverStyle() {
      return `background: ${util.seasonGradient(this.pkg.seasonTheme)};`;
    },
    /** 封面装饰 emoji */
    coverEmoji() {
      return util.seasonEmoji(this.pkg.seasonTheme);
    },
    /** 右上角季节主题标签 */
    seasonLabel() {
      return this.pkg.seasonTheme ? `${this.pkg.seasonTheme}主题` : '精选';
    },
    /** 装备标签 chips（由 items 拆出，最多 4 个） */
    equipTags() {
      const items = (this.pkg && this.pkg.items) || '';
      return items
        .split(/[,，|、]/)
        .map((s) => String(s).trim())
        .filter(Boolean)
        .slice(0, 4);
    },
    /** 价格文本（整数不带小数，保留两位仅当非整数） */
    priceText() {
      const n = Number(this.pkg.price) || 0;
      return Number.isInteger(n) ? String(n) : n.toFixed(2);
    },
  },
  methods: {
    onTap() {
      this.$emit('select', { packageId: this.pkg.packageId });
    },
  },
};
</script>

<style scoped>
.pkg-card {
  background: #ffffff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(46, 125, 50, 0.08);
  transition: all 0.18s ease;
}

.pkg-card-hover {
  box-shadow: 0 12rpx 32rpx rgba(46, 125, 50, 0.14);
  transform: scale(0.99);
}

/* ---- 顶部图片区 ---- */
.pkg-cover {
  position: relative;
  height: 180rpx;
  border-radius: 16rpx;
  margin: 12rpx 12rpx 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.pkg-cover-img {
  width: 100%;
  height: 180rpx;
  border-radius: 16rpx;
}

.pkg-cover-emoji {
  font-size: 64rpx;
  line-height: 72rpx;
}

.pkg-cover-slogan {
  margin-top: 6rpx;
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 600;
  text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.18);
}

.pkg-cover-tag {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  margin-right: 0;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.12);
}

/* ---- 内容区 ---- */
.pkg-body {
  padding: 24rpx 28rpx 28rpx;
}

.pkg-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #333333;
  line-height: 44rpx;
}

.pkg-tags {
  margin-top: 16rpx;
}

/* ---- 底部价格 + 按钮 ---- */
.pkg-foot {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #EEF0EE;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.pkg-price {
  display: flex;
  align-items: baseline;
  color: #FF8F3F;
}

.pkg-price-symbol {
  font-size: 24rpx;
  font-weight: 700;
  margin-right: 2rpx;
}

.pkg-price-num {
  font-size: 40rpx;
  font-weight: 700;
  line-height: 40rpx;
}

.pkg-price-unit {
  margin-left: 6rpx;
  font-size: 22rpx;
  color: #999999;
  font-weight: 400;
}

.pkg-btn {
  padding: 0 28rpx;
  height: 64rpx;
  line-height: 64rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 600;
  box-shadow: 0 6rpx 16rpx rgba(46, 125, 50, 0.22);
}
</style>
