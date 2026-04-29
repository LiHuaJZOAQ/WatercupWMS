
<template>
  <div class="md3-page">
    <!-- 查询条件区域 -->
    <md-elevated-card class="md3-card">
    <div class="filter-card">
      <div class="filter-row">
        <div class="filter-col">
          <label>出库单号：</label>
          <md-outlined-text-field v-model="filter.outboundNo" placeholder="请输入单号" />
        </div>
        <div class="filter-col">
          <label>状态：</label>
          <md-outlined-select v-model="filter.status">
            <md-select-option value="">
              <div slot="headline">请选择</div>
            </md-select-option>
            <md-select-option value="Draft"><div slot="headline">草稿</div></md-select-option>
            <md-select-option value="Pending"><div slot="headline">待处理</div></md-select-option>
            <md-select-option value="Completed"><div slot="headline">已完成</div></md-select-option>
            <md-select-option value="Cancelled"><div slot="headline">已取消</div></md-select-option>
          </md-outlined-select>
        </div>
        <div class="filter-col" style="flex: 2;">
          <MdDateRange
            v-model="dateRange"
            start-label="出库日期(起)"
            end-label="出库日期(止)"
            style="width: 100%"
          />
        </div>
      </div>
      <div class="filter-actions">
        <md-filled-button :disabled="loading" @click="fetchData">
          <span v-if="!loading">查询</span>
          <span v-else class="md3-btn-loading">
            <md-circular-progress indeterminate></md-circular-progress>
            查询中
          </span>
        </md-filled-button>
        <md-text-button @click="resetFilter">重置</md-text-button>
      </div>
    </div>
    </md-elevated-card>

    <!-- 操作按钮区域 -->
    <md-elevated-card class="md3-card md3-card--tight">
      <div class="action-card">
        <div class="action-title">通用出库单</div>
        <div class="action-buttons">
          <md-filled-tonal-button @click="handleCreate">
            <md-icon slot="icon">add</md-icon>
            新建
          </md-filled-tonal-button>
          <md-filled-button :disabled="!selectedRows.length" @click="handlePrint">
            <md-icon slot="icon">print</md-icon>
            打印
          </md-filled-button>
        </div>
      </div>
    </md-elevated-card>

    <!-- 表格数据区域 -->
    <md-elevated-card class="md3-card md3-table-card">
    <div class="data-container">
      <table class="md3-table" style="width: 100%">
        <thead>
          <tr>
            <th width="55"><input type="checkbox" @change="toggleAllSelection($event)" :checked="isAllSelected" /></th>
            <th width="160">出库单号</th>
            <th width="120">出库类型</th>
            <th>往来单位</th>
            <th>仓库</th>
            <th width="120">总数量</th>
            <th width="120">总金额</th>
            <th width="120">操作人</th>
            <th width="180">出库时间</th>
            <th width="100">状态</th>
            <th width="220">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="11" style="text-align: center">加载中...</td></tr>
          <tr v-else-if="!tableData.length"><td colspan="11" style="text-align: center">暂无数据</td></tr>
          <tr v-for="(row, index) in tableData" :key="row.id" :class="index % 2 === 0 ? 'even-row' : 'odd-row'">
            <td><input type="checkbox" :value="row" v-model="selectedRows" /></td>
            <td>{{ row.outboundNo }}</td>
            <td>{{ getTypeText(row.type) }}</td>
            <td>{{ row.departmentName }}</td>
            <td>{{ row.warehouseName }}</td>
            <td align="right">{{ row.totalQuantity }}</td>
            <td align="right">{{ row.totalAmount }}</td>
            <td>{{ row.operatorName }}</td>
            <td>{{ row.outboundDate }}</td>
            <td>
              <span :class="['status-tag', getStatusTagType(row.status)]">
                {{ statusMap[row.status] || row.status }}
              </span>
            </td>
            <td>
              <md-text-button class="action-link" @click="handleDetails(row)">详情</md-text-button>
              <md-text-button class="action-link success" @click="handleAudit(row)" :disabled="row.status !== 'Pending'">审核</md-text-button>
              <md-text-button class="action-link warning" @click="handleRevoke(row)" :disabled="row.status === 'Completed' || row.status === 'Cancelled'">撤销</md-text-button>
              <md-text-button class="action-link danger" @click="handleDelete(row)" :disabled="row.status === 'Completed'">删除</md-text-button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    </md-elevated-card>

    <!-- 分页 -->
    <md-elevated-card class="md3-card md3-card--tight">
    <div class="pagination-container">
      <MdPagination
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    </md-elevated-card>

    <!-- 详情弹窗 -->
    <md-dialog :open="detailsDialogVisible" @closed="detailsDialogVisible = false">
      <div slot="headline">出库单详情</div>
      <div slot="content" v-if="detailsData" class="details-content">
        <div class="details-grid">
          <div class="detail-item"><strong>出库单号：</strong>{{ detailsData.outboundNo }}</div>
          <div class="detail-item">
            <strong>状态：</strong>
            <span :class="['status-tag', getStatusTagType(detailsData.status)]">
              {{ statusMap[detailsData.status] || detailsData.status }}
            </span>
          </div>
          <div class="detail-item"><strong>出库类型：</strong>{{ getTypeText(detailsData.type) }}</div>
          <div class="detail-item"><strong>往来单位：</strong>{{ detailsData.departmentName || '-' }}</div>
          <div class="detail-item"><strong>仓库：</strong>{{ detailsData.warehouseName || '-' }}</div>
          <div class="detail-item"><strong>操作人：</strong>{{ detailsData.operatorName || '-' }}</div>
          <div class="detail-item"><strong>出库时间：</strong>{{ detailsData.outboundDate }}</div>
          <div class="detail-item"><strong>总金额：</strong>{{ detailsData.totalAmount }} 元</div>
          <div class="detail-item" style="grid-column: span 2;"><strong>备注：</strong>{{ detailsData.remarks || '无' }}</div>
        </div>

        <h4 style="margin-top: 20px;">出库明细</h4>
        <table class="md3-table" style="width: 100%; margin-top: 10px;">
          <thead>
            <tr>
              <th>商品名称</th>
              <th>商品编号</th>
              <th>规格</th>
              <th>出库数量</th>
              <th>单位</th>
              <th>库位</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in detailsData.details" :key="idx">
              <td>{{ item.materialName }}</td>
              <td>{{ item.materialCode }}</td>
              <td>{{ item.specification }}</td>
              <td align="right">{{ item.quantity }}</td>
              <td>{{ item.unit }}</td>
              <td>{{ item.locationCode }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div slot="actions">
        <md-text-button @click="detailsDialogVisible = false">关闭</md-text-button>
      </div>
    </md-dialog>

    <!-- 审核弹窗 -->
    <md-dialog :open="auditDialogVisible" @closed="auditDialogVisible = false">
      <div slot="headline">出库审核</div>
      <div slot="content">
        <form class="md3-form">
          <div class="form-item">
            <label>审核操作 <span class="required">*</span></label>
            <div class="radio-group">
              <label>
                <input type="radio" v-model="auditForm.action" value="approve" /> 通过并出库
              </label>
              <label>
                <input type="radio" v-model="auditForm.action" value="reject" /> 驳回
              </label>
            </div>
          </div>
          <div class="form-item">
            <label>审核意见</label>
            <md-outlined-text-field
              type="textarea"
              v-model="auditForm.reason"
              rows="3"
              placeholder="请输入审核意见（驳回必填）"
              style="width: 100%"
            />
          </div>
        </form>
      </div>
      <div slot="actions">
        <md-text-button @click="auditDialogVisible = false">取消</md-text-button>
        <md-filled-button @click="confirmAudit">确定</md-filled-button>
      </div>
    </md-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';
import MdPagination from '@/components/MdPagination.vue';
import MdDateRange from '@/components/MdDateRange.vue';
import { notifySuccess, notifyError, notifyWarning } from '@/utils/notify';

const router = useRouter();

const filter = reactive({
  outboundNo: '',
  status: '',
});
const dateRange = ref([]);

const tableData = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const selectedRows = ref([]);

const isAllSelected = computed(() => {
  return tableData.value.length > 0 && selectedRows.value.length === tableData.value.length;
});

const toggleAllSelection = (event) => {
  if (event.target.checked) {
    selectedRows.value = [...tableData.value];
  } else {
    selectedRows.value = [];
  }
};

const detailsDialogVisible = ref(false);
const detailsData = ref(null);

const auditDialogVisible = ref(false);
const auditForm = reactive({ id: null, action: 'approve', reason: '' });

const statusMap = {
  Draft: '草稿',
  Pending: '待处理',
  Completed: '已完成',
  Cancelled: '已取消',
  Rejected: '已驳回'
};

const getStatusTagType = (status) => {
  const types = {
    Draft: 'info',
    Pending: 'warning',
    Completed: 'success',
    Cancelled: 'info',
    Rejected: 'danger'
  };
  return types[status] || '';
};

const getTypeText = (type) => {
  const map = {
    Production: '生产领料',
    Transfer: '调拨',
    Return: '退货',
    Other: '其他'
  };
  return map[type] || type;
};

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...filter
    };
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    } else {
      params.startDate = '';
      params.endDate = '';
    }
    const res = await api.getOutboundOrders(params);
    tableData.value = res.data?.items || [];
    total.value = res.data?.total || 0;
  } catch (error) {
    console.error(error);
    notifyError('获取出库单列表失败');
  } finally {
    loading.value = false;
  }
};

const resetFilter = () => {
  filter.outboundNo = '';
  filter.status = '';
  dateRange.value = [];
  fetchData();
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchData();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchData();
};

const handleCreate = () => {
  notifyWarning('新建出库单页面暂未实现');
};

const handleDetails = async (row) => {
  try {
    const res = await api.getOutboundOrderDetail(row.id);
    detailsData.value = res.data;
    detailsDialogVisible.value = true;
  } catch (error) {
    console.error(error);
    notifyError('获取出库单详情失败');
  }
};

const handleAudit = (row) => {
  auditForm.id = row.id;
  auditForm.action = 'approve';
  auditForm.reason = '';
  auditDialogVisible.value = true;
};

const confirmAudit = async () => {
  if (auditForm.action === 'reject' && !auditForm.reason) {
    return notifyWarning('驳回时必须填写审核意见');
  }
  try {
    await api.auditOutboundOrder(auditForm.id, {
      action: auditForm.action,
      reason: auditForm.reason
    });
    notifySuccess('审核完成');
    auditDialogVisible.value = false;
    fetchData();
  } catch (error) {
    console.error(error);
    notifyError(error.response?.data?.message || '审核失败');
  }
};

const handleRevoke = async (row) => {
  try {
    if(!window.confirm(`确定要撤销出库单 ${row.outboundNo} 吗？`)) return;
    await api.revokeOutboundOrder(row.id);
    notifySuccess('撤销成功');
    fetchData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error);
      notifyError('撤销失败');
    }
  }
};

const handleDelete = async (row) => {
  try {
    if(!window.confirm(`确定要删除出库单 ${row.outboundNo} 吗？此操作不可恢复。`)) return;
    await api.deleteOutboundOrder(row.id);
    notifySuccess('删除成功');
    fetchData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error);
      notifyError('删除失败');
    }
  }
};

const handlePrint = () => {
  notifyWarning('打印功能暂未实现');
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
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

.md3-card--tight {
  padding: 12px 14px;
}

.md3-table-card {
  padding: 0;
}

.md3-btn-loading {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.md3-btn-loading md-circular-progress {
  --md-circular-progress-size: 18px;
}

.filter-card {
  .filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 16px;

    .filter-col {
      display: flex;
      flex-direction: column;
      flex: 1;

      label {
        color: var(--md-sys-color-on-surface-variant);
        font-weight: 700;
        margin-bottom: 8px;
      }
      md-outlined-text-field, md-outlined-select {
        width: 100%;
      }
    }
  }

  .filter-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

.action-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.action-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--md-sys-color-on-surface);
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.data-container {
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

.action-link {
  --md-text-button-label-text-size: 14px;
}
.action-link.success {
  --md-text-button-label-text-color: #67c23a;
}
.action-link.warning {
  --md-text-button-label-text-color: #e6a23c;
}
.action-link.danger {
  --md-text-button-label-text-color: #f56c6c;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.status-tag.info {
  background-color: #f4f4f5;
  color: #909399;
  border: 1px solid #e9e9eb;
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
.status-tag.danger {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
}

.details-content {
  padding: 0 20px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.detail-item {
  font-size: 14px;
  line-height: 1.5;
}

.md3-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  label {
    font-weight: 500;
    font-size: 14px;
  }
  .required {
    color: #f56c6c;
  }
}

.radio-group {
  display: flex;
  gap: 16px;
  label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: normal;
  }
}
</style>
