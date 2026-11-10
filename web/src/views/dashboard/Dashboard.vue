<template>
  <div>
    <h2 class="page-title">数据概览</h2>
    <el-row :gutter="16">
      <el-col :span="6" v-for="s in stats" :key="s.label">
        <el-card shadow="hover">
          <div class="stat-label">{{ s.label }}</div>
          <div class="stat-value">{{ s.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="chart-card" shadow="never">
      <div ref="chartRef" class="chart"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { financeStats } from '@/api/finance';

const stats = ref([]);
const chartRef = ref(null);

onMounted(async () => {
  const res = await financeStats({ period: 'month' });
  const d = res.data || {};
  stats.value = [
    { label: '订单总数', value: d.orderCount ?? 0 },
    { label: '营收(元)', value: d.revenue ?? 0 },
    { label: '退款(元)', value: d.refundAmount ?? 0 },
    { label: '热门套餐', value: (d.topPackages && d.topPackages[0] && d.topPackages[0].name) || '-' },
  ];
  await nextTick();
  renderChart(d.topPackages || []);
});

function renderChart(topPackages) {
  if (!chartRef.value) return;
  const chart = echarts.init(chartRef.value);
  chart.setOption({
    title: { text: '热门套餐销量' },
    tooltip: {},
    xAxis: { type: 'category', data: topPackages.map((p) => p.name) },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: topPackages.map((p) => p.count), itemStyle: { color: '#2e7d32' } }],
  });
}
</script>

<style scoped>
.page-title { margin: 0 0 16px; }
.stat-label { color: #999; font-size: 13px; }
.stat-value { font-size: 26px; font-weight: 700; color: #2e7d32; margin-top: 8px; }
.chart-card { margin-top: 16px; }
.chart { height: 320px; }
</style>
