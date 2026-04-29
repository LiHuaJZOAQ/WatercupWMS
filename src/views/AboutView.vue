<template>
  <div class="erp-container md3-page">
    <md-elevated-card class="filter-card md3-card">
      <form class="filter-row" @submit.prevent="handleSearch">
        <div class="filter-col">
          <label>原料名称</label>
          <md-outlined-text-field
            :value="searchForm.materialName"
            @input="searchForm.materialName = $event.target.value"
            placeholder="请输入原料名称"
          />
        </div>
        <div class="filter-col">
          <label>仓位编号</label>
          <md-outlined-text-field
            :value="searchForm.locationCode"
            @input="searchForm.locationCode = $event.target.value"
            placeholder="请输入仓位编号"
          />
        </div>
        <div class="filter-actions">
          <md-text-button @click.prevent="resetSearch">重置</md-text-button>
          <md-filled-button @click.prevent="handleSearch">查询</md-filled-button>
        </div>
      </form>
    </md-elevated-card>

    <md-elevated-card class="md3-card md3-card--tight" style="margin-bottom: 16px;">
      <div class="action-bar md3-action-bar">
        <md-filled-tonal-button class="action-btn" @click="handleAdd">
          <md-icon slot="icon">add</md-icon>新增
        </md-filled-tonal-button>
        <md-filled-button 
          class="action-btn" 
          :disabled="!selectedRows.length" 
          @click="handleBatchDelete"
        >
          <md-icon slot="icon">delete</md-icon>批量删除
        </md-filled-button>
      </div>
    </md-elevated-card>

    <md-elevated-card class="data-container md3-card md3-table-card">
      <div style="padding: 16px; overflow-x: auto;">
        <table class="md3-table" style="width: 100%;">
          <thead>
            <tr>
              <th><md-checkbox @change="toggleAll" :checked="selectedRows.length === tableData.length && tableData.length > 0"></md-checkbox></th>
              <th>原料编码</th>
              <th>原料名称</th>
              <th>规格</th>
              <th>仓位编号</th>
              <th>仓位名称</th>
              <th>库存数量</th>
              <th>单位</th>
              <th>状态</th>
              <th>备注</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="11" style="text-align: center; padding: 20px;">加载中...</td>
            </tr>
            <tr v-else-if="tableData.length === 0">
              <td colspan="11" style="text-align: center; padding: 20px;">暂无数据</td>
            </tr>
            <tr v-else v-for="row in tableData" :key="row.id">
              <td>
                <md-checkbox 
                  :checked="selectedRows.includes(row)" 
                  @change="toggleSelection(row, $event)"
                ></md-checkbox>
              </td>
              <td>{{ row.materialCode }}</td>
              <td>{{ row.materialName }}</td>
              <td>{{ row.specification }}</td>
              <td>{{ row.locationCode }}</td>
              <td>{{ row.locationName }}</td>
              <td>{{ row.quantity }}</td>
              <td>{{ row.unit }}</td>
              <td>
                <span :class="['status-tag', row.status === '1' ? 'status-success' : 'status-danger']">
                  {{ row.status === '1' ? '启用' : '禁用' }}
                </span>
              </td>
              <td>{{ row.remark }}</td>
              <td>
                <md-text-button @click="handleEdit(row)">编辑</md-text-button>
                <md-text-button @click="handleDelete(row)" style="--md-sys-color-primary: var(--md-sys-color-error);">删除</md-text-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <MdPagination
          :current-page="pagination.currentPage"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          @current-change="handleCurrentChange"
        />
      </div>
    </md-elevated-card>

    <!-- 新增/编辑对话框 -->
    <md-dialog :open="dialogVisible" @closed="dialogVisible = false">
      <div slot="headline">{{ dialogTitle }}</div>
      <div slot="content" style="display: flex; flex-direction: column; gap: 16px; padding-top: 8px;">
        <form id="editForm" @submit.prevent="submitForm">
          <div class="form-row">
            <label>原料</label>
            <md-outlined-select
              :value="formData.materialId"
              @change="formData.materialId = $event.target.value"
              style="width: 100%"
            >
              <md-select-option
                v-for="item in materialOptions"
                :key="item.id"
                :value="item.id"
              >
                <div slot="headline">{{ item.name }}</div>
              </md-select-option>
            </md-outlined-select>
          </div>
          
          <div class="form-row" style="display: flex; gap: 16px;">
            <div style="flex: 1;">
              <label>仓位编号</label>
              <md-outlined-text-field
                :value="formData.locationCode"
                @input="formData.locationCode = $event.target.value"
                style="width: 100%"
              />
            </div>
            <div style="flex: 1;">
              <label>仓位名称</label>
              <md-outlined-text-field
                :value="formData.locationName"
                @input="formData.locationName = $event.target.value"
                style="width: 100%"
              />
            </div>
          </div>
          
          <div class="form-row" style="display: flex; gap: 16px;">
            <div style="flex: 1;">
              <label>库存数量</label>
              <md-outlined-text-field
                type="number"
                :value="formData.quantity"
                @input="formData.quantity = $event.target.value"
                style="width: 100%"
              />
            </div>
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 8px;">状态</label>
              <div style="display: flex; gap: 16px; align-items: center;">
                <label style="display: flex; align-items: center; gap: 4px;">
                  <md-radio name="status" value="1" :checked="formData.status == 1" @change="formData.status = 1"></md-radio>
                  启用
                </label>
                <label style="display: flex; align-items: center; gap: 4px;">
                  <md-radio name="status" value="0" :checked="formData.status == 0" @change="formData.status = 0"></md-radio>
                  禁用
                </label>
              </div>
            </div>
          </div>
          
          <div class="form-row">
            <label>备注</label>
            <md-outlined-text-field
              type="textarea"
              :value="formData.remark"
              @input="formData.remark = $event.target.value"
              style="width: 100%"
            />
          </div>
        </form>
      </div>
      <div slot="actions">
        <md-text-button @click="dialogVisible = false">取消</md-text-button>
        <md-filled-button @click="submitForm">确定</md-filled-button>
      </div>
    </md-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { notifySuccess, notifyError } from '@/utils/notify'
import MdPagination from '@/components/MdPagination.vue'

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
const formData = reactive({
  id: '',
  materialId: '',
  locationCode: '',
  locationName: '',
  quantity: 0,
  status: 1,
  remark: ''
})

// 原料下拉选项
const materialOptions = ref([])

// 获取原料列表
const getMaterialOptions = async () => {
  try {
    const res = await mockApi.getMaterials()
    materialOptions.value = res
  } catch (error) {
    notifyError('获取原料列表失败')
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
    notifyError('获取数据失败')
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

// 当前页改变
const handleCurrentChange = (val) => {
  pagination.currentPage = val
  getTableData()
}

// 表格多选
const toggleSelection = (row, event) => {
  if (event.target.checked) {
    selectedRows.value.push(row)
  } else {
    selectedRows.value = selectedRows.value.filter(r => r.id !== row.id)
  }
}

const toggleAll = (event) => {
  if (event.target.checked) {
    selectedRows.value = [...tableData.value]
  } else {
    selectedRows.value = []
  }
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
  if (confirm('确认删除该仓位信息吗？')) {
    notifySuccess('删除成功')
    getTableData()
  } else {
    // cancelled
  }
}

// 批量删除
const handleBatchDelete = () => {
  if (!selectedRows.value.length) {
    notifyError('请至少选择一条数据')
    return
  }
  
  if (confirm(`确认删除选中的${selectedRows.value.length}条数据吗？`)) {
    notifySuccess('删除成功')
    selectedRows.value = []
    getTableData()
  }
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
}

// 提交表单
const submitForm = async () => {
  try {
    if (!formData.materialId) { notifyError('请选择原料'); return; }
    if (!formData.locationCode) { notifyError('请输入仓位编号'); return; }
    if (!formData.locationName) { notifyError('请输入仓位名称'); return; }
    if (formData.quantity === '' || formData.quantity === null) { notifyError('请输入库存数量'); return; }
    
    const isEdit = !!formData.id
    const message = isEdit ? '编辑成功' : '新增成功'
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    notifySuccess(message)
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
}

.filter-row {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    align-items: flex-end;
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
}

.filter-actions {
    display: flex;
    gap: 12px;
}

.form-row {
    margin-bottom: 16px;
    label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #333;
        font-size: 14px;
    }
}

.status-tag {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
}
.status-success {
    background: #e1f3d8;
    color: #67c23a;
}
.status-danger {
    background: #fde2e2;
    color: #f56c6c;
}

.pagination {
    padding: 16px;
    display: flex;
    justify-content: center;
    background: white;
}
</style>
