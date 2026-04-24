const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { createResponse, successResponse, errorResponse, formatDateTime, validateRequired, executeQuery, executeTransaction } = require('../utils');

// ====================================
// 基础数据 - 供应商管理接口
// ====================================

router.get('/suppliers', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, status } = req.query;
    let whereConditions = [];
    let queryParams = [];

    if (keyword) {
      whereConditions.push('(SupplierCode LIKE ? OR SupplierName LIKE ?)');
      queryParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (status !== undefined && status !== '') {
      whereConditions.push('Status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    const countSql = `SELECT COUNT(*) as total FROM Supplier ${whereClause}`;
    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0].total;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    const sql = `
      SELECT 
        SupplierID as id,
        SupplierCode as code,
        SupplierName as name,
        ContactPerson as contactPerson,
        ContactPhone as contactPhone,
        Email as email,
        Address as address,
        Status as status,
        CreatedAt as createdAt
      FROM Supplier
      ${whereClause}
      ORDER BY SupplierID DESC
      LIMIT ? OFFSET ?
    `;
    
    const results = await executeQuery(sql, [...queryParams, limit, offset]);
    
    const formattedResults = results.map(item => ({
      ...item,
      createdAt: formatDateTime(item.createdAt)
    }));

    res.json(successResponse({
      items: formattedResults,
      total,
      page: parseInt(page),
      pageSize: limit
    }));
  } catch (error) {
    console.error('获取供应商列表失败:', error);
    res.status(500).json(errorResponse('获取供应商列表失败'));
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const { code, name, contactPerson, contactPhone, email, address, status = 1 } = req.body;
    
    const validation = validateRequired({ code, name }, ['code', 'name']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT SupplierID FROM Supplier WHERE SupplierCode = ?', [code]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('供应商编码已存在', 400));

    await executeQuery(
      `INSERT INTO Supplier (SupplierCode, SupplierName, ContactPerson, ContactPhone, Email, Address, Status, CreatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [code, name, contactPerson || '', contactPhone || '', email || '', address || '', status]
    );

    res.json(successResponse(null, '供应商创建成功'));
  } catch (error) {
    console.error('创建供应商失败:', error);
    res.status(500).json(errorResponse('创建供应商失败'));
  }
});

router.put('/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, contactPerson, contactPhone, email, address, status } = req.body;

    const validation = validateRequired({ code, name }, ['code', 'name']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT SupplierID FROM Supplier WHERE SupplierCode = ? AND SupplierID != ?', [code, id]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('供应商编码已被其他供应商使用', 400));

    await executeQuery(
      `UPDATE Supplier SET 
        SupplierCode = ?, SupplierName = ?, ContactPerson = ?, 
        ContactPhone = ?, Email = ?, Address = ?, Status = ?, UpdatedAt = NOW()
       WHERE SupplierID = ?`,
      [code, name, contactPerson || '', contactPhone || '', email || '', address || '', status !== undefined ? status : 1, id]
    );

    res.json(successResponse(null, '供应商更新成功'));
  } catch (error) {
    console.error('更新供应商失败:', error);
    res.status(500).json(errorResponse('更新供应商失败'));
  }
});

router.delete('/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查是否有关联的入库单
    const checkRel = await executeQuery('SELECT InboundID FROM RawMaterialInbound WHERE SupplierID = ? LIMIT 1', [id]);
    if (checkRel.length > 0) {
      return res.status(400).json(errorResponse('该供应商已有入库记录，无法删除', 400));
    }

    await executeQuery('DELETE FROM Supplier WHERE SupplierID = ?', [id]);
    res.json(successResponse(null, '供应商删除成功'));
  } catch (error) {
    console.error('删除供应商失败:', error);
    res.status(500).json(errorResponse('删除供应商失败'));
  }
});



module.exports = router;
