const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { createResponse, successResponse, errorResponse, formatDateTime, validateRequired, executeQuery, executeTransaction } = require('../utils');

const JWT_SECRET = process.env.JWT_SECRET || 'watercup_wms_secret_key';

// ====================================
// 基础数据 - 成品档案管理接口
// ====================================

router.get('/api/finished-products', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, category, status } = req.query;
    let whereConditions = [];
    let queryParams = [];

    if (keyword) {
      whereConditions.push('(ProductCode LIKE ? OR ProductName LIKE ?)');
      queryParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (category) {
      whereConditions.push('Category = ?');
      queryParams.push(category);
    }
    if (status !== undefined && status !== '') {
      whereConditions.push('Status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const countSql = `SELECT COUNT(*) as total FROM FinishedProduct ${whereClause}`;
    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0].total;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    const sql = `
      SELECT 
        ProductID as id, ProductCode as code, ProductName as name, Category as category,
        Unit as unit, Specification as specification, Color as color, Capacity as capacity,
        Material as material, Description as description, MinStock as minStock, MaxStock as maxStock,
        Status as status, CreatedAt as createdAt
      FROM FinishedProduct ${whereClause} ORDER BY ProductID DESC LIMIT ? OFFSET ?
    `;
    const results = await executeQuery(sql, [...queryParams, limit, offset]);
    const formattedResults = results.map(item => ({ ...item, createdAt: formatDateTime(item.createdAt) }));

    res.json(successResponse({ items: formattedResults, total, page: parseInt(page), pageSize: limit }));
  } catch (error) {
    res.status(500).json(errorResponse('获取成品列表失败'));
  }
});

router.post('/api/finished-products', async (req, res) => {
  try {
    const { code, name, category, unit, specification, color, capacity, material, description, minStock = 0, maxStock = 0, status = 1 } = req.body;
    const validation = validateRequired({ code, name, unit }, ['code', 'name', 'unit']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT ProductID FROM FinishedProduct WHERE ProductCode = ?', [code]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('成品编码已存在', 400));

    await executeQuery(
      `INSERT INTO FinishedProduct 
        (ProductCode, ProductName, Category, Unit, Specification, Color, Capacity, Material, Description, MinStock, MaxStock, Status, CreatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [code, name, category || '', unit, specification || '', color || '', capacity || '', material || '', description || '', minStock, maxStock, status]
    );
    res.json(successResponse(null, '成品创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse('创建成品失败'));
  }
});

router.put('/api/finished-products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, category, unit, specification, color, capacity, material, description, minStock, maxStock, status } = req.body;
    const validation = validateRequired({ code, name, unit }, ['code', 'name', 'unit']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT ProductID FROM FinishedProduct WHERE ProductCode = ? AND ProductID != ?', [code, id]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('成品编码已被使用', 400));

    await executeQuery(
      `UPDATE FinishedProduct SET 
        ProductCode = ?, ProductName = ?, Category = ?, Unit = ?, Specification = ?, Color = ?, 
        Capacity = ?, Material = ?, Description = ?, MinStock = ?, MaxStock = ?, Status = ?, UpdatedAt = NOW() 
       WHERE ProductID = ?`,
      [code, name, category || '', unit, specification || '', color || '', capacity || '', material || '', description || '', minStock || 0, maxStock || 0, status !== undefined ? status : 1, id]
    );
    res.json(successResponse(null, '成品更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse('更新成品失败'));
  }
});

router.delete('/api/finished-products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const checkRel = await executeQuery('SELECT DetailID FROM FinishedProductInboundDetail WHERE FinishedProductID = ? LIMIT 1', [id]);
    if (checkRel.length > 0) return res.status(400).json(errorResponse('该成品已有入库记录，无法删除', 400));

    await executeQuery('DELETE FROM FinishedProduct WHERE ProductID = ?', [id]);
    res.json(successResponse(null, '成品删除成功'));
  } catch (error) {
    res.status(500).json(errorResponse('删除成品失败'));
  }
});



module.exports = router;
