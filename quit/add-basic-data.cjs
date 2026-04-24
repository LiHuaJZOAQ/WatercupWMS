const fs = require('fs');
const path = './server/index.js';
let code = fs.readFileSync(path, 'utf8');

const insertPos = code.indexOf('// ====================================\n// 入库接口 - 完整版本');

const basicApis = `
// ====================================
// 基础数据 - 客户管理接口
// ====================================

app.get('/api/customers', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, status } = req.query;
    let whereConditions = [];
    let queryParams = [];

    if (keyword) {
      whereConditions.push('(CustomerCode LIKE ? OR CustomerName LIKE ?)');
      queryParams.push(\`%\${keyword}%\`, \`%\${keyword}%\`);
    }
    if (status !== undefined && status !== '') {
      whereConditions.push('Status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const countSql = \`SELECT COUNT(*) as total FROM Customer \${whereClause}\`;
    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0].total;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    const sql = \`
      SELECT 
        CustomerID as id, CustomerCode as code, CustomerName as name,
        ContactPerson as contactPerson, ContactPhone as contactPhone,
        Email as email, Address as address, Status as status, CreatedAt as createdAt
      FROM Customer \${whereClause} ORDER BY CustomerID DESC LIMIT ? OFFSET ?
    \`;
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

app.post('/api/customers', async (req, res) => {
  try {
    const { code, name, contactPerson, contactPhone, email, address, status = 1 } = req.body;
    const validation = validateRequired({ code, name }, ['code', 'name']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT CustomerID FROM Customer WHERE CustomerCode = ?', [code]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('客户编码已存在', 400));

    await executeQuery(
      \`INSERT INTO Customer (CustomerCode, CustomerName, ContactPerson, ContactPhone, Email, Address, Status, CreatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())\`,
      [code, name, contactPerson || '', contactPhone || '', email || '', address || '', status]
    );
    res.json(successResponse(null, '客户创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse('创建客户失败'));
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, contactPerson, contactPhone, email, address, status } = req.body;
    const validation = validateRequired({ code, name }, ['code', 'name']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT CustomerID FROM Customer WHERE CustomerCode = ? AND CustomerID != ?', [code, id]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('客户编码已被其他客户使用', 400));

    await executeQuery(
      \`UPDATE Customer SET CustomerCode = ?, CustomerName = ?, ContactPerson = ?, ContactPhone = ?, Email = ?, Address = ?, Status = ?, UpdatedAt = NOW() WHERE CustomerID = ?\`,
      [code, name, contactPerson || '', contactPhone || '', email || '', address || '', status !== undefined ? status : 1, id]
    );
    res.json(successResponse(null, '客户更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse('更新客户失败'));
  }
});

app.delete('/api/customers/:id', async (req, res) => {
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


// ====================================
// 基础数据 - 部门管理接口
// ====================================

app.get('/api/departments', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, status } = req.query;
    let whereConditions = [];
    let queryParams = [];

    if (keyword) {
      whereConditions.push('(DepartmentCode LIKE ? OR DepartmentName LIKE ?)');
      queryParams.push(\`%\${keyword}%\`, \`%\${keyword}%\`);
    }
    if (status !== undefined && status !== '') {
      whereConditions.push('Status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const countSql = \`SELECT COUNT(*) as total FROM Department \${whereClause}\`;
    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0].total;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    const sql = \`
      SELECT 
        DepartmentID as id, DepartmentCode as code, DepartmentName as name,
        Description as description, Status as status, CreatedAt as createdAt
      FROM Department \${whereClause} ORDER BY DepartmentID DESC LIMIT ? OFFSET ?
    \`;
    const results = await executeQuery(sql, [...queryParams, limit, offset]);
    const formattedResults = results.map(item => ({ ...item, createdAt: formatDateTime(item.createdAt) }));

    res.json(successResponse({ items: formattedResults, total, page: parseInt(page), pageSize: limit }));
  } catch (error) {
    res.status(500).json(errorResponse('获取部门列表失败'));
  }
});

app.post('/api/departments', async (req, res) => {
  try {
    const { code, name, description, status = 1 } = req.body;
    const validation = validateRequired({ code, name }, ['code', 'name']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT DepartmentID FROM Department WHERE DepartmentCode = ?', [code]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('部门编码已存在', 400));

    await executeQuery(
      \`INSERT INTO Department (DepartmentCode, DepartmentName, Description, Status, CreatedAt) VALUES (?, ?, ?, ?, NOW())\`,
      [code, name, description || '', status]
    );
    res.json(successResponse(null, '部门创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse('创建部门失败'));
  }
});

app.put('/api/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, description, status } = req.body;
    const validation = validateRequired({ code, name }, ['code', 'name']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT DepartmentID FROM Department WHERE DepartmentCode = ? AND DepartmentID != ?', [code, id]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('部门编码已被其他部门使用', 400));

    await executeQuery(
      \`UPDATE Department SET DepartmentCode = ?, DepartmentName = ?, Description = ?, Status = ?, UpdatedAt = NOW() WHERE DepartmentID = ?\`,
      [code, name, description || '', status !== undefined ? status : 1, id]
    );
    res.json(successResponse(null, '部门更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse('更新部门失败'));
  }
});

app.delete('/api/departments/:id', async (req, res) => {
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

// ====================================
// 基础数据 - 加工厂管理接口
// ====================================

app.get('/api/factories', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, status } = req.query;
    let whereConditions = [];
    let queryParams = [];

    if (keyword) {
      whereConditions.push('(FactoryCode LIKE ? OR FactoryName LIKE ?)');
      queryParams.push(\`%\${keyword}%\`, \`%\${keyword}%\`);
    }
    if (status !== undefined && status !== '') {
      whereConditions.push('Status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const countSql = \`SELECT COUNT(*) as total FROM ProcessingFactory \${whereClause}\`;
    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0].total;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    const sql = \`
      SELECT 
        FactoryID as id, FactoryCode as code, FactoryName as name,
        ContactPerson as contactPerson, ContactPhone as contactPhone,
        Address as address, Status as status, CreatedAt as createdAt
      FROM ProcessingFactory \${whereClause} ORDER BY FactoryID DESC LIMIT ? OFFSET ?
    \`;
    const results = await executeQuery(sql, [...queryParams, limit, offset]);
    const formattedResults = results.map(item => ({ ...item, createdAt: formatDateTime(item.createdAt) }));

    res.json(successResponse({ items: formattedResults, total, page: parseInt(page), pageSize: limit }));
  } catch (error) {
    res.status(500).json(errorResponse('获取加工厂列表失败'));
  }
});

app.post('/api/factories', async (req, res) => {
  try {
    const { code, name, contactPerson, contactPhone, address, status = 1 } = req.body;
    const validation = validateRequired({ code, name }, ['code', 'name']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT FactoryID FROM ProcessingFactory WHERE FactoryCode = ?', [code]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('加工厂编码已存在', 400));

    await executeQuery(
      \`INSERT INTO ProcessingFactory (FactoryCode, FactoryName, ContactPerson, ContactPhone, Address, Status, CreatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW())\`,
      [code, name, contactPerson || '', contactPhone || '', address || '', status]
    );
    res.json(successResponse(null, '加工厂创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse('创建加工厂失败'));
  }
});

app.put('/api/factories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, contactPerson, contactPhone, address, status } = req.body;
    const validation = validateRequired({ code, name }, ['code', 'name']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT FactoryID FROM ProcessingFactory WHERE FactoryCode = ? AND FactoryID != ?', [code, id]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('加工厂编码已被其他加工厂使用', 400));

    await executeQuery(
      \`UPDATE ProcessingFactory SET FactoryCode = ?, FactoryName = ?, ContactPerson = ?, ContactPhone = ?, Address = ?, Status = ?, UpdatedAt = NOW() WHERE FactoryID = ?\`,
      [code, name, contactPerson || '', contactPhone || '', address || '', status !== undefined ? status : 1, id]
    );
    res.json(successResponse(null, '加工厂更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse('更新加工厂失败'));
  }
});

app.delete('/api/factories/:id', async (req, res) => {
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

// ====================================
// 基础数据 - 成品档案管理接口
// ====================================

app.get('/api/finished-products', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, category, status } = req.query;
    let whereConditions = [];
    let queryParams = [];

    if (keyword) {
      whereConditions.push('(ProductCode LIKE ? OR ProductName LIKE ?)');
      queryParams.push(\`%\${keyword}%\`, \`%\${keyword}%\`);
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
    const countSql = \`SELECT COUNT(*) as total FROM FinishedProduct \${whereClause}\`;
    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0].total;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    const sql = \`
      SELECT 
        ProductID as id, ProductCode as code, ProductName as name, Category as category,
        Unit as unit, Specification as specification, Color as color, Capacity as capacity,
        Material as material, Description as description, MinStock as minStock, MaxStock as maxStock,
        Status as status, CreatedAt as createdAt
      FROM FinishedProduct \${whereClause} ORDER BY ProductID DESC LIMIT ? OFFSET ?
    \`;
    const results = await executeQuery(sql, [...queryParams, limit, offset]);
    const formattedResults = results.map(item => ({ ...item, createdAt: formatDateTime(item.createdAt) }));

    res.json(successResponse({ items: formattedResults, total, page: parseInt(page), pageSize: limit }));
  } catch (error) {
    res.status(500).json(errorResponse('获取成品列表失败'));
  }
});

app.post('/api/finished-products', async (req, res) => {
  try {
    const { code, name, category, unit, specification, color, capacity, material, description, minStock = 0, maxStock = 0, status = 1 } = req.body;
    const validation = validateRequired({ code, name, unit }, ['code', 'name', 'unit']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT ProductID FROM FinishedProduct WHERE ProductCode = ?', [code]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('成品编码已存在', 400));

    await executeQuery(
      \`INSERT INTO FinishedProduct 
        (ProductCode, ProductName, Category, Unit, Specification, Color, Capacity, Material, Description, MinStock, MaxStock, Status, CreatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())\`,
      [code, name, category || '', unit, specification || '', color || '', capacity || '', material || '', description || '', minStock, maxStock, status]
    );
    res.json(successResponse(null, '成品创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse('创建成品失败'));
  }
});

app.put('/api/finished-products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, category, unit, specification, color, capacity, material, description, minStock, maxStock, status } = req.body;
    const validation = validateRequired({ code, name, unit }, ['code', 'name', 'unit']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT ProductID FROM FinishedProduct WHERE ProductCode = ? AND ProductID != ?', [code, id]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('成品编码已被使用', 400));

    await executeQuery(
      \`UPDATE FinishedProduct SET 
        ProductCode = ?, ProductName = ?, Category = ?, Unit = ?, Specification = ?, Color = ?, 
        Capacity = ?, Material = ?, Description = ?, MinStock = ?, MaxStock = ?, Status = ?, UpdatedAt = NOW() 
       WHERE ProductID = ?\`,
      [code, name, category || '', unit, specification || '', color || '', capacity || '', material || '', description || '', minStock || 0, maxStock || 0, status !== undefined ? status : 1, id]
    );
    res.json(successResponse(null, '成品更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse('更新成品失败'));
  }
});

app.delete('/api/finished-products/:id', async (req, res) => {
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

`;

if (insertPos !== -1) {
  code = code.substring(0, insertPos) + basicApis + code.substring(insertPos);
  fs.writeFileSync(path, code);
  console.log('Basic APIs injected!');
} else {
  console.log('Insert position not found');
}
