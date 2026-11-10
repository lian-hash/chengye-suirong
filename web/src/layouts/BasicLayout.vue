<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="logo">城野随行</div>
      <el-menu :default-active="activeMenu" router class="menu">
        <el-menu-item v-for="m in menus" :key="m.path" :index="m.path">
          <span>{{ m.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <span class="role-label">{{ roleLabel }}</span>
        <el-button text type="primary" @click="onLogout">退出登录</el-button>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const activeMenu = computed(() => route.path);

const roleLabel = computed(() => {
  const map = { '管理员': '管理员', 'B端': '企业客户', 'C端': 'C端用户' };
  return map[userStore.role] || '未登录';
});

// 全部菜单（按角色过滤）
const ALL_MENUS = [
  { path: '/dashboard', title: '数据概览', roles: ['管理员', 'B端'] },
  { path: '/package', title: '套餐管理', roles: ['管理员'] },
  { path: '/site', title: '场地管理', roles: ['管理员'] },
  { path: '/order', title: '订单管理', roles: ['管理员', 'B端'] },
  { path: '/delivery', title: '配送调度', roles: ['管理员'] },
  { path: '/equipment', title: '装备管理', roles: ['管理员'] },
  { path: '/finance', title: '财务管理', roles: ['管理员'] },
  { path: '/log', title: '操作日志', roles: ['管理员'] },
  { path: '/user', title: '用户管理', roles: ['管理员'] },
  { path: '/coupon', title: '优惠券管理', roles: ['管理员'] },
  { path: '/points', title: '积分账户', roles: ['管理员'] },
  { path: '/feed', title: '晒单审核', roles: ['管理员'] },
  { path: '/enterprise/batch-order', title: '批量下单', roles: ['B端', '管理员'] },
  { path: '/enterprise/my-orders', title: '我的订单', roles: ['B端', '管理员'] },
];

const menus = computed(() => ALL_MENUS.filter((m) => m.roles.indexOf(userStore.role) !== -1));

function onLogout() {
  userStore.logout();
  router.push('/login');
}
</script>

<style scoped lang="scss">
.layout {
  height: 100vh;
}
.aside {
  background: #1f2d23;
  color: #fff;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-weight: 700;
  font-size: 20px;
  color: #fff;
  background: #2e7d32;
}
.menu {
  border-right: none;
  background: transparent;
  :deep(.el-menu-item) {
    color: #cfd8d0;
  }
  :deep(.el-menu-item.is-active) {
    background: #2e7d32;
    color: #fff;
  }
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.role-label {
  font-weight: 600;
}
.main {
  background: #f5f7f4;
}
</style>
