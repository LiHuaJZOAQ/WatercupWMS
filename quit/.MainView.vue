<template>
    <div>
      <!-- 右侧内容区 -->
      <div class="content">
        <!-- 顶部状态栏 -->
        <div class="status-bar">
          <div class="status-item" v-for="(item, index) in statusItems" :key="index">
            <div class="value">{{ item.value }}</div>
            <div class="label">{{ item.label }}</div>
          </div>
        </div>
  
        <!-- 入库/出库切换 -->
        <div class="tabs">
          <div class="tab active">入库</div>
          <div class="tab">出库</div>
        </div>
  
        <!-- 数据卡片 -->
        <div class="cards">
          <div class="card" v-for="(card, index) in cards" :key="index">
            <div class="card-value">{{ card.value }}<span v-if="card.trend" class="trend">↓</span></div>
            <div class="card-label">{{ card.label }}</div>
            <div class="detail">查看详情 ></div>
          </div>
        </div>
  
        <!-- 图表区 -->
        <div class="charts">
          <div class="chart-container">
            <h3>库存预警趋势</h3>
            <div id="warningChart" style="height: 300px"></div>
          </div>
          
          <div class="sales-rank">
            <h3>销售额排名</h3>
            <div class="rank-item" v-for="(item, index) in salesData" :key="index">
              <div class="rank">{{ item.rank }}</div>
              <div class="name">{{ item.name }}</div>
              <div class="bar" :style="{ width: item.width + '%' }"></div>
              <div class="value">{{ item.value }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { onMounted } from 'vue'
  import * as echarts from 'echarts'
  
  const statusItems = [
    { value: 8, label: '订单待审核' },
    { value: 12, label: '订单已审核' },
    { value: 5, label: '待出库' },
    { value: 0, label: '待退货审核' },
    { value: 7, label: '待退货' },
    { value: 20, label: '待退款' }
  ]
  
  const cards = [
    { value: 489, label: '待收货', trend: true },
    { value: 489, label: '待入库' },
    { value: 489, label: '待拣货' },
    { value: 489, label: '待出库' }
  ]
  
  const salesData = [
    { rank: '①', name: '一号', value: '323,234', width: 100 },
    { rank: '②', name: '二号', value: '323,234', width: 75 },
    { rank: '③', name: '三号', value: '323,234', width: 50 },
    { rank: '④', name: '四号', value: '323,234', width: 25 },
    { rank: '⑤', name: '五号', value: '323,234', width: 10 }
  ]
  
  onMounted(() => {
    const chart = echarts.init(document.getElementById('warningChart'))
    chart.setOption({
      xAxis: {
        type: 'category',
        data: ['10月', '11月', '12月', '1月', '2月', '5月', '9月']
      },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: [1250, 1000, 750, 500, 250, 0, 200]
      }]
    })
  })
  </script>
  
  <style scoped>
  .sidebar {
    width: 240px;
    background: #1a3052;
    color: white;
  }
  
  .logo {
    font-size: 24px;
    margin-bottom: 40px;
  }
  
  
  .content {
    flex: 1;
    background: #f5f7fa;
  }
  
  .status-bar {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .status-item {
    background: white;
    padding: 15px;
    border-radius: 8px;
    text-align: center;
  }
  
  .tabs {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .tab {
    padding: 10px 20px;
    cursor: pointer;
  }
  
  .active {
    border-bottom: 2px solid #409eff;
  }
  
  .cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .card {
    background: white;
    padding: 20px;
    border-radius: 8px;
  }
  
  .charts {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 30px;
  }
  
  .sales-rank {
    background: white;
    padding: 20px;
    border-radius: 8px;
  }
  
  .rank-item {
    display: flex;
    align-items: center;
    margin: 10px 0;
  }
  
  .bar {
    height: 20px;
    background: #409eff;
    margin: 0 10px;
  }
  
  .trend {
    color: #ff4d4f;
    margin-left: 5px;
  }
  </style>