<template>
  <view class="container login">
    <view class="logo-wrap">
      <view class="logo-circle">⛺</view>
      <view class="logo">城野随行</view>
      <view class="sub slogan">营地装备租赁 · 一站式服务</view>
    </view>

    <view class="card benefit-card">
      <view v-for="b in benefits" :key="b.text" class="benefit-row">
        <text class="benefit-emoji">{{ b.emoji }}</text>
        <text class="sub benefit-text">{{ b.text }}</text>
      </view>
    </view>

    <button class="btn-primary login-btn" hover-class="btn-hover" :loading="logging" @tap="onLogin">微信授权登录</button>
    <view class="muted tip">（当前为 Mock 模式，点击即模拟登录，无需真实 appid）</view>
  </view>
</template>

<script>
import auth from '../../utils/auth';

export default {
  data() {
    return {
      logging: false,
      benefits: [
        { emoji: '🚚', text: '装备配送到营地，用完即走' },
        { emoji: '🧼', text: '一客一消杀，安全放心' },
        { emoji: '💰', text: '按份计价，明码标价' },
      ],
    };
  },

  methods: {
    onLogin() {
      this.logging = true;
      auth.silentLogin().then(() => {
        uni.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => uni.navigateBack(), 600);
      }).catch(() => {
        this.logging = false;
        uni.showToast({ title: '登录失败', icon: 'none' });
      });
    },
  },
};
</script>

<style scoped>
.login {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
}

.logo-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-circle {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  font-size: 80rpx;
  line-height: 160rpx;
  text-align: center;
  box-shadow: 0 12rpx 32rpx rgba(46, 125, 50, 0.14);
}

.logo {
  margin-top: 28rpx;
  font-size: 56rpx;
  font-weight: 700;
  color: #2E7D32;
  letter-spacing: 4rpx;
}

.slogan {
  margin-top: 12rpx;
}

.benefit-card {
  width: 100%;
  margin-top: 60rpx;
}

.benefit-row {
  display: flex;
  align-items: center;
  padding: 14rpx 0;
}

.benefit-emoji {
  font-size: 36rpx;
  margin-right: 18rpx;
}

.benefit-text {
  line-height: 40rpx;
}

.login-btn {
  width: 100%;
  margin-top: 60rpx;
}

.tip {
  margin-top: 24rpx;
}
</style>
