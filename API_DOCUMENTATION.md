# WaterCup WMS 后端 API 接口文档

本文档描述了 WaterCup 仓储管理系统（WMS）后端的全量 API 接口，所有接口基础路径为：`http://localhost:3000/api`。

---

## 1. 用户认证模块

### 1.1 用户登录
- **路径**: `/users/login`
- **方法**: `POST`
- **参数**:
  - `username` (string): 用户名 (必须)
  - `password` (string): 密码 (必须)
- **返回**: 包含 `token` 及 `user` 基本信息的 JSON 对象。

### 1.2 获取当前用户信息
- **路径**: `/users/info`
- **方法**: `GET`
- **Header**: 需要携带 `Authorization: Bearer <token>`
- **返回**: 当前登录用户的信息。

---

## 2. 基础数据模块 (CRUD)

所有基础数据模块均遵循标准的 RESTful 风格，以 `供应商 (Suppliers)` 为例：

- **获取列表**: `GET /suppliers`
  - 可选 Query 参数: `page`, `pageSize`, `keyword`, `status`
- **新建**: `POST /suppliers`
- **更新**: `PUT /suppliers/:id`
- **删除**: `DELETE /suppliers/:id`

当前系统中可用的基础数据路由包括：
- **供应商管理**: `/suppliers`
- **客户管理**: `/customers`
- **部门管理**: `/departments`
- **加工厂管理**: `/factories`
- **成品档案**: `/finished-products`

---

## 3. 入库管理模块

### 3.1 原料入库
- **获取选项字典**: `GET /inbound-orders/create-options`
- **获取列表**: `GET /inbound-orders` (支持分页、单号、日期、状态搜索)
- **获取详情**: `GET /inbound-orders/:id`
- **新建单据**: `POST /inbound-orders`
- **修改单据**: `PUT /inbound-orders/:id`
- **删除单据**: `DELETE /inbound-orders/:id`

### 3.2 成品入库
- **获取选项字典**: `GET /finished-inbounds/options`
- **获取列表**: `GET /finished-inbounds`
- **获取详情**: `GET /finished-inbounds/:id`
- **审核入库单**: `PUT /finished-inbounds/:id/audit`
  - Body: `{ action: 'approve' | 'reject', reason: '...' }`
  - *说明: 审核通过后会自动写入 Inventory (库存) 表。*
- **撤销单据**: `PUT /finished-inbounds/:id/revoke`
- **删除单据**: `DELETE /finished-inbounds/:id`

---

## 4. 出库管理模块

### 4.1 原料出库
- **获取列表**: `GET /outbound-orders`
- **获取详情**: `GET /outbound-orders/:id`
- **审核出库单**: `PUT /outbound-orders/:id/audit`
  - *说明: 审核通过后会校验库存，如果充足则扣减库存。*
- **撤销单据**: `PUT /outbound-orders/:id/revoke`
- **删除单据**: `DELETE /outbound-orders/:id`

### 4.2 成品出库
- **获取列表**: `GET /finished-outbounds`
- **获取详情**: `GET /finished-outbounds/:id`
- **审核出库单**: `PUT /finished-outbounds/:id/audit`
- **撤销单据**: `PUT /finished-outbounds/:id/revoke`
- **删除单据**: `DELETE /finished-outbounds/:id`

---

## 5. 库存与盘点模块

### 5.1 原料库存查询
- **获取列表**: `GET /inventory/raw-materials`
- **获取详情**: `GET /inventory/raw-materials/:id`
- **新建/修改/删除**: `POST`, `PUT`, `DELETE` 路由同上

### 5.2 盘点管理
- **获取列表**: `GET /stocktaking` (支持按 `itemType` 区分原料和成品盘点)
- **获取详情**: `GET /stocktaking/:id`
- **审核盘点单**: `PUT /stocktaking/:id/audit`
  - *说明: 审核通过后会根据实际盘点数量与系统数量的差额，自动盘盈或盘亏并更新库存表。*
- **删除盘点单**: `DELETE /stocktaking/:id`

---

## 6. 仓位管理模块

- **获取仓位列表**: `GET /locations/list`
- **获取仓位详情**: `GET /locations/:locationCode`
- **新增仓位**: `POST /locations`
- **更新仓位**: `PUT /locations/:locationCode`
- **批量删除仓位**: `DELETE /locations/batch-delete`
- **更新仓位状态**: `PUT /locations/:locationCode/status`
- **获取统计数据**: `GET /locations/statistics`
- **刷新仓位占用**: `POST /locations/refresh-occupancy`

---

## 7. 系统设置模块

### 7.1 用户管理
- **获取用户列表**: `GET /users` (返回数据包含所分配的角色信息)
- **新建用户**: `POST /users`
- **更新用户**: `PUT /users/:id`
- **删除用户**: `DELETE /users/:id` (ID=1 的超级管理员被保护)

### 7.2 角色与权限管理 (RBAC)
- **获取权限树**: `GET /permissions`
- **获取角色列表**: `GET /roles`
- **新建角色**: `POST /roles` (Body: `{ name, description, permissionIds: [...] }`)
- **更新角色**: `PUT /roles/:id`
- **删除角色**: `DELETE /roles/:id`

### 7.3 操作日志
- **获取操作日志列表**: `GET /operation-logs`
  - Query: `page`, `pageSize`, `username`, `operationType`, `moduleName`, `startDate`, `endDate`

---

## 8. 系统监控
- **测试数据库连接**: `GET /test`
- **健康检查**: `GET /health` (或直接访问 `http://localhost:3000/health`)
