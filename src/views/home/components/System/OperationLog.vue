<template>
  <div class="md3-page">
    <md-elevated-card class="md3-card">
      <div class="md3-toolbar">
        <md-outlined-text-field
          class="md3-field"
          label="操作人"
          placeholder="请输入用户名"
          :value="filter.username"
          @input="(e) => (filter.username = e.target.value)"
        >
          <md-icon slot="leading-icon">search</md-icon>
        </md-outlined-text-field>

        <md-outlined-select
          class="md3-field"
          label="操作类型"
          :value="filter.operationType"
          @change="(e) => (filter.operationType = e.target.value)"
        >
          <md-select-option value=""><div slot="headline">全部</div></md-select-option>
          <md-select-option value="Login"><div slot="headline">登录</div></md-select-option>
          <md-select-option value="Logout"><div slot="headline">登出</div></md-select-option>
          <md-select-option value="Create"><div slot="headline">创建</div></md-select-option>
          <md-select-option value="Update"><div slot="headline">更新</div></md-select-option>
          <md-select-option value="Delete"><div slot="headline">删除</div></md-select-option>
        </md-outlined-select>

        <md-outlined-text-field
          class="md3-field"
          label="模块"
          placeholder="例如: User"
          :value="filter.moduleName"
          @input="(e) => (filter.moduleName = e.target.value)"
        />

        <div class="date-fields">
          <md-outlined-text-field
            class="md3-field"
            label="开始日期"
            type="date"
            :value="startDate"
            @input="handleStartDateChange"
          />
          <span class="date-separator">至</span>
          <md-outlined-text-field
            class="md3-field"
            label="结束日期"
            type="date"
            :value="endDate"
            @input="handleEndDateChange"
          />
        </div>

        <div class="md3-toolbar-actions">
          <md-filled-button :disabled="loading" @click="fetchData">查询</md-filled-button>
          <md-text-button @click="resetFilter">重置</md-text-button>
        </div>
      </div>
    </md-elevated-card>

    <md-elevated-card class="md3-card md3-table-card">
      <div class="md3-table-container">
        <table class="md3-table">
          <thead>
            <tr>
              <th>日志ID</th>
              <th>操作人</th>
              <th>操作类型</th>
              <th>模块名称</th>
              <th>功能描述</th>
              <th>请求方式</th>
              <th>请求路径</th>
              <th>IP地址</th>
              <th>操作时间</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in tableData" :key="row.id">
              <td>{{ row.id }}</td>
              <td>{{ row.username }}</td>
              <td>
                <span :class="['type-tag', 'type-' + getTypeTag(row.operationType)]">
                  {{ typeMap[row.operationType] || row.operationType }}
                </span>
              </td>
              <td>{{ row.moduleName }}</td>
              <td>{{ row.functionName }}</td>
              <td>{{ row.method }}</td>
              <td>{{ row.url }}</td>
              <td>{{ row.ip }}</td>
              <td>{{ row.operationTime }}</td>
              <td>
                <span :class="['status-tag', row.status === 1 ? 'status-success' : 'status-danger']">
                  {{ row.status === 1 ? '成功' : '失败' }}
                </span>
              </td>
            </tr>
            <tr v-if="tableData.length === 0">
              <td colspan="10" class="empty-text">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </md-elevated-card>

    <div class="pagination-container">
      <MdPagination 
        :total="total" 
        v-model:currentPage="currentPage" 
        v-model:pageSize="pageSize" 
        @current-change="fetchData" 
        @size-change="fetchData" 
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import MdPagination from '@/components/MdPagination.vue';
import api from '@/api';
import { notifyError } from '@/utils/notify'

const filter = reactive({
  username: '',
  operationType: '',
  moduleName: '',
  startDate: '',
  endDate: ''
});

const startDate = ref('');
const endDate = ref('');

const tableData = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const typeMap = {
  Login: '登录',
  Logout: '登出',
  Create: '创建',
  Update: '更新',
  Delete: '删除',
  Query: '查询'
};

const getTypeTag = (type) => {
  const map = {
    Login: 'info',
    Logout: 'info',
    Create: 'success',
    Update: 'warning',
    Delete: 'danger',
    Query: 'default'
  };
  return map[type] || 'default';
};

const handleStartDateChange = (e) => {
  startDate.value = e.target.value;
  filter.startDate = startDate.value ? `${startDate.value} 00:00:00` : '';
};

const handleEndDateChange = (e) => {
  endDate.value = e.target.value;
  filter.endDate = endDate.value ? `${endDate.value} 23:59:59` : '';
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.getOperationLogs({ page: currentPage.value, pageSize: pageSize.value, ...filter });
    tableData.value = res.data?.items || [];
    total.value = res.data?.total || 0;
  } catch (error) {
    notifyError('获取日志失败');
  } finally {
    loading.value = false;
  }
};

const resetFilter = () => {
  Object.keys(filter).forEach(k => filter[k] = '');
  startDate.value = '';
  endDate.value = '';
  fetchData();
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

.md3-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.md3-field {
  flex: 1;
  min-width: 150px;
}

.date-fields {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 2;
  min-width: 320px;
}

.date-separator {
  color: var(--md-sys-color-on-surface-variant);
  font-size: 14px;
}

.md3-toolbar-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-left: auto;
}

.md3-table-card {
  padding: 0;
}

.md3-table-container {
  width: 100%;
  overflow-x: auto;
}

.md3-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.md3-table th,
.md3-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  white-space: nowrap;
}

.md3-table th {
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant);
  background: var(--md-sys-color-surface-container-low);
}

.empty-text {
  text-align: center;
  color: var(--md-sys-color-outline);
  padding: 32px !important;
}

.status-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.status-success {
  background: #e6f4ea;
  color: #1e8e3e;
}
.status-danger {
  background: #fce8e6;
  color: #d93025;
}

.type-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.type-success {
  background: #e6f4ea;
  color: #1e8e3e;
}
.type-danger {
  background: #fce8e6;
  color: #d93025;
}
.type-warning {
  background: #fef7e0;
  color: #e37400;
}
.type-info {
  background: #e8f0fe;
  color: #1a73e8;
}
.type-default {
  background: #f1f3f4;
  color: #5f6368;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}
</style>
