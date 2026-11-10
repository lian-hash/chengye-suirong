<template>
  <div class="login-wrap">
    <el-card class="login-card" shadow="always">
      <h2 class="title">城野随行 · 管理后台</h2>
      <el-form label-width="60px" @submit.prevent>
        <el-form-item label="账号">
          <el-input v-model="username" placeholder="admin / ent" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" type="password" placeholder="任意密码（Mock）" />
        </el-form-item>
        <el-button type="primary" :loading="loading" style="width: 100%" @click="onLogin">
          登录
        </el-button>
      </el-form>
      <p class="tip">演示账号：admin → 管理员；ent → 企业客户（当前为 Mock 模式，无需后端）</p>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { call } from '@/utils/request';

const username = ref('admin');
const password = ref('123456');
const loading = ref(false);
const router = useRouter();
const userStore = useUserStore();

async function onLogin() {
  loading.value = true;
  try {
    const res = await call('webLogin', 'login', { username: username.value, password: password.value });
    const { token, role, nickname } = res.data;
    userStore.setAuth({ token, role, username: nickname || username.value });
    router.push('/dashboard');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-wrap {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2e7d32;
}
.login-card {
  width: 360px;
}
.title {
  text-align: center;
  color: #2e7d32;
  margin-bottom: 24px;
}
.tip {
  margin-top: 16px;
  font-size: 12px;
  color: #999;
  text-align: center;
}
</style>
