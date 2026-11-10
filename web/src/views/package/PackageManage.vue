<template>
  <div>
    <div class="page-head">
      <h2 class="page-title">套餐管理</h2>
      <el-button type="primary" @click="openCreate">新增套餐</el-button>
    </div>

    <el-card shadow="never">
      <el-table :data="packages" border>
        <el-table-column prop="packageId" label="套餐ID" width="110" />
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column prop="price" label="价格(元)" width="90" />
        <el-table-column prop="seasonTheme" label="季节" width="80" />
        <el-table-column prop="reservableStart" label="可预约起" width="120" />
        <el-table-column prop="reservableEnd" label="可预约止" width="120" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.onShelf ? 'success' : 'info'">{{ row.onShelf ? '已上架' : '已下架' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link :type="row.onShelf ? 'warning' : 'success'" @click="toggleShelf(row)">
              {{ row.onShelf ? '下架' : '上架' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="套餐名称">
          <el-input v-model="form.name" placeholder="如 春日露营基础套餐" />
        </el-form-item>
        <el-form-item label="价格(元)">
          <el-input-number v-model="form.price" :min="0" :step="10" />
        </el-form-item>
        <el-form-item label="包含装备">
          <el-input v-model="form.items" type="textarea" :rows="2" placeholder="如 帐篷x1, 防潮垫x2" />
        </el-form-item>
        <el-form-item label="季节主题">
          <el-select v-model="form.seasonTheme" style="width: 160px">
            <el-option label="春季" value="春季" />
            <el-option label="夏季" value="夏季" />
            <el-option label="秋季" value="秋季" />
            <el-option label="冬季" value="冬季" />
          </el-select>
        </el-form-item>
        <el-form-item label="可预约起">
          <el-date-picker v-model="form.reservableStart" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="可预约止">
          <el-date-picker v-model="form.reservableEnd" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="封面图URL">
          <el-input v-model="form.bannerUrl" placeholder="可选" />
        </el-form-item>
        <el-form-item label="是否上架">
          <el-switch v-model="form.onShelf" />
        </el-form-item>
        <el-form-item label="关联装备">
          <div class="ref-list">
            <div v-for="(ref, i) in form.equipRefs" :key="i" class="ref-row">
              <el-select v-model="ref.equipmentId" placeholder="装备" style="width: 200px" filterable>
                <el-option v-for="e in equipOptions" :key="e.equipmentId" :label="`${e.name}(${e.equipmentId})`" :value="e.equipmentId" />
              </el-select>
              <el-input-number v-model="ref.qty" :min="1" :max="999" />
              <el-button link type="danger" @click="removeRef(i)">删除</el-button>
            </div>
            <el-button link type="primary" @click="addRef">+ 添加装备</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { listPackages, upsertPackage, setShelf } from '@/api/package';
import { equipmentList } from '@/api/equipment';
import { useUserStore } from '@/store/user';
import { ElMessage, ElMessageBox } from 'element-plus';

const packages = ref([]);
const equipOptions = ref([]);
const userStore = useUserStore();

const dialogVisible = ref(false);
const dialogTitle = ref('新增套餐');
const saving = ref(false);
const editingId = ref('');

const form = reactive({
  name: '',
  price: 0,
  items: '',
  seasonTheme: '春季',
  reservableStart: '',
  reservableEnd: '',
  bannerUrl: '',
  onShelf: true,
  equipRefs: [],
});

async function loadData() {
  const res = await listPackages();
  packages.value = (res.data && res.data.packages) || [];
}

onMounted(async () => {
  await loadData();
  const eqRes = await equipmentList();
  equipOptions.value = (eqRes.data && eqRes.data.list) || [];
});

function resetForm() {
  form.name = '';
  form.price = 0;
  form.items = '';
  form.seasonTheme = '春季';
  form.reservableStart = '';
  form.reservableEnd = '';
  form.bannerUrl = '';
  form.onShelf = true;
  form.equipRefs = [];
}

function openCreate() {
  editingId.value = '';
  resetForm();
  dialogTitle.value = '新增套餐';
  dialogVisible.value = true;
}

function openEdit(row) {
  editingId.value = row.packageId;
  form.name = row.name;
  form.price = row.price;
  form.items = row.items || '';
  form.seasonTheme = row.seasonTheme || '春季';
  form.reservableStart = row.reservableStart || '';
  form.reservableEnd = row.reservableEnd || '';
  form.bannerUrl = row.bannerUrl || '';
  form.onShelf = !!row.onShelf;
  form.equipRefs = (row.equipRefs || []).map((r) => ({ ...r }));
  dialogTitle.value = '编辑套餐';
  dialogVisible.value = true;
}

function addRef() {
  form.equipRefs.push({ equipmentId: '', qty: 1 });
}
function removeRef(i) {
  form.equipRefs.splice(i, 1);
}

async function onSave() {
  if (!form.name) {
    ElMessage.warning('请填写套餐名称');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...form,
      packageId: editingId.value,
      _operator: userStore.username || 'admin',
    };
    const res = await upsertPackage(payload);
    if (res.code === 0) {
      ElMessage.success('已保存');
      dialogVisible.value = false;
      await loadData();
    } else {
      ElMessage.error(res.message || '保存失败');
    }
  } finally {
    saving.value = false;
  }
}

async function toggleShelf(row) {
  try {
    await ElMessageBox.confirm(`确认将套餐「${row.name}」${row.onShelf ? '下架' : '上架'}？`, '提示', { type: 'warning' });
  } catch (e) {
    return;
  }
  const res = await setShelf({ packageId: row.packageId, onShelf: !row.onShelf, _operator: userStore.username });
  if (res.code === 0) {
    ElMessage.success('操作成功');
    await loadData();
  } else {
    ElMessage.error(res.message || '操作失败');
  }
}
</script>

<style scoped>
.page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-title { margin: 0; }
.ref-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
</style>
