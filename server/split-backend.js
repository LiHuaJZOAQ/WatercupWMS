const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'index.js');
const content = fs.readFileSync(inputFile, 'utf-8');

const lines = content.split('\n');

let currentSection = 'setup';
const sections = {
  setup: [],
  utils: [],
  base: [],
  users: [],
  suppliers: [],
  customers: [],
  departments: [],
  factories: [],
  finishedProducts: [],
  userManage: [],
  roles: [],
  operationLogs: [],
  inbound: [],
  finishedInbounds: [],
  finishedOutbounds: [],
  outbound: [],
  rawInventory: [],
  locations: [],
  stocktaking: [],
  errorHandler: [],
  startup: []
};

// Map section headers to keys
const headerMap = {
  '通用工具函数': 'utils',
  '基础接口': 'base',
  '用户认证接口': 'users',
  '基础数据 - 供应商管理接口': 'suppliers',
  '基础数据 - 客户管理接口': 'customers',
  '基础数据 - 部门管理接口': 'departments',
  '基础数据 - 加工厂管理接口': 'factories',
  '基础数据 - 成品档案管理接口': 'finishedProducts',
  '系统设置 - 用户管理接口': 'userManage',
  '系统设置 - 角色与权限接口': 'roles',
  '系统设置 - 操作日志接口': 'operationLogs',
  '入库接口 - 完整版本': 'inbound',
  '成品入库管理接口': 'finishedInbounds',
  '成品出库管理接口': 'finishedOutbounds',
  '原料出库管理接口': 'outbound',
  '原料库存管理接口': 'rawInventory',
  '库位管理接口 - 基于数据库表结构重新设计': 'locations',
  '盘点管理接口': 'stocktaking',
  '错误处理中间件': 'errorHandler',
  '启动服务器': 'startup'
};

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.startsWith('// ====================================')) {
    if (i + 1 < lines.length) {
      const headerLine = lines[i + 1].trim();
      if (headerLine.startsWith('// ')) {
        const headerText = headerLine.substring(3).trim();
        if (headerMap[headerText]) {
          currentSection = headerMap[headerText];
          sections[currentSection].push(line);
          sections[currentSection].push(lines[i + 1]);
          sections[currentSection].push(lines[i + 2]); // Should be the closing ====
          i += 2;
          continue;
        }
      }
    }
  }
  
  sections[currentSection].push(line);
}

// Generate the new files
const routesDir = path.join(__dirname, 'routes');
if (!fs.existsSync(routesDir)) fs.mkdirSync(routesDir);

const configDir = path.join(__dirname, 'config');
if (!fs.existsSync(configDir)) fs.mkdirSync(configDir);

const middlewareDir = path.join(__dirname, 'middleware');
if (!fs.existsSync(middlewareDir)) fs.mkdirSync(middlewareDir);

const utilsDir = path.join(__dirname, 'utils');
if (!fs.existsSync(utilsDir)) fs.mkdirSync(utilsDir);

// 1. Create config/db.js
const dbContent = `require('dotenv').config();
const { createPool } = require('mysql2/promise');

const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'watercup_wms',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+08:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

module.exports = pool;
`;
fs.writeFileSync(path.join(configDir, 'db.js'), dbContent);

// 2. Create utils/index.js
const utilsContent = `const moment = require('moment');
const pool = require('../config/db');

const createResponse = (success, data = null, message = '', code = 200) => {
  return {
    code: success ? 200 : (code || 500),
    message: message || (success ? '操作成功' : '操作失败'),
    data: data,
    timestamp: new Date().toISOString()
  };
};

const successResponse = (data = null, message = '操作成功') =>
  createResponse(true, data, message, 200);

const errorResponse = (message = '操作失败', code = 500, data = null) =>
  createResponse(false, data, message, code);

const formatDateTime = (date) => {
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

const validateRequired = (params, requiredFields) => {
  const missing = requiredFields.filter(field => !params[field]);
  return missing.length > 0 ? \`缺少必填参数: \${missing.join(', ')}\` : null;
};

const executeQuery = async (sql, params = []) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    connection.release();
  }
};

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

module.exports = {
  createResponse,
  successResponse,
  errorResponse,
  formatDateTime,
  validateRequired,
  executeQuery,
  executeTransaction
};
`;
fs.writeFileSync(path.join(utilsDir, 'index.js'), utilsContent);

// 3. Create middleware/errorHandler.js
const errorContent = `module.exports = (error, req, res, next) => {
  console.error('全局错误处理:', error);
  res.status(500).json({
    code: 500,
    message: error.message || '服务器内部错误',
    data: null,
    timestamp: new Date().toISOString()
  });
};
`;
fs.writeFileSync(path.join(middlewareDir, 'errorHandler.js'), errorContent);

// 4. Create .env
const envContent = `PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=watercup_wms
DB_CONNECTION_LIMIT=10
JWT_SECRET=watercup_wms_secret_key
`;
fs.writeFileSync(path.join(__dirname, '.env'), envContent);

// Function to process route files
function createRouteFile(filename, contentArray, dependencies = []) {
  let content = `const express = require('express');\nconst router = express.Router();\nconst pool = require('../config/db');\n`;
  content += `const { createResponse, successResponse, errorResponse, formatDateTime, validateRequired, executeQuery, executeTransaction } = require('../utils');\n`;
  
  if (dependencies.includes('bcrypt')) content += `const { compare } = require('bcrypt');\n`;
  if (dependencies.includes('jsonwebtoken')) content += `const { sign, verify } = require('jsonwebtoken');\n`;
  if (dependencies.includes('moment')) content += `const moment = require('moment');\n`;
  if (dependencies.includes('exceljs')) content += `const ExcelJS = require('exceljs');\n`;
  
  content += `\nconst JWT_SECRET = process.env.JWT_SECRET || 'watercup_wms_secret_key';\n\n`;
  
  let routeCode = contentArray.join('\n');
  routeCode = routeCode.replace(/app\.(get|post|put|delete)\(/g, 'router.$1(');
  
  content += routeCode + '\n\nmodule.exports = router;\n';
  fs.writeFileSync(path.join(routesDir, filename), content);
}

// 5. Create route files
createRouteFile('base.js', sections.base);
createRouteFile('users.js', sections.users, ['bcrypt', 'jsonwebtoken']);
createRouteFile('suppliers.js', sections.suppliers);
createRouteFile('customers.js', sections.customers);
createRouteFile('departments.js', sections.departments);
createRouteFile('factories.js', sections.factories);
createRouteFile('finishedProducts.js', sections.finishedProducts);
createRouteFile('userManage.js', sections.userManage, ['bcrypt']);
createRouteFile('roles.js', sections.roles);
createRouteFile('operationLogs.js', sections.operationLogs);
createRouteFile('inbound.js', sections.inbound, ['moment', 'exceljs']);
createRouteFile('finishedInbounds.js', sections.finishedInbounds);
createRouteFile('finishedOutbounds.js', sections.finishedOutbounds);
createRouteFile('outbound.js', sections.outbound, ['moment']);
createRouteFile('rawInventory.js', sections.rawInventory);
createRouteFile('locations.js', sections.locations);
createRouteFile('stocktaking.js', sections.stocktaking);

// 6. Create new index.js (app.js)
let newIndexContent = `require('dotenv').config();
const express = require('express');
const { json, urlencoded } = require('body-parser');
const cors = require('cors');

const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3000;

// 中间件配置
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

// 注册路由
app.use('/', require('./routes/base'));
app.use('/', require('./routes/users'));
app.use('/', require('./routes/suppliers'));
app.use('/', require('./routes/customers'));
app.use('/', require('./routes/departments'));
app.use('/', require('./routes/factories'));
app.use('/', require('./routes/finishedProducts'));
app.use('/', require('./routes/userManage'));
app.use('/', require('./routes/roles'));
app.use('/', require('./routes/operationLogs'));
app.use('/', require('./routes/inbound'));
app.use('/', require('./routes/finishedInbounds'));
app.use('/', require('./routes/finishedOutbounds'));
app.use('/', require('./routes/outbound'));
app.use('/', require('./routes/rawInventory'));
app.use('/', require('./routes/locations'));
app.use('/', require('./routes/stocktaking'));

// 错误处理
app.use(errorHandler);

// 启动服务器
app.listen(port, () => {
  console.log('====================================');
  console.log(\`WMS后端服务已启动\`);
  console.log(\`服务地址: http://localhost:\${port}\`);
  console.log(\`健康检查: http://localhost:\${port}/health\`);
  console.log('====================================');
});
`;

fs.writeFileSync(path.join(__dirname, 'app.js'), newIndexContent);

console.log("Refactoring complete. Please check the 'routes' folder and 'app.js'.");
