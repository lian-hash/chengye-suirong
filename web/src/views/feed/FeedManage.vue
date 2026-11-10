<template>
  <div>
    <div class="page-head">
      <h2 class="page-title">晒单审核</h2>
      <el-radio-group v-model="filterStatus" @change="loadData">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="已发布">已发布</el-radio-button>
        <el-radio-button label="已屏蔽">已屏蔽</el-radio-button>
      </el-radio-group>
    </div>

    <el-card shadow="never">
      <el-table :data="list" border>
        <el-table-column prop="feedId" label="ID" width="100" />
        <el-table-column label="用户" width="180">
          <template #default="{ row }">
            <span>{{ row.avatar }} {{ row.nickname }}</span>
          </template>
        </el-table-column>
        <el-table-column label="关联套餐/场地" min-width="220">
          <template #default="{ row }">
            <div class="meta">{{ row.packageName }}</div>
            <div class="meta-sub">📍 {{ row.siteName }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="260" show-overflow-tooltip />
        <el-table-column prop="likeCount" label="点赞" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已发布' ? 'success' : 'danger'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="160">
          <template #default="{ row }">{{ row.createTime.replace('T', ' ').slice(0, 16) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link :type="row.status === '已发布' ? 'warning' : 'success'" @click="onToggle(row)">
              {{ row.status === '已发布' ? '屏蔽' : '恢复' }}
            </el-button>
            <el-button link type="danger" @click="onRemove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { listFeeds, removeFeed, toggleFeed } from '@/api/feed';
import { useUserStore } from '@/store/user';

const list = ref([]);
const filterStatus = ref('');
const userStore = useUserStore();

async function loadData() {
  const res = await listFeeds({ status: filterStatus.value || undefined });
  list.value = (res.data && res.data.list) || [];
}
onMounted(loadData);

async function onToggle(row) {
  const res = await toggleFeed({ feedId: row.feedId, _operator: userStore.username || 'admin' });
  if (res.code === 0) {
    ElMessage.success('已更新');
    await loadData();
  }
}
async function onRemove(row) {
  await ElMessageBox.confirm(`确定删除晒单「${row.feedId}」吗？删除后不可恢复。`, '警告', { type: 'warning' });
  const res = await removeFeed({ feedId: row.feedId, _operator: userStore.username || 'admin' });
  if (res.code === 0) {
    ElMessage.success('已删除');
    await loadData();
  }
}
</script>

<style scoped>
.page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-title { margin: 0; }
.meta { font-size: 13px; color: #333; }
.meta-sub { font-size: 12px; color: #999; margin-top: 4px; }
</style>
