require('dotenv').config();
const express = require('express');
const { json, urlencoded } = require('body-parser');
const cors = require('cors');

const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3000;

const authenticateToken = require("./middleware/auth");
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

// 注册路由
app.use('/', require('./routes/base'));
app.use("/api", authenticateToken);
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
app.use('/', require('./routes/wave'));

// 错误处理
app.use(errorHandler);

// 启动服务器
app.listen(port, () => {
  console.log('====================================');
  console.log(`WMS后端服务已启动`);
  console.log(`服务地址: http://localhost:${port}`);
  console.log(`健康检查: http://localhost:${port}/health`);
  console.log('====================================');
});
