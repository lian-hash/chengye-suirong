<template>
  <div>
    <div class="page-head">
      <h2 class="page-title">我的订单 / 对账单</h2>
      <el-button @click="loadData">刷新</el-button>
    </div>
    <el-card shadow="never">
      <el-table :data="orders" border>
        <el-table-column prop="orderId" label="订单号" width="120" />
        <el-table-column label="套餐" min-width="140">
          <template #default="{ row }">{{ pkgName(row.packageId) }}</template>
        </el-table-column>
        <el-table-column prop="useDate" label="使用日期" width="120" />
        <el-table-column prop="quantity" label="份数" width="70" />
        <el-table-column prop="amount" label="金额(元)" width="90" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.orderStatus)">{{ row.orderStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isBatch" label="批量" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.isBatch" type="warning">是</el-tag>
            <span v-else>否</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" title="订单详情" width="560px">
      <el-descriptions v-if="current" :column="2" border>
        <el-descriptions-item label="订单号">{{ current.orderId }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ current.orderStatus }}</el-descriptions-item>
        <el-descriptions-item label="套餐">{{ pkgName(current.packageId) }}</el-descriptions-item>
        <el-descriptions-item label="场地">{{ current.siteId }}</el-descriptions-item>
        <el-descriptions-item label="使用日期">{{ current.useDate }}</el-descriptions-item>
        <el-descriptions-item label="份数">{{ current.quantity }}</el-descriptions-item>
        <el-descriptions-item label="金额(元)">{{ current.amount }}</el-descriptions-item>
        <el-descriptions-item label="支付状态">{{ current.payStatus }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ current.contactName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ current.contactPhone }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { orderList, orderDetail } from '@/api/order';
import { listPackages } from '@/api/package';
import { useUserStore } from '@/store/user';

const orders = ref([]);
const packages = ref([]);
const userStore = useUserStore();
const detailVisible = ref(false);
const current = ref(null);

async function loadPackages() {
  const res = await listPackages();
  packages.value = (res.data && res.data.packages) || [];
}
function pkgName(id) {
  const p = packages.value.find((x) => x.packageId === id);
  return p ? p.name : id;
}
function statusTagType(status) {
  if (status === '已取消' || status === '已退款') return 'info';
  if (status === '已支付' || status === '已完成') return 'success';
  return 'warning';
}

async function loadData() {
  const res = await orderList({ viewerRole: 'B端', page: { size: 999, num: 1 } });
  orders.value = (res.data && res.data.list) || [];
}

onMounted(async () => {
  await loadPackages();
  await loadData();
});

async function openDetail(row) {
  const res = await orderDetail(row.orderId);
  current.value = res.data && res.data.order;
  detailVisible.value = true;
}
</script>

<style scoped>
.page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-title { margin: 0; }
</style>
