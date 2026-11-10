<template>
  <view class="sk-wrap">
    <!-- 套餐卡片骨架：顶部图片区 + 两行文本 + 底部标签行 -->
    <block v-if="type === 'card'">
      <view v-for="n in countList" :key="n" class="sk-card">
        <view class="skeleton sk-cover" />
        <view class="sk-body">
          <view class="skeleton sk-line sk-line-title" />
          <view class="skeleton sk-line sk-line-sub" />
          <view class="sk-row">
            <view class="skeleton sk-chip" />
            <view class="skeleton sk-chip" />
            <view class="skeleton sk-chip" />
          </view>
        </view>
      </view>
    </block>

    <!-- 普通列表骨架：图标块 + 两行文本 -->
    <block v-else>
      <view v-for="n in countList" :key="n" class="sk-item">
        <view class="skeleton sk-avatar" />
        <view class="sk-body">
          <view class="skeleton sk-line sk-line-title" />
          <view class="skeleton sk-line sk-line-sub" />
        </view>
      </view>
    </block>
  </view>
</template>

<script>
export default {
  name: 'LoadingSkeleton',
  props: {
    /** 骨架类型：card（套餐卡片）/ list（普通列表行） */
    type: { type: String, default: 'list' },
    /** 骨架条数 */
    count: { type: Number, default: 3 },
  },
  computed: {
    /** v-for 需要的数组（1..count） */
    countList() {
      const n = Number(this.count) > 0 ? Number(this.count) : 1;
      const arr = [];
      for (let i = 1; i <= n; i += 1) arr.push(i);
      return arr;
    },
  },
};
</script>

<style scoped>
.sk-wrap {
  padding: 4rpx 0;
}

/* ---- 卡片型 ---- */
.sk-card {
  background: #ffffff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  padding: 12rpx 12rpx 28rpx;
  box-shadow: 0 8rpx 24rpx rgba(46, 125, 50, 0.08);
  overflow: hidden;
}

.sk-cover {
  height: 180rpx;
  border-radius: 16rpx;
}

.sk-body {
  padding: 24rpx 16rpx 0;
}

.sk-row {
  margin-top: 16rpx;
  display: flex;
}

.sk-chip {
  width: 96rpx;
  height: 34rpx;
  border-radius: 8rpx;
  margin-right: 12rpx;
}

/* ---- 列表型 ---- */
.sk-item {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(46, 125, 50, 0.08);
  display: flex;
  align-items: flex-start;
}

.sk-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

/* ---- 通用文本行 ---- */
.sk-line {
  height: 28rpx;
}

.sk-line-title {
  width: 56%;
}

.sk-line-sub {
  width: 82%;
  margin-top: 16rpx;
  height: 24rpx;
}
</style>
