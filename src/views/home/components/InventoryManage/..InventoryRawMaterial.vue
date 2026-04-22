<template>
    <div class="erp-container">
        <!-- 筛选卡片 -->
        <div class="filter-card">
            <div class="filter-row">
                <div class="filter-col">
                    <label>原料名称/编码</label>
                    <el-input v-model="searchQuery" placeholder="请输入原料名称或编码" clearable @clear="clearSearch" />
                </div>
                <div class="filter-col">
                    <label>分类</label>
                    <el-select v-model="categoryFilter" placeholder="全部分类" clearable>
                        <el-option v-for="item in categories" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </div>
                <div class="filter-col">
                    <label>状态</label>
                    <el-select v-model="statusFilter" placeholder="全部状态" clearable>
                        <el-option v-for="item in statusOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
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
            <el-button class="action-btn" @click="exportData">
                <i class="el-icon-download"></i>
                导出数据
            </el-button>
        </div>

        <!-- 数据表格 -->
        <div class="data-container">
            <el-table :data="filteredMaterials" border stripe v-loading="loading"
                @selection-change="handleSelectionChange">
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
                <el-table-column prop="status" label="状态" width="120" align="center">
                    <template #default="{ row }">
                        <el-tag :type="getStatusTagType(row.status)" size="small">
                            {{ row.status }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="150" fixed="right" align="center">
                    <template #default="{ row }">
                        <el-link class="action-link" type="info" @click="handleDetails(row)">
                            详情
                        </el-link>
                        <el-link class="action-link" type="primary" @click="editMaterial(row)">
                            编辑
                        </el-link>
                        <el-link class="action-link" type="danger" @click="deleteMaterial(row)">
                            删除
                        </el-link>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination">
                <el-pagination background layout="prev, pager, next" :current-page="currentPage" :page-size="pageSize"
                    :total="totalItems" @current-change="handleCurrentChange" />
            </div>
        </div>

        <!-- 新增/编辑对话框 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false">
            <el-form :model="currentMaterial" label-width="100px" :rules="formRules" ref="materialForm">
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
                                <el-option v-for="item in categories" :key="item.value" :label="item.label"
                                    :value="item.value" />
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
                    <el-input-number v-model="currentMaterial.stock" :min="0" :precision="2" :controls="false"
                        style="width: 200px" />
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
import { 
    getRawMaterialInventoryList,
    getRawMaterialInventoryDetail,
    addRawMaterial,
    updateRawMaterial,
    deleteRawMaterial
} from '@/api/inventory'

// 响应式数据
const materials = ref([])
const loading = ref(false)
const searchQuery = ref('')
const categoryFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(5)
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
    return materials.value
})

// 生命周期钩子
onMounted(() => {
    fetchMaterials()
})

// 方法
const fetchMaterials = async () => {
    try {
        loading.value = true
        
        const params = {
            page: currentPage.value,
            pageSize: pageSize.value,
            materialName: searchQuery.value || undefined,
            category: categoryFilter.value || undefined,
            status: statusFilter.value || undefined
        }

        const response = await getRawMaterialInventoryList(params)
        
        if (response.data) {
            materials.value = response.data.list || []
            totalItems.value = response.data.total || 0
        } else {
            materials.value = []
            totalItems.value = 0
        }
    } catch (error) {
        console.error('获取原料库存列表失败:', error)
        ElMessage.error('获取原料库存列表失败')
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

const handleSelectionChange = (val) => {
    selectedMaterials.value = val
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
        status: '正常'
    }
    dialogVisible.value = true
}

const handleDetails = async (row) => {
    try {
        const response = await getRawMaterialInventoryDetail(row.id)
        if (response.data) {
            ElMessage.success('获取详情成功')
            // 这里可以打开详情对话框或跳转到详情页面
            console.log('原料详情:', response.data)
        }
    } catch (error) {
        console.error('获取原料详情失败:', error)
        ElMessage.error('获取原料详情失败')
    }
}

const editMaterial = (row) => {
    dialogTitle.value = '编辑原料'
    currentMaterial.value = { ...row }
    dialogVisible.value = true
}

const deleteMaterial = (row) => {
    ElMessageBox.confirm('确认删除该原料记录吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        try {
            await deleteRawMaterial(row.id)
            ElMessage.success('删除成功')
            fetchMaterials()
        } catch (error) {
            console.error('删除原料失败:', error)
            ElMessage.error('删除原料失败')
        }
    }).catch(() => {
        ElMessage.info('已取消删除')
    })
}

const exportData = () => {
    ElMessage.success('导出数据成功')
}

const submitForm = async () => {
    try {
        // 表单验证
        const form = document.querySelector('.el-form')
        if (!form) return

        if (currentMaterial.value.id) {
            // 更新
            await updateRawMaterial(currentMaterial.value.id, {
                code: currentMaterial.value.code,
                name: currentMaterial.value.name,
                category: currentMaterial.value.category,
                specification: currentMaterial.value.specification,
                unit: currentMaterial.value.unit,
                stock: currentMaterial.value.stock
            })
            ElMessage.success('更新成功')
        } else {
            // 新增
            await addRawMaterial({
                code: currentMaterial.value.code,
                name: currentMaterial.value.name,
                category: currentMaterial.value.category,
                specification: currentMaterial.value.specification,
                unit: currentMaterial.value.unit,
                stock: currentMaterial.value.stock
            })
            ElMessage.success('新增成功')
        }

        dialogVisible.value = false
        fetchMaterials()
    } catch (error) {
        console.error('提交表单失败:', error)
        ElMessage.error(error.response?.data?.message || '操作失败')
    }
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

    label {
        margin-bottom: 8px;
        font-weight: 500;
        color: #333;
        font-size: 14px;
        white-space: nowrap;
    }

    .el-select {
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
    overflow: hidden;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

    .el-table {
        margin-top: 16px;

        ::v-deep .cell {
            padding: 12px;
        }

        .action-link {
            margin-left: 12px;
            font-size: 14px;
        }
    }
}

.pagination {
    padding: 16px;
    display: flex;
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