
---

## 2025/06/17

### 增加 \server\index.js 后端接口
    WMS系统后端服务
    服务地址: http://localhost:3000
    使用方法: cd server && npm start
    可用接口:
    【用户认证】
    - POST /api/users/login     - 用户登录
    - GET  /api/users/info      - 获取用户信息
    【入库管理】
    - GET  /api/inbound-orders/create-options - 获取新建选项
    - POST /api/inbound-orders   - 创建入库单
    - GET  /api/inbound-orders/:id      - 获取入库单详情
    - PUT  /api/inbound-orders/:id      - 修改入库单
    - DELETE /api/inbound-orders/:id    - 删除入库单
    【系统功能】
    - GET  /api/test      - 测试数据库连接
    - GET  /health        - 健康检查

### 完善数据库与测试数据

---

