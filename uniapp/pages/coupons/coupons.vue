<template>
  <view class="container">
    <view class="section-title">我的券包</view>
    <view v-if="myList.length === 0" class="empty-card">
      <text class="empty-emoji">🎫</text>
      <text class="empty-text">还没领到券，去下面领一张吧</text>
    </view>

    <view class="coupon-card" v-for="c in myList" :key="c.couponId">
      <view class="coupon-left">
        <view class="c-amount">¥{{ c.value }}</view>
        <view class="c-threshold" v-if="c.threshold">满 {{ c.threshold }} 可用</view>
        <view class="c-threshold" v-else>无门槛</view>
      </view>
      <view class="coupon-mid">
        <view class="c-name">{{ c.name }}</view>
        <view class="c-desc">{{ c.desc }}</view>
        <view class="c-expire">有效期至 {{ c.validTo }}</view>
      </view>
      <view class="coupon-right">
        <view class="c-status" :class="c.status === '已使用' ? 'used' : 'unused'">{{ c.status }}</view>
      </view>
    </view>

    <view class="section-title available-title">可领取</view>
    <view v-if="availableList.length === 0" class="empty-card">
      <text class="empty-emoji">🎉</text>
      <text class="empty-text">优惠券都被你领完啦</text>
    </view>

    <view class="coupon-card available" v-for="c in availableList" :key="c.couponId">
      <view class="coupon-left">
        <view class="c-amount">¥{{ c.value }}</view>
        <view class="c-threshold" v-if="c.threshold">满 {{ c.threshold }} 可用</view>
        <view class="c-threshold" v-else>无门槛</view>
      </view>
      <view class="coupon-mid">
        <view class="c-name">{{ c.name }}</view>
        <view class="c-desc">{{ c.desc }}</view>
        <view class="c-expire">有效期至 {{ c.validTo }}</view>
      </view>
      <view class="coupon-right">
        <button class="claim-btn" size="mini" @tap="onClaim(c)">领取</button>
      </view>
    </view>
  </view>
</template>

<script>
import couponService from '../../services/coupon';

export default {
  data() {
    return {
      myList: [],
      availableList: [],
    };
  },
  onLoad() { this.loadAll(); },
  onShow() { if (this.myList.length) this.loadAll(); },
  methods: {
    loadAll() {
      couponService.my().then((r) => { this.myList = r.data.list || []; }).catch(() => {});
      couponService.listAvailable().then((r) => { this.availableList = r.data.list || []; }).catch(() => {});
    },
    onClaim(c) {
      couponService.claim(c.couponId).then(() => {
        uni.showToast({ title: '领取成功', icon: 'success' });
        this.loadAll();
      }).catch(() => {});
    },
  },
};
</script>

<style scoped>
.available-title { margin-top: 32rpx; }
.empty-card {
  background: #fff; border-radius: 16rpx; padding: 60rpx 24rpx;
  display: flex; flex-direction: column; align-items: center;
}
.empty-emoji { font-size: 60rpx; }
.empty-text { margin-top: 16rpx; font-size: 26rpx; color: #999; }

.coupon-card {
  background: #fff; border-radius: 16rpx; padding: 24rpx;
  margin-bottom: 16rpx; display: flex; align-items: center;
  border-left: 8rpx solid #FF8F3F;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.04);
}
.coupon-card.available { border-left-color: #2E7D32; }
.coupon-left {
  width: 160rpx; text-align: center;
  border-right: 1rpx dashed #DDD; padding-right: 20rpx;
}
.c-amount { font-size: 44rpx; font-weight: 800; color: #FF8F3F; }
.coupon-card.available .c-amount { color: #2E7D32; }
.c-threshold { font-size: 20rpx; color: #999; margin-top: 6rpx; }
.coupon-mid { flex: 1; margin-left: 20rpx; }
.c-name { font-size: 28rpx; font-weight: 700; color: #333; }
.c-desc { font-size: 22rpx; color: #888; margin-top: 6rpx; }
.c-expire { font-size: 20rpx; color: #BBB; margin-top: 6rpx; }
.coupon-right { margin-left: 16rpx; }
.c-status {
  font-size: 22rpx; padding: 6rpx 16rpx; border-radius: 20rpx;
}
.c-status.unused { background: #FFF3E0; color: #FF8F00; }
.c-status.used { background: #F5F5F5; color: #999; }
.claim-btn { margin: 0; background: #2E7D32; color: #fff; font-size: 22rpx; }
</style>
