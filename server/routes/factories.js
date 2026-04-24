const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { createResponse, successResponse, errorResponse, formatDateTime, validateRequired, executeQuery, executeTransaction } = require('../utils');

// ====================================
// 基础数据 - 加工厂管理接口
// ====================================

router.get('/factories', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, status } = req.query;
    let whereConditions = [];
    let queryParams = [];

    if (keyword) {
      whereConditions.push('(FactoryCode LIKE ? OR FactoryName LIKE ?)');
      queryParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (status !== undefined && status !== '') {
      whereConditions.push('Status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const countSql = `SELECT COUNT(*) as total FROM ProcessingFactory ${whereClause}`;
    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0].total;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    const sql = `
      SELECT 
        FactoryID as id, FactoryCode as code, FactoryName as name,
        ContactPerson as contactPerson, ContactPhone as contactPhone,
        Address as address, Status as status, CreatedAt as createdAt
      FROM ProcessingFactory ${whereClause} ORDER BY FactoryID DESC LIMIT ? OFFSET ?
    `;
    const results = await executeQuery(sql, [...queryParams, limit, offset]);
    const formattedResults = results.map(item => ({ ...item, createdAt: formatDateTime(item.createdAt) }));

    res.json(successResponse({ items: formattedResults, total, page: parseInt(page), pageSize: limit }));
  } catch (error) {
    res.status(500).json(errorResponse('获取加工厂列表失败'));
  }
});

router.post('/factories', async (req, res) => {
  try {
    const { code, name, contactPerson, contactPhone, address, status = 1 } = req.body;
    const validation = validateRequired({ code, name }, ['code', 'name']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT FactoryID FROM ProcessingFactory WHERE FactoryCode = ?', [code]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('加工厂编码已存在', 400));

    await executeQuery(
      `INSERT INTO ProcessingFactory (FactoryCode, FactoryName, ContactPerson, ContactPhone, Address, Status, CreatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [code, name, contactPerson || '', contactPhone || '', address || '', status]
    );
    res.json(successResponse(null, '加工厂创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse('创建加工厂失败'));
  }
});

router.put('/factories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, contactPerson, contactPhone, address, status } = req.body;
    const validation = validateRequired({ code, name }, ['code', 'name']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT FactoryID FROM ProcessingFactory WHERE FactoryCode = ? AND FactoryID != ?', [code, id]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('加工厂编码已被其他加工厂使用', 400));

    await executeQuery(
      `UPDATE ProcessingFactory SET FactoryCode = ?, FactoryName = ?, ContactPerson = ?, ContactPhone = ?, Address = ?, Status = ?, UpdatedAt = NOW() WHERE FactoryID = ?`,
      [code, name, contactPerson || '', contactPhone || '', address || '', status !== undefined ? status : 1, id]
    );
    res.json(successResponse(null, '加工厂更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse('更新加工厂失败'));
  }
});

router.delete('/factories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const checkRel = await executeQuery('SELECT InboundID FROM FinishedProductInbound WHERE FactoryID = ? LIMIT 1', [id]);
    if (checkRel.length > 0) return res.status(400).json(errorResponse('该加工厂已有成品入库记录，无法删除', 400));

    await executeQuery('DELETE FROM ProcessingFactory WHERE FactoryID = ?', [id]);
    res.json(successResponse(null, '加工厂删除成功'));
  } catch (error) {
    res.status(500).json(errorResponse('删除加工厂失败'));
  }
});


module.exports = router;
