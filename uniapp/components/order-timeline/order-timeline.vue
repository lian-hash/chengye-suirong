<template>
  <view class="timeline">
    <view
      v-for="(step, index) in steps"
      :key="index"
      class="tl-item"
      :class="{ done: index < computedIndex, active: index === computedIndex }">
      <!-- 轴向圆点 + 连接线 -->
      <view class="tl-dot">{{ index < computedIndex ? '✓' : index + 1 }}</view>
      <view v-if="index < steps.length - 1" class="tl-line" />

      <view class="tl-content">
        <text class="tl-text">{{ step }}</text>
        <text v-if="index === computedIndex" class="tl-current">当前状态</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'OrderTimeline',
  props: {
    steps: { type: Array, default: () => [] }, // 7 态顺序数组
    current: { type: String, default: '' }, // 兼容旧用法：当前态文案
    currentIndex: { type: Number, default: -1 }, // 当前态索引（order/track 返回）
  },
  data() {
    return {
      computedIndex: -1,
    };
  },
  watch: {
    steps: 'recompute',
    current: 'recompute',
    currentIndex: 'recompute',
  },
  created() {
    this.recompute();
  },
  methods: {
    recompute() {
      let idx = typeof this.currentIndex === 'number' ? this.currentIndex : -1;
      if ((idx === undefined || idx < 0) && this.current && this.steps) {
        idx = this.steps.indexOf(this.current);
      }
      this.computedIndex = idx;
    },
  },
};
</script>

<style scoped>
.timeline {
  padding: 8rpx 0 4rpx;
}

.tl-item {
  position: relative;
  min-height: 84rpx;
  padding-left: 56rpx;
  box-sizing: border-box;
}

.tl-dot {
  position: absolute;
  left: 0;
  top: 4rpx;
  width: 36rpx;
  height: 36rpx;
  line-height: 36rpx;
  text-align: center;
  border-radius: 50%;
  background: #E3E6E3;
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 600;
}

.tl-line {
  position: absolute;
  left: 17rpx;
  top: 46rpx;
  bottom: -8rpx;
  width: 2rpx;
  background: #EEF0EE;
}

.tl-item.done .tl-line {
  background: #66BB6A;
}

.tl-item.done .tl-dot {
  background: #66BB6A;
  font-size: 20rpx;
}

.tl-item.active .tl-dot {
  background: #2E7D32;
  font-weight: 700;
  box-shadow: 0 0 0 6rpx rgba(46, 125, 50, 0.14);
}

.tl-content {
  display: flex;
  flex-direction: column;
  padding-top: 2rpx;
}

.tl-text {
  font-size: 26rpx;
  color: #999999;
  line-height: 38rpx;
}

.tl-item.done .tl-text {
  color: #666666;
}

.tl-item.active .tl-text {
  color: #2E7D32;
  font-weight: 700;
  font-size: 28rpx;
}

.tl-current {
  margin-top: 4rpx;
  align-self: flex-start;
  font-size: 20rpx;
  color: #2E7D32;
  background: #E8F5E9;
  border-radius: 8rpx;
  padding: 2rpx 10rpx;
  line-height: 28rpx;
}
</style>
