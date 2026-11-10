<template>
  <view class="container">
    <!-- 轮播图占位 -->
    <swiper
      class="banner"
      indicator-dots
      autoplay
      circular
      :interval="3500"
      indicator-color="rgba(255,255,255,0.45)"
      indicator-active-color="#ffffff">
      <swiper-item v-for="b in banners" :key="b.id">
        <view class="banner-slide" :style="b.style">
          <text class="banner-emoji">{{ b.emoji }}</text>
          <text class="banner-title">{{ b.title }}</text>
          <text class="banner-sub">{{ b.sub }}</text>
        </view>
      </swiper-item>
    </swiper>

    <!-- 服务保障 -->
    <view class="feature-row">
      <view v-for="f in features" :key="f.text" class="feature-item">
        <text class="feature-emoji">{{ f.emoji }}</text>
        <text class="feature-text">{{ f.text }}</text>
      </view>
    </view>

    <!-- 主线四·4.1 场景化推荐筛选 -->
    <view class="card filter-card">
      <view class="filter-row">
        <text class="filter-label">👥 场景</text>
        <view class="filter-chips">
          <text
            class="chip-filter"
            :class="{ active: filterScene === '' }"
            @tap="filterScene = ''">全部</text>
          <text
            v-for="s in sceneOptions"
            :key="s"
            class="chip-filter"
            :class="{ active: filterScene === s }"
            @tap="filterScene = s">{{ s }}</text>
        </view>
      </view>
      <view class="filter-row">
        <text class="filter-label">💰 预算</text>
        <view class="filter-chips">
          <text
            class="chip-filter"
            :class="{ active: filterBudget === '' }"
            @tap="filterBudget = ''">全部</text>
          <text
            v-for="b in budgetOptions"
            :key="b"
            class="chip-filter"
            :class="{ active: filterBudget === b }"
            @tap="filterBudget = b">{{ b }}</text>
        </view>
      </view>
    </view>

    <view class="section-title">精选套餐（{{ filteredPackages.length }}）</view>

    <loading-skeleton v-if="loading" type="card" :count="3" />

    <package-card
      v-for="p in filteredPackages"
      :key="p.packageId"
      :pkg="p"
      @select="onTapPackage" />

    <empty-state
      v-if="!loading && filteredPackages.length === 0"
      emoji="🎒"
      title="没有匹配的套餐"
      desc="换个场景或预算试试"
      btn-text="重置筛选"
      @action="onResetFilter" />

    <view class="section-title">可选场地（{{ sites.length }}）</view>

    <block v-if="loading">
      <view v-for="n in 2" :key="n" class="card site-skeleton">
        <view class="skeleton sk-avatar" />
        <view class="sk-lines">
          <view class="skeleton sk-line" />
          <view class="skeleton sk-line sk-line-sub" />
        </view>
      </view>
    </block>

    <view v-for="s in sites" :key="s.siteId" class="card site-row">
      <view class="site-row-main">
        <view class="title site-row-name">{{ s.name }}</view>
        <view class="sub site-row-addr">{{ s.address }}</view>
        <view class="site-row-meta">
          <text class="chip chip-green">容量 {{ s.capacity }} 人</text>
          <text v-if="s.partner" class="chip">合作方 {{ s.partner }}</text>
        </view>
      </view>
      <view :class="siteStatusClass(s.availableStatus)">{{ s.availableStatus }}</view>
    </view>
  </view>
</template>

<script>
import packageService from '../../services/package';
import util from '../../utils/util';

export default {
  data() {
    return {
      banners: [
        { id: 1, title: '城野随行 · 营地装备一站式租赁', sub: '装备送到营地 · 用完即走', emoji: '⛺', style: 'background: linear-gradient(135deg, #2E7D32 0%, #66BB6A 100%);' },
        { id: 2, title: '春日露营季 · 基础套餐 199 元起', sub: '帐篷 / 防潮垫 / 营地灯 全套配齐', emoji: '🌸', style: 'background: linear-gradient(135deg, #66BB6A 0%, #A5D6A7 100%);' },
        { id: 3, title: '夏日星空 · 进阶套餐限时上线', sub: '天幕 + 氛围灯串 + 烧烤架', emoji: '✨', style: 'background: linear-gradient(135deg, #FF8F3F 0%, #FFB74D 100%);' },
      ],
      features: [
        { emoji: '🛡️', text: '免押金' },
        { emoji: '🧼', text: '已消杀' },
        { emoji: '🚚', text: '准时达' },
      ],
      packages: [],
      sites: [],
      loading: true,
      filterScene: '',
      filterBudget: '',
      sceneOptions: ['情侣', '团建', '亲子'],
      budgetOptions: ['经济', '中端', '高端'],
    };
  },

  computed: {
    filteredPackages() {
      return this.packages.filter((p) => {
        if (this.filterScene && p.scene !== this.filterScene) return false;
        if (this.filterBudget && p.budgetTier !== this.filterBudget) return false;
        return true;
      });
    },
  },

  onLoad() { this.loadData(); },
  onPullDownRefresh() { this.loadData(); uni.stopPullDownRefresh(); },

  methods: {
    loadData() {
      packageService.listPackages().then((res) => {
        const d = res.data || {};
        this.packages = d.packages || [];
        this.sites = d.sites || [];
        this.loading = false;
      }).catch(() => { this.loading = false; });
    },
    onResetFilter() {
      this.filterScene = '';
      this.filterBudget = '';
    },
    onTapPackage(e) {
      uni.navigateTo({ url: `/pages/packageDetail/packageDetail?packageId=${e.packageId}` });
    },
    formatMoney: util.formatMoney,
    siteStatusClass: util.siteStatusClass,
  },
};
</script>

<style scoped>
.banner { height: 280rpx; border-radius: 16rpx; overflow: hidden; margin: 20rpx 0 0; box-shadow: 0 12rpx 32rpx rgba(46,125,50,0.14); }
.banner-slide { height: 280rpx; border-radius: 16rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; }
.banner-emoji { font-size: 72rpx; line-height: 80rpx; margin-bottom: 8rpx; }
.banner-title { font-size: 32rpx; font-weight: 700; text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.15); }
.banner-sub { margin-top: 10rpx; font-size: 24rpx; opacity: 0.92; }

.feature-row { display: flex; margin-top: 20rpx; background: #fff; border-radius: 20rpx; padding: 20rpx 0; box-shadow: 0 8rpx 24rpx rgba(46,125,50,0.08); }
.feature-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.feature-emoji { font-size: 40rpx; line-height: 48rpx; }
.feature-text { margin-top: 6rpx; font-size: 22rpx; color: #666; }

.filter-card { padding: 16rpx 24rpx; }
.filter-row { display: flex; align-items: center; padding: 10rpx 0; }
.filter-label { font-size: 26rpx; color: #333; font-weight: 600; width: 120rpx; flex-shrink: 0; }
.filter-chips { display: flex; flex-wrap: wrap; gap: 12rpx; flex: 1; }
.chip-filter {
  font-size: 22rpx; color: #666;
  padding: 8rpx 20rpx; border-radius: 24rpx;
  background: #F5F5F5;
}
.chip-filter.active { background: #2E7D32; color: #fff; font-weight: 600; }

.site-row { display: flex; align-items: flex-start; }
.site-row-main { flex: 1; min-width: 0; }
.site-row-name { line-height: 44rpx; }
.site-row-addr { margin-top: 6rpx; line-height: 36rpx; }
.site-row-meta { margin-top: 12rpx; }

.site-skeleton { display: flex; align-items: flex-start; }
.sk-avatar { width: 80rpx; height: 80rpx; border-radius: 16rpx; margin-right: 20rpx; flex-shrink: 0; }
.sk-lines { flex: 1; }
.sk-line { height: 28rpx; width: 56%; }
.sk-line-sub { width: 82%; height: 24rpx; margin-top: 16rpx; }
</style>
