  console.log('【原料仓位管理API】');
  console.log('- GET    /api/locations/raw-materials      - 获取仓位列表');
  console.log('- POST   /api/locations/raw-materials      - 新增仓位');
  console.log('- PUT    /api/locations/raw-materials/:id  - 更新仓位信息');
  console.log('- DELETE /api/locations/raw-materials/:id  - 删除单个仓位');
  console.log('- DELETE /api/locations/raw-materials      - 批量删除仓位');
  console.log('- GET    /api/locations/raw-materials/options - 获取原料选项');
// ====================================
// 原料仓位管理接口
// ====================================

// 1. 获取原料仓位列表
app.get('/api/locations/raw-materials',  async (req, res) => {
  try {
    console.log('获取原料仓位列表 - 参数:', req.query);
    
    const {
      page = 1,
      pageSize = 20,
      materialName,
      locationCode
    } = req.query;

    // 参数验证
    const pageNum = parseInt(page);
    const size = parseInt(pageSize);
    if (pageNum < 1 || size < 1 || size > 1000) {
      return res.status(400).json(errorResponse('分页参数无效', 400));
    }

    // 构建查询条件
    let whereConditions = ['1 = 1'];
    let queryParams = [];

    // 原料名称搜索
    if (materialName && materialName.trim()) {
      whereConditions.push('rm.MaterialName LIKE ?');
      queryParams.push(`%${materialName.trim()}%`);
    }

    // 仓位编号搜索
    if (locationCode && locationCode.trim()) {
      whereConditions.push('l.LocationID LIKE ?');
      queryParams.push(`%${locationCode.trim()}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询总记录数
    const countSql = `
      SELECT COUNT(*) as total
      FROM Inventory i
      JOIN RawMaterial rm ON i.ItemID = rm.MaterialID
      JOIN Location l ON i.LocationID = l.LocationID
      WHERE i.ItemType = 'RawMaterial' AND ${whereClause}
    `;

    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0]?.total || 0;

    // 查询列表数据
    const offset = (pageNum - 1) * size;
    const listSql = `
      SELECT 
        i.InventoryID as id,
        rm.MaterialID as materialId,
        rm.MaterialCode as materialCode,
        rm.MaterialName as materialName,
        rm.Specification as specification,
        l.LocationID as locationCode,
        l.LocationName as locationName,
        i.CurrentQuantity as quantity,
        rm.Unit as unit,
        CASE WHEN l.Status = 1 THEN '1' ELSE '0' END as status,
        COALESCE(i.BatchNumber, '') as remark,
        i.CreatedAt
      FROM Inventory i
      JOIN RawMaterial rm ON i.ItemID = rm.MaterialID
      JOIN Location l ON i.LocationID = l.LocationID
      WHERE i.ItemType = 'RawMaterial' AND ${whereClause}
      ORDER BY i.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;

    const listParams = [...queryParams, size, offset];
    const listResult = await executeQuery(listSql, listParams);

    // 格式化返回数据
    const list = listResult.map(item => ({
      ...item,
      quantity: parseFloat(item.quantity) || 0,
      CreatedAt: formatDateTime(item.CreatedAt)
    }));

    const response = {
      list: list,
      total: total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size)
    };

    console.log(`获取原料仓位列表 - 成功, 共${total}条记录`);
    res.json(response);

  } catch (error) {
    console.error('获取原料仓位列表失败:', error);
    res.status(500).json(errorResponse('获取原料仓位列表失败'));
  }
});

// 2. 新增原料仓位
app.post('/api/locations/raw-materials',  async (req, res) => {
  try {
    console.log('新增原料仓位 - 参数:', req.body);
    
    const {
      materialId,
      locationCode,
      locationName,
      quantity,
      status,
      remark
    } = req.body;

    // 参数验证
    const validation = validateRequired({ materialId, locationCode, locationName, quantity }, 
      ['materialId', 'locationCode', 'locationName', 'quantity']);
    if (validation) {
      return res.status(400).json(errorResponse(validation, 400));
    }

    if (isNaN(quantity) || quantity < 0) {
      return res.status(400).json(errorResponse('数量必须为非负数', 400));
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 检查原料是否存在
      const [materialCheck] = await connection.execute(
        'SELECT MaterialID, MaterialName FROM RawMaterial WHERE MaterialID = ? AND Status = 1',
        [materialId]
      );

      if (materialCheck.length === 0) {
        throw new Error('原料不存在或已禁用');
      }

      // 检查库位是否已存在
      const [locationCheck] = await connection.execute(
        'SELECT LocationID FROM Location WHERE LocationID = ?',
        [locationCode]
      );

      let needCreateLocation = locationCheck.length === 0;

      // 如果库位不存在，创建库位
      if (needCreateLocation) {
        // 获取默认仓库ID
        const [defaultWarehouse] = await connection.execute(
          'SELECT WarehouseID FROM Warehouse WHERE Status = 1 ORDER BY WarehouseID LIMIT 1'
        );

        if (defaultWarehouse.length === 0) {
          throw new Error('没有可用的仓库');
        }

        await connection.execute(
          `INSERT INTO Location 
           (LocationID, WarehouseID, LocationName, LocationType, Capacity, Status) 
           VALUES (?, ?, ?, 'Raw', 1000, ?)`,
          [locationCode, defaultWarehouse[0].WarehouseID, locationName, status || 1]
        );
      }

      // 检查是否已存在该原料在该库位的库存记录
      const [inventoryCheck] = await connection.execute(
        'SELECT InventoryID FROM Inventory WHERE ItemType = "RawMaterial" AND ItemID = ? AND LocationID = ?',
        [materialId, locationCode]
      );

      if (inventoryCheck.length > 0) {
        throw new Error('该原料在此库位已有库存记录');
      }

      // 创建库存记录
      const [inventoryResult] = await connection.execute(
        `INSERT INTO Inventory 
         (ItemType, ItemID, LocationID, BatchNumber, CurrentQuantity, AvailableQuantity, LastInboundDate) 
         VALUES ('RawMaterial', ?, ?, ?, ?, ?, NOW())`,
        [materialId, locationCode, remark || '', quantity, quantity]
      );

      // 记录库存变动
      await connection.execute(
        `INSERT INTO InventoryTransaction 
         (InventoryID, TransactionType, QuantityBefore, QuantityChange, QuantityAfter, 
          TransactionDate, OperatorUserID, Remarks) 
         VALUES (?, 'Adjust', 0, ?, ?, NOW(), ?, ?)`,
        [inventoryResult.insertId, quantity, quantity, req.user.id, '新增仓位初始化库存']
      );

      await connection.commit();

      const result = {
        id: inventoryResult.insertId,
        materialId,
        locationCode,
        locationName,
        quantity: parseFloat(quantity)
      };

      console.log('新增原料仓位 - 成功:', result);
      res.status(201).json(successResponse(result, '仓位新增成功'));

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('新增原料仓位失败:', error);
    res.status(500).json(errorResponse(error.message || '新增原料仓位失败'));
  }
});

// 3. 更新原料仓位
app.put('/api/locations/raw-materials/:id',  async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`更新原料仓位 - ID: ${id}`, req.body);

    if (!id || isNaN(id)) {
      return res.status(400).json(errorResponse('记录ID无效', 400));
    }

    const {
      materialId,
      locationCode,
      locationName,
      quantity,
      status,
      remark
    } = req.body;

    // 参数验证
    const validation = validateRequired({ materialId, locationCode, locationName, quantity }, 
      ['materialId', 'locationCode', 'locationName', 'quantity']);
    if (validation) {
      return res.status(400).json(errorResponse(validation, 400));
    }

    if (isNaN(quantity) || quantity < 0) {
      return res.status(400).json(errorResponse('数量必须为非负数', 400));
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 检查库存记录是否存在
      const [inventoryCheck] = await connection.execute(
        'SELECT InventoryID, CurrentQuantity, LocationID FROM Inventory WHERE InventoryID = ?',
        [id]
      );

      if (inventoryCheck.length === 0) {
        throw new Error('仓位记录不存在');
      }

      const currentInventory = inventoryCheck[0];
      const oldQuantity = parseFloat(currentInventory.CurrentQuantity);
      const newQuantity = parseFloat(quantity);
      const quantityChange = newQuantity - oldQuantity;

      // 更新库存记录
      await connection.execute(
        `UPDATE Inventory 
         SET ItemID = ?, LocationID = ?, BatchNumber = ?, 
             CurrentQuantity = ?, AvailableQuantity = ?, UpdatedAt = NOW()
         WHERE InventoryID = ?`,
        [materialId, locationCode, remark || '', newQuantity, newQuantity, id]
      );

      // 更新库位信息
      await connection.execute(
        'UPDATE Location SET LocationName = ?, Status = ? WHERE LocationID = ?',
        [locationName, status || 1, locationCode]
      );

      // 记录库存变动（如果数量有变化）
      if (quantityChange !== 0) {
        await connection.execute(
          `INSERT INTO InventoryTransaction 
           (InventoryID, TransactionType, QuantityBefore, QuantityChange, QuantityAfter, 
            TransactionDate, OperatorUserID, Remarks) 
           VALUES (?, 'Adjust', ?, ?, ?, NOW(), ?, ?)`,
          [id, oldQuantity, quantityChange, newQuantity, req.user.id, '仓位信息更新']
        );
      }

      await connection.commit();

      const result = {
        id: parseInt(id),
        materialId,
        locationCode,
        locationName,
        quantity: newQuantity
      };

      console.log('更新原料仓位 - 成功:', result);
      res.json(successResponse(result, '仓位更新成功'));

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('更新原料仓位失败:', error);
    res.status(500).json(errorResponse(error.message || '更新原料仓位失败'));
  }
});

// 4. 删除原料仓位
app.delete('/api/locations/raw-materials/:id',  async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`删除原料仓位 - ID: ${id}`);

    if (!id || isNaN(id)) {
      return res.status(400).json(errorResponse('记录ID无效', 400));
    }

    // 检查库存记录是否存在
    const checkResult = await executeQuery(
      'SELECT InventoryID, CurrentQuantity FROM Inventory WHERE InventoryID = ?',
      [id]
    );

    if (checkResult.length === 0) {
      return res.status(404).json(errorResponse('仓位记录不存在', 404));
    }

    if (parseFloat(checkResult[0].CurrentQuantity) > 0) {
      return res.status(400).json(errorResponse('仓位仍有库存，无法删除', 400));
    }

    // 删除库存记录
    await executeQuery('DELETE FROM Inventory WHERE InventoryID = ?', [id]);

    console.log(`删除原料仓位 - 成功: ID ${id}`);
    res.json(successResponse(null, '仓位删除成功'));

  } catch (error) {
    console.error('删除原料仓位失败:', error);
    res.status(500).json(errorResponse('删除原料仓位失败'));
  }
});

// 5. 批量删除原料仓位
app.delete('/api/locations/raw-materials',  async (req, res) => {
  try {
    const { ids } = req.body;
    console.log('批量删除原料仓位 - IDs:', ids);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(errorResponse('请选择要删除的记录', 400));
    }

    let successCount = 0;
    let failCount = 0;
    const failDetails = [];

    for (const id of ids) {
      try {
        // 检查库存
        const checkResult = await executeQuery(
          'SELECT InventoryID, CurrentQuantity FROM Inventory WHERE InventoryID = ?',
          [id]
        );

        if (checkResult.length === 0) {
          failCount++;
          failDetails.push(`记录ID ${id} 不存在`);
          continue;
        }

        if (parseFloat(checkResult[0].CurrentQuantity) > 0) {
          failCount++;
          failDetails.push(`记录ID ${id} 仍有库存，无法删除`);
          continue;
        }

        // 删除记录
        await executeQuery('DELETE FROM Inventory WHERE InventoryID = ?', [id]);
        successCount++;

      } catch (error) {
        failCount++;
        failDetails.push(`记录ID ${id} 删除失败: ${error.message}`);
      }
    }

    const result = {
      successCount,
      failCount,
      details: failDetails
    };

    const message = `批量删除完成: 成功${successCount}个，失败${failCount}个`;
    console.log('批量删除原料仓位 - 完成:', result);
    
    res.json(successResponse(result, message));

  } catch (error) {
    console.error('批量删除原料仓位失败:', error);
    res.status(500).json(errorResponse('批量删除原料仓位失败'));
  }
});

// 6. 获取原料选项列表（用于新增/编辑）
app.get('/api/locations/raw-materials/options',  async (req, res) => {
  try {
    console.log('获取原料选项列表');

    // 获取原料列表
    const materialsResult = await executeQuery(`
      SELECT 
        MaterialID as id,
        MaterialCode as code,
        MaterialName as name,
        Unit as unit
      FROM RawMaterial 
      WHERE Status = 1 
      ORDER BY MaterialName
    `);

    const materials = materialsResult.map(item => ({
      id: item.id,
      code: item.code,
      name: item.name,
      unit: item.unit
    }));

    console.log(`获取原料选项列表 - 成功, 共${materials.length}条记录`);
    res.json(successResponse(materials));

  } catch (error) {
    console.error('获取原料选项列表失败:', error);
    res.status(500).json(errorResponse('获取原料选项列表失败'));
  }
});

// ====================================
// 通用认证中间件（如果未定义）
// ====================================

// 验证Token中间件（如果之前没有定义）
// if (typeof authenticateToken === 'undefined') {
//   const authenticateToken = (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];
    
//     if (!token) {
//       return res.status(401).json(errorResponse('未提供认证令牌', 401));
//     }

//     verify(token, JWT_SECRET, (err, user) => {
//       if (err) {
//         return res.status(403).json(errorResponse('令牌无效或已过期', 403));
//       }
//       req.user = user;
//       next();
//     });
//   };
// }

// ====================================
// 导出数据接口
// ====================================

// 7. 导出原料库存数据
app.get('/api/inventory/raw-materials/export',  async (req, res) => {
  try {
    console.log('导出原料库存数据 - 开始');
    
    const {
      materialName,
      category,
      status
    } = req.query;

    // 构建查询条件（复用列表接口逻辑）
    let whereConditions = ['1 = 1'];
    let queryParams = [];

    if (materialName?.trim()) {
      whereConditions.push('(rm.MaterialName LIKE ? OR rm.MaterialCode LIKE ?)');
      const searchTerm = `%${materialName.trim()}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    if (category?.trim()) {
      whereConditions.push('rm.Category = ?');
      queryParams.push(category.trim());
    }

    if (status?.trim()) {
      if (status === '正常') {
        whereConditions.push('i.CurrentQuantity > rm.MinStock');
      } else if (status === '盘盈') {
        whereConditions.push('i.CurrentQuantity > rm.MaxStock');
      } else if (status === '盘亏') {
        whereConditions.push('i.CurrentQuantity < rm.MinStock');
      }
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询导出数据（不分页）
    const exportSql = `
      SELECT 
        rm.MaterialCode as '原料编码',
        rm.MaterialName as '原料名称',
        rm.Category as '分类',
        rm.Specification as '规格',
        rm.Unit as '单位',
        COALESCE(i.CurrentQuantity, 0) as '库存数量',
        CASE 
          WHEN COALESCE(i.CurrentQuantity, 0) < rm.MinStock THEN '盘亏'
          WHEN COALESCE(i.CurrentQuantity, 0) > rm.MaxStock THEN '盘盈'
          ELSE '正常'
        END as '库存状态',
        rm.MinStock as '最小库存',
        rm.MaxStock as '最大库存',
        rm.CreatedAt as '创建时间',
        rm.UpdatedAt as '更新时间'
      FROM RawMaterial rm
      LEFT JOIN (
        SELECT 
          ItemID,
          SUM(CurrentQuantity) as CurrentQuantity
        FROM Inventory 
        WHERE ItemType = 'RawMaterial'
        GROUP BY ItemID
      ) i ON rm.MaterialID = i.ItemID
      WHERE ${whereClause}
      ORDER BY rm.MaterialName ASC
      LIMIT 10000
    `;

    const exportData = await executeQuery(exportSql, queryParams);

    // 创建Excel工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('原料库存列表');

    // 设置工作表属性
    workbook.creator = '水杯WMS系统';
    workbook.lastModifiedBy = '系统';
    workbook.created = new Date();

    if (exportData.length > 0) {
      // 获取列标题
      const headers = Object.keys(exportData[0]);
      
      // 添加标题行
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // 添加数据行
      exportData.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // 格式化日期
          if (header.includes('时间')) {
            return value ? formatDateTime(value) : '';
          }
          return value;
        });
        worksheet.addRow(values);
      });

      // 自动调整列宽
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });
    } else {
      // 没有数据时添加提示
      worksheet.addRow(['暂无数据']);
    }

    // 设置响应头
    const fileName = `原料库存列表_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    // 输出Excel文件
    await workbook.xlsx.write(res);
    res.end();

    console.log(`导出原料库存数据 - 成功, 导出${exportData.length}条记录`);

  } catch (error) {
    console.error('导出原料库存数据失败:', error);
    if (!res.headersSent) {
      res.status(500).json(errorResponse('导出原料库存数据失败'));
    }
  }
});

// 8. 导出原料仓位数据
app.get('/api/locations/raw-materials/export',  async (req, res) => {
  try {
    console.log('导出原料仓位数据 - 开始');
    
    const {
      materialName,
      locationCode
    } = req.query;

    // 构建查询条件
    let whereConditions = ['1 = 1'];
    let queryParams = [];

    if (materialName?.trim()) {
      whereConditions.push('rm.MaterialName LIKE ?');
      queryParams.push(`%${materialName.trim()}%`);
    }

    if (locationCode?.trim()) {
      whereConditions.push('l.LocationID LIKE ?');
      queryParams.push(`%${locationCode.trim()}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询导出数据
    const exportSql = `
      SELECT 
        rm.MaterialCode as '原料编码',
        rm.MaterialName as '原料名称',
        rm.Specification as '规格',
        l.LocationID as '仓位编号',
        l.LocationName as '仓位名称',
        i.CurrentQuantity as '库存数量',
        rm.Unit as '单位',
        CASE WHEN l.Status = 1 THEN '启用' ELSE '禁用' END as '状态',
        COALESCE(i.BatchNumber, '') as '备注',
        i.CreatedAt as '创建时间'
      FROM Inventory i
      JOIN RawMaterial rm ON i.ItemID = rm.MaterialID
      JOIN Location l ON i.LocationID = l.LocationID
      WHERE i.ItemType = 'RawMaterial' AND ${whereClause}
      ORDER BY i.CreatedAt DESC
      LIMIT 10000
    `;

    const exportData = await executeQuery(exportSql, queryParams);

    // 创建Excel工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('原料仓位列表');

    // 设置工作表属性
    workbook.creator = '水杯WMS系统';
    workbook.lastModifiedBy = '系统';
    workbook.created = new Date();

    if (exportData.length > 0) {
      // 获取列标题
      const headers = Object.keys(exportData[0]);
      
      // 添加标题行
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // 添加数据行
      exportData.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // 格式化日期和数值
          if (header.includes('时间')) {
            return value ? formatDateTime(value) : '';
          }
          if (header === '库存数量') {
            return parseFloat(value) || 0;
          }
          return value;
        });
        worksheet.addRow(values);
      });

      // 自动调整列宽
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });
    } else {
      // 没有数据时添加提示
      worksheet.addRow(['暂无数据']);
    }

    // 设置响应头
    const fileName = `原料仓位列表_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    // 输出Excel文件
    await workbook.xlsx.write(res);
    res.end();

    console.log(`导出原料仓位数据 - 成功, 导出${exportData.length}条记录`);

  } catch (error) {
    console.error('导出原料仓位数据失败:', error);
    if (!res.headersSent) {
      res.status(500).json(errorResponse('导出原料仓位数据失败'));
    }
  }
});

// ====================================
// 统计数据接口
// ====================================

// 9. 获取原料库存统计数据
app.get('/api/inventory/raw-materials/statistics',  async (req, res) => {
  try {
    console.log('获取原料库存统计数据');

    // 并行查询统计数据
    const [
      totalMaterials,
      lowStockMaterials,
      categoryStats,
      stockSummary
    ] = await Promise.all([
      // 原料总数
      executeQuery(`
        SELECT COUNT(*) as total 
        FROM RawMaterial 
        WHERE Status = 1
      `),
      
      // 低库存原料数量
      executeQuery(`
        SELECT COUNT(DISTINCT rm.MaterialID) as count
        FROM RawMaterial rm
        LEFT JOIN (
          SELECT ItemID, SUM(CurrentQuantity) as CurrentQuantity
          FROM Inventory 
          WHERE ItemType = 'RawMaterial'
          GROUP BY ItemID
        ) i ON rm.MaterialID = i.ItemID
        WHERE COALESCE(i.CurrentQuantity, 0) < rm.MinStock
      `),
      
      // 按分类统计
      executeQuery(`
        SELECT 
          rm.Category as category,
          COUNT(rm.MaterialID) as materialCount,
          COALESCE(SUM(i.CurrentQuantity), 0) as totalStock
        FROM RawMaterial rm
        LEFT JOIN (
          SELECT ItemID, SUM(CurrentQuantity) as CurrentQuantity
          FROM Inventory 
          WHERE ItemType = 'RawMaterial'
          GROUP BY ItemID
        ) i ON rm.MaterialID = i.ItemID
        WHERE rm.Status = 1
        GROUP BY rm.Category
        ORDER BY totalStock DESC
      `),
      
      // 库存总体情况
      executeQuery(`
        SELECT 
          COUNT(DISTINCT rm.MaterialID) as totalMaterials,
          COALESCE(SUM(i.CurrentQuantity), 0) as totalStock,
          COUNT(DISTINCT CASE WHEN COALESCE(i.CurrentQuantity, 0) < rm.MinStock THEN rm.MaterialID END) as lowStockCount,
          COUNT(DISTINCT CASE WHEN COALESCE(i.CurrentQuantity, 0) > rm.MaxStock THEN rm.MaterialID END) as overStockCount
        FROM RawMaterial rm
        LEFT JOIN (
          SELECT ItemID, SUM(CurrentQuantity) as CurrentQuantity
          FROM Inventory 
          WHERE ItemType = 'RawMaterial'
          GROUP BY ItemID
        ) i ON rm.MaterialID = i.ItemID
        WHERE rm.Status = 1
      `)
    ]);

    const statistics = {
      overview: {
        totalMaterials: totalMaterials[0]?.total || 0,
        lowStockCount: lowStockMaterials[0]?.count || 0,
        totalStock: parseFloat(stockSummary[0]?.totalStock) || 0,
        overStockCount: stockSummary[0]?.overStockCount || 0
      },
      categoryDistribution: categoryStats.map(item => ({
        category: item.category,
        materialCount: item.materialCount,
        totalStock: parseFloat(item.totalStock) || 0
      })),
      stockStatus: {
        normal: (stockSummary[0]?.totalMaterials || 0) - (stockSummary[0]?.lowStockCount || 0) - (stockSummary[0]?.overStockCount || 0),
        lowStock: stockSummary[0]?.lowStockCount || 0,
        overStock: stockSummary[0]?.overStockCount || 0
      }
    };

    console.log('获取原料库存统计数据 - 成功');
    res.json(successResponse(statistics));

  } catch (error) {
    console.error('获取原料库存统计数据失败:', error);
    res.status(500).json(errorResponse('获取原料库存统计数据失败'));
  }
});

// 10. 获取仓位使用统计数据
app.get('/api/locations/raw-materials/statistics',  async (req, res) => {
  try {
    console.log('获取仓位使用统计数据');

    // 并行查询统计数据
    const [
      locationStats,
      warehouseStats,
      utilizationStats
    ] = await Promise.all([
      // 仓位总体统计
      executeQuery(`
        SELECT 
          COUNT(DISTINCT l.LocationID) as totalLocations,
          COUNT(DISTINCT i.LocationID) as usedLocations,
          COUNT(DISTINCT CASE WHEN l.Status = 0 THEN l.LocationID END) as disabledLocations
        FROM Location l
        LEFT JOIN Inventory i ON l.LocationID = i.LocationID AND i.ItemType = 'RawMaterial'
        WHERE l.LocationType = 'Raw'
      `),
      
      // 按仓库统计
      executeQuery(`
        SELECT 
          w.WarehouseName,
          COUNT(DISTINCT l.LocationID) as totalLocations,
          COUNT(DISTINCT i.LocationID) as usedLocations,
          COALESCE(SUM(i.CurrentQuantity), 0) as totalStock
        FROM Warehouse w
        LEFT JOIN Location l ON w.WarehouseID = l.WarehouseID AND l.LocationType = 'Raw'
        LEFT JOIN Inventory i ON l.LocationID = i.LocationID AND i.ItemType = 'RawMaterial'
        WHERE w.Status = 1
        GROUP BY w.WarehouseID, w.WarehouseName
        ORDER BY totalStock DESC
      `),
      
      // 仓位利用率统计
      executeQuery(`
        SELECT 
          CASE 
            WHEN i.CurrentQuantity = 0 THEN '空闲'
            WHEN i.CurrentQuantity < 100 THEN '低使用率'
            WHEN i.CurrentQuantity < 500 THEN '中等使用率'
            ELSE '高使用率'
          END as utilizationLevel,
          COUNT(*) as locationCount
        FROM Location l
        LEFT JOIN Inventory i ON l.LocationID = i.LocationID AND i.ItemType = 'RawMaterial'
        WHERE l.LocationType = 'Raw' AND l.Status = 1
        GROUP BY 
          CASE 
            WHEN i.CurrentQuantity IS NULL OR i.CurrentQuantity = 0 THEN '空闲'
            WHEN i.CurrentQuantity < 100 THEN '低使用率'
            WHEN i.CurrentQuantity < 500 THEN '中等使用率'
            ELSE '高使用率'
          END
      `)
    ]);

    const statistics = {
      overview: {
        totalLocations: locationStats[0]?.totalLocations || 0,
        usedLocations: locationStats[0]?.usedLocations || 0,
        availableLocations: (locationStats[0]?.totalLocations || 0) - (locationStats[0]?.usedLocations || 0),
        disabledLocations: locationStats[0]?.disabledLocations || 0
      },
      warehouseDistribution: warehouseStats.map(item => ({
        warehouseName: item.WarehouseName,
        totalLocations: item.totalLocations || 0,
        usedLocations: item.usedLocations || 0,
        totalStock: parseFloat(item.totalStock) || 0
      })),
      utilizationDistribution: utilizationStats.map(item => ({
        level: item.utilizationLevel,
        count: item.locationCount
      }))
    };

    console.log('获取仓位使用统计数据 - 成功');
    res.json(successResponse(statistics));

  } catch (error) {
    console.error('获取仓位使用统计数据失败:', error);
    res.status(500).json(errorResponse('获取仓位使用统计数据失败'));
  }
});