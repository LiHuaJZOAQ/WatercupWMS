const fs = require('fs');
const path = './server/index.js';
let code = fs.readFileSync(path, 'utf8');

const insertPos = code.indexOf('// 1. 获取库位列表（重写版本）');

const stocktakingApis = `
// ====================================
// 盘点管理接口
// ====================================

app.get('/api/stocktaking', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, stocktakingNo, type, status, itemType } = req.query;
    let whereConditions = [];
    let queryParams = [];

    if (stocktakingNo) {
      whereConditions.push('s.StocktakingNumber LIKE ?');
      queryParams.push(\`%\${stocktakingNo}%\`);
    }
    if (type) {
      whereConditions.push('s.StocktakingType = ?');
      queryParams.push(type);
    }
    if (status) {
      whereConditions.push('s.Status = ?');
      queryParams.push(status);
    }
    if (itemType) {
      whereConditions.push('EXISTS (SELECT 1 FROM StocktakingDetail sd WHERE sd.StocktakingID = s.StocktakingID AND sd.ItemType = ?)');
      queryParams.push(itemType);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const countSql = \`SELECT COUNT(*) as total FROM Stocktaking s \${whereClause}\`;
    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0].total;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    const sql = \`
      SELECT 
        s.StocktakingID as id, s.StocktakingNumber as stocktakingNo, s.StocktakingType as type,
        s.StocktakingDate as stocktakingDate, s.Status as status, s.Remarks as remarks,
        u.Username as operatorName, w.WarehouseName as warehouseName
      FROM Stocktaking s
      LEFT JOIN User u ON s.OperatorUserID = u.UserID
      LEFT JOIN Warehouse w ON s.WarehouseID = w.WarehouseID
      \${whereClause} ORDER BY s.StocktakingDate DESC, s.StocktakingID DESC LIMIT ? OFFSET ?
    \`;

    const results = await executeQuery(sql, [...queryParams, limit, offset]);
    const formattedResults = results.map(item => ({
      ...item, stocktakingDate: formatDateTime(item.stocktakingDate)
    }));

    res.json(successResponse({ items: formattedResults, total, page: parseInt(page), pageSize: limit }));
  } catch (error) {
    res.status(500).json(errorResponse('获取盘点列表失败'));
  }
});

app.get('/api/stocktaking/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = \`
      SELECT 
        s.StocktakingID as id, s.StocktakingNumber as stocktakingNo, s.StocktakingType as type,
        s.StocktakingDate as stocktakingDate, s.Status as status, s.Remarks as remarks,
        u.Username as operatorName, w.WarehouseName as warehouseName
      FROM Stocktaking s
      LEFT JOIN User u ON s.OperatorUserID = u.UserID
      LEFT JOIN Warehouse w ON s.WarehouseID = w.WarehouseID
      WHERE s.StocktakingID = ?
    \`;
    const result = await executeQuery(sql, [id]);
    if (result.length === 0) return res.status(404).json(errorResponse('盘点单不存在', 404));

    const detailsSql = \`
      SELECT 
        sd.DetailID as id, sd.ItemType as itemType, sd.ItemID as itemId,
        sd.SystemQuantity as systemQuantity, sd.ActualQuantity as actualQuantity, sd.DifferenceQuantity as difference,
        l.LocationCode as locationCode, sd.BatchNumber as batchNo, sd.Remarks as remarks,
        CASE 
          WHEN sd.ItemType = 'RawMaterial' THEN rm.MaterialName
          WHEN sd.ItemType = 'FinishedProduct' THEN fp.ProductName
        END as itemName,
        CASE 
          WHEN sd.ItemType = 'RawMaterial' THEN rm.MaterialCode
          WHEN sd.ItemType = 'FinishedProduct' THEN fp.ProductCode
        END as itemCode
      FROM StocktakingDetail sd
      LEFT JOIN Location l ON sd.LocationID = l.LocationID
      LEFT JOIN RawMaterial rm ON sd.ItemType = 'RawMaterial' AND sd.ItemID = rm.MaterialID
      LEFT JOIN FinishedProduct fp ON sd.ItemType = 'FinishedProduct' AND sd.ItemID = fp.ProductID
      WHERE sd.StocktakingID = ?
    \`;
    const details = await executeQuery(detailsSql, [id]);

    const data = {
      ...result[0],
      stocktakingDate: formatDateTime(result[0].stocktakingDate),
      details: details.map(d => ({ 
        ...d, 
        systemQuantity: parseFloat(d.systemQuantity),
        actualQuantity: parseFloat(d.actualQuantity),
        difference: parseFloat(d.difference)
      }))
    };

    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json(errorResponse('获取盘点详情失败'));
  }
});

app.put('/api/stocktaking/:id/audit', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    const checkSql = 'SELECT * FROM Stocktaking WHERE StocktakingID = ?';
    const checkResult = await executeQuery(checkSql, [id]);
    if (checkResult.length === 0) return res.status(404).json(errorResponse('盘点单不存在', 404));

    const stocktaking = checkResult[0];
    if (stocktaking.Status !== 'Pending' && stocktaking.Status !== 'Processing') {
      return res.status(400).json(errorResponse('只有待处理或处理中的盘点单才能审核', 400));
    }

    if (action === 'reject') {
      await executeQuery(
        'UPDATE Stocktaking SET Status = ?, Remarks = ? WHERE StocktakingID = ?',
        ['Rejected', stocktaking.Remarks + (reason ? \` [驳回原因: \${reason}]\` : ''), id]
      );
      return res.json(successResponse(null, '盘点单已驳回'));
    }

    if (action === 'approve') {
      const details = await executeQuery('SELECT * FROM StocktakingDetail WHERE StocktakingID = ?', [id]);
      
      for (const item of details) {
        if (parseFloat(item.DifferenceQuantity) !== 0) {
          // 更新库存
          const invField = item.ItemType === 'RawMaterial' ? 'MaterialID' : 'FinishedProductID';
          
          const inventoryCheck = await executeQuery(
            \`SELECT * FROM Inventory WHERE \${invField} = ? AND WarehouseID = ? AND LocationID = ?\`,
            [item.ItemID, stocktaking.WarehouseID, item.LocationID]
          );

          if (inventoryCheck.length > 0) {
            const invId = inventoryCheck[0].InventoryID;
            const newQty = parseFloat(item.ActualQuantity);
            await executeQuery(
              'UPDATE Inventory SET CurrentQuantity = ?, AvailableQuantity = ? WHERE InventoryID = ?',
              [newQty, newQty, invId]
            );

            // 记录流水
            await executeQuery(
              \`INSERT INTO InventoryTransaction 
              (InventoryID, TransactionType, ReferenceType, ReferenceID, Quantity, RemainingQuantity, OperatorUserID, TransactionDate)
              VALUES (?, 'Stocktaking', 'Stocktaking', ?, ?, ?, ?, NOW())\`,
              [invId, id, parseFloat(item.DifferenceQuantity), newQty, req.user.id]
            );
          } else if (parseFloat(item.ActualQuantity) > 0) {
            // 没有库存但盘点出来有数量 (盘盈)
            const insertInv = await executeQuery(
              \`INSERT INTO Inventory (\${invField}, WarehouseID, LocationID, CurrentQuantity, AvailableQuantity)
               VALUES (?, ?, ?, ?, ?)\`,
              [item.ItemID, stocktaking.WarehouseID, item.LocationID, item.ActualQuantity, item.ActualQuantity]
            );
            const invId = insertInv.insertId;

            await executeQuery(
              \`INSERT INTO InventoryTransaction 
              (InventoryID, TransactionType, ReferenceType, ReferenceID, Quantity, RemainingQuantity, OperatorUserID, TransactionDate)
              VALUES (?, 'Stocktaking', 'Stocktaking', ?, ?, ?, ?, NOW())\`,
              [invId, id, item.ActualQuantity, item.ActualQuantity, req.user.id]
            );
          }
        }
      }

      await executeQuery('UPDATE Stocktaking SET Status = ?, UpdatedAt = NOW() WHERE StocktakingID = ?', ['Completed', id]);
      return res.json(successResponse(null, '盘点审核通过，库存已更新'));
    }
    res.status(400).json(errorResponse('无效的审核操作'));
  } catch (error) {
    res.status(500).json(errorResponse('审核失败'));
  }
});

app.delete('/api/stocktaking/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const checkResult = await executeQuery('SELECT Status FROM Stocktaking WHERE StocktakingID = ?', [id]);
    if (checkResult.length === 0) return res.status(404).json(errorResponse('不存在', 404));
    if (checkResult[0].Status === 'Completed') return res.status(400).json(errorResponse('已完成的无法删除', 400));

    await executeQuery('DELETE FROM Stocktaking WHERE StocktakingID = ?', [id]);
    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    res.status(500).json(errorResponse('删除失败'));
  }
});

`;

if (insertPos !== -1) {
  code = code.substring(0, insertPos) + stocktakingApis + code.substring(insertPos);
  fs.writeFileSync(path, code);
  console.log('Stocktaking APIs injected!');
} else {
  console.log('Insert position not found');
}
