# 代码走查报告（feature/general-wms）

## 1. 范围与结论

由于当前环境未接入 MySQL，无法做业务闭环 E2E 验证；本报告采用“源码走查 + 构建验证 + 启动验证 + 关键接口探测”的方式评估系统可用性与风险点。

结论摘要：

- 前端工程可成功构建（`npm run build` 通过）。
- 前后端可启动，但后端数据库不可用时会导致系统整体不可用（登录 500，业务接口无法验证）。
- 后端已按业务域拆分路由，结构清晰；但数据库连接与健康检查策略仍需加强，避免“服务已启动但实际不可用”的状态。

## 2. 架构亮点

### 2.1 前后端职责清晰

- 前端统一以 `/api` 为 baseURL，集中在 [request.ts](file:///workspace/wms/src/utils/request.ts#L1-L112) 做鉴权与错误处理。
- 后端在 [server/index.js](file:///workspace/wms/server/index.js#L16-L36) 将路由按业务域拆分并统一挂载在 `/api` 前缀下，利于扩展和维护。

### 2.2 JWT 鉴权闭环明确

- 后端鉴权中间件 [auth.js](file:///workspace/wms/server/middleware/auth.js#L6-L25) 对 `/api/*` 进行校验，并放行登录路由 `/users/login`。
- 前端路由守卫 [router/index.ts](file:///workspace/wms/src/router/index.ts#L114-L130) 对需要登录的页面进行拦截。

### 2.3 API 调用层集中管理

- 前端业务 API 统一封装在 [api/index.ts](file:///workspace/wms/src/api/index.ts#L1-L114)，避免页面直接散落拼接 URL。

## 3. 关键风险与问题

### 3.1 数据库不可用时系统“假启动”（Critical）

现象：

- `/health` 返回 500 且提示 `database: disconnected`（见 [QA_TEST_REPORT_general-wms.md](file:///workspace/wms/docs/QA_TEST_REPORT_general-wms.md#L1-L72)）。
- `POST /api/users/login` 返回 500，导致前端无法进入系统。

建议：

- 启动时显式检测数据库连接，失败则：
  - 直接拒绝启动（退出进程）；或
  - 将健康检查返回码改为 503，并在响应体中输出可观测字段（db = down）。
- 将“数据库断连”类错误统一转换为可诊断的错误码与文案，避免前端仅显示“登录失败”。

关联代码：

- 连接池配置：[server/config/db.js](file:///workspace/wms/server/config/db.js#L4-L17)
- 健康检查路由：[server/routes/base.js](file:///workspace/wms/server/routes/base.js)
- 登录路由：[server/routes/users.js](file:///workspace/wms/server/routes/users.js)

### 3.2 MySQL2 连接配置存在警告（Warning）

启动日志提示：

- `Ignoring invalid configuration option passed to Connection: acquireTimeout/timeout/reconnect`

原因：

- [server/config/db.js](file:///workspace/wms/server/config/db.js#L14-L16) 中的部分字段不属于 mysql2 `createPool` 的有效参数（未来版本可能变为 error）。

建议：

- 按 mysql2 官方参数表修正 pool 配置（例如使用 `connectTimeout`，移除 `reconnect` 等无效项），并在 CI 中将警告视为失败以避免线上隐患。

### 3.3 前端依赖 Element Plus，构建产物体积偏大（Optimization）

构建日志可见 chunk 体积提示（`MainView` 相关产物超 500KB），建议：

- 路由级别按需加载（dynamic import）以降低首屏 JS 体积
- 对 ECharts 等大依赖进行拆包（manualChunks / 单独 chunk）

关联代码：

- 路由定义：[router/index.ts](file:///workspace/wms/src/router/index.ts#L1-L132)
- 仪表盘：[MainView.vue](file:///workspace/wms/src/views/home/components/MainView.vue)

## 4. 建议的“可执行”改进清单

- 健康检查：将 `/health` 设计为“服务可用性”而不仅是“进程存活”，DB down 时返回 503 并带错误码。
- 数据库连接：启动时做一次 `SELECT 1` 检查并打印诊断信息（host/db/user），但避免输出密码。
- 错误治理：统一错误响应结构（建议沿用 [server/middleware/errorHandler.js](file:///workspace/wms/server/middleware/errorHandler.js) 的模式）并在前端统一展示。
- 性能拆包：对路由页面做 lazy-load，减少首屏加载。

