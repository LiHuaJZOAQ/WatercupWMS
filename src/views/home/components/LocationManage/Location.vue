<template>
  <div class="md3-page">
    <!-- 筛选卡片 -->
    <md-elevated-card class="md3-card">
    <div class="filter-card">
      <form class="filter-row" @submit.prevent="handleSearch">
        <div class="filter-col">
          <label>库位编号</label>
          <md-outlined-text-field
            :value="searchForm.locationCode"
            @input="searchForm.locationCode = $event.target.value"
            placeholder="请输入库位编号"
          />
        </div>
        <div class="filter-col">
          <label>库位名称</label>
          <md-outlined-text-field
            :value="searchForm.locationName"
            @input="searchForm.locationName = $event.target.value"
            placeholder="请输入库位名称"
          />
        </div>
        <div class="filter-col">
          <label>所属仓库</label>
          <md-outlined-select :value="searchForm.warehouseId" @change="searchForm.warehouseId = $event.target.value" placeholder="全部仓库">
            <md-select-option
              v-for="warehouse in warehouseOptions"
              :key="warehouse.value"
              :value="warehouse.value"
            >
              <div slot="headline">{{warehouse.label}}</div>
            </md-select-option>
          </md-outlined-select>
        </div>
        <div class="filter-col">
          <label>库位类型</label>
          <md-outlined-select :value="searchForm.locationType" @change="searchForm.locationType = $event.target.value" placeholder="全部类型">
            <md-select-option
              v-for="type in locationTypeOptions"
              :key="type.value"
              :value="type.value"
            >
              <div slot="headline">{{type.label}}</div>
            </md-select-option>
          </md-outlined-select>
        </div>
        <div class="filter-col">
          <label>使用状态</label>
          <md-outlined-select :value="searchForm.occupancyStatus" @change="searchForm.occupancyStatus = $event.target.value" placeholder="全部状态">
            <md-select-option
              v-for="status in occupancyStatusOptions"
              :key="status.value"
              :value="status.value"
            >
              <div slot="headline">{{status.label}}</div>
            </md-select-option>
          </md-outlined-select>
        </div>
        <div class="filter-actions">
          <md-text-button @click.prevent="resetSearch">重置</md-text-button>
          <md-filled-button @click.prevent="handleSearch">查询</md-filled-button>
        </div>
      </form>
    </div>
    </md-elevated-card>

    <!-- 操作栏 -->
    <md-elevated-card class="md3-card md3-card--tight">
      <div class="action-bar md3-action-bar">
        <div class="md3-action-title">仓库库位</div>
        <div class="action-buttons">
          <md-filled-tonal-button @click="handleAdd">
            <md-icon slot="icon">add</md-icon>
            新增库位
          </md-filled-tonal-button>
          <md-filled-button :disabled="!selectedRows.length" @click="handleBatchDelete">
            <md-icon slot="icon">delete</md-icon>
            批量删除
          </md-filled-button>
        </div>
      </div>
    </md-elevated-card>

    <!-- 数据表格 -->
    <md-elevated-card class="md3-card md3-table-card">
    <div class="data-container">
      <div class="table-container" style="padding: 16px; overflow-x: auto;">
        <table class="md3-table" style="width: 100%;">
          <thead>
            <tr>
              <th><md-checkbox @change="toggleAll" :checked="selectedRows.length === tableData.length && tableData.length > 0"></md-checkbox></th>
              <th>库位编号</th>
              <th>库位名称</th>
              <th>所属仓库</th>
              <th>位置信息</th>
              <th>库位类型</th>
              <th>容量信息</th>
              <th>存储通用</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="10" style="text-align: center; padding: 20px;">加载中...</td>
            </tr>
            <tr v-else-if="tableData.length === 0">
              <td colspan="10" style="text-align: center; padding: 20px;">暂无数据</td>
            </tr>
            <tr v-else v-for="row in tableData" :key="row.locationCode" @click="handleRowClick(row)">
              <td>
                <md-checkbox 
                  :checked="selectedRows.includes(row)" 
                  @change="toggleSelection(row, $event)"
                ></md-checkbox>
              </td>
              <td>
                <a href="#" @click.prevent="handleLocationDetail(row)" style="color: var(--md-sys-color-primary); text-decoration: none;">
                  {{ row.locationCode }}
                </a>
              </td>
              <td>{{ row.locationName }}</td>
              <td>{{ row.warehouseName }}</td>
              <td>
                <span class="location-position">
                  {{ formatLocationPosition(row) }}
                </span>
              </td>
              <td style="text-align: center;">
                <span :class="['status-tag', 'status-' + getLocationTypeTagType(row.locationType)]">
                  {{ getLocationTypeText(row.locationType) }}
                </span>
              </td>
              <td>
                <div class="capacity-info">
                  <div class="capacity-bar" style="background: #e5e7eb; border-radius: 10px; height: 16px; overflow: hidden; position: relative;">
                    <div :style="{ width: getOccupancyPercentage(row) + '%', background: getOccupancyColor(row), height: '100%' }"></div>
                    <span style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 10px; color: #fff; text-shadow: 0 0 2px rgba(0,0,0,0.5);">{{ getOccupancyPercentage(row) }}%</span>
                  </div>
                  <div class="capacity-text">
                    {{ row.currentOccupancy || 0 }} / {{ row.capacity || 0 }}
                  </div>
                </div>
              </td>
              <td>
                <div v-if="row.materialInfo && row.materialInfo.length > 0">
                  <div 
                    v-for="(material, index) in row.materialInfo.slice(0, 2)" 
                    :key="index"
                    class="material-item"
                  >
                    <span class="status-tag material-tag">{{ material.materialName }}</span>
                    <span class="material-quantity">{{ material.quantity }}{{ material.unit }}</span>
                  </div>
                  <a v-if="row.materialInfo.length > 2" href="#" @click.prevent="showMoreMaterials(row)" style="color: var(--md-sys-color-primary); font-size: 12px; text-decoration: none;">
                    +{{ row.materialInfo.length - 2 }}种通用
                  </a>
                </div>
                <span v-else class="empty-location">空库位</span>
              </td>
              <td style="text-align: center;">
                <label style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                  <md-switch :selected="row.status === 1" @change="handleStatusChange(row, $event.target.selected)"></md-switch>
                  <span style="font-size: 12px;">{{ row.status === 1 ? '启用' : '禁用' }}</span>
                </label>
              </td>
              <td style="text-align: center; white-space: nowrap;">
                <md-text-button @click.stop="handlePrint(row)"><md-icon slot="icon">print</md-icon></md-text-button>
                <md-text-button @click.stop="handleEdit(row)">编辑</md-text-button>
                <md-text-button @click.stop="handleLocationDetail(row)">详情</md-text-button>
                <md-text-button @click.stop="handleDelete(row)" style="--md-sys-color-primary: var(--md-sys-color-error);">删除</md-text-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <MdPagination
          :current-page="pagination.currentPage"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    </md-elevated-card>

    <!-- 新增/编辑库位对话框 -->
    <md-dialog :open="dialogVisible" @closed="dialogVisible = false">
      <div slot="headline">{{ dialogTitle }}</div>
      <div slot="content" style="padding-top: 8px; width: 600px; display: flex; flex-direction: column; gap: 16px;">
        <form id="formRef" @submit.prevent="submitForm">
          <div style="display: flex; gap: 16px; margin-bottom: 16px;">
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 8px;">库位编号</label>
              <md-outlined-text-field 
                :value="formData.locationCode" 
                @input="formData.locationCode = $event.target.value"
                placeholder="请输入库位编号"
                :disabled="isEdit"
                style="width: 100%"
              />
            </div>
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 8px;">库位名称</label>
              <md-outlined-text-field 
                :value="formData.locationName" 
                @input="formData.locationName = $event.target.value"
                placeholder="请输入库位名称" 
                style="width: 100%"
              />
            </div>
          </div>
          
          <div style="display: flex; gap: 16px; margin-bottom: 16px;">
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 8px;">所属仓库</label>
              <md-outlined-select :value="formData.warehouseId" @change="formData.warehouseId = $event.target.value" style="width: 100%">
                <md-select-option
                  v-for="warehouse in warehouseOptions"
                  :key="warehouse.value"
                  :value="warehouse.value"
                >
                  <div slot="headline">{{warehouse.label}}</div>
                </md-select-option>
              </md-outlined-select>
            </div>
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 8px;">库位类型</label>
              <md-outlined-select :value="formData.locationType" @change="formData.locationType = $event.target.value" style="width: 100%">
                <md-select-option
                  v-for="type in locationTypeOptions"
                  :key="type.value"
                  :value="type.value"
                >
                  <div slot="headline">{{type.label}}</div>
                </md-select-option>
              </md-outlined-select>
            </div>
          </div>

          <div style="display: flex; gap: 16px; margin-bottom: 16px;">
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 8px;">区域</label>
              <md-outlined-text-field :value="formData.zone" @input="formData.zone = $event.target.value" placeholder="如：A区" style="width: 100%" />
            </div>
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 8px;">排</label>
              <md-outlined-text-field :value="formData.row" @input="formData.row = $event.target.value" placeholder="如：01排" style="width: 100%" />
            </div>
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 8px;">列</label>
              <md-outlined-text-field :value="formData.col" @input="formData.col = $event.target.value" placeholder="如：01列" style="width: 100%" />
            </div>
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 8px;">层</label>
              <md-outlined-text-field :value="formData.level" @input="formData.level = $event.target.value" placeholder="如：01层" style="width: 100%" />
            </div>
          </div>

          <div style="display: flex; gap: 16px; margin-bottom: 16px;">
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 8px;">容量</label>
              <md-outlined-text-field
                type="number"
                :value="formData.capacity"
                @input="formData.capacity = $event.target.value"
                placeholder="库位最大容量"
                style="width: 100%"
              />
            </div>
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 8px;">状态</label>
              <div style="display: flex; gap: 16px;">
                <label style="display: flex; align-items: center; gap: 4px;">
                  <md-radio name="loc_status" value="1" :checked="formData.status == 1" @change="formData.status = 1"></md-radio>启用
                </label>
                <label style="display: flex; align-items: center; gap: 4px;">
                  <md-radio name="loc_status" value="0" :checked="formData.status == 0" @change="formData.status = 0"></md-radio>禁用
                </label>
              </div>
            </div>
          </div>
        </form>
      </div>
      <div slot="actions">
        <md-text-button @click="dialogVisible = false">取消</md-text-button>
        <md-filled-button @click="submitForm" :disabled="submitLoading">确定</md-filled-button>
      </div>
    </md-dialog>

    <!-- 库位详情对话框 -->
    <md-dialog :open="detailDialogVisible" @closed="detailDialogVisible = false">
      <div slot="headline">库位详情</div>
      <div slot="content" style="padding-top: 8px; width: 800px;">
        <div v-if="locationDetail" class="location-detail">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; background: #f9fafb; padding: 16px; border-radius: 8px;">
            <div><strong style="color: #666;">库位编号:</strong> {{ locationDetail.data.locationCode }}</div>
            <div><strong style="color: #666;">库位名称:</strong> {{ locationDetail.data.locationName }}</div>
            <div><strong style="color: #666;">所属仓库:</strong> {{ locationDetail.data.warehouseName }}</div>
            <div><strong style="color: #666;">位置信息:</strong> {{ formatLocationPosition(locationDetail.data) }}</div>
            <div>
              <strong style="color: #666;">库位类型:</strong> 
              <span :class="['status-tag', 'status-' + getLocationTypeTagType(locationDetail.data.locationType)]">
                {{ getLocationTypeText(locationDetail.data.locationType) }}
              </span>
            </div>
            <div>
              <strong style="color: #666;">容量利用率:</strong> 
              <div style="display: inline-block; width: 100px; height: 12px; background: #e5e7eb; border-radius: 6px; overflow: hidden; vertical-align: middle; margin-left: 8px;">
                <div :style="{ width: getOccupancyPercentage(locationDetail.data) + '%', background: getOccupancyColor(locationDetail.data), height: '100%' }"></div>
              </div>
            </div>
          </div>

          <div style="margin: 20px 0 10px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 8px;">库存明细</div>
          
          <table class="md3-table" style="width: 100%;">
            <thead>
              <tr>
                <th>通用编码</th>
                <th>通用名称</th>
                <th>规格</th>
                <th>批次号</th>
                <th style="text-align: right;">库存数量</th>
                <th>最后入库时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in locationDetail.data.inventoryDetails" :key="row.materialCode">
                <td>{{ row.materialCode }}</td>
                <td>{{ row.materialName }}</td>
                <td>{{ row.specification }}</td>
                <td>{{ row.batchNumber }}</td>
                <td style="text-align: right;">{{ row.currentQuantity }}{{ row.unit }}</td>
                <td>{{ row.lastInboundDate }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div slot="actions">
        <md-text-button @click="detailDialogVisible = false">关闭</md-text-button>
      </div>
    </md-dialog>

    <!-- 通用详情弹窗 -->
    <md-dialog :open="materialDialogVisible" @closed="materialDialogVisible = false">
      <div slot="headline">库位存储通用详情</div>
      <div slot="content" style="padding-top: 8px; width: 600px;">
        <table class="md3-table" style="width: 100%;">
          <thead>
            <tr>
              <th>通用名称</th>
              <th>通用编码</th>
              <th>数量</th>
              <th>批次号</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in selectedLocationMaterials" :key="row.materialCode">
              <td>{{ row.materialName }}</td>
              <td>{{ row.materialCode }}</td>
              <td>{{ row.quantity }}{{ row.unit }}</td>
              <td>{{ row.batchNumber }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div slot="actions">
        <md-text-button @click="materialDialogVisible = false">关闭</md-text-button>
      </div>
    </md-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { notifySuccess, notifyError } from '@/utils/notify'
import MdPagination from '@/components/MdPagination.vue'

// 使用动态导入处理request模块，确保兼容性
const getRequestModule = async () => {
  try {
    const module = await import('@/utils/request')
    return module.default
  } catch (error) {
    console.warn('无法导入request模块，使用axios或fetch替代')
    return null
  }
}

// 初始化request
let request = null
onMounted(async () => {
  request = await getRequestModule()
  if (request) {
    await Promise.all([
      getTableData(),
      getWarehouseOptions()
    ])
  } else {
    initMockData()
  }
})

// 响应式数据
const tableData = ref([])
const loading = ref(false)
const selectedRows = ref([])
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const materialDialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const submitLoading = ref(false)
const locationDetail = ref(null)
const selectedLocationMaterials = ref([])

// 搜索表单
const searchForm = reactive({
  locationCode: '',
  locationName: '',
  warehouseId: '',
  locationType: '',
  occupancyStatus: ''
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 表单数据
const formData = reactive({
  locationCode: '',
  locationName: '',
  warehouseId: '',
  locationType: 'Raw',
  zone: '',
  row: '',
  col: '',
  level: '',
  capacity: 1000,
  status: 1
})

// 选项数据
const warehouseOptions = ref([])
const locationTypeOptions = [
  { value: 'Raw', label: '原材料库位' },
  { value: 'Finished', label: '成品库位' },
  { value: 'Normal', label: '普通库位' }
]

const occupancyStatusOptions = [
  { value: 'empty', label: '空闲' },
  { value: 'partial', label: '部分占用' },
  { value: 'full', label: '满库位' },
  { value: 'overload', label: '超载' }
]

// 计算属性和方法
const formatLocationPosition = (row) => {
  const parts = []
  if (row.zone) parts.push(`${row.zone}`)
  if (row.row) parts.push(`${row.row}`)
  if (row.col) parts.push(`${row.col}`)
  if (row.level) parts.push(`${row.level}`)
  return parts.join('-') || '未设置'
}

const getOccupancyPercentage = (row) => {
  if (!row.capacity || row.capacity === 0) return 0
  return Math.round((row.currentOccupancy || 0) / row.capacity * 100)
}

const getOccupancyColor = (row) => {
  const percentage = getOccupancyPercentage(row)
  if (percentage === 0) return '#909399'
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  if (percentage < 100) return '#f56c6c'
  return '#ff4757'
}

const getLocationTypeTagType = (type) => {
  const typeMap = {
    'Raw': 'success',
    'Finished': 'warning',
    'Normal': 'info'
  }
  return typeMap[type] || 'info'
}

const getLocationTypeText = (type) => {
  const typeMap = {
    'Raw': '原材料',
    'Finished': '成品',
    'Normal': '普通'
  }
  return typeMap[type] || '普通'
}

// 模拟数据初始化
const initMockData = () => {
  console.log('使用模拟数据初始化')
  
  warehouseOptions.value = [
    { value: 1, label: '原材料仓库' },
    { value: 2, label: '成品仓库' },
    { value: 3, label: '包装材料仓库' }
  ]

  tableData.value = [
    {
      locationCode: 'WH001-A01-R01-C01-L01',
      locationName: 'A区01排01列01层',
      warehouseId: 1,
      warehouseName: '原材料仓库',
      locationType: 'Raw',
      zone: 'A',
      row: '01',
      col: '01',
      level: '01',
      capacity: 1000,
      currentOccupancy: 500,
      status: 1,
      materialInfo: [
        { materialName: 'PP塑料颗粒', quantity: 500, unit: 'KG', batchNumber: 'PP20250615001' }
      ]
    },
    {
      locationCode: 'WH001-A01-R01-C02-L01',
      locationName: 'A区01排02列01层',
      warehouseId: 1,
      warehouseName: '原材料仓库',
      locationType: 'Raw',
      zone: 'A',
      row: '01',
      col: '02',
      level: '01',
      capacity: 1000,
      currentOccupancy: 0,
      status: 1,
      materialInfo: []
    }
  ]
  
  pagination.total = tableData.value.length
}

// API调用方法
const getTableData = async () => {
  if (!request) {
    initMockData()
    return
  }

  try {
    loading.value = true
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      locationCode: searchForm.locationCode || undefined,
      locationName: searchForm.locationName || undefined,
      warehouseId: searchForm.warehouseId || undefined,
      locationType: searchForm.locationType || undefined,
      occupancyStatus: searchForm.occupancyStatus || undefined
    }
    
    const response = await request({
      url: '/locations/list',
      method: 'get',
      params
    })
    
    if (response.data) {
      tableData.value = response.data.list || []
      pagination.total = response.data.total || 0
    }
  } catch (error) {
    console.error('获取库位列表失败:', error)
    notifyError('获取库位列表失败')
    initMockData()
  } finally {
    loading.value = false
  }
}

const getWarehouseOptions = async () => {
  if (!request) return

  try {
    const response = await request({
      url: '/warehouses/options',
      method: 'get'
    })
    
    const resData = response.data?.data || response.data || []
    if (Array.isArray(resData)) {
      warehouseOptions.value = resData.map(item => ({
        value: item.id,
        label: item.name
      }))
    }
  } catch (error) {
    console.error('获取仓库选项失败:', error)
    warehouseOptions.value = [
      { value: 1, label: '原材料仓库' },
      { value: 2, label: '成品仓库' },
      { value: 3, label: '包装材料仓库' }
    ]
  }
}

const getLocationDetail = async (locationCode) => {
  if (!request) {
    // notifySuccess('详情功能需要后端支持')
    locationDetail.value = {
      data: tableData.value.find(r => r.locationCode === locationCode) || tableData.value[0]
    }
    if (!locationDetail.value.data.inventoryDetails) {
        locationDetail.value.data.inventoryDetails = []
    }
    detailDialogVisible.value = true
    return
  }

  try {
    const response = await request({
      url: `/locations/${locationCode}`,
      method: 'get'
    })
    
    if (response.data) {
      locationDetail.value = response.data
      detailDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取库位详情失败:', error)
    notifyError('获取库位详情失败')
  }
}

// 事件处理方法
const handleSearch = () => {
  pagination.currentPage = 1
  getTableData()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  handleSearch()
}

const handleCurrentChange = (val) => {
  pagination.currentPage = val
  getTableData()
}

const toggleSelection = (row, event) => {
  if (event.target.checked) {
    selectedRows.value.push(row)
  } else {
    selectedRows.value = selectedRows.value.filter(r => r.locationCode !== row.locationCode)
  }
}

const toggleAll = (event) => {
  if (event.target.checked) {
    selectedRows.value = [...tableData.value]
  } else {
    selectedRows.value = []
  }
}

const handleRowClick = (row) => {
  // toggle selection
}

const handleAdd = () => {
  dialogTitle.value = '新增库位'
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑库位'
  isEdit.value = true
  Object.assign(formData, {
    locationCode: row.locationCode,
    locationName: row.locationName,
    warehouseId: row.warehouseId,
    locationType: row.locationType,
    zone: row.zone,
    row: row.row,
    col: row.col,
    level: row.level,
    capacity: row.capacity,
    status: row.status
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  const confirmed = confirm('确认删除该库位吗？')
  
  if (confirmed) {
    if (!request) {
      notifySuccess('删除成功')
      return
    }

    try {
      await request({
        url: `/locations/${row.locationCode}`,
        method: 'delete'
      })
      notifySuccess('删除成功')
      getTableData()
    } catch (error) {
      notifyError('删除失败')
    }
  }
}

const handleBatchDelete = () => {
  if (!selectedRows.value.length) {
    notifyError('请至少选择一条数据')
    return
  }
  
  if(confirm(`确认删除选中的${selectedRows.value.length}条数据吗？`)) {
    if (!request) {
      notifySuccess('批量删除成功')
      selectedRows.value = []
      return
    }

    try {
      const locationCodes = selectedRows.value.map(row => row.locationCode)
      request({
        url: '/locations/batch-delete',
        method: 'delete',
        data: { locationCodes }
      }).then(() => {
        notifySuccess('批量删除成功')
        selectedRows.value = []
        getTableData()
      })
    } catch (error) {
      notifyError('批量删除失败')
    }
  }
}

const handleStatusChange = async (row, val) => {
  row.status = val ? 1 : 0
  if (!request) {
    notifySuccess('状态更新成功')
    return
  }

  try {
    await request({
      url: `/locations/${row.locationCode}/status`,
      method: 'put',
      data: { status: row.status }
    })
    notifySuccess('状态更新成功')
  } catch (error) {
    row.status = row.status === 1 ? 0 : 1
    notifyError('状态更新失败')
  }
}

const handleLocationDetail = (row) => {
  getLocationDetail(row.locationCode)
}

const handlePrint = (row) => {
  const barcodeUrl = `/api/print/barcode?text=${row.locationCode}&type=code128&scale=4&height=12`;
  
  const printWindow = window.open('', '_blank');
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>库位条码打印</title>
      <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
        .label { border: 2px solid #000; padding: 20px; width: 300px; text-align: center; border-radius: 10px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .zone { font-size: 18px; margin-bottom: 15px; color: #555; }
        img { max-width: 100%; height: auto; }
        @media print {
          @page { size: 100mm 60mm; margin: 0; }
          body { height: auto; }
          .label { border: none; width: 100%; height: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="title">WMS 通用库位标签</div>
        <div class="zone">${row.locationType === 'Normal' ? '标准库区' : row.locationType}</div>
        <img src="${barcodeUrl}" alt="Barcode" onload="window.print(); setTimeout(() => window.close(), 500);" />
        <div style="margin-top:10px;font-size:12px;color:#888;">扫码绑定作业</div>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};

const showMoreMaterials = (row) => {
  selectedLocationMaterials.value = row.materialInfo
  materialDialogVisible.value = true
}

const resetForm = () => {
  Object.assign(formData, {
    locationCode: '',
    locationName: '',
    warehouseId: '',
    locationType: 'Raw',
    zone: '',
    row: '',
    col: '',
    level: '',
    capacity: 1000,
    status: 1
  })
}

const submitForm = async () => {
  if (!formData.locationCode) { notifyError('请输入库位编号'); return; }
  if (!formData.locationName) { notifyError('请输入库位名称'); return; }
  
  if (!request) {
    notifySuccess('保存成功')
    dialogVisible.value = false
    return
  }

  try {
    submitLoading.value = true
    
    if (isEdit.value) {
      await request({
        url: `/locations/${formData.locationCode}`,
        method: 'put',
        data: formData
      })
      notifySuccess('编辑成功')
    } else {
      await request({
        url: '/locations',
        method: 'post',
        data: formData
      })
      notifySuccess('新增成功')
    }
    
    dialogVisible.value = false
    getTableData()
  } catch (error) {
    notifyError('操作失败')
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  align-items: flex-end;
}

.filter-col {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;

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

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.data-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.location-position {
  color: #606266;
  font-size: 12px;
  background: #f0f9ff;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #e1f5fe;
}

.capacity-info {
  .capacity-bar {
    margin-bottom: 4px;
  }
  
  .capacity-text {
    font-size: 12px;
    color: #666;
    text-align: center;
  }
}

.material-item {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  
  .material-tag {
    margin-right: 8px;
    max-width: 100px;
  }
  
  .material-quantity {
    font-size: 12px;
    color: #666;
  }
}

.empty-location {
  color: #c0c4cc;
  font-style: italic;
}

.pagination-container {
  padding: 16px;
  border-top: 1px solid #ebeef5;
  background: white;
  display: flex;
  justify-content: center;
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
.status-warning {
    background: #fdf6ec;
    color: #e6a23c;
}
.status-info {
    background: #f4f4f5;
    color: #909399;
}

@media (max-width: 1200px) {
  .filter-row {
    flex-direction: column;
  }
  
  .filter-col {
    min-width: auto;
  }
  
  .action-bar {
    flex-wrap: wrap;
  }
}
</style>
