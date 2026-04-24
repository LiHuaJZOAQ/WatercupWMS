const express = require('express');
const { json, urlencoded } = require('body-parser');
const cors = require('cors');
const { createPool } = require('mysql2/promise');
const { compare } = require('bcrypt');
const { verify, sign } = require('jsonwebtoken');

const app = express();
const port = 3000;

// 中间件配置
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cors());

// 数据库连接池配置
const pool = createPool({
  host: 'localhost',
  user: 'root',
  password: 'root', // 请修改为你的MySQL密码
  database: 'watercup_wms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// JWT密钥
const JWT_SECRET = 'watercup_wms_secret_key';

// 验证Token中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '令牌无效或已过期' });
    }
    req.user = user;
    next();
  });
};

// 测试数据库连接
app.get('/api/test', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.status(200).json({ message: '数据库连接成功' });
  } catch (error) {
    console.error('数据库连接失败:', error);
    res.status(500).json({ message: '数据库连接失败', error: error.message });
  }
});

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
app.get('/api/users/info', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT UserID, Username, FullName, Email, Department, Position FROM User WHERE UserID = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const user = rows[0];
    res.status(200).json({
      id: user.UserID,
      username: user.Username,
      name: user.FullName,
      email: user.Email,
      department: user.Department,
      position: user.Position
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ message: '获取用户信息失败', error: error.message });
  }
});

// // 获取入库单创建选项
// app.get('/api/inbound-orders/create-options', authenticateToken, async (req, res) => {
//   try {
//     // 获取仓库列表
//     const [warehouses] = await pool.execute(
//       'SELECT WarehouseID as value, WarehouseName as label FROM Warehouse WHERE Status = 1'
//     );

//     // 获取供应商列表
//     const [suppliers] = await pool.execute(
//       'SELECT SupplierID as value, SupplierName as label FROM Supplier WHERE Status = 1'
//     );

//     // 获取原材料列表
//     const [materials] = await pool.execute(
//       'SELECT MaterialID, MaterialCode as materialNo, MaterialName as materialName, Specification as specification, Unit as unit FROM RawMaterial WHERE Status = 1'
//     );

//     // 入库类型选项
//     const warehouseTypes = [
//       { value: 'purchase', label: '采购入库' },
//       { value: 'return', label: '退货入库' },
//       { value: 'transfer', label: '调拨入库' },
//       { value: 'other', label: '其他入库' }
//     ];

//     // 入库方式选项
//     const warehouseMethods = [
//       { value: 'normal', label: '正常入库' },
//       { value: 'urgent', label: '紧急入库' }
//     ];

//     // 生产商列表（这里简化为与供应商相同）
//     const manufacturers = suppliers;

//     res.status(200).json({
//       warehouses,
//       suppliers,
//       manufacturers,
//       materials,
//       warehouseTypes,
//       warehouseMethods
//     });
//   } catch (error) {
//     console.error('获取入库单选项失败:', error);
//     res.status(500).json({ message: '获取入库单选项失败', error: error.message });
//   }
// });

// // 创建入库单
// app.post('/api/inbound-orders', authenticateToken, async (req, res) => {
//   const { 
//     warehouseReceiptNo, 
//     warehouseType, 
//     warehouse, 
//     warehouseMethod, 
//     supplier, 
//     manufacturer, 
//     remark, 
//     details 
//   } = req.body;

//   // 验证必填字段
//   if (!warehouseType || !warehouse || !supplier || !details || details.length === 0) {
//     return res.status(400).json({ message: '缺少必要的入库单信息' });
//   }

//   // 验证明细数据
//   for (const detail of details) {
//     if (!detail.materialNo || !detail.expectedQuantity) {
//       return res.status(400).json({ message: '入库明细数据不完整' });
//     }
//   }

//   const connection = await pool.getConnection();
//   try {
//     await connection.beginTransaction();

//     // 插入入库单主表
//     const [inboundResult] = await connection.execute(
//       `INSERT INTO RawMaterialInbound 
//        (InboundNumber, SupplierID, WarehouseID, InboundDate, OperatorUserID, Status, Remarks) 
//        VALUES (?, ?, ?, NOW(), ?, 'Pending', ?)`,
//       [warehouseReceiptNo, supplier, warehouse, req.user.id, remark]
//     );

//     const inboundId = inboundResult.insertId;

//     // 插入入库单明细
//     for (const detail of details) {
//       // 获取原材料ID
//       const [materialRows] = await connection.execute(
//         'SELECT MaterialID FROM RawMaterial WHERE MaterialCode = ?',
//         [detail.materialNo]
//       );

//       if (materialRows.length === 0) {
//         throw new Error(`未找到原材料: ${detail.materialNo}`);
//       }

//       const materialId = materialRows[0].MaterialID;

//       // 插入明细记录
//       await connection.execute(
//         `INSERT INTO RawMaterialInboundDetail 
//          (InboundID, RawMaterialID, Quantity, UnitPrice, Amount, BatchNumber) 
//          VALUES (?, ?, ?, ?, ?, ?)`,
//         [
//           inboundId, 
//           materialId, 
//           detail.expectedQuantity, 
//           0, // 单价，这里简化为0
//           0, // 金额，这里简化为0
//           detail.batchNo || ''
//         ]
//       );
//     }

//     await connection.commit();
//     res.status(201).json({ 
//       message: '入库单创建成功', 
//       inboundId, 
//       inboundNumber: warehouseReceiptNo 
//     });
//   } catch (error) {
//     await connection.rollback();
//     console.error('创建入库单失败:', error);
//     res.status(500).json({ message: '创建入库单失败', error: error.message });
//   } finally {
//     connection.release();
//   }
// });

// // 获取入库单列表
// app.get('/api/inbound-orders', authenticateToken, async (req, res) => {
//   try {
//     const { 
//       page = 1, 
//       pageSize = 10, 
//       orderStatus, 
//       warehouseReceiptNo, 
//       materialName, 
//       materialNo, 
//       batchNo, 
//       warehouse, 
//       warehouseType, 
//       startDate, 
//       endDate 
//     } = req.query;

//     // 构建查询条件
//     let conditions = [];
//     let params = [];

//     if (orderStatus) {
//       conditions.push('i.Status = ?');
//       params.push(orderStatus);
//     }

//     if (warehouseReceiptNo) {
//       conditions.push('i.InboundNumber LIKE ?');
//       params.push(`%${warehouseReceiptNo}%`);
//     }

//     if (warehouse) {
//       conditions.push('i.WarehouseID = ?');
//       params.push(warehouse);
//     }

//     if (startDate && endDate) {
//       conditions.push('i.InboundDate BETWEEN ? AND ?');
//       params.push(startDate, endDate);
//     }

//     // 材料相关条件需要连接明细表
//     let joinDetailTable = false;
//     let materialConditions = [];

//     if (materialName) {
//       joinDetailTable = true;
//       materialConditions.push('rm.MaterialName LIKE ?');
//       params.push(`%${materialName}%`);
//     }

//     if (materialNo) {
//       joinDetailTable = true;
//       materialConditions.push('rm.MaterialCode LIKE ?');
//       params.push(`%${materialNo}%`);
//     }

//     if (batchNo) {
//       joinDetailTable = true;
//       materialConditions.push('d.BatchNumber LIKE ?');
//       params.push(`%${batchNo}%`);
//     }

//     // 构建查询语句
//     let query = `
//       SELECT 
//         i.InboundID as id,
//         i.InboundNumber as warehouseReceiptNo,
//         i.Status as status,
//         i.InboundDate as warehouseDate,
//         w.WarehouseName as warehouseName,
//         s.SupplierName as supplierName,
//         u.FullName as operatorName,
//         i.Remarks as remark
//       FROM 
//         RawMaterialInbound i
//         JOIN Warehouse w ON i.WarehouseID = w.WarehouseID
//         JOIN Supplier s ON i.SupplierID = s.SupplierID
//         JOIN User u ON i.OperatorUserID = u.UserID
//     `;

//     // 如果有材料相关条件，添加连接
//     if (joinDetailTable) {
//       query += `
//         JOIN RawMaterialInboundDetail d ON i.InboundID = d.InboundID
//         JOIN RawMaterial rm ON d.RawMaterialID = rm.MaterialID
//       `;
      
//       if (materialConditions.length > 0) {
//         conditions.push(`(${materialConditions.join(' OR ')})`);
//       }
//     }

//     // 添加WHERE条件
//     if (conditions.length > 0) {
//       query += ` WHERE ${conditions.join(' AND ')}`;
//     }

//     // 添加分组和排序
//     query += `
//       GROUP BY i.InboundID
//       ORDER BY i.InboundDate DESC
//       LIMIT ? OFFSET ?
//     `;

//     // 添加分页参数
//     params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

//     // 执行查询
//     const [rows] = await pool.execute(query, params);

//     // 获取总记录数
//     let countQuery = `
//       SELECT COUNT(DISTINCT i.InboundID) as total
//       FROM RawMaterialInbound i
//     `;

//     if (joinDetailTable) {
//       countQuery += `
//         JOIN RawMaterialInboundDetail d ON i.InboundID = d.InboundID
//         JOIN RawMaterial rm ON d.RawMaterialID = rm.MaterialID
//       `;
//     }

//     if (conditions.length > 0) {
//       countQuery += ` WHERE ${conditions.join(' AND ')}`;
//     }

//     const [countRows] = await pool.execute(countQuery, params.slice(0, -2));
//     const total = countRows[0].total;

//     res.status(200).json({
//       list: rows,
//       total,
//       page: parseInt(page),
//       pageSize: parseInt(pageSize)
//     });
//   } catch (error) {
//     console.error('获取入库单列表失败:', error);
//     res.status(500).json({ message: '获取入库单列表失败', error: error.message });
//   }
// });

// // 审核入库单
// app.put('/api/inbound-orders/audit', authenticateToken, async (req, res) => {
//   const { ids, status, reason } = req.body;

//   if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
//     return res.status(400).json({ message: '参数错误' });
//   }

//   const connection = await pool.getConnection();
//   try {
//     await connection.beginTransaction();

//     // 更新入库单状态
//     await connection.execute(
//       `UPDATE RawMaterialInbound SET Status = ?, UpdatedAt = NOW() WHERE InboundID IN (?)`,
//       [status, ids]
//     );

//     // 如果审核通过，更新库存
//     if (status === 'approved') {
//       for (const id of ids) {
//         // 获取入库单明细
//         const [details] = await connection.execute(
//           `SELECT 
//             d.RawMaterialID, 
//             d.Quantity, 
//             d.BatchNumber, 
//             i.WarehouseID
//           FROM 
//             RawMaterialInboundDetail d
//             JOIN RawMaterialInbound i ON d.InboundID = i.InboundID
//           WHERE 
//             d.InboundID = ?`,
//           [id]
//         );

//         // 为每个明细更新库存
//         for (const detail of details) {
//           // 查找默认库位（简化处理，实际应该有更复杂的库位分配逻辑）
//           const [locations] = await connection.execute(
//             `SELECT LocationID FROM Location 
//              WHERE WarehouseID = ? AND LocationType = 'Raw' AND Status = 1 
//              LIMIT 1`,
//             [detail.WarehouseID]
//           );

//           let locationId;
//           if (locations.length > 0) {
//             locationId = locations[0].LocationID;
//           } else {
//             // 如果没有找到合适的库位，创建一个默认库位
//             const [newLocation] = await connection.execute(
//               `INSERT INTO Location 
//                (LocationID, WarehouseID, LocationName, LocationType, Capacity, Status) 
//                VALUES (?, ?, ?, 'Raw', 1000, 1)`,
//               [
//                 `RAW-${detail.WarehouseID}-DEFAULT`, 
//                 detail.WarehouseID, 
//                 '原材料默认库位'
//               ]
//             );
//             locationId = `RAW-${detail.WarehouseID}-DEFAULT`;
//           }

//           // 检查是否已存在该物料的库存记录
//           const [inventory] = await connection.execute(
//             `SELECT InventoryID, CurrentQuantity FROM Inventory 
//              WHERE ItemType = 'RawMaterial' AND ItemID = ? AND LocationID = ? AND BatchNumber = ?`,
//             ['RawMaterial', detail.RawMaterialID, locationId, detail.BatchNumber || '']
//           );

//           if (inventory.length > 0) {
//             // 更新现有库存
//             const newQuantity = parseFloat(inventory[0].CurrentQuantity) + parseFloat(detail.Quantity);
//             await connection.execute(
//               `UPDATE Inventory SET 
//                CurrentQuantity = ?, 
//                AvailableQuantity = ?, 
//                LastInboundDate = NOW(), 
//                UpdatedAt = NOW() 
//                WHERE InventoryID = ?`,
//               [newQuantity, newQuantity, inventory[0].InventoryID]
//             );

//             // 记录库存变动
//             await connection.execute(
//               `INSERT INTO InventoryTransaction 
//                (InventoryID, TransactionType, ReferenceType, ReferenceID, 
//                 QuantityBefore, QuantityChange, QuantityAfter, 
//                 TransactionDate, OperatorUserID) 
//                VALUES (?, 'Inbound', 'RawMaterialInbound', ?, ?, ?, ?, NOW(), ?)`,
//               [
//                 inventory[0].InventoryID, 
//                 id, 
//                 inventory[0].CurrentQuantity, 
//                 detail.Quantity, 
//                 newQuantity, 
//                 req.user.id
//               ]
//             );
//           } else {
//             // 创建新的库存记录
//             const [newInventory] = await connection.execute(
//               `INSERT INTO Inventory 
//                (ItemType, ItemID, LocationID, BatchNumber, 
//                 CurrentQuantity, AvailableQuantity, LastInboundDate) 
//                VALUES (?, ?, ?, ?, ?, ?, NOW())`,
//               [
//                 'RawMaterial', 
//                 detail.RawMaterialID, 
//                 locationId, 
//                 detail.BatchNumber || '', 
//                 detail.Quantity, 
//                 detail.Quantity
//               ]
//             );

//             // 记录库存变动
//             await connection.execute(
//               `INSERT INTO InventoryTransaction 
//                (InventoryID, TransactionType, ReferenceType, ReferenceID, 
//                 QuantityBefore, QuantityChange, QuantityAfter, 
//                 TransactionDate, OperatorUserID) 
//                VALUES (?, 'Inbound', 'RawMaterialInbound', ?, ?, ?, ?, NOW(), ?)`,
//               [
//                 newInventory.insertId, 
//                 id, 
//                 0, 
//                 detail.Quantity, 
//                 detail.Quantity, 
//                 req.user.id
//               ]
//             );
//           }
//         }
//       }
//     }

//     await connection.commit();
//     res.status(200).json({ message: '审核成功' });
//   } catch (error) {
//     await connection.rollback();
//     console.error('审核入库单失败:', error);
//     res.status(500).json({ message: '审核入库单失败', error: error.message });
//   } finally {
//     connection.release();
//   }
// });

// // 撤销入库单
// app.put('/api/inbound-orders/revoke', authenticateToken, async (req, res) => {
//   const { ids } = req.body;

//   if (!ids || !Array.isArray(ids) || ids.length === 0) {
//     return res.status(400).json({ message: '参数错误' });
//   }

//   try {
//     // 更新入库单状态为已取消
//     await pool.execute(
//       `UPDATE RawMaterialInbound SET Status = 'Cancelled', UpdatedAt = NOW() WHERE InboundID IN (?)`,
//       [ids]
//     );

//     res.status(200).json({ message: '撤销成功' });
//   } catch (error) {
//     console.error('撤销入库单失败:', error);
//     res.status(500).json({ message: '撤销入库单失败', error: error.message });
//   }
// });

// // 获取入库单详情
// app.get('/api/inbound-orders/:id', authenticateToken, async (req, res) => {
//   const { id } = req.params;

//   try {
//     // 获取入库单主信息
//     const [inboundRows] = await pool.execute(
//       `SELECT 
//         i.InboundID as id,
//         i.InboundNumber as warehouseReceiptNo,
//         i.Status as status,
//         i.InboundDate as warehouseDate,
//         i.WarehouseID as warehouse,
//         w.WarehouseName as warehouseName,
//         i.SupplierID as supplier,
//         s.SupplierName as supplierName,
//         i.OperatorUserID as operatorId,
//         u.FullName as operatorName,
//         i.Remarks as remark,
//         i.CreatedAt as createdAt,
//         i.UpdatedAt as updatedAt
//       FROM 
//         RawMaterialInbound i
//         JOIN Warehouse w ON i.WarehouseID = w.WarehouseID
//         JOIN Supplier s ON i.SupplierID = s.SupplierID
//         JOIN User u ON i.OperatorUserID = u.UserID
//       WHERE 
//         i.InboundID = ?`,
//       [id]
//     );

//     if (inboundRows.length === 0) {
//       return res.status(404).json({ message: '入库单不存在' });
//     }

//     // 获取入库单明细
//     const [detailRows] = await pool.execute(
//       `SELECT 
//         d.DetailID as id,
//         d.RawMaterialID as materialId,
//         rm.MaterialCode as materialNo,
//         rm.MaterialName as materialName,
//         rm.Specification as specification,
//         rm.Unit as unit,
//         d.BatchNumber as batchNo,
//         d.Quantity as quantity,
//         d.UnitPrice as unitPrice,
//         d.Amount as amount
//       FROM 
//         RawMaterialInboundDetail d
//         JOIN RawMaterial rm ON d.RawMaterialID = rm.MaterialID
//       WHERE 
//         d.InboundID = ?`,
//       [id]
//     );

//     // 组合结果
//     const result = {
//       ...inboundRows[0],
//       details: detailRows
//     };

//     res.status(200).json(result);
//   } catch (error) {
//     console.error('获取入库单详情失败:', error);
//     res.status(500).json({ message: '获取入库单详情失败', error: error.message });
//   }
// });

// // 获取入库单打印数据
// app.get('/api/inbound-orders/:id/print', authenticateToken, async (req, res) => {
//   const { id } = req.params;

//   try {
//     // 获取入库单详情（复用上面的逻辑）
//     const [inboundRows] = await pool.execute(
//       `SELECT 
//         i.InboundID as id,
//         i.InboundNumber as warehouseReceiptNo,
//         i.Status as status,
//         i.InboundDate as warehouseDate,
//         w.WarehouseName as warehouseName,
//         s.SupplierName as supplierName,
//         u.FullName as operatorName,
//         i.Remarks as remark,
//         i.CreatedAt as createdAt
//       FROM 
//         RawMaterialInbound i
//         JOIN Warehouse w ON i.WarehouseID = w.WarehouseID
//         JOIN Supplier s ON i.SupplierID = s.SupplierID
//         JOIN User u ON i.OperatorUserID = u.UserID
//       WHERE 
//         i.InboundID = ?`,
//       [id]
//     );

//     if (inboundRows.length === 0) {
//       return res.status(404).json({ message: '入库单不存在' });
//     }

//     // 获取入库单明细
//     const [detailRows] = await pool.execute(
//       `SELECT 
//         rm.MaterialCode as materialNo,
//         rm.MaterialName as materialName,
//         rm.Specification as specification,
//         rm.Unit as unit,
//         d.BatchNumber as batchNo,
//         d.Quantity as quantity
//       FROM 
//         RawMaterialInboundDetail d
//         JOIN RawMaterial rm ON d.RawMaterialID = rm.MaterialID
//       WHERE 
//         d.InboundID = ?`,
//       [id]
//     );

//     // 组合打印数据
//     const printData = {
//       ...inboundRows[0],
//       details: detailRows,
//       printTime: new Date().toLocaleString(),
//       printUser: req.user.fullName || req.user.username
//     };

//     res.status(200).json(printData);
//   } catch (error) {
//     console.error('获取打印数据失败:', error);
//     res.status(500).json({ message: '获取打印数据失败', error: error.message });
//   }
// });

// // 获取入库单筛选选项
// app.get('/api/inbound-orders/options', authenticateToken, async (req, res) => {
//   try {
//     // 获取仓库列表
//     const [warehouses] = await pool.execute(
//       'SELECT WarehouseID as value, WarehouseName as label FROM Warehouse WHERE Status = 1'
//     );

//     // 获取供应商列表
//     const [suppliers] = await pool.execute(
//       'SELECT SupplierID as value, SupplierName as label FROM Supplier WHERE Status = 1'
//     );

//     // 获取原材料名称列表
//     const [materialNames] = await pool.execute(
//       'SELECT DISTINCT MaterialName as value, MaterialName as label FROM RawMaterial WHERE Status = 1'
//     );

//     // 获取原材料编号列表
//     const [materialNos] = await pool.execute(
//       'SELECT DISTINCT MaterialCode as value, MaterialCode as label FROM RawMaterial WHERE Status = 1'
//     );

//     // 获取入库单号列表（最近100个）
//     const [warehouseReceiptNos] = await pool.execute(
//       'SELECT DISTINCT InboundNumber as value, InboundNumber as label FROM RawMaterialInbound ORDER BY InboundDate DESC LIMIT 100'
//     );

//     // 获取批次号列表（最近100个）
//     const [batchNos] = await pool.execute(
//       'SELECT DISTINCT BatchNumber as value, BatchNumber as label FROM RawMaterialInboundDetail WHERE BatchNumber != "" ORDER BY DetailID DESC LIMIT 100'
//     );

//     // 状态选项
//     const orderStatus = [
//       { value: 'Pending', label: '待审核' },
//       { value: 'approved', label: '已批准' },
//       { value: 'rejected', label: '已拒绝' },
//       { value: 'Cancelled', label: '已取消' }
//     ];

//     // 入库类型选项
//     const warehouseTypes = [
//       { value: 'purchase', label: '采购入库' },
//       { value: 'return', label: '退货入库' },
//       { value: 'transfer', label: '调拨入库' },
//       { value: 'other', label: '其他入库' }
//     ];

//     // 入库方式选项
//     const warehouseMethods = [
//       { value: 'normal', label: '正常入库' },
//       { value: 'urgent', label: '紧急入库' }
//     ];

//     // 来源单号列表（简化处理，实际可能需要从其他表获取）
//     const sourceDocNos = [];

//     // 生产商列表（这里简化为与供应商相同）
//     const manufacturers = suppliers;

//     res.status(200).json({
//       orderStatus,
//       warehouseReceiptNos,
//       sourceDocNos,
//       materialNames,
//       materialNos,
//       batchNos,
//       warehouses,
//       warehouseTypes,
//       warehouseMethods,
//       suppliers,
//       manufacturers
//     });
//   } catch (error) {
//     console.error('获取筛选选项失败:', error);
//     res.status(500).json({ message: '获取筛选选项失败', error: error.message });
//   }
// });

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});