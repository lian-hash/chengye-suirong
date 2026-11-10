<template>
  <view class="container">
    <view class="hero">
      <view class="hero-title">📸 营地打卡广场</view>
      <view class="hero-sub">看看大家都在哪些营地野起来了</view>
    </view>

    <loading-skeleton v-if="loading" type="list" :count="3" />

    <block v-else>
      <view v-if="list.length === 0" class="empty-wrap">
        <empty-state emoji="🌱" title="还没有晒单" desc="去完成一次露营，回来分享吧" />
      </view>

      <view class="feed-card" v-for="item in list" :key="item.reviewId">
        <view class="feed-header">
          <view class="avatar">{{ item.avatar || '😊' }}</view>
          <view class="header-meta">
            <view class="nickname">{{ item.nickname || '露营玩家' }}</view>
            <view class="meta">{{ formatDate(item.createTime) }} · {{ siteNameMap[item.siteId] || '营地' }}</view>
          </view>
          <view class="score-badge">⭐ {{ item.score }}.0</view>
        </view>

        <view class="feed-content">{{ item.content }}</view>

        <!-- 图片九宫格 -->
        <view class="img-grid" v-if="item.images && item.images.length">
          <image
            v-for="(img, idx) in item.images"
            :key="idx"
            :src="img"
            class="feed-img"
            mode="aspectFill" />
        </view>
        <!-- 无图时用大 emoji 占位 -->
        <view class="emoji-block" v-else>
          <text class="big-emoji">{{ item.emoji || '⛺' }}</text>
        </view>

        <view class="feed-footer">
          <view class="like-btn" @tap="onLike(item)">
            <text>👍</text>
            <text class="like-num">{{ item.likes || 0 }}</text>
          </view>
        </view>
      </view>
    </block>
  </view>
</template>

<script>
import reviewService from '../../services/review';
import util from '../../utils/util';

export default {
  data() {
    return {
      loading: true,
      list: [],
      siteNameMap: {
        SITE001: '东湖绿道营地A区',
        SITE002: '梁子湖畔露营基地',
        SITE003: '马鞍山森林营地',
      },
    };
  },
  onLoad() {
    this.loadFeed();
  },
  onShow() {
    // 从评价页返回时刷新
    if (!this.loading) this.loadFeed();
  },
  methods: {
    loadFeed() {
      this.loading = true;
      reviewService.list().then((res) => {
        this.list = (res.data && res.data.list) || [];
        this.loading = false;
      }).catch(() => { this.loading = false; });
    },
    onLike(item) {
      reviewService.like(item.reviewId).then((res) => {
        item.likes = res.data.likes;
      }).catch(() => {});
    },
    formatDate: util.formatDate,
  },
};
</script>

<style scoped>
.hero {
  padding: 24rpx 8rpx 16rpx;
}
.hero-title { font-size: 36rpx; font-weight: 800; color: #2E7D32; }
.hero-sub { font-size: 24rpx; color: #888; margin-top: 6rpx; }

.empty-wrap { margin-top: 80rpx; }

.feed-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
}
.feed-header { display: flex; align-items: center; }
.avatar {
  width: 64rpx; height: 64rpx; border-radius: 50%;
  background: #E8F5E9; font-size: 36rpx;
  display: flex; align-items: center; justify-content: center;
}
.header-meta { flex: 1; margin-left: 16rpx; }
.nickname { font-size: 28rpx; font-weight: 700; color: #333; }
.meta { font-size: 22rpx; color: #999; margin-top: 4rpx; }
.score-badge {
  font-size: 24rpx; color: #FF8F00;
  background: #FFF3E0; padding: 6rpx 16rpx; border-radius: 20rpx;
}

.feed-content { font-size: 28rpx; color: #333; line-height: 44rpx; margin: 20rpx 0; }

.img-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.feed-img { width: 210rpx; height: 210rpx; border-radius: 12rpx; }

.emoji-block {
  height: 280rpx; border-radius: 16rpx;
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  display: flex; align-items: center; justify-content: center;
}
.big-emoji { font-size: 120rpx; }

.feed-footer { margin-top: 20rpx; display: flex; justify-content: flex-end; }
.like-btn {
  display: flex; align-items: center;
  font-size: 26rpx; color: #666;
  padding: 8rpx 20rpx; border-radius: 20rpx; background: #F5F5F5;
}
.like-num { margin-left: 8rpx; }
</style>
