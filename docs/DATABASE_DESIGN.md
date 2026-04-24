# WMS 数据库设计文档 (Database Design Document)

## 1. 整体架构与规范

- **数据库引擎**：MySQL / InnoDB。
- **字符集**：`utf8mb4`，支持完整的多语言和表情符号存储。
- **设计原则**：强一致性（外键约束、级联规则）、审计追踪（创建人、创建时间、更新时间）、状态驱动（Status）。

## 2. 核心数据表结构

### 2.1 基础数据模块 (Master Data)
- **`User` (用户表)**
  - `UserID` (PK), `Username`, `PasswordHash`, `FullName`, `Email`, `Department`, `Position`
- **`Role` (角色与权限表)**
  - `RoleID` (PK), `RoleName`, `Description`, `Permissions` (JSON), `CreatedAt`
- **`Supplier` / `Customer` (客商表)**
  - `SupplierID` (PK), `SupplierCode`, `SupplierName`, `ContactPerson`, `ContactPhone`, `Address`, `Status`
- **`ProcessingFactory` (加工厂表)**
  - `FactoryID` (PK), `FactoryCode`, `FactoryName`, `ContactPerson`, `Status`
- **`RawMaterial` / `FinishedProduct` (物料档案表)**
  - `MaterialID` / `ProductID` (PK), `Code`, `Name`, `Category`, `Unit`, `Specification`, `MinStock`, `MaxStock`

### 2.2 库存与库位模块 (Inventory & Location)
- **`Location` (库位表)**
  - `LocationID` (PK), `LocationCode` (UNIQUE), `WarehouseType` (原料库/成品库), `Row` (排), `Column` (列), `Layer` (层), `Status`, `Occupancy` (占用状态: Empty, Low, Medium, High, Full)
- **`Inventory` (实时库存主表)**
  - `InventoryID` (PK), `MaterialID`, `WarehouseType`, `LocationCode` (FK), `CurrentQuantity` (账面数量), `AvailableQuantity` (可用数量), `LockedQuantity` (锁定数量), `LastUpdatedTime`
- **`InventoryTransaction` (库存流水表)**
  - `TransactionID` (PK), `MaterialID`, `TransactionType` (入库, 出库, 盘点调整等), `Quantity` (发生数, 正负值), `SourceDocumentNo` (关联单据号), `TransactionTime`, `OperatorID`

### 2.3 单据流转模块 (Documents)
- **`RawMaterialInbound` / `FinishedProductInbound` (入库主表)**
  - `InboundID` (PK), `InboundNo` (UNIQUE), `Type`, `SupplierID`/`FactoryID`, `Status` (Draft, Pending, Completed, Cancelled), `CreatedBy`, `CreatedTime`, `AuditBy`, `AuditTime`
- **`RawMaterialInboundDetail` / `FinishedProductInboundDetail` (入库明细表)**
  - `DetailID` (PK), `InboundID` (FK), `MaterialID`/`ProductID`, `Quantity`, `LocationCode` (建议上架库位)
- **`RawMaterialOutbound` / `FinishedProductOutbound` (出库主表)**
  - `OutboundID` (PK), `OutboundNo` (UNIQUE), `Status`, `CreatedBy`...
- **`Stocktaking` (盘点主表)**
  - `StocktakingID` (PK), `StocktakingNo`, `WarehouseType`, `Status`
- **`StocktakingDetail` (盘点明细表)**
  - `DetailID` (PK), `StocktakingID` (FK), `MaterialID`, `SystemQuantity` (系统库存), `ActualQuantity` (实盘数量), `DifferenceQuantity` (差异数量)

### 2.4 创新功能模块 (Innovative Features)
- **`Wave` (波次主表)**
  - `WaveID` (PK), `WaveNo` (UNIQUE), `Status` (Pending, Picking, Completed, Cancelled), `CreatedBy`, `CreatedTime`, `CompletedTime`, `Remark`
- **`WaveDetail` (波次明细表)**
  - `WaveDetailID` (PK), `WaveID` (FK, `ON DELETE RESTRICT`), `OutboundID` (FK, `ON DELETE RESTRICT`), `Status` (Pending, Picked), `PickedTime`