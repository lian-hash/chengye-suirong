/**
 * 城野随行 uni-app 构建依赖补丁脚本（postinstall 自动执行）
 *
 * 解决的问题：
 * 1. postcss-urlrewrite 使用了已被新版 Node（>=17）移除的 util.isRegExp / util.isArray，
 *    导致 mp-weixin 构建在 Node 22/24 下报错。这里做兼容 polyfill。
 * 2. @dcloudio/vue-cli-plugin-uni 自带的 vue-loader 通过 require('@vue/component-compiler-utils')
 *    取编译模板，但默认解析到 npm 公共源上的“官方原版” 3.3.0（不含 uni 的 recyclableRender /
 *    components 补丁），导致编译产物出现 `Export 'recyclableRender' is not defined` 报错。
 *    这里把 uni 随包附带的已打补丁的 @vue/component-compiler-utils 覆盖到顶层。
 *
 * 3. @dcloudio/vue-cli-plugin-uni/packages/uni-cloud（uniCloud 客户端 SDK）在
 *    mp-weixin 构建链（webpack4 harmony import + terser）下有一个已验证的悬空引用 bug：
 *    dist/index.js 中 uni-id-router 初始化把 pages.json 导入绑定 e 用作函数参数默认值
 *    `function({pages:t=[],...,tabBar:r={}}=e){...}()`，terser 改名时只改了函数体内的
 *    体引用（!!e.uniIdRouter → s["a"].uniIdRouter），唯独参数默认值里的 e 没有跟着改，
 *    产物变成悬空的 `=e`，小程序启动即抛 `ReferenceError: e is not defined` → 白屏。
 *    修复：把引用从参数默认值挪到函数体（体引用改名链路是正常的）。
 *
 * 脚本幂等：已打过补丁则跳过。
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function patchPostcssUrlrewrite () {
  const file = path.join(root, 'node_modules/postcss-urlrewrite/lib/urlrewrite.js')
  if (!fs.existsSync(file)) return
  let src = fs.readFileSync(file, 'utf8')
  if (src.includes('util.isRegExp !== \'function\'')) return // 已打补丁
  const marker = "var util    = require( 'util' );"
  const polyfill = marker + "\n\n// Patched for newer Node compatibility (>=17 removed util.isRegExp/isArray)\n" +
    "if ( typeof util.isRegExp !== 'function' ) {\n" +
    "  util.isRegExp = function ( v ) { return Object.prototype.toString.call( v ) === '[object RegExp]'; };\n" +
    "}\n" +
    "if ( typeof util.isArray !== 'function' ) {\n" +
    "  util.isArray = Array.isArray;\n" +
    "}\n"
  if (!src.includes(marker)) return
  src = src.replace(marker, polyfill)
  fs.writeFileSync(file, src, 'utf8')
  console.log('[patch] postcss-urlrewrite polyfilled for newer Node.')
}

function patchComponentCompilerUtils () {
  const bundled = path.join(root, 'node_modules/@dcloudio/vue-cli-plugin-uni/packages/@vue/component-compiler-utils')
  const top = path.join(root, 'node_modules/@vue/component-compiler-utils')
  const target = path.join(top, 'dist/compileTemplate.js')
  if (!fs.existsSync(bundled) || !fs.existsSync(top)) return
  const targetSrc = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : ''
  if (targetSrc.includes('recyclableRender')) return // 已覆盖为补丁版
  // 用 uni 随包的补丁版覆盖顶层（dist + lib + package.json）
  for (const sub of ['dist', 'lib']) {
    const from = path.join(bundled, sub)
    const to = path.join(top, sub)
    if (!fs.existsSync(from)) continue
    copyDir(from, to)
  }
  const pkgFrom = path.join(bundled, 'package.json')
  const pkgTo = path.join(top, 'package.json')
  if (fs.existsSync(pkgFrom)) fs.copyFileSync(pkgFrom, pkgTo)
  console.log('[patch] @vue/component-compiler-utils replaced with uni-patched version.')
}

function copyDir (from, to) {
  fs.mkdirSync(to, { recursive: true })
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name)
    const dst = path.join(to, entry.name)
    if (entry.isDirectory()) copyDir(src, dst)
    else fs.copyFileSync(src, dst)
  }
}

function patchUniCloudDanglingE () {
  const file = path.join(root, 'node_modules/@dcloudio/vue-cli-plugin-uni/packages/uni-cloud/dist/index.js')
  if (!fs.existsSync(file)) return
  let src = fs.readFileSync(file, 'utf8')
  const broken = 'function({pages:t=[],subPackages:n=[],uniIdRouter:s={},tabBar:r={}}=e){'
  const fixed = 'function(z){const{pages:t=[],subPackages:n=[],uniIdRouter:s={},tabBar:r={}}=z||e;'
  if (!src.includes(broken)) return // 已打补丁或版本已修复
  src = src.replace(broken, fixed)
  fs.writeFileSync(file, src, 'utf8')
  console.log('[patch] uni-cloud dangling param-default `=e` fixed (uni-id-router init).')
}

patchPostcssUrlrewrite()
patchComponentCompilerUtils()
patchUniCloudDanglingE()
console.log('[patch] build deps patch done.')
