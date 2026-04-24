const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { createResponse, successResponse, errorResponse, formatDateTime, validateRequired, executeQuery, executeTransaction } = require('../utils');

const JWT_SECRET = process.env.JWT_SECRET || 'watercup_wms_secret_key';

// ====================================
// 基础数据 - 部门管理接口
// ====================================

router.get('/api/departments', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, status } = req.query;
    let whereConditions = [];
    let queryParams = [];

    if (keyword) {
      whereConditions.push('(DepartmentCode LIKE ? OR DepartmentName LIKE ?)');
      queryParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (status !== undefined && status !== '') {
      whereConditions.push('Status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const countSql = `SELECT COUNT(*) as total FROM Department ${whereClause}`;
    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0].total;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    const sql = `
      SELECT 
        DepartmentID as id, DepartmentCode as code, DepartmentName as name,
        Description as description, Status as status, CreatedAt as createdAt
      FROM Department ${whereClause} ORDER BY DepartmentID DESC LIMIT ? OFFSET ?
    `;
    const results = await executeQuery(sql, [...queryParams, limit, offset]);
    const formattedResults = results.map(item => ({ ...item, createdAt: formatDateTime(item.createdAt) }));

    res.json(successResponse({ items: formattedResults, total, page: parseInt(page), pageSize: limit }));
  } catch (error) {
    res.status(500).json(errorResponse('获取部门列表失败'));
  }
});

router.post('/api/departments', async (req, res) => {
  try {
    const { code, name, description, status = 1 } = req.body;
    const validation = validateRequired({ code, name }, ['code', 'name']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT DepartmentID FROM Department WHERE DepartmentCode = ?', [code]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('部门编码已存在', 400));

    await executeQuery(
      `INSERT INTO Department (DepartmentCode, DepartmentName, Description, Status, CreatedAt) VALUES (?, ?, ?, ?, NOW())`,
      [code, name, description || '', status]
    );
    res.json(successResponse(null, '部门创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse('创建部门失败'));
  }
});

router.put('/api/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, description, status } = req.body;
    const validation = validateRequired({ code, name }, ['code', 'name']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT DepartmentID FROM Department WHERE DepartmentCode = ? AND DepartmentID != ?', [code, id]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('部门编码已被其他部门使用', 400));

    await executeQuery(
      `UPDATE Department SET DepartmentCode = ?, DepartmentName = ?, Description = ?, Status = ?, UpdatedAt = NOW() WHERE DepartmentID = ?`,
      [code, name, description || '', status !== undefined ? status : 1, id]
    );
    res.json(successResponse(null, '部门更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse('更新部门失败'));
  }
});

router.delete('/api/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // const checkRel = await executeQuery('SELECT OutboundID FROM RawMaterialOutbound WHERE DepartmentID = ? LIMIT 1', [id]);
    // if (checkRel.length > 0) return res.status(400).json(errorResponse('该部门已有领料记录，无法删除', 400));

    await executeQuery('DELETE FROM Department WHERE DepartmentID = ?', [id]);
    res.json(successResponse(null, '部门删除成功'));
  } catch (error) {
    res.status(500).json(errorResponse('删除部门失败'));
  }
});


module.exports = router;
