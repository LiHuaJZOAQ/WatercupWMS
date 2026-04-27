const fs = require('fs');
const { execSync } = require('child_process');

try {
  // Read original README from main
  const original = execSync('git show main:README.md', { encoding: 'utf-8' });

  // 1. Process feature/innovative-wms
  execSync('git checkout feature/innovative-wms');
  let innoReadme = original
    .replace(
      '# 水杯生产企业仓储管理系统 (WMS)',
      '# 水杯生产企业仓储管理系统 (WMS) - 智能创新版'
    )
    .replace(
      '包括入库管理、出库管理、库存管理、盘点管理等核心功能模块。',
      '包括入库管理、出库管理、库存管理、盘点管理等核心功能模块。\n\n> **🚀 本分支 (feature/innovative-wms) 专属特性**：\n> 在原基础之上，引入了**企业级模块化后端架构**与**现场执行层创新功能**，包含移动端 PDA 扫码支持、智能波次拣货算法以及 3D/2D 拣货路线可视化。'
    )
    .replace(
      '│   └── index.js                    # 后端API接口服务',
      '│   ├── config/                     # 集中化配置 (如 env.js, db.js)\n│   ├── middleware/                 # 中间件 (如 auth.js)\n│   ├── routes/                     # 模块化路由 (16+ API文件)\n│   └── index.js                    # 后端API入口'
    )
    .replace(
      '### 5. 其他功能模块',
      '### 5. 现场执行与创新功能 (新增)\n- **移动扫码工作台 (PDA)**: 浏览器内模拟现场工人的 PDA 扫码枪作业，智能解析库位、物料条码。\n- **智能波次拣货**: 后端智能推荐算法聚合多出库单，生成波次任务，提升拣货效率。\n- **3D/2D 拣货路径地图**: 基于 SVG 动态绘制波次拣货的最短行走路线。\n\n### 6. 其他功能模块'
    )
    .replace(
      '- **路由守卫**: 基于`meta.requiresAuth`的访问控制',
      '- **路由守卫**: 基于`meta.requiresAuth`的访问控制与全局拦截未登录跳转\n- **JWT鉴权**: 后端全局中间件拦截验证'
    );

  fs.writeFileSync('README.md', innoReadme);
  execSync('git add README.md && git commit -m "docs: restore original README structure and append innovative features"');
  console.log('innovative-wms README restored and updated.');

  // 2. Process feature/general-wms
  execSync('git checkout feature/general-wms');
  let genReadme = original
    .replace(
      '# 水杯生产企业仓储管理系统 (WMS)',
      '# 通用仓储管理系统 (General WMS)'
    )
    .replace(
      '专为水杯生产企业设计。系统提供完整的仓储管理解决方案，包括入库管理、出库管理、库存管理、盘点管理等核心功能模块。',
      '本项目最初为“水杯生产企业仓储管理系统”，经过深度架构重构，现已升级为一个**高扩展性、跨行业的通用仓储管理系统**。系统不再与任何特定制造业强绑定，废除了特定的原料/成品限制，引入了通用的 SKU 和往来单位模型，完美支持电商、3C 数码、服装、生鲜等各类流转业务。'
    )
    .replace(
      '│   └── index.js                    # 后端API接口服务',
      '│   ├── config/                     # 集中化配置\n│   ├── middleware/                 # 鉴权中间件\n│   ├── routes/                     # 通用API路由 (items, partners, inboundOrders等)\n│   └── index.js                    # 后端API入口'
    )
    .replace(
      '│   │   ├── InStorage/             # 入库管理\n│   │   │   ├── RawMaterial.vue           # 原料入库列表\n│   │   │   ├── InboundOrderCreate.vue    # 入库单创建\n│   │   │   └── Review.vue                # 入库审核\n│   │   ├── OutStorage/            # 出库管理\n│   │   │   └── OutRawMaterial.vue        # 原料出库\n│   │   ├── CheckStorage/          # 盘点管理\n│   │   │   └── CheckRawMaterial.vue      # 原料盘点\n│   │   ├── InventoryManage/       # 库存管理\n│   │   │   └── InventoryRawMaterial.vue  # 原料库存\n│   │   └── LocationManage/        # 库位管理\n│   │       └── LocationRawMaterial.vue   # 原料库位',
      '│   │   ├── InStorage/             # 入库管理\n│   │   │   ├── InboundOrder.vue          # 通用入库单管理\n│   │   │   ├── InboundOrderCreate.vue    # 入库单创建\n│   │   │   └── Review.vue                # 入库审核\n│   │   ├── OutStorage/            # 出库管理\n│   │   │   ├── OutboundOrder.vue         # 通用出库单管理\n│   │   │   └── WavePicking.vue           # 智能波次拣货\n│   │   ├── CheckStorage/          # 盘点管理\n│   │   │   └── Stocktaking.vue           # 通用盘点作业\n│   │   ├── InventoryManage/       # 库存管理\n│   │   │   └── Inventory.vue             # 全局库存查询\n│   │   └── LocationManage/        # 库位管理\n│   │       └── Location.vue              # 库位拓扑管理'
    )
    .replace(
      '#### 原料入库管理 (`RawMaterial.vue`)',
      '#### 通用入库单管理 (`InboundOrder.vue`)'
    )
    .replace(
      '多维度筛选查询（订单状态、入库单号、原料信息等）',
      '多维度筛选查询（订单状态、入库单号、商品SKU信息等）'
    )
    .replace(
      '原料明细动态添加/删除',
      '商品明细动态添加/删除'
    )
    .replace(
      '#### 原料盘点 (`CheckRawMaterial.vue`)',
      '#### 通用盘点作业 (`Stocktaking.vue`)'
    )
    .replace(
      '### 5. 其他功能模块',
      '### 5. 现场执行与创新功能 (继承自创新分支)\n- **移动扫码工作台 (PDA)**: 浏览器内模拟现场工人的 PDA 扫码枪作业。\n- **智能波次拣货**: 聚合多单据，生成波次任务，提升拣货效率。\n- **3D/2D 拣货路径地图**: 基于 SVG 动态绘制最短拣货行走路线。\n\n### 6. 其他功能模块'
    )
    .replace(
      '- **出库管理**: 原料出库流程控制',
      '- **出库管理**: 通用出库单流程控制'
    )
    .replace(
      '- **路由守卫**: 基于`meta.requiresAuth`的访问控制',
      '- **路由守卫**: 基于`meta.requiresAuth`的访问控制与全局拦截未登录跳转\n- **JWT鉴权**: 后端全局中间件拦截验证'
    );

  fs.writeFileSync('README.md', genReadme);
  execSync('git add README.md && git commit -m "docs: restore original README structure and append general wms features"');
  console.log('general-wms README restored and updated.');

} catch (error) {
  console.error("Error running script:", error.message);
  if (error.stdout) console.error(error.stdout.toString());
}
