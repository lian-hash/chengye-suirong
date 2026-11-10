<template>
  <view class="container">
    <loading-skeleton v-if="!pkg && !site" type="list" :count="2" />

    <block v-if="pkg">
      <view class="section-title">套餐信息</view>
      <view class="card">
        <view class="row-between">
          <view class="title oc-name">{{ pkg.name }}</view>
          <view class="price oc-price">{{ formatMoney(pkg.price) }} / 份</view>
        </view>
        <view class="sub oc-sub">{{ pkg.seasonTheme }}主题 · {{ pkg.items }}</view>
      </view>
    </block>

    <block v-if="site">
      <view class="section-title">场地信息</view>
      <view class="card">
        <view class="row-between">
          <view class="title oc-name">{{ site.name }}</view>
          <view :class="siteStatusClass(site.availableStatus)">{{ site.availableStatus }}</view>
        </view>
        <view class="sub oc-sub">{{ site.address }}</view>
      </view>
    </block>

    <view class="section-title">预约信息</view>
    <view class="card">
      <picker class="date-picker" mode="date" :value="useDate" @change="onDateChange">
        <view class="field-row">
          <text class="field-label">使用日期</text>
          <view class="field-value">
            <text :class="useDate ? 'fv-text' : 'fv-placeholder'">{{ useDate || '请选择使用日期' }}</text>
            <text class="field-arrow">›</text>
          </view>
        </view>
      </picker>

      <view class="divider" />

      <view class="field-row">
        <text class="field-label">租赁份数</text>
        <view class="stepper">
          <view class="step-btn" :class="{ disabled: quantity <= 1 }" hover-class="btn-hover" @tap="onQtyMinus">-</view>
          <view class="step-num">{{ quantity }}</view>
          <view class="step-btn" hover-class="btn-hover" @tap="onQtyPlus">+</view>
        </view>
      </view>

      <view class="divider" />

      <view class="field-row">
        <text class="field-label">联系人</text>
        <input class="field-input" placeholder="请输入联系人姓名" :value="contactName" @input="onInputName" />
      </view>

      <view class="divider" />

      <view class="field-row">
        <text class="field-label">手机号</text>
        <input class="field-input" type="number" maxlength="11" placeholder="请输入联系人手机号" :value="contactPhone" @input="onInputPhone" />
      </view>
    </view>

    <!-- 主线三·3.1 优惠券选择 -->
    <view class="section-title">优惠</view>
    <view class="card">
      <picker :range="couponTitles" :value="couponIndex" @change="onCouponChange">
        <view class="field-row">
          <text class="field-label">🎫 优惠券</text>
          <view class="field-value">
            <text :class="couponIndex > 0 ? 'fv-text coupon' : 'fv-placeholder'">{{ couponTitles[couponIndex] || '不使用' }}</text>
            <text class="field-arrow">›</text>
          </view>
        </view>
      </picker>

      <view class="divider" />

      <!-- 主线三·3.2 积分抵现 -->
      <view class="field-row">
        <text class="field-label">⭐ 积分抵现 ({{ pointsBalance }} 可用)</text>
        <view class="field-value">
          <switch :checked="usePoints" color="#2E7D32" @change="onPointsSwitch" />
        </view>
      </view>
      <view class="points-tip" v-if="usePoints">
        将使用 {{ maxPointsToUse }} 积分，抵现 ¥{{ (maxPointsToUse * 0.01).toFixed(2) }}
      </view>
    </view>

    <!-- 费用合计 -->
    <view class="card total-card">
      <view class="row-between">
        <text class="sub">商品总额</text>
        <text class="sub">¥ {{ (totalAmount).toFixed(2) }}</text>
      </view>
      <view class="row-between" v-if="selectedCoupon">
        <text class="sub">优惠券</text>
        <text class="minus">-¥{{ selectedCoupon.value }}</text>
      </view>
      <view class="row-between" v-if="usePoints && pointsToUse > 0">
        <text class="sub">积分抵现</text>
        <text class="minus">-¥{{ (pointsToUse * 0.01).toFixed(2) }}</text>
      </view>
      <view class="row-between" style="margin-top: 16rpx;">
        <text class="sub">实付</text>
        <view class="total-price">
          <text class="total-symbol">¥</text>
          <text class="total-num">{{ payableText }}</text>
        </view>
      </view>
      <view class="muted total-tip">实际金额以提交后云函数计算结果为准</view>
    </view>

    <button class="btn-primary submit-btn" hover-class="btn-hover" :loading="submitting" @tap="onSubmit">提交订单</button>
  </view>
</template>

<script>
import packageService from '../../services/package';
import orderService from '../../services/order';
import couponService from '../../services/coupon';
import pointsService from '../../services/points';
import util from '../../utils/util';

export default {
  data() {
    return {
      packageId: '',
      siteId: '',
      pkg: null,
      site: null,
      useDate: '',
      quantity: 1,
      contactName: '',
      contactPhone: '',
      submitting: false,
      // 券
      myCoupons: [],
      couponIndex: 0,
      // 积分
      pointsBalance: 0,
      usePoints: false,
    };
  },

  computed: {
    totalAmount() {
      const price = Number(this.pkg && this.pkg.price) || 0;
      return price * this.quantity;
    },
    couponTitles() {
      const arr = ['不使用'];
      this.myCoupons.forEach((c) => {
        arr.push(`${c.name}（¥${c.value}${c.threshold ? ' 满' + c.threshold : ''}）`);
      });
      return arr;
    },
    selectedCoupon() {
      if (this.couponIndex === 0) return null;
      return this.myCoupons[this.couponIndex - 1] || null;
    },
    /** 本单最多可抵积分：商品金额 10% */
    maxPointsToUse() {
      return Math.floor(this.totalAmount * 0.1 / 0.01);
    },
    pointsToUse() {
      if (!this.usePoints) return 0;
      return Math.min(this.pointsBalance, this.maxPointsToUse);
    },
    payableText() {
      let amount = this.totalAmount;
      if (this.selectedCoupon && amount >= this.selectedCoupon.threshold) {
        amount -= this.selectedCoupon.value;
      }
      amount -= this.pointsToUse * 0.01;
      return Math.max(0, amount.toFixed(2));
    },
  },

  onLoad(options) {
    const { packageId, siteId } = options;
    this.packageId = packageId || '';
    this.siteId = siteId || '';
    this.loadMeta();
    this.loadExtras();
  },

  methods: {
    loadMeta() {
      packageService.getPackage(this.packageId).then((res) => {
        this.pkg = res.data || null;
      }).catch(() => {});
      packageService.listPackages().then((res) => {
        const site = (res.data.sites || []).find((s) => s.siteId === this.siteId);
        this.site = site || null;
      }).catch(() => {});
    },
    loadExtras() {
      couponService.my().then((r) => {
        // 只允许未使用的券
        this.myCoupons = (r.data.list || []).filter((c) => c.status === '未使用');
      }).catch(() => {});
      pointsService.get().then((r) => {
        this.pointsBalance = (r.data && r.data.points) || 0;
      }).catch(() => {});
    },

    onDateChange(e) { this.useDate = e.detail.value; },
    onQtyMinus() { if (this.quantity > 1) this.quantity -= 1; },
    onQtyPlus() { this.quantity += 1; },
    onInputName(e) { this.contactName = e.detail.value; },
    onInputPhone(e) { this.contactPhone = e.detail.value; },

    onCouponChange(e) { this.couponIndex = Number(e.detail.value); },
    onPointsSwitch(e) { this.usePoints = !!e.detail.value; },

    onSubmit() {
      const { packageId, siteId, useDate, quantity, contactName, contactPhone } = this;
      if (!useDate) {
        uni.showToast({ title: '请选择使用日期', icon: 'none' });
        return;
      }
      this.submitting = true;
      orderService.create({
        packageId, siteId, useDate, quantity,
        contactName, contactPhone, isBatch: false,
        couponId: this.selectedCoupon ? this.selectedCoupon.couponId : '',
        pointsUsed: this.pointsToUse,
      }).then((res) => {
        const orderId = res.data.orderId;
        uni.redirectTo({ url: `/pages/orderPay/orderPay?orderId=${orderId}` });
      }).catch(() => {
        this.submitting = false;
      });
    },

    formatMoney: util.formatMoney,
    siteStatusClass: util.siteStatusClass,
  },
};
</script>

<style scoped>
.oc-name { flex: 1; line-height: 44rpx; }
.oc-price { font-size: 28rpx; }
.oc-sub { margin-top: 10rpx; line-height: 38rpx; }

.date-picker { display: block; width: 100%; }
.field-row {
  display: flex; align-items: center; justify-content: space-between; padding: 6rpx 0;
}
.field-label { font-size: 28rpx; color: #333; font-weight: 600; flex-shrink: 0; }
.field-value { display: flex; align-items: center; }
.fv-text { font-size: 28rpx; color: #333; }
.fv-text.coupon { color: #FF8F3F; font-weight: 600; }
.fv-placeholder { font-size: 28rpx; color: #999; }
.field-arrow { margin-left: 8rpx; font-size: 34rpx; color: #C4CAC4; }
.field-input { flex: 1; text-align: right; font-size: 28rpx; color: #333; padding: 6rpx 0; }

.points-tip { font-size: 22rpx; color: #FF8F00; margin-top: 8rpx; }

.stepper { display: flex; align-items: center; }
.step-btn {
  width: 56rpx; height: 56rpx; line-height: 52rpx; text-align: center;
  background: #E8F5E9; color: #2E7D32; border-radius: 50%;
  font-size: 34rpx; font-weight: 700;
}
.step-btn.disabled { background: #F1F3F0; color: #C4CAC4; }
.step-num { margin: 0 28rpx; font-size: 32rpx; font-weight: 700; color: #333; min-width: 48rpx; text-align: center; }

.total-card { background: linear-gradient(135deg, #E8F5E9 0%, #FFFFFF 100%); }
.minus { color: #FF8F3F; font-size: 26rpx; }
.total-price { display: flex; align-items: baseline; color: #FF8F3F; }
.total-symbol { font-size: 24rpx; font-weight: 700; margin-right: 2rpx; }
.total-num { font-size: 40rpx; font-weight: 700; }
.total-tip { margin-top: 10rpx; }

.submit-btn { margin-top: 24rpx; }
</style>
