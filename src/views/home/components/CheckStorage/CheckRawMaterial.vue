<template>
  <div class="erp-container">
    <!-- 筛选卡片 -->
    <div class="filter-card">
      <div class="filter-row">
        <div class="filter-col">
          <label>原料名称/编码</label>
          <el-input
            v-model="searchQuery"
            placeholder="请输入原料名称或编码"
            clearable
            @clear="clearSearch"
          />
        </div>
        <div class="filter-col">
          <label>分类</label>
          <el-select
            v-model="categoryFilter"
            placeholder="全部分类"
            clearable
          >
            <el-option
              v-for="item in categories"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <div class="filter-col">
          <label>状态</label>
          <el-select
            v-model="statusFilter"
            placeholder="全部状态"
            clearable
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
      </div>
      <div class="filter-actions">
        <el-button class="btn-reset" @click="resetFilters">重置</el-button>
        <el-button class="btn-primary" @click="handleSearch">查询</el-button>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button class="action-btn" type="primary" @click="handleAdd">
        <i class="el-icon-plus"></i>
        新增原料
      </el-button>
      <el-button class="action-btn" type="success" @click="startInventory">
        <i class="el-icon-check"></i>
        开始盘点
      </el-button>
      <el-button class="action-btn" @click="exportData">
        <i class="el-icon-download"></i>
        导出数据
      </el-button>
    </div>

    <!-- 数据表格 -->
    <div class="data-container">
      <el-table
        :data="filteredMaterials"
        border
        stripe
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="code" label="原料编码" width="120" />
        <el-table-column prop="name" label="原料名称" width="150" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="specification" label="规格" width="180" />
        <el-table-column prop="unit" label="单位" width="80" align="center" />
        <el-table-column prop="stock" label="库存数量" width="120" align="right">
          <template #default="{ row }">
            {{ row.stock.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="inventoryCount" label="盘点数量" width="150" align="right">
          <template #default="{ row }">
            <el-input-number
              v-model="row.inventoryCount"
              :min="0"
              :precision="2"
              controls-position="right"
              size="small"
              style="width: 120px"
            />
          </template>
        </el-table-column>
        <el-table-column prop="difference" label="差异" width="120" align="right">
          <template #default="{ row }">
            <span :class="getDifferenceClass(row.difference)">
              {{ row.difference.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-link
              class="action-link"
              type="primary"
              @click="editMaterial(row)"
            >
              编辑
            </el-link>
            <el-link
              class="action-link"
              type="danger"
              @click="deleteMaterial(row)"
            >
              删除
            </el-link>
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
          :total="totalItems"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="currentMaterial"
        label-width="100px"
        :rules="formRules"
        ref="materialForm"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="原料编码" prop="code">
              <el-input v-model="currentMaterial.code" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="原料名称" prop="name">
              <el-input v-model="currentMaterial.name" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="currentMaterial.category" placeholder="请选择">
                <el-option
                  v-for="item in categories"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="currentMaterial.unit" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="规格" prop="specification">
          <el-input v-model="currentMaterial.specification" />
        </el-form-item>
        <el-form-item label="库存数量" prop="stock">
          <el-input-number
            v-model="currentMaterial.stock"
            :min="0"
            :precision="2"
            :controls="false"
            style="width: 200px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const materials = ref([])
const loading = ref(false)
const searchQuery = ref('')
const categoryFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const currentMaterial = ref({
  id: null,
  code: '',
  name: '',
  category: '',
  specification: '',
  unit: '',
  stock: 0,
  inventoryCount: 0,
  difference: 0,
  status: '正常'
})
const selectedMaterials = ref([])

// 分类选项
const categories = [
  { value: '金属', label: '金属' },
  { value: '塑料', label: '塑料' },
  { value: '木材', label: '木材' },
  { value: '电子', label: '电子' },
  { value: '化工', label: '化工' }
]

// 状态选项
const statusOptions = [
  { value: '正常', label: '正常' },
  { value: '盘盈', label: '盘盈' },
  { value: '盘亏', label: '盘亏' }
]

// 表单验证规则
const formRules = {
  code: [{ required: true, message: '请输入原料编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入原料名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存数量', trigger: 'blur' }]
}

// 计算属性
const filteredMaterials = computed(() => {
  let result = materials.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query)
    )
  }

  // 分类过滤
  if (categoryFilter.value) {
    result = result.filter(item => item.category === categoryFilter.value)
  }

  // 状态过滤
  if (statusFilter.value) {
    result = result.filter(item => item.status === statusFilter.value)
  }

  // 计算差异和状态
  result.forEach(item => {
    item.difference = item.inventoryCount - item.stock
    if (item.difference > 0) {
      item.status = '盘盈'
    } else if (item.difference < 0) {
      item.status = '盘亏'
    } else {
      item.status = '正常'
    }
  })

  // 分页
  totalItems.value = result.length
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

// 生命周期钩子
onMounted(() => {
  fetchMaterials()
})

// 方法
const fetchMaterials = () => {
  loading.value = true
  // 模拟API请求
  setTimeout(() => {
    materials.value = [
      {
        id: 1,
        code: 'MAT-001',
        name: '不锈钢板',
        category: '金属',
        specification: '304/1.0mm',
        unit: '张',
        stock: 100.00,
        inventoryCount: 0,
        difference: 0,
        status: '正常'
      },
      {
        id: 2,
        code: 'MAT-002',
        name: '铝合金型材',
        category: '金属',
        specification: '6061-T6',
        unit: '米',
        stock: 250.50,
        inventoryCount: 0,
        difference: 0,
        status: '正常'
      },
      {
        id: 3,
        code: 'MAT-003',
        name: 'PVC板',
        category: '塑料',
        specification: '5mm白色',
        unit: '张',
        stock: 80.00,
        inventoryCount: 0,
        difference: 0,
        status: '正常'
      },
      {
        id: 4,
        code: 'MAT-004',
        name: '亚克力板',
        category: '塑料',
        specification: '3mm透明',
        unit: '张',
        stock: 60.00,
        inventoryCount: 0,
        difference: 0,
        status: '正常'
      },
      {
        id: 5,
        code: 'MAT-005',
        name: '实木板',
        category: '木材',
        specification: '18mm橡木',
        unit: '张',
        stock: 45.00,
        inventoryCount: 0,
        difference: 0,
        status: '正常'
      }
    ]
    loading.value = false
    totalItems.value = materials.value.length
  }, 800)
}

const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const resetFilters = () => {
  searchQuery.value = ''
  categoryFilter.value = ''
  statusFilter.value = ''
  currentPage.value = 1
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

const handleSelectionChange = (val) => {
  selectedMaterials.value = val
}

const getDifferenceClass = (difference) => {
  if (difference > 0) return 'positive-difference'
  if (difference < 0) return 'negative-difference'
  return ''
}

const getStatusTagType = (status) => {
  switch (status) {
    case '正常': return 'success'
    case '盘盈': return 'warning'
    case '盘亏': return 'danger'
    default: return ''
  }
}

const handleAdd = () => {
  dialogTitle.value = '新增原料'
  currentMaterial.value = {
    id: null,
    code: '',
    name: '',
    category: '',
    specification: '',
    unit: '',
    stock: 0,
    inventoryCount: 0,
    difference: 0,
    status: '正常'
  }
  dialogVisible.value = true
}

const editMaterial = (row) => {
  dialogTitle.value = '编辑原料'
  currentMaterial.value = JSON.parse(JSON.stringify(row))
  dialogVisible.value = true
}

const deleteMaterial = (row) => {
  ElMessageBox.confirm('确认删除该原料记录吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    materials.value = materials.value.filter(item => item.id !== row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const startInventory = () => {
  if (selectedMaterials.value.length === 0) {
    ElMessage.warning('请至少选择一项原料进行盘点')
    return
  }

  ElMessageBox.confirm('确认开始盘点选中的原料吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    selectedMaterials.value.forEach(item => {
      const material = materials.value.find(m => m.id === item.id)
      if (material) {
        material.inventoryCount = material.stock // 模拟盘点数量等于库存数量
      }
    })
    ElMessage.success('盘点操作已提交')
  }).catch(() => {})
}

const exportData = () => {
  ElMessage.success('导出数据成功')
}

const submitForm = () => {
  // 表单验证
  const form = document.querySelector('.el-form')
  if (!form) return

  const isValid = form.checkValidity()
  if (!isValid) {
    ElMessage.error('请填写完整表单')
    return
  }

  // 模拟保存操作
  if (currentMaterial.value.id) {
    // 更新
    const index = materials.value.findIndex(
      item => item.id === currentMaterial.value.id
    )
    if (index !== -1) {
      materials.value[index] = currentMaterial.value
    }
    ElMessage.success('更新成功')
  } else {
    // 新增
    const newId = Math.max(...materials.value.map(item => item.id)) + 1
    currentMaterial.value.id = newId
    materials.value.push(currentMaterial.value)
    ElMessage.success('新增成功')
  }

  dialogVisible.value = false
}
</script>

<style scoped lang="scss">
.erp-container {
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  background-color: #f0f2f5;
  padding: 16px;
  height: 100%;
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
  overflow: hidden;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.data-container .el-table {
  flex: 1;
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

.positive-difference {
  color: #67c23a;
}

.negative-difference {
  color: #f56c6c;
}
</style>