const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { successResponse, errorResponse, executeQuery } = require('../utils');
const moment = require('moment');

// 获取仪表盘综合统计数据 (针对水杯制造版 innovative-wms)
router.get('/dashboard/summary', async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');

    // 1. 获取库存卡片数据 (原料 vs 成品)
    const rawInvSql = `SELECT COUNT(InventoryID) as totalItems, IFNULL(SUM(CurrentQuantity), 0) as totalQuantity FROM Inventory WHERE ItemType = 'RawMaterial'`;
    const finInvSql = `SELECT COUNT(InventoryID) as totalItems, IFNULL(SUM(CurrentQuantity), 0) as totalQuantity FROM Inventory WHERE ItemType = 'FinishedProduct'`;
    const [rawInv] = await executeQuery(rawInvSql);
    const [finInv] = await executeQuery(finInvSql);

    // 2. 获取今日/本月入库量 (合并原料和成品)
    const inboundSql = `
      SELECT 
        (SELECT COUNT(*) FROM RawMaterialInbound WHERE Status = 'Completed' AND DATE(CreatedTime) = ?) +
        (SELECT COUNT(*) FROM FinishedProductInbound WHERE Status = 'Completed' AND DATE(CreatedTime) = ?) as todayCount,
        (SELECT COUNT(*) FROM RawMaterialInbound WHERE Status = 'Completed' AND DATE(CreatedTime) >= ?) +
        (SELECT COUNT(*) FROM FinishedProductInbound WHERE Status = 'Completed' AND DATE(CreatedTime) >= ?) as monthCount
    `;
    const inboundStats = await executeQuery(inboundSql, [today, today, startOfMonth, startOfMonth]);

    // 3. 获取今日/本月出库量 (合并原料和成品)
    const outboundSql = `
      SELECT 
        (SELECT COUNT(*) FROM RawMaterialOutbound WHERE Status = 'Completed' AND DATE(CreatedTime) = ?) +
        (SELECT COUNT(*) FROM FinishedProductOutbound WHERE Status = 'Completed' AND DATE(CreatedTime) = ?) as todayCount,
        (SELECT COUNT(*) FROM RawMaterialOutbound WHERE Status = 'Completed' AND DATE(CreatedTime) >= ?) +
        (SELECT COUNT(*) FROM FinishedProductOutbound WHERE Status = 'Completed' AND DATE(CreatedTime) >= ?) as monthCount
    `;
    const outboundStats = await executeQuery(outboundSql, [today, today, startOfMonth, startOfMonth]);

    // 4. 获取待办任务数
    const pendingTasksSql = `
      SELECT 
        (SELECT COUNT(*) FROM RawMaterialInbound WHERE Status = 'Pending') + (SELECT COUNT(*) FROM FinishedProductInbound WHERE Status = 'Pending') as pendingInbounds,
        (SELECT COUNT(*) FROM RawMaterialOutbound WHERE Status = 'Pending') + (SELECT COUNT(*) FROM FinishedProductOutbound WHERE Status = 'Pending') as pendingOutbounds,
        (SELECT COUNT(*) FROM Wave WHERE Status = 'Pending') as pendingWaves
    `;
    const pendingTasks = await executeQuery(pendingTasksSql);

    // 5. 获取库存分布图表数据 (原料 vs 成品比例)
    const categoryStats = [
      { name: '原材料', value: rawInv.totalQuantity || 0 },
      { name: '成品', value: finInv.totalQuantity || 0 }
    ];

    // 6. 获取近7天出入库趋势 (从流水表中查询)
    const trendSql = `
      SELECT 
        DATE(TransactionTime) as date,
        SUM(CASE WHEN TransactionType = 'INBOUND' THEN Quantity ELSE 0 END) as inQuantity,
        SUM(CASE WHEN TransactionType = 'OUTBOUND' THEN ABS(Quantity) ELSE 0 END) as outQuantity
      FROM InventoryTransaction
      WHERE TransactionTime >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(TransactionTime)
      ORDER BY date ASC
    `;
    const trendStats = await executeQuery(trendSql);

    res.json(successResponse({
      inventory: [
        { type: 'RawMaterial', totalItems: rawInv.totalItems, totalQuantity: rawInv.totalQuantity },
        { type: 'FinishedProduct', totalItems: finInv.totalItems, totalQuantity: finInv.totalQuantity }
      ],
      inbound: inboundStats[0],
      outbound: outboundStats[0],
      pending: pendingTasks[0],
      categoryChart: categoryStats,
      trendChart: trendStats
    }));

  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    res.status(500).json(errorResponse('获取仪表盘数据失败'));
  }
});

module.exports = router;
