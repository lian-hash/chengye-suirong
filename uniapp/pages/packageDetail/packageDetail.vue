<template>
  <view class="container">
    <loading-skeleton v-if="loading" type="card" :count="1" />

    <block v-if="pkg">
      <!-- 顶部封面 -->
      <view class="hero" :style="coverStyle">
        <image v-if="pkg.bannerUrl" class="hero-img" :src="pkg.bannerUrl" mode="aspectFill" />
        <block v-else>
          <text class="hero-emoji">{{ coverEmoji }}</text>
          <text class="hero-season">{{ pkg.seasonTheme }}主题套餐</text>
        </block>
        <!-- 主线四·4.3 收藏按钮 -->
        <view class="fav-btn" @tap="onToggleFav">
          <text class="fav-icon">{{ isFav ? '★' : '☆' }}</text>
        </view>
      </view>

      <!-- 套餐主信息 -->
      <view class="card">
        <view class="row-between">
          <view class="title pkg-name">{{ pkg.name }}</view>
          <view class="chip chip-green">{{ pkg.seasonTheme || '精选' }}</view>
        </view>
        <view class="sub pkg-period">可预约 {{ pkg.reservableStart }} ~ {{ pkg.reservableEnd }}</view>

        <!-- 主线四·4.1 场景标签 -->
        <view class="scene-tags">
          <view class="scene-tag" v-if="pkg.suitableFor">👥 {{ pkg.suitableFor }}</view>
          <view class="scene-tag" v-if="pkg.budgetTier">💰 {{ pkg.budgetTier }}</view>
        </view>

        <view class="divider" />
        <view class="row-between price-row">
          <view class="price-block">
            <text class="price-symbol">¥</text>
            <text class="price-num">{{ priceText }}</text>
            <text class="price-unit">/份</text>
          </view>
          <view class="chip chip-orange">营地直营</view>
        </view>
      </view>

      <!-- 装备清单 -->
      <view class="card">
        <view class="section-title">装备清单预览</view>
        <view v-for="ref in pkg.equipRefs" :key="ref.equipmentId" class="equip-row">
          <text class="equip-name">{{ ref.name || ref.equipmentId }}</text>
          <text class="equip-qty">x{{ ref.qty }}</text>
        </view>
      </view>

      <!-- 搭建教程（主线一·1.3） -->
      <view class="card" v-if="pkg.setupTips">
        <view class="section-title">🏕️ 搭建教程</view>
        <view class="setup-tips">{{ pkg.setupTips }}</view>
      </view>

      <!-- 主线二·2.2 营地玩法攻略 -->
      <view class="card" v-if="guides.length > 0">
        <view class="section-title">📖 相关攻略</view>
        <view class="guide-item" v-for="g in guides" :key="g.guideId">
          <view class="guide-head">
            <text class="guide-cover">{{ g.cover }}</text>
            <view class="guide-meta">
              <view class="guide-title">{{ g.title }}</view>
              <view class="guide-sub">{{ g.author }} · {{ g.publishTime }}</view>
            </view>
          </view>
          <view class="guide-content">{{ g.content }}</view>
          <view class="guide-tags">
            <text class="guide-tag" v-for="t in g.tags" :key="t">#{{ t }}</text>
          </view>
        </view>
      </view>

      <button class="btn-primary book-btn" hover-class="btn-hover" @tap="onTapBook">选择场地并下单</button>
    </block>

    <empty-state
      v-if="!loading && !pkg"
      emoji="🔍"
      title="套餐不存在或已下架"
      desc="换个套餐看看吧"
      btn-text="返回首页"
      @action="onBackHome" />
  </view>
</template>

<script>
import packageService from '../../services/package';
import util from '../../utils/util';

const FAV_KEY = 'cy_favorites';

export default {
  data() {
    return {
      packageId: '',
      pkg: null,
      loading: true,
      guides: [],
      isFav: false,
    };
  },

  computed: {
    coverStyle() {
      return `background: ${util.seasonGradient(this.pkg && this.pkg.seasonTheme)};`;
    },
    coverEmoji() {
      return util.seasonEmoji(this.pkg && this.pkg.seasonTheme);
    },
    priceText() {
      const n = Number(this.pkg && this.pkg.price) || 0;
      return Number.isInteger(n) ? String(n) : n.toFixed(2);
    },
  },

  onLoad(options) {
    this.packageId = options.packageId || '';
    this.loadDetail();
    this.checkFav();
  },

  methods: {
    loadDetail() {
      packageService.getPackage(this.packageId).then((res) => {
        this.pkg = res.data || null;
        this.loading = false;
        // 拉攻略（mock 里按 siteId 过滤；套餐详情页直接拉全部，展示前几条）
        packageService.listGuides().then((r) => {
          this.guides = ((r.data && r.data.list) || []).slice(0, 2);
        }).catch(() => {});
      }).catch(() => {
        this.loading = false;
      });
    },

    /** 主线四·4.3 收藏：本地 storage */
    checkFav() {
      try {
        const arr = uni.getStorageSync(FAV_KEY) || [];
        this.isFav = arr.indexOf(this.packageId) > -1;
      } catch (e) { this.isFav = false; }
    },
    onToggleFav() {
      try {
        let arr = uni.getStorageSync(FAV_KEY) || [];
        if (this.isFav) {
          arr = arr.filter((x) => x !== this.packageId);
          uni.showToast({ title: '已取消收藏', icon: 'none' });
        } else {
          arr.push(this.packageId);
          uni.showToast({ title: '已收藏 ⭐', icon: 'success' });
        }
        uni.setStorageSync(FAV_KEY, arr);
        this.isFav = !this.isFav;
      } catch (e) {}
    },

    onTapBook() {
      uni.navigateTo({ url: `/pages/siteSelect/siteSelect?packageId=${this.packageId}` });
    },

    onBackHome() {
      uni.switchTab({ url: '/pages/index/index' });
    },
  },
};
</script>

<style scoped>
.hero {
  position: relative;
  height: 240rpx;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 32rpx rgba(46, 125, 50, 0.14);
}
.hero-img { width: 100%; height: 240rpx; }
.hero-emoji { font-size: 88rpx; line-height: 96rpx; }
.hero-season {
  margin-top: 10rpx; color: #fff; font-size: 28rpx; font-weight: 600;
  text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.18);
}
.fav-btn {
  position: absolute; top: 20rpx; right: 20rpx;
  width: 64rpx; height: 64rpx; border-radius: 50%;
  background: rgba(255,255,255,0.9);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.15);
}
.fav-icon { font-size: 36rpx; color: #FF8F00; }

.pkg-name { flex: 1; line-height: 44rpx; }
.pkg-period { margin-top: 10rpx; line-height: 38rpx; }

.scene-tags { display: flex; gap: 12rpx; margin-top: 16rpx; flex-wrap: wrap; }
.scene-tag {
  font-size: 22rpx; color: #2E7D32;
  background: #E8F5E9; padding: 6rpx 16rpx; border-radius: 20rpx;
}

.price-row { align-items: flex-end; }
.price-block { display: flex; align-items: baseline; color: #FF8F3F; }
.price-symbol { font-size: 24rpx; font-weight: 700; margin-right: 2rpx; }
.price-num { font-size: 48rpx; font-weight: 700; line-height: 48rpx; }
.price-unit { margin-left: 6rpx; font-size: 22rpx; color: #999; }

.equip-row {
  display: flex; justify-content: space-between; align-items: center; padding: 12rpx 0;
}
.equip-name { font-size: 26rpx; color: #666; }
.equip-qty {
  color: #2E7D32; font-weight: 700; font-size: 26rpx;
  background: #E8F5E9; border-radius: 8rpx; padding: 2rpx 14rpx;
}

.setup-tips {
  font-size: 26rpx; color: #555; line-height: 40rpx;
  background: #F7F9F8; padding: 16rpx; border-radius: 12rpx;
}

.guide-item {
  padding: 16rpx 0;
  border-bottom: 1rpx dashed #EEE;
}
.guide-item:last-child { border-bottom: none; }
.guide-head { display: flex; align-items: center; }
.guide-cover { font-size: 48rpx; margin-right: 16rpx; }
.guide-meta { flex: 1; }
.guide-title { font-size: 26rpx; font-weight: 700; color: #333; }
.guide-sub { font-size: 22rpx; color: #999; margin-top: 4rpx; }
.guide-content { font-size: 24rpx; color: #666; line-height: 36rpx; margin-top: 12rpx; }
.guide-tags { margin-top: 10rpx; }
.guide-tag { font-size: 22rpx; color: #1976D2; margin-right: 16rpx; }

.book-btn { margin-top: 24rpx; }
</style>
