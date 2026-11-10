<template>
  <div>
    <div class="page-head">
      <h2 class="page-title">优惠券管理</h2>
      <el-button type="primary" @click="openCreate">新增优惠券</el-button>
    </div>

    <el-card shadow="never">
      <el-table :data="list" border>
        <el-table-column prop="couponId" label="券码" width="140" />
        <el-table-column prop="name" label="名称" min-width="160" />
        <el-table-column label="面额" width="110">
          <template #default="{ row }">
            <span class="amt">¥{{ row.value }}</span>
          </template>
        </el-table-column>
        <el-table-column label="使用门槛" width="120">
          <template #default="{ row }">
            {{ row.threshold > 0 ? `满 ¥${row.threshold} 可用` : '无门槛' }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column label="发放/领取/使用" width="160">
          <template #default="{ row }">
            {{ row.sentCount }} / {{ row.sentCount - row.usedCount }} / {{ row.usedCount }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.onShelf ? 'success' : 'info'">{{ row.onShelf ? '已上架' : '已下架' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link :type="row.onShelf ? 'warning' : 'success'" @click="onToggle(row)">
              {{ row.onShelf ? '下架' : '上架' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="券码">
          <el-input v-model="form.couponId" :disabled="!!editingId" placeholder="如 CP_NEW20（新增时可留空自动生成）" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="面额（元）">
          <el-input-number v-model="form.value" :min="1" :max="500" />
        </el-form-item>
        <el-form-item label="使用门槛（元）">
          <el-input-number v-model="form.threshold" :min="0" :max="9999" />
          <span class="tip">0 表示无门槛</span>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width: 200px">
            <el-option label="新人券" value="新人券" />
            <el-option label="满减券" value="满减券" />
            <el-option label="团建券" value="团建券" />
            <el-option label="节日券" value="节日券" />
          </el-select>
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="form.totalStock" :min="1" :max="99999" />
        </el-form-item>
        <el-form-item label="有效期（天）">
          <el-input-number v-model="form.validDays" :min="1" :max="180" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.desc" type="textarea" :rows="2" />
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { listCoupons, upsertCoupon, setCouponShelf } from '@/api/coupon';
import { useUserStore } from '@/store/user';

const list = ref([]);
const userStore = useUserStore();
const dialogVisible = ref(false);
const dialogTitle = ref('新增优惠券');
const saving = ref(false);
const editingId = ref('');

const form = reactive({
  couponId: '', name: '', value: 20, threshold: 0,
  type: '满减券', totalStock: 1000, validDays: 30, desc: '',
});

async function loadData() {
  const res = await listCoupons();
  list.value = (res.data && res.data.list) || [];
}
onMounted(loadData);

function resetForm() {
  Object.assign(form, { couponId: '', name: '', value: 20, threshold: 0, type: '满减券', totalStock: 1000, validDays: 30, desc: '' });
}
function openCreate() {
  editingId.value = ''; resetForm();
  dialogTitle.value = '新增优惠券';
  dialogVisible.value = true;
}
function openEdit(row) {
  editingId.value = row.couponId;
  Object.assign(form, row);
  dialogTitle.value = '编辑优惠券';
  dialogVisible.value = true;
}
async function onSave() {
  if (!form.name) { ElMessage.warning('请填写券名称'); return; }
  saving.value = true;
  try {
    const payload = { ...form, couponId: editingId.value || form.couponId, _operator: userStore.username || 'admin' };
    const res = await upsertCoupon(payload);
    if (res.code === 0) {
      ElMessage.success('已保存');
      dialogVisible.value = false;
      await loadData();
    }
  } finally { saving.value = false; }
}
async function onToggle(row) {
  const action = row.onShelf ? '下架' : '上架';
  await ElMessageBox.confirm(`确定${action}优惠券「${row.name}」吗？`, '提示', { type: 'warning' });
  const res = await setCouponShelf({ couponId: row.couponId, onShelf: !row.onShelf, _operator: userStore.username || 'admin' });
  if (res.code === 0) {
    ElMessage.success(`已${action}`);
    await loadData();
  }
}
</script>

<style scoped>
.page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-title { margin: 0; }
.amt { color: #ff8f3f; font-weight: 700; }
.tip { margin-left: 10px; color: #999; font-size: 12px; }
</style>
