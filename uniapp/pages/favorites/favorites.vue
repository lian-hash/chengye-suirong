<template>
  <view class="container">
    <view class="hero">
      <view class="hero-title">⭐ 我的收藏</view>
      <view class="hero-sub">收藏的套餐会出现在这里</view>
    </view>

    <view v-if="loading" class="card"><text class="muted">加载中...</text></view>

    <block v-else>
      <view v-if="list.length === 0" class="empty-wrap">
        <empty-state emoji="🌱" title="还没有收藏" desc="去首页挑一个心仪的套餐吧" btn-text="去逛逛" @action="onGoHome" />
      </view>

      <view class="card fav-item" v-for="p in list" :key="p.packageId" @tap="onOpen(p.packageId)">
        <view class="fav-emoji">{{ emojiOf(p.seasonTheme) }}</view>
        <view class="fav-meta">
          <view class="fav-name">{{ p.name }}</view>
          <view class="fav-sub">{{ p.seasonTheme }} · {{ p.suitableFor || '' }}</view>
          <view class="fav-price">¥{{ p.price }} /份</view>
        </view>
        <view class="fav-del" @tap.stop="onDel(p.packageId)">🗑️</view>
      </view>
    </block>
  </view>
</template>

<script>
import packageService from '../../services/package';

const FAV_KEY = 'cy_favorites';

export default {
  data() {
    return {
      loading: true,
      list: [],
    };
  },
  onShow() {
    this.loadFavs();
  },
  methods: {
    loadFavs() {
      this.loading = true;
      let favIds = [];
      try { favIds = uni.getStorageSync(FAV_KEY) || []; } catch (e) {}
      if (favIds.length === 0) {
        this.list = [];
        this.loading = false;
        return;
      }
      packageService.listPackages().then((r) => {
        const all = (r.data && r.data.packages) || [];
        this.list = all.filter((p) => favIds.indexOf(p.packageId) > -1);
        this.loading = false;
      }).catch(() => { this.loading = false; });
    },
    onDel(id) {
      uni.showModal({
        title: '取消收藏', content: '确定从收藏夹移除吗？',
        success: (res) => {
          if (!res.confirm) return;
          try {
            let arr = uni.getStorageSync(FAV_KEY) || [];
            arr = arr.filter((x) => x !== id);
            uni.setStorageSync(FAV_KEY, arr);
            this.loadFavs();
          } catch (e) {}
        },
      });
    },
    onOpen(id) {
      uni.navigateTo({ url: `/pages/packageDetail/packageDetail?packageId=${id}` });
    },
    onGoHome() {
      uni.switchTab({ url: '/pages/index/index' });
    },
    emojiOf(season) {
      const MAP = { 春季: '🌸', 夏季: '🏕️', 秋季: '🍁', 冬季: '❄️' };
      return MAP[season] || '⛺';
    },
  },
};
</script>

<style scoped>
.hero { padding: 16rpx 8rpx; }
.hero-title { font-size: 36rpx; font-weight: 800; color: #2E7D32; }
.hero-sub { font-size: 24rpx; color: #888; margin-top: 6rpx; }
.empty-wrap { margin-top: 80rpx; }

.fav-item { display: flex; align-items: center; padding: 24rpx; }
.fav-emoji { font-size: 64rpx; margin-right: 20rpx; }
.fav-meta { flex: 1; }
.fav-name { font-size: 28rpx; font-weight: 700; color: #333; }
.fav-sub { font-size: 22rpx; color: #888; margin-top: 6rpx; }
.fav-price { font-size: 26rpx; color: #FF8F3F; font-weight: 700; margin-top: 8rpx; }
.fav-del { font-size: 32rpx; padding: 12rpx; }
</style>
