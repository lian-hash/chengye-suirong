<template>
  <view class="container">
    <!-- 地图：骑手 + 场地双点位 -->
    <view class="map-wrap">
      <map
        v-if="site && rider"
        class="map"
        :latitude="rider.latitude"
        :longitude="rider.longitude"
        :scale="13"
        :markers="markers"
        :polyline="polyline"
        show-location />
      <view v-else class="map-placeholder">
        <text class="mp-emoji">🗺️</text>
        <text class="mp-text">地图加载中...</text>
      </view>
    </view>

    <!-- 骑手信息卡 -->
    <view class="card rider-card">
      <view class="row-between">
        <view class="rider-left">
          <view class="rider-emoji">🛵</view>
          <view>
            <view class="rider-name">{{ rider.name || '待派单' }}</view>
            <view class="rider-plate" v-if="rider.plate">车牌号：{{ rider.plate }}</view>
          </view>
        </view>
        <view class="rider-eta" v-if="rider.etaMinutes > 0">
          <text class="eta-num">{{ rider.etaMinutes }}</text>
          <text class="eta-unit">分钟</text>
          <text class="eta-label">后到达</text>
        </view>
      </view>
      <view class="rider-tip" v-if="rider.phone">
        <text class="rt-text">骑手电话：{{ rider.phone }}</text>
        <button class="rt-call" size="mini" @tap="onCallRider">联系</button>
      </view>
    </view>

    <!-- 场地信息卡 + 导航按钮 -->
    <view class="card" v-if="site">
      <view class="section-title">送达营地</view>
      <view class="site-name">⛺ {{ site.name }}</view>
      <view class="site-addr">{{ site.address }}</view>
      <button class="btn-primary nav-btn" hover-class="btn-hover" @tap="onNavigate">
        🧭 一键导航到营地
      </button>
    </view>

    <!-- 配送进度说明 -->
    <view class="card">
      <view class="section-title">配送进度</view>
      <view class="track-row" v-for="(item, idx) in progress" :key="idx">
        <view class="dot" :class="{ active: idx <= currentProgressIndex }" />
        <view class="track-text" :class="{ active: idx <= currentProgressIndex }">{{ item }}</view>
      </view>
    </view>
  </view>
</template>

<script>
import deliveryService from '../../services/delivery';

const STATUS_TO_STEP = {
  已支付: 0,
  配送中: 1,
  布置中: 2,
  使用中: 3,
  已回收: 4,
  已完成: 4,
};

export default {
  data() {
    return {
      orderId: '',
      rider: null,
      site: null,
      orderStatus: '',
      progress: ['已派单', '骑手取货出发', '送达营地', '布置完成', '装备回收'],
    };
  },
  computed: {
    currentProgressIndex() {
      if (this.orderStatus === '待支付' || this.orderStatus === '已支付') return 0;
      return STATUS_TO_STEP[this.orderStatus] || 0;
    },
    markers() {
      const arr = [];
      if (this.rider && this.rider.latitude) {
        arr.push({
          id: 1,
          latitude: this.rider.latitude,
          longitude: this.rider.longitude,
          iconPath: '',
          width: 30,
          height: 30,
          callout: { content: '骑手位置', color: '#fff', bgColor: '#2E7D32', borderRadius: 8, padding: 6, display: 'ALWAYS' },
        });
      }
      if (this.site && this.site.latitude) {
        arr.push({
          id: 2,
          latitude: this.site.latitude,
          longitude: this.site.longitude,
          width: 30,
          height: 30,
          callout: { content: this.site.name, color: '#fff', bgColor: '#FF8F3F', borderRadius: 8, padding: 6, display: 'ALWAYS' },
        });
      }
      return arr;
    },
    polyline() {
      if (!this.rider || !this.site) return [];
      return [{
        points: [
          { latitude: this.rider.latitude, longitude: this.rider.longitude },
          { latitude: this.site.latitude, longitude: this.site.longitude },
        ],
        color: '#2E7D32',
        width: 4,
        dottedLine: true,
      }];
    },
  },
  onLoad(options) {
    this.orderId = options.orderId || '';
    this.loadTrack();
  },
  methods: {
    loadTrack() {
      deliveryService.track(this.orderId).then((res) => {
        const d = res.data || {};
        this.rider = d.rider || null;
        this.site = d.site || null;
        this.orderStatus = d.orderStatus || '';
      });
    },
    onCallRider() {
      if (!this.rider || !this.rider.phone) return;
      uni.makePhoneCall({ phoneNumber: this.rider.phone });
    },
    onNavigate() {
      if (!this.site) return;
      uni.openLocation({
        latitude: this.site.latitude,
        longitude: this.site.longitude,
        name: this.site.name,
        address: this.site.address,
        scale: 16,
      });
    },
  },
};
</script>

<style scoped>
.map-wrap {
  height: 420rpx;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
  background: #E8F0E5;
}
.map { width: 100%; height: 100%; }
.map-placeholder {
  width: 100%; height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.mp-emoji { font-size: 60rpx; }
.mp-text { margin-top: 12rpx; color: #666; font-size: 26rpx; }

.rider-card { padding: 24rpx; }
.rider-left { display: flex; align-items: center; }
.rider-emoji { font-size: 56rpx; margin-right: 16rpx; }
.rider-name { font-size: 30rpx; font-weight: 700; color: #333; }
.rider-plate { font-size: 24rpx; color: #888; margin-top: 4rpx; }
.rider-eta { text-align: right; }
.eta-num { font-size: 44rpx; font-weight: 800; color: #2E7D32; }
.eta-unit { font-size: 24rpx; color: #2E7D32; margin-left: 4rpx; }
.eta-label { display: block; font-size: 22rpx; color: #888; margin-top: 4rpx; }
.rider-tip {
  margin-top: 20rpx; padding-top: 20rpx;
  border-top: 1rpx dashed #EEE;
  display: flex; align-items: center; justify-content: space-between;
}
.rt-text { font-size: 26rpx; color: #555; }
.rt-call { margin: 0; background: #2E7D32; color: #fff; }

.site-name { font-size: 30rpx; font-weight: 700; color: #333; }
.site-addr { font-size: 24rpx; color: #888; margin-top: 8rpx; }
.nav-btn { margin-top: 24rpx; }

.track-row {
  display: flex; align-items: center;
  padding: 16rpx 0;
}
.dot {
  width: 16rpx; height: 16rpx; border-radius: 50%;
  background: #DDD; margin-right: 20rpx;
}
.dot.active { background: #2E7D32; }
.track-text { font-size: 26rpx; color: #999; }
.track-text.active { color: #333; font-weight: 600; }
</style>
