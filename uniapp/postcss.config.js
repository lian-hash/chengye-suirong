// 城野随行 uni-app 项目 PostCSS 配置（Vue2 / mp-weixin 构建）
// 该文件供 @dcloudio/vue-cli-plugin-uni 的 postcss-loader 自动发现使用
module.exports = {
  parser: require('postcss-comment'),
  plugins: [
    require('postcss-import'),
    require('autoprefixer')({
      remove: process.env.UNI_PLATFORM !== 'h5'
    }),
    require('@dcloudio/vue-cli-plugin-uni/packages/postcss')
  ]
}
