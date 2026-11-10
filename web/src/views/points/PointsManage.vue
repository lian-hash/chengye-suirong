<template>
  <div>
    <div class="page-head">
      <h2 class="page-title">积分账户</h2>
      <el-button type="primary" @click="openGrant">手动调分</el-button>
    </div>

    <el-card shadow="never">
      <el-table :data="list" border>
        <el-table-column prop="userId" label="用户ID" width="180" />
        <el-table-column prop="nickname" label="昵称" min-width="140" />
        <el-table-column label="当前积分" width="120">
          <template #default="{ row }">
            <span class="pts">{{ row.points }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalEarn" label="累计获取" width="110" />
        <el-table-column prop="totalSpend" label="累计消耗" width="110" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewLogs(row)">查看流水</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 调分弹窗 -->
    <el-dialog v-model="grantVisible" title="手动调分" width="480px">
      <el-form :model="grantForm" label-width="100px">
        <el-form-item label="用户">
          <el-select v-model="grantForm.userId" style="width: 100%">
            <el-option v-for="u in list" :key="u.userId" :label="`${u.nickname}（${u.userId}）`" :value="u.userId" />
          </el-select>
        </el-form-item>
        <el-form-item label="调整积分">
          <el-input-number v-model="grantForm.points" :min="-9999" :max="9999" />
          <span class="tip">正数为加积分，负数为扣积分</span>
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="grantForm.reason" type="textarea" :rows="2" placeholder="如：活动补偿、违规扣减" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="grantVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onGrant">确认</el-button>
      </template>
    </el-dialog>

    <!-- 流水抽屉 -->
    <el-drawer v-model="logsVisible" :title="`积分流水 · ${currentNickname}`" size="520px">
      <el-table :data="logs" border size="small">
        <el-table-column label="变动" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.change >= 0 ? '#2e7d32' : '#e53935', fontWeight: 700 }">
              {{ row.change >= 0 ? '+' : '' }}{{ row.change }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" min-width="180" />
        <el-table-column prop="balance" label="余额" width="80" />
        <el-table-column prop="time" label="时间" width="160">
          <template #default="{ row }">{{ row.time.replace('T', ' ').slice(0, 16) }}</template>
        </el-table-column>
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { listPoints, listPointsLogs, grantPoints } from '@/api/points';
import { useUserStore } from '@/store/user';

const list = ref([]);
const logs = ref([]);
const userStore = useUserStore();

const grantVisible = ref(false);
const logsVisible = ref(false);
const saving = ref(false);
const currentNickname = ref('');

const grantForm = reactive({ userId: '', points: 100, reason: '' });

async function loadData() {
  const res = await listPoints();
  list.value = (res.data && res.data.list) || [];
}
onMounted(loadData);

function openGrant() {
  grantForm.userId = list.value[0] ? list.value[0].userId : '';
  grantForm.points = 100;
  grantForm.reason = '';
  grantVisible.value = true;
}
async function onGrant() {
  if (!grantForm.userId) { ElMessage.warning('请选择用户'); return; }
  if (grantForm.points === 0) { ElMessage.warning('调整积分不能为 0'); return; }
  saving.value = true;
  try {
    const res = await grantPoints({ ...grantForm, _operator: userStore.username || 'admin' });
    if (res.code === 0) {
      ElMessage.success('已调整');
      grantVisible.value = false;
      await loadData();
    }
  } finally { saving.value = false; }
}
async function viewLogs(row) {
  currentNickname.value = row.nickname;
  const res = await listPointsLogs({ userId: row.userId });
  logs.value = (res.data && res.data.list) || [];
  logsVisible.value = true;
}
</script>

<style scoped>
.page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-title { margin: 0; }
.pts { color: #2e7d32; font-weight: 700; font-size: 18px; }
.tip { margin-left: 10px; color: #999; font-size: 12px; }
</style>
