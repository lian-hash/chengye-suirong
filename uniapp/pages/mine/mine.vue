<template>
  <view class="container">
    <!-- 用户信息头图 -->
    <view class="profile-hero">
      <view class="avatar">{{ loggedIn ? '🏕️' : '👤' }}</view>
      <view class="profile-main">
        <view class="profile-name">{{ loggedIn ? (nickname || '微信用户') : '未登录' }}</view>
        <view class="profile-sub">
          <text v-if="loggedIn" class="chip chip-glass">{{ role || 'C端' }}</text>
          <text v-if="loggedIn" class="chip chip-glass points-chip">⭐ {{ points }} 积分</text>
          <text v-else class="profile-tip">登录后即可下单与评价</text>
        </view>
      </view>
    </view>

    <!-- 账户信息 -->
    <view class="card">
      <view class="section-title">账户信息</view>
      <block v-if="loggedIn">
        <view class="row-between info-row">
          <text class="sub">昵称</text>
          <text class="info-value">{{ nickname || '微信用户' }}</text>
        </view>
        <view class="row-between info-row">
          <text class="sub">角色</text>
          <text class="info-value">{{ role || '-' }}</text>
        </view>
        <view v-if="phone" class="row-between info-row">
          <text class="sub">手机号</text>
          <text class="info-value">{{ phone }}</text>
        </view>
        <view class="row-between info-row">
          <text class="sub">累计积分</text>
          <text class="info-value">{{ points }}（评价可得 20 积分）</text>
        </view>
      </block>
      <view v-else class="sub login-tip">当前未登录，部分功能不可用</view>
    </view>

    <!-- 快捷入口 -->
    <view class="card">
      <view class="section-title">快捷入口</view>
      <view class="quick-row">
        <view class="quick-item" hover-class="btn-hover" @tap="onGoOrders">
          <text class="quick-emoji">🧾</text>
          <text class="quick-text">我的订单</text>
        </view>
        <view class="quick-item" hover-class="btn-hover" @tap="onGoCoupons">
          <text class="quick-emoji">🎫</text>
          <text class="quick-text">券包</text>
        </view>
        <view class="quick-item" hover-class="btn-hover" @tap="onGoFeed">
          <text class="quick-emoji">📸</text>
          <text class="quick-text">晒单广场</text>
        </view>
      </view>
      <view class="quick-row">
        <view class="quick-item" hover-class="btn-hover" @tap="onGoFavorites">
          <text class="quick-emoji">⭐</text>
          <text class="quick-text">我的收藏</text>
        </view>
        <view class="quick-item" hover-class="btn-hover" @tap="onGoHome">
          <text class="quick-emoji">🎒</text>
          <text class="quick-text">浏览套餐</text>
        </view>
        <view class="quick-item" hover-class="btn-hover" @tap="onGoHome">
          <text class="quick-emoji">🏕️</text>
          <text class="quick-text">营地场地</text>
        </view>
      </view>
      <view class="quick-row">
        <view class="quick-item" hover-class="btn-hover" @tap="onCustomerService">
          <text class="quick-emoji">🎧</text>
          <text class="quick-text">联系客服</text>
        </view>
      </view>
    </view>

    <button v-if="!loggedIn" class="btn-primary login-btn" hover-class="btn-hover" @tap="onLogin">微信授权登录</button>
  </view>
</template>

<script>
import userStore from '../../store/user';
import userService from '../../services/user';
import pointsService from '../../services/points';

export default {
  data() {
    return {
      role: '',
      nickname: '',
      phone: '',
      loggedIn: false,
      points: 0,
    };
  },

  onShow() {
    const s = userStore.getState();
    this.role = s.role;
    this.nickname = (s.userInfo && s.userInfo.nickname) || '';
    this.loggedIn = s.loggedIn;
    if (s.loggedIn) {
      userService.getInfo().then((res) => {
        const d = res.data || {};
        this.nickname = d.nickname;
        this.role = d.role;
        this.phone = d.phone;
        if (typeof d.points === 'number') this.points = d.points;
      }).catch(() => {});
      pointsService.get().then((r) => {
        this.points = (r.data && r.data.points) || 0;
      }).catch(() => {});
    }
  },

  methods: {
    onLogin() {
      uni.navigateTo({ url: '/pages/login/login' });
    },
    onGoOrders() {
      uni.switchTab({ url: '/pages/orderList/orderList' });
    },
    onGoHome() {
      uni.switchTab({ url: '/pages/index/index' });
    },
    onGoCoupons() {
      uni.navigateTo({ url: '/pages/coupons/coupons' });
    },
    onGoFeed() {
      uni.navigateTo({ url: '/pages/feed/feed' });
    },
    onGoFavorites() {
      uni.navigateTo({ url: '/pages/favorites/favorites' });
    },
    onCustomerService() {
      uni.showModal({
        title: '联系客服',
        content: '客服微信：your-wechat-id\n客服电话：000-0000-0000\n服务时间：周一至周日 9:00-21:00',
        confirmText: '复制微信',
        cancelText: '关闭',
        success: (res) => {
          if (res.confirm) {
            uni.setClipboardData({ data: 'your-wechat-id' });
          }
        },
      });
    },
  },
};
</script>

<style scoped>
.profile-hero {
  background: linear-gradient(135deg, #2E7D32 0%, #66BB6A 100%);
  border-radius: 20rpx;
  padding: 40rpx 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 12rpx 32rpx rgba(46,125,50,0.18);
  display: flex;
  align-items: center;
}
.avatar {
  width: 112rpx; height: 112rpx; border-radius: 50%;
  background: rgba(255,255,255,0.92); font-size: 56rpx;
  line-height: 112rpx; text-align: center; margin-right: 24rpx;
  flex-shrink: 0; box-shadow: 0 8rpx 20rpx rgba(0,0,0,0.12);
}
.profile-main { flex: 1; min-width: 0; }
.profile-name { color: #fff; font-size: 36rpx; font-weight: 700; line-height: 50rpx; }
.profile-sub { margin-top: 10rpx; display: flex; gap: 12rpx; flex-wrap: wrap; }
.points-chip { background: rgba(255,255,255,0.25); }
.profile-tip { color: rgba(255,255,255,0.85); font-size: 24rpx; }

.info-row { min-height: 56rpx; }
.info-value { font-size: 26rpx; color: #333; }
.login-tip { line-height: 40rpx; }

.quick-row { display: flex; }
.quick-item {
  flex: 1; display: flex; flex-direction: column; align-items: center; padding: 16rpx 0;
}
.quick-emoji { font-size: 48rpx; line-height: 56rpx; }
.quick-text { margin-top: 8rpx; font-size: 24rpx; color: #666; }

.login-btn { margin-top: 24rpx; }
</style>
