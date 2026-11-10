<template>
  <div>
    <h2 class="page-title">订单管理</h2>

    <el-card shadow="never" class="filter-card">
      <el-form :inline="true">
        <el-form-item label="订单号">
          <el-input v-model="filter.orderId" placeholder="模糊查询" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filter.orderStatus" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="使用日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="起"
            end-placeholder="止"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px">
      <el-table :data="orders" border>
        <el-table-column prop="orderId" label="订单号" width="120" />
        <el-table-column label="套餐" min-width="140">
          <template #default="{ row }">{{ pkgName(row.packageId) }}</template>
        </el-table-column>
        <el-table-column label="场地" min-width="140">
          <template #default="{ row }">{{ siteName(row.siteId) }}</template>
        </el-table-column>
        <el-table-column prop="useDate" label="使用日期" width="120" />
        <el-table-column prop="quantity" label="份数" width="70" />
        <el-table-column prop="amount" label="金额(元)" width="90" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.orderStatus)">{{ row.orderStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payStatus" label="支付" width="90" />
        <el-table-column prop="contactName" label="联系人" width="110" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button v-if="isAdmin" link type="warning" :disabled="row.orderStatus === '已取消' || row.orderStatus === '已退款'" @click="onCancel(row)">取消</el-button>
            <el-button v-if="isAdmin" link type="danger" :disabled="row.payStatus !== '已支付'" @click="onRefund(row)">退款</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" title="订单详情" width="620px">
      <template v-if="current">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ current.orderId }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(current.orderStatus)">{{ current.orderStatus }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="套餐">{{ pkgName(current.packageId) }}</el-descriptions-item>
          <el-descriptions-item label="场地">{{ siteName(current.siteId) }}</el-descriptions-item>
          <el-descriptions-item label="使用日期">{{ current.useDate }}</el-descriptions-item>
          <el-descriptions-item label="份数">{{ current.quantity }}</el-descriptions-item>
          <el-descriptions-item label="金额(元)">{{ current.amount }}</el-descriptions-item>
          <el-descriptions-item label="支付状态">{{ current.payStatus }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ current.contactName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ current.contactPhone }}</el-descriptions-item>
          <el-descriptions-item label="批量订单">{{ current.isBatch ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ current.createTime }}</el-descriptions-item>
        </el-descriptions>

        <div class="timeline-wrap">
          <h4>状态时间线</h4>
          <el-steps :active="timelineActive" align-center finish-status="success">
            <el-step v-for="s in ORDER_FLOW" :key="s" :title="s" />
          </el-steps>
          <p v-if="isTerminal(current.orderStatus)" class="terminal-note">
            该订单已终止于「{{ current.orderStatus }}」
          </p>
        </div>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { orderList, orderDetail, orderCancel, orderRefund } from '@/api/order';
import { listPackages, siteList } from '@/api/package';
import { useUserStore } from '@/store/user';
import { ElMessage, ElMessageBox } from 'element-plus';

const userStore = useUserStore();
const isAdmin = computed(() => userStore.role === '管理员');

const ORDER_FLOW = ['待支付', '已支付', '配送中', '布置中', '使用中', '已回收', '已完成'];
const statusOptions = ['待支付', '已支付', '配送中', '布置中', '使用中', '已回收', '已完成', '已取消', '已退款'];

const orders = ref([]);
const packages = ref([]);
const sites = ref([]);

const filter = reactive({ orderId: '', orderStatus: '', dateStart: '', dateEnd: '' });
const dateRange = ref([]);

const detailVisible = ref(false);
const current = ref(null);

async function loadPackages() {
  const res = await listPackages();
  packages.value = (res.data && res.data.packages) || [];
  sites.value = (res.data && res.data.sites) || [];
}

async function loadData() {
  if (dateRange.value && dateRange.value.length === 2) {
    filter.dateStart = dateRange.value[0];
    filter.dateEnd = dateRange.value[1];
  } else {
    filter.dateStart = '';
    filter.dateEnd = '';
  }
  const res = await orderList({ filter, page: { size: 999, num: 1 }, viewerRole: userStore.role });
  orders.value = (res.data && res.data.list) || [];
}

onMounted(async () => {
  await loadPackages();
  await loadData();
});

function pkgName(id) {
  const p = packages.value.find((x) => x.packageId === id);
  return p ? p.name : id;
}
function siteName(id) {
  const s = sites.value.find((x) => x.siteId === id);
  return s ? s.name : id;
}
function statusTagType(status) {
  if (status === '已取消' || status === '已退款') return 'info';
  if (status === '已支付' || status === '已完成') return 'success';
  return 'warning';
}
function isTerminal(status) {
  return status === '已取消' || status === '已退款';
}
const timelineActive = computed(() => {
  if (!current.value) return 0;
  if (isTerminal(current.value.orderStatus)) return 0;
  const idx = ORDER_FLOW.indexOf(current.value.orderStatus);
  return idx === -1 ? 0 : idx + 1;
});

function resetFilter() {
  filter.orderId = '';
  filter.orderStatus = '';
  filter.dateStart = '';
  filter.dateEnd = '';
  dateRange.value = [];
  loadData();
}

async function openDetail(row) {
  const res = await orderDetail(row.orderId);
  current.value = res.data && res.data.order;
  detailVisible.value = true;
}

async function onCancel(row) {
  try {
    await ElMessageBox.confirm(`确认取消订单 ${row.orderId}？`, '提示', { type: 'warning' });
  } catch (e) {
    return;
  }
  const res = await orderCancel({ orderId: row.orderId, _operator: userStore.username });
  if (res.code === 0) {
    ElMessage.success('已取消');
    await loadData();
  } else {
    ElMessage.error(res.message || '操作失败');
  }
}

async function onRefund(row) {
  try {
    await ElMessageBox.confirm(`确认对订单 ${row.orderId} 退款 ¥${row.amount}？`, '提示', { type: 'warning' });
  } catch (e) {
    return;
  }
  const res = await orderRefund({ orderId: row.orderId, _operator: userStore.username });
  if (res.code === 0) {
    ElMessage.success('已退款');
    await loadData();
  } else {
    ElMessage.error(res.message || '操作失败');
  }
}
</script>

<style scoped>
.page-title { margin: 0 0 16px; }
.filter-card :deep(.el-form-item) { margin-bottom: 0; }
.timeline-wrap { margin-top: 20px; }
.timeline-wrap h4 { margin: 0 0 12px; }
.terminal-note { color: #999; margin-top: 12px; }
</style>
