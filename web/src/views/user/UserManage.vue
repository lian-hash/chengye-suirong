<template>
  <div>
    <h2 class="page-title">用户与权限管理</h2>
    <el-card shadow="never">
      <el-table :data="list" border>
        <el-table-column prop="userId" label="用户ID" width="160" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column label="角色" width="160">
          <template #default="{ row }">
            <el-select
              v-model="row.role"
              size="small"
              :disabled="row.userId === 'admin'"
              @change="(val) => onChangeRole(row, val)"
            >
              <el-option label="C端" value="C端" />
              <el-option label="B端" value="B端" />
              <el-option label="管理员" value="管理员" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="registerTime" label="注册时间" width="200" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { userList, updateRole } from '@/api/user';
import { useUserStore } from '@/store/user';
import { ElMessage } from 'element-plus';

const list = ref([]);
const userStore = useUserStore();

async function loadData() {
  const res = await userList();
  list.value = (res.data && res.data.list) || [];
}

onMounted(loadData);

async function onChangeRole(row, val) {
  const res = await updateRole({ userId: row.userId, role: val, _operator: userStore.username });
  if (res.code === 0) {
    ElMessage.success('角色已更新');
    await loadData();
  } else {
    ElMessage.error(res.message || '更新失败');
    await loadData();
  }
}
</script>

<style scoped>
.page-title { margin: 0 0 16px; }
</style>
