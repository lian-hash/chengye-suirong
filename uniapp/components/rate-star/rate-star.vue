<template>
  <view class="stars">
    <text
      v-for="n in [1, 2, 3, 4, 5]"
      :key="n"
      class="star"
      :class="{ on: n <= value }"
      :data-score="n"
      @tap="onTap">★</text>
    <text v-if="value > 0" class="star-tip">{{ scoreTip }}</text>
  </view>
</template>

<script>
export default {
  name: 'RateStar',
  props: {
    value: { type: Number, default: 5 },
    readonly: { type: Boolean, default: false },
  },
  computed: {
    /** 评分文案提示 */
    scoreTip() {
      const MAP = { 1: '很不满意', 2: '不太满意', 3: '一般', 4: '满意', 5: '非常满意' };
      return MAP[this.value] || '';
    },
  },
  methods: {
    onTap(e) {
      if (this.readonly) return;
      const score = Number(e.currentTarget.dataset.score);
      this.$emit('change', { score });
    },
  },
};
</script>

<style scoped>
.stars {
  display: flex;
  align-items: center;
}

.star {
  font-size: 60rpx;
  line-height: 64rpx;
  color: #E0E3E0;
  margin-right: 16rpx;
  transition: all 0.15s ease;
}

.star.on {
  color: #FFB400;
  text-shadow: 0 4rpx 12rpx rgba(255, 180, 0, 0.28);
}

.star-tip {
  margin-left: 8rpx;
  font-size: 24rpx;
  color: #FF8F3F;
}
</style>
