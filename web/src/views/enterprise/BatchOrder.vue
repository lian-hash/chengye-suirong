<template>
  <div>
    <h2 class="page-title">企业批量下单</h2>
    <el-alert type="info" :closable="false" title="B端企业客户批量下单入口（复用 order/batchCreate，isBatch=true）。可一次提交多条明细，每条明细生成一笔订单。" />
    <el-card shadow="never" style="margin-top: 16px">
      <el-form label-width="90px" style="max-width: 720px">
        <el-form-item label="联系人">
          <el-input v-model="contactName" placeholder="企业对接人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="contactPhone" placeholder="11 位手机号" />
        </el-form-item>

        <el-divider>下单明细</el-divider>

        <div v-for="(d, i) in details" :key="i" class="detail-row">
          <el-select v-model="d.packageId" placeholder="套餐" style="width: 200px" filterable>
            <el-option v-for="p in packages" :key="p.packageId" :label="`${p.name} ¥${p.price}`" :value="p.packageId" />
          </el-select>
          <el-select v-model="d.siteId" placeholder="场地" style="width: 200px" filterable>
            <el-option v-for="s in sites" :key="s.siteId" :label="s.name" :value="s.siteId" />
          </el-select>
          <el-date-picker v-model="d.useDate" type="date" value-format="YYYY-MM-DD" placeholder="使用日期" />
          <el-input-number v-model="d.quantity" :min="1" :max="999" />
          <el-button link type="danger" @click="removeDetail(i)">删除</el-button>
        </div>
        <el-button link type="primary" @click="addDetail">+ 添加明细</el-button>

        <el-form-item style="margin-top: 16px">
          <el-button type="primary" :loading="submitting" @click="onSubmit">提交批量订单</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { listPackages, siteList } from '@/api/package';
import { batchCreate } from '@/api/order';
import { useUserStore } from '@/store/user';
import { ElMessage } from 'element-plus';

const packages = ref([]);
const sites = ref([]);
const userStore = useUserStore();

const contactName = ref('');
const contactPhone = ref('');
const submitting = ref(false);
const details = reactive([{ packageId: '', siteId: '', useDate: '', quantity: 1 }]);

async function loadOptions() {
  const res = await listPackages();
  packages.value = (res.data && res.data.packages) || [];
  sites.value = (res.data && res.data.sites) || [];
}

onMounted(loadOptions);

function addDetail() {
  details.push({ packageId: '', siteId: '', useDate: '', quantity: 1 });
}
function removeDetail(i) {
  details.splice(i, 1);
}

async function onSubmit() {
  if (details.length === 0) {
    ElMessage.warning('请至少添加一条明细');
    return;
  }
  for (const d of details) {
    if (!d.packageId || !d.siteId || !d.useDate) {
      ElMessage.warning('请完善每条明细的套餐/场地/使用日期');
      return;
    }
  }
  submitting.value = true;
  try {
    const res = await batchCreate({
      details: details.map((d) => ({ ...d })),
      contactName: contactName.value,
      contactPhone: contactPhone.value,
      userId: userStore.username === '系统管理员' ? 'ent' : (userStore.username || 'ent'),
    });
    if (res.code === 0) {
      ElMessage.success(`批量订单已提交，共 ${res.data.count} 笔`);
      details.splice(0, details.length, { packageId: '', siteId: '', useDate: '', quantity: 1 });
      contactName.value = '';
      contactPhone.value = '';
    } else {
      ElMessage.error(res.message || '提交失败');
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.page-title { margin: 0 0 16px; }
.detail-row { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }
</style>
