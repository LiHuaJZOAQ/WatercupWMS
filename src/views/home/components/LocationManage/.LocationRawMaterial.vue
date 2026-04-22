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
                  :label="item.name"
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

// 模拟API请求
const mockApi = {
  getList: (params) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          materialId: i % 5 + 1,
          materialCode: `MAT-${1000 + i % 5}`,
          materialName: ['面粉', '白糖', '鸡蛋', '黄油', '巧克力'][i % 5],
          specification: ['25kg/袋', '50kg/包', '30枚/箱', '10kg/箱', '5kg/箱'][i % 5],
          locationCode: `LOC-${1000 + i}`,
          locationName: `仓库A-${i % 10 + 1}区-${i % 5 + 1}排`,
          quantity: Math.random() * 1000,
          unit: ['kg', 'kg', '个', 'kg', 'kg'][i % 5],
          status: i % 4 === 0 ? '0' : '1',
          remark: i % 3 === 0 ? '易碎品，轻拿轻放' : '常温保存',
          createTime: '2023-01-01'
        }))
        
        // 模拟筛选
        let filteredData = [...data]
        if (params.materialName) {
          filteredData = filteredData.filter(item => 
            item.materialName.includes(params.materialName)
          )
        }
        if (params.locationCode) {
          filteredData = filteredData.filter(item => 
            item.locationCode.includes(params.locationCode)
          )
        }
        
        // 模拟分页
        const start = (params.page - 1) * params.pageSize
        const end = start + params.pageSize
        const pageData = filteredData.slice(start, end)
        
        resolve({
          data: pageData,
          total: filteredData.length
        })
      }, 500)
    })
  },
  getMaterials: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 1, code: 'MAT-1001', name: '面粉', unit: 'kg' },
          { id: 2, code: 'MAT-1002', name: '白糖', unit: 'kg' },
          { id: 3, code: 'MAT-1003', name: '鸡蛋', unit: '个' },
          { id: 4, code: 'MAT-1004', name: '黄油', unit: 'kg' },
          { id: 5, code: 'MAT-1005', name: '巧克力', unit: 'kg' }
        ])
      }, 300)
    })
  }
}

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
const getMaterialOptions = async () => {
  try {
    const res = await mockApi.getMaterials()
    materialOptions.value = res
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
      ...searchForm,
      page: pagination.currentPage,
      pageSize: pagination.pageSize
    }
    const res = await mockApi.getList(params)
    tableData.value = res.data
    pagination.total = res.total
  } catch (error) {
    ElMessage.error('获取数据失败')
    console.error(error)
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

// 分页大小改变
const handleSizeChange = (val) => {
  pagination.pageSize = val
  getTableData()
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
  }).then(() => {
    // 这里调用删除API
    ElMessage.success('删除成功')
    getTableData()
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
  }).then(() => {
    // 这里调用批量删除API
    ElMessage.success('删除成功')
    getTableData()
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
    
    // 这里调用新增/编辑API
    const isEdit = !!formData.id
    const message = isEdit ? '编辑成功' : '新增成功'
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    ElMessage.success(message)
    dialogVisible.value = false
    getTableData()
  } catch (error) {
    console.error('表单验证失败', error)
  }
}

// 初始化
onMounted(() => {
  getTableData()
  getMaterialOptions()
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