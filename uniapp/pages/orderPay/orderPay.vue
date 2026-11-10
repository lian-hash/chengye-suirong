<template>
  <view class="container">
    <loading-skeleton v-if="!order" type="list" :count="2" />

    <block v-if="order">
      <!-- 金额主卡 -->
      <view class="pay-hero">
        <view class="pay-hero-label">应付金额</view>
        <view class="pay-hero-price">
          <text class="ph-symbol">¥</text>
          <text class="ph-num">{{ amountText }}</text>
        </view>
        <view class="pay-hero-order">订单号 {{ order.orderId }}</view>
      </view>

      <view class="card">
        <view class="row-between info-row">
          <text class="sub">订单状态</text>
          <view :class="orderStatusClass(order.orderStatus)">{{ orderStatusText(order.orderStatus) }}</view>
        </view>
        <view class="divider" />
        <view class="row-between info-row">
          <text class="sub">支付状态</text>
          <view :class="payStatusClass(order.payStatus)">{{ order.payStatus }}</view>
        </view>
      </view>

      <view class="card notice-card">
        <view class="notice-title">模拟支付说明</view>
        <view class="sub notice-text">
          当前为模拟支付（payMethod: MOCK），参数结构对齐微信支付，
          后续切换正式环境只需替换支付方式，无需改动业务代码。
        </view>
      </view>

      <button class="btn-primary pay-btn" hover-class="btn-hover" :loading="paying" @tap="onPay">确认支付</button>
    </block>
  </view>
</template>

<script>
import orderService from '../../services/order';
import util from '../../utils/util';

export default {
  data() {
    return {
      orderId: '',
      order: null,
      paying: false,
    };
  },

  computed: {
    /** 金额文本（不含货币符号） */
    amountText() {
      return (Number(this.order && this.order.amount) || 0).toFixed(2);
    },
  },

  onLoad(options) {
    const orderId = options.orderId || '';
    this.orderId = orderId;
    this.loadDetail();
  },

  methods: {
    loadDetail() {
      orderService.detail(this.orderId).then((res) => {
        this.order = res.data || null;
      }).catch(() => {});
    },

    onPay() {
      this.paying = true;
      // 模拟支付（payMethod: MOCK，接口结构对齐微信支付）
      orderService.pay({ orderId: this.orderId, payMethod: 'MOCK' }).then(() => {
        uni.showToast({ title: '支付成功', icon: 'success' });
        setTimeout(() => {
          uni.switchTab({ url: '/pages/orderList/orderList' });
        }, 800);
      }).catch(() => {
        this.paying = false;
      });
    },

    orderStatusText: util.orderStatusText,
    orderStatusClass: util.orderStatusClass,
    payStatusClass: util.payStatusClass,
  },
};
</script>

<style scoped>
.pay-hero {
  background: linear-gradient(135deg, #2E7D32 0%, #66BB6A 100%);
  border-radius: 20rpx;
  padding: 44rpx 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 12rpx 32rpx rgba(46, 125, 50, 0.18);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pay-hero-label {
  color: rgba(255, 255, 255, 0.88);
  font-size: 26rpx;
}

.pay-hero-price {
  margin-top: 16rpx;
  display: flex;
  align-items: baseline;
  color: #ffffff;
}

.ph-symbol {
  font-size: 28rpx;
  font-weight: 700;
  margin-right: 4rpx;
}

.ph-num {
  font-size: 72rpx;
  font-weight: 700;
  line-height: 76rpx;
}

.pay-hero-order {
  margin-top: 18rpx;
  color: rgba(255, 255, 255, 0.82);
  font-size: 22rpx;
}

.info-row {
  min-height: 48rpx;
}

.notice-card {
  background: #FFF8F1;
}

.notice-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #FF8F3F;
  margin-bottom: 10rpx;
}

.notice-text {
  line-height: 40rpx;
}

.pay-btn {
  margin-top: 24rpx;
}
</style>
