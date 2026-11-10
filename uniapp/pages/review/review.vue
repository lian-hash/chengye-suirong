<template>
  <view class="container">
    <view class="card score-card">
      <view class="score-title">这次的露营体验如何？</view>
      <view class="score-star-wrap">
        <rate-star :value="score" @change="onScoreChange" />
      </view>
      <view class="muted score-tip">点击星星即可评分</view>
    </view>

    <view class="card">
      <view class="section-title">评价内容</view>
      <textarea
        class="content-area"
        placeholder="分享你的露营体验~（装备是否齐全、配送是否准时）"
        placeholder-class="content-ph"
        maxlength="300"
        :value="content"
        @input="onInputContent" />
      <view class="counter muted">{{ content.length }} / 300</view>
    </view>

    <!-- 主线二·2.1 带图评价 -->
    <view class="card">
      <view class="section-title">晒图（最多 3 张）</view>
      <view class="img-grid">
        <view class="img-item" v-for="(img, idx) in images" :key="idx">
          <image class="img" :src="img" mode="aspectFill" />
          <view class="img-del" @tap="onDeleteImage(idx)">×</view>
        </view>
        <view class="img-add" v-if="images.length < 3" @tap="onChooseImage">
          <text class="add-plus">+</text>
          <text class="add-text">上传照片</text>
        </view>
      </view>
    </view>

    <view class="card points-tip" v-if="submitting">
      <text class="tip-text">提交评价可获得 20 积分 🎉</text>
    </view>

    <button class="btn-primary submit-btn" hover-class="btn-hover" :loading="submitting" @tap="onSubmit">提交评价</button>
  </view>
</template>

<script>
import reviewService from '../../services/review';

export default {
  data() {
    return {
      orderId: '',
      score: 5,
      content: '',
      images: [],
      submitting: false,
    };
  },

  onLoad(options) {
    this.orderId = options.orderId || '';
  },

  methods: {
    onScoreChange(e) {
      this.score = e.score;
    },

    onInputContent(e) {
      this.content = e.detail.value;
    },

    onChooseImage() {
      uni.chooseImage({
        count: 3 - this.images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.images = this.images.concat(res.tempFilePaths || []).slice(0, 3);
        },
      });
    },

    onDeleteImage(idx) {
      this.images.splice(idx, 1);
    },

    onSubmit() {
      if (!this.content) {
        uni.showToast({ title: '请填写评价内容', icon: 'none' });
        return;
      }
      this.submitting = true;
      reviewService.submit({
        orderId: this.orderId,
        score: this.score,
        content: this.content,
        images: this.images,
      }).then((res) => {
        const pts = (res.data && res.data.pointsEarned) || 0;
        uni.showToast({ title: pts ? `评价成功 +${pts}积分` : '评价成功', icon: 'success' });
        setTimeout(() => uni.navigateBack(), 1000);
      }).catch(() => {
        this.submitting = false;
      });
    },
  },
};
</script>

<style scoped>
.score-card { display: flex; flex-direction: column; align-items: center; padding: 40rpx 28rpx 32rpx; }
.score-title { font-size: 30rpx; font-weight: 700; color: #333; }
.score-star-wrap { margin-top: 24rpx; }
.score-tip { margin-top: 12rpx; }

.content-area {
  width: 100%; min-height: 200rpx; box-sizing: border-box;
  background: #F7F9F8; border: 1rpx solid #EEF0EE; border-radius: 16rpx;
  padding: 20rpx; font-size: 28rpx; color: #333; line-height: 42rpx;
}
.content-ph { color: #BBB; font-size: 26rpx; }
.counter { margin-top: 12rpx; text-align: right; }

.img-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.img-item { position: relative; width: 200rpx; height: 200rpx; }
.img { width: 100%; height: 100%; border-radius: 12rpx; }
.img-del {
  position: absolute; top: -10rpx; right: -10rpx;
  width: 36rpx; height: 36rpx; border-radius: 50%;
  background: rgba(0,0,0,0.6); color: #fff;
  text-align: center; line-height: 36rpx; font-size: 24rpx;
}
.img-add {
  width: 200rpx; height: 200rpx;
  border: 2rpx dashed #CCC; border-radius: 12rpx;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: #FAFAFA;
}
.add-plus { font-size: 48rpx; color: #AAA; line-height: 1; }
.add-text { font-size: 22rpx; color: #999; margin-top: 8rpx; }

.points-tip { background: #FFF8E1; border: 1rpx solid #FFE082; padding: 16rpx 24rpx; }
.tip-text { font-size: 24rpx; color: #FF8F00; }

.submit-btn { margin-top: 24rpx; }
</style>
