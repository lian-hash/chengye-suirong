<template>
  <div>
    <div class="page-head">
      <h2 class="page-title">配送调度</h2>
      <el-button @click="loadData">刷新</el-button>
    </div>
    <el-alert type="info" :closable="false" title="由管理员在此推进订单状态（P4）：已支付 → 配送中 → 布置中 → 使用中 →（回收）→ 已完成。仅展示处于 已支付 / 配送中 / 布置中 / 使用中的订单。" />
    <el-card shadow="never" style="margin-top: 16px">
      <el-table :data="list" border empty-text="暂无配送任务">
        <el-table-column prop="orderId" label="订单号" width="120" />
        <el-table-column prop="packageId" label="套餐" min-width="140">
          <template #default="{ row }">{{ pkgName(row.packageId) }}</template>
        </el-table-column>
        <el-table-column prop="useDate" label="使用日期" width="120" />
        <el-table-column prop="quantity" label="份数" width="70" />
        <el-table-column label="当前状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.orderStatus)">{{ row.orderStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contactName" label="联系人" width="110" />
        <el-table-column label="可执行操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :loading="row._loading" @click="advance(row)">
              {{ nextAction(row.orderStatus).label }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { deliveryList, dispatch, setup, recover } from '@/api/delivery';
import { listPackages } from '@/api/package';
import { useUserStore } from '@/store/user';
import { ElMessage } from 'element-plus';

const list = ref([]);
const packages = ref([]);
const userStore = useUserStore();

// 对齐 uniCloud/delivery 云函数：dispatch(已支付→配送中) / setup(配送中→布置中) / recover(布置中|使用中→已完成)
const ACTION_MAP = {
  已支付: { label: '配送', fn: dispatch },
  配送中: { label: '布置', fn: setup },
  布置中: { label: '回收', fn: recover },
  使用中: { label: '回收', fn: recover },
};

function nextAction(status) {
  return ACTION_MAP[status] || { label: '无', fn: null };
}

async function loadPackages() {
  const res = await listPackages();
  packages.value = (res.data && res.data.packages) || [];
}
function pkgName(id) {
  const p = packages.value.find((x) => x.packageId === id);
  return p ? p.name : id;
}
function statusTagType(status) {
  if (status === '已完成') return 'success';
  return 'warning';
}

async function loadData() {
  const res = await deliveryList();
  list.value = (res.data && res.data.list) || [];
}

onMounted(async () => {
  await loadPackages();
  await loadData();
});

async function advance(row) {
  const action = nextAction(row.orderStatus);
  if (!action.fn) return;
  row._loading = true;
  try {
    const res = await action.fn({ orderId: row.orderId, operator: userStore.username || 'admin' });
    if (res.code === 0) {
      ElMessage.success(`已${action.label}`);
      await loadData();
    } else {
      ElMessage.error(res.message || '操作失败');
    }
  } finally {
    row._loading = false;
  }
}
</script>

<style scoped>
.page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-title { margin: 0; }
</style>
