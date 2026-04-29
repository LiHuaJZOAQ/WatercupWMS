<template>
  <div class="md3-page">
    <!-- 查询条件区域 -->
    <md-elevated-card class="md3-card">
    <div class="filter-card">
      <div class="filter-row">
        <div class="filter-col">
          <label>订单状态：</label>
          <md-outlined-select v-model="filter.orderStatus">
            <md-select-option value="">
              <div slot="headline">请选择</div>
            </md-select-option>
            <md-select-option 
              v-for="item in options.orderStatus"
              :key="item.value"
              :value="item.value"
            >
              <div slot="headline">{{ item.label }}</div>
            </md-select-option>
          </md-outlined-select>
        </div>
        <div class="filter-col">
          <label>入库单号：</label>
          <md-outlined-select v-model="filter.warehouseReceiptNo">
            <md-select-option value="">
              <div slot="headline">请选择</div>
            </md-select-option>
            <md-select-option 
              v-for="item in options.warehouseReceiptNos"
              :key="item.value"
              :value="item.value"
            >
              <div slot="headline">{{ item.label }}</div>
            </md-select-option>
          </md-outlined-select>
        </div>
        <div class="filter-col">
          <label>来源单号：</label>
          <md-outlined-select v-model="filter.sourceDocNo">
            <md-select-option value="">
              <div slot="headline">请选择</div>
            </md-select-option>
            <md-select-option 
              v-for="item in options.sourceDocNos"
              :key="item.value"
              :value="item.value"
            >
              <div slot="headline">{{ item.label }}</div>
            </md-select-option>
          </md-outlined-select>
        </div>
        <div class="filter-col">
          <label>商品名称：</label>
          <md-outlined-select v-model="filter.materialName">
            <md-select-option value="">
              <div slot="headline">请选择</div>
            </md-select-option>
            <md-select-option 
              v-for="item in options.materialNames"
              :key="item.value"
              :value="item.value"
            >
              <div slot="headline">{{ item.label }}</div>
            </md-select-option>
          </md-outlined-select>
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-col">
          <label>商品编号：</label>
          <md-outlined-select v-model="filter.materialNo">
            <md-select-option value="">
              <div slot="headline">请选择</div>
            </md-select-option>
            <md-select-option 
              v-for="item in options.materialNos"
              :key="item.value"
              :value="item.value"
            >
              <div slot="headline">{{ item.label }}</div>
            </md-select-option>
          </md-outlined-select>
        </div>
        <div class="filter-col">
          <label>批次号：</label>
          <md-outlined-select v-model="filter.batchNo">
            <md-select-option value="">
              <div slot="headline">请选择</div>
            </md-select-option>
            <md-select-option 
              v-for="item in options.batchNos"
              :key="item.value"
              :value="item.value"
            >
              <div slot="headline">{{ item.label }}</div>
            </md-select-option>
          </md-outlined-select>
        </div>
        <div class="filter-col">
          <label>入库仓库：</label>
          <md-outlined-select v-model="filter.warehouse">
            <md-select-option value="">
              <div slot="headline">请选择</div>
            </md-select-option>
            <md-select-option 
              v-for="item in options.warehouses"
              :key="item.value"
              :value="item.value"
            >
              <div slot="headline">{{ item.label }}</div>
            </md-select-option>
          </md-outlined-select>
        </div>
        <div class="filter-col">
          <label>入库类型：</label>
          <md-outlined-select v-model="filter.warehouseType">
            <md-select-option value="">
              <div slot="headline">请选择</div>
            </md-select-option>
            <md-select-option 
              v-for="item in options.warehouseTypes"
              :key="item.value"
              :value="item.value"
            >
              <div slot="headline">{{ item.label }}</div>
            </md-select-option>
          </md-outlined-select>
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-col">
          <label>入库方式：</label>
          <md-outlined-select v-model="filter.warehouseMethod">
            <md-select-option value="">
              <div slot="headline">请选择</div>
            </md-select-option>
            <md-select-option 
              v-for="item in options.warehouseMethods"
              :key="item.value"
              :value="item.value"
            >
              <div slot="headline">{{ item.label }}</div>
            </md-select-option>
          </md-outlined-select>
        </div>
        <div class="filter-col">
          <label>往来单位：</label>
          <md-outlined-select v-model="filter.supplier">
            <md-select-option value="">
              <div slot="headline">请选择</div>
            </md-select-option>
            <md-select-option 
              v-for="item in options.suppliers"
              :key="item.value"
              :value="item.value"
            >
              <div slot="headline">{{ item.label }}</div>
            </md-select-option>
          </md-outlined-select>
        </div>
        <div class="filter-col">
          <label>生厂商：</label>
          <md-outlined-select v-model="filter.manufacturer">
            <md-select-option value="">
              <div slot="headline">请选择</div>
            </md-select-option>
            <md-select-option 
              v-for="item in options.manufacturers"
              :key="item.value"
              :value="item.value"
            >
              <div slot="headline">{{ item.label }}</div>
            </md-select-option>
          </md-outlined-select>
        </div>
        <div class="filter-col">
          <label>入库时间：</label>
          <MdDateRange
            v-model="filter.warehouseDate"
            start-label="开始日期"
            end-label="结束日期"
            style="width: 100%"
          />
        </div>
      </div>
      <div class="filter-actions">
        <div style="flex: 1;"></div>
        <md-text-button @click="resetFilter">重置</md-text-button>
        <md-filled-button :disabled="loading" @click="search">
          <span v-if="!loading">查询</span>
          <span v-else class="md3-btn-loading">
            <md-circular-progress indeterminate></md-circular-progress>
            查询中
          </span>
        </md-filled-button>
      </div>
    </div>
    </md-elevated-card>
    <!-- 操作按钮区域 -->
    <md-elevated-card class="md3-card md3-card--tight">
      <div class="action-bar">
        <div class="action-title">通用入库单</div>
        <div class="action-buttons">
          <md-filled-tonal-button @click="handleNew">
            <md-icon slot="icon">add</md-icon>
            新建
          </md-filled-tonal-button>
          <md-filled-tonal-button @click="handleImportExport">
            <md-icon slot="icon">upload</md-icon>
            导入导出
          </md-filled-tonal-button>
          <md-filled-button :disabled="!selectedRows.length" @click="handleAudit()">
            <md-icon slot="icon">check_circle</md-icon>
            审核
          </md-filled-button>
          <md-filled-button :disabled="!selectedRows.length" @click="handlePrint()">
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
            <th width="150">入库单号</th>
            <th width="120">实收数量</th>
            <th width="120">实收毛重(kg)</th>
            <th width="120">实收净重(kg)</th>
            <th>往来单位名称</th>
            <th>生产商名称</th>
            <th width="180">下单时间</th>
            <th width="180">入库时间</th>
            <th width="120">状态</th>
            <th width="200">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="11" style="text-align: center">加载中...</td></tr>
          <tr v-else-if="!tableData.length"><td colspan="11" style="text-align: center">暂无数据</td></tr>
          <tr v-for="(row, index) in tableData" :key="row.id" :class="index % 2 === 0 ? 'even-row' : 'odd-row'">
            <td><input type="checkbox" :value="row" v-model="selectedRows" /></td>
            <td>{{ row.warehouseReceiptNo }}</td>
            <td align="right">{{ row.receivedQuantity }}</td>
            <td align="right">{{ row.receivedGrossWeight }}</td>
            <td align="right">{{ row.receivedNetWeight }}</td>
            <td>{{ row.supplierName }}</td>
            <td>{{ row.manufacturerName }}</td>
            <td>{{ row.orderDate }}</td>
            <td>{{ row.warehouseDate }}</td>
            <td>
              <span :class="['status-tag', getStatusTagType(row.status)]">
                {{ statusMap[row.status] }}
              </span>
            </td>
            <td>
              <md-text-button class="action-link" @click="handleDetails(row)">详情</md-text-button>
              <md-text-button class="action-link" @click="handleAudit(row)" :disabled="row.status !== 'pending'">审核</md-text-button>
              <md-text-button class="action-link" @click="handlePrint(row)">打印</md-text-button>
              <md-text-button class="action-link danger" @click="handleRevoke(row)" :disabled="row.status !== 'approved'">撤销</md-text-button>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- 分页 -->
      <div class="pagination">
        <MdPagination
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          :total="total"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
    </md-elevated-card>

    <!-- 新建入库单模态框 -->
    <md-dialog :open="createDialogVisible" @closed="createDialogVisible = false; resetCreateForm()">
      <div slot="headline">新建入库单</div>
      <div slot="content">
        <component 
          :is="createComponent" 
          ref="createFormRef"
          @success="handleCreateSuccess"
          @cancel="createDialogVisible = false"
        />
      </div>
    </md-dialog>

    <!-- 审核对话框 -->
    <md-dialog :open="auditDialogVisible" @closed="auditDialogVisible = false">
      <div slot="headline">审核入库单</div>
      <div slot="content">
        <form class="md3-form">
          <div class="form-item">
            <label>审核结果</label>
            <div class="radio-group">
              <label>
                <input type="radio" v-model="auditForm.status" value="approved" /> 通过
              </label>
              <label>
                <input type="radio" v-model="auditForm.status" value="rejected" /> 拒绝
              </label>
            </div>
          </div>
          <div class="form-item" v-if="auditForm.status === 'rejected'">
            <label>拒绝原因</label>
            <md-outlined-text-field
              v-model="auditForm.reason"
              type="textarea"
              rows="3"
              placeholder="请输入拒绝原因"
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

    <!-- 查看详情模态框 -->
    <md-dialog :open="detailsDialogVisible" @closed="detailsDialogVisible = false; resetDetailsForm()">
      <div slot="headline">入库单详情</div>
      <div slot="content" v-if="detailsData">
        <div class="details-grid">
          <div class="detail-item">
            <strong>入库单号：</strong>{{ detailsData.warehouseReceiptNo }}
          </div>
          <div class="detail-item">
            <strong>往来单位：</strong>{{ detailsData.supplierName }}
          </div>
          <div class="detail-item">
            <strong>生产商：</strong>{{ detailsData.manufacturerName }}
          </div>
          <div class="detail-item">
            <strong>实收数量：</strong>{{ detailsData.receivedQuantity }}
          </div>
          <div class="detail-item">
            <strong>入库仓库：</strong>{{ detailsData.warehouse }}
          </div>
          <div class="detail-item">
            <strong>入库时间：</strong>{{ detailsData.warehouseDate }}
          </div>
          <div class="detail-item">
            <strong>状态：</strong>
            <span :class="['status-tag', getStatusTagType(detailsData.status)]">
              {{ statusMap[detailsData.status] }}
            </span>
          </div>
          <div class="detail-item">
            <strong>商品名称：</strong>{{ detailsData.materialName }}
          </div>
          <div class="detail-item">
            <strong>商品编号：</strong>{{ detailsData.materialNo }}
          </div>
        </div>
      </div>
      <div slot="actions">
        <md-text-button @click="detailsDialogVisible = false">关闭</md-text-button>
      </div>
    </md-dialog>
  </div> 
</template>

<script setup>
import { ref, reactive, onMounted, shallowRef, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';
import axios from '@/utils/request';
import InboundOrderCreate from './InboundOrderCreate.vue';
import MdPagination from '@/components/MdPagination.vue';
import MdDateRange from '@/components/MdDateRange.vue';
import { notifySuccess, notifyError } from '@/utils/notify';

// 查看详情相关
const detailsDialogVisible = ref(false);
const detailsData = ref(null);

// 重置详情模态框内容
const resetDetailsForm = () => {
  detailsData.value = null;
};

const router = useRouter();

// 表格数据
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

// 状态映射
const statusMap = {
  pending: '待审核',
  approved: '已批准',
  rejected: '已拒绝'
};

// 筛选条件
const filter = reactive({
  orderStatus: '',
  warehouseReceiptNo: '',
  sourceDocNo: '',
  materialName: '',
  materialNo: '',
  batchNo: '',
  warehouse: '',
  warehouseType: '',
  warehouseMethod: '',
  supplier: '',
  manufacturer: '',
  warehouseDate: null,
});

// 筛选选项
const options = reactive({
  orderStatus: [],
  warehouseReceiptNos: [],
  sourceDocNos: [],
  materialNames: [],
  materialNos: [],
  batchNos: [],
  warehouses: [],
  warehouseTypes: [],
  warehouseMethods: [],
  suppliers: [],
  manufacturers: []
});

// 审核对话框
const auditDialogVisible = ref(false);
const auditForm = reactive({
  ids: [],
  status: 'approved',
  reason: ''
});

// 初始化数据
onMounted(() => {
  fetchOptions();
  fetchData();
});

// 获取筛选选项
const fetchOptions = async () => {
  try {
    const res = await api.getInboundOptions();
    Object.assign(options, res.data);
  } catch (error) {
    notifyError('获取筛选选项失败');
    console.error(error);
  }
};

// 获取表格数据
const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...filter
    };
    
    // 处理时间范围
    if (filter.warehouseDate && filter.warehouseDate.length === 2) {
      params.startDate = filter.warehouseDate[0];
      params.endDate = filter.warehouseDate[1];
    }

    const res = await api.getInboundOrders(params);
    tableData.value = res.data.list;
    total.value = res.data.total;
  } catch (error) {
    notifyError('获取数据失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 查询方法
const search = () => {
  currentPage.value = 1;
  fetchData();
};

const resetFilter = () => {
  Object.keys(filter).forEach(key => {
    if (key === 'warehouseDate') {
      filter[key] = null;
    } else {
      filter[key] = '';
    }
  });
};

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page;
  fetchData();
};

const handleSizeChange = (size) => {
  pageSize.value = size;
  fetchData();
};

// 新建入库单相关
const createDialogVisible = ref(false);
const createComponent = shallowRef(InboundOrderCreate);
const createFormRef = ref(null);

// 新建入库单
const handleNew = () => {
  createDialogVisible.value = true;
};

// 新建成功处理
const handleCreateSuccess = () => {
  createDialogVisible.value = false;
  console.log('新建入库单成功');
  fetchData(); // 刷新列表数据
};

// 重置新建表单
const resetCreateForm = () => {
  if (createFormRef.value) {
    createFormRef.value.resetForm();
  }
};

// 导入导出
const handleImportExport = async () => {
  try {
    // 导出逻辑
    const params = { ...filter };
    if (filter.warehouseDate && filter.warehouseDate.length === 2) {
      params.startDate = filter.warehouseDate[0];
      params.endDate = filter.warehouseDate[1];
    }

    const res = await api.exportInboundOrders(params);

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `入库单_${new Date().toLocaleDateString()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    notifyError('导出失败');
    console.error(error);
  }
};

// 审核操作
const handleAudit = (row) => {
  if (row) {
    // 单条审核
    if (row.status !== 'pending') {
      notifyError('只能审核待审核状态的入库单');
      return;
    }
    auditForm.ids = [row.id];
  } else {
    // 批量审核
    const pendingRows = selectedRows.value.filter(item => item.status === 'pending');
    if (!pendingRows.length) {
      notifyError('请选择待审核状态的入库单');
      return;
    }
    auditForm.ids = pendingRows.map(item => item.id);
  }
  auditForm.status = 'approved';
  auditForm.reason = '';
  auditDialogVisible.value = true;
};

// 确认审核
const confirmAudit = async () => {
  try {
    await api.auditInboundOrders(auditForm);
    notifySuccess('审核成功');
    auditDialogVisible.value = false;
    fetchData();
  } catch (error) {
    notifyError('审核失败');
    console.error(error);
  }
};

// 撤销操作
const handleRevoke = async (row) => {
  try {
    if(!window.confirm('确定要撤销该入库单吗？')) return;
    
    await api.revokeInboundOrders({
      ids: [row.id]
    });
    
    notifySuccess('撤销成功');
    fetchData();
  } catch (error) {
    if (error !== 'cancel') {
      notifyError('撤销失败');
      console.error(error);
    }
  }
};

// 打印操作
const handlePrint = async (row) => {
  const ids = row ? [row.id] : selectedRows.value.map(item => item.id);
  if (!ids.length) {
    notifyError('请选择要打印的入库单');
    return;
  }

  try {
    const res = await api.getInboundOrderPrint(ids[0]);
    console.log('打印数据:', res.data);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>入库单打印</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #000; padding: 8px; text-align: center; }
              h2 { text-align: center; margin-bottom: 20px; }
              .header-info { display: flex; justify-content: space-between; margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <h2>入库单单</h2>
            <div class="header-info">
              <span><strong>单号：</strong>${res.data.warehouseReceiptNo || ''}</span>
              <span><strong>入库日期：</strong>${res.data.warehouseDate || ''}</span>
            </div>
            <div class="header-info">
              <span><strong>往来单位：</strong>${res.data.supplierName || ''}</span>
              <span><strong>生产商：</strong>${res.data.manufacturerName || ''}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>商品名称</th>
                  <th>商品编号</th>
                  <th>实收数量</th>
                  <th>实收毛重</th>
                  <th>实收净重</th>
                  <th>仓库</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${res.data.materialName || ''}</td>
                  <td>${res.data.materialNo || ''}</td>
                  <td>${res.data.receivedQuantity || ''}</td>
                  <td>${res.data.receivedGrossWeight || ''}</td>
                  <td>${res.data.receivedNetWeight || ''}</td>
                  <td>${res.data.warehouse || ''}</td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      // 等待样式加载后打印
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 200);
    }
  } catch (error) {
    notifyError('获取打印数据失败');
    console.error(error);
  }
};

const handleDetails = async (row) => {
  try {
    const res = await api.getInboundOrderDetail(row.id);
    detailsData.value = res.data;
    detailsDialogVisible.value = true;
  } catch (error) {
    console.error('获取入库单详情失败:', error);
    notifyError('获取入库单详情失败');
  }
};

// 状态标签类型
const getStatusTagType = (status) => {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  };
  return types[status] || '';
};
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

.filter-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.filter-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.filter-col label {
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
  white-space: nowrap;
}

md-outlined-select {
  width: 100%;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.action-bar {
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
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.data-container {
  flex: 1;
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

.pagination {
  padding: 16px 24px;
  text-align: right;
  background: var(--md-sys-color-surface-container-lowest);
  border-top: 1px solid var(--md-sys-color-outline-variant);
}

.action-link {
  --md-text-button-label-text-size: 14px;
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

.details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.detail-item {
  font-size: 14px;
  line-height: 1.5;
}
</style>
