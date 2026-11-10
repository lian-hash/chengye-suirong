<template>
  <view class="container">
    <view class="page-head">
      <view class="title">我的订单</view>
      <view class="sub">共 {{ orders.length }} 条订单记录</view>
    </view>

    <loading-skeleton v-if="loading" type="list" :count="3" />

    <view
      v-for="o in orders"
      :key="o.orderId"
      class="card order-card"
      hover-class="order-card-hover"
      :hover-stay-time="80"
      @tap="onTapOrder"
      :data-id="o.orderId">
      <view class="row-between">
        <view class="title ol-name">{{ o.packageId }}</view>
        <view :class="orderStatusClass(o.orderStatus)">{{ orderStatusText(o.orderStatus) }}</view>
      </view>

      <view class="sub ol-meta">使用日期 {{ o.useDate }} · 份数 {{ o.quantity }}</view>

      <view class="divider" />

      <view class="row-between ol-foot">
        <view class="ol-amount">
          <text class="ol-symbol">¥</text>
          <text class="ol-num">{{ moneyText(o.amount) }}</text>
        </view>
        <view class="ol-detail">查看详情 ›</view>
      </view>
    </view>

    <empty-state
      v-if="!loading && orders.length === 0"
      emoji="🧾"
      title="暂无订单"
      desc="去首页挑一个心动的套餐吧"
      btn-text="去逛逛"
      @action="onGoHome" />
  </view>
</template>

<script>
import orderService from '../../services/order';
import util from '../../utils/util';

export default {
  data() {
    return {
      orders: [],
      loading: true,
    };
  },

  onShow() {
    this.loadData();
  },

  methods: {
    loadData() {
      orderService.list().then((res) => {
        this.orders = res.data.list || [];
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },

    onTapOrder(e) {
      const orderId = e.currentTarget.dataset.id;
      uni.navigateTo({ url: `/pages/orderDetail/orderDetail?orderId=${orderId}` });
    },

    onGoHome() {
      uni.switchTab({ url: '/pages/index/index' });
    },

    /** 金额文本（不含货币符号） */
    moneyText(amount) {
      return (Number(amount) || 0).toFixed(2);
    },

    orderStatusText: util.orderStatusText,
    orderStatusClass: util.orderStatusClass,
  },
};
</script>

<style scoped>
.page-head {
  padding: 8rpx 4rpx 20rpx;
}

.page-head .sub {
  margin-top: 8rpx;
  line-height: 38rpx;
}

.order-card {
  transition: all 0.18s ease;
}

.order-card-hover {
  box-shadow: 0 12rpx 32rpx rgba(46, 125, 50, 0.14);
  transform: scale(0.99);
}

.ol-name {
  flex: 1;
  line-height: 44rpx;
}

.ol-meta {
  margin-top: 10rpx;
  line-height: 38rpx;
}

.ol-foot {
  align-items: flex-end;
}

.ol-amount {
  display: flex;
  align-items: baseline;
  color: #FF8F3F;
}

.ol-symbol {
  font-size: 24rpx;
  font-weight: 700;
  margin-right: 2rpx;
}

.ol-num {
  font-size: 38rpx;
  font-weight: 700;
  line-height: 40rpx;
}

.ol-detail {
  font-size: 24rpx;
  color: #999999;
}
</style>
