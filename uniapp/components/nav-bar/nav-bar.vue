<template>
  <view class="nav-bar">
    <view v-if="showBack" class="nav-back" @tap="onBack">‹</view>
    <view class="nav-title">{{ title }}</view>
  </view>
</template>

<script>
export default {
  name: 'NavBar',
  props: {
    title: { type: String, default: '' },
    showBack: { type: Boolean, default: false },
  },
  methods: {
    onBack() {
      this.$emit('back');
    },
  },
};
</script>

<style scoped>
.nav-bar {
  display: flex;
  align-items: center;
  height: 88rpx;
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  color: #ffffff;
  padding: 0 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(46, 125, 50, 0.18);
}

.nav-back {
  font-size: 48rpx;
  margin-right: 12rpx;
  line-height: 48rpx;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}
</style>
