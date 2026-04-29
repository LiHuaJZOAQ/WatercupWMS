<template>
  <div class="md3-page">
    <md-elevated-card class="md3-card">
      <div class="md3-toolbar">
        <md-outlined-text-field
          class="md3-field"
          label="关键字"
          placeholder="用户名/姓名/邮箱"
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
          <md-select-option value="1"><div slot="headline">激活</div></md-select-option>
          <md-select-option value="0"><div slot="headline">停用</div></md-select-option>
        </md-outlined-select>

        <div class="md3-toolbar-actions">
          <md-filled-button :disabled="loading" @click="fetchData">查询</md-filled-button>
          <md-text-button @click="resetFilter">重置</md-text-button>
        </div>
      </div>
    </md-elevated-card>

    <md-elevated-card class="md3-card md3-card--tight">
      <div class="md3-action-row">
        <div class="md3-action-title">用户管理</div>
        <md-filled-tonal-button @click="handleAdd">
          <md-icon slot="icon">add</md-icon>
          新增用户
        </md-filled-tonal-button>
      </div>
    </md-elevated-card>

    <md-elevated-card class="md3-card md3-table-card">
      <div class="md3-table-container">
        <table class="md3-table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>姓名</th>
              <th>部门</th>
              <th>职位</th>
              <th>角色</th>
              <th>邮箱</th>
              <th>电话</th>
              <th>状态</th>
              <th>最后登录时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in tableData" :key="row.id">
              <td>{{ row.username }}</td>
              <td>{{ row.fullName }}</td>
              <td>{{ row.department }}</td>
              <td>{{ row.position }}</td>
              <td>
                <div class="role-tags">
                  <span v-for="role in row.roles" :key="role.roleId" class="role-tag">
                    {{ role.roleName }}
                  </span>
                </div>
              </td>
              <td>{{ row.email }}</td>
              <td>{{ row.phone }}</td>
              <td>
                <span :class="['status-tag', row.isActive === 1 ? 'status-success' : 'status-danger']">
                  {{ row.isActive === 1 ? '激活' : '停用' }}
                </span>
              </td>
              <td>{{ row.lastLoginTime }}</td>
              <td>
                <md-text-button @click="handleEdit(row)">编辑</md-text-button>
                <md-text-button class="danger-btn" @click="handleDelete(row)" :disabled="row.id === 1">删除</md-text-button>
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

    <!-- 表单弹窗 -->
    <md-dialog :open="dialogVisible" @closed="dialogVisible = false">
      <div slot="headline">{{ dialogTitle }}</div>
      <div slot="content">
        <form class="md3-form" @submit.prevent>
          <div class="md3-form-grid">
            <md-outlined-text-field
              label="用户名*"
              :value="formData.username"
              @input="e => formData.username = e.target.value"
              :disabled="!!formData.id"
              placeholder="登录账号"
              class="md3-form-field"
            />
            <md-outlined-text-field
              v-if="!formData.id"
              label="密码*"
              type="password"
              :value="formData.password"
              @input="e => formData.password = e.target.value"
              placeholder="初始密码"
              class="md3-form-field"
            />
            <md-outlined-text-field
              label="姓名*"
              :value="formData.fullName"
              @input="e => formData.fullName = e.target.value"
              placeholder="真实姓名"
              class="md3-form-field"
            />
            <md-outlined-text-field
              label="手机号"
              :value="formData.phone"
              @input="e => formData.phone = e.target.value"
              placeholder="联系电话"
              class="md3-form-field"
            />
            <md-outlined-text-field
              label="邮箱"
              :value="formData.email"
              @input="e => formData.email = e.target.value"
              placeholder="电子邮箱"
              class="md3-form-field"
            />
            <md-outlined-text-field
              label="部门"
              :value="formData.department"
              @input="e => formData.department = e.target.value"
              placeholder="所属部门"
              class="md3-form-field"
            />
            <md-outlined-text-field
              label="职位"
              :value="formData.position"
              @input="e => formData.position = e.target.value"
              placeholder="职务名称"
              class="md3-form-field"
            />
          </div>
          
          <div class="md3-form-field switch-field">
            <label>状态</label>
            <md-switch
              :selected="formData.isActive === 1"
              @change="e => formData.isActive = e.target.selected ? 1 : 0"
            ></md-switch>
            <span>{{ formData.isActive === 1 ? '激活' : '停用' }}</span>
          </div>

          <div class="role-selection">
            <label class="role-label">分配角色</label>
            <div class="role-checkboxes">
              <label v-for="role in rolesOptions" :key="role.id" class="role-checkbox-label">
                <md-checkbox
                  :checked="formData.roleIds.includes(role.id)"
                  @change="e => handleRoleChange(role.id, e.target.checked)"
                ></md-checkbox>
                <span>{{ role.name }}</span>
              </label>
            </div>
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

const filter = reactive({ keyword: '', status: '' });
const tableData = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const dialogVisible = ref(false);
const dialogTitle = ref('新增用户');
const rolesOptions = ref([]);

const formData = reactive({
  id: null,
  username: '',
  password: '',
  fullName: '',
  phone: '',
  email: '',
  department: '',
  position: '',
  isActive: 1,
  roleIds: []
});

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.getUsers({ page: currentPage.value, pageSize: pageSize.value, ...filter });
    tableData.value = res.data?.items || [];
    total.value = res.data?.total || 0;
  } catch (error) {
    notifyError('获取列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchRoles = async () => {
  try {
    const res = await api.getRoles();
    rolesOptions.value = res.data?.items || [];
  } catch (error) {
    console.error('获取角色选项失败', error);
  }
};

const resetFilter = () => {
  filter.keyword = ''; filter.status = '';
  fetchData();
};

const handleAdd = () => {
  dialogTitle.value = '新增用户';
  Object.keys(formData).forEach(k => formData[k] = (k === 'roleIds') ? [] : '');
  formData.id = null;
  formData.isActive = 1;
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  dialogTitle.value = '编辑用户';
  Object.keys(formData).forEach(k => formData[k] = row[k]);
  formData.id = row.id;
  formData.roleIds = row.roleIds || [];
  dialogVisible.value = true;
};

const handleRoleChange = (roleId, isChecked) => {
  if (isChecked) {
    if (!formData.roleIds.includes(roleId)) formData.roleIds.push(roleId);
  } else {
    formData.roleIds = formData.roleIds.filter(id => id !== roleId);
  }
};

const handleSubmit = async () => {
  if (!formData.username || !formData.fullName || (!formData.id && !formData.password)) {
    notifyError('用户名、姓名、密码(新增时)为必填项');
    return;
  }
  try {
    if (formData.id) {
      await api.updateUser(formData.id, formData);
      notifySuccess('更新成功');
    } else {
      await api.createUser(formData);
      notifySuccess('创建成功');
    }
    dialogVisible.value = false;
    fetchData();
  } catch (error) {
    notifyError(error.response?.data?.message || '保存失败');
  }
};

const handleDelete = async (row) => {
  if (!confirm(`确定要删除用户 ${row.username} 吗？`)) return;
  try {
    await api.deleteUser(row.id);
    notifySuccess('删除成功');
    fetchData();
  } catch (error) {
    notifyError(error.response?.data?.message || '删除失败');
  }
};

onMounted(() => {
  fetchData();
  fetchRoles();
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

.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.role-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  background: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  border: 1px solid var(--md-sys-color-outline-variant);
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
  min-width: 500px;
  padding: 8px 0;
}

.md3-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.md3-form-field {
  width: 100%;
}

.switch-field {
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-selection {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.role-label {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant);
  margin-left: 4px;
}

.role-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 12px;
}

.role-checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
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
