# 通用型仓储（Node.js）功能完备性检查报告

## 1. 检查范围

基于 feature/general-wms 分支的“通用型仓储”实现，对以下维度做检查：

- 前端路由与页面覆盖
- 后端 API 覆盖（Express 路由）
- 数据库契约覆盖（以 [genwms.sql](file:///workspace/wms/genwms.sql) 为准）
- 关键业务闭环是否可完成（创建/审核/库存变更/波次/盘点）

## 2. 功能模块覆盖结论

### 2.1 模块覆盖（页面/路由维度）

前端已覆盖的模块（入口路由见 [router/index.ts](file:///workspace/wms/src/router/index.ts#L1-L132)）：

- 登录、主框架、仪表盘
- 基础数据：往来单位（Partner）、商品（Item）
- 入库：入库单列表/新建/审核/撤销/导出/打印
- 出库：出库单列表/详情/审核/撤销/删除
- 波次：推荐/生成/拣货地图/完成
- 盘点：盘点单列表/详情/审核/删除
- 库存：库存查询
- 库位：库位管理 + 条码打印
- 系统：用户/角色/权限树/操作日志
- 移动端：扫码工作台（偏模拟）

### 2.2 API 覆盖（后端维度）

后端路由按业务域拆分并统一挂载在 `/api`，入口见 [server/index.js](file:///workspace/wms/server/index.js#L1-L48)。

核心域接口齐备：

- 认证：`POST /api/users/login`、`GET /api/users/info`（[users.js](file:///workspace/wms/server/routes/users.js)）
- 仪表盘：`GET /api/dashboard/summary`（[dashboard.js](file:///workspace/wms/server/routes/dashboard.js)）
- 主数据：`/api/partners`、`/api/items`（[partners.js](file:///workspace/wms/server/routes/partners.js)、[items.js](file:///workspace/wms/server/routes/items.js)）
- 入库：`/api/inbound-orders`（[inboundOrders.js](file:///workspace/wms/server/routes/inboundOrders.js)）
- 出库：`/api/outbound-orders`（[outboundOrders.js](file:///workspace/wms/server/routes/outboundOrders.js)）
- 波次：`/api/waves`（[wave.js](file:///workspace/wms/server/routes/wave.js)）
- 库存：`/api/inventory`（[inventory.js](file:///workspace/wms/server/routes/inventory.js)）
- 盘点/库位：`/api/stocktaking`、`/api/locations`、`/api/warehouses/options`（[stocktaking.js](file:///workspace/wms/server/routes/stocktaking.js)）
- 角色/权限/用户/日志：`/api/roles`、`/api/permissions`、`/api/users`、`/api/operation-logs`（[roles.js](file:///workspace/wms/server/routes/roles.js)、[userManage.js](file:///workspace/wms/server/routes/userManage.js)、[operationLogs.js](file:///workspace/wms/server/routes/operationLogs.js)）

## 3. 数据库契约（genwms.sql）覆盖点

本次补齐的通用型仓储数据库脚本为 [genwms.sql](file:///workspace/wms/genwms.sql)，目标是让通用型仓储后端在“同一份脚本”下具备可运行的表结构与测试数据。

关键点：

- 通用主数据：`Partner`、`Item`
- 通用单据：`InboundOrder/InboundOrderDetail`、`OutboundOrder/OutboundOrderDetail`
- 仓库与库位：`Warehouse`、`Location`
- 库存：`Inventory`（含 `AvailableQuantity/ReservedQuantity`）
- 波次：`Wave/WaveDetail` 直接关联 `OutboundOrder`
- 盘点：`Stocktaking/StocktakingDetail`
- 鉴权与权限：`User/Role/UserRole/Permission/RolePermission`
- 运维审计：`OperationLog`、`SystemConfig`、`NumberSequence`

另外：由于现有代码对 `InventoryTransaction` 的字段引用存在多套命名（Dashboard/Inbound/Stocktaking），`genwms.sql` 采用“字段超集 + 触发器自动补全”的方式兼容现有实现。

## 4. 仍需补齐/存在缺口（功能完备性角度）

### 4.1 前端与后端不一致（影响“完备”体验）

- 出库页/盘点页部分按钮在 UI 侧提示“尚未实现”（例如新建、打印等），但后端已存在部分对应接口或可扩展点（需要统一交互与接口对接）。
- 部分业务字段/状态值在前后端/数据库侧未强约束，容易出现大小写不一致导致筛选异常（建议统一状态枚举集合）。

### 4.2 环境依赖导致无法完成 E2E

在当前运行环境中未启动 MySQL，导致：

- `/health` 返回 500（database disconnected）
- 登录与业务 API 无法完成闭环验证

该问题不属于“功能缺失”，但会阻塞“完备性验收”。建议使用 `genwms.sql` 在可用 MySQL 环境中初始化后再做全链路验收。

## 5. 建议的验收流程（上线前）

- 1）执行 `genwms.sql` 初始化数据库与测试数据
- 2）使用 `admin/admin123` 登录（见脚本内置测试用户）
- 3）按业务闭环走查：
  - 新建入库单 → 审核 → 库存增加
  - 新建出库单 → 审核（预留）→ 波次推荐/生成 → 完成波次 → 库存扣减
  - 发起盘点 → 录入实盘 → 审核 → 库存纠偏 + 流水记录
  - 权限：创建角色 → 分配权限树 → 绑定用户 → 验证菜单可见性

