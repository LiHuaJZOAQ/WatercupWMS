# WMS 全系统测试报告（feature/general-wms）

## 1. 测试概览

| 项目 | 内容 |
|---|---|
| 测试日期 | 2026-04-29 |
| 测试分支 | feature/general-wms |
| 前端地址 | http://localhost:5173 |
| 后端地址 | http://localhost:3000 |
| 测试类型 | 冒烟测试 + 接口可用性检查（受限：数据库未连接） |
| 证据产物 | [dogfood 报告](file:///workspace/wms/dogfood-output/general-wms/report.md)、[screenshots](file:///workspace/wms/dogfood-output/general-wms/screenshots) |

## 2. 环境与启动方式

### 2.1 前端

- 依赖安装：`npm install`
- 启动：`npm run dev:frontend`

### 2.2 后端

- 依赖安装：`cd server && npm install`
- 启动：`npm run dev:backend`
- 健康检查：`GET http://localhost:3000/health`

## 3. 测试范围（功能清单）

> 说明：本分支大多数页面均依赖登录态进入；登录依赖数据库读写。因此当前环境无法完成“业务闭环验证”，仅能完成“启动/路由/接口可达性/异常处理”层面的验证。

- 登录与会话：`/login`
- 主框架：`/home/*`
- 仪表盘：`/home/main`
- 入库：`/inStorage/rawMaterial`、`/inStorage/rawMaterial/review`
- 出库：`/outStorage/rawMaterial`、`/outStorage/wavePicking`
- 盘点：`/checkStorage/rawMaterial`
- 库存：`/inventory/rawMaterial`
- 库位：`/location/rawMaterial`
- 基础数据：`/basicData/*`
- 系统设置：`/system/*`
- PDA/扫码：`/mobile/scanner`

（完整路由映射参考：[router/index.ts](file:///workspace/wms/src/router/index.ts#L1-L132)）

## 4. 执行结果（按模块）

| 模块 | 预期 | 实测状态 | 备注 |
|---|---|---|---|
| 构建/类型检查 | `npm run build` 通过 | 通过 | 已验证 |
| 前端启动 | Vite 可访问 | 通过 | `http://localhost:5173` |
| 后端启动 | Express 可访问 | 部分通过 | 服务启动，但数据库未连接 |
| 健康检查 | `/health` 返回 200 | 失败 | 返回 500：`database: disconnected` |
| 登录 | 可登录进入主框架 | 失败 | `POST /api/users/login` 返回 500 |
| 业务页面（入/出库、库存、库位、盘点等） | 可读写数据 | 阻塞 | 依赖登录与数据库 |

## 5. 关键问题（结论）

### 5.1 阻塞级问题（Critical）

1. 后端健康检查返回 500：数据库未连接  
   - 证据：![issue-001-health](file:///workspace/wms/dogfood-output/general-wms/screenshots/issue-001-health.png)
2. 登录接口返回 500：无法进入系统  
   - 证据：![login-after-submit](file:///workspace/wms/dogfood-output/general-wms/screenshots/login-after-submit.png)

完整复现步骤与说明见：[dogfood 报告](file:///workspace/wms/dogfood-output/general-wms/report.md)

## 6. 建议（如何补齐“全功能验证”）

- 准备可用 MySQL 环境并导入初始化数据（参考：[init-db.js](file:///workspace/wms/server/init-db.js)、[DATABASE_DESIGN.md](file:///workspace/wms/docs/DATABASE_DESIGN.md)）
- 在 `.env` 中配置数据库连接参数（不要在文档/日志中泄露真实密码）
- 获取可用测试账号（或提供“本地开发默认账号”机制），否则无法覆盖 UI 受保护路由的功能验证

