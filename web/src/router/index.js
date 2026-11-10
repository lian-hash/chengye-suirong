/**
 * 路由表 + 角色守卫
 * 管理员全功能；企业仅 批量下单 / 我的订单 / 对账单
 */
import { createRouter, createWebHashHistory } from 'vue-router';
import { getToken, getRole, isTokenExpired } from '@/utils/auth';
import { ElMessage } from 'element-plus';
import BasicLayout from '@/layouts/BasicLayout.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/Login.vue'),
    meta: { public: true, title: '登录' },
  },
  {
    path: '/',
    component: BasicLayout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/Dashboard.vue'), meta: { title: '数据概览', roles: ['管理员', 'B端'] } },
      { path: 'package', name: 'PackageManage', component: () => import('@/views/package/PackageManage.vue'), meta: { title: '套餐管理', roles: ['管理员'] } },
      { path: 'site', name: 'SiteManage', component: () => import('@/views/site/SiteManage.vue'), meta: { title: '场地管理', roles: ['管理员'] } },
      { path: 'order', name: 'OrderManage', component: () => import('@/views/order/OrderManage.vue'), meta: { title: '订单管理', roles: ['管理员', 'B端'] } },
      { path: 'delivery', name: 'DeliveryManage', component: () => import('@/views/delivery/DeliveryManage.vue'), meta: { title: '配送调度', roles: ['管理员'] } },
      { path: 'equipment', name: 'EquipmentManage', component: () => import('@/views/equipment/EquipmentManage.vue'), meta: { title: '装备管理', roles: ['管理员'] } },
      { path: 'finance', name: 'Finance', component: () => import('@/views/finance/Finance.vue'), meta: { title: '财务管理', roles: ['管理员'] } },
      { path: 'log', name: 'LogManage', component: () => import('@/views/log/LogManage.vue'), meta: { title: '操作日志', roles: ['管理员'] } },
      { path: 'user', name: 'UserManage', component: () => import('@/views/user/UserManage.vue'), meta: { title: '用户管理', roles: ['管理员'] } },
      { path: 'coupon', name: 'CouponManage', component: () => import('@/views/coupon/CouponManage.vue'), meta: { title: '优惠券管理', roles: ['管理员'] } },
      { path: 'points', name: 'PointsManage', component: () => import('@/views/points/PointsManage.vue'), meta: { title: '积分账户', roles: ['管理员'] } },
      { path: 'feed', name: 'FeedManage', component: () => import('@/views/feed/FeedManage.vue'), meta: { title: '晒单审核', roles: ['管理员'] } },
      { path: 'enterprise/batch-order', name: 'BatchOrder', component: () => import('@/views/enterprise/BatchOrder.vue'), meta: { title: '批量下单', roles: ['B端', '管理员'] } },
      { path: 'enterprise/my-orders', name: 'MyOrders', component: () => import('@/views/enterprise/MyOrders.vue'), meta: { title: '我的订单', roles: ['B端', '管理员'] } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
];

const router = createRouter({
  // 使用 hash 模式：静态托管没有 SPA history 回退，直接访问/刷新子路径（如 /login）会 404
  history: createWebHashHistory(),
  routes,
});

// 角色守卫
router.beforeEach((to, from, next) => {
  if (to.meta.public) return next();
  const token = getToken();
  if (!token || isTokenExpired()) {
    return next('/login');
  }
  const role = getRole();
  const allowed = to.meta.roles || [];
  if (allowed.length && allowed.indexOf(role) === -1) {
    // 越权：企业只能访问其专属页，回退到仪表盘
    if (ElMessage && ElMessage.warning) ElMessage.warning('无权限访问该页面');
    return next('/dashboard');
  }
  next();
});

export default router;
