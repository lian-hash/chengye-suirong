<template>
  <view class="container">
    <view class="page-head">
      <view class="title">{{ packageId ? '选择场地' : '全部场地' }}</view>
      <view class="sub">选定套餐后，为该套餐选择可用的露营场地</view>
    </view>

    <loading-skeleton v-if="loading" type="list" :count="3" />

    <site-card
      v-for="s in sites"
      :key="s.siteId"
      :site="s"
      @select="onSelectSite" />

    <empty-state
      v-if="!loading && sites.length === 0"
      emoji="🗺️"
      title="暂无可用场地"
      desc="当前没有开放中的营地，请稍后再试"
      btn-text="返回首页"
      @action="onBackHome" />
  </view>
</template>

<script>
import packageService from '../../services/package';

export default {
  data() {
    return {
      packageId: '',
      sites: [],
      loading: true,
    };
  },

  onLoad(options) {
    this.packageId = options.packageId || '';
    this.loadSites();
  },

  methods: {
    loadSites() {
      packageService.listPackages().then((res) => {
        this.sites = res.data.sites || [];
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },

    onSelectSite(e) {
      const siteId = e.siteId;
      const { packageId } = this;
      uni.navigateTo({ url: `/pages/orderCreate/orderCreate?packageId=${packageId}&siteId=${siteId}` });
    },

    onBackHome() {
      uni.switchTab({ url: '/pages/index/index' });
    },
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
</style>
