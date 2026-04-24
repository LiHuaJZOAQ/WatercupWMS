const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { createResponse, successResponse, errorResponse, formatDateTime, validateRequired, executeQuery, executeTransaction } = require('../utils');

const JWT_SECRET = process.env.JWT_SECRET || 'watercup_wms_secret_key';

// ====================================
// 原料库存管理接口
// ====================================

// 1. 获取原料库存列表
router.get('/api/inventory/raw-materials',  async (req, res) => {
  try {
    console.log('获取原料库存列表 - 参数:', req.query);
    
    const {
      page = 1,
      pageSize = 20,
      materialName,
      materialCode,
      category,
      status,
      warehouse,
      minStock
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

    // 原料名称/编码搜索
    if (materialName && materialName.trim()) {
      whereConditions.push('(rm.MaterialName LIKE ? OR rm.MaterialCode LIKE ?)');
      const searchTerm = `%${materialName.trim()}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    // 分类筛选
    if (category && category.trim()) {
      whereConditions.push('rm.Category = ?');
      queryParams.push(category.trim());
    }

    // 状态筛选
    if (status && status.trim()) {
      if (status === '正常') {
        whereConditions.push('i.CurrentQuantity > rm.MinStock');
      } else if (status === '盘盈') {
        whereConditions.push('i.CurrentQuantity > (i.CurrentQuantity - i.ReservedQuantity)');
      } else if (status === '盘亏') {
        whereConditions.push('i.CurrentQuantity < rm.MinStock');
      }
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询总记录数
    const countSql = `
      SELECT COUNT(DISTINCT rm.MaterialID) as total
      FROM RawMaterial rm
      LEFT JOIN (
        SELECT 
          ItemID,
          SUM(CurrentQuantity) as CurrentQuantity,
          SUM(ReservedQuantity) as ReservedQuantity
        FROM Inventory 
        WHERE ItemType = 'RawMaterial'
        GROUP BY ItemID
      ) i ON rm.MaterialID = i.ItemID
      WHERE ${whereClause}
    `;

    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0]?.total || 0;

    // 查询列表数据
    const offset = (pageNum - 1) * size;
    const listSql = `
      SELECT 
        rm.MaterialID as id,
        rm.MaterialCode as code,
        rm.MaterialName as name,
        rm.Category as category,
        rm.Specification as specification,
        rm.Unit as unit,
        COALESCE(i.CurrentQuantity, 0) as stock,
        CASE 
          WHEN COALESCE(i.CurrentQuantity, 0) < rm.MinStock THEN '盘亏'
          WHEN COALESCE(i.CurrentQuantity, 0) > rm.MaxStock THEN '盘盈'
          ELSE '正常'
        END as status,
        rm.MinStock as minStock,
        rm.MaxStock as maxStock,
        rm.CreatedAt,
        rm.UpdatedAt
      FROM RawMaterial rm
      LEFT JOIN (
        SELECT 
          ItemID,
          SUM(CurrentQuantity) as CurrentQuantity,
          SUM(ReservedQuantity) as ReservedQuantity
        FROM Inventory 
        WHERE ItemType = 'RawMaterial'
        GROUP BY ItemID
      ) i ON rm.MaterialID = i.ItemID
      WHERE ${whereClause}
      ORDER BY rm.MaterialName ASC
      LIMIT ? OFFSET ?
    `;

    const listParams = [...queryParams, size, offset];
    const listResult = await executeQuery(listSql, listParams);

    // 格式化返回数据
    const list = listResult.map(item => ({
      ...item,
      stock: parseFloat(item.stock) || 0,
      minStock: parseFloat(item.minStock) || 0,
      maxStock: parseFloat(item.maxStock) || 0,
      CreatedAt: formatDateTime(item.CreatedAt),
      UpdatedAt: formatDateTime(item.UpdatedAt)
    }));

    const response = {
      list: list,
      total: total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size)
    };

    console.log(`获取原料库存列表 - 成功, 共${total}条记录`);
    res.json(response);

  } catch (error) {
    console.error('获取原料库存列表失败:', error);
    res.status(500).json(errorResponse('获取原料库存列表失败'));
  }
});

// 2. 获取原料库存详情
router.get('/api/inventory/raw-materials/:id',  async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`获取原料库存详情 - ID: ${id}`);

    if (!id || isNaN(id)) {
      return res.status(400).json(errorResponse('原料ID无效', 400));
    }

    // 获取原料基本信息
    const materialSql = `
      SELECT 
        rm.MaterialID as id,
        rm.MaterialCode as code,
        rm.MaterialName as name,
        rm.Category as category,
        rm.Specification as specification,
        rm.Unit as unit,
        rm.Description,
        rm.MinStock,
        rm.MaxStock,
        rm.Status,
        rm.CreatedAt,
        rm.UpdatedAt
      FROM RawMaterial rm
      WHERE rm.MaterialID = ?
    `;

    const materialResult = await executeQuery(materialSql, [id]);

    if (materialResult.length === 0) {
      return res.status(404).json(errorResponse('原料不存在', 404));
    }

    // 获取库存明细信息
    const inventorySql = `
      SELECT 
        i.InventoryID,
        i.LocationID,
        l.LocationName,
        w.WarehouseName,
        i.BatchNumber,
        i.CurrentQuantity,
        i.AvailableQuantity,
        i.ReservedQuantity,
        i.UnitCost,
        i.ProductionDate,
        i.ExpiryDate,
        i.LastInboundDate,
        i.LastOutboundDate
      FROM Inventory i
      LEFT JOIN Location l ON i.LocationID = l.LocationID
      LEFT JOIN Warehouse w ON l.WarehouseID = w.WarehouseID
      WHERE i.ItemType = 'RawMaterial' AND i.ItemID = ?
      ORDER BY i.LastInboundDate DESC
    `;

    const inventoryResult = await executeQuery(inventorySql, [id]);

    // 计算汇总数据
    const totalStock = inventoryResult.reduce((sum, item) => sum + parseFloat(item.CurrentQuantity || 0), 0);
    const totalAvailable = inventoryResult.reduce((sum, item) => sum + parseFloat(item.AvailableQuantity || 0), 0);
    const totalReserved = inventoryResult.reduce((sum, item) => sum + parseFloat(item.ReservedQuantity || 0), 0);

    const material = materialResult[0];
    const detail = {
      ...material,
      MinStock: parseFloat(material.MinStock) || 0,
      MaxStock: parseFloat(material.MaxStock) || 0,
      CreatedAt: formatDateTime(material.CreatedAt),
      UpdatedAt: formatDateTime(material.UpdatedAt),
      totalStock: totalStock,
      totalAvailable: totalAvailable,
      totalReserved: totalReserved,
      status: totalStock < material.MinStock ? '盘亏' : (totalStock > material.MaxStock ? '盘盈' : '正常'),
      inventoryDetails: inventoryResult.map(item => ({
        ...item,
        CurrentQuantity: parseFloat(item.CurrentQuantity) || 0,
        AvailableQuantity: parseFloat(item.AvailableQuantity) || 0,
        ReservedQuantity: parseFloat(item.ReservedQuantity) || 0,
        UnitCost: parseFloat(item.UnitCost) || 0,
        ProductionDate: item.ProductionDate ? moment(item.ProductionDate).format('YYYY-MM-DD') : null,
        ExpiryDate: item.ExpiryDate ? moment(item.ExpiryDate).format('YYYY-MM-DD') : null,
        LastInboundDate: item.LastInboundDate ? formatDateTime(item.LastInboundDate) : null,
        LastOutboundDate: item.LastOutboundDate ? formatDateTime(item.LastOutboundDate) : null
      }))
    };

    console.log(`获取原料库存详情 - 成功: ${material.name}`);
    res.json(successResponse(detail));

  } catch (error) {
    console.error('获取原料库存详情失败:', error);
    res.status(500).json(errorResponse('获取原料库存详情失败'));
  }
});

// 3. 更新原料信息
router.put('/api/inventory/raw-materials/:id',  async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`更新原料信息 - ID: ${id}`, req.body);

    if (!id || isNaN(id)) {
      return res.status(400).json(errorResponse('原料ID无效', 400));
    }

    const {
      code,
      name,
      category,
      specification,
      unit,
      stock,
      status,
      minStock,
      maxStock
    } = req.body;

    // 参数验证
    const validation = validateRequired({ code, name, category, unit }, ['code', 'name', 'category', 'unit']);
    if (validation) {
      return res.status(400).json(errorResponse(validation, 400));
    }

    // 处理状态值：可能是布尔值、数字(1/0)或字符串('正常'/'禁用'等)
    let statusValue = 1;
    if (status !== undefined) {
      if (status === '正常' || status === true || status === 1 || status === '1') {
        statusValue = 1;
      } else {
        statusValue = 0;
      }
    }

    // 检查原料是否存在
    const checkResult = await executeQuery(
      'SELECT MaterialID FROM RawMaterial WHERE MaterialID = ?',
      [id]
    );

    if (checkResult.length === 0) {
      return res.status(404).json(errorResponse('原料不存在', 404));
    }

    // 更新原料信息
    await executeQuery(
      `UPDATE RawMaterial
       SET MaterialCode = ?, MaterialName = ?, Category = ?,
           Specification = ?, Unit = ?, MinStock = ?, MaxStock = ?, Status = ?, UpdatedAt = NOW()
       WHERE MaterialID = ?`,
      [code, name, category, specification || '', unit, minStock || 0, maxStock || 0, statusValue, id]
    );

    console.log(`更新原料信息 - 成功: ${name}`);
    res.json(successResponse({ id: parseInt(id) }, '原料信息更新成功'));

  } catch (error) {
    console.error('更新原料信息失败:', error);
    res.status(500).json(errorResponse('更新原料信息失败'));
  }
});

// 4. 删除原料
router.delete('/api/inventory/raw-materials/:id',  async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`删除原料 - ID: ${id}`);

    if (!id || isNaN(id)) {
      return res.status(400).json(errorResponse('原料ID无效', 400));
    }

    // 检查是否有库存记录
    const inventoryCheck = await executeQuery(
      'SELECT COUNT(*) as count FROM Inventory WHERE ItemType = "RawMaterial" AND ItemID = ? AND CurrentQuantity > 0',
      [id]
    );

    if (inventoryCheck[0].count > 0) {
      return res.status(400).json(errorResponse('原料仍有库存，无法删除', 400));
    }

    // 删除原料
    await executeQuery('DELETE FROM RawMaterial WHERE MaterialID = ?', [id]);

    console.log(`删除原料 - 成功: ID ${id}`);
    res.json(successResponse(null, '原料删除成功'));

  } catch (error) {
    console.error('删除原料失败:', error);
    res.status(500).json(errorResponse('删除原料失败'));
  }
});

// 5. 新增原料
router.post('/api/inventory/raw-materials',  async (req, res) => {
  try {
    console.log('新增原料 - 参数:', req.body);
    
    const {
      code,
      name,
      category,
      specification,
      unit,
      stock
    } = req.body;

    // 参数验证
    const validation = validateRequired({ code, name, category, unit }, ['code', 'name', 'category', 'unit']);
    if (validation) {
      return res.status(400).json(errorResponse(validation, 400));
    }

    // 检查编码是否已存在
    const existsResult = await executeQuery(
      'SELECT COUNT(*) as count FROM RawMaterial WHERE MaterialCode = ?',
      [code]
    );

    if (existsResult[0].count > 0) {
      return res.status(400).json(errorResponse('原料编码已存在', 400));
    }

    // 插入原料记录
    const insertResult = await executeQuery(
      `INSERT INTO RawMaterial 
       (MaterialCode, MaterialName, Category, Specification, Unit, Status) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [code, name, category, specification || '', unit]
    );

    const result = {
      id: insertResult.insertId,
      code,
      name,
      category,
      unit
    };

    console.log('新增原料 - 成功:', result);
    res.status(201).json(successResponse(result, '原料新增成功'));

  } catch (error) {
    console.error('新增原料失败:', error);
    res.status(500).json(errorResponse('新增原料失败'));
  }
});



module.exports = router;
