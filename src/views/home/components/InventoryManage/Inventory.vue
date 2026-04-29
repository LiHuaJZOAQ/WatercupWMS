<template>
    <div class="md3-page">
        <md-elevated-card class="md3-card">
        <div class="filter-card">
            <div class="filter-row">
                <div class="filter-col">
                    <label>商品名称/编码</label>
                    <md-outlined-text-field :value="searchQuery" @input="searchQuery = $event.target.value" placeholder="请输入商品名称或编码" />
                </div>
                <div class="filter-col">
                    <label>分类</label>
                    <md-outlined-select :value="categoryFilter" @change="categoryFilter = $event.target.value" placeholder="全部分类">
                        <md-select-option v-for="item in categories" :key="item.value" :value="item.value">
                            <div slot="headline">{{item.label}}</div>
                        </md-select-option>
                    </md-outlined-select>
                </div>
                <div class="filter-col">
                    <label>状态</label>
                    <md-outlined-select :value="statusFilter" @change="statusFilter = $event.target.value" placeholder="全部状态">
                        <md-select-option v-for="item in statusOptions" :key="item.value" :value="item.value">
                            <div slot="headline">{{item.label}}</div>
                        </md-select-option>
                    </md-outlined-select>
                </div>
            </div>
            <div class="filter-actions">
                <md-text-button @click="resetFilters">重置</md-text-button>
                <md-filled-button @click="handleSearch">查询</md-filled-button>
            </div>
        </div>
        </md-elevated-card>

        <!-- 操作栏 -->
        <md-elevated-card class="md3-card md3-card--tight">
            <div class="action-bar md3-action-bar">
                <div class="md3-action-title">全局库存查询</div>
                <div class="action-buttons">
                    <md-filled-tonal-button @click="handleAdd">
                        <md-icon slot="icon">add</md-icon>
                        新增商品
                    </md-filled-tonal-button>
                    <md-filled-button @click="exportData">
                        <md-icon slot="icon">download</md-icon>
                        导出数据
                    </md-filled-button>
                </div>
            </div>
        </md-elevated-card>

        <!-- 数据表格 -->
        <md-elevated-card class="md3-card md3-table-card">
        <div class="data-container" style="padding: 16px; overflow-x: auto;">
            <table class="md3-table" style="width: 100%;">
                <thead>
                    <tr>
                        <th>商品编码</th>
                        <th>商品名称</th>
                        <th>分类</th>
                        <th>规格</th>
                        <th>单位</th>
                        <th>当前库存</th>
                        <th>最小库存</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="loading">
                        <td colspan="9" style="text-align: center; padding: 20px;">加载中...</td>
                    </tr>
                    <tr v-else-if="materials.length === 0">
                        <td colspan="9" style="text-align: center; padding: 20px;">暂无数据</td>
                    </tr>
                    <tr v-else v-for="row in materials" :key="row.id || row.code">
                        <td>{{ row.code || '-' }}</td>
                        <td>{{ row.name || '-' }}</td>
                        <td>{{ row.category || '-' }}</td>
                        <td>{{ row.specification || '-' }}</td>
                        <td>{{ row.unit || '-' }}</td>
                        <td :class="getStockClass(row)" style="text-align: right;">{{ formatStock(row.stock || 0) }}</td>
                        <td style="text-align: right;">{{ formatStock(row.minStock || 0) }}</td>
                        <td style="text-align: center;">
                            <span :class="['status-tag', 'status-' + getStatusTagType(row.status)]">
                                {{ row.status }}
                            </span>
                        </td>
                        <td style="text-align: center;">
                            <md-text-button @click="handleDetails(row)">详情</md-text-button>
                            <md-text-button @click="editMaterial(row)">编辑</md-text-button>
                            <md-text-button @click="deleteMaterial(row)" style="--md-sys-color-primary: var(--md-sys-color-error);">删除</md-text-button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- 分页 -->
            <div class="pagination" style="padding: 16px; display: flex; justify-content: center;">
                <MdPagination
                    :current-page="currentPage"
                    :page-size="pageSize"
                    :total="totalItems"
                    @current-change="handleCurrentChange"
                />
            </div>
        </div>
        </md-elevated-card>

        <!-- 新增/编辑对话框 -->
        <md-dialog :open="dialogVisible" @closed="dialogVisible = false">
            <div slot="headline">{{ dialogTitle }}</div>
            <div slot="content" style="display: flex; flex-direction: column; gap: 16px; padding-top: 8px; width: 500px;">
                <form id="materialForm" @submit.prevent="submitForm">
                    <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 8px;">商品编码</label>
                            <md-outlined-text-field :value="currentMaterial.code" @input="currentMaterial.code = $event.target.value" style="width: 100%" />
                        </div>
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 8px;">商品名称</label>
                            <md-outlined-text-field :value="currentMaterial.name" @input="currentMaterial.name = $event.target.value" style="width: 100%" />
                        </div>
                    </div>
                    <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 8px;">分类</label>
                            <md-outlined-select :value="currentMaterial.category" @change="currentMaterial.category = $event.target.value" style="width: 100%">
                                <md-select-option v-for="item in categories" :key="item.value" :value="item.value">
                                    <div slot="headline">{{item.label}}</div>
                                </md-select-option>
                            </md-outlined-select>
                        </div>
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 8px;">单位</label>
                            <md-outlined-text-field :value="currentMaterial.unit" @input="currentMaterial.unit = $event.target.value" style="width: 100%" />
                        </div>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px;">规格</label>
                        <md-outlined-text-field :value="currentMaterial.specification" @input="currentMaterial.specification = $event.target.value" style="width: 100%" />
                    </div>
                    <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 8px;">最小库存</label>
                            <md-outlined-text-field type="number" :value="currentMaterial.minStock" @input="currentMaterial.minStock = $event.target.value" style="width: 100%" />
                        </div>
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 8px;">最大库存</label>
                            <md-outlined-text-field type="number" :value="currentMaterial.maxStock" @input="currentMaterial.maxStock = $event.target.value" style="width: 100%" />
                        </div>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px;">状态</label>
                        <div style="display: flex; gap: 16px;">
                            <label style="display: flex; align-items: center; gap: 4px;">
                                <md-radio name="status_group" value="正常" :checked="currentMaterial.status === '正常'" @change="currentMaterial.status = '正常'"></md-radio>
                                正常
                            </label>
                            <label style="display: flex; align-items: center; gap: 4px;">
                                <md-radio name="status_group" value="盘盈" :checked="currentMaterial.status === '盘盈'" @change="currentMaterial.status = '盘盈'"></md-radio>
                                盘盈
                            </label>
                            <label style="display: flex; align-items: center; gap: 4px;">
                                <md-radio name="status_group" value="盘亏" :checked="currentMaterial.status === '盘亏'" @change="currentMaterial.status = '盘亏'"></md-radio>
                                盘亏
                            </label>
                        </div>
                    </div>
                </form>
            </div>
            <div slot="actions">
                <md-text-button @click="dialogVisible = false">取消</md-text-button>
                <md-filled-button :disabled="submitting" @click="submitForm">确定</md-filled-button>
            </div>
        </md-dialog>

        <!-- 详情对话框 -->
        <md-dialog :open="detailDialogVisible" @closed="detailDialogVisible = false">
            <div slot="headline">商品详情</div>
            <div slot="content" style="padding-top: 8px; width: 600px;">
                <div v-if="materialDetail" class="detail-container">
                    <div class="detail-section">
                        <h3 class="section-title">基本信息</h3>
                        <div style="display: flex; gap: 16px; margin-bottom: 12px;">
                            <div style="flex: 1;">商品编码：{{ materialDetail.data.code }}</div>
                            <div style="flex: 1;">商品名称：{{ materialDetail.data.name }}</div>
                            <div style="flex: 1;">分类：{{ materialDetail.data.category }}</div>
                        </div>
                        <div style="display: flex; gap: 16px; margin-bottom: 12px;">
                            <div style="flex: 1;">规格：{{ materialDetail.data.specification || '-' }}</div>
                            <div style="flex: 1;">单位：{{ materialDetail.data.unit }}</div>
                            <div style="flex: 1;">状态：{{ getStatusText(materialDetail.data.Status) }}</div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3 class="section-title">库存信息</h3>
                        <div style="display: flex; gap: 16px; margin-bottom: 12px;">
                            <div style="flex: 1;">当前库存：<span class="stock-highlight">{{ formatStock(materialDetail.data.totalStock || 0) }}</span></div>
                            <div style="flex: 1;">最小库存：{{ formatStock(materialDetail.data.MinStock || 0) }}</div>
                            <div style="flex: 1;">最大库存：{{ formatStock(materialDetail.data.MaxStock || 0) }}</div>
                        </div>
                        <div style="display: flex; gap: 16px; margin-bottom: 12px;">
                            <div style="flex: 1;">可用数量：{{ formatStock(materialDetail.data.totalAvailable || materialDetail.data.stock || 0) }}</div>
                            <div style="flex: 1;">预留数量：{{ formatStock(materialDetail.data.totalReserved || 0) }}</div>
                            <div style="flex: 1;">库存状态：{{ getStockStatusText(materialDetail.data) }}</div>
                        </div>
                    </div>

                    <div class="detail-section" v-if="materialDetail.data.inventoryDetails && materialDetail.data.inventoryDetails.length > 0">
                        <h3 class="section-title">库位分布</h3>
                        <table class="md3-table" style="width: 100%;">
                            <thead>
                                <tr>
                                    <th>库位编码</th>
                                    <th>库位名称</th>
                                    <th>批次号</th>
                                    <th>库存数量</th>
                                    <th>可用数量</th>
                                    <th>生产日期</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="row in materialDetail.data.inventoryDetails" :key="row.LocationID">
                                    <td>{{ row.LocationID || '-' }}</td>
                                    <td>{{ row.LocationName || '-' }}</td>
                                    <td>{{ row.BatchNumber || '-' }}</td>
                                    <td style="text-align: right;">{{ formatStock(row.CurrentQuantity || 0) }}</td>
                                    <td style="text-align: right;">{{ formatStock(row.AvailableQuantity || 0) }}</td>
                                    <td>{{ row.ProductionDate || '-' }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div slot="actions">
                <md-text-button @click="detailDialogVisible = false">关闭</md-text-button>
                <md-filled-button @click="editMaterial(materialDetail)">编辑</md-filled-button>
            </div>
        </md-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { notifySuccess, notifyError } from '@/utils/notify'
import MdPagination from '@/components/MdPagination.vue'
import api from '@/api'

// 响应式数据
const materials = ref([])
const loading = ref(false)
const submitting = ref(false)
const searchQuery = ref('')
const categoryFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(7)
const totalItems = ref(0)
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogTitle = ref('')
const materialDetail = ref(null)
const currentMaterial = ref({
    id: null,
    code: '',
    name: '',
    category: '',
    specification: '',
    unit: '',
    minStock: 0,
    maxStock: 0,
    status: '正常'
})
const selectedMaterials = ref([])

// 分类选项
const categories = [
    { value: '塑料商品', label: '塑料商品' },
    { value: '金属商品', label: '金属商品' },
    { value: '玻璃商品', label: '玻璃商品' },
    { value: '密封配件', label: '密封配件' },
    { value: '配件', label: '配件' },
    { value: '包装材料', label: '包装材料' }
]

// 状态选项
const statusOptions = [
    { value: '正常', label: '正常' },
    { value: '盘盈', label: '盘盈' },
    { value: '盘亏', label: '盘亏' }
]

// 计算属性
const filteredMaterials = computed(() => {
    return materials.value
})

// 格式化方法
const formatStock = (value) => {
    if (value === null || value === undefined) return '0.00'
    return Number(value).toFixed(2)
}

const getStatusText = (status) => {
    if (status === 1 || status === '1' || status === true) return '启用'
    if (status === 0 || status === '0' || status === false) return '禁用'
    return '未知'
}

// 生命周期钩子
onMounted(() => {
    fetchMaterials()
})

// 方法
const fetchMaterials = async () => {
    loading.value = true
    try {
        const response = await api.getInventory({
            page: currentPage.value,
            pageSize: pageSize.value,
            keyword: searchQuery.value || undefined,
            category: categoryFilter.value || undefined,
            status: statusFilter.value !== '' ? statusFilter.value : undefined
        })
        
        materials.value = response.data?.items || response.data?.list || response.data || []
        totalItems.value = response.data?.total || response.data?.count || materials.value.length || 0
    } catch (error) {
        console.error('获取商品库存列表失败:', error)
        notifyError('获取商品库存列表失败')
        materials.value = []
        totalItems.value = 0
    } finally {
        loading.value = false
    }
}

const clearSearch = () => {
    searchQuery.value = ''
    currentPage.value = 1
    fetchMaterials()
}

const resetFilters = () => {
    searchQuery.value = ''
    categoryFilter.value = ''
    statusFilter.value = ''
    currentPage.value = 1
    fetchMaterials()
}

const handleSearch = () => {
    currentPage.value = 1
    fetchMaterials()
}

const handleCurrentChange = (val) => {
    currentPage.value = val
    fetchMaterials()
}

const handleSizeChange = (val) => {
    pageSize.value = val
    currentPage.value = 1
    fetchMaterials()
}

const getStatusTagType = (status) => {
    if (status === 1 || status === '正常' || status === true) return 'success'
    if (status === 0 || status === '盘盈' || status==='盘亏'|| status === false) return 'danger'
    return 'info'
}

const getStockClass = (row) => {
    const currentStock = row.TotalStock || row.CurrentStock || 0
    const minStock = row.MinStock || 0
    if (minStock > 0 && currentStock <= minStock) {
        return 'low-stock'
    }
    return ''
}

const getStockStatusType = (material) => {
    const currentStock = material.stock || 0
    const minStock = material.minStock || 0
    const maxStock = material.maxStock || 0
    
    if (minStock > 0 && currentStock <= minStock) return 'danger'
    if (maxStock > 0 && currentStock >= maxStock) return 'warning'
    return 'success'
}

const getStockStatusText = (material) => {
    const currentStock = material.stock || 0
    const minStock = material.minStock || 0
    const maxStock = material.maxStock || 0
    
    if (minStock > 0 && currentStock <= minStock) return '库存不足'
    if (maxStock > 0 && currentStock >= maxStock) return '库存过多'
    return '正常'
}

const handleAdd = () => {
    dialogTitle.value = '新增商品'
    currentMaterial.value = {
        ItemID: null,
        ItemCode: '',
        ItemName: '',
        Category: '',
        Specification: '',
        Unit: '',
        Description: '',
        MinStock: 0,
        MaxStock: 0,
        Status: 1
    }
    dialogVisible.value = true
}

const handleDetails = async (row) => {
    try {
        loading.value = true
        console.log('获取详情:', row)
        
        const materialId = row.ItemID || row.id
        if (!materialId) {
            notifyError('无法获取商品ID')
            return
        }
        
        const response = await api.getRawMaterialInventoryDetail(materialId)
        console.log('详情响应:', response)
        
        if (response && response.data) {
            materialDetail.value = response.data
            detailDialogVisible.value = true
        } else {
            notifyError('获取商品详情失败')
        }
    } catch (error) {
        console.error('获取商品详情失败:', error)
        notifyError(error.response?.data?.message || error.message || '获取商品详情失败')
    } finally {
        loading.value = false
    }
}

const editMaterial = (row) => {
    dialogTitle.value = '编辑商品'
    
    // 适配不同的数据结构
    currentMaterial.value = {
        id: row.ItemID || row.id,
        code: row.ItemCode || row.code || '',
        name: row.ItemName || row.name || '',
        category: row.Category || row.category || '',
        specification: row.Specification || row.specification || '',
        unit: row.Unit || row.unit || '',
        minStock: row.MinStock || row.minStock || 0,
        maxStock: row.MaxStock || row.maxStock || 0,
        status: row.Status || row.status || '正常'
    }
    
    detailDialogVisible.value = false
    dialogVisible.value = true
}

const deleteMaterial = async (row) => {
    const materialId = row.ItemID || row.id
    const materialName = row.ItemName || row.name || '该商品'
    
    const confirmed = confirm(`确认删除商品"${materialName}"吗？删除后不可恢复！`)
    
    if (confirmed) {
        try {
            loading.value = true
            await api.deleteRawMaterial(materialId)
            notifySuccess('删除成功')
            fetchMaterials()
        } catch (error) {
            console.error('删除商品失败:', error)
            notifyError(error.response?.data?.message || error.message || '删除商品失败')
        } finally {
            loading.value = false
        }
    }
}

const exportData = () => {
    notifySuccess('导出功能开发中')
}

const submitForm = async () => {
    // 验证表单
    try {
        if (!currentMaterial.value.code) {
            notifyError('请输入商品编码')
            return
        }
        if (!currentMaterial.value.name) {
            notifyError('请输入商品名称')
            return
        }
        if (!currentMaterial.value.category) {
            notifyError('请选择分类')
            return
        }
        if (!currentMaterial.value.unit) {
            notifyError('请输入单位')
            return
        }

        if (currentMaterial.value.maxStock > 0 && currentMaterial.value.minStock > currentMaterial.value.maxStock) {
            notifyError('最大库存不能小于最小库存')
            return
        }

        submitting.value = true

        const materialData = {
            code: currentMaterial.value.code,
            name: currentMaterial.value.name,
            category: currentMaterial.value.category,
            specification: currentMaterial.value.specification,
            unit: currentMaterial.value.unit,
            minStock: currentMaterial.value.minStock || 0,
            maxStock: currentMaterial.value.maxStock || 0,
            status: currentMaterial.value.status
        }

        if (currentMaterial.value.id) {
            await api.updateRawMaterial(currentMaterial.value.id, materialData)
            notifySuccess('更新成功')
        } else {
            await api.addRawMaterial(materialData)
            notifySuccess('新增成功')
        }

        dialogVisible.value = false
        fetchMaterials()
    } catch (error) {
        console.error('提交表单失败:', error)
        if (error.response && error.response.data && error.response.data.message) {
            notifyError(error.response.data.message)
        } else {
            notifyError(error.message || '操作失败')
        }
    } finally {
        submitting.value = false
        dialogVisible.value = false
        fetchMaterials()
    }
}

const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-'
    const date = new Date(dateTimeStr)
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })
}

const locationNames = () => {
    return materialDetail.value.data.inventoryDetails.map(item => item.LocationName);
}

</script>

<style scoped lang="scss">
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
}

.filter-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    justify-content: flex-end;
}

.action-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.action-buttons {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
}

.data-container {
    flex: 1;
    overflow: hidden;
}

.detail-section {
    margin-bottom: 24px;
    
    .section-title {
        margin: 0 0 16px 0;
        padding-bottom: 8px;
        border-bottom: 2px solid #e4e7ed;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
    }
}

.low-stock {
    color: #f56c6c;
    font-weight: bold;
}

.stock-highlight {
    font-weight: 600;
    color: #409eff;
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
.status-info {
    background: #f4f4f5;
    color: #909399;
}

@media (max-width: 768px) {
    .filter-row {
        flex-direction: column;
        gap: 12px;
    }
    
    .action-bar {
        flex-direction: column;
    }
}
</style>
