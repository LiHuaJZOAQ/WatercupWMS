<template>
  <div class="md3-dashboard">
    <div class="md3-status-grid">
      <md-elevated-card v-for="(item, index) in statusItems" :key="index" class="md3-status-card" :class="item.type">
        <div class="md3-status-body">
          <div class="md3-status-top">
            <div class="md3-status-label">{{ item.label }}</div>
            <div class="md3-status-icon" aria-hidden="true">{{ item.icon }}</div>
          </div>
          <div class="md3-status-value">{{ item.value }}</div>
        </div>
      </md-elevated-card>
    </div>

    <md-elevated-card class="md3-tabs-card">
      <md-tabs>
        <md-primary-tab :active="activeTab === 'inbound'" @click="activeTab = 'inbound'">
          <md-icon slot="icon">arrow_downward</md-icon>
          入库管理
        </md-primary-tab>
        <md-primary-tab :active="activeTab === 'outbound'" @click="activeTab = 'outbound'">
          <md-icon slot="icon">arrow_upward</md-icon>
          出库管理
        </md-primary-tab>
        <md-primary-tab :active="activeTab === 'inventory'" @click="activeTab = 'inventory'">
          <md-icon slot="icon">inventory</md-icon>
          库存监控
        </md-primary-tab>
      </md-tabs>
    </md-elevated-card>

    <div class="md3-cards-grid">
      <md-elevated-card v-for="(card, index) in currentCards" :key="index" class="md3-kpi-card" :class="card.status">
        <div class="md3-kpi-head">
          <div class="md3-kpi-value">
            {{ card.value }}
            <span v-if="card.trend" class="md3-kpi-trend" :class="card.trend">
              {{ card.trend === 'up' ? '↗' : '↓' }}
            </span>
          </div>
          <div v-if="card.percentage" class="md3-kpi-chip">{{ card.percentage }}</div>
        </div>
        <div class="md3-kpi-label">{{ card.label }}</div>
        <div class="md3-kpi-actions">
          <md-text-button @click="viewDetails(card.type)">查看详情</md-text-button>
        </div>
      </md-elevated-card>
    </div>

    <!-- 图表区域 -->
    <div class="md3-charts-grid">
      <md-elevated-card class="md3-panel md3-panel--large">
        <div class="md3-panel-header">
          <div class="md3-panel-title">
            <md-icon aria-hidden="true">show_chart</md-icon>
            库存预警趋势
          </div>
          <md-outlined-select
            class="md3-select"
            label="时间范围"
            :value="chartTimeRange"
            @change="(e) => { chartTimeRange = e.target.value; updateWarningChart() }"
          >
            <md-select-option value="7"><div slot="headline">最近7天</div></md-select-option>
            <md-select-option value="30"><div slot="headline">最近30天</div></md-select-option>
            <md-select-option value="90"><div slot="headline">最近90天</div></md-select-option>
          </md-outlined-select>
        </div>
        <div id="warningChart" class="md3-chart"></div>
      </md-elevated-card>

      <md-elevated-card class="md3-panel md3-panel--medium">
        <div class="md3-panel-header">
          <div class="md3-panel-title">
            <md-icon aria-hidden="true">monitoring</md-icon>
            实时库存监控
          </div>
          <div class="md3-live-indicator" :data-active="isRefreshing">
            <span class="md3-live-dot"></span>
            实时更新
          </div>
        </div>
        <div class="md3-monitor-list">
          <div class="md3-monitor-item" v-for="item in inventoryMonitor" :key="item.id" :data-status="item.status">
            <div class="md3-monitor-main">
              <div class="md3-monitor-name">{{ item.name }}</div>
              <div class="md3-monitor-sub">{{ item.location }}</div>
            </div>
            <div class="md3-monitor-qty">
              <div class="md3-monitor-num">{{ item.current }}</div>
              <div class="md3-monitor-unit">{{ item.unit }}</div>
            </div>
            <div class="md3-monitor-meter">
              <div class="md3-meter-track">
                <div class="md3-meter-fill" :style="{ width: item.percentage + '%' }"></div>
              </div>
              <div class="md3-meter-pct">{{ item.percentage }}%</div>
            </div>
          </div>
        </div>
      </md-elevated-card>
    </div>

    <!-- 底部详细信息区域 -->
    <div class="md3-bottom-grid">
      <md-elevated-card class="md3-panel">
        <div class="md3-panel-header">
          <div class="md3-panel-title">
            <md-icon aria-hidden="true">grid_on</md-icon>
            库位分布热力图
          </div>
          <div class="md3-chip-row">
            <md-filter-chip
              v-for="warehouse in warehouses"
              :key="warehouse.id"
              :selected="selectedWarehouse === warehouse.id"
              @click="selectedWarehouse = warehouse.id"
            >
              {{ warehouse.name }}
            </md-filter-chip>
          </div>
        </div>
        <div class="md3-heatmap">
          <div class="md3-warehouse-layout">
            <div
              v-for="location in warehouseLayout"
              :key="location.id"
              class="md3-location-cell"
              :data-status="location.status"
              :title="`${location.name} - 占用率: ${location.occupancy}%`"
            >
              <div class="md3-location-code">{{ location.code }}</div>
              <div class="md3-location-fill" :style="{ height: location.occupancy + '%' }"></div>
            </div>
          </div>
          <div class="md3-legend">
            <div class="md3-legend-item"><span class="md3-legend-dot" data-level="empty"></span>空闲</div>
            <div class="md3-legend-item"><span class="md3-legend-dot" data-level="low"></span>低占用</div>
            <div class="md3-legend-item"><span class="md3-legend-dot" data-level="medium"></span>中等占用</div>
            <div class="md3-legend-item"><span class="md3-legend-dot" data-level="high"></span>高占用</div>
            <div class="md3-legend-item"><span class="md3-legend-dot" data-level="full"></span>满载</div>
          </div>
        </div>
      </md-elevated-card>

      <md-elevated-card class="md3-panel">
        <div class="md3-panel-header">
          <div class="md3-panel-title">
            <md-icon aria-hidden="true">warning</md-icon>
            预警通知
          </div>
          <div class="md3-alert-count">{{ alertNotifications.length }} 条预警</div>
        </div>
        <div class="md3-alert-list">
          <div v-for="alert in alertNotifications" :key="alert.id" class="md3-alert-item" :data-level="alert.level">
            <div class="md3-alert-main">
              <div class="md3-alert-title">{{ alert.title }}</div>
              <div class="md3-alert-desc">{{ alert.description }}</div>
              <div class="md3-alert-time">{{ alert.time }}</div>
            </div>
            <md-text-button @click="handleAlert(alert.id)">处理</md-text-button>
          </div>
        </div>
      </md-elevated-card>
    </div>

    <md-dialog :open="showAlertModal" @close="closeModal">
      <div slot="headline">库存预警</div>
      <div slot="content" class="md3-dialog-content">
        <div class="md3-dialog-message">{{ currentAlert.message }}</div>
        <div class="md3-dialog-kv">
          <div class="md3-kv-row"><span>物料名称</span><span>{{ currentAlert.itemName }}</span></div>
          <div class="md3-kv-row"><span>当前库存</span><span>{{ currentAlert.currentStock }}</span></div>
          <div class="md3-kv-row"><span>最小库存</span><span>{{ currentAlert.minStock }}</span></div>
          <div class="md3-kv-row"><span>建议补货量</span><span>{{ currentAlert.suggestedOrder }}</span></div>
        </div>
      </div>
      <div slot="actions">
        <md-text-button @click="closeModal">关闭</md-text-button>
        <md-filled-button @click="createPurchaseOrder">生成采购订单</md-filled-button>
      </div>
    </md-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useRouter } from 'vue-router'
import api from '@/api'

const router = useRouter()
const loading = ref(true)

// ==================== 响应式数据状态 ====================

// 响应式数据
const activeTab = ref('inventory')
const chartTimeRange = ref('30')
const selectedWarehouse = ref(1)
const isRefreshing = ref(false)
const showAlertModal = ref(false)
const currentAlert = ref({})

// 顶部状态数据
const statusItems = ref([
  { value: 0, label: '订单待审核', icon: '📋', type: 'warning' },
  { value: 0, label: '订单已审核', icon: '✅', type: 'success' },
  { value: 0, label: '待出库', icon: '📦', type: 'info' },
  { value: 0, label: '库存预警', icon: '⚠', type: 'danger' },
  { value: 0, label: '波次任务', icon: '🔄', type: 'warning' },
  { value: 0, label: '今日完成', icon: '✅', type: 'info' }
])

// 卡片数据
const inboundCards = ref([
  { value: 0, label: '待处理入库', trend: 'down', percentage: '0', type: 'pending', status: 'normal' },
  { value: 0, label: '今日入库单', trend: 'up', percentage: '0', type: 'inbound', status: 'good' }
])

const outboundCards = ref([
  { value: 0, label: '待处理出库', trend: 'up', percentage: '0', type: 'picking', status: 'normal' },
  { value: 0, label: '今日出库单', trend: 'up', percentage: '0', type: 'outbound', status: 'good' }
])

const inventoryCards = ref([
  { value: 0, label: '全局总库存', trend: 'up', percentage: '常规', type: 'total', status: 'good' },
  { value: 0, label: '商品SKU总数', trend: 'up', percentage: '活跃', type: 'sku', status: 'normal' }
])

// 计算当前显示的卡片
const currentCards = computed(() => {
  switch (activeTab.value) {
    case 'inbound':
      return inboundCards.value
    case 'outbound':
      return outboundCards.value
    case 'inventory':
    default:
      return inventoryCards.value
  }
})

// 实时库存监控数据（Mock或后端返回）
const inventoryMonitor = ref([])

// 仓库列表
const warehouses = ref([
  { id: 1, name: '主仓库', code: 'WH001' }
])

// 库位布局数据
const warehouseLayout = ref([])

// 预警通知数据
const alertNotifications = ref([])

// 图表相关
let warningChart = null

// ==================== API 数据拉取 ====================

const fetchDashboardData = async () => {
  try {
    loading.value = true;
    const res = await api.getDashboardSummary();
    const data = res.data;
    
    if (data) {
      // 1. 刷新状态栏
      statusItems.value[0].value = data.pending?.pendingInbounds || 0;
      statusItems.value[2].value = data.pending?.pendingOutbounds || 0;
      statusItems.value[4].value = data.pending?.pendingWaves || 0;
      statusItems.value[5].value = (data.inbound?.todayCount || 0) + (data.outbound?.todayCount || 0);

      // 2. 刷新核心卡片
      inboundCards.value[0].value = data.pending?.pendingInbounds || 0;
      inboundCards.value[1].value = data.inbound?.todayCount || 0;
      
      outboundCards.value[0].value = data.pending?.pendingOutbounds || 0;
      outboundCards.value[1].value = data.outbound?.todayCount || 0;

      const totalInv = (data.inventory || []).reduce((sum, item) => sum + Number(item.totalQuantity), 0);
      const totalSku = (data.inventory || []).reduce((sum, item) => sum + Number(item.totalItems), 0);
      inventoryCards.value[0].value = totalInv;
      inventoryCards.value[1].value = totalSku;

      // 3. 更新图表
      await nextTick();
      updateCharts(data.trendChart || [], data.categoryChart || []);
    }
  } catch (error) {
    console.error('获取仪表盘数据失败', error);
  } finally {
    loading.value = false;
  }
}

// ==================== 业务逻辑与图表 ====================

const viewDetails = (type) => {
  if (activeTab.value === 'inbound') {
    router.push({ path: '/inStorage/rawMaterial' }) // 兼容旧路由名或通用路由
  } else if (activeTab.value === 'outbound') {
    router.push({ path: '/outStorage/finishedProduct' })
  } else {
    router.push({ path: '/inventoryManage/rawMaterial' })
  }
}

const initCharts = () => {
  const chartDom = document.getElementById('warningChart')
  if (!chartDom) return
  warningChart = echarts.init(chartDom)
}

const updateCharts = (trendData, categoryData) => {
  if (!warningChart) return;
  
  // 使用从后端拉取的近7天出入库趋势作为主图表数据
  const dates = trendData.map(t => t.date);
  const inData = trendData.map(t => t.inQuantity);
  const outData = trendData.map(t => t.outQuantity);

  warningChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['入库量', '出库量'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: [{ type: 'category', data: dates.length ? dates : ['暂无数据'] }],
    yAxis: [{ type: 'value' }],
    series: [
      { name: '入库量', type: 'bar', data: inData.length ? inData : [0], itemStyle: { color: '#67C23A' } },
      { name: '出库量', type: 'bar', data: outData.length ? outData : [0], itemStyle: { color: '#F56C6C' } }
    ]
  });
}

const updateWarningChart = () => {
  // 切换时间范围时，可以扩展重新调用 API 传入日期
  fetchDashboardData();
}

const handleAlert = (alertId) => {
  // 弹窗处理
  showAlertModal.value = true
}

const closeModal = () => {
  showAlertModal.value = false
}

const createPurchaseOrder = () => {
  showAlertModal.value = false
}

const startRealTimeUpdates = () => {
  // 废除前端纯随机的假数据轮询，改为定时轮询后端 API (每30秒一次)
  setInterval(() => {
    isRefreshing.value = true;
    fetchDashboardData().then(() => {
      setTimeout(() => isRefreshing.value = false, 500);
    });
  }, 30000);
}

// 生命周期
onMounted(() => {
  initCharts()
  fetchDashboardData()
  startRealTimeUpdates()
  window.addEventListener('resize', () => warningChart?.resize())
})

onUnmounted(() => {
  warningChart?.dispose()
})
</script>

<style scoped lang="scss">
.md3-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.md3-status-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.md3-status-card {
  border-radius: 20px;
  overflow: hidden;
}

.md3-status-body {
  padding: 16px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.md3-status-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.md3-status-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface-variant);
}

.md3-status-icon {
  font-size: 18px;
  opacity: 0.8;
}

.md3-status-value {
  font-size: 28px;
  font-weight: 600;
  line-height: 1;
  color: var(--md-sys-color-on-surface);
}

.md3-status-card.warning {
  background: color-mix(in srgb, #ed6c02 12%, var(--md-sys-color-surface));
}

.md3-status-card.success {
  background: color-mix(in srgb, #2e7d32 12%, var(--md-sys-color-surface));
}

.md3-status-card.info {
  background: color-mix(in srgb, var(--md-sys-color-secondary) 10%, var(--md-sys-color-surface));
}

.md3-status-card.danger {
  background: color-mix(in srgb, var(--md-sys-color-error) 10%, var(--md-sys-color-surface));
}

.md3-tabs-card {
  border-radius: 20px;
  overflow: hidden;
  padding: 6px 10px;
  background: var(--md-sys-color-surface-container-lowest);
}

md-tabs {
  width: 100%;
  --md-tabs-divider-color: transparent;
}

.md3-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.md3-kpi-card {
  border-radius: 24px;
  overflow: hidden;
}

.md3-kpi-card.normal {
  background: var(--md-sys-color-surface-container-lowest);
}

.md3-kpi-card.good {
  background: color-mix(in srgb, #2e7d32 12%, var(--md-sys-color-surface-container-lowest));
}

.md3-kpi-card.warning {
  background: color-mix(in srgb, #ed6c02 14%, var(--md-sys-color-surface-container-lowest));
}

.md3-kpi-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 18px 0;
  gap: 12px;
}

.md3-kpi-value {
  font-size: 30px;
  font-weight: 650;
  color: var(--md-sys-color-on-surface);
  display: flex;
  align-items: center;
  gap: 10px;
}

.md3-kpi-trend {
  font-size: 18px;
}

.md3-kpi-trend.up {
  color: #2e7d32;
}

.md3-kpi-trend.down {
  color: var(--md-sys-color-error);
}

.md3-kpi-chip {
  padding: 6px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--md-sys-color-primary) 14%, var(--md-sys-color-surface));
  color: var(--md-sys-color-on-surface);
  font-weight: 600;
  font-size: 12px;
}

.md3-kpi-label {
  padding: 10px 18px 12px;
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant);
  font-weight: 600;
}

.md3-kpi-actions {
  padding: 0 12px 14px;
  display: flex;
  justify-content: flex-end;
}

.md3-charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}

.md3-bottom-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}

.md3-panel {
  border-radius: 24px;
  overflow: hidden;
  background: var(--md-sys-color-surface-container-lowest);
}

.md3-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container-low);
}

.md3-panel-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  color: var(--md-sys-color-on-surface);
}

.md3-panel-title md-icon {
  color: var(--md-sys-color-primary);
}

.md3-select {
  min-width: 150px;
}

.md3-chart {
  height: 320px;
}

.md3-live-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface-variant);
}

.md3-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--md-sys-color-outline);
}

.md3-live-indicator[data-active="true"] .md3-live-dot {
  background: #2e7d32;
  box-shadow: 0 0 0 6px color-mix(in srgb, #2e7d32 18%, transparent);
}

.md3-monitor-list {
  max-height: 340px;
  overflow: auto;
}

.md3-monitor-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 14px;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
}

.md3-monitor-item:hover {
  background: var(--md-sys-color-surface-container-low);
}

.md3-monitor-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--md-sys-color-on-surface);
}

.md3-monitor-sub {
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant);
}

.md3-monitor-qty {
  text-align: right;
}

.md3-monitor-num {
  font-size: 15px;
  font-weight: 750;
  color: var(--md-sys-color-on-surface);
}

.md3-monitor-unit {
  font-size: 11px;
  color: var(--md-sys-color-on-surface-variant);
}

.md3-meter-track {
  width: 78px;
  height: 8px;
  background: var(--md-sys-color-surface-container);
  border-radius: 999px;
  overflow: hidden;
}

.md3-meter-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--md-sys-color-error), #ed6c02, #2e7d32);
}

.md3-meter-pct {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 650;
  color: var(--md-sys-color-on-surface-variant);
  text-align: right;
}

.md3-chip-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.md3-heatmap {
  padding: 18px;
}

.md3-warehouse-layout {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.md3-location-cell {
  height: 64px;
  border-radius: 16px;
  border: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container-low);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: var(--md-sys-color-on-surface);
}

.md3-location-cell[data-status="low"] {
  background: color-mix(in srgb, #2e7d32 12%, var(--md-sys-color-surface-container-low));
}

.md3-location-cell[data-status="medium"] {
  background: color-mix(in srgb, #ed6c02 12%, var(--md-sys-color-surface-container-low));
}

.md3-location-cell[data-status="high"] {
  background: color-mix(in srgb, var(--md-sys-color-error) 10%, var(--md-sys-color-surface-container-low));
}

.md3-location-cell[data-status="full"] {
  background: color-mix(in srgb, var(--md-sys-color-outline) 18%, var(--md-sys-color-surface-container-low));
}

.md3-location-code {
  position: relative;
  z-index: 1;
  font-size: 12px;
}

.md3-location-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 22%, transparent);
}

.md3-legend {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 14px;
}

.md3-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 650;
  color: var(--md-sys-color-on-surface-variant);
}

.md3-legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 4px;
  background: var(--md-sys-color-surface-container);
  border: 1px solid var(--md-sys-color-outline-variant);
}

.md3-legend-dot[data-level="low"] {
  background: color-mix(in srgb, #2e7d32 16%, var(--md-sys-color-surface-container));
}

.md3-legend-dot[data-level="medium"] {
  background: color-mix(in srgb, #ed6c02 16%, var(--md-sys-color-surface-container));
}

.md3-legend-dot[data-level="high"] {
  background: color-mix(in srgb, var(--md-sys-color-error) 14%, var(--md-sys-color-surface-container));
}

.md3-legend-dot[data-level="full"] {
  background: color-mix(in srgb, var(--md-sys-color-outline) 18%, var(--md-sys-color-surface-container));
}

.md3-alert-count {
  padding: 6px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--md-sys-color-error) 12%, var(--md-sys-color-surface));
  font-size: 12px;
  font-weight: 800;
  color: var(--md-sys-color-on-surface);
}

.md3-alert-list {
  max-height: 420px;
  overflow: auto;
}

.md3-alert-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: start;
  padding: 14px 18px;
  border-bottom: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
}

.md3-alert-item:hover {
  background: var(--md-sys-color-surface-container-low);
}

.md3-alert-title {
  font-size: 13px;
  font-weight: 800;
  color: var(--md-sys-color-on-surface);
}

.md3-alert-desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant);
}

.md3-alert-time {
  margin-top: 6px;
  font-size: 11px;
  font-weight: 650;
  color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 70%, transparent);
}

.md3-dialog-content {
  display: grid;
  gap: 14px;
}

.md3-dialog-message {
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant);
  font-weight: 600;
}

.md3-dialog-kv {
  border-radius: 16px;
  border: 1px solid var(--md-sys-color-outline-variant);
  overflow: hidden;
}

.md3-kv-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px;
  padding: 10px 12px;
  background: var(--md-sys-color-surface-container-lowest);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  font-size: 12px;
  font-weight: 650;
  color: var(--md-sys-color-on-surface);
}

.md3-kv-row:last-child {
  border-bottom: none;
}

.md3-kv-row span:first-child {
  color: var(--md-sys-color-on-surface-variant);
  font-weight: 700;
}

@media (max-width: 1360px) {
  .md3-status-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .md3-cards-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .md3-charts-grid,
  .md3-bottom-grid {
    grid-template-columns: 1fr;
  }

  .md3-warehouse-layout {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 680px) {
  .md3-cards-grid {
    grid-template-columns: 1fr;
  }

  .md3-warehouse-layout {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
