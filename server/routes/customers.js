const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { createResponse, successResponse, errorResponse, formatDateTime, validateRequired, executeQuery, executeTransaction } = require('../utils');

// ====================================
// 基础数据 - 客户管理接口
// ====================================

router.get('/customers', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, status } = req.query;
    let whereConditions = [];
    let queryParams = [];

    if (keyword) {
      whereConditions.push('(CustomerCode LIKE ? OR CustomerName LIKE ?)');
      queryParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (status !== undefined && status !== '') {
      whereConditions.push('Status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const countSql = `SELECT COUNT(*) as total FROM Customer ${whereClause}`;
    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0].total;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    const sql = `
      SELECT 
        CustomerID as id, CustomerCode as code, CustomerName as name,
        ContactPerson as contactPerson, ContactPhone as contactPhone,
        Email as email, Address as address, Status as status, CreatedAt as createdAt
      FROM Customer ${whereClause} ORDER BY CustomerID DESC LIMIT ? OFFSET ?
    `;
    const results = await executeQuery(sql, [...queryParams, limit, offset]);
    
    const formattedResults = results.map(item => ({
      ...item, createdAt: formatDateTime(item.createdAt)
    }));

    res.json(successResponse({ items: formattedResults, total, page: parseInt(page), pageSize: limit }));
  } catch (error) {
    console.error('获取客户列表失败:', error);
    res.status(500).json(errorResponse('获取客户列表失败'));
  }
});

router.post('/customers', async (req, res) => {
  try {
    const { code, name, contactPerson, contactPhone, email, address, status = 1 } = req.body;
    const validation = validateRequired({ code, name }, ['code', 'name']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT CustomerID FROM Customer WHERE CustomerCode = ?', [code]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('客户编码已存在', 400));

    await executeQuery(
      `INSERT INTO Customer (CustomerCode, CustomerName, ContactPerson, ContactPhone, Email, Address, Status, CreatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [code, name, contactPerson || '', contactPhone || '', email || '', address || '', status]
    );
    res.json(successResponse(null, '客户创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse('创建客户失败'));
  }
});

router.put('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, contactPerson, contactPhone, email, address, status } = req.body;
    const validation = validateRequired({ code, name }, ['code', 'name']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT CustomerID FROM Customer WHERE CustomerCode = ? AND CustomerID != ?', [code, id]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('客户编码已被其他客户使用', 400));

    await executeQuery(
      `UPDATE Customer SET CustomerCode = ?, CustomerName = ?, ContactPerson = ?, ContactPhone = ?, Email = ?, Address = ?, Status = ?, UpdatedAt = NOW() WHERE CustomerID = ?`,
      [code, name, contactPerson || '', contactPhone || '', email || '', address || '', status !== undefined ? status : 1, id]
    );
    res.json(successResponse(null, '客户更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse('更新客户失败'));
  }
});

router.delete('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const checkRel = await executeQuery('SELECT OutboundID FROM FinishedProductOutbound WHERE CustomerID = ? LIMIT 1', [id]);
    if (checkRel.length > 0) return res.status(400).json(errorResponse('该客户已有出库记录，无法删除', 400));

    await executeQuery('DELETE FROM Customer WHERE CustomerID = ?', [id]);
    res.json(successResponse(null, '客户删除成功'));
  } catch (error) {
    res.status(500).json(errorResponse('删除客户失败'));
  }
});



module.exports = router;
