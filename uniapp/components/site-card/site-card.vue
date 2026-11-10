<template>
  <view class="site-card" hover-class="site-card-hover" :hover-stay-time="80" @tap="onTap">
    <view class="site-icon">{{ site.availableStatus === '可用' ? '🏕️' : '🚧' }}</view>

    <view class="site-main">
      <view class="site-name">{{ site.name }}</view>
      <view class="site-addr">{{ site.address }}</view>
      <view class="site-meta">
        <text class="site-meta-item">容量 {{ site.capacity }} 人</text>
        <text v-if="site.partner" class="site-meta-item">合作方 {{ site.partner }}</text>
      </view>
    </view>

    <view :class="statusClass">{{ site.availableStatus }}</view>
  </view>
</template>

<script>
import util from '../../utils/util';

export default {
  name: 'SiteCard',
  props: {
    site: { type: Object, default: () => ({}) },
  },
  computed: {
    /** 可用=绿底，停用=灰底 */
    statusClass() {
      return util.siteStatusClass(this.site.availableStatus);
    },
  },
  methods: {
    onTap() {
      this.$emit('select', { siteId: this.site.siteId });
    },
  },
};
</script>

<style scoped>
.site-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(46, 125, 50, 0.08);
  display: flex;
  align-items: flex-start;
  transition: all 0.18s ease;
}

.site-card-hover {
  box-shadow: 0 12rpx 32rpx rgba(46, 125, 50, 0.14);
  transform: scale(0.99);
}

.site-icon {
  width: 80rpx;
  height: 80rpx;
  margin-right: 20rpx;
  border-radius: 16rpx;
  background: #E8F5E9;
  font-size: 40rpx;
  line-height: 80rpx;
  text-align: center;
  flex-shrink: 0;
}

.site-main {
  flex: 1;
  min-width: 0;
}

.site-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #333333;
  line-height: 42rpx;
}

.site-addr {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #999999;
  line-height: 34rpx;
}

.site-meta {
  margin-top: 12rpx;
  display: flex;
  flex-wrap: wrap;
}

.site-meta-item {
  font-size: 22rpx;
  color: #666666;
  background: #F1F3F0;
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
  margin-right: 12rpx;
  line-height: 32rpx;
}
</style>
