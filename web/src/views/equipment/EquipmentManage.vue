<template>
  <div>
    <div class="page-head">
      <h2 class="page-title">装备管理</h2>
      <el-button type="primary" @click="lowStockVisible = true">低库存预警</el-button>
    </div>
    <el-card shadow="never">
      <el-table :data="list" border>
        <el-table-column prop="equipmentId" label="装备ID" width="110" />
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="totalQty" label="总量" width="70" />
        <el-table-column label="可用" width="80">
          <template #default="{ row }">
            <span :class="{ 'low-stock': row.availableQty <= row.warnThreshold }">{{ row.availableQty }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="warnThreshold" label="预警阈值" width="100" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === '可用' ? 'success' : 'danger'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="disinfectStatus" label="消杀状态" width="100" />
        <el-table-column prop="lastDisinfectTime" label="最近消杀" width="180" />
        <el-table-column prop="usedCount" label="复用次数" width="100" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="success" @click="onDisinfect(row)">消杀登记</el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="lowStockVisible" title="低库存预警" width="520px">
      <el-table :data="lowStockList" border empty-text="无低库存装备">
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="availableQty" label="可用" width="80" />
        <el-table-column prop="warnThreshold" label="阈值" width="80" />
      </el-table>
    </el-dialog>

    <el-dialog v-model="editVisible" title="编辑装备" width="480px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 160px">
            <el-option label="可用" value="可用" />
            <el-option label="停用" value="停用" />
            <el-option label="报废" value="报废" />
          </el-select>
        </el-form-item>
        <el-form-item label="可用数量">
          <el-input-number v-model="form.availableQty" :min="0" :max="form.totalQty" />
        </el-form-item>
        <el-form-item label="预警阈值">
          <el-input-number v-model="form.warnThreshold" :min="0" :max="form.totalQty" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSaveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { equipmentList, disinfect, equipmentUpdate } from '@/api/equipment';
import { useUserStore } from '@/store/user';
import { ElMessage } from 'element-plus';

const list = ref([]);
const userStore = useUserStore();
const lowStockVisible = ref(false);
const editVisible = ref(false);
const saving = ref(false);

const lowStockList = computed(() => list.value.filter((e) => e.availableQty <= e.warnThreshold));

const form = reactive({ equipmentId: '', status: '可用', availableQty: 0, warnThreshold: 0, totalQty: 0 });

async function loadData() {
  const res = await equipmentList();
  list.value = (res.data && res.data.list) || [];
}

onMounted(loadData);

async function onDisinfect(row) {
  const res = await disinfect({ equipmentId: row.equipmentId, _operator: userStore.username });
  if (res.code === 0) {
    ElMessage.success('消杀登记成功');
    await loadData();
  } else {
    ElMessage.error(res.message || '操作失败');
  }
}

function openEdit(row) {
  form.equipmentId = row.equipmentId;
  form.status = row.status;
  form.availableQty = row.availableQty;
  form.warnThreshold = row.warnThreshold;
  form.totalQty = row.totalQty;
  editVisible.value = true;
}

async function onSaveEdit() {
  saving.value = true;
  try {
    const res = await equipmentUpdate({
      equipmentId: form.equipmentId,
      status: form.status,
      availableQty: form.availableQty,
      warnThreshold: form.warnThreshold,
      _operator: userStore.username,
    });
    if (res.code === 0) {
      ElMessage.success('已保存');
      editVisible.value = false;
      await loadData();
    } else {
      ElMessage.error(res.message || '保存失败');
    }
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-title { margin: 0; }
.low-stock { color: #f56c6c; font-weight: 700; }
</style>
