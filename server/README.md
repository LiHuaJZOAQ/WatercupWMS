# 水杯WMS系统 - 前后端集成使用指南

## 📋 概述

本指南详细说明如何将原料库存管理和原料仓位管理的前端页面与后端API正确集成。

## 🚀 快速开始

### 1. 后端服务启动

确保后端服务已正确启动：

```bash
cd src/server
node index.js
```

服务启动后应显示：
```
水杯WMS系统后端服务启动成功
服务地址: http://localhost:3000
```

### 2. 前端文件结构

请按以下结构组织前端文件：

```
src/
├── api/
│   ├── inventory.ts          # 原料库存管理API
│   ├── location.ts           # 原料仓位管理API
│   └── path.ts               # API路径配置
├── utils/
│   └── request.ts            # HTTP请求工具
└── views/home/components/
    ├── InventoryManage/
    │   └── InventoryRawMaterial.vue    # 原料库存管理页面
    └── LocationManage/
        └── LocationRawMaterial.vue     # 原料仓位管理页面
```

## 🔧 配置步骤

### 第1步：配置HTTP请求工具

将提供的 `request.ts` 文件放入 `src/utils/` 目录。

### 第2步：配置API路径

将提供的 `path.ts` 文件放入 `src/api/` 目录。

### 第3步：添加API接口文件

将以下文件放入 `src/api/` 目录：
- `inventory.ts` - 原料库存管理API
- `location.ts` - 原料仓位管理API

### 第4步：更新Vue组件

替换现有的Vue组件文件：
- `InventoryRawMaterial.vue` - 原料库存管理组件
- `LocationRawMaterial.vue` - 原料仓位管理组件

## 📝 API接口说明

### 原料库存管理API

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取库存列表 | GET | `/api/inventory/raw-materials` | 支持分页和筛选 |
| 获取库存详情 | GET | `/api/inventory/raw-materials/:id` | 获取单个原料详情 |
| 新增原料 | POST | `/api/inventory/raw-materials` | 创建新原料 |
| 更新原料 | PUT | `/api/inventory/raw-materials/:id` | 更新原料信息 |
| 删除原料 | DELETE | `/api/inventory/raw-materials/:id` | 删除原料 |

### 原料仓位管理API

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取仓位列表 | GET | `/api/locations/raw-materials` | 支持分页和筛选 |
| 新增仓位 | POST | `/api/locations/raw-materials` | 创建新仓位 |
| 更新仓位 | PUT | `/api/locations/raw-materials/:id` | 更新仓位信息 |
| 删除仓位 | DELETE | `/api/locations/raw-materials/:id` | 删除单个仓位 |
| 批量删除仓位 | DELETE | `/api/locations/raw-materials` | 批量删除仓位 |
| 获取原料选项 | GET | `/api/locations/raw-materials/options` | 获取原料下拉选项 |

## 🔐 认证配置

### Token存储

系统使用JWT Token进行认证，Token存储在localStorage中：

```typescript
// 存储token
localStorage.setItem('token', 'your-jwt-token')

// 获取token
const token = localStorage.getItem('token')

// 清除token
localStorage.removeItem('token')
```

### 自动认证

HTTP请求工具已配置自动添加认证头：

```typescript
// 请求拦截器自动添加
config.headers.Authorization = `Bearer ${token}`
```

## 📊 数据格式说明

### 原料库存数据格式

```typescript
interface RawMaterialInventory {
  id: number
  code: string              // 原料编码
  name: string              // 原料名称
  category: string          // 分类
  specification: string     // 规格
  unit: string              // 单位
  status: string            // 状态：1-启用，0-禁用
  remark: string            // 备注
}
```

## 🚨 常见问题解决

### 1. CORS跨域问题

如果遇到跨域错误，确保后端已配置CORS：

```javascript
// index.js中已包含
app.use(cors());
```

### 2. 认证失败问题

检查Token是否正确存储和发送：

```javascript
// 检查token是否存在
const token = localStorage.getItem('token');
console.log('当前token:', token);

// 手动设置token（测试用）
localStorage.setItem('token', 'your-test-token');
```

### 3. 数据库连接问题

确保数据库配置正确：

```javascript
// index.js中的数据库配置
const pool = createPool({
  host: 'localhost',
  user: 'root',
  password: 'root', // 修改为你的密码
  database: 'watercup_wms',
  // ... 其他配置
});
```

### 4. 端口冲突问题

如果3000端口被占用，修改端口：

```javascript
// index.js
const port = 3001; // 改为其他端口

// path.ts
BASE_URL: 'http://localhost:3001', // 对应修改
```

## 🧪 测试指南

### 1. API测试

使用以下工具测试API：

```bash
# 测试数据库连接
curl http://localhost:3000/api/test

# 测试健康检查
curl http://localhost:3000/health

# 测试登录
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2. 前端功能测试

按以下步骤测试前端功能：

1. **登录测试**
   - 访问登录页面
   - 输入正确的用户名密码
   - 检查是否正确跳转

2. **原料库存管理测试**
   - 查看库存列表
   - 测试搜索筛选功能
   - 测试新增/编辑/删除功能

3. **原料仓位管理测试**
   - 查看仓位列表
   - 测试新增仓位功能
   - 测试批量删除功能

## 📚 扩展功能

### 1. 添加图片上传功能

```typescript
// 在request.ts中添加图片上传方法
export const uploadImage = (file: File, type: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  
  return HttpRequest.upload('/api/upload/image', formData)
}
```

### 2. 添加实时数据更新

```typescript
// 使用WebSocket或Server-Sent Events
const eventSource = new EventSource('/api/stream/inventory')
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  // 更新库存数据
  updateInventoryData(data)
}
```

### 3. 添加数据缓存

```typescript
// 使用localStorage缓存数据
export const CacheManager = {
  set(key: string, data: any, expiry: number = 300000) { // 5分钟过期
    const item = {
      data,
      timestamp: Date.now(),
      expiry
    }
    localStorage.setItem(key, JSON.stringify(item))
  },
  
  get(key: string) {
    const item = localStorage.getItem(key)
    if (!item) return null
    
    const parsed = JSON.parse(item)
    if (Date.now() - parsed.timestamp > parsed.expiry) {
      localStorage.removeItem(key)
      return null
    }
    
    return parsed.data
  }
}
```

## 🔧 性能优化建议

### 1. 前端优化

- **懒加载**: 大型组件使用动态导入
- **虚拟滚动**: 大数据列表使用虚拟滚动
- **防抖节流**: 搜索输入使用防抖

```typescript
// 防抖搜索示例
import { debounce } from 'lodash-es'

const debouncedSearch = debounce((keyword: string) => {
  // 执行搜索
  handleSearch(keyword)
}, 300)
```

### 2. 后端优化

- **数据库索引**: 为常用查询字段添加索引
- **连接池**: 合理配置数据库连接池
- **缓存**: 使用Redis缓存热点数据

```sql
-- 添加索引优化查询
CREATE INDEX idx_rawmaterial_name ON RawMaterial(MaterialName);
CREATE INDEX idx_inventory_item ON Inventory(ItemType, ItemID);
CREATE INDEX idx_location_warehouse ON Location(WarehouseID, LocationType);
```

## 📝 维护指南

### 1. 日志管理

添加更详细的日志记录：

```javascript
// 使用winston日志库
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 2. 错误监控

集成错误监控服务：

```javascript
// 全局错误处理
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // 发送到监控服务
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
```

### 3. 数据备份

定期备份数据库：

```bash
#!/bin/bash
# backup.sh
DATE=$(date +"%Y%m%d_%H%M%S")
mysqldump -u root -p watercup_wms > backup_${DATE}.sql
```

## 🎯 总结

通过以上配置，您的水杯WMS系统的原料库存管理和原料仓位管理模块应该能够正常运行。主要完成了：

✅ **后端API开发**: 完整的CRUD操作接口
✅ **前端组件更新**: 与API完美对接的Vue组件  
✅ **认证机制**: JWT Token认证系统
✅ **错误处理**: 统一的错误处理机制
✅ **数据导出**: Excel导出功能
✅ **统计功能**: 数据统计分析接口

如遇到问题，请检查：
1. 数据库连接是否正常
2. 后端服务是否启动
3. 前端API路径是否正确
4. 认证Token是否有效

建议在生产环境中添加更多的安全措施、性能优化和监控功能。单位
  stock: number             // 库存数量
  status: string            // 状态：正常/盘盈/盘亏
  minStock?: number         // 最小库存
  maxStock?: number         // 最大库存
}
```

### 原料仓位数据格式

```typescript
interface RawMaterialLocation {
  id: number
  materialId: number        // 原料ID
  materialCode: string      // 原料编码
  materialName: string      // 原料名称
  specification: string     // 规格
  locationCode: string      // 仓位编号
  locationName: string      // 仓位名称
  quantity: number          // 库存数量
  unit: string              // 单位
  remark: string            // 备注
}
```

## To be continued...