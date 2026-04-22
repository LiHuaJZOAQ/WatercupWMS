const express = require('express');
const { json, urlencoded } = require('body-parser');
const cors = require('cors');
const { createPool } = require('mysql2/promise');
const { compare } = require('bcrypt');
const { verify, sign } = require('jsonwebtoken');
const moment = require('moment');
const ExcelJS = require('exceljs');

const app = express();
const port = 3000;

// 中间件配置
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

// 数据库连接池配置
const pool = createPool({
  host: 'localhost',
  user: 'root',
  password: 'root', // 请修改为你的MySQL密码
  database: 'watercup_wms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+08:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

// JWT密钥
const JWT_SECRET = 'watercup_wms_secret_key';

// ====================================
// 通用工具函数
// ====================================

// 统一响应格式
const createResponse = (success, data = null, message = '', code = 200) => {
  return {
    code: success ? 200 : (code || 500),
    message: message || (success ? '操作成功' : '操作失败'),
    data: data,
    timestamp: new Date().toISOString()
  };
};

// 成功响应
const successResponse = (data = null, message = '操作成功') => 
  createResponse(true, data, message, 200);

// 错误响应
const errorResponse = (message = '操作失败', code = 500, data = null) => 
  createResponse(false, data, message, code);

// 日期格式化
const formatDateTime = (date) => {
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

// 参数验证
const validateRequired = (params, requiredFields) => {
  const missing = requiredFields.filter(field => !params[field]);
  return missing.length > 0 ? `缺少必填参数: ${missing.join(', ')}` : null;
};

// 数据库查询封装
const executeQuery = async (sql, params = []) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    connection.release();
  }
};

// 事务执行封装
const executeTransaction = async (operations) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const operation of operations) {
      const result = await connection.execute(operation.sql, operation.params || []);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// // 验证Token中间件
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];
  
//   if (!token) {
//     return res.status(401).json(errorResponse('未提供认证令牌', 401));
//   }

//   verify(token, JWT_SECRET, (err, user) => {
//     if (err) {
//       return res.status(403).json(errorResponse('令牌无效或已过期', 403));
//     }
//     req.user = user;
//     next();
//   });
// };

// ====================================
// 基础接口
// ====================================

// 测试数据库连接
app.get('/api/test', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json(successResponse(null, '数据库连接成功'));
  } catch (error) {
    console.error('数据库连接失败:', error);
    res.status(500).json(errorResponse('数据库连接失败'));
  }
});

// 健康检查接口
app.get('/health', async (req, res) => {
  try {
    await executeQuery('SELECT 1');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// ====================================
// 用户认证接口
// ====================================

// 用户登录
app.post('/api/users/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }

  try {
    // 查询用户
    const [rows] = await pool.execute(
      'SELECT UserID, Username, PasswordHash, FullName, Email, Department, Position FROM User WHERE Username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const user = rows[0];
    
    // 验证密码 (假设密码已经使用bcrypt加密)
    // 注意：如果数据库中的密码没有使用bcrypt加密，需要调整此逻辑
    const passwordMatch = await compare(password, user.PasswordHash);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 更新最后登录时间
    await pool.execute(
      'UPDATE User SET LastLoginTime = NOW() WHERE UserID = ?',
      [user.UserID]
    );

    // 生成JWT令牌
    const token = sign(
      { 
        id: user.UserID, 
        username: user.Username,
        fullName: user.FullName,
        email: user.Email,
        department: user.Department,
        position: user.Position
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 返回用户信息和令牌
    res.status(200).json({
      message: '登录成功',
      user: {
        id: user.UserID,
        name: user.FullName || user.Username,
        email: user.Email,
        department: user.Department,
        position: user.Position
      },
      token
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '登录失败', error: error.message });
  }
});

// 获取用户信息
app.get('/api/users/info',  async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT UserID, Username, FullName, Email, Department, Position FROM User WHERE UserID = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json(errorResponse('用户不存在', 404));
    }

    const user = rows[0];
    res.json(successResponse({
      id: user.UserID,
      username: user.Username,
      name: user.FullName,
      email: user.Email,
      department: user.Department,
      position: user.Position
    }));
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json(errorResponse('获取用户信息失败'));
  }
});

// ====================================
// 入库接口 - 完整版本
// ====================================

// 1. 获取筛选选项
app.get('/api/inbound-orders/options',  async (req, res) => {
  try {
    console.log('获取筛选选项 - 开始');
    
    // 并行查询所有选项数据
    const [
      suppliers,
      manufacturers,
      warehouses,
      materials,
      materialCodes,
      batchNumbers,
      inboundNumbers
    ] = await Promise.all([
      // 供应商列表
      executeQuery(`
        SELECT SupplierCode as value, SupplierName as label 
        FROM Supplier 
        WHERE Status = 1 
        ORDER BY SupplierName
      `),
      
      // 生产商（加工厂）列表  
      executeQuery(`
        SELECT FactoryCode as value, FactoryName as label 
        FROM ProcessingFactory 
        WHERE Status = 1 
        ORDER BY FactoryName
      `),
      
      // 仓库列表
      executeQuery(`
        SELECT WarehouseCode as value, WarehouseName as label 
        FROM Warehouse 
        WHERE Status = 1 
        ORDER BY WarehouseName
      `),
      
      // 原材料名称列表
      executeQuery(`
        SELECT MaterialCode as value, MaterialName as label 
        FROM RawMaterial 
        WHERE Status = 1 
        ORDER BY MaterialName
      `),
      
      // 原材料编号列表
      executeQuery(`
        SELECT DISTINCT MaterialCode as value, MaterialCode as label 
        FROM RawMaterial 
        WHERE Status = 1 
        ORDER BY MaterialCode
      `),
      
      // 批次号列表（最近100个）
      executeQuery(`
        SELECT DISTINCT BatchNumber as value, BatchNumber as label 
        FROM RawMaterialInboundDetail 
        WHERE BatchNumber IS NOT NULL AND BatchNumber != ''
        ORDER BY BatchNumber DESC 
        LIMIT 100
      `),
      
      // 入库单号列表（最近100个）
      executeQuery(`
        SELECT DISTINCT InboundNumber as value, InboundNumber as label 
        FROM RawMaterialInbound 
        ORDER BY InboundNumber DESC 
        LIMIT 100
      `)
    ]);

    const options = {
      // 订单状态选项
      orderStatus: [
        { value: "", label: "全部" },
        { value: "Draft", label: "草稿" },
        { value: "Pending", label: "待审核" },
        { value: "Completed", label: "已完成" },
        { value: "Cancelled", label: "已取消" }
      ],
      
      // 入库单号
      warehouseReceiptNos: inboundNumbers,
      
      // 来源单号（使用入库单号）
      sourceDocNos: inboundNumbers,
      
      // 原材料名称
      materialNames: materials,
      
      // 原材料编号
      materialNos: materialCodes,
      
      // 批次号
      batchNos: batchNumbers,
      
      // 仓库
      warehouses: warehouses,
      
      // 入库类型
      warehouseTypes: [
        { value: "Purchase", label: "采购入库" },
        { value: "Return", label: "退货入库" },
        { value: "Transfer", label: "调拨入库" },
        { value: "Production", label: "生产入库" },
        { value: "Other", label: "其他入库" }
      ],
      
      // 入库方式
      warehouseMethods: [
        { value: "Normal", label: "普通入库" },
        { value: "Urgent", label: "紧急入库" },
        { value: "Direct", label: "直接入库" },
        { value: "Batch", label: "批量入库" }
      ],
      
      // 供应商
      suppliers: suppliers,
      
      // 生产商
      manufacturers: manufacturers
    };

    console.log('获取筛选选项 - 成功');
    res.json(options);
    
  } catch (error) {
    console.error('获取筛选选项失败:', error);
    res.status(500).json(errorResponse('获取筛选选项失败'));
  }
});

// 2. 获取入库单列表
app.get('/api/inbound-orders',  async (req, res) => {
  try {
    console.log('获取入库单列表 - 参数:', req.query);
    
    const {
      page = 1,
      pageSize = 20,
      orderStatus,
      warehouseReceiptNo,
      sourceDocNo,
      materialName,
      materialNo,
      batchNo,
      warehouse,
      warehouseType,
      warehouseMethod,
      supplier,
      manufacturer,
      startDate,
      endDate
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

    // 状态筛选
    if (orderStatus && orderStatus.trim()) {
      whereConditions.push('ri.Status = ?');
      queryParams.push(orderStatus.trim());
    }

    // 入库单号筛选
    if (warehouseReceiptNo && warehouseReceiptNo.trim()) {
      whereConditions.push('ri.InboundNumber LIKE ?');
      queryParams.push(`%${warehouseReceiptNo.trim()}%`);
    }

    // 来源单号筛选
    if (sourceDocNo && sourceDocNo.trim()) {
      whereConditions.push('ri.InboundNumber LIKE ?');
      queryParams.push(`%${sourceDocNo.trim()}%`);
    }

    // 原材料名称筛选
    if (materialName && materialName.trim()) {
      whereConditions.push(`
        EXISTS (
          SELECT 1 FROM RawMaterialInboundDetail rid 
          JOIN RawMaterial rm ON rid.RawMaterialID = rm.MaterialID 
          WHERE rid.InboundID = ri.InboundID 
          AND rm.MaterialName LIKE ?
        )
      `);
      queryParams.push(`%${materialName.trim()}%`);
    }

    // 原材料编号筛选
    if (materialNo && materialNo.trim()) {
      whereConditions.push(`
        EXISTS (
          SELECT 1 FROM RawMaterialInboundDetail rid 
          JOIN RawMaterial rm ON rid.RawMaterialID = rm.MaterialID 
          WHERE rid.InboundID = ri.InboundID 
          AND rm.MaterialCode LIKE ?
        )
      `);
      queryParams.push(`%${materialNo.trim()}%`);
    }

    // 批次号筛选
    if (batchNo && batchNo.trim()) {
      whereConditions.push(`
        EXISTS (
          SELECT 1 FROM RawMaterialInboundDetail rid 
          WHERE rid.InboundID = ri.InboundID 
          AND rid.BatchNumber LIKE ?
        )
      `);
      queryParams.push(`%${batchNo.trim()}%`);
    }

    // 仓库筛选
    if (warehouse && warehouse.trim()) {
      whereConditions.push('w.WarehouseCode = ?');
      queryParams.push(warehouse.trim());
    }

    // 供应商筛选
    if (supplier && supplier.trim()) {
      whereConditions.push('s.SupplierCode = ?');
      queryParams.push(supplier.trim());
    }

    // 日期范围筛选
    if (startDate && startDate.trim()) {
      whereConditions.push('ri.InboundDate >= ?');
      queryParams.push(startDate.trim());
    }

    if (endDate && endDate.trim()) {
      whereConditions.push('ri.InboundDate <= ?');
      queryParams.push(endDate.trim());
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询总记录数
    const countSql = `
      SELECT COUNT(DISTINCT ri.InboundID) as total
      FROM RawMaterialInbound ri
      LEFT JOIN Supplier s ON ri.SupplierID = s.SupplierID
      LEFT JOIN Warehouse w ON ri.WarehouseID = w.WarehouseID
      WHERE ${whereClause}
    `;

    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0]?.total || 0;

    // 查询列表数据
    const offset = (pageNum - 1) * size;
    const listSql = `
      SELECT DISTINCT
        ri.InboundID as id,
        ri.InboundNumber as warehouseReceiptNo,
        COALESCE(summary.totalQuantity, 0) as receivedQuantity,
        0 as receivedGrossWeight,
        0 as receivedNetWeight,
        s.SupplierName as supplierName,
        s.SupplierName as manufacturerName,
        ri.CreatedAt as orderDate,
        ri.InboundDate as warehouseDate,
        ri.Status as status,
        w.WarehouseName as warehouseName,
        ri.TotalAmount as totalAmount,
        ri.Remarks as remarks
      FROM RawMaterialInbound ri
      LEFT JOIN Supplier s ON ri.SupplierID = s.SupplierID
      LEFT JOIN Warehouse w ON ri.WarehouseID = w.WarehouseID
      LEFT JOIN (
        SELECT 
          InboundID,
          SUM(Quantity) as totalQuantity
        FROM RawMaterialInboundDetail
        GROUP BY InboundID
      ) summary ON ri.InboundID = summary.InboundID
      WHERE ${whereClause}
      ORDER BY ri.InboundDate DESC, ri.InboundID DESC
      LIMIT ? OFFSET ?
    `;

    const listParams = [...queryParams, size, offset];
    const listResult = await executeQuery(listSql, listParams);

    // 格式化返回数据
    const list = listResult.map(item => ({
      ...item,
      orderDate: formatDateTime(item.orderDate),
      warehouseDate: formatDateTime(item.warehouseDate),
      receivedQuantity: parseFloat(item.receivedQuantity) || 0,
      totalAmount: parseFloat(item.totalAmount) || 0
    }));

    const response = {
      list: list,
      total: total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size)
    };

    console.log(`获取入库单列表 - 成功, 共${total}条记录`);
    res.json(response);

  } catch (error) {
    console.error('获取入库单列表失败:', error);
    res.status(500).json(errorResponse('获取入库单列表失败'));
  }
});

// 3. 导出入库单
app.get('/api/inbound-orders/export',  async (req, res) => {
  try {
    console.log('导出入库单 - 开始');
    
    // 使用与列表相同的筛选条件
    const {
      orderStatus,
      warehouseReceiptNo,
      sourceDocNo,
      materialName,
      materialNo,
      batchNo,
      warehouse,
      supplier,
      startDate,
      endDate
    } = req.query;

    // 构建查询条件（复用列表接口逻辑）
    let whereConditions = ['1 = 1'];
    let queryParams = [];

    if (orderStatus?.trim()) {
      whereConditions.push('ri.Status = ?');
      queryParams.push(orderStatus.trim());
    }

    if (warehouseReceiptNo?.trim()) {
      whereConditions.push('ri.InboundNumber LIKE ?');
      queryParams.push(`%${warehouseReceiptNo.trim()}%`);
    }

    if (warehouse?.trim()) {
      whereConditions.push('w.WarehouseCode = ?');
      queryParams.push(warehouse.trim());
    }

    if (supplier?.trim()) {
      whereConditions.push('s.SupplierCode = ?');
      queryParams.push(supplier.trim());
    }

    if (startDate?.trim()) {
      whereConditions.push('ri.InboundDate >= ?');
      queryParams.push(startDate.trim());
    }

    if (endDate?.trim()) {
      whereConditions.push('ri.InboundDate <= ?');
      queryParams.push(endDate.trim());
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询导出数据（不分页）
    const exportSql = `
      SELECT 
        ri.InboundNumber as '入库单号',
        s.SupplierName as '供应商名称',
        w.WarehouseName as '入库仓库',
        CASE ri.Status 
          WHEN 'Draft' THEN '草稿'
          WHEN 'Pending' THEN '待审核'
          WHEN 'Completed' THEN '已完成'
          WHEN 'Cancelled' THEN '已取消'
          ELSE ri.Status
        END as '状态',
        ri.InboundDate as '入库日期',
        ri.CreatedAt as '创建时间',
        COALESCE(summary.totalQuantity, 0) as '入库总数量',
        ri.TotalAmount as '总金额',
        ri.Remarks as '备注说明'
      FROM RawMaterialInbound ri
      LEFT JOIN Supplier s ON ri.SupplierID = s.SupplierID
      LEFT JOIN Warehouse w ON ri.WarehouseID = w.WarehouseID
      LEFT JOIN (
        SELECT 
          InboundID,
          SUM(Quantity) as totalQuantity
        FROM RawMaterialInboundDetail
        GROUP BY InboundID
      ) summary ON ri.InboundID = summary.InboundID
      WHERE ${whereClause}
      ORDER BY ri.InboundDate DESC, ri.InboundID DESC
      LIMIT 10000
    `;

    const exportData = await executeQuery(exportSql, queryParams);

    // 创建Excel工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('入库单列表');

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
          if (header.includes('日期') || header.includes('时间')) {
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
    const fileName = `入库单列表_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    // 输出Excel文件
    await workbook.xlsx.write(res);
    res.end();

    console.log(`导出入库单 - 成功, 导出${exportData.length}条记录`);

  } catch (error) {
    console.error('导出入库单失败:', error);
    if (!res.headersSent) {
      res.status(500).json(errorResponse('导出入库单失败'));
    }
  }
});

// 4. 审核入库单
app.put('/api/inbound-orders/audit',  async (req, res) => {
  try {
    console.log('审核入库单 - 参数:', req.body);
    
    const { ids, status, reason } = req.body;

    // 参数验证
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(errorResponse('请选择要审核的入库单', 400));
    }

    if (!['Completed', 'approved', 'Cancelled', 'rejected'].includes(status)) {
      return res.status(400).json(errorResponse('审核状态无效，只能审核通过或拒绝', 400));
    }

    if (['Cancelled', 'rejected'].includes(status) && (!reason || !reason.trim())) {
      return res.status(400).json(errorResponse('拒绝审核时必须填写拒绝原因', 400));
    }

    // 标准化状态
    const finalStatus = ['approved', 'Completed'].includes(status) ? 'Completed' : 'Cancelled';

    let successCount = 0;
    let failCount = 0;
    const failDetails = [];

    // 批量处理审核
    for (const id of ids) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // 检查入库单状态
        const [checkResult] = await connection.execute(
          'SELECT InboundID, Status, InboundNumber FROM RawMaterialInbound WHERE InboundID = ?',
          [id]
        );

        if (checkResult.length === 0) {
          failCount++;
          failDetails.push(`入库单ID ${id} 不存在`);
          continue;
        }

        const inbound = checkResult[0];
        if (inbound.Status !== 'Pending') {
          failCount++;
          failDetails.push(`入库单 ${inbound.InboundNumber} 状态不是待审核，无法审核`);
          continue;
        }

        // 更新入库单状态
        const updateRemark = reason ? 
          `${inbound.Remarks || ''} [审核意见: ${reason.trim()}]`.trim() : 
          inbound.Remarks;

        await connection.execute(
          `UPDATE RawMaterialInbound 
           SET Status = ?, Remarks = ?, UpdatedAt = CURRENT_TIMESTAMP
           WHERE InboundID = ?`,
          [finalStatus, updateRemark, id]
        );

        // 如果审核通过，更新库存
        if (finalStatus === 'Completed') {
          // 获取入库单明细
          const [details] = await connection.execute(
            `SELECT 
              d.RawMaterialID, 
              d.Quantity, 
              d.BatchNumber, 
              i.WarehouseID
            FROM 
              RawMaterialInboundDetail d
              JOIN RawMaterialInbound i ON d.InboundID = i.InboundID
            WHERE 
              d.InboundID = ?`,
            [id]
          );

          // 为每个明细更新库存
          for (const detail of details) {
            // 查找默认库位
            const [locations] = await connection.execute(
              `SELECT LocationID FROM Location 
               WHERE WarehouseID = ? AND LocationType = 'Raw' AND Status = 1 
               LIMIT 1`,
              [detail.WarehouseID]
            );

            let locationId;
            if (locations.length > 0) {
              locationId = locations[0].LocationID;
            } else {
              // 创建默认库位
              locationId = `RAW-${detail.WarehouseID}-DEFAULT`;
              try {
                await connection.execute(
                  `INSERT INTO Location 
                   (LocationID, WarehouseID, LocationName, LocationType, Capacity, Status) 
                   VALUES (?, ?, ?, 'Raw', 1000, 1)`,
                  [locationId, detail.WarehouseID, '原材料默认库位']
                );
              } catch (err) {
                // 库位可能已存在，忽略错误
              }
            }

            // 检查是否已存在该物料的库存记录
            const [inventory] = await connection.execute(
              `SELECT InventoryID, CurrentQuantity FROM Inventory 
               WHERE ItemType = 'RawMaterial' AND ItemID = ? AND LocationID = ? AND BatchNumber = ?`,
              [detail.RawMaterialID, locationId, detail.BatchNumber || '']
            );

            if (inventory.length > 0) {
              // 更新现有库存
              const newQuantity = parseFloat(inventory[0].CurrentQuantity) + parseFloat(detail.Quantity);
              await connection.execute(
                `UPDATE Inventory SET 
                 CurrentQuantity = ?, 
                 AvailableQuantity = ?, 
                 LastInboundDate = NOW(), 
                 UpdatedAt = NOW() 
                 WHERE InventoryID = ?`,
                [newQuantity, newQuantity, inventory[0].InventoryID]
              );

              // 记录库存变动
              await connection.execute(
                `INSERT INTO InventoryTransaction 
                 (InventoryID, TransactionType, ReferenceType, ReferenceID, 
                  QuantityBefore, QuantityChange, QuantityAfter, 
                  TransactionDate, OperatorUserID) 
                 VALUES (?, 'Inbound', 'RawMaterialInbound', ?, ?, ?, ?, NOW(), ?)`,
                [
                  inventory[0].InventoryID, 
                  id, 
                  inventory[0].CurrentQuantity, 
                  detail.Quantity, 
                  newQuantity, 
                  req.user.id
                ]
              );
            } else {
              // 创建新的库存记录
              const [newInventory] = await connection.execute(
                `INSERT INTO Inventory 
                 (ItemType, ItemID, LocationID, BatchNumber, 
                  CurrentQuantity, AvailableQuantity, LastInboundDate) 
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [
                  'RawMaterial', 
                  detail.RawMaterialID, 
                  locationId, 
                  detail.BatchNumber || '', 
                  detail.Quantity, 
                  detail.Quantity
                ]
              );

              // 记录库存变动
              await connection.execute(
                `INSERT INTO InventoryTransaction 
                 (InventoryID, TransactionType, ReferenceType, ReferenceID, 
                  QuantityBefore, QuantityChange, QuantityAfter, 
                  TransactionDate, OperatorUserID) 
                 VALUES (?, 'Inbound', 'RawMaterialInbound', ?, ?, ?, ?, NOW(), ?)`,
                [
                  newInventory.insertId, 
                  id, 
                  0, 
                  detail.Quantity, 
                  detail.Quantity, 
                  req.user.id
                ]
              );
            }
          }
        }

        await connection.commit();
        successCount++;
        
        console.log(`入库单 ${inbound.InboundNumber} 审核成功: ${finalStatus}`);

      } catch (error) {
        await connection.rollback();
        failCount++;
        failDetails.push(`入库单ID ${id} 审核失败: ${error.message}`);
        console.error(`审核入库单 ${id} 失败:`, error);
      } finally {
        connection.release();
      }
    }

    const result = {
      successCount,
      failCount,
      details: failDetails
    };

    const message = `审核完成: 成功${successCount}个，失败${failCount}个`;
    console.log('审核入库单 - 完成:', result);
    
    res.json(successResponse(result, message));

  } catch (error) {
    console.error('审核入库单失败:', error);
    res.status(500).json(errorResponse('审核入库单失败'));
  }
});

// 5. 撤销入库单
app.put('/api/inbound-orders/revoke',  async (req, res) => {
  try {
    console.log('撤销入库单 - 参数:', req.body);
    
    const { ids } = req.body;

    // 参数验证
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(errorResponse('请选择要撤销的入库单', 400));
    }

    let successCount = 0;
    let failCount = 0;
    const failDetails = [];

    // 批量处理撤销
    for (const id of ids) {
      try {
        // 检查入库单状态
        const checkResult = await executeQuery(
          'SELECT InboundID, Status, InboundNumber FROM RawMaterialInbound WHERE InboundID = ?',
          [id]
        );

        if (checkResult.length === 0) {
          failCount++;
          failDetails.push(`入库单ID ${id} 不存在`);
          continue;
        }

        const inbound = checkResult[0];
        if (inbound.Status === 'Completed') {
          failCount++;
          failDetails.push(`入库单 ${inbound.InboundNumber} 已完成，无法撤销`);
          continue;
        }

        if (inbound.Status === 'Cancelled') {
          failCount++;
          failDetails.push(`入库单 ${inbound.InboundNumber} 已取消，无需重复撤销`);
          continue;
        }

        // 撤销入库单
        await executeQuery(
          'UPDATE RawMaterialInbound SET Status = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE InboundID = ?',
          ['Cancelled', id]
        );

        successCount++;
        console.log(`入库单 ${inbound.InboundNumber} 撤销成功`);

      } catch (error) {
        failCount++;
        failDetails.push(`入库单ID ${id} 撤销失败: ${error.message}`);
        console.error(`撤销入库单 ${id} 失败:`, error);
      }
    }

    const result = {
      successCount,
      failCount,
      details: failDetails
    };

    const message = `撤销完成: 成功${successCount}个，失败${failCount}个`;
    console.log('撤销入库单 - 完成:', result);
    
    res.json(successResponse(result, message));

  } catch (error) {
    console.error('撤销入库单失败:', error);
    res.status(500).json(errorResponse('撤销入库单失败'));
  }
});

// 6. 获取打印数据
app.get('/api/inbound-orders/:id/print',  async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`获取打印数据 - 入库单ID: ${id}`);

    // 参数验证
    if (!id || isNaN(id)) {
      return res.status(400).json(errorResponse('入库单ID无效', 400));
    }

    // 获取入库单主信息
    const inboundSql = `
      SELECT 
        ri.InboundID as id,
        ri.InboundNumber as warehouseReceiptNo,
        ri.InboundDate,
        ri.Status,
        ri.Remarks,
        ri.TotalAmount,
        s.SupplierName,
        s.SupplierCode,
        s.ContactPerson as supplierContact,
        s.ContactPhone as supplierPhone,
        w.WarehouseName,
        w.WarehouseCode,
        u.FullName as operatorName,
        u.Username as operatorCode
      FROM RawMaterialInbound ri
      LEFT JOIN Supplier s ON ri.SupplierID = s.SupplierID
      LEFT JOIN Warehouse w ON ri.WarehouseID = w.WarehouseID
      LEFT JOIN User u ON ri.OperatorUserID = u.UserID
      WHERE ri.InboundID = ?
    `;

    const inboundResult = await executeQuery(inboundSql, [id]);

    if (inboundResult.length === 0) {
      return res.status(404).json(errorResponse('入库单不存在', 404));
    }

    // 获取入库单明细
    const detailsSql = `
      SELECT 
        rm.MaterialName as materialName,
        rm.MaterialCode as materialCode,
        rm.Specification as specification,
        rid.Quantity as quantity,
        rm.Unit as unit,
        rid.BatchNumber,
        rid.UnitPrice,
        rid.Amount,
        rid.QualityStatus,
        rid.Remarks as detailRemarks,
        rid.ProductionDate,
        rid.ExpiryDate
      FROM RawMaterialInboundDetail rid
      LEFT JOIN RawMaterial rm ON rid.RawMaterialID = rm.MaterialID
      WHERE rid.InboundID = ?
      ORDER BY rid.DetailID
    `;

    const detailsResult = await executeQuery(detailsSql, [id]);

    // 组装打印数据
    const printData = {
      ...inboundResult[0],
      InboundDate: formatDateTime(inboundResult[0].InboundDate),
      details: detailsResult.map(detail => ({
        ...detail,
        quantity: parseFloat(detail.quantity) || 0,
        UnitPrice: parseFloat(detail.UnitPrice) || 0,
        Amount: parseFloat(detail.Amount) || 0,
        ProductionDate: detail.ProductionDate ? moment(detail.ProductionDate).format('YYYY-MM-DD') : null,
        ExpiryDate: detail.ExpiryDate ? moment(detail.ExpiryDate).format('YYYY-MM-DD') : null
      })),
      printTime: formatDateTime(new Date()),
      printUser: req.user.fullName || req.user.username,
      totalQuantity: detailsResult.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0),
      totalAmount: parseFloat(inboundResult[0].TotalAmount) || 0
    };

    console.log(`获取打印数据 - 成功, 入库单: ${printData.warehouseReceiptNo}`);
    res.json(printData);

  } catch (error) {
    console.error('获取打印数据失败:', error);
    res.status(500).json(errorResponse('获取打印数据失败'));
  }
});

// 7. 获取新建入库单选项
app.get('/api/inbound-orders/create-options',  async (req, res) => {
  try {
    console.log('获取新建入库单选项 - 开始');

    // 并行查询所有选项数据
    const [
      suppliers,
      manufacturers,
      warehouses,
      materials
    ] = await Promise.all([
      // 供应商列表
      executeQuery(`
        SELECT SupplierID as value, SupplierName as label, SupplierCode
        FROM Supplier 
        WHERE Status = 1 
        ORDER BY SupplierName
      `),
      
      // 生产商（加工厂）列表
      executeQuery(`
        SELECT FactoryID as value, FactoryName as label, FactoryCode
        FROM ProcessingFactory 
        WHERE Status = 1 
        ORDER BY FactoryName
      `),
      
      // 仓库列表
      executeQuery(`
        SELECT WarehouseID as value, WarehouseName as label, WarehouseCode
        FROM Warehouse 
        WHERE Status = 1 
        ORDER BY WarehouseName
      `),
      
      // 原材料列表
      executeQuery(`
        SELECT 
          MaterialID,
          MaterialCode as materialNo,
          MaterialName as materialName,
          Specification as specification,
          Unit as unit,
          Category as category,
          Description as description
        FROM RawMaterial 
        WHERE Status = 1 
        ORDER BY MaterialName
      `)
    ]);

    const options = {
      // 入库类型
      warehouseTypes: [
        { value: "purchase", label: "采购入库" },
        { value: "return", label: "退货入库" },
        { value: "transfer", label: "调拨入库" },
        { value: "production", label: "生产入库" },
        { value: "other", label: "其他入库" }
      ],
      
      // 仓库列表
      warehouses: warehouses,
      
      // 入库方式
      warehouseMethods: [
        { value: "normal", label: "普通入库" },
        { value: "urgent", label: "紧急入库" },
        { value: "direct", label: "直接入库" },
        { value: "batch", label: "批量入库" }
      ],
      
      // 供应商列表
      suppliers: suppliers,
      
      // 生产商列表
      manufacturers: manufacturers,
      
      // 原材料列表
      materials: materials
    };

    console.log('获取新建入库单选项 - 成功');
    res.json(options);

  } catch (error) {
    console.error('获取新建入库单选项失败:', error);
    res.status(500).json(errorResponse('获取新建入库单选项失败'));
  }
});

// 8. 创建入库单
app.post('/api/inbound-orders',  async (req, res) => {
  try {
    console.log('创建入库单 - 参数:', req.body);
    
    const {
      warehouseReceiptNo,
      warehouseType,
      warehouse,
      warehouseMethod,
      supplier,
      manufacturer,
      remark,
      details
    } = req.body;

    // 参数验证
    if (!warehouse || !supplier) {
      return res.status(400).json(errorResponse('仓库和供应商不能为空', 400));
    }

    if (!details || !Array.isArray(details) || details.length === 0) {
      return res.status(400).json(errorResponse('请添加入库明细', 400));
    }

    // 验证明细数据
    for (let i = 0; i < details.length; i++) {
      const detail = details[i];
      
      if (!detail.materialNo && !detail.materialId) {
        return res.status(400).json(errorResponse(`第${i + 1}行明细: 缺少原材料信息`, 400));
      }
      
      const quantity = detail.expectedQuantity || detail.quantity;
      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json(errorResponse(`第${i + 1}行明细: 数量必须大于0`, 400));
      }
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 生成入库单号（如果没有提供）
      let finalInboundNumber = warehouseReceiptNo;
      if (!finalInboundNumber || finalInboundNumber.trim() === '') {
        finalInboundNumber = `RI${moment().format('YYYYMMDD')}${String(Date.now()).slice(-6)}`;
      }

      // 检查入库单号是否已存在
      const [existsResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM RawMaterialInbound WHERE InboundNumber = ?',
        [finalInboundNumber]
      );

      if (existsResult[0].count > 0) {
        finalInboundNumber = `RI${moment().format('YYYYMMDD')}${String(Date.now()).slice(-6)}`;
      }

      // 插入入库单主表
      const [inboundResult] = await connection.execute(
        `INSERT INTO RawMaterialInbound 
         (InboundNumber, SupplierID, WarehouseID, InboundDate, OperatorUserID, Status, Remarks) 
         VALUES (?, ?, ?, NOW(), ?, 'Pending', ?)`,
        [finalInboundNumber, supplier, warehouse, req.user.id, remark || '']
      );

      const inboundId = inboundResult.insertId;
      let totalAmount = 0;

      // 插入入库单明细
      for (const detail of details) {
        let materialId;
        
        // 获取原材料ID
        if (detail.materialId) {
          materialId = detail.materialId;
        } else {
          const [materialRows] = await connection.execute(
            'SELECT MaterialID FROM RawMaterial WHERE MaterialCode = ? AND Status = 1',
            [detail.materialNo]
          );

          if (materialRows.length === 0) {
            throw new Error(`未找到原材料: ${detail.materialNo}`);
          }
          materialId = materialRows[0].MaterialID;
        }

        const quantity = detail.expectedQuantity || detail.quantity;
        const unitPrice = parseFloat(detail.unitPrice) || 0;
        const amount = quantity * unitPrice;
        totalAmount += amount;

        // 插入明细记录
        await connection.execute(
          `INSERT INTO RawMaterialInboundDetail 
           (InboundID, RawMaterialID, Quantity, UnitPrice, Amount, BatchNumber, Remarks) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            inboundId, 
            materialId, 
            quantity, 
            unitPrice,
            amount,
            detail.batchNo || '',
            detail.remarks || ''
          ]
        );
      }

      // 更新入库单总金额
      await connection.execute(
        'UPDATE RawMaterialInbound SET TotalAmount = ? WHERE InboundID = ?',
        [totalAmount, inboundId]
      );

      await connection.commit();

      const result = {
        id: inboundId,
        warehouseReceiptNo: finalInboundNumber,
        status: 'Pending',
        totalAmount: totalAmount,
        detailCount: details.length
      };

      console.log('创建入库单 - 成功:', result);
      res.status(201).json(successResponse(result, '入库单创建成功'));

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('创建入库单失败:', error);
    res.status(500).json(errorResponse(error.message || '创建入库单失败'));
  }
});

// 9. 获取入库单详情
app.get('/api/inbound-orders/:id',  async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`获取入库单详情 - ID: ${id}`);

    if (!id || isNaN(id)) {
      return res.status(400).json(errorResponse('入库单ID无效', 400));
    }

    // 获取入库单主信息
    const inboundSql = `
      SELECT 
        ri.InboundID as id,
        ri.InboundNumber as warehouseReceiptNo,
        ri.Status as status,
        ri.InboundDate as warehouseDate,
        ri.TotalAmount,
        ri.Remarks as remark,
        ri.CreatedAt,
        ri.UpdatedAt,
        ri.WarehouseID as warehouse,
        w.WarehouseName as warehouseName,
        ri.SupplierID as supplier,
        s.SupplierName as supplierName,
        ri.OperatorUserID as operatorId,
        u.FullName as operatorName
      FROM RawMaterialInbound ri
      LEFT JOIN Warehouse w ON ri.WarehouseID = w.WarehouseID
      LEFT JOIN Supplier s ON ri.SupplierID = s.SupplierID
      LEFT JOIN User u ON ri.OperatorUserID = u.UserID
      WHERE ri.InboundID = ?
    `;

    const inboundResult = await executeQuery(inboundSql, [id]);

    if (inboundResult.length === 0) {
      return res.status(404).json(errorResponse('入库单不存在', 404));
    }

    // 获取入库单明细
    const detailsSql = `
      SELECT 
        rid.DetailID as id,
        rid.RawMaterialID as materialId,
        rm.MaterialCode as materialNo,
        rm.MaterialName as materialName,
        rm.Specification as specification,
        rm.Unit as unit,
        rid.BatchNumber as batchNo,
        rid.Quantity as quantity,
        rid.UnitPrice as unitPrice,
        rid.Amount as amount,
        rid.Remarks as remarks
      FROM RawMaterialInboundDetail rid
      LEFT JOIN RawMaterial rm ON rid.RawMaterialID = rm.MaterialID
      WHERE rid.InboundID = ?
      ORDER BY rid.DetailID
    `;

    const detailsResult = await executeQuery(detailsSql, [id]);

    // 组装详情数据
    const inboundDetail = {
      ...inboundResult[0],
      warehouseDate: formatDateTime(inboundResult[0].warehouseDate),
      CreatedAt: formatDateTime(inboundResult[0].CreatedAt),
      UpdatedAt: formatDateTime(inboundResult[0].UpdatedAt),
      TotalAmount: parseFloat(inboundResult[0].TotalAmount) || 0,
      details: detailsResult.map(detail => ({
        ...detail,
        quantity: parseFloat(detail.quantity) || 0,
        unitPrice: parseFloat(detail.unitPrice) || 0,
        amount: parseFloat(detail.amount) || 0
      })),
      totalQuantity: detailsResult.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0),
      detailCount: detailsResult.length
    };

    console.log(`获取入库单详情 - 成功, 单号: ${inboundDetail.warehouseReceiptNo}`);
    res.json(successResponse(inboundDetail));

  } catch (error) {
    console.error('获取入库单详情失败:', error);
    res.status(500).json(errorResponse('获取入库单详情失败'));
  }
});

// 10. 修改入库单
app.put('/api/inbound-orders/:id',  async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`修改入库单 - ID: ${id}`, req.body);

    if (!id || isNaN(id)) {
      return res.status(400).json(errorResponse('入库单ID无效', 400));
    }

    const {
      warehouseReceiptNo,
      warehouseType,
      warehouse,
      warehouseMethod,
      supplier,
      manufacturer,
      remark,
      details
    } = req.body;

    // 检查入库单是否存在且可编辑
    const checkResult = await executeQuery(
      'SELECT InboundID, Status, InboundNumber FROM RawMaterialInbound WHERE InboundID = ?',
      [id]
    );

    if (checkResult.length === 0) {
      return res.status(404).json(errorResponse('入库单不存在', 404));
    }

    if (!['Draft', 'Pending'].includes(checkResult[0].Status)) {
      return res.status(400).json(errorResponse('只有草稿或待审核状态的入库单可以修改', 400));
    }

    // 参数验证
    if (!warehouse || !supplier) {
      return res.status(400).json(errorResponse('仓库和供应商不能为空', 400));
    }

    if (!details || !Array.isArray(details) || details.length === 0) {
      return res.status(400).json(errorResponse('请添加入库明细', 400));
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 更新主表
      await connection.execute(
        `UPDATE RawMaterialInbound 
         SET InboundNumber = ?, SupplierID = ?, WarehouseID = ?, 
             Remarks = ?, UpdatedAt = NOW()
         WHERE InboundID = ?`,
        [warehouseReceiptNo, supplier, warehouse, remark || '', id]
      );

      // 删除原有明细
      await connection.execute(
        'DELETE FROM RawMaterialInboundDetail WHERE InboundID = ?',
        [id]
      );

      let totalAmount = 0;

      // 插入新明细
      for (const detail of details) {
        let materialId;
        
        if (detail.materialId) {
          materialId = detail.materialId;
        } else {
          const [materialRows] = await connection.execute(
            'SELECT MaterialID FROM RawMaterial WHERE MaterialCode = ? AND Status = 1',
            [detail.materialNo]
          );

          if (materialRows.length === 0) {
            throw new Error(`未找到原材料: ${detail.materialNo}`);
          }
          materialId = materialRows[0].MaterialID;
        }

        const quantity = detail.expectedQuantity || detail.quantity;
        const unitPrice = parseFloat(detail.unitPrice) || 0;
        const amount = quantity * unitPrice;
        totalAmount += amount;

        await connection.execute(
          `INSERT INTO RawMaterialInboundDetail 
           (InboundID, RawMaterialID, Quantity, UnitPrice, Amount, BatchNumber, Remarks) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id, 
            materialId, 
            quantity, 
            unitPrice,
            amount,
            detail.batchNo || detail.BatchNumber || '',
            detail.remarks || detail.Remarks || ''
          ]
        );
      }

      // 更新总金额
      await connection.execute(
        'UPDATE RawMaterialInbound SET TotalAmount = ?, UpdatedAt = NOW() WHERE InboundID = ?',
        [totalAmount, id]
      );

      await connection.commit();

      const result = {
        id: parseInt(id),
        warehouseReceiptNo: warehouseReceiptNo,
        status: checkResult[0].Status,
        totalAmount: totalAmount,
        detailCount: details.length
      };

      console.log('修改入库单 - 成功:', result);
      res.json(successResponse(result, '入库单修改成功'));

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('修改入库单失败:', error);
    res.status(500).json(errorResponse(error.message || '修改入库单失败'));
  }
});

// 11. 删除入库单
app.delete('/api/inbound-orders/:id',  async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`删除入库单 - ID: ${id}`);

    if (!id || isNaN(id)) {
      return res.status(400).json(errorResponse('入库单ID无效', 400));
    }

    // 检查入库单状态
    const checkResult = await executeQuery(
      'SELECT InboundID, Status, InboundNumber FROM RawMaterialInbound WHERE InboundID = ?',
      [id]
    );

    if (checkResult.length === 0) {
      return res.status(404).json(errorResponse('入库单不存在', 404));
    }

    if (checkResult[0].Status === 'Completed') {
      return res.status(400).json(errorResponse('已完成的入库单不能删除', 400));
    }

    // 删除入库单（明细会因为外键级联删除自动删除）
    await executeQuery('DELETE FROM RawMaterialInbound WHERE InboundID = ?', [id]);

    console.log(`删除入库单 - 成功: ${checkResult[0].InboundNumber}`);
    res.json(successResponse(null, '入库单删除成功'));

  } catch (error) {
    console.error('删除入库单失败:', error);
    res.status(500).json(errorResponse('删除入库单失败'));
  }
});



// ====================================
// 原料库存管理接口
// ====================================

// 1. 获取原料库存列表
app.get('/api/inventory/raw-materials',  async (req, res) => {
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
app.get('/api/inventory/raw-materials/:id',  async (req, res) => {
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
app.put('/api/inventory/raw-materials/:id',  async (req, res) => {
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
      status
    } = req.body;

    // 参数验证
    const validation = validateRequired({ code, name, category, unit }, ['code', 'name', 'category', 'unit']);
    if (validation) {
      return res.status(400).json(errorResponse(validation, 400));
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
           Specification = ?, Unit = ?, UpdatedAt = NOW()
       WHERE MaterialID = ?`,
      [code, name, category, specification || '', unit, id]
    );

    console.log(`更新原料信息 - 成功: ${name}`);
    res.json(successResponse({ id: parseInt(id) }, '原料信息更新成功'));

  } catch (error) {
    console.error('更新原料信息失败:', error);
    res.status(500).json(errorResponse('更新原料信息失败'));
  }
});

// 4. 删除原料
app.delete('/api/inventory/raw-materials/:id',  async (req, res) => {
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
app.post('/api/inventory/raw-materials',  async (req, res) => {
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


// ====================================
// 库位管理接口 - 基于数据库表结构重新设计
// ====================================

// 1. 获取库位列表（重写版本）
app.get('/api/locations/list',  async (req, res) => {
  try {
    console.log('获取库位列表 - 参数:', req.query);
    
    const {
      page = 1,
      pageSize = 20,
      locationCode,
      locationName,
      warehouseId,
      locationType,
      occupancyStatus
    } = req.query;

    // 参数验证
    const pageNum = parseInt(page);
    const size = parseInt(pageSize);
    if (pageNum < 1 || size < 1 || size > 1000) {
      return res.status(400).json(errorResponse('分页参数无效', 400));
    }

    // 构建查询条件
    let whereConditions = ['l.Status = 1']; // 只显示启用的库位
    let queryParams = [];

    // 库位编号搜索
    if (locationCode && locationCode.trim()) {
      whereConditions.push('l.LocationID LIKE ?');
      queryParams.push(`%${locationCode.trim()}%`);
    }

    // 库位名称搜索
    if (locationName && locationName.trim()) {
      whereConditions.push('l.LocationName LIKE ?');
      queryParams.push(`%${locationName.trim()}%`);
    }

    // 仓库筛选
    if (warehouseId && warehouseId.trim()) {
      whereConditions.push('l.WarehouseID = ?');
      queryParams.push(warehouseId.trim());
    }

    // 库位类型筛选
    if (locationType && locationType.trim()) {
      whereConditions.push('l.LocationType = ?');
      queryParams.push(locationType.trim());
    }

    // 使用状态筛选
    if (occupancyStatus && occupancyStatus.trim()) {
      switch (occupancyStatus) {
        case 'empty':
          whereConditions.push('l.CurrentOccupancy = 0');
          break;
        case 'partial':
          whereConditions.push('l.CurrentOccupancy > 0 AND l.CurrentOccupancy < l.Capacity');
          break;
        case 'full':
          whereConditions.push('l.CurrentOccupancy >= l.Capacity');
          break;
        case 'overload':
          whereConditions.push('l.CurrentOccupancy > l.Capacity');
          break;
      }
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询总记录数
    const countSql = `
      SELECT COUNT(*) as total
      FROM Location l
      LEFT JOIN Warehouse w ON l.WarehouseID = w.WarehouseID
      WHERE ${whereClause}
    `;

    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0]?.total || 0;

    // 查询列表数据
    const offset = (pageNum - 1) * size;
    const listSql = `
      SELECT 
        l.LocationID as locationCode,
        l.LocationName as locationName,
        l.WarehouseID as warehouseId,
        w.WarehouseName as warehouseName,
        l.LocationType as locationType,
        l.Zone as zone,
        l.Row as row,
        l.Col as col,
        l.Level as level,
        l.Capacity as capacity,
        l.CurrentOccupancy as currentOccupancy,
        l.IsOccupied as isOccupied,
        l.Status as status,
        l.CreatedAt,
        l.UpdatedAt
      FROM Location l
      LEFT JOIN Warehouse w ON l.WarehouseID = w.WarehouseID
      WHERE ${whereClause}
      ORDER BY l.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;

    const listParams = [...queryParams, size, offset];
    const listResult = await executeQuery(listSql, listParams);

    // 获取每个库位的原料信息
    const locationCodes = listResult.map(item => item.locationCode);
    let materialInfoMap = {};

    if (locationCodes.length > 0) {
      const materialSql = `
        SELECT 
          i.LocationID,
          rm.MaterialCode as materialCode,
          rm.MaterialName as materialName,
          rm.Unit as unit,
          i.CurrentQuantity as quantity,
          i.BatchNumber as batchNumber
        FROM Inventory i
        JOIN RawMaterial rm ON i.ItemID = rm.MaterialID
        WHERE i.ItemType = 'RawMaterial' 
          AND i.LocationID IN (${locationCodes.map(() => '?').join(',')})
          AND i.CurrentQuantity > 0
        ORDER BY i.LocationID, rm.MaterialName
      `;

      const materialResult = await executeQuery(materialSql, locationCodes);
      
      // 按库位分组原料信息
      materialResult.forEach(item => {
        if (!materialInfoMap[item.LocationID]) {
          materialInfoMap[item.LocationID] = [];
        }
        materialInfoMap[item.LocationID].push({
          materialCode: item.materialCode,
          materialName: item.materialName,
          unit: item.unit,
          quantity: parseFloat(item.quantity) || 0,
          batchNumber: item.batchNumber
        });
      });
    }

    // 格式化返回数据
    const list = listResult.map(item => ({
      ...item,
      capacity: parseFloat(item.capacity) || 0,
      currentOccupancy: parseFloat(item.currentOccupancy) || 0,
      CreatedAt: formatDateTime(item.CreatedAt),
      UpdatedAt: formatDateTime(item.UpdatedAt),
      materialInfo: materialInfoMap[item.locationCode] || []
    }));

    const response = {
      list: list,
      total: total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size)
    };

    console.log(`获取库位列表 - 成功, 共${total}条记录`);
    res.json(response);

  } catch (error) {
    console.error('获取库位列表失败:', error);
    res.status(500).json(errorResponse('获取库位列表失败'));
  }
});

// 2. 获取库位详情
app.get('/api/locations/:locationCode',  async (req, res) => {
  try {
    const { locationCode } = req.params;
    console.log(`获取库位详情 - 库位编号: ${locationCode}`);

    if (!locationCode) {
      return res.status(400).json(errorResponse('库位编号不能为空', 400));
    }

    // 获取库位基本信息
    const locationSql = `
      SELECT 
        l.LocationID as locationCode,
        l.LocationName as locationName,
        l.WarehouseID as warehouseId,
        w.WarehouseName as warehouseName,
        l.LocationType as locationType,
        l.Zone as zone,
        l.Row as row,
        l.Col as col,
        l.Level as level,
        l.Capacity as capacity,
        l.CurrentOccupancy as currentOccupancy,
        l.IsOccupied as isOccupied,
        l.Status as status,
        l.CreatedAt,
        l.UpdatedAt
      FROM Location l
      LEFT JOIN Warehouse w ON l.WarehouseID = w.WarehouseID
      WHERE l.LocationID = ?
    `;

    const locationResult = await executeQuery(locationSql, [locationCode]);

    if (locationResult.length === 0) {
      return res.status(404).json(errorResponse('库位不存在', 404));
    }

    // 获取库存明细信息
    const inventorySql = `
      SELECT 
        i.InventoryID,
        rm.MaterialCode as materialCode,
        rm.MaterialName as materialName,
        rm.Specification as specification,
        rm.Unit as unit,
        i.BatchNumber as batchNumber,
        i.CurrentQuantity as currentQuantity,
        i.AvailableQuantity as availableQuantity,
        i.ReservedQuantity as reservedQuantity,
        i.LastInboundDate as lastInboundDate,
        i.LastOutboundDate as lastOutboundDate
      FROM Inventory i
      JOIN RawMaterial rm ON i.ItemID = rm.MaterialID
      WHERE i.ItemType = 'RawMaterial' 
        AND i.LocationID = ?
        AND i.CurrentQuantity > 0
      ORDER BY rm.MaterialName
    `;

    const inventoryResult = await executeQuery(inventorySql, [locationCode]);

    const location = locationResult[0];
    const detail = {
      ...location,
      capacity: parseFloat(location.capacity) || 0,
      currentOccupancy: parseFloat(location.currentOccupancy) || 0,
      CreatedAt: formatDateTime(location.CreatedAt),
      UpdatedAt: formatDateTime(location.UpdatedAt),
      inventoryDetails: inventoryResult.map(item => ({
        ...item,
        currentQuantity: parseFloat(item.currentQuantity) || 0,
        availableQuantity: parseFloat(item.availableQuantity) || 0,
        reservedQuantity: parseFloat(item.reservedQuantity) || 0,
        lastInboundDate: item.lastInboundDate ? formatDateTime(item.lastInboundDate) : null,
        lastOutboundDate: item.lastOutboundDate ? formatDateTime(item.lastOutboundDate) : null
      }))
    };

    console.log(`获取库位详情 - 成功: ${location.locationName}`);
    res.json(successResponse(detail));

  } catch (error) {
    console.error('获取库位详情失败:', error);
    res.status(500).json(errorResponse('获取库位详情失败'));
  }
});

// 3. 新增库位
app.post('/api/locations',  async (req, res) => {
  try {
    console.log('新增库位 - 参数:', req.body);
    
    const {
      locationCode,
      locationName,
      warehouseId,
      locationType = 'Raw',
      zone,
      row,
      col,
      level,
      capacity = 1000,
      status = 1
    } = req.body;

    // 参数验证
    const validation = validateRequired({ locationCode, locationName, warehouseId }, 
      ['locationCode', 'locationName', 'warehouseId']);
    if (validation) {
      return res.status(400).json(errorResponse(validation, 400));
    }

    if (isNaN(capacity) || capacity <= 0) {
      return res.status(400).json(errorResponse('容量必须大于0', 400));
    }

    // 检查库位编号是否已存在
    const existsResult = await executeQuery(
      'SELECT COUNT(*) as count FROM Location WHERE LocationID = ?',
      [locationCode]
    );

    if (existsResult[0].count > 0) {
      return res.status(400).json(errorResponse('库位编号已存在', 400));
    }

    // 检查仓库是否存在
    const warehouseCheck = await executeQuery(
      'SELECT WarehouseID FROM Warehouse WHERE WarehouseID = ? AND Status = 1',
      [warehouseId]
    );

    if (warehouseCheck.length === 0) {
      return res.status(400).json(errorResponse('仓库不存在或已禁用', 400));
    }

    // 插入库位记录
    await executeQuery(
      `INSERT INTO Location 
       (LocationID, WarehouseID, LocationName, LocationType, Zone, Row, Col, Level, 
        Capacity, CurrentOccupancy, IsOccupied, Status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
      [locationCode, warehouseId, locationName, locationType, zone || '', 
       row || '', col || '', level || '', capacity, status]
    );

    const result = {
      locationCode,
      locationName,
      warehouseId,
      locationType,
      capacity: parseFloat(capacity)
    };

    console.log('新增库位 - 成功:', result);
    res.status(201).json(successResponse(result, '库位新增成功'));

  } catch (error) {
    console.error('新增库位失败:', error);
    res.status(500).json(errorResponse(error.message || '新增库位失败'));
  }
});

// 4. 更新库位
app.put('/api/locations/:locationCode',  async (req, res) => {
  try {
    const { locationCode } = req.params;
    console.log(`更新库位 - 库位编号: ${locationCode}`, req.body);

    if (!locationCode) {
      return res.status(400).json(errorResponse('库位编号不能为空', 400));
    }

    const {
      locationName,
      warehouseId,
      locationType,
      zone,
      row,
      col,
      level,
      capacity,
      status
    } = req.body;

    // 参数验证
    const validation = validateRequired({ locationName, warehouseId }, 
      ['locationName', 'warehouseId']);
    if (validation) {
      return res.status(400).json(errorResponse(validation, 400));
    }

    if (capacity !== undefined && (isNaN(capacity) || capacity <= 0)) {
      return res.status(400).json(errorResponse('容量必须大于0', 400));
    }

    // 检查库位是否存在
    const existsResult = await executeQuery(
      'SELECT LocationID FROM Location WHERE LocationID = ?',
      [locationCode]
    );

    if (existsResult.length === 0) {
      return res.status(404).json(errorResponse('库位不存在', 404));
    }

    // 更新库位信息
    await executeQuery(
      `UPDATE Location 
       SET LocationName = ?, WarehouseID = ?, LocationType = ?, 
           Zone = ?, Row = ?, Col = ?, Level = ?, Capacity = ?, Status = ?, 
           UpdatedAt = CURRENT_TIMESTAMP
       WHERE LocationID = ?`,
      [locationName, warehouseId, locationType || 'Raw', zone || '', 
       row || '', col || '', level || '', capacity || 1000, status || 1, locationCode]
    );

    const result = {
      locationCode,
      locationName,
      warehouseId,
      locationType,
      capacity: parseFloat(capacity) || 1000
    };

    console.log('更新库位 - 成功:', result);
    res.json(successResponse(result, '库位更新成功'));

  } catch (error) {
    console.error('更新库位失败:', error);
    res.status(500).json(errorResponse(error.message || '更新库位失败'));
  }
});

// 5. 删除库位
app.delete('/api/locations/:locationCode',  async (req, res) => {
  try {
    const { locationCode } = req.params;
    console.log(`删除库位 - 库位编号: ${locationCode}`);

    if (!locationCode) {
      return res.status(400).json(errorResponse('库位编号不能为空', 400));
    }

    // 检查库位是否存在
    const existsResult = await executeQuery(
      'SELECT LocationID, CurrentOccupancy FROM Location WHERE LocationID = ?',
      [locationCode]
    );

    if (existsResult.length === 0) {
      return res.status(404).json(errorResponse('库位不存在', 404));
    }

    // 检查库位是否有库存
    if (parseFloat(existsResult[0].CurrentOccupancy) > 0) {
      return res.status(400).json(errorResponse('库位仍有库存，无法删除', 400));
    }

    // 检查是否有库存记录
    const inventoryCheck = await executeQuery(
      'SELECT COUNT(*) as count FROM Inventory WHERE LocationID = ? AND CurrentQuantity > 0',
      [locationCode]
    );

    if (inventoryCheck[0].count > 0) {
      return res.status(400).json(errorResponse('库位仍有库存记录，无法删除', 400));
    }

    // 删除库位（软删除，设置状态为禁用）
    await executeQuery(
      'UPDATE Location SET Status = 0, UpdatedAt = CURRENT_TIMESTAMP WHERE LocationID = ?',
      [locationCode]
    );

    console.log(`删除库位 - 成功: ${locationCode}`);
    res.json(successResponse(null, '库位删除成功'));

  } catch (error) {
    console.error('删除库位失败:', error);
    res.status(500).json(errorResponse('删除库位失败'));
  }
});

// 6. 批量删除库位
app.delete('/api/locations/batch-delete',  async (req, res) => {
  try {
    const { locationCodes } = req.body;
    console.log('批量删除库位 - 库位编号:', locationCodes);

    if (!locationCodes || !Array.isArray(locationCodes) || locationCodes.length === 0) {
      return res.status(400).json(errorResponse('请选择要删除的库位', 400));
    }

    let successCount = 0;
    let failCount = 0;
    const failDetails = [];

    for (const locationCode of locationCodes) {
      try {
        // 检查库位是否存在和是否有库存
        const checkResult = await executeQuery(
          `SELECT l.LocationID, l.CurrentOccupancy,
                  COALESCE(SUM(i.CurrentQuantity), 0) as totalInventory
           FROM Location l
           LEFT JOIN Inventory i ON l.LocationID = i.LocationID AND i.CurrentQuantity > 0
           WHERE l.LocationID = ?
           GROUP BY l.LocationID, l.CurrentOccupancy`,
          [locationCode]
        );

        if (checkResult.length === 0) {
          failCount++;
          failDetails.push(`库位 ${locationCode} 不存在`);
          continue;
        }

        if (parseFloat(checkResult[0].CurrentOccupancy) > 0 || parseFloat(checkResult[0].totalInventory) > 0) {
          failCount++;
          failDetails.push(`库位 ${locationCode} 仍有库存，无法删除`);
          continue;
        }

        // 删除库位
        await executeQuery(
          'UPDATE Location SET Status = 0, UpdatedAt = CURRENT_TIMESTAMP WHERE LocationID = ?',
          [locationCode]
        );
        successCount++;

      } catch (error) {
        failCount++;
        failDetails.push(`库位 ${locationCode} 删除失败: ${error.message}`);
      }
    }

    const result = {
      successCount,
      failCount,
      details: failDetails
    };

    const message = `批量删除完成: 成功${successCount}个，失败${failCount}个`;
    console.log('批量删除库位 - 完成:', result);
    
    res.json(successResponse(result, message));

  } catch (error) {
    console.error('批量删除库位失败:', error);
    res.status(500).json(errorResponse('批量删除库位失败'));
  }
});

// 7. 更新库位状态
app.put('/api/locations/:locationCode/status',  async (req, res) => {
  try {
    const { locationCode } = req.params;
    const { status } = req.body;
    console.log(`更新库位状态 - 库位编号: ${locationCode}, 状态: ${status}`);

    if (!locationCode) {
      return res.status(400).json(errorResponse('库位编号不能为空', 400));
    }

    if (status !== 0 && status !== 1) {
      return res.status(400).json(errorResponse('状态值无效', 400));
    }

    // 检查库位是否存在
    const existsResult = await executeQuery(
      'SELECT LocationID FROM Location WHERE LocationID = ?',
      [locationCode]
    );

    if (existsResult.length === 0) {
      return res.status(404).json(errorResponse('库位不存在', 404));
    }

    // 更新状态
    await executeQuery(
      'UPDATE Location SET Status = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE LocationID = ?',
      [status, locationCode]
    );

    console.log(`更新库位状态 - 成功: ${locationCode}`);
    res.json(successResponse({ locationCode, status }, '状态更新成功'));

  } catch (error) {
    console.error('更新库位状态失败:', error);
    res.status(500).json(errorResponse('更新库位状态失败'));
  }
});

// 8. 获取仓库选项
app.get('/api/warehouses/options',  async (req, res) => {
  try {
    console.log('获取仓库选项');

    const warehouseSql = `
      SELECT 
        WarehouseID as id,
        WarehouseName as name,
        WarehouseCode as code
      FROM Warehouse 
      WHERE Status = 1 
      ORDER BY WarehouseName
    `;

    const warehouseResult = await executeQuery(warehouseSql);

    console.log(`获取仓库选项 - 成功, 共${warehouseResult.length}条记录`);
    res.json(successResponse(warehouseResult));

  } catch (error) {
    console.error('获取仓库选项失败:', error);
    res.status(500).json(errorResponse('获取仓库选项失败'));
  }
});

// 9. 导出库位数据
app.get('/api/locations/export',  async (req, res) => {
  try {
    console.log('导出库位数据 - 开始');
    
    const {
      locationCode,
      locationName,
      warehouseId,
      locationType,
      occupancyStatus
    } = req.query;

    // 构建查询条件（复用列表接口逻辑）
    let whereConditions = ['l.Status = 1'];
    let queryParams = [];

    if (locationCode?.trim()) {
      whereConditions.push('l.LocationID LIKE ?');
      queryParams.push(`%${locationCode.trim()}%`);
    }

    if (locationName?.trim()) {
      whereConditions.push('l.LocationName LIKE ?');
      queryParams.push(`%${locationName.trim()}%`);
    }

    if (warehouseId?.trim()) {
      whereConditions.push('l.WarehouseID = ?');
      queryParams.push(warehouseId.trim());
    }

    if (locationType?.trim()) {
      whereConditions.push('l.LocationType = ?');
      queryParams.push(locationType.trim());
    }

    if (occupancyStatus?.trim()) {
      switch (occupancyStatus) {
        case 'empty':
          whereConditions.push('l.CurrentOccupancy = 0');
          break;
        case 'partial':
          whereConditions.push('l.CurrentOccupancy > 0 AND l.CurrentOccupancy < l.Capacity');
          break;
        case 'full':
          whereConditions.push('l.CurrentOccupancy >= l.Capacity');
          break;
        case 'overload':
          whereConditions.push('l.CurrentOccupancy > l.Capacity');
          break;
      }
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询导出数据
    const exportSql = `
      SELECT 
        l.LocationID as '库位编号',
        l.LocationName as '库位名称',
        w.WarehouseName as '所属仓库',
        CASE l.LocationType 
          WHEN 'Raw' THEN '原材料'
          WHEN 'Finished' THEN '成品'
          WHEN 'Normal' THEN '普通'
          ELSE l.LocationType
        END as '库位类型',
        CONCAT_WS('-', 
          NULLIF(l.Zone, ''), 
          NULLIF(l.Row, ''), 
          NULLIF(l.Col, ''), 
          NULLIF(l.Level, '')
        ) as '位置信息',
        l.Capacity as '容量',
        l.CurrentOccupancy as '当前占用',
        ROUND(l.CurrentOccupancy / l.Capacity * 100, 2) as '利用率(%)',
        CASE 
          WHEN l.Status = 1 THEN '启用'
          ELSE '禁用'
        END as '状态',
        l.CreatedAt as '创建时间',
        l.UpdatedAt as '更新时间'
      FROM Location l
      LEFT JOIN Warehouse w ON l.WarehouseID = w.WarehouseID
      WHERE ${whereClause}
      ORDER BY l.CreatedAt DESC
      LIMIT 10000
    `;

    const exportData = await executeQuery(exportSql, queryParams);

    // 创建Excel工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('库位列表');

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
          if (header.includes('容量') || header.includes('占用')) {
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
    const fileName = `库位列表_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    // 输出Excel文件
    await workbook.xlsx.write(res);
    res.end();

    console.log(`导出库位数据 - 成功, 导出${exportData.length}条记录`);

  } catch (error) {
    console.error('导出库位数据失败:', error);
    if (!res.headersSent) {
      res.status(500).json(errorResponse('导出库位数据失败'));
    }
  }
});

// 10. 获取库位统计数据
app.get('/api/locations/statistics',  async (req, res) => {
  try {
    console.log('获取库位统计数据');

    // 并行查询统计数据
    const [
      overviewStats,
      typeStats,
      warehouseStats,
      utilizationStats
    ] = await Promise.all([
      // 总体统计
      executeQuery(`
        SELECT 
          COUNT(*) as totalLocations,
          COUNT(CASE WHEN Status = 1 THEN 1 END) as activeLocations,
          COUNT(CASE WHEN IsOccupied = 1 THEN 1 END) as occupiedLocations,
          COUNT(CASE WHEN CurrentOccupancy = 0 THEN 1 END) as emptyLocations,
          COUNT(CASE WHEN CurrentOccupancy > Capacity THEN 1 END) as overloadLocations,
          ROUND(AVG(CurrentOccupancy / Capacity * 100), 2) as avgUtilization
        FROM Location 
        WHERE Status = 1
      `),
      
      // 按类型统计
      executeQuery(`
        SELECT 
          LocationType,
          COUNT(*) as count,
          COUNT(CASE WHEN IsOccupied = 1 THEN 1 END) as occupiedCount,
          ROUND(AVG(CurrentOccupancy / Capacity * 100), 2) as avgUtilization
        FROM Location 
        WHERE Status = 1
        GROUP BY LocationType
        ORDER BY count DESC
      `),
      
      // 按仓库统计
      executeQuery(`
        SELECT 
          w.WarehouseName,
          COUNT(l.LocationID) as totalLocations,
          COUNT(CASE WHEN l.IsOccupied = 1 THEN 1 END) as occupiedLocations,
          ROUND(AVG(l.CurrentOccupancy / l.Capacity * 100), 2) as avgUtilization,
          SUM(l.CurrentOccupancy) as totalOccupancy,
          SUM(l.Capacity) as totalCapacity
        FROM Location l
        JOIN Warehouse w ON l.WarehouseID = w.WarehouseID
        WHERE l.Status = 1 AND w.Status = 1
        GROUP BY w.WarehouseID, w.WarehouseName
        ORDER BY totalLocations DESC
      `),
      
      // 利用率分布统计
      executeQuery(`
        SELECT 
          CASE 
            WHEN CurrentOccupancy = 0 THEN '空闲'
            WHEN CurrentOccupancy / Capacity <= 0.3 THEN '低利用率(≤30%)'
            WHEN CurrentOccupancy / Capacity <= 0.6 THEN '中等利用率(31-60%)'
            WHEN CurrentOccupancy / Capacity <= 0.9 THEN '高利用率(61-90%)'
            WHEN CurrentOccupancy / Capacity <= 1.0 THEN '满载(91-100%)'
            ELSE '超载(>100%)'
          END as utilizationRange,
          COUNT(*) as count
        FROM Location 
        WHERE Status = 1 AND Capacity > 0
        GROUP BY 
          CASE 
            WHEN CurrentOccupancy = 0 THEN '空闲'
            WHEN CurrentOccupancy / Capacity <= 0.3 THEN '低利用率(≤30%)'
            WHEN CurrentOccupancy / Capacity <= 0.6 THEN '中等利用率(31-60%)'
            WHEN CurrentOccupancy / Capacity <= 0.9 THEN '高利用率(61-90%)'
            WHEN CurrentOccupancy / Capacity <= 1.0 THEN '满载(91-100%)'
            ELSE '超载(>100%)'
          END
        ORDER BY 
          CASE 
            WHEN CurrentOccupancy = 0 THEN 1
            WHEN CurrentOccupancy / Capacity <= 0.3 THEN 2
            WHEN CurrentOccupancy / Capacity <= 0.6 THEN 3
            WHEN CurrentOccupancy / Capacity <= 0.9 THEN 4
            WHEN CurrentOccupancy / Capacity <= 1.0 THEN 5
            ELSE 6
          END
      `)
    ]);

    const statistics = {
      overview: {
        totalLocations: overviewStats[0]?.totalLocations || 0,
        activeLocations: overviewStats[0]?.activeLocations || 0,
        occupiedLocations: overviewStats[0]?.occupiedLocations || 0,
        emptyLocations: overviewStats[0]?.emptyLocations || 0,
        overloadLocations: overviewStats[0]?.overloadLocations || 0,
        avgUtilization: parseFloat(overviewStats[0]?.avgUtilization) || 0
      },
      typeDistribution: typeStats.map(item => ({
        type: item.LocationType,
        count: item.count,
        occupiedCount: item.occupiedCount,
        avgUtilization: parseFloat(item.avgUtilization) || 0
      })),
      warehouseDistribution: warehouseStats.map(item => ({
        warehouseName: item.WarehouseName,
        totalLocations: item.totalLocations,
        occupiedLocations: item.occupiedLocations,
        avgUtilization: parseFloat(item.avgUtilization) || 0,
        totalOccupancy: parseFloat(item.totalOccupancy) || 0,
        totalCapacity: parseFloat(item.totalCapacity) || 0
      })),
      utilizationDistribution: utilizationStats.map(item => ({
        range: item.utilizationRange,
        count: item.count
      }))
    };

    console.log('获取库位统计数据 - 成功');
    res.json(successResponse(statistics));

  } catch (error) {
    console.error('获取库位统计数据失败:', error);
    res.status(500).json(errorResponse('获取库位统计数据失败'));
  }
});

// 11. 库位占用情况更新（系统内部调用）
app.put('/api/locations/:locationCode/occupancy',  async (req, res) => {
  try {
    const { locationCode } = req.params;
    console.log(`更新库位占用情况 - 库位编号: ${locationCode}`);

    if (!locationCode) {
      return res.status(400).json(errorResponse('库位编号不能为空', 400));
    }

    // 重新计算库位占用情况
    const occupancySql = `
      SELECT 
        l.LocationID,
        l.Capacity,
        COALESCE(SUM(i.CurrentQuantity), 0) as totalOccupancy
      FROM Location l
      LEFT JOIN Inventory i ON l.LocationID = i.LocationID AND i.CurrentQuantity > 0
      WHERE l.LocationID = ?
      GROUP BY l.LocationID, l.Capacity
    `;

    const occupancyResult = await executeQuery(occupancySql, [locationCode]);

    if (occupancyResult.length === 0) {
      return res.status(404).json(errorResponse('库位不存在', 404));
    }

    const { totalOccupancy } = occupancyResult[0];
    const isOccupied = totalOccupancy > 0 ? 1 : 0;

    // 更新库位占用情况
    await executeQuery(
      `UPDATE Location 
       SET CurrentOccupancy = ?, IsOccupied = ?, UpdatedAt = CURRENT_TIMESTAMP
       WHERE LocationID = ?`,
      [totalOccupancy, isOccupied, locationCode]
    );

    console.log(`更新库位占用情况 - 成功: ${locationCode}, 占用量: ${totalOccupancy}`);
    res.json(successResponse({ 
      locationCode, 
      currentOccupancy: parseFloat(totalOccupancy),
      isOccupied 
    }, '库位占用情况更新成功'));

  } catch (error) {
    console.error('更新库位占用情况失败:', error);
    res.status(500).json(errorResponse('更新库位占用情况失败'));
  }
});

// 12. 批量更新库位占用情况（定时任务或手动触发）
app.post('/api/locations/refresh-occupancy',  async (req, res) => {
  try {
    console.log('批量更新库位占用情况 - 开始');

    // 获取所有库位的实际占用情况
    const refreshSql = `
      UPDATE Location l
      LEFT JOIN (
        SELECT 
          LocationID,
          SUM(CurrentQuantity) as totalOccupancy
        FROM Inventory 
        WHERE CurrentQuantity > 0
        GROUP BY LocationID
      ) occupancy ON l.LocationID = occupancy.LocationID
      SET 
        l.CurrentOccupancy = COALESCE(occupancy.totalOccupancy, 0),
        l.IsOccupied = CASE WHEN COALESCE(occupancy.totalOccupancy, 0) > 0 THEN 1 ELSE 0 END,
        l.UpdatedAt = CURRENT_TIMESTAMP
      WHERE l.Status = 1
    `;

    const result = await executeQuery(refreshSql);

    console.log(`批量更新库位占用情况 - 成功, 影响行数: ${result.affectedRows}`);
    res.json(successResponse({ 
      updatedCount: result.affectedRows 
    }, '库位占用情况刷新成功'));

  } catch (error) {
    console.error('批量更新库位占用情况失败:', error);
    res.status(500).json(errorResponse('批量更新库位占用情况失败'));
  }
});



// ====================================
// 错误处理中间件
// ====================================
app.use((error, req, res, next) => {
  console.error('全局错误处理:', error);
  
  // 数据库连接错误
  if (error.code === 'PROTOCOL_CONNECTION_LOST') {
    return res.status(500).json(errorResponse('数据库连接丢失'));
  }
  
  // 数据库查询错误
  if (error.code && error.code.startsWith('ER_')) {
    return res.status(500).json(errorResponse('数据库操作失败'));
  }
  
  // 其他错误
  res.status(500).json(errorResponse('服务器内部错误'));
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json(errorResponse('接口不存在', 404));
});

// ====================================
// 启动服务器
// ====================================
app.listen(port, () => {
  console.log('====================================');
  console.log('水杯WMS系统后端服务启动成功');
  console.log(`服务地址: http://localhost:${port}`);
  console.log(`健康检查: http://localhost:${port}/health`);
  console.log('====================================');
  console.log('可用接口:');
  console.log('【用户认证】');
  console.log('- POST /api/users/login           - 用户登录');
  console.log('- GET  /api/users/info            - 获取用户信息');
  console.log('【入库管理】');
  console.log('- GET  /api/inbound-orders/create-options - 获取新建选项');
  console.log('- POST /api/inbound-orders              - 创建入库单');
  console.log('- GET  /api/inbound-orders/:id          - 获取入库单详情');
  console.log('- PUT  /api/inbound-orders/:id          - 修改入库单');
  console.log('- DELETE /api/inbound-orders/:id        - 删除入库单');
  console.log('【原料库存管理API】');
  console.log('- GET    /api/inventory/raw-materials      - 获取库存列表');
  console.log('- GET    /api/inventory/raw-materials/:id  - 获取库存详情');
  console.log('- POST   /api/inventory/raw-materials      - 新增原料');
  console.log('- PUT    /api/inventory/raw-materials/:id  - 更新原料信息');
  console.log('- DELETE /api/inventory/raw-materials/:id  - 删除原料');
  console.log('====================================');
  console.log('【库位管理API】');
  console.log('- GET    /api/locations/list                   - 获取库位列表');
  console.log('- GET    /api/locations/:locationCode          - 获取库位详情');
  console.log('- POST   /api/locations                        - 新增库位');
  console.log('- PUT    /api/locations/:locationCode          - 更新库位');
  console.log('- DELETE /api/locations/:locationCode          - 删除库位');
  console.log('- DELETE /api/locations/batch-delete           - 批量删除库位');
  console.log('- PUT    /api/locations/:locationCode/status   - 更新库位状态');
  console.log('- GET    /api/warehouses/options               - 获取仓库选项');
  console.log('- GET    /api/locations/export                 - 导出库位数据');
  console.log('- GET    /api/locations/statistics             - 获取库位统计');
  console.log('- PUT    /api/locations/:locationCode/occupancy - 更新库位占用');
  console.log('- POST   /api/locations/refresh-occupancy      - 批量刷新占用');
  console.log('====================================');
  console.log('【系统功能】');
  console.log('- GET  /api/test                        - 测试数据库连接');
  console.log('- GET  /health                          - 健康检查');
  console.log('====================================');
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到SIGTERM信号，正在关闭服务...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('收到SIGINT信号，正在关闭服务...');
  await pool.end();
  process.exit(0);
});

// 导出应用实例
module.exports = app;

