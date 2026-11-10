<template>
  <div>
    <div class="page-head">
      <h2 class="page-title">场地管理</h2>
      <el-button type="primary" @click="openCreate">新增场地</el-button>
    </div>

    <el-card shadow="never">
      <el-table :data="sites" border>
        <el-table-column prop="siteId" label="场地ID" width="110" />
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column prop="address" label="地址" min-width="200" />
        <el-table-column prop="capacity" label="容量" width="80" />
        <el-table-column prop="availableStatus" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.availableStatus === '可用' ? 'success' : 'danger'">{{ row.availableStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="partner" label="合作方" width="160" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="场地名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" />
        </el-form-item>
        <el-form-item label="容量">
          <el-input-number v-model="form.capacity" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.availableStatus" style="width: 160px">
            <el-option label="可用" value="可用" />
            <el-option label="停用" value="停用" />
          </el-select>
        </el-form-item>
        <el-form-item label="合作方">
          <el-input v-model="form.partner" />
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
import { ref, reactive, onMounted } from 'vue';
import { siteList, upsertSite } from '@/api/package';
import { useUserStore } from '@/store/user';
import { ElMessage } from 'element-plus';

const sites = ref([]);
const userStore = useUserStore();

const dialogVisible = ref(false);
const dialogTitle = ref('新增场地');
const saving = ref(false);
const editingId = ref('');

const form = reactive({
  name: '',
  address: '',
  capacity: 0,
  availableStatus: '可用',
  partner: '',
});

async function loadData() {
  const res = await siteList();
  sites.value = (res.data && res.data.list) || [];
}

onMounted(loadData);

function resetForm() {
  form.name = '';
  form.address = '';
  form.capacity = 0;
  form.availableStatus = '可用';
  form.partner = '';
}

function openCreate() {
  editingId.value = '';
  resetForm();
  dialogTitle.value = '新增场地';
  dialogVisible.value = true;
}

function openEdit(row) {
  editingId.value = row.siteId;
  form.name = row.name;
  form.address = row.address;
  form.capacity = row.capacity;
  form.availableStatus = row.availableStatus;
  form.partner = row.partner;
  dialogTitle.value = '编辑场地';
  dialogVisible.value = true;
}

async function onSave() {
  if (!form.name) {
    ElMessage.warning('请填写场地名称');
    return;
  }
  saving.value = true;
  try {
    const payload = { ...form, siteId: editingId.value, _operator: userStore.username || 'admin' };
    const res = await upsertSite(payload);
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
</script>

<style scoped>
.page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-title { margin: 0; }
</style>
