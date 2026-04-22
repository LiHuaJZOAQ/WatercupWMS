<template>
  <div class="erp-container">
    <!-- 查询条件区域 -->
    <div class="filter-card">
      <div class="filter-row">
        <div class="filter-col">
          <label>订单状态：</label>
          <el-select v-model="filter.orderStatus" placeholder="请选择">
            <el-option label="待处理" value="pending"></el-option>
            <el-option label="已批准" value="approved"></el-option>
            <el-option label="已拒绝" value="rejected"></el-option>
          </el-select>
        </div>
        <div class="filter-col">
          <label>出库单号：</label>
          <el-select v-model="filter.outboundNo" placeholder="请选择">
            <el-option label="OB20230001" value="1"></el-option>
            <el-option label="OB20230002" value="2"></el-option>
          </el-select>
        </div>
        <div class="filter-col">
          <label>来源单号：</label>
          <el-select v-model="filter.sourceDocNo" placeholder="请选择">
            <el-option label="SD20230001" value="1"></el-option>
          </el-select>
        </div>
        <div class="filter-col">
          <label>原料名称：</label>
          <el-select v-model="filter.materialName" placeholder="请选择">
            <el-option label="原料1" value="material1"></el-option>
          </el-select>
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-col">
          <label>原料编号：</label>
          <el-select v-model="filter.materialNo" placeholder="请选择">
            <el-option label="MAT001" value="1"></el-option>
          </el-select>
        </div>
        <div class="filter-col">
          <label>批次号：</label>
          <el-select v-model="filter.batchNo" placeholder="请选择">
            <el-option label="BTH20230001" value="1"></el-option>
          </el-select>
        </div>
        <div class="filter-col">
          <label>出库仓库：</label>
          <el-select v-model="filter.warehouse" placeholder="请选择">
            <el-option label="主仓库" value="main"></el-option>
          </el-select>
        </div>
        <div class="filter-col">
          <label>出库类型：</label>
          <el-select v-model="filter.outboundType" placeholder="请选择">
            <el-option label="生产领料" value="production"></el-option>
            <el-option label="销售出库" value="sales"></el-option>
            <el-option label="调拨出库" value="transfer"></el-option>
          </el-select>
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-col">
          <label>出库方式：</label>
          <el-select v-model="filter.outboundMethod" placeholder="请选择">
            <el-option label="普通出库" value="normal"></el-option>
            <el-option label="紧急出库" value="urgent"></el-option>
          </el-select>
        </div>
        <div class="filter-col">
          <label>领用人：</label>
          <el-select v-model="filter.receiver" placeholder="请选择">
            <el-option label="张三" value="zhangsan"></el-option>
            <el-option label="李四" value="lisi"></el-option>
          </el-select>
        </div>
        <div class="filter-col">
          <label>部门：</label>
          <el-select v-model="filter.department" placeholder="请选择">
            <el-option label="生产部" value="production"></el-option>
            <el-option label="销售部" value="sales"></el-option>
          </el-select>
        </div>
        <div class="filter-col">
          <label>出库时间：</label>
          <el-date-picker
            v-model="filter.outboundDate"
            type="datetime"
            placeholder="选择日期时间"
            style="width: 100%"
          />
        </div>
      </div>
      <div class="filter-actions">
        <div style="flex: 1;"></div>
        <el-button class="btn-reset" @click="resetFilter">重置</el-button>
        <el-button class="btn-primary" @click="search">查询</el-button>
      </div>
    </div>
    <!-- 操作按钮区域 -->
    <div class="action-bar">
      <el-button class="action-btn" type="success" @click="handleNew">
        <i class="el-icon-plus"></i> 新建
      </el-button>
      <el-button class="action-btn" type="warning" @click="handleImportExport">
        <i class="el-icon-download"></i> 导入导出
      </el-button>
      <el-button class="action-btn" type="primary" @click="handleAudit">
        <i class="el-icon-check"></i> 审核
      </el-button>
      <el-button class="action-btn" type="primary" @click="handlePrint">
        <i class="el-icon-printer"></i> 打印
      </el-button>
    </div>
    <!-- 表格数据区域 -->
    <div class="data-container">
      <el-table
        :data="tableData"
        border
        stripe
        header-align="center"
        style="width: 100%"
        :row-class-name="tableRowClassName"
      >
        <el-table-column
          prop="outboundQuantity"
          label="出库数量"
          width="120"
          align="right"
        />
        <el-table-column
          prop="outboundGrossWeight"
          label="出库毛重(kg)"
          width="120"
          align="right"
        />
        <el-table-column
          prop="outboundNetWeight"
          label="出库净重(kg)"
          width="120"
          align="right"
        />
        <el-table-column
          prop="receiverName"
          label="领用人"
          min-width="120"
        />
        <el-table-column
          prop="departmentName"
          label="部门"
          min-width="120"
        />
        <el-table-column
          prop="purpose"
          label="用途"
          min-width="150"
        />
        <el-table-column
          prop="projectName"
          label="项目名称"
          min-width="150"
        />
        <el-table-column
          prop="orderDate"
          label="下单时间"
          width="180"
        />
        <el-table-column
          prop="outboundDate"
          label="出库时间"
          width="180"
        />
        <el-table-column
          label="状态"
          width="120"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ statusMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="200"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button 
              link 
              class="action-link" 
              @click="handleDetails(row)"
            >
              详情
            </el-button>
            <el-button 
              link 
              class="action-link" 
              type="primary" 
              @click="handleAudit(row)"
              :disabled="row.status !== 'pending'"
            >
              审核
            </el-button>
            <el-button 
              link 
              class="action-link" 
              @click="handlePrint(row)"
            >
              打印
            </el-button>
            <el-button 
              link 
              class="action-link" 
              type="danger" 
              @click="handleRevoke(row)"
              :disabled="row.status !== 'approved'"
            >
              撤销
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          background
          layout="prev, pager, next"
          :current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div> 
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();

// 模拟数据
const tableData = ref([
  {
    outboundNo: 'OB20230001',
    outboundQuantity: 100,
    outboundGrossWeight: 200,
    outboundNetWeight: 180,
    receiverName: '张三',
    departmentName: '生产部',
    purpose: '生产领料',
    projectName: '项目A',
    orderDate: '2025-10-01 10:00:00',
    outboundDate: '2025-10-02 12:00:00',
    status: 'pending',
  },
  {
    outboundNo: 'OB20230002',
    outboundQuantity: 150,
    outboundGrossWeight: 320,
    outboundNetWeight: 300,
    receiverName: '李四',
    departmentName: '销售部',
    purpose: '销售出库',
    projectName: '项目B',
    orderDate: '2025-10-02 11:30:00',
    outboundDate: '2025-10-03 14:15:00',
    status: 'approved',
  },
  {
    outboundNo: 'OB20230003',
    outboundQuantity: 80,
    outboundGrossWeight: 180,
    outboundNetWeight: 160,
    receiverName: '王五',
    departmentName: '生产部',
    purpose: '调拨出库',
    projectName: '项目C',
    orderDate: '2025-10-03 09:45:00',
    outboundDate: '2025-10-04 11:30:00',
    status: 'rejected',
  }
]);

const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(tableData.value.length);

// 状态映射
const statusMap = {
  pending: '待审核',
  approved: '已批准',
  rejected: '已拒绝'
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

// 筛选条件
const filter = reactive({
  orderStatus: '',
  outboundNo: '',
  sourceDocNo: '',
  materialName: '',
  materialNo: '',
  batchNo: '',
  warehouse: '',
  outboundType: '',
  outboundMethod: '',
  receiver: '',
  department: '',
  outboundDate: null,
});

// 查询方法
const search = () => {
  // 这里可以添加实际的查询逻辑，比如调用接口
  ElMessage.success('查询成功');
  console.log('执行查询操作，筛选条件：', filter);
};

const resetFilter = () => {
  // 重置筛选条件
  Object.keys(filter).forEach(key => {
    if (key === 'outboundDate') {
      filter[key] = null;
    } else {
      filter[key] = '';
    }
  });
};

const handleNew = () => {
  // 新建操作逻辑
  ElMessage.success('新建出库单');
};

const handleImportExport = () => {
  // 导入导出操作逻辑
  ElMessage.success('导入导出操作');
};

const handleAudit = (row) => {
  if (row) {
    // 单条审核
    if (row.status !== 'pending') {
      ElMessage.warning('只能审核待审核状态的出库单');
      return;
    }
    row.status = 'approved';
    ElMessage.success(`出库单 ${row.outboundNo} 审核成功`);
  } else {
    // 批量审核
    ElMessage.success('批量审核操作');
  }
};

const handlePrint = (row) => {
  if (row) {
    // 单条打印
    ElMessage.success(`打印出库单 ${row.outboundNo}`);
  } else {
    // 批量打印
    ElMessage.success('批量打印操作');
  }
};

const handleRevoke = (row) => {
  if (row.status !== 'approved') {
    ElMessage.warning('只能撤销已批准状态的出库单');
    return;
  }
  row.status = 'pending';
  ElMessage.success(`出库单 ${row.outboundNo} 撤销成功`);
};

const handleDetails = (row) => {
  ElMessage.info(`查看出库单 ${row.outboundNo} 详情`);
  // 可以跳转到详情页面
  // router.push({ name: 'OutboundDetail', params: { id: row.id } });
};

const handlePageChange = (page) => {
  currentPage.value = page;
  console.log('当前页码：', page);
};

const tableRowClassName = ({ rowIndex }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row';
};
</script>

<style scoped lang="scss">
.erp-container {
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  background-color: #f0f2f5;
  padding: 16px;
}

.filter-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
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

.filter-col .el-select {
  width: 100%;
  .el-input__inner {
    height: 40px;
    border-radius: 4px;
    border-color: #e4e7ed;
    transition: all 0.3s;
    &:focus {
      border-color: #409eff;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    }
  }
}

.filter-col .el-date-editor {
  width: 100%;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn-reset {
  background: #f5f7fa;
  border-color: #e4e7ed;
  color: #666;
}

.btn-primary {
  background: #409eff;
  border-color: #409eff;
  transition: all 0.3s;
  &:hover {
    background: #66b1ff;
  }
}

.action-bar {
  display: flex;
  gap: 12px;
  padding: 0 24px;
  margin-bottom: 16px;
}

.action-btn {
  flex: 1;
  height: 44px;
  border-radius: 4px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  i {
    margin-right: 6px;
    font-size: 18px;
  }
}

.data-container {
  flex: 1;
  overflow: hidden;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.data-container .el-table {
  th {
    background-color: #f8f9fc;
    color: #333;
    font-weight: 600;
    padding: 12px 0;
    border-bottom: 2px solid #e4e7ed;
    .cell {
      font-size: 14px;
    }
  }
  td {
    padding: 12px 0;
    color: #444;
    .cell {
      font-size: 14px;
    }
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

.data-container .pagination {
  padding: 16px 24px;
  text-align: right;
  background: white;
  border-top: 1px solid #e4e7ed;
}

.data-container .action-link {
  font-size: 14px;
  padding: 6px 12px;
  margin: 0 4px;
  border-radius: 4px;
  transition: all 0.3s;
  &:hover {
    opacity: 0.85;
  }
}
</style>