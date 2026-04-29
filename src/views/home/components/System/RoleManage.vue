<template>
  <div class="md3-page">
    <md-elevated-card class="md3-card md3-card--tight">
      <div class="md3-action-row">
        <div class="md3-action-title">角色管理</div>
        <md-filled-tonal-button @click="handleAdd">
          <md-icon slot="icon">add</md-icon>
          新增角色
        </md-filled-tonal-button>
      </div>
    </md-elevated-card>

    <md-elevated-card class="md3-card md3-table-card">
      <div class="md3-table-container">
        <table class="md3-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>角色名称</th>
              <th>角色描述</th>
              <th>角色类型</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in tableData" :key="row.id">
              <td>{{ row.id }}</td>
              <td>{{ row.name }}</td>
              <td>{{ row.description }}</td>
              <td>
                <span :class="['status-tag', row.isSystem === 1 ? 'status-danger' : 'status-info']">
                  {{ row.isSystem === 1 ? '系统内置' : '自定义' }}
                </span>
              </td>
              <td>{{ row.createdAt }}</td>
              <td>
                <md-text-button @click="handleEdit(row)" :disabled="row.isSystem === 1">编辑</md-text-button>
                <md-text-button class="danger-btn" @click="handleDelete(row)" :disabled="row.isSystem === 1">删除</md-text-button>
              </td>
            </tr>
            <tr v-if="tableData.length === 0">
              <td colspan="6" class="empty-text">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </md-elevated-card>

    <!-- 角色表单弹窗 -->
    <md-dialog :open="dialogVisible" @closed="dialogVisible = false">
      <div slot="headline">{{ dialogTitle }}</div>
      <div slot="content">
        <form class="md3-form" @submit.prevent>
          <md-outlined-text-field
            label="角色名称*"
            :value="formData.name"
            @input="e => formData.name = e.target.value"
            placeholder="例如: 仓库管理员"
            class="md3-form-field"
          />
          <md-outlined-text-field
            label="描述"
            type="textarea"
            :value="formData.description"
            @input="e => formData.description = e.target.value"
            placeholder="角色职责描述"
            class="md3-form-field"
          />
          
          <div class="tree-container-wrapper">
            <label class="tree-label">菜单权限</label>
            <div class="tree-container">
              <MdTree
                ref="treeRef"
                :data="permissionsTree"
                node-key="id"
                :props="defaultProps"
                :default-checked-keys="formData.permissionIds"
              />
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
import { ref, reactive, onMounted, nextTick } from 'vue';
import MdTree from '@/components/MdTree.vue';
import api from '@/api';
import { notifyError, notifySuccess } from '@/utils/notify'

const tableData = ref([]);
const loading = ref(false);
const permissionsTree = ref([]);

const dialogVisible = ref(false);
const dialogTitle = ref('新增角色');
const treeRef = ref(null);

const formData = reactive({
  id: null,
  name: '',
  description: '',
  permissionIds: []
});

const defaultProps = {
  children: 'children',
  label: 'name'
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.getRoles();
    tableData.value = res.data?.items || [];
  } catch (error) {
    notifyError('获取列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchPermissions = async () => {
  try {
    const res = await api.getPermissions();
    permissionsTree.value = res.data?.items || [];
  } catch (error) {
    console.error('获取权限树失败', error);
  }
};

const handleAdd = () => {
  dialogTitle.value = '新增角色';
  formData.id = null;
  formData.name = '';
  formData.description = '';
  formData.permissionIds = [];
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  dialogTitle.value = '编辑角色';
  formData.id = row.id;
  formData.name = row.name;
  formData.description = row.description || '';
  formData.permissionIds = row.permissionIds || [];
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formData.name) {
    notifyError('角色名称为必填项');
    return;
  }
  try {
    // 获取树形组件中勾选的节点
    if (treeRef.value) {
      const checkedKeys = treeRef.value.getCheckedKeys();
      // material-web MdTree 默认可能不提供 getHalfCheckedKeys，但这里假设返回的 checkedKeys 足够，或组件内已处理。
      // 如果需要半选节点可以合并，这里暂时只使用 checkedKeys。根据需求可以调整。
      formData.permissionIds = checkedKeys;
    }

    if (formData.id) {
      await api.updateRole(formData.id, formData);
      notifySuccess('更新成功');
    } else {
      await api.createRole(formData);
      notifySuccess('创建成功');
    }
    dialogVisible.value = false;
    fetchData();
  } catch (error) {
    notifyError(error.response?.data?.message || '保存失败');
  }
};

const handleDelete = async (row) => {
  if (!confirm(`确定要删除角色 ${row.name} 吗？`)) return;
  try {
    await api.deleteRole(row.id);
    notifySuccess('删除成功');
    fetchData();
  } catch (error) {
    notifyError(error.response?.data?.message || '删除失败');
  }
};

onMounted(() => {
  fetchData();
  fetchPermissions();
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
.status-info {
  background: #e8f0fe;
  color: #1a73e8;
}
.status-danger {
  background: #fce8e6;
  color: #d93025;
}

.danger-btn {
  --md-text-button-label-text-color: var(--md-sys-color-error);
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

.tree-container-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tree-label {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant);
  margin-left: 4px;
}

.tree-container {
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 16px;
  padding: 10px;
}
</style>
