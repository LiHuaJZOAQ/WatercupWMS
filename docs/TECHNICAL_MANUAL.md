# WMS 技术文档（feature/general-wms）

## 1. 系统概述

本系统为仓储管理系统（WMS），提供入库、出库、库存、库位、盘点、波次拣货等核心能力，并包含基础数据与系统权限配置能力。

整体采用“前后端分离”：

- 前端：Vue 3 + Vue Router + Pinia + Element Plus（当前分支）  
- 后端：Express + MySQL（mysql2/promise）+ JWT

## 2. 代码结构

### 2.1 前端目录

- 路由与鉴权：[router/index.ts](file:///workspace/wms/src/router/index.ts#L1-L132)
- 全局请求封装（Axios）：[utils/request.ts](file:///workspace/wms/src/utils/request.ts#L1-L112)
- API 调用封装：[api/index.ts](file:///workspace/wms/src/api/index.ts#L1-L114)
- 登录态（Pinia）：[stores/auth.ts](file:///workspace/wms/src/stores/auth.ts)
- 主容器与布局：[HomeView.vue](file:///workspace/wms/src/views/home/HomeView.vue)
- 页面模块：位于 [views/home/components](file:///workspace/wms/src/views/home/components)

### 2.2 后端目录

- 服务入口与路由挂载：[server/index.js](file:///workspace/wms/server/index.js#L1-L48)
- 数据库连接池：[server/config/db.js](file:///workspace/wms/server/config/db.js#L1-L17)
- JWT 中间件：[server/middleware/auth.js](file:///workspace/wms/server/middleware/auth.js#L1-L28)
- 路由实现：位于 [server/routes](file:///workspace/wms/server/routes)

## 3. 运行与配置

### 3.1 运行方式（开发）

- 前端：在仓库根目录执行 `npm run dev:frontend`（Vite 默认端口 5173）
- 后端：在仓库根目录执行 `npm run dev:backend`（Express 默认端口 3000）
- 联合启动：`npm run dev`（concurrently 同时启动前后端）

### 3.2 环境变量与数据库

后端数据库配置由 [server/config/db.js](file:///workspace/wms/server/config/db.js#L4-L16) 读取环境变量：

- `DB_HOST`（默认 localhost）
- `DB_USER`（默认 root）
- `DB_PASSWORD`（默认 root）
- `DB_NAME`（默认 watercup_wms）
- `DB_CONNECTION_LIMIT`（默认 10）

建议使用 MySQL 并按 [DATABASE_DESIGN.md](file:///workspace/wms/docs/DATABASE_DESIGN.md) 初始化表结构与测试数据；初始化脚本见 [init-db.js](file:///workspace/wms/server/init-db.js)。

## 4. 鉴权与会话

### 4.1 前端登录态

- 登录成功后 token 由 Pinia store 持久化（localStorage），逻辑见 [auth.ts](file:///workspace/wms/src/stores/auth.ts)。
- 路由守卫对 `meta.requiresAuth` 的页面进行拦截，无 token 会跳转登录页，见 [router/index.ts](file:///workspace/wms/src/router/index.ts#L114-L130)。

### 4.2 后端 JWT

- `/api/users/login` 允许匿名访问（中间件放行），见 [auth.js](file:///workspace/wms/server/middleware/auth.js#L6-L11)。
- 其余 `/api/*` 需要 `Authorization: Bearer <token>`，否则返回 401/403，见 [auth.js](file:///workspace/wms/server/middleware/auth.js#L12-L25)。

## 5. 通用请求与错误处理

### 5.1 Axios 封装

前端统一使用 [utils/request.ts](file:///workspace/wms/src/utils/request.ts#L1-L112)：

- `baseURL: '/api'`（依赖 Vite 代理到后端 3000）
- 请求拦截器：自动附加 `Authorization: Bearer <token>`
- 响应拦截器：
  - `401`：清理 token 并跳转登录
  - 其它错误：统一弹出提示并返回 reject

### 5.2 API 调用层

业务页面原则上只通过 [api/index.ts](file:///workspace/wms/src/api/index.ts#L1-L114) 调用后端，避免散落的 URL 字符串。

## 6. 功能模块实现说明（前端 + 后端）

> 说明：以下按“用户视角的功能模块”描述实现路径，包括：前端路由入口、页面组件、API 调用与后端路由。

### 6.1 登录

- 前端页面：[/login](file:///workspace/wms/src/views/LoginView.vue)
- API：`api.login(data)` → `POST /api/users/login`，见 [api/index.ts](file:///workspace/wms/src/api/index.ts#L8-L15)
- 后端：登录与签发 token 见 [server/routes/users.js](file:///workspace/wms/server/routes/users.js)
- 登录后：
  - token 写入 auth store
  - 跳转到 `/home/main`（路由见 [router/index.ts](file:///workspace/wms/src/router/index.ts#L7-L48)）

### 6.2 主框架（Home/布局）

- 容器路由：`/home/*`，见 [router/index.ts](file:///workspace/wms/src/router/index.ts#L12-L48)
- 主容器组件：[HomeView.vue](file:///workspace/wms/src/views/home/HomeView.vue)
  - 左侧导航：[NavigationView.vue](file:///workspace/wms/src/views/home/components/NavigationView.vue#L1-L149)
  - 顶部栏（用户信息/退出）：[TopView.vue](file:///workspace/wms/src/views/home/components/TopView.vue#L1-L18)
  - 内容区：`<router-view />`（按模块切换页面）

### 6.3 仪表盘（Dashboard）

- 前端页面：[/home/main](file:///workspace/wms/src/views/home/components/MainView.vue)
- API：`getDashboardSummary()` → `GET /api/dashboard/summary`，见 [api/index.ts](file:///workspace/wms/src/api/index.ts#L6-L8)
- 后端：汇总数据生成见 [server/routes/dashboard.js](file:///workspace/wms/server/routes/dashboard.js)
- 展示：
  - KPI（库存、出入库、待办等）
  - 图表（ECharts）：图表配置与数据映射逻辑在 [MainView.vue](file:///workspace/wms/src/views/home/components/MainView.vue) 内部实现

### 6.4 入库管理（Inbound Orders）

- 前端入口：[/inStorage/rawMaterial](file:///workspace/wms/src/views/home/components/InStorage/InboundOrder.vue)
- 核心能力：
  - 列表查询、分页、筛选：`getInboundOrders(params)` → `GET /api/inbound-orders`
  - 新建入库单：弹窗组件 [InboundOrderCreate.vue](file:///workspace/wms/src/views/home/components/InStorage/InboundOrderCreate.vue)，提交 `createInboundOrder(data)` → `POST /api/inbound-orders`
  - 审核/撤销：`auditInboundOrders(data)`、`revokeInboundOrders(data)` → `PUT /api/inbound-orders/audit|revoke`
  - 详情：`getInboundOrderDetail(id)` → `GET /api/inbound-orders/:id`
  - 打印数据：`getInboundOrderPrint(id)` → `GET /api/inbound-orders/:id/print`
  - 导出：`exportInboundOrders(params)` → `GET /api/inbound-orders/export`
- 后端实现：[server/routes/inboundOrders.js](file:///workspace/wms/server/routes/inboundOrders.js)

### 6.5 出库管理（Outbound Orders）

- 前端入口：[/outStorage/rawMaterial](file:///workspace/wms/src/views/home/components/OutStorage/OutboundOrder.vue)
- 核心能力：
  - 列表/筛选：`getOutboundOrders(params)` → `GET /api/outbound-orders`
  - 详情：`getOutboundOrderDetail(id)` → `GET /api/outbound-orders/:id`
  - 审核：`auditOutboundOrder(id, data)` → `PUT /api/outbound-orders/:id/audit`
  - 撤销：`revokeOutboundOrder(id)` → `PUT /api/outbound-orders/:id/revoke`
  - 删除：`deleteOutboundOrder(id)` → `DELETE /api/outbound-orders/:id`
- 后端实现：[server/routes/outboundOrders.js](file:///workspace/wms/server/routes/outboundOrders.js)

### 6.6 波次拣货（Wave Picking）

- 前端入口：[/outStorage/wavePicking](file:///workspace/wms/src/views/home/components/OutStorage/WavePicking.vue)
- 页面组成：
  - 波次列表与状态（待拣/拣货中/已完成）
  - 智能推荐（按订单/库位聚合）与“生成波次”
  - 拣货路径可视化弹窗：[PickPathMap.vue](file:///workspace/wms/src/views/home/components/PickPathMap.vue)
- 后端接口（概览）：
  - `GET /api/waves`
  - `POST /api/waves/recommend`
  - `POST /api/waves`
  - `GET /api/waves/:id/pick-map`
  - `PUT /api/waves/:id/complete`
  - 具体实现：[server/routes/wave.js](file:///workspace/wms/server/routes/wave.js)

### 6.7 盘点管理（Stocktaking）

- 前端入口：[/checkStorage/rawMaterial](file:///workspace/wms/src/views/home/components/CheckStorage/Stocktaking.vue)
- API：
  - 列表：`getStocktakings(params)` → `GET /api/stocktaking`
  - 详情：`getStocktakingDetail(id)` → `GET /api/stocktaking/:id`
  - 审核：`auditStocktaking(id, data)` → `PUT /api/stocktaking/:id/audit`
  - 删除：`deleteStocktaking(id)` → `DELETE /api/stocktaking/:id`
- 后端实现：[server/routes/stocktaking.js](file:///workspace/wms/server/routes/stocktaking.js)

### 6.8 全局库存查询（Inventory）

- 前端入口：[/inventory/rawMaterial](file:///workspace/wms/src/views/home/components/InventoryManage/Inventory.vue)
- API：`getInventory(params)` → `GET /api/inventory`，见 [api/index.ts](file:///workspace/wms/src/api/index.ts#L88-L90)
- 后端实现：[server/routes/inventory.js](file:///workspace/wms/server/routes/inventory.js)
- 典型交互：
  - 多条件筛选（关键字/分类/状态等）
  - 库存明细查看（分库位、批次等）

### 6.9 库位管理（Location）

- 前端入口：[/location/rawMaterial](file:///workspace/wms/src/views/home/components/LocationManage/Location.vue)
- 后端实现：[server/routes/locations.js](file:///workspace/wms/server/routes/locations.js)
- 关联打印：
  - 条码生成：`GET /api/print/barcode?text=...`，路由挂载见 [server/index.js](file:///workspace/wms/server/index.js#L23-L25)，实现见 [server/routes/print.js](file:///workspace/wms/server/routes/print.js)

### 6.10 基础数据

- 往来单位（Partner）：前端 [Partner.vue](file:///workspace/wms/src/views/home/components/BasicData/Partner.vue)，后端 [partners.js](file:///workspace/wms/server/routes/partners.js)
- 商品档案（Item/SKU）：前端 [Item.vue](file:///workspace/wms/src/views/home/components/BasicData/Item.vue)，后端 [items.js](file:///workspace/wms/server/routes/items.js)
- 部门（Department）：前端 [Department.vue](file:///workspace/wms/src/views/home/components/BasicData/Department.vue)（如果对应后端未单独拆分，需在现有路由中确认）
- 客户/加工厂：当前有页面组件 [Customer.vue](file:///workspace/wms/src/views/home/components/BasicData/Customer.vue)、[ProcessingFactory.vue](file:///workspace/wms/src/views/home/components/BasicData/ProcessingFactory.vue)，但路由是否启用以 [router/index.ts](file:///workspace/wms/src/router/index.ts#L49-L99) 为准

### 6.11 系统设置（用户/角色/日志）

- 用户管理：前端 [UserManage.vue](file:///workspace/wms/src/views/home/components/System/UserManage.vue)，后端 [userManage.js](file:///workspace/wms/server/routes/userManage.js)
- 角色与权限：前端 [RoleManage.vue](file:///workspace/wms/src/views/home/components/System/RoleManage.vue)，后端 [roles.js](file:///workspace/wms/server/routes/roles.js)
- 操作日志：前端 [OperationLog.vue](file:///workspace/wms/src/views/home/components/System/OperationLog.vue)，后端 [operationLogs.js](file:///workspace/wms/server/routes/operationLogs.js)

### 6.12 PDA / 扫码工作台（模拟）

- 前端入口：[/mobile/scanner](file:///workspace/wms/src/views/home/components/MobileScanner.vue)
- 实现方式：
  - 通过输入框接收扫描内容
  - 解析前缀（如 `LOC/ MAT/ ORD`）以区分“库位/物料/单据”类型
  - 记录扫描历史与状态（此模块偏前端演示/模拟，不强依赖后端）

## 7. 数据库与业务流程参考

- 数据库设计：[DATABASE_DESIGN.md](file:///workspace/wms/docs/DATABASE_DESIGN.md)
- 业务流程说明：[BUSINESS_FLOW.md](file:///workspace/wms/docs/BUSINESS_FLOW.md)

## 8. 已知限制与排障建议

### 8.1 数据库依赖导致的“无法登录/接口 500”

- 若 `/health` 返回 `database: disconnected`，说明 MySQL 未启动或连接参数不正确。
- 登录接口 `POST /api/users/login` 依赖数据库校验用户；数据库不可用时会导致前端无法进入系统。
- 建议优先保障：
  - MySQL 可用
  - `.env` 配置正确
  - 初始化脚本执行成功

