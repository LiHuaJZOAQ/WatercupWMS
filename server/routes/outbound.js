const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { createResponse, successResponse, errorResponse, formatDateTime, validateRequired, executeQuery, executeTransaction } = require('../utils');
const moment = require('moment');

const JWT_SECRET = process.env.JWT_SECRET || 'watercup_wms_secret_key';

// ====================================
// 原料出库管理接口
// ====================================

// 1. 获取出库单筛选选项
router.get('/api/outbound-orders/options', async (req, res) => {
  try {
    const numbersResult = await executeQuery(
      'SELECT DISTINCT OutboundNumber as value, OutboundNumber as label FROM RawMaterialOutbound ORDER BY OutboundNumber DESC'
    );
    res.json(successResponse({ outboundNumbers: numbersResult }));
  } catch (error) {
    console.error('获取出库单选项失败:', error);
    res.status(500).json(errorResponse('获取选项失败'));
  }
});

// 2. 获取出库单列表
router.get('/api/outbound-orders', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, outboundNo, status, startDate, endDate } = req.query;
    let whereConditions = [];
    let queryParams = [];

    if (outboundNo) {
      whereConditions.push('ro.OutboundNumber LIKE ?');
      queryParams.push(`%${outboundNo}%`);
    }
    if (status) {
      whereConditions.push('ro.Status = ?');
      queryParams.push(status);
    }
    if (startDate) {
      whereConditions.push('ro.OutboundDate >= ?');
      queryParams.push(startDate);
    }
    if (endDate) {
      whereConditions.push('ro.OutboundDate <= ?');
      queryParams.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    const countSql = `SELECT COUNT(*) as total FROM RawMaterialOutbound ro ${whereClause}`;
    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0].total;

    const sql = `
      SELECT 
        ro.OutboundID as id,
        ro.OutboundNumber as outboundNo,
        ro.OutboundType as type,
        ro.OutboundDate as outboundDate,
        ro.Status as status,
        ro.TotalAmount as totalAmount,
        ro.Remarks as remarks,
        u.Username as operatorName,
        d.DepartmentName as departmentName,
        w.WarehouseName as warehouseName,
        IFNULL(summary.totalQuantity, 0) as totalQuantity
      FROM RawMaterialOutbound ro
      LEFT JOIN User u ON ro.OperatorUserID = u.UserID
      LEFT JOIN Department d ON ro.DepartmentID = d.DepartmentID
      LEFT JOIN Warehouse w ON ro.WarehouseID = w.WarehouseID
      LEFT JOIN (
        SELECT OutboundID, SUM(Quantity) as totalQuantity
        FROM RawMaterialOutboundDetail
        GROUP BY OutboundID
      ) summary ON ro.OutboundID = summary.OutboundID
      ${whereClause}
      ORDER BY ro.OutboundDate DESC, ro.OutboundID DESC
      LIMIT ? OFFSET ?
    `;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    const finalParams = [...queryParams, limit, offset];

    const results = await executeQuery(sql, finalParams);
    
    const formattedResults = results.map(item => ({
      ...item,
      outboundDate: formatDateTime(item.outboundDate),
      totalAmount: parseFloat(item.totalAmount) || 0,
      totalQuantity: parseFloat(item.totalQuantity) || 0
    }));

    res.json(successResponse({
      items: formattedResults,
      total,
      page: parseInt(page),
      pageSize: limit
    }));

  } catch (error) {
    console.error('获取出库单列表失败:', error);
    res.status(500).json(errorResponse('获取出库单列表失败'));
  }
});

// 3. 获取出库单详情
router.get('/api/outbound-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        ro.OutboundID as id,
        ro.OutboundNumber as outboundNo,
        ro.OutboundType as type,
        ro.OutboundDate as outboundDate,
        ro.Status as status,
        ro.TotalAmount as totalAmount,
        ro.Remarks as remarks,
        u.Username as operatorName,
        d.DepartmentName as departmentName,
        w.WarehouseName as warehouseName
      FROM RawMaterialOutbound ro
      LEFT JOIN User u ON ro.OperatorUserID = u.UserID
      LEFT JOIN Department d ON ro.DepartmentID = d.DepartmentID
      LEFT JOIN Warehouse w ON ro.WarehouseID = w.WarehouseID
      WHERE ro.OutboundID = ?
    `;
    
    const result = await executeQuery(sql, [id]);
    if (result.length === 0) {
      return res.status(404).json(errorResponse('出库单不存在', 404));
    }

    const detailsSql = `
      SELECT 
        rod.DetailID as id,
        rod.RawMaterialID as materialId,
        rm.MaterialCode as materialCode,
        rm.MaterialName as materialName,
        rm.Specification as specification,
        rm.Unit as unit,
        rod.LocationID as locationId,
        l.LocationCode as locationCode,
        rod.Quantity as quantity,
        rod.UnitPrice as unitPrice,
        rod.Amount as amount,
        rod.BatchNumber as batchNo,
        rod.Remarks as remarks
      FROM RawMaterialOutboundDetail rod
      JOIN RawMaterial rm ON rod.RawMaterialID = rm.MaterialID
      LEFT JOIN Location l ON rod.LocationID = l.LocationID
      WHERE rod.OutboundID = ?
    `;
    
    const details = await executeQuery(detailsSql, [id]);

    const data = {
      ...result[0],
      outboundDate: formatDateTime(result[0].outboundDate),
      totalAmount: parseFloat(result[0].totalAmount) || 0,
      details: details.map(d => ({
        ...d,
        quantity: parseFloat(d.quantity),
        unitPrice: parseFloat(d.unitPrice),
        amount: parseFloat(d.amount)
      }))
    };

    res.json(successResponse(data));
  } catch (error) {
    console.error('获取出库单详情失败:', error);
    res.status(500).json(errorResponse('获取详情失败'));
  }
});

// 4. 审核出库单 (扣减库存)
router.put('/api/outbound-orders/:id/audit', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: approve / reject

    const checkSql = 'SELECT * FROM RawMaterialOutbound WHERE OutboundID = ?';
    const checkResult = await executeQuery(checkSql, [id]);
    
    if (checkResult.length === 0) {
      return res.status(404).json(errorResponse('出库单不存在', 404));
    }

    const outbound = checkResult[0];
    if (outbound.Status !== 'Pending') {
      return res.status(400).json(errorResponse('只有待处理的出库单才能审核', 400));
    }

    if (action === 'reject') {
      await executeQuery(
        'UPDATE RawMaterialOutbound SET Status = ?, Remarks = ? WHERE OutboundID = ?',
        ['Rejected', outbound.Remarks + (reason ? ` [驳回原因: ${reason}]` : ''), id]
      );
      return res.json(successResponse(null, '出库单已驳回'));
    }

    if (action === 'approve') {
      // 获取明细
      const details = await executeQuery(
        'SELECT * FROM RawMaterialOutboundDetail WHERE OutboundID = ?',
        [id]
      );

      // 验证库存并扣减
      for (const item of details) {
        const inventoryCheck = await executeQuery(
          'SELECT * FROM Inventory WHERE MaterialID = ? AND WarehouseID = ? AND LocationID = ?',
          [item.RawMaterialID, outbound.WarehouseID, item.LocationID]
        );

        if (inventoryCheck.length === 0 || parseFloat(inventoryCheck[0].CurrentQuantity) < parseFloat(item.Quantity)) {
          return res.status(400).json(errorResponse(`库存不足，无法出库: 原料ID ${item.RawMaterialID}`));
        }

        // 扣减库存
        const newQty = parseFloat(inventoryCheck[0].CurrentQuantity) - parseFloat(item.Quantity);
        await executeQuery(
          'UPDATE Inventory SET CurrentQuantity = ?, AvailableQuantity = ?, LastOutboundDate = NOW() WHERE InventoryID = ?',
          [newQty, newQty, inventoryCheck[0].InventoryID]
        );

        // 记录事务
        await executeQuery(
          `INSERT INTO InventoryTransaction 
          (InventoryID, TransactionType, ReferenceType, ReferenceID, Quantity, RemainingQuantity, OperatorUserID, TransactionDate)
          VALUES (?, 'Outbound', 'RawMaterialOutbound', ?, ?, ?, ?, NOW())`,
          [inventoryCheck[0].InventoryID, id, -item.Quantity, newQty, req.user.id]
        );
      }

      await executeQuery(
        'UPDATE RawMaterialOutbound SET Status = ?, UpdatedAt = NOW() WHERE OutboundID = ?',
        ['Completed', id]
      );
      
      return res.json(successResponse(null, '出库单审核通过并已扣减库存'));
    }
    
    res.status(400).json(errorResponse('无效的审核操作'));

  } catch (error) {
    console.error('审核出库单失败:', error);
    res.status(500).json(errorResponse('审核出库单失败'));
  }
});

// 5. 撤销出库单
router.put('/api/outbound-orders/:id/revoke', async (req, res) => {
  try {
    const { id } = req.params;

    const checkSql = 'SELECT * FROM RawMaterialOutbound WHERE OutboundID = ?';
    const checkResult = await executeQuery(checkSql, [id]);
    
    if (checkResult.length === 0) {
      return res.status(404).json(errorResponse('出库单不存在', 404));
    }

    const outbound = checkResult[0];
    if (outbound.Status === 'Completed') {
      return res.status(400).json(errorResponse('已完成的出库单无法撤销', 400));
    }
    if (outbound.Status === 'Cancelled') {
      return res.status(400).json(errorResponse('出库单已被撤销', 400));
    }

    await executeQuery(
      'UPDATE RawMaterialOutbound SET Status = ?, UpdatedAt = NOW() WHERE OutboundID = ?',
      ['Cancelled', id]
    );

    res.json(successResponse(null, '出库单撤销成功'));
  } catch (error) {
    console.error('撤销出库单失败:', error);
    res.status(500).json(errorResponse('撤销出库单失败'));
  }
});

// 6. 删除出库单
router.delete('/api/outbound-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const checkSql = 'SELECT Status FROM RawMaterialOutbound WHERE OutboundID = ?';
    const checkResult = await executeQuery(checkSql, [id]);
    
    if (checkResult.length === 0) {
      return res.status(404).json(errorResponse('出库单不存在', 404));
    }

    if (checkResult[0].Status === 'Completed') {
      return res.status(400).json(errorResponse('已完成的出库单无法删除', 400));
    }

    await executeQuery('DELETE FROM RawMaterialOutbound WHERE OutboundID = ?', [id]);
    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('删除出库单失败:', error);
    res.status(500).json(errorResponse('删除出库单失败'));
  }
});


module.exports = router;
