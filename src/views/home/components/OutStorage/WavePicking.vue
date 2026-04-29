<template>
  <div class="md3-page">
    <md-elevated-card class="md3-card">
    <div class="filter-card">
      <div class="filter-row">
        <div class="filter-col">
          <label>波次状态：</label>
          <md-outlined-select v-model="filter.status" style="width: 200px;">
            <md-select-option value="">
              <div slot="headline">请选择状态</div>
            </md-select-option>
            <md-select-option value="Pending">
              <div slot="headline">待拣货</div>
            </md-select-option>
            <md-select-option value="Completed">
              <div slot="headline">已完成</div>
            </md-select-option>
          </md-outlined-select>
        </div>
      </div>
      <div class="filter-actions">
        <md-filled-button :disabled="loading" @click="fetchWaves">
          <span v-if="!loading">查询</span>
          <span v-else class="md3-btn-loading">
            <md-circular-progress indeterminate></md-circular-progress>
            查询中
          </span>
        </md-filled-button>
        <md-filled-tonal-button @click="handleRecommend">
          <md-icon slot="icon">auto_awesome</md-icon>
          智能推荐波次
        </md-filled-tonal-button>
      </div>
    </div>
    </md-elevated-card>

    <!-- 波次列表 -->
    <md-elevated-card class="md3-card md3-table-card">
    <div class="table-container">
      <table class="md3-table" style="width: 100%">
        <thead>
          <tr>
            <th width="150">波次编号</th>
            <th width="120">创建人</th>
            <th width="100">包含订单数</th>
            <th width="100">已拣订单</th>
            <th width="180">创建时间</th>
            <th width="100">状态</th>
            <th width="200">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" style="text-align: center">加载中...</td></tr>
          <tr v-else-if="!tableData.length"><td colspan="7" style="text-align: center">暂无数据</td></tr>
          <tr v-for="(row, index) in tableData" :key="row.WaveID" :class="index % 2 === 0 ? 'even-row' : 'odd-row'">
            <td>{{ row.WaveNo }}</td>
            <td>{{ row.CreatorName }}</td>
            <td align="center">{{ row.TotalOrders }}</td>
            <td align="center">{{ row.PickedOrders }}</td>
            <td>{{ formatTime(row.CreatedTime) }}</td>
            <td>
              <span :class="['status-tag', row.Status === 'Completed' ? 'success' : 'warning']">
                {{ row.Status === 'Completed' ? '已完成' : '待拣货' }}
              </span>
            </td>
            <td align="center">
              <md-text-button v-if="row.Status !== 'Completed'" class="action-link" @click="startPicking(row)">
                开始拣货
              </md-text-button>
              <md-text-button v-if="row.Status !== 'Completed'" class="action-link success" @click="completeWave(row)">
                完成
              </md-text-button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination-container">
        <MdPagination
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          :total="total"
          @size-change="fetchWaves"
          @current-change="fetchWaves"
        />
      </div>
    </div>
    </md-elevated-card>

    <!-- 智能推荐弹窗 -->
    <md-dialog :open="recommendDialogVisible" @closed="recommendDialogVisible = false">
      <div slot="headline">智能推荐波次</div>
      <div slot="content">
        <div class="alert alert-info">
          系统已根据出库单包含的物料和库位相似度自动打包了以下波次
        </div>
        <table class="md3-table" style="width: 100%; margin-top: 15px;">
          <thead>
            <tr>
              <th width="180">推荐波次名称</th>
              <th>包含的出库单</th>
              <th width="120">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in recommendedWaves" :key="index">
              <td>{{ row.WaveName }}</td>
              <td>
                <div class="tag-container">
                  <span class="status-tag info" v-for="order in row.OutboundOrders" :key="order.OutboundID" style="margin-right: 5px; margin-bottom: 5px;">
                    {{ order.OutboundNo }} (库位: {{ order.LocationsCount }})
                  </span>
                </div>
              </td>
              <td>
                <md-text-button @click="createWaveFromRecommend(row)">生成波次</md-text-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div slot="actions">
        <md-text-button @click="recommendDialogVisible = false">关闭</md-text-button>
      </div>
    </md-dialog>

    <!-- 拣货作业地图弹窗 -->
    <md-dialog :open="pickingDialogVisible" @closed="pickingDialogVisible = false">
      <div slot="headline">波次拣货作业地图 (PDA 模拟视图)</div>
      <div slot="content">
        <div class="alert alert-success" style="margin-bottom: 15px;">
          请根据系统规划的 3D/2D 最优路径前往对应库位取货
        </div>
        
        <!-- 引入刚刚编写的可视化组件 -->
        <PickPathMap :locations="pickLocations" />
        
        <div class="divider">当前库位拣货任务清单</div>
        
        <div style="max-height: 250px; overflow-y: auto;">
          <table class="md3-table" style="width: 100%;">
            <thead>
              <tr>
                <th width="150">目标库位</th>
                <th>任务明细</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in pickLocations" :key="index" :class="index % 2 === 0 ? 'even-row' : 'odd-row'">
                <td>{{ row.LocationCode }}</td>
                <td>
                  <div v-for="(task, idx) in row.tasks" :key="idx">
                    {{ task.ItemName }} - 需取: <b>{{ task.Quantity }}</b> (订单: {{ task.OutboundNo }})
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div slot="actions">
        <md-text-button @click="pickingDialogVisible = false">关闭地图</md-text-button>
        <md-filled-button @click="completeWave(currentWave)">已完成本波次拣货</md-filled-button>
      </div>
    </md-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import moment from 'moment';
import api from '@/api';
import PickPathMap from '../PickPathMap.vue';
import { notifyError, notifyInfo, notifySuccess } from '@/utils/notify'
import MdPagination from '@/components/MdPagination.vue';

const filter = reactive({ status: '' });
const tableData = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(false);

const recommendDialogVisible = ref(false);
const recommendedWaves = ref([]);

const pickingDialogVisible = ref(false);
const currentWave = ref(null);
const pickLocations = ref([]);

const formatTime = (time) => time ? moment(time).format('YYYY-MM-DD HH:mm:ss') : '-';

// 获取波次列表
const fetchWaves = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      status: filter.status
    };
    const res = await api.get('/api/waves', { params });
    tableData.value = res.data.data.items || [];
    total.value = res.data.data.total || 0;
  } catch (error) {
    notifyError('获取波次列表失败');
  } finally {
    loading.value = false;
  }
};

// 智能推荐
const handleRecommend = async () => {
  try {
    const res = await api.post('/api/waves/recommend');
    if (res.data.code === 200 && res.data.data.length > 0) {
      recommendedWaves.value = res.data.data;
      recommendDialogVisible.value = true;
    } else {
      notifyInfo('暂无待出库订单需要推荐');
    }
  } catch (error) {
    notifyError('推荐波次失败');
  }
};

// 从推荐生成波次
const createWaveFromRecommend = async (row) => {
  try {
    const outboundIds = row.OutboundOrders.map(o => o.OutboundID);
    const res = await api.post('/api/waves', {
      outboundIds,
      remark: '来自系统智能推荐'
    });
    if (res.data.code === 200) {
      notifySuccess('波次生成成功');
      recommendDialogVisible.value = false;
      fetchWaves();
    }
  } catch (error) {
    notifyError('波次生成失败');
  }
};

// 开始拣货（打开 3D 路径地图）
const startPicking = async (row) => {
  currentWave.value = row;
  try {
    const res = await api.get(`/api/waves/${row.WaveID}/pick-map`);
    if (res.data.code === 200) {
      // res.data.data 返回了带有 tasks 的 location 数组
      pickLocations.value = res.data.data;
      pickingDialogVisible.value = true;
    }
  } catch (error) {
    notifyError('获取拣货路径地图失败');
  }
};

// 完成波次
const completeWave = async (row) => {
  if (!row) return;
  try {
    if(!window.confirm(`确认该波次 [${row.WaveNo}] 的拣货已全部完成吗？`)) return;
    const res = await api.put(`/api/waves/${row.WaveID}/complete`);
    if (res.data.code === 200) {
      notifySuccess('波次拣货已完成');
      pickingDialogVisible.value = false;
      fetchWaves();
    }
  } catch (error) {
    if (error !== 'cancel') {
      notifyError('操作失败');
    }
  }
};

onMounted(() => {
  fetchWaves();
});
</script>

<style scoped>
.md3-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.md3-card {
  border-radius: 24px;
  overflow: hidden;
  background: var(--md-sys-color-surface-container-lowest);
  padding: 14px;
}

.md3-table-card {
  padding: 0;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.filter-col {
  display: flex;
  align-items: center;
}
.filter-col label {
  width: 80px;
  text-align: right;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 14px;
  font-weight: 700;
}
.filter-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.md3-btn-loading {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.md3-btn-loading md-circular-progress {
  --md-circular-progress-size: 18px;
}

.table-container {
  flex-grow: 1;
  overflow: auto;
}

.md3-table {
  border-collapse: collapse;
  th {
    background-color: #f8f9fc;
    color: #333;
    font-weight: 600;
    padding: 12px;
    border-bottom: 2px solid #e4e7ed;
    font-size: 14px;
    text-align: left;
  }
  td {
    padding: 12px;
    color: #444;
    font-size: 14px;
    border-bottom: 1px solid #e4e7ed;
  }
  tr:hover {
    background-color: #f5f7fa;
  }
  .even-row {
    background-color: #fafafa;
  }
  .odd-row {
    background-color: #ffffff;
  }
}

.pagination-container {
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--md-sys-color-outline-variant);
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.status-tag.warning {
  background-color: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #faecd8;
}
.status-tag.success {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}
.status-tag.info {
  background-color: #f4f4f5;
  color: #909399;
  border: 1px solid #e9e9eb;
}

.action-link {
  --md-text-button-label-text-size: 14px;
}
.action-link.success {
  --md-text-button-label-text-color: #67c23a;
}

.alert {
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 14px;
}
.alert-info {
  background-color: #f4f4f5;
  color: #909399;
}
.alert-success {
  background-color: #f0f9eb;
  color: #67c23a;
}

.divider {
  margin: 24px 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--md-sys-color-primary);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  padding-bottom: 8px;
}

.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
