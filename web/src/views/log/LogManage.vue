<template>
  <div>
    <div class="page-head">
      <h2 class="page-title">操作日志</h2>
      <el-button @click="loadData">刷新</el-button>
    </div>

    <el-card shadow="never" class="filter-card">
      <el-form :inline="true">
        <el-form-item label="操作人">
          <el-input v-model="filter.operator" placeholder="模糊查询" clearable />
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="filter.orderId" placeholder="精确匹配" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px">
      <el-table :data="list" border empty-text="暂无日志">
        <el-table-column prop="operator" label="操作人" width="160" />
        <el-table-column prop="opType" label="操作类型" width="160" />
        <el-table-column prop="opTarget" label="对象" width="120" />
        <el-table-column prop="opContent" label="内容" min-width="200" />
        <el-table-column label="结果" width="90">
          <template #default="{ row }">
            <el-tag :type="row.opResult === 'SUCCESS' ? 'success' : 'danger'">{{ row.opResult }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderId" label="关联订单" width="120" />
        <el-table-column prop="opTime" label="时间" width="200" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { logList } from '@/api/log';

const list = ref([]);
const filter = reactive({ operator: '', orderId: '' });

async function loadData() {
  const res = await logList({ operator: filter.operator, orderId: filter.orderId, page: { size: 999, num: 1 } });
  list.value = (res.data && res.data.list) || [];
}

function resetFilter() {
  filter.operator = '';
  filter.orderId = '';
  loadData();
}

onMounted(loadData);
</script>

<style scoped>
.page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-title { margin: 0; }
.filter-card :deep(.el-form-item) { margin-bottom: 0; }
</style>
