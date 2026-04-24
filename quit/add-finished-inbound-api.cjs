const fs = require('fs');
const path = './server/index.js';
let code = fs.readFileSync(path, 'utf8');

const insertPos = code.indexOf('// ====================================\n// 原料出库管理接口');

const apis = `
// ====================================
// 成品入库管理接口
// ====================================

app.get('/api/finished-inbounds/options', async (req, res) => {
  try {
    const result = await executeQuery('SELECT DISTINCT InboundNumber as value, InboundNumber as label FROM FinishedProductInbound ORDER BY InboundNumber DESC');
    res.json(successResponse({ inboundNumbers: result }));
  } catch (error) {
    res.status(500).json(errorResponse('获取选项失败'));
  }
});

app.get('/api/finished-inbounds', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, inboundNo, status, startDate, endDate } = req.query;
    let whereConditions = [];
    let queryParams = [];

    if (inboundNo) {
      whereConditions.push('fi.InboundNumber LIKE ?');
      queryParams.push(\`%\${inboundNo}%\`);
    }
    if (status) {
      whereConditions.push('fi.Status = ?');
      queryParams.push(status);
    }
    if (startDate) {
      whereConditions.push('fi.InboundDate >= ?');
      queryParams.push(startDate);
    }
    if (endDate) {
      whereConditions.push('fi.InboundDate <= ?');
      queryParams.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const countSql = \`SELECT COUNT(*) as total FROM FinishedProductInbound fi \${whereClause}\`;
    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0].total;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    const sql = \`
      SELECT 
        fi.InboundID as id, fi.InboundNumber as inboundNo, fi.InboundDate as inboundDate,
        fi.Status as status, fi.Remarks as remarks, u.Username as operatorName,
        pf.FactoryName as factoryName, w.WarehouseName as warehouseName,
        IFNULL(summary.totalQuantity, 0) as totalQuantity
      FROM FinishedProductInbound fi
      LEFT JOIN User u ON fi.OperatorUserID = u.UserID
      LEFT JOIN ProcessingFactory pf ON fi.FactoryID = pf.FactoryID
      LEFT JOIN Warehouse w ON fi.WarehouseID = w.WarehouseID
      LEFT JOIN (
        SELECT InboundID, SUM(Quantity) as totalQuantity FROM FinishedProductInboundDetail GROUP BY InboundID
      ) summary ON fi.InboundID = summary.InboundID
      \${whereClause} ORDER BY fi.InboundDate DESC, fi.InboundID DESC LIMIT ? OFFSET ?
    \`;

    const results = await executeQuery(sql, [...queryParams, limit, offset]);
    const formattedResults = results.map(item => ({
      ...item, inboundDate: formatDateTime(item.inboundDate), totalQuantity: parseFloat(item.totalQuantity) || 0
    }));

    res.json(successResponse({ items: formattedResults, total, page: parseInt(page), pageSize: limit }));
  } catch (error) {
    res.status(500).json(errorResponse('获取成品入库列表失败'));
  }
});

app.get('/api/finished-inbounds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = \`
      SELECT 
        fi.InboundID as id, fi.InboundNumber as inboundNo, fi.InboundDate as inboundDate,
        fi.Status as status, fi.Remarks as remarks, u.Username as operatorName,
        pf.FactoryName as factoryName, w.WarehouseName as warehouseName
      FROM FinishedProductInbound fi
      LEFT JOIN User u ON fi.OperatorUserID = u.UserID
      LEFT JOIN ProcessingFactory pf ON fi.FactoryID = pf.FactoryID
      LEFT JOIN Warehouse w ON fi.WarehouseID = w.WarehouseID
      WHERE fi.InboundID = ?
    \`;
    const result = await executeQuery(sql, [id]);
    if (result.length === 0) return res.status(404).json(errorResponse('成品入库单不存在', 404));

    const detailsSql = \`
      SELECT 
        fid.DetailID as id, fp.ProductName as productName, fp.ProductCode as productCode,
        fp.Specification as specification, fid.Quantity as quantity, fp.Unit as unit,
        l.LocationCode as locationCode, fid.BatchNumber as batchNo, fid.QualityStatus as qualityStatus
      FROM FinishedProductInboundDetail fid
      JOIN FinishedProduct fp ON fid.FinishedProductID = fp.ProductID
      LEFT JOIN Location l ON fid.LocationID = l.LocationID
      WHERE fid.InboundID = ?
    \`;
    const details = await executeQuery(detailsSql, [id]);

    const data = {
      ...result[0],
      inboundDate: formatDateTime(result[0].inboundDate),
      details: details.map(d => ({ ...d, quantity: parseFloat(d.quantity) }))
    };

    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json(errorResponse('获取详情失败'));
  }
});

app.put('/api/finished-inbounds/:id/audit', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    const checkSql = 'SELECT * FROM FinishedProductInbound WHERE InboundID = ?';
    const checkResult = await executeQuery(checkSql, [id]);
    if (checkResult.length === 0) return res.status(404).json(errorResponse('入库单不存在', 404));

    const inbound = checkResult[0];
    if (inbound.Status !== 'Pending') return res.status(400).json(errorResponse('只有待处理的入库单才能审核', 400));

    if (action === 'reject') {
      await executeQuery(
        'UPDATE FinishedProductInbound SET Status = ?, Remarks = ? WHERE InboundID = ?',
        ['Rejected', inbound.Remarks + (reason ? \` [驳回原因: \${reason}]\` : ''), id]
      );
      return res.json(successResponse(null, '入库单已驳回'));
    }

    if (action === 'approve') {
      const details = await executeQuery('SELECT * FROM FinishedProductInboundDetail WHERE InboundID = ?', [id]);
      
      for (const item of details) {
        const inventoryCheck = await executeQuery(
          'SELECT * FROM Inventory WHERE FinishedProductID = ? AND WarehouseID = ? AND LocationID = ?',
          [item.FinishedProductID, inbound.WarehouseID, item.LocationID]
        );

        let newQty = parseFloat(item.Quantity);
        let invId;

        if (inventoryCheck.length > 0) {
          newQty += parseFloat(inventoryCheck[0].CurrentQuantity);
          invId = inventoryCheck[0].InventoryID;
          await executeQuery(
            'UPDATE Inventory SET CurrentQuantity = ?, AvailableQuantity = ?, LastInboundDate = NOW() WHERE InventoryID = ?',
            [newQty, newQty, invId]
          );
        } else {
          const insertInv = await executeQuery(
            \`INSERT INTO Inventory (FinishedProductID, WarehouseID, LocationID, CurrentQuantity, AvailableQuantity, LastInboundDate)
             VALUES (?, ?, ?, ?, ?, NOW())\`,
            [item.FinishedProductID, inbound.WarehouseID, item.LocationID, newQty, newQty]
          );
          invId = insertInv.insertId;
        }

        await executeQuery(
          \`INSERT INTO InventoryTransaction 
          (InventoryID, TransactionType, ReferenceType, ReferenceID, Quantity, RemainingQuantity, OperatorUserID, TransactionDate)
          VALUES (?, 'Inbound', 'FinishedProductInbound', ?, ?, ?, ?, NOW())\`,
          [invId, id, item.Quantity, newQty, req.user.id]
        );
      }

      await executeQuery('UPDATE FinishedProductInbound SET Status = ?, UpdatedAt = NOW() WHERE InboundID = ?', ['Completed', id]);
      return res.json(successResponse(null, '审核通过并增加库存'));
    }
    res.status(400).json(errorResponse('无效的审核操作'));
  } catch (error) {
    res.status(500).json(errorResponse('审核失败'));
  }
});

app.put('/api/finished-inbounds/:id/revoke', async (req, res) => {
  try {
    const { id } = req.params;
    const checkResult = await executeQuery('SELECT * FROM FinishedProductInbound WHERE InboundID = ?', [id]);
    if (checkResult.length === 0) return res.status(404).json(errorResponse('入库单不存在', 404));
    
    const inbound = checkResult[0];
    if (inbound.Status === 'Completed') return res.status(400).json(errorResponse('已完成的入库单无法撤销', 400));
    if (inbound.Status === 'Cancelled') return res.status(400).json(errorResponse('已被撤销', 400));

    await executeQuery('UPDATE FinishedProductInbound SET Status = ?, UpdatedAt = NOW() WHERE InboundID = ?', ['Cancelled', id]);
    res.json(successResponse(null, '撤销成功'));
  } catch (error) {
    res.status(500).json(errorResponse('撤销失败'));
  }
});

app.delete('/api/finished-inbounds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const checkResult = await executeQuery('SELECT Status FROM FinishedProductInbound WHERE InboundID = ?', [id]);
    if (checkResult.length === 0) return res.status(404).json(errorResponse('不存在', 404));
    if (checkResult[0].Status === 'Completed') return res.status(400).json(errorResponse('已完成的无法删除', 400));

    await executeQuery('DELETE FROM FinishedProductInbound WHERE InboundID = ?', [id]);
    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    res.status(500).json(errorResponse('删除失败'));
  }
});

// ====================================
// 成品出库管理接口
// ====================================

app.get('/api/finished-outbounds/options', async (req, res) => {
  try {
    const result = await executeQuery('SELECT DISTINCT OutboundNumber as value, OutboundNumber as label FROM FinishedProductOutbound ORDER BY OutboundNumber DESC');
    res.json(successResponse({ outboundNumbers: result }));
  } catch (error) {
    res.status(500).json(errorResponse('获取选项失败'));
  }
});

app.get('/api/finished-outbounds', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, outboundNo, status, startDate, endDate } = req.query;
    let whereConditions = [];
    let queryParams = [];

    if (outboundNo) {
      whereConditions.push('fo.OutboundNumber LIKE ?');
      queryParams.push(\`%\${outboundNo}%\`);
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
    const countSql = \`SELECT COUNT(*) as total FROM FinishedProductOutbound fo \${whereClause}\`;
    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0].total;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    const sql = \`
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
      \${whereClause} ORDER BY fo.OutboundDate DESC, fo.OutboundID DESC LIMIT ? OFFSET ?
    \`;

    const results = await executeQuery(sql, [...queryParams, limit, offset]);
    const formattedResults = results.map(item => ({
      ...item, outboundDate: formatDateTime(item.outboundDate), totalQuantity: parseFloat(item.totalQuantity) || 0
    }));

    res.json(successResponse({ items: formattedResults, total, page: parseInt(page), pageSize: limit }));
  } catch (error) {
    res.status(500).json(errorResponse('获取成品出库列表失败'));
  }
});

app.get('/api/finished-outbounds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = \`
      SELECT 
        fo.OutboundID as id, fo.OutboundNumber as outboundNo, fo.OutboundDate as outboundDate, fo.OutboundType as type,
        fo.Status as status, fo.Remarks as remarks, u.Username as operatorName, fo.OrderNumber as orderNumber,
        c.CustomerName as customerName, w.WarehouseName as warehouseName
      FROM FinishedProductOutbound fo
      LEFT JOIN User u ON fo.OperatorUserID = u.UserID
      LEFT JOIN Customer c ON fo.CustomerID = c.CustomerID
      LEFT JOIN Warehouse w ON fo.WarehouseID = w.WarehouseID
      WHERE fo.OutboundID = ?
    \`;
    const result = await executeQuery(sql, [id]);
    if (result.length === 0) return res.status(404).json(errorResponse('出库单不存在', 404));

    const detailsSql = \`
      SELECT 
        fod.DetailID as id, fp.ProductName as productName, fp.ProductCode as productCode,
        fp.Specification as specification, fod.Quantity as quantity, fp.Unit as unit,
        l.LocationCode as locationCode, fod.BatchNumber as batchNo
      FROM FinishedProductOutboundDetail fod
      JOIN FinishedProduct fp ON fod.FinishedProductID = fp.ProductID
      LEFT JOIN Location l ON fod.LocationID = l.LocationID
      WHERE fod.OutboundID = ?
    \`;
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

app.put('/api/finished-outbounds/:id/audit', async (req, res) => {
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
        ['Rejected', outbound.Remarks + (reason ? \` [驳回原因: \${reason}]\` : ''), id]
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
          return res.status(400).json(errorResponse(\`成品库存不足: 成品ID \${item.FinishedProductID}\`));
        }

        const newQty = parseFloat(inventoryCheck[0].CurrentQuantity) - parseFloat(item.Quantity);
        await executeQuery(
          'UPDATE Inventory SET CurrentQuantity = ?, AvailableQuantity = ?, LastOutboundDate = NOW() WHERE InventoryID = ?',
          [newQty, newQty, inventoryCheck[0].InventoryID]
        );

        await executeQuery(
          \`INSERT INTO InventoryTransaction 
          (InventoryID, TransactionType, ReferenceType, ReferenceID, Quantity, RemainingQuantity, OperatorUserID, TransactionDate)
          VALUES (?, 'Outbound', 'FinishedProductOutbound', ?, ?, ?, ?, NOW())\`,
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

app.put('/api/finished-outbounds/:id/revoke', async (req, res) => {
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

app.delete('/api/finished-outbounds/:id', async (req, res) => {
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

`;

if (insertPos !== -1) {
  code = code.substring(0, insertPos) + apis + code.substring(insertPos);
  fs.writeFileSync(path, code);
  console.log('Finished Product APIs injected!');
} else {
  console.log('Insert position not found');
}
