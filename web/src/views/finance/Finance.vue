<template>
  <div>
    <div class="page-head">
      <h2 class="page-title">财务管理</h2>
      <div class="filter">
        <el-select v-model="period" style="width: 120px" @change="loadData">
          <el-option label="按日" value="day" />
          <el-option label="按周" value="week" />
          <el-option label="按月" value="month" />
          <el-option label="自定义" value="custom" />
        </el-select>
        <el-date-picker
          v-if="period === 'custom'"
          v-model="customRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="起"
          end-placeholder="止"
          @change="loadData"
        />
        <el-button type="primary" @click="onExport">导出对账单(CSV)</el-button>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-label">订单总数(已支付)</div>
          <div class="stat-value">{{ stats.orderCount ?? 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-label">营收(元)</div>
          <div class="stat-value">{{ stats.revenue ?? 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-label">退款(元)</div>
          <div class="stat-value">{{ stats.refundAmount ?? 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" style="margin-top: 16px">
      <template #header><span>对账单明细</span></template>
      <el-table :data="statement" border>
        <el-table-column prop="orderId" label="订单号" width="130" />
        <el-table-column prop="packageName" label="套餐" min-width="140" />
        <el-table-column prop="useDate" label="使用日期" width="120" />
        <el-table-column prop="quantity" label="份数" width="70" />
        <el-table-column prop="amount" label="金额(元)" width="100" />
        <el-table-column prop="payTime" label="支付时间" width="200" />
        <el-table-column prop="contactName" label="联系人" />
      </el-table>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px">
      <template #header><span>热门套餐排行</span></template>
      <el-table :data="stats.topPackages || []" border>
        <el-table-column prop="packageId" label="套餐ID" width="120" />
        <el-table-column prop="name" label="套餐" min-width="140" />
        <el-table-column prop="count" label="订单数" width="100" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { financeStats } from '@/api/finance';
import { ElMessage } from 'element-plus';

const period = ref('month');
const customRange = ref([]);
const stats = ref({});
const statement = ref([]);

async function loadData() {
  const params = { period: period.value };
  if (period.value === 'custom' && customRange.value && customRange.value.length === 2) {
    params.start = customRange.value[0];
    params.end = customRange.value[1];
  }
  const res = await financeStats(params);
  stats.value = res.data || {};
  statement.value = (res.data && res.data.orders) || [];
}

onMounted(loadData);

function onExport() {
  if (!statement.value.length) {
    ElMessage.warning('暂无可导出的对账单');
    return;
  }
  const headers = ['订单号', '套餐', '使用日期', '份数', '金额(元)', '支付时间', '联系人'];
  const rows = statement.value.map((o) => [o.orderId, o.packageName, o.useDate, o.quantity, o.amount, o.payTime, o.contactName]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `对账单_${period.value}_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success('对账单已导出');
}
</script>

<style scoped>
.page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-title { margin: 0; }
.filter { display: flex; gap: 8px; align-items: center; }
.stat-label { color: #999; font-size: 13px; }
.stat-value { font-size: 26px; font-weight: 700; color: #2e7d32; margin-top: 8px; }
</style>
