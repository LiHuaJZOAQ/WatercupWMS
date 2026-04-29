<template>
  <div class="create-form">
    <form class="md3-form" @submit.prevent="submitForm">
      <div class="form-grid">
        <div class="form-item">
          <label>入库单号</label>
          <md-outlined-text-field 
            v-model="formData.warehouseReceiptNo" 
            placeholder="系统自动生成" 
            disabled
            style="width: 100%"
          />
        </div>
        <div class="form-item">
          <label>入库类型 <span class="required">*</span></label>
          <md-outlined-select v-model="formData.warehouseType" style="width: 100%">
            <md-select-option value="">
              <div slot="headline">请选择入库类型</div>
            </md-select-option>
            <md-select-option
              v-for="item in options.warehouseTypes"
              :key="item.value"
              :value="item.value"
            >
              <div slot="headline">{{ item.label }}</div>
            </md-select-option>
          </md-outlined-select>
        </div>

        <div class="form-item">
          <label>入库仓库 <span class="required">*</span></label>
          <md-outlined-select v-model="formData.warehouse" style="width: 100%">
            <md-select-option value="">
              <div slot="headline">请选择入库仓库</div>
            </md-select-option>
            <md-select-option
              v-for="item in options.warehouses"
              :key="item.value"
              :value="item.value"
            >
              <div slot="headline">{{ item.label }}</div>
            </md-select-option>
          </md-outlined-select>
        </div>
        <div class="form-item">
          <label>入库方式 <span class="required">*</span></label>
          <md-outlined-select v-model="formData.warehouseMethod" style="width: 100%">
            <md-select-option value="">
              <div slot="headline">请选择入库方式</div>
            </md-select-option>
            <md-select-option
              v-for="item in options.warehouseMethods"
              :key="item.value"
              :value="item.value"
            >
              <div slot="headline">{{ item.label }}</div>
            </md-select-option>
          </md-outlined-select>
        </div>

        <div class="form-item">
          <label>供应商 <span class="required">*</span></label>
          <md-outlined-select v-model="formData.supplier" style="width: 100%">
            <md-select-option value="">
              <div slot="headline">请选择供应商</div>
            </md-select-option>
            <md-select-option
              v-for="item in options.suppliers"
              :key="item.value"
              :value="item.value"
            >
              <div slot="headline">{{ item.label }}</div>
            </md-select-option>
          </md-outlined-select>
        </div>
        <div class="form-item">
          <label>生产商 <span class="required">*</span></label>
          <md-outlined-select v-model="formData.manufacturer" style="width: 100%">
            <md-select-option value="">
              <div slot="headline">请选择生产商</div>
            </md-select-option>
            <md-select-option
              v-for="item in options.manufacturers"
              :key="item.value"
              :value="item.value"
            >
              <div slot="headline">{{ item.label }}</div>
            </md-select-option>
          </md-outlined-select>
        </div>
      </div>
        
      <div class="form-item" style="margin-top: 16px;">
        <label>备注</label>
        <md-outlined-text-field
          v-model="formData.remark"
          type="textarea"
          rows="3"
          placeholder="请输入备注信息"
          style="width: 100%"
        />
      </div>
        
      <div class="divider">入库明细</div>
      
      <table class="md3-table detail-table" style="width: 100%">
        <thead>
          <tr>
            <th width="60">序号</th>
            <th width="200">原料编号</th>
            <th width="150">原料名称</th>
            <th width="150">规格型号</th>
            <th width="80">单位</th>
            <th width="150">批次号</th>
            <th width="120">应收数量</th>
            <th width="80">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in formData.details" :key="index">
            <td align="center">{{ index + 1 }}</td>
            <td>
              <md-outlined-select
                v-model="row.materialNo"
                @change="handleMaterialChange(index, row.materialNo)"
                style="width: 100%"
              >
                <md-select-option value="">
                  <div slot="headline">请选择原料</div>
                </md-select-option>
                <md-select-option
                  v-for="item in options.materials"
                  :key="item.materialNo"
                  :value="item.materialNo"
                >
                  <div slot="headline">{{ item.materialNo }} ({{ item.materialName }})</div>
                </md-select-option>
              </md-outlined-select>
            </td>
            <td>
              <md-outlined-text-field v-model="row.materialName" disabled style="width: 100%" />
            </td>
            <td>
              <md-outlined-text-field v-model="row.specification" disabled style="width: 100%" />
            </td>
            <td align="center">
              <md-outlined-text-field v-model="row.unit" disabled style="width: 100%" />
            </td>
            <td>
              <md-outlined-text-field v-model="row.batchNo" placeholder="批次号" style="width: 100%" />
            </td>
            <td align="right">
              <md-outlined-text-field
                type="number"
                v-model.number="row.expectedQuantity"
                min="0"
                step="0.01"
                style="width: 100%"
              />
            </td>
            <td align="center">
              <md-text-button class="danger-btn" @click="removeDetail(index)">删除</md-text-button>
            </td>
          </tr>
        </tbody>
      </table>
        
      <div class="add-detail">
        <md-text-button type="button" @click="addDetail">
          <md-icon slot="icon">add</md-icon>
          添加明细
        </md-text-button>
      </div>
    </form>
    <div class="form-actions">
      <md-text-button @click="handleCancel">取消</md-text-button>
      <md-filled-button :disabled="loading" @click="submitForm">
        <span v-if="!loading">提交</span>
        <span v-else class="md3-btn-loading">
          <md-circular-progress indeterminate></md-circular-progress>
          提交中
        </span>
      </md-filled-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';
import { notifyError, notifySuccess, notifyWarning } from '@/utils/notify'

const router = useRouter();

const emit = defineEmits(['success', 'cancel']);

const loading = ref(false);

// 表单数据
const formData = reactive({
  warehouseReceiptNo: '',
  warehouseType: '',
  warehouse: '',
  warehouseMethod: '',
  supplier: '',
  manufacturer: '',
  remark: '',
  details: [
    {
      materialNo: '',
      materialName: '',
      specification: '',
      unit: '',
      batchNo: '',
      expectedQuantity: 0
    }
  ]
});

// 选项数据
const options = reactive({
  warehouseTypes: [],
  warehouses: [],
  warehouseMethods: [],
  suppliers: [],
  manufacturers: [],
  materials: []
});

// 初始化数据
onMounted(() => {
  fetchOptions();
  generateReceiptNo();
});

// 获取选项数据
const fetchOptions = async () => {
  try {
    const res = await api.getInboundCreateOptions();
    Object.assign(options, res.data);
  } catch (error) {
    notifyError('获取选项数据失败');
  }
};

// 生成入库单号
const generateReceiptNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  formData.warehouseReceiptNo = `RK${year}${month}${day}${random}`;
};

// 添加明细行
const addDetail = () => {
  formData.details.push({
    materialNo: '',
    materialName: '',
    specification: '',
    unit: '',
    batchNo: '',
    expectedQuantity: 0
  });
};

// 删除明细行
const removeDetail = (index) => {
  if (formData.details.length <= 1) {
    notifyWarning('至少保留一条明细');
    return;
  }
  formData.details.splice(index, 1);
};

// 原料选择变化
const handleMaterialChange = (index, materialNo) => {
  const material = options.materials.find(item => item.materialNo === materialNo);
  if (material) {
    formData.details[index] = {
      ...formData.details[index],
      materialName: material.materialName,
      specification: material.specification,
      unit: material.unit
    };
  } else {
    formData.details[index] = {
      ...formData.details[index],
      materialName: '',
      specification: '',
      unit: ''
    };
  }
};

const validateForm = () => {
  if (!formData.warehouseType) return '请选择入库类型';
  if (!formData.warehouse) return '请选择入库仓库';
  if (!formData.warehouseMethod) return '请选择入库方式';
  if (!formData.supplier) return '请选择供应商';
  if (!formData.manufacturer) return '请选择生产商';
  return null;
};

// 提交表单
const submitForm = async () => {
  try {
    const errorMsg = validateForm();
    if (errorMsg) {
      notifyWarning(errorMsg);
      return;
    }
    
    if (formData.details.some(item => !item.materialNo)) {
      notifyWarning('请选择所有明细的原料');
      return;
    }
    
    loading.value = true;
    await api.createInboundOrder(formData);
    notifySuccess('创建成功');
    emit('success');
  } catch (error) {
    notifyError('创建失败');
  } finally {
    loading.value = false;
  }
};

// 取消操作
const handleCancel = () => {
  emit('cancel');
};

// 暴露重置方法
const resetForm = () => {
  formData.warehouseType = '';
  formData.warehouse = '';
  formData.warehouseMethod = '';
  formData.supplier = '';
  formData.manufacturer = '';
  formData.remark = '';
  formData.details = [{
    materialNo: '',
    materialName: '',
    specification: '',
    unit: '',
    batchNo: '',
    expectedQuantity: 0
  }];
  generateReceiptNo();
};

defineExpose({ resetForm });
</script>

<style scoped lang="scss">
.create-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 64px);
}

.create-form {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
  
  .form-actions {
    margin-top: 20px;
    text-align: right;
    padding-right: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

.md3-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  label {
    font-weight: 500;
    font-size: 14px;
    color: #333;
  }
  .required {
    color: #f56c6c;
  }
}

.md3-btn-loading {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  md-circular-progress {
    --md-circular-progress-size: 18px;
  }
}

.divider {
  margin: 24px 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--md-sys-color-primary);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  padding-bottom: 8px;
}

.md3-table {
  border-collapse: collapse;
  th {
    background-color: #f8f9fc;
    color: #333;
    font-weight: 600;
    padding: 12px;
    border-bottom: 2px solid #e4e7ed;
    font-size: 14px;
    text-align: left;
  }
  td {
    padding: 8px 12px;
    color: #444;
    font-size: 14px;
    border-bottom: 1px solid #e4e7ed;
  }
  tr:hover {
    background-color: #f5f7fa;
  }
}

.detail-table {
  margin-bottom: 20px;
}

.danger-btn {
  --md-text-button-label-text-color: #f56c6c;
}

.add-detail {
  margin-top: 10px;
  text-align: center;
}
</style>
