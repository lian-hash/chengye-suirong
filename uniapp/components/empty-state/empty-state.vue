<template>
  <view class="empty-state">
    <!-- CSS 绘制的圆形插画底 + emoji 主体（避免引入图片资源） -->
    <view class="empty-illus">
      <text class="empty-emoji">{{ emoji }}</text>
      <view class="empty-dot empty-dot-1" />
      <view class="empty-dot empty-dot-2" />
    </view>
    <view class="empty-title">{{ title }}</view>
    <view v-if="desc" class="empty-desc">{{ desc }}</view>
    <view v-if="btnText" class="empty-btn" hover-class="btn-hover" :hover-stay-time="80" @tap="onAction">
      {{ btnText }}
    </view>
  </view>
</template>

<script>
export default {
  name: 'EmptyState',
  props: {
    /** 插画 emoji */
    emoji: { type: String, default: '🏕️' },
    /** 主标题 */
    title: { type: String, default: '暂无数据' },
    /** 补充说明 */
    desc: { type: String, default: '' },
    /** 引导按钮文案（为空则不展示按钮） */
    btnText: { type: String, default: '' },
  },
  methods: {
    onAction() {
      this.$emit('action');
    },
  },
};
</script>

<style scoped>
.empty-illus {
  position: relative;
}

.empty-emoji {
  font-size: 72rpx;
  line-height: 72rpx;
}

.empty-dot {
  position: absolute;
  border-radius: 50%;
  background: rgba(46, 125, 50, 0.18);
}

.empty-dot-1 {
  width: 20rpx;
  height: 20rpx;
  top: 18rpx;
  right: 22rpx;
}

.empty-dot-2 {
  width: 12rpx;
  height: 12rpx;
  bottom: 24rpx;
  left: 20rpx;
  background: rgba(255, 143, 63, 0.28);
}

.empty-btn {
  transition: all 0.15s ease;
}
</style>
