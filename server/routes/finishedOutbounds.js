const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { createResponse, successResponse, errorResponse, formatDateTime, validateRequired, executeQuery, executeTransaction } = require('../utils');

// ====================================
// 成品出库管理接口
// ====================================

router.get('/finished-outbounds/options', async (req, res) => {
  try {
    const result = await executeQuery('SELECT DISTINCT OutboundNumber as value, OutboundNumber as label FROM FinishedProductOutbound ORDER BY OutboundNumber DESC');
    res.json(successResponse({ outboundNumbers: result }));
  } catch (error) {
    res.status(500).json(errorResponse('获取选项失败'));
  }
});

router.get('/finished-outbounds', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, outboundNo, status, startDate, endDate } = req.query;
    let whereConditions = [];
    let queryParams = [];

    if (outboundNo) {
      whereConditions.push('fo.OutboundNumber LIKE ?');
      queryParams.push(`%${outboundNo}%`);
    }
    if (status) {
      whereConditions.push('fo.Status = ?');
      queryParams.push(status);
    }
    if (startDate) {
      whereConditions.push('fo.OutboundDate >= ?');
      queryParams.push(startDate);
    }
    if (endDate) {
      whereConditions.push('fo.OutboundDate <= ?');
      queryParams.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const countSql = `SELECT COUNT(*) as total FROM FinishedProductOutbound fo ${whereClause}`;
    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0].total;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    const sql = `
      SELECT 
        fo.OutboundID as id, fo.OutboundNumber as outboundNo, fo.OutboundDate as outboundDate,
        fo.Status as status, fo.Remarks as remarks, u.Username as operatorName, fo.OutboundType as type,
        c.CustomerName as customerName, w.WarehouseName as warehouseName,
        IFNULL(summary.totalQuantity, 0) as totalQuantity
      FROM FinishedProductOutbound fo
      LEFT JOIN User u ON fo.OperatorUserID = u.UserID
      LEFT JOIN Customer c ON fo.CustomerID = c.CustomerID
      LEFT JOIN Warehouse w ON fo.WarehouseID = w.WarehouseID
      LEFT JOIN (
        SELECT OutboundID, SUM(Quantity) as totalQuantity FROM FinishedProductOutboundDetail GROUP BY OutboundID
      ) summary ON fo.OutboundID = summary.OutboundID
      ${whereClause} ORDER BY fo.OutboundDate DESC, fo.OutboundID DESC LIMIT ? OFFSET ?
    `;

    const results = await executeQuery(sql, [...queryParams, limit, offset]);
    const formattedResults = results.map(item => ({
      ...item, outboundDate: formatDateTime(item.outboundDate), totalQuantity: parseFloat(item.totalQuantity) || 0
    }));

    res.json(successResponse({ items: formattedResults, total, page: parseInt(page), pageSize: limit }));
  } catch (error) {
    res.status(500).json(errorResponse('获取成品出库列表失败'));
  }
});

router.get('/finished-outbounds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        fo.OutboundID as id, fo.OutboundNumber as outboundNo, fo.OutboundDate as outboundDate, fo.OutboundType as type,
        fo.Status as status, fo.Remarks as remarks, u.Username as operatorName, fo.OrderNumber as orderNumber,
        c.CustomerName as customerName, w.WarehouseName as warehouseName
      FROM FinishedProductOutbound fo
      LEFT JOIN User u ON fo.OperatorUserID = u.UserID
      LEFT JOIN Customer c ON fo.CustomerID = c.CustomerID
      LEFT JOIN Warehouse w ON fo.WarehouseID = w.WarehouseID
      WHERE fo.OutboundID = ?
    `;
    const result = await executeQuery(sql, [id]);
    if (result.length === 0) return res.status(404).json(errorResponse('出库单不存在', 404));

    const detailsSql = `
      SELECT 
        fod.DetailID as id, fp.ProductName as productName, fp.ProductCode as productCode,
        fp.Specification as specification, fod.Quantity as quantity, fp.Unit as unit,
        l.LocationCode as locationCode, fod.BatchNumber as batchNo
      FROM FinishedProductOutboundDetail fod
      JOIN FinishedProduct fp ON fod.FinishedProductID = fp.ProductID
      LEFT JOIN Location l ON fod.LocationID = l.LocationID
      WHERE fod.OutboundID = ?
    `;
    const details = await executeQuery(detailsSql, [id]);

    const data = {
      ...result[0],
      outboundDate: formatDateTime(result[0].outboundDate),
      details: details.map(d => ({ ...d, quantity: parseFloat(d.quantity) }))
    };

    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json(errorResponse('获取详情失败'));
  }
});

router.put('/finished-outbounds/:id/audit', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    const checkSql = 'SELECT * FROM FinishedProductOutbound WHERE OutboundID = ?';
    const checkResult = await executeQuery(checkSql, [id]);
    if (checkResult.length === 0) return res.status(404).json(errorResponse('出库单不存在', 404));

    const outbound = checkResult[0];
    if (outbound.Status !== 'Pending') return res.status(400).json(errorResponse('只有待处理的出库单才能审核', 400));

    if (action === 'reject') {
      await executeQuery(
        'UPDATE FinishedProductOutbound SET Status = ?, Remarks = ? WHERE OutboundID = ?',
        ['Rejected', outbound.Remarks + (reason ? ` [驳回原因: ${reason}]` : ''), id]
      );
      return res.json(successResponse(null, '出库单已驳回'));
    }

    if (action === 'approve') {
      const details = await executeQuery('SELECT * FROM FinishedProductOutboundDetail WHERE OutboundID = ?', [id]);
      
      for (const item of details) {
        const inventoryCheck = await executeQuery(
          'SELECT * FROM Inventory WHERE FinishedProductID = ? AND WarehouseID = ? AND LocationID = ?',
          [item.FinishedProductID, outbound.WarehouseID, item.LocationID]
        );

        if (inventoryCheck.length === 0 || parseFloat(inventoryCheck[0].CurrentQuantity) < parseFloat(item.Quantity)) {
          return res.status(400).json(errorResponse(`成品库存不足: 成品ID ${item.FinishedProductID}`));
        }

        const newQty = parseFloat(inventoryCheck[0].CurrentQuantity) - parseFloat(item.Quantity);
        await executeQuery(
          'UPDATE Inventory SET CurrentQuantity = ?, AvailableQuantity = ?, LastOutboundDate = NOW() WHERE InventoryID = ?',
          [newQty, newQty, inventoryCheck[0].InventoryID]
        );

        await executeQuery(
          `INSERT INTO InventoryTransaction 
          (InventoryID, TransactionType, ReferenceType, ReferenceID, Quantity, RemainingQuantity, OperatorUserID, TransactionDate)
          VALUES (?, 'Outbound', 'FinishedProductOutbound', ?, ?, ?, ?, NOW())`,
          [inventoryCheck[0].InventoryID, id, -item.Quantity, newQty, req.user.id]
        );
      }

      await executeQuery('UPDATE FinishedProductOutbound SET Status = ?, UpdatedAt = NOW() WHERE OutboundID = ?', ['Completed', id]);
      return res.json(successResponse(null, '审核通过并扣减库存'));
    }
    res.status(400).json(errorResponse('无效的审核操作'));
  } catch (error) {
    res.status(500).json(errorResponse('审核失败'));
  }
});

router.put('/finished-outbounds/:id/revoke', async (req, res) => {
  try {
    const { id } = req.params;
    const checkResult = await executeQuery('SELECT * FROM FinishedProductOutbound WHERE OutboundID = ?', [id]);
    if (checkResult.length === 0) return res.status(404).json(errorResponse('不存在', 404));
    
    const outbound = checkResult[0];
    if (outbound.Status === 'Completed') return res.status(400).json(errorResponse('已完成的无法撤销', 400));
    if (outbound.Status === 'Cancelled') return res.status(400).json(errorResponse('已被撤销', 400));

    await executeQuery('UPDATE FinishedProductOutbound SET Status = ?, UpdatedAt = NOW() WHERE OutboundID = ?', ['Cancelled', id]);
    res.json(successResponse(null, '撤销成功'));
  } catch (error) {
    res.status(500).json(errorResponse('撤销失败'));
  }
});

router.delete('/finished-outbounds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const checkResult = await executeQuery('SELECT Status FROM FinishedProductOutbound WHERE OutboundID = ?', [id]);
    if (checkResult.length === 0) return res.status(404).json(errorResponse('不存在', 404));
    if (checkResult[0].Status === 'Completed') return res.status(400).json(errorResponse('已完成的无法删除', 400));

    await executeQuery('DELETE FROM FinishedProductOutbound WHERE OutboundID = ?', [id]);
    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    res.status(500).json(errorResponse('删除失败'));
  }
});


module.exports = router;
