<template>
  <div class="md3-page">
    <md-elevated-card class="md3-card md3-card--tight">
      <div class="header">
        <md-text-button @click="goBack">
          <md-icon slot="icon">arrow_back</md-icon>
          返回上一级
        </md-text-button>
        <div class="right-buttons">
          <md-filled-button @click="approve">同意</md-filled-button>
          <md-filled-tonal-button @click="disagree">不同意</md-filled-tonal-button>
          <md-filled-button @click="cancel">撤销</md-filled-button>
          <md-filled-tonal-button @click="discard">作废</md-filled-tonal-button>
          <md-filled-tonal-button @click="qualityInspection">质检</md-filled-tonal-button>
          <md-filled-button @click="print">打印</md-filled-button>
        </div>
      </div>
    </md-elevated-card>

    <!-- 主体内容区 -->
    <md-elevated-card class="md3-card">
    <div class="main-content">
      <!-- 基本信息 -->
      <div class="basic-info">
        <div class="info-grid">
          <div class="info-col">
            <div class="info-item"><strong>单号：</strong>{{ orderInfo.orderNo }}</div>
            <div class="info-item"><strong>创建人：</strong>{{ orderInfo.creator }}</div>
            <div class="info-item"><strong>来源单号：</strong>{{ orderInfo.sourceNo }}</div>
            <div class="info-item"><strong>创建时间：</strong>{{ orderInfo.createTime }}</div>
          </div>
          <div class="info-col">
            <div class="info-item"><strong>入库仓库：</strong>{{ orderInfo.warehouse }}</div>
            <div class="info-item"><strong>入库类型：</strong>{{ orderInfo.type }}</div>
            <div class="info-item"><strong>入库方式：</strong>{{ orderInfo.mode }}</div>
            <div class="info-item"><strong>状态：</strong><span class="status-tag">{{ orderInfo.status }}</span></div>
          </div>
          <div class="info-col">
            <div class="timeline">
              <div class="timeline-item" v-for="(step, index) in processSteps" :key="index">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div>{{ step.phase }}</div>
                  <div class="user">{{ step.user }}</div>
                  <div :class="step.statusClass">{{ step.status }}</div>
                  <div>{{ step.time }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 商品信息表格 -->
      <div class="goods-table">
        <table class="md3-table" style="width: 100%">
          <thead>
            <tr>
              <th width="60">序号</th>
              <th>原料编号</th>
              <th>原料名称</th>
              <th>规格型号</th>
              <th>单位</th>
              <th>批次号</th>
              <th>应收数量</th>
              <th>应收净重</th>
              <th>实收数量</th>
              <th>实收毛重</th>
              <th>实收净重</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in goodsData" :key="index">
              <td align="center">{{ row.index }}</td>
              <td>{{ row.materialNo }}</td>
              <td>{{ row.materialName }}</td>
              <td>{{ row.specification }}</td>
              <td>{{ row.unit }}</td>
              <td>{{ row.batchNo }}</td>
              <td align="right">{{ row.receivableQty }}</td>
              <td align="right">{{ row.receivableWeight }}</td>
              <td align="right">{{ row.receivedQty }}</td>
              <td align="right">{{ row.receivedGrossWeight }}</td>
              <td align="right">{{ row.receivedNetWeight }}</td>
              <td>{{ row.remark }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    </md-elevated-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { notifySuccess } from '@/utils/notify'
import {useCounterStore} from '@/stores/counter'
import { useRoute, useRouter } from 'vue-router'

const counter = useCounterStore()
// 订单信息数据
const orderInfo = reactive({
  orderNo: '484511345434154',
  creator: '刘会给',
  sourceNo: '484511345434154',
  createTime: '2022-08-01',
  warehouse: 'A仓库',
  type: '采购入库',
  mode: '虚拟入库',
  status: '待审批'
})

// 流程进度数据
const processSteps = ref([
  { phase: '创建单据', user: '王佳楠', time: '2022-08-01', status: '', statusClass: '' },
  { phase: '部门初审', user: '张雅甫', time: '2022-08-02', status: '已审核', statusClass: 'approved' },
  { phase: '财务复审', user: '邓复', time: '2022-08-02', status: '未审核', statusClass: 'pending' },
  { phase: '完成', user: '', time: '', status: '', statusClass: 'approved' }
])

// 商品数据
const goodsData = ref([
  {
    index: 1,
    materialNo: '123456',
    materialName: '名称名称',
    specification: '10 * 10',
    unit: 'M2',
    batchNo: '202215415',
    receivableQty: 1564,
    receivableWeight: 1564,
    receivedQty: 1564,
    receivedGrossWeight: 1564,
    receivedNetWeight: 1564,
    remark: ''
  },
  // 其他商品数据...
])

// 操作方法
const approve = () => {
  notifySuccess('操作成功')
  // 实际业务逻辑
}

const disagree = () => {
  notifySuccess('操作成功')
}

const cancel = () => {
  notifySuccess('操作成功')
}

const discard = () => {
  notifySuccess('操作成功')
}

const qualityInspection = () => {
  notifySuccess('质检功能')
}

const print = () => {
  notifySuccess('打印功能')
}

const router = useRouter()

const goBack = () => {
  router.back()
  notifySuccess('返回上一级')
}
</script>

<style scoped lang="scss">
.md3-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100vh;
}

.md3-card {
  border-radius: 24px;
  overflow: hidden;
  background: var(--md-sys-color-surface-container-lowest);
}

.md3-card--tight {
  padding: 12px 14px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.right-buttons {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px; /* 添加按钮之间的间距 */
}

.main-content {
  flex: 1;
  padding: 20px;
}

.basic-info {
  padding: 20px;
  background-color: var(--md-sys-color-surface-container-lowest);
  border-radius: 8px;
  margin-bottom: 20px;
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .info-item {
    margin-bottom: 10px;
    font-size: 14px;
    color: #495057;
  }

  .timeline {
    position: relative;
    padding-left: 20px;

    &:before {
      content: '';
      position: absolute;
      top: 0;
      left: 5px;
      width: 1px;
      height: 100%;
      background-color: #cdd9e5;
    }

    .timeline-item {
      position: relative;
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      .timeline-dot {
        position: absolute;
        left: -8px;
        top: 5px;
        width: 16px;
        height: 16px;
        background-color: #409eff;
        border-radius: 50%;
        border: 2px solid #fff;
      }

      .timeline-content {
        padding-left: 20px;
        line-height: 1.8;

        .user {
          color: #6c757d;
          font-size: 12px;
          margin: 4px 0;
        }

        .pending {
          color: #f56c6c;
        }

        .approved {
          color: #67c23a;
        }
      }
    }
  }
}

.goods-table {
  border-radius: 8px;
  overflow: hidden;
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
    padding: 12px;
    color: #444;
    font-size: 14px;
    border-bottom: 1px solid #e4e7ed;
  }
  tr:hover {
    background-color: #f5f7fa;
  }
}

.status-tag {
  display: inline-block;
  padding: 5px 12px;
  background-color: #ffd700;
  color: #303133;
  border-radius: 4px;
  font-size: 12px;
}

/* 响应式布局 */
@media (max-width: 600px) {
  .right-buttons {
    flex-direction: column;
    align-items: flex-start;
    margin-top: 10px;
  }
  .info-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>    
