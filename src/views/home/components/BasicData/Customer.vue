<template>
  <div class="md3-page">
    <md-elevated-card class="md3-card">
      <div class="md3-toolbar">
        <md-outlined-text-field
          class="md3-field"
          label="关键字"
          placeholder="名称或编码"
          :value="filter.keyword"
          @input="(e) => (filter.keyword = e.target.value)"
        >
          <md-icon slot="leading-icon">search</md-icon>
        </md-outlined-text-field>

        <md-outlined-select
          class="md3-field"
          label="状态"
          :value="String(filter.status ?? '')"
          @change="(e) => (filter.status = e.target.value === '' ? '' : Number(e.target.value))"
        >
          <md-select-option value=""><div slot="headline">全部</div></md-select-option>
          <md-select-option value="1"><div slot="headline">启用</div></md-select-option>
          <md-select-option value="0"><div slot="headline">禁用</div></md-select-option>
        </md-outlined-select>

        <div class="md3-toolbar-actions">
          <md-filled-button :disabled="loading" @click="fetchData">查询</md-filled-button>
          <md-text-button @click="resetFilter">重置</md-text-button>
        </div>
      </div>
    </md-elevated-card>

    <md-elevated-card class="md3-card md3-card--tight">
      <div class="md3-action-row">
        <div class="md3-action-title">客户管理</div>
        <md-filled-tonal-button @click="handleAdd">
          <md-icon slot="icon">add</md-icon>
          新增客户
        </md-filled-tonal-button>
      </div>
    </md-elevated-card>

    <md-elevated-card class="md3-card md3-table-card">
      <div class="md3-table-container">
        <table class="md3-table">
          <thead>
            <tr>
              <th>客户编码</th>
              <th>客户名称</th>
              <th>联系人</th>
              <th>联系电话</th>
              <th>邮箱</th>
              <th>地址</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in tableData" :key="row.id">
              <td>{{ row.code }}</td>
              <td>{{ row.name }}</td>
              <td>{{ row.contactPerson }}</td>
              <td>{{ row.contactPhone }}</td>
              <td>{{ row.email }}</td>
              <td>{{ row.address }}</td>
              <td>
                <span :class="['status-tag', row.status === 1 ? 'status-success' : 'status-danger']">
                  {{ row.status === 1 ? '启用' : '禁用' }}
                </span>
              </td>
              <td>
                <md-text-button @click="handleEdit(row)">编辑</md-text-button>
                <md-text-button class="danger-btn" @click="handleDelete(row)">删除</md-text-button>
              </td>
            </tr>
            <tr v-if="tableData.length === 0">
              <td colspan="8" class="empty-text">暂无数据</td>
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

    <!-- 表单弹窗 -->
    <md-dialog :open="dialogVisible" @closed="dialogVisible = false">
      <div slot="headline">{{ dialogTitle }}</div>
      <div slot="content">
        <form class="md3-form" @submit.prevent>
          <md-outlined-text-field
            label="编码*"
            :value="formData.code"
            @input="e => formData.code = e.target.value"
            :disabled="!!formData.id"
            placeholder="请输入编码"
            class="md3-form-field"
          />
          <md-outlined-text-field
            label="名称*"
            :value="formData.name"
            @input="e => formData.name = e.target.value"
            placeholder="请输入名称"
            class="md3-form-field"
          />
          <md-outlined-text-field
            label="联系人"
            :value="formData.contactPerson"
            @input="e => formData.contactPerson = e.target.value"
            placeholder="请输入联系人"
            class="md3-form-field"
          />
          <md-outlined-text-field
            label="联系电话"
            :value="formData.contactPhone"
            @input="e => formData.contactPhone = e.target.value"
            placeholder="请输入电话"
            class="md3-form-field"
          />
          <md-outlined-text-field
            label="邮箱"
            :value="formData.email"
            @input="e => formData.email = e.target.value"
            placeholder="请输入邮箱"
            class="md3-form-field"
          />
          <md-outlined-text-field
            label="地址"
            type="textarea"
            :value="formData.address"
            @input="e => formData.address = e.target.value"
            placeholder="请输入地址"
            class="md3-form-field"
          />
          <div class="md3-form-field switch-field">
            <label>状态</label>
            <md-switch
              :selected="formData.status === 1"
              @change="e => formData.status = e.target.selected ? 1 : 0"
            ></md-switch>
            <span>{{ formData.status === 1 ? '启用' : '禁用' }}</span>
          </div>
        </form>
      </div>
      <div slot="actions">
        <md-text-button @click="dialogVisible = false">取消</md-text-button>
        <md-filled-button @click="handleSubmit">确定</md-filled-button>
      </div>
    </md-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import MdPagination from '@/components/MdPagination.vue';
import api from '@/api';
import { notifyError, notifySuccess } from '@/utils/notify'

const filter = reactive({
  keyword: '',
  status: ''
});

const tableData = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const dialogVisible = ref(false);
const dialogTitle = ref('新增客户');
const formData = reactive({
  id: null,
  code: '',
  name: '',
  contactPerson: '',
  contactPhone: '',
  email: '',
  address: '',
  status: 1
});

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...filter
    };
    const res = await api.getCustomers(params);
    tableData.value = res.data?.items || [];
    total.value = res.data?.total || 0;
  } catch (error) {
    notifyError('获取列表失败');
  } finally {
    loading.value = false;
  }
};

const resetFilter = () => {
  filter.keyword = '';
  filter.status = '';
  fetchData();
};

const handleAdd = () => {
  dialogTitle.value = '新增客户';
  Object.keys(formData).forEach(k => formData[k] = '');
  formData.id = null;
  formData.status = 1;
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  dialogTitle.value = '编辑客户';
  Object.keys(formData).forEach(k => formData[k] = row[k]);
  formData.id = row.id;
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formData.code || !formData.name) {
    notifyError('编码和名称为必填项');
    return;
  }
  try {
    if (formData.id) {
      await api.updateCustomer(formData.id, formData);
      notifySuccess('更新成功');
    } else {
      await api.createCustomer(formData);
      notifySuccess('创建成功');
    }
    dialogVisible.value = false;
    fetchData();
  } catch (error) {
    notifyError(error.response?.data?.message || '保存失败');
  }
};

const handleDelete = async (row) => {
  if (!confirm('确定要删除该客户吗？')) return;
  try {
    await api.deleteCustomer(row.id);
    notifySuccess('删除成功');
    fetchData();
  } catch (error) {
    notifyError(error.response?.data?.message || '删除失败');
  }
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
  display: grid;
  grid-template-columns: 1fr 220px auto;
  align-items: center;
  gap: 12px;
}

.md3-field {
  width: 100%;
}

.md3-toolbar-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.md3-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.md3-action-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--md-sys-color-on-surface);
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

.danger-btn {
  --md-text-button-label-text-color: var(--md-sys-color-error);
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

.md3-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 400px;
  padding: 8px 0;
}

.md3-form-field {
  width: 100%;
}

.switch-field {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 1100px) {
  .md3-toolbar {
    grid-template-columns: 1fr 1fr;
  }

  .md3-toolbar-actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}
</style>
