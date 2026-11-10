<template>
  <view class="container">
    <loading-skeleton v-if="loading" type="list" :count="2" />

    <block v-if="order">
      <!-- 状态头图 -->
      <view class="status-hero">
        <view class="row-between">
          <view class="sh-left">
            <view class="sh-status">{{ orderStatusText(order.orderStatus) }}</view>
            <view class="sh-tip">{{ statusTip }}</view>
          </view>
          <view class="sh-emoji">{{ statusEmoji }}</view>
        </view>
      </view>

      <!-- 天气提醒（使用日期当天） -->
      <view v-if="weather" class="card weather-card">
        <view class="row-between">
          <view class="w-left">
            <text class="w-emoji">{{ weatherEmoji }}</text>
            <text class="w-text">{{ weather.condition }} · {{ weather.temperature }}</text>
          </view>
        </view>
        <view class="w-tip">💡 {{ weather.tip }}</view>
      </view>

      <!-- 订单信息 -->
      <view class="card">
        <view class="section-title">订单信息</view>
        <view class="row-between info-row">
          <text class="sub">订单号</text>
          <text class="info-value">{{ order.orderId }}</text>
        </view>
        <view class="row-between info-row">
          <text class="sub">订单金额</text>
          <view class="info-amount">
            <text class="ia-symbol">¥</text>
            <text class="ia-num">{{ moneyText(order.amount) }}</text>
          </view>
        </view>
        <view class="row-between info-row" v-if="order.couponId">
          <text class="sub">优惠券抵扣</text>
          <text class="info-value coupon">已使用券 {{ order.couponId }}</text>
        </view>
        <view class="row-between info-row" v-if="order.pointsUsed">
          <text class="sub">积分抵现</text>
          <text class="info-value coupon">{{ order.pointsUsed }} 积分</text>
        </view>
        <view class="row-between info-row">
          <text class="sub">实付金额</text>
          <view class="info-amount">
            <text class="ia-symbol">¥</text>
            <text class="ia-num">{{ moneyText(order.payable || order.amount) }}</text>
          </view>
        </view>
        <view class="row-between info-row">
          <text class="sub">支付状态</text>
          <view :class="payStatusClass(order.payStatus)">{{ order.payStatus }}</view>
        </view>
        <view class="divider" />
        <view class="row-between info-row">
          <text class="sub">使用日期</text>
          <text class="info-value">{{ order.useDate }}</text>
        </view>
        <view class="row-between info-row">
          <text class="sub">租赁份数</text>
          <text class="info-value">{{ order.quantity }} 份</text>
        </view>
        <view class="row-between info-row">
          <text class="sub">下单时间</text>
          <text class="info-value">{{ formatDate(order.createTime) }}</text>
        </view>
      </view>

      <!-- 联系人 -->
      <view class="card">
        <view class="section-title">联系人</view>
        <view class="row-between info-row">
          <text class="sub">姓名</text>
          <text class="info-value">{{ order.contactName || '-' }}</text>
        </view>
        <view class="row-between info-row">
          <text class="sub">手机号</text>
          <text class="info-value">{{ order.contactPhone || '-' }}</text>
        </view>
      </view>

      <!-- 状态时间线（7 态，依据 track 返回的 currentIndex 高亮） -->
      <view v-if="steps.length > 0" class="card">
        <view class="section-title">状态进度</view>
        <order-timeline :steps="steps" :current-index="currentIndex" />
      </view>

      <!-- 出行前清单 & 装备搭建教程（主线一·1.3） -->
      <view v-if="packageDetail" class="card">
        <view class="section-title">🎒 出行清单 & 搭建指南</view>
        <view class="equip-row" v-for="(eq, idx) in packageDetail.equipRefs" :key="idx">
          <text class="eq-dot">⛺</text>
          <text class="eq-name">{{ eq.name || eq.equipmentId }} × {{ eq.qty }}</text>
        </view>
        <view class="setup-tip" v-if="packageDetail.setupTips">
          <text class="setup-label">搭建教程：</text>
          <text class="setup-text">{{ packageDetail.setupTips }}</text>
        </view>
      </view>

      <!-- 配送追踪入口（主线一·1.1） -->
      <button
        v-if="['已支付','配送中','布置中','使用中'].indexOf(order.orderStatus) > -1"
        class="btn-primary nav-btn"
        hover-class="btn-hover"
        @tap="onDeliveryTrack">🛵 查看配送进度 / 导航到营地</button>

      <button
        v-if="order.orderStatus === '已完成'"
        class="btn-primary review-btn"
        hover-class="btn-hover"
        @tap="onReview">提交评价</button>

      <!-- 操作区：改期 / 续租 / 取消 / 退款 -->
      <view class="action-bar">
        <button
          v-if="canReschedule"
          class="btn-ghost action-btn"
          hover-class="btn-ghost-hover"
          @tap="onReschedule">改期</button>
        <button
          v-if="canRenew"
          class="btn-ghost action-btn"
          hover-class="btn-ghost-hover"
          @tap="onRenew">续租1天</button>
        <button
          v-if="canCancel"
          class="btn-ghost action-btn"
          hover-class="btn-ghost-hover"
          @tap="onCancel">取消订单</button>
        <button
          v-if="canRefund"
          class="btn-primary action-btn"
          hover-class="btn-hover"
          @tap="onRefund">申请退款</button>
      </view>
    </block>

    <empty-state
      v-if="!loading && !order"
      emoji="📦"
      title="订单不存在"
      desc="订单可能已取消或已归档"
      btn-text="返回订单列表"
      @action="onBackList" />
  </view>
</template>

<script>
import orderService from '../../services/order';
import packageService from '../../services/package';
import weatherService from '../../services/weather';
import util from '../../utils/util';

export default {
  data() {
    return {
      orderId: '',
      order: null,
      steps: [],
      currentIndex: -1,
      loading: true,
      packageDetail: null,
      weather: null,
    };
  },

  computed: {
    canCancel() {
      return this.order && this.order.orderStatus === '待支付';
    },
    canRefund() {
      return this.order && this.order.orderStatus === '已支付' && this.order.payStatus === '已支付';
    },
    /** 已支付未配送可改期 */
    canReschedule() {
      return this.order && (this.order.orderStatus === '已支付' || this.order.orderStatus === '待支付');
    },
    /** 使用中可续租 */
    canRenew() {
      return this.order && this.order.orderStatus === '使用中';
    },
    statusEmoji() {
      const MAP = {
        待支付: '💰', 已支付: '✅', 配送中: '🚚', 布置中: '🔧',
        使用中: '🏕️', 已回收: '📦', 已完成: '🎉', 已取消: '🚫', 已退款: '💸',
      };
      return MAP[this.order && this.order.orderStatus] || '📋';
    },
    statusTip() {
      if (this.order && this.order.payStatus === '已退款') {
        return '订单已退款，款项将原路退回';
      }
      const MAP = {
        待支付: '请在有效期内完成支付',
        已支付: '已收款，等待营地配送',
        配送中: '装备正在送往营地',
        布置中: '工作人员正在搭建',
        使用中: '祝露营愉快',
        已回收: '装备已回收，等待结算',
        已完成: '订单已完成，欢迎评价',
        已取消: '订单已取消',
      };
      return MAP[this.order && this.order.orderStatus] || '';
    },
    weatherEmoji() {
      const MAP = { '晴': '☀️', '多云': '⛅', '小雨': '🌧️', '小雪': '🌨️' };
      return MAP[this.weather && this.weather.condition] || '🌤️';
    },
  },

  onLoad(options) {
    this.orderId = options.orderId || '';
    this.loadDetail();
  },

  methods: {
    loadDetail() {
      orderService.track(this.orderId).then((res) => {
        const d = res.data || {};
        this.order = d.order || null;
        this.steps = d.steps || [];
        this.currentIndex = typeof d.currentIndex === 'number' ? d.currentIndex : -1;
        this.loading = false;
        if (this.order) {
          this.loadPackage(this.order.packageId);
          this.loadWeather(this.order.useDate);
        }
      }).catch(() => {
        orderService.detail(this.orderId).then((r) => {
          this.order = r.data || null;
          this.loading = false;
          if (this.order) {
            this.loadPackage(this.order.packageId);
            this.loadWeather(this.order.useDate);
          }
        }).catch(() => { this.loading = false; });
      });
    },

    loadPackage(packageId) {
      // 已下架套餐（如 PKG003）拿不到详情，静默失败即可
      packageService.getPackage(packageId).then((r) => {
        this.packageDetail = r.data || null;
      }).catch(() => {});
    },

    loadWeather(date) {
      weatherService.get(date).then((r) => {
        this.weather = r.data || null;
      }).catch(() => {});
    },

    onReview() {
      uni.navigateTo({ url: `/pages/review/review?orderId=${this.orderId}` });
    },

    /** 主线一·1.1 跳转配送追踪页 */
    onDeliveryTrack() {
      uni.navigateTo({ url: `/pages/deliveryTrack/deliveryTrack?orderId=${this.orderId}` });
    },

    /** 主线一·1.2 改期 */
    onReschedule() {
      const today = util.formatDate(new Date());
      uni.showModal({
        title: '改期',
        editable: true,
        placeholderText: `输入新的使用日期，如 2026-11-15（今日 ${today}）`,
        success: (r) => {
          if (!r.confirm) return;
          const newDate = (r.content || '').trim();
          if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
            uni.showToast({ title: '日期格式应为 YYYY-MM-DD', icon: 'none' });
            return;
          }
          orderService.reschedule(this.orderId, newDate).then(() => {
            uni.showToast({ title: '改期成功', icon: 'success' });
            this.loadDetail();
          }).catch(() => {});
        },
      });
    },

    /** 主线一·1.2 续租 */
    onRenew() {
      uni.showModal({
        title: '续租 1 天',
        content: '将按套餐单价的 50% 加收费用，确定续租吗？',
        success: (r) => {
          if (!r.confirm) return;
          orderService.renew(this.orderId, 1).then((res) => {
            uni.showToast({ title: `已续租，+¥${(res.data.extra || 0).toFixed(2)}`, icon: 'success' });
            this.loadDetail();
          }).catch(() => {});
        },
      });
    },

    onCancel() {
      const status = (this.order && this.order.orderStatus) || '';
      // 按状态给不同的取消提示，讲法与业务规则一致
      let content = '确定取消该订单吗？取消后不可恢复。';
      if (status === '待支付') {
        content = '订单尚未支付，取消后订单关闭，无需退款。确定取消吗？';
      } else if (status === '已支付') {
        content = '订单已付款但尚未派车，取消后全额退款。确定取消吗？';
      } else if (status === '配送中') {
        content = '装备已装车出发，取消将扣除配送费（约订单金额的 20%）。确定取消吗？';
      } else if (status === '布置中') {
        content = '装备已到场布置，取消将扣除已发生的人工与物料费用（约 50%）。确定取消吗？';
      }
      uni.showModal({
        title: '取消订单',
        content,
        confirmColor: '#E53935',
        success: (res) => {
          if (!res.confirm) return;
          uni.showLoading({ title: '取消中...', mask: true });
          orderService.cancel(this.orderId)
            .then(() => {
              uni.hideLoading();
              uni.showToast({ title: '订单已取消', icon: 'success' });
              this.loadDetail();
            })
            .catch(() => { uni.hideLoading(); this.loadDetail(); });
        },
      });
    },

    onRefund() {
      uni.showModal({
        title: '申请退款',
        content: '确定对该订单申请退款吗？款项将原路退回。',
        confirmColor: '#E53935',
        success: (res) => {
          if (!res.confirm) return;
          uni.showLoading({ title: '退款中...', mask: true });
          orderService.refund(this.orderId)
            .then(() => {
              uni.hideLoading();
              uni.showToast({ title: '已提交退款', icon: 'success' });
              this.loadDetail();
            })
            .catch(() => { uni.hideLoading(); this.loadDetail(); });
        },
      });
    },

    onBackList() {
      uni.switchTab({ url: '/pages/orderList/orderList' });
    },

    moneyText(amount) {
      return (Number(amount) || 0).toFixed(2);
    },

    formatMoney: util.formatMoney,
    orderStatusText: util.orderStatusText,
    orderStatusClass: util.orderStatusClass,
    payStatusClass: util.payStatusClass,
    formatDate: util.formatDate,
  },
};
</script>

<style scoped>
.status-hero {
  background: linear-gradient(135deg, #2E7D32 0%, #66BB6A 100%);
  border-radius: 20rpx;
  padding: 36rpx 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 12rpx 32rpx rgba(46, 125, 50, 0.18);
}
.sh-left { flex: 1; }
.sh-status { color: #fff; font-size: 40rpx; font-weight: 700; line-height: 52rpx; }
.sh-tip { margin-top: 8rpx; color: rgba(255,255,255,0.85); font-size: 24rpx; }
.sh-emoji { font-size: 64rpx; line-height: 72rpx; }

.weather-card { background: #F0F7FF; border: 1rpx solid #D6E8FF; }
.w-left { display: flex; align-items: center; }
.w-emoji { font-size: 32rpx; margin-right: 12rpx; }
.w-text { font-size: 26rpx; color: #1976D2; font-weight: 600; }
.w-tip { margin-top: 12rpx; font-size: 24rpx; color: #555; line-height: 36rpx; }

.info-row { min-height: 56rpx; }
.info-value { font-size: 26rpx; color: #333; }
.info-value.coupon { color: #FF8F3F; }
.info-amount { display: flex; align-items: baseline; color: #FF8F3F; }
.ia-symbol { font-size: 22rpx; font-weight: 700; margin-right: 2rpx; }
.ia-num { font-size: 32rpx; font-weight: 700; }

.equip-row {
  display: flex; align-items: center;
  padding: 10rpx 0;
}
.eq-dot { font-size: 26rpx; margin-right: 12rpx; }
.eq-name { font-size: 26rpx; color: #444; }
.setup-tip {
  margin-top: 16rpx; padding: 16rpx;
  background: #F7F9F8; border-radius: 12rpx;
}
.setup-label { font-size: 24rpx; color: #2E7D32; font-weight: 700; }
.setup-text { font-size: 24rpx; color: #555; line-height: 36rpx; }

.review-btn, .nav-btn { margin-top: 24rpx; }
.action-bar { display: flex; gap: 20rpx; margin-top: 24rpx; flex-wrap: wrap; }
.action-btn { flex: 1; min-width: 200rpx; height: 84rpx; line-height: 84rpx; border-radius: 42rpx; font-size: 28rpx; font-weight: 600; margin: 0; padding: 0; }
.btn-ghost { background: #fff; color: #E53935; border: 2rpx solid #E53935; }
.btn-ghost-hover { background: #FDECEA; }
</style>
