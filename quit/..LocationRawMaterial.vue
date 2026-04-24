<template>
  <div class="erp-container">
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="searchForm" class="filter-row">
        <div class="filter-col">
          <label>原料名称</label>
          <el-input
            v-model="searchForm.materialName"
            placeholder="请输入原料名称"
            clearable
          />
        </div>
        <div class="filter-col">
          <label>仓位编号</label>
          <el-input
            v-model="searchForm.locationCode"
            placeholder="请输入仓位编号"
            clearable
          />
        </div>
        <div class="filter-actions">
          <el-button class="btn-reset" @click="resetSearch">重置</el-button>
          <el-button type="primary" class="btn-primary" @click="handleSearch">查询</el-button>
        </div>
      </el-form>
    </el-card>

    <div class="action-bar">
      <el-button type="primary" class="action-btn" @click="handleAdd">
        <el-icon><Plus /></el-icon>新增
      </el-button>
      <el-button 
        type="danger" 
        class="action-btn" 
        :disabled="!selectedRows.length" 
        @click="handleBatchDelete"
      >
        <el-icon><Delete /></el-icon>批量删除
      </el-button>
    </div>

    <div class="data-container">
      <div class="table-container">
        <el-table
          v-loading="loading"
          :data="tableData"
          border
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="materialCode" label="原料编码" width="120" />
          <el-table-column prop="materialName" label="原料名称" width="150" />
          <el-table-column prop="specification" label="规格" width="120" />
          <el-table-column prop="locationCode" label="仓位编号" width="120" />
          <el-table-column prop="locationName" label="仓位名称" width="150" />
          <el-table-column prop="quantity" label="库存数量" width="120" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === '1' ? 'success' : 'danger'">
                {{ row.status === '1' ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" link type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="prev, pager, next"
          :current-page="pagination.currentPage"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-row>
          <el-col :span="24">
            <el-form-item label="原料名称" prop="materialId">
              <el-select
                v-model="formData.materialId"
                placeholder="请选择原料"
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="item in materialOptions"
                  :key="item.id"
                  :label="`${item.name} (${item.code})`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row>
          <el-col :span="12">
            <el-form-item label="仓位编号" prop="locationCode">
              <el-input v-model="formData.locationCode" placeholder="请输入仓位编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="仓位名称" prop="locationName">
              <el-input v-model="formData.locationName" placeholder="请输入仓位名称" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row>
          <el-col :span="12">
            <el-form-item label="库存数量" prop="quantity">
              <el-input-number
                v-model="formData.quantity"
                :min="0"
                :precision="2"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio :label="1">启用</el-radio>
                <el-radio :label="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="formData.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入备注"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import {
  getRawMaterialLocationList,
  addRawMaterialLocation,
  updateRawMaterialLocation,
  deleteRawMaterialLocation,
  batchDeleteRawMaterialLocation,
  getMaterialOptions
} from '@/api/location'

// 搜索表单
const searchForm = reactive({
  materialName: '',
  locationCode: ''
})

// 表格数据
const tableData = ref([])
const loading = ref(false)
const selectedRows = ref([])

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const formData = reactive({
  id: '',
  materialId: '',
  locationCode: '',
  locationName: '',
  quantity: 0,
  status: 1,
  remark: ''
})

// 表单验证规则
const formRules = reactive({
  materialId: [{ required: true, message: '请选择原料', trigger: 'change' }],
  locationCode: [{ required: true, message: '请输入仓位编号', trigger: 'blur' }],
  locationName: [{ required: true, message: '请输入仓位名称', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入库存数量', trigger: 'blur' }]
})

// 原料下拉选项
const materialOptions = ref([])

// 获取原料列表
const getMaterialOptionsList = async () => {
  try {
    const response = await getMaterialOptions()
    if (response.data) {
      materialOptions.value = response.data
      console.log('获取原料列表成功', materialOptions.value)
    }
  } catch (error) {
    ElMessage.error('获取原料列表失败')
    console.error(error)
  }
}

// 获取表格数据
const getTableData = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      materialName: searchForm.materialName || undefined,
      locationCode: searchForm.locationCode || undefined
    }
    
    const response = await getRawMaterialLocationList(params)
    
    if (response.data) {
      tableData.value = response.data.list || []
      pagination.total = response.data.total || 0
    } else {
      tableData.value = []
      pagination.total = 0
    }
  } catch (error) {
    ElMessage.error('获取数据失败')
    console.error(error)
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 查询
const handleSearch = () => {
  pagination.currentPage = 1
  getTableData()
}

// 重置查询
const resetSearch = () => {
  searchForm.materialName = ''
  searchForm.locationCode = ''
  handleSearch()
}

// 当前页改变
const handleCurrentChange = (val) => {
  pagination.currentPage = val
  getTableData()
}

// 表格多选
const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增仓位'
  resetForm()
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogTitle.value = '编辑仓位'
  Object.assign(formData, {
    id: row.id,
    materialId: row.materialId,
    locationCode: row.locationCode,
    locationName: row.locationName,
    quantity: row.quantity,
    status: row.status === '1' ? 1 : 0,
    remark: row.remark
  })
  dialogVisible.value = true
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该仓位信息吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteRawMaterialLocation(row.id)
      ElMessage.success('删除成功')
      getTableData()
    } catch (error) {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 批量删除
const handleBatchDelete = () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请至少选择一条数据')
    return
  }
  
  ElMessageBox.confirm(`确认删除选中的${selectedRows.value.length}条数据吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const ids = selectedRows.value.map(row => row.id)
      await batchDeleteRawMaterialLocation(ids)
      ElMessage.success('删除成功')
      getTableData()
    } catch (error) {
      ElMessage.error(error.response?.data?.message || '批量删除失败')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    id: '',
    materialId: '',
    locationCode: '',
    locationName: '',
    quantity: 0,
    status: 1,
    remark: ''
  })
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate()
    
    const isEdit = !!formData.id
    const submitData = {
      materialId: formData.materialId,
      locationCode: formData.locationCode,
      locationName: formData.locationName,
      quantity: formData.quantity,
      status: formData.status,
      remark: formData.remark
    }
    
    if (isEdit) {
      await updateRawMaterialLocation(formData.id, submitData)
      ElMessage.success('编辑成功')
    } else {
      await addRawMaterialLocation(submitData)
      ElMessage.success('新增成功')
    }
    
    dialogVisible.value = false
    getTableData()
  } catch (error) {
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      console.error('表单验证失败', error)
    }
  }
}

// 初始化
onMounted(() => {
  getTableData()
  getMaterialOptionsList()
})
</script>

<style scoped lang="scss">
.erp-container {
    display: flex;
    flex-direction: column;
    font-family: 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
    background-color: #f0f2f5;
    padding: 16px;
    height: 100%;
    box-sizing: border-box;
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

    label {
        margin-bottom: 8px;
        font-weight: 500;
        color: #333;
        font-size: 14px;
        white-space: nowrap;
    }

    .el-input {
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
}

.filter-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    justify-content: flex-end;
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
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    overflow: hidden;
}

.table-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    
    .el-table {
        width: 100%;
        
        ::v-deep .cell {
            padding: 12px;
        }
    }
}

.pagination-container {
    padding: 16px;
    border-top: 1px solid #ebeef5;
    background: white;
}

.el-dialog {
    border-radius: 8px;

    .el-dialog__header {
        border-bottom: 1px solid #e4e7ed;
        margin-right: 0;
    }

    .el-dialog__body {
        padding: 24px;
    }

    .el-dialog__footer {
        border-top: 1px solid #e4e7ed;
        padding: 16px 24px;
    }
}

.el-form {
    .el-row {
        margin-bottom: 16px;

        &:last-child {
            margin-bottom: 0;
        }
    }

    .el-input-number {
        width: 100%;
    }
}
</style>