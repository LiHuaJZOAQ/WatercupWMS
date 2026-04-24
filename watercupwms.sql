-- ====================================
-- 水杯生产企业仓储管理系统
-- MySQL 数据库初始化脚本
-- ====================================

-- 删除已存在的数据库并创建新数据库
DROP DATABASE IF EXISTS watercup_wms;
CREATE DATABASE watercup_wms 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE watercup_wms;

-- ====================================
-- 基础数据表
-- ====================================

-- 1. 供应商表 (Supplier)
CREATE TABLE Supplier (
    SupplierID INT PRIMARY KEY AUTO_INCREMENT COMMENT '供应商ID',
    SupplierCode VARCHAR(20) NOT NULL UNIQUE COMMENT '供应商编码',
    SupplierName VARCHAR(100) NOT NULL COMMENT '供应商名称',
    ContactPerson VARCHAR(50) COMMENT '联系人',
    ContactPhone VARCHAR(20) COMMENT '联系电话',
    Email VARCHAR(100) COMMENT '邮箱',
    Address VARCHAR(200) COMMENT '地址',
    Status TINYINT(1) DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX IX_Supplier_Code (SupplierCode) COMMENT '供应商编码索引',
    INDEX IX_Supplier_Name (SupplierName) COMMENT '供应商名称索引'
) ENGINE=InnoDB COMMENT='供应商表';

-- 2. 客户表 (Customer)
CREATE TABLE Customer (
    CustomerID INT PRIMARY KEY AUTO_INCREMENT COMMENT '客户ID',
    CustomerCode VARCHAR(20) NOT NULL UNIQUE COMMENT '客户编码',
    CustomerName VARCHAR(100) NOT NULL COMMENT '客户名称',
    ContactPerson VARCHAR(50) COMMENT '联系人',
    ContactPhone VARCHAR(20) COMMENT '联系电话',
    Email VARCHAR(100) COMMENT '邮箱',
    Address VARCHAR(200) COMMENT '地址',
    Status TINYINT(1) DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX IX_Customer_Code (CustomerCode) COMMENT '客户编码索引',
    INDEX IX_Customer_Name (CustomerName) COMMENT '客户名称索引'
) ENGINE=InnoDB COMMENT='客户表';

-- 3. 原材料表 (RawMaterial)
CREATE TABLE RawMaterial (
    MaterialID INT PRIMARY KEY AUTO_INCREMENT COMMENT '原材料ID',
    MaterialCode VARCHAR(30) NOT NULL UNIQUE COMMENT '原材料编码',
    MaterialName VARCHAR(100) NOT NULL COMMENT '原材料名称',
    Category VARCHAR(50) COMMENT '分类',
    Unit VARCHAR(10) NOT NULL COMMENT '计量单位',
    Specification VARCHAR(100) COMMENT '规格',
    Description VARCHAR(200) COMMENT '描述',
    MinStock DECIMAL(18,2) DEFAULT 0 COMMENT '最小库存',
    MaxStock DECIMAL(18,2) DEFAULT 0 COMMENT '最大库存',
    Status TINYINT(1) DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX IX_RawMaterial_Code (MaterialCode) COMMENT '原材料编码索引',
    INDEX IX_RawMaterial_Name (MaterialName) COMMENT '原材料名称索引',
    INDEX IX_RawMaterial_Category (Category) COMMENT '分类索引'
) ENGINE=InnoDB COMMENT='原材料表';

-- 4. 成品表 (FinishedProduct)
CREATE TABLE FinishedProduct (
    ProductID INT PRIMARY KEY AUTO_INCREMENT COMMENT '成品ID',
    ProductCode VARCHAR(30) NOT NULL UNIQUE COMMENT '成品编码',
    ProductName VARCHAR(100) NOT NULL COMMENT '成品名称',
    Category VARCHAR(50) COMMENT '分类',
    Unit VARCHAR(10) NOT NULL COMMENT '计量单位',
    Specification VARCHAR(100) COMMENT '规格',
    Color VARCHAR(30) COMMENT '颜色',
    Capacity VARCHAR(20) COMMENT '容量',
    Material VARCHAR(50) COMMENT '材质',
    Description VARCHAR(200) COMMENT '描述',
    MinStock DECIMAL(18,2) DEFAULT 0 COMMENT '最小库存',
    MaxStock DECIMAL(18,2) DEFAULT 0 COMMENT '最大库存',
    Status TINYINT(1) DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX IX_FinishedProduct_Code (ProductCode) COMMENT '成品编码索引',
    INDEX IX_FinishedProduct_Name (ProductName) COMMENT '成品名称索引',
    INDEX IX_FinishedProduct_Category (Category) COMMENT '分类索引'
) ENGINE=InnoDB COMMENT='成品表';

-- 5. 仓库表 (Warehouse)
CREATE TABLE Warehouse (
    WarehouseID INT PRIMARY KEY AUTO_INCREMENT COMMENT '仓库ID',
    WarehouseCode VARCHAR(20) NOT NULL UNIQUE COMMENT '仓库编码',
    WarehouseName VARCHAR(100) NOT NULL COMMENT '仓库名称',
    Address VARCHAR(200) COMMENT '地址',
    ManagerName VARCHAR(50) COMMENT '仓库管理员',
    ContactPhone VARCHAR(20) COMMENT '联系电话',
    Status TINYINT(1) DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX IX_Warehouse_Code (WarehouseCode) COMMENT '仓库编码索引'
) ENGINE=InnoDB COMMENT='仓库表';

-- 6. 库位表 (Location)
CREATE TABLE Location (
    LocationID VARCHAR(30) PRIMARY KEY COMMENT '库位ID',
    WarehouseID INT NOT NULL COMMENT '所属仓库ID',
    LocationName VARCHAR(50) NOT NULL COMMENT '库位名称',
    LocationType VARCHAR(20) DEFAULT 'Normal' COMMENT '库位类型：Normal-普通，Raw-原材料，Finished-成品',
    Zone VARCHAR(10) COMMENT '区域',
    Row VARCHAR(10) COMMENT '行',
    Col VARCHAR(10) COMMENT '列',
    Level VARCHAR(10) COMMENT '层',
    Capacity DECIMAL(18,2) NOT NULL DEFAULT 0 COMMENT '容量',
    CurrentOccupancy DECIMAL(18,2) DEFAULT 0 COMMENT '当前占用量',
    IsOccupied TINYINT(1) DEFAULT 0 COMMENT '是否占用：0-空闲，1-占用',
    Status TINYINT(1) DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID),
    INDEX IX_Location_Warehouse (WarehouseID) COMMENT '仓库索引',
    INDEX IX_Location_Type (LocationType) COMMENT '库位类型索引',
    INDEX IX_Location_Status (IsOccupied, Status) COMMENT '占用状态索引'
) ENGINE=InnoDB COMMENT='库位表';

-- 7. 加工厂表 (ProcessingFactory)
CREATE TABLE ProcessingFactory (
    FactoryID INT PRIMARY KEY AUTO_INCREMENT COMMENT '加工厂ID',
    FactoryCode VARCHAR(20) NOT NULL UNIQUE COMMENT '加工厂编码',
    FactoryName VARCHAR(100) NOT NULL COMMENT '加工厂名称',
    ContactPerson VARCHAR(50) COMMENT '联系人',
    ContactPhone VARCHAR(20) COMMENT '联系电话',
    Address VARCHAR(200) COMMENT '地址',
    Status TINYINT(1) DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX IX_Factory_Code (FactoryCode) COMMENT '加工厂编码索引'
) ENGINE=InnoDB COMMENT='加工厂表';

-- ====================================
-- 权限管理相关表
-- ====================================

-- 8. 用户表 (User)
CREATE TABLE User (
    UserID INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    Username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    PasswordHash VARCHAR(256) NOT NULL COMMENT '密码哈希',
    Email VARCHAR(100) UNIQUE COMMENT '邮箱',
    FullName VARCHAR(100) COMMENT '姓名',
    Phone VARCHAR(20) COMMENT '电话',
    Department VARCHAR(50) COMMENT '部门',
    Position VARCHAR(50) COMMENT '职位',
    IsActive TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    LastLoginTime DATETIME COMMENT '最后登录时间',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX IX_User_Username (Username) COMMENT '用户名索引',
    INDEX IX_User_Email (Email) COMMENT '邮箱索引'
) ENGINE=InnoDB COMMENT='用户表';

-- 9. 角色表 (Role)
CREATE TABLE Role (
    RoleID INT PRIMARY KEY AUTO_INCREMENT COMMENT '角色ID',
    RoleName VARCHAR(50) NOT NULL UNIQUE COMMENT '角色名称',
    Description VARCHAR(200) COMMENT '描述',
    IsSystem TINYINT(1) DEFAULT 0 COMMENT '是否系统角色',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB COMMENT='角色表';

-- 10. 用户角色关联表 (UserRole)
CREATE TABLE UserRole (
    UserID INT NOT NULL COMMENT '用户ID',
    RoleID INT NOT NULL COMMENT '角色ID',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (UserID, RoleID),
    FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE,
    FOREIGN KEY (RoleID) REFERENCES Role(RoleID) ON DELETE CASCADE,
    INDEX IX_UserRole_RoleID (RoleID) COMMENT '角色索引'
) ENGINE=InnoDB COMMENT='用户角色关联表';

-- 11. 权限表 (Permission)
CREATE TABLE Permission (
    PermissionID INT PRIMARY KEY AUTO_INCREMENT COMMENT '权限ID',
    PermissionCode VARCHAR(50) NOT NULL UNIQUE COMMENT '权限编码',
    PermissionName VARCHAR(100) NOT NULL COMMENT '权限名称',
    ParentID INT DEFAULT 0 COMMENT '父权限ID',
    PermissionType VARCHAR(20) DEFAULT 'Menu' COMMENT '权限类型：Menu-菜单，Button-按钮',
    Path VARCHAR(200) COMMENT '路径',
    Icon VARCHAR(50) COMMENT '图标',
    SortOrder INT DEFAULT 0 COMMENT '排序',
    Description VARCHAR(200) COMMENT '描述',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX IX_Permission_Code (PermissionCode) COMMENT '权限编码索引',
    INDEX IX_Permission_Parent (ParentID) COMMENT '父权限索引'
) ENGINE=InnoDB COMMENT='权限表';

-- 12. 角色权限关联表 (RolePermission)
CREATE TABLE RolePermission (
    RoleID INT NOT NULL COMMENT '角色ID',
    PermissionID INT NOT NULL COMMENT '权限ID',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (RoleID, PermissionID),
    FOREIGN KEY (RoleID) REFERENCES Role(RoleID) ON DELETE CASCADE,
    FOREIGN KEY (PermissionID) REFERENCES Permission(PermissionID) ON DELETE CASCADE,
    INDEX IX_RolePermission_PermissionID (PermissionID) COMMENT '权限索引'
) ENGINE=InnoDB COMMENT='角色权限关联表';

-- ====================================
-- 原材料入出库相关表
-- ====================================

-- 13. 原材料入库单 (RawMaterialInbound)
CREATE TABLE RawMaterialInbound (
    InboundID INT PRIMARY KEY AUTO_INCREMENT COMMENT '入库单ID',
    InboundNumber VARCHAR(30) NOT NULL UNIQUE COMMENT '入库单号',
    SupplierID INT NOT NULL COMMENT '供应商ID',
    WarehouseID INT NOT NULL COMMENT '仓库ID',
    InboundDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '入库日期',
    OperatorUserID INT NOT NULL COMMENT '操作人员ID',
    Status VARCHAR(20) NOT NULL DEFAULT 'Draft' COMMENT '状态：Draft-草稿，Pending-待处理，Completed-已完成，Cancelled-已取消',
    TotalAmount DECIMAL(18,2) DEFAULT 0 COMMENT '总金额',
    Remarks VARCHAR(500) COMMENT '备注',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (SupplierID) REFERENCES Supplier(SupplierID),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID),
    FOREIGN KEY (OperatorUserID) REFERENCES User(UserID),
    INDEX IX_RawMaterialInbound_Number (InboundNumber) COMMENT '入库单号索引',
    INDEX IX_RawMaterialInbound_Date (InboundDate) COMMENT '入库日期索引',
    INDEX IX_RawMaterialInbound_Supplier (SupplierID) COMMENT '供应商索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='原材料入库单主表';

-- 14. 原材料入库单明细 (RawMaterialInboundDetail)
CREATE TABLE RawMaterialInboundDetail (
    DetailID INT PRIMARY KEY AUTO_INCREMENT COMMENT '明细ID',
    InboundID INT NOT NULL COMMENT '入库单ID',
    RawMaterialID INT NOT NULL COMMENT '原材料ID',
    Quantity DECIMAL(18,3) NOT NULL COMMENT '入库数量',
    UnitPrice DECIMAL(18,2) NOT NULL COMMENT '单价',
    Amount DECIMAL(18,2) NOT NULL COMMENT '金额',
    BatchNumber VARCHAR(50) COMMENT '批次号',
    ProductionDate DATE COMMENT '生产日期',
    ExpiryDate DATE COMMENT '过期日期',
    QualityStatus VARCHAR(20) DEFAULT 'Qualified' COMMENT '质量状态：Qualified-合格，Unqualified-不合格，Pending-待检',
    Remarks VARCHAR(300) COMMENT '备注',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (InboundID) REFERENCES RawMaterialInbound(InboundID) ON DELETE CASCADE,
    INDEX IX_RawMaterialInboundDetail_Inbound (InboundID) COMMENT '入库单索引',
    INDEX IX_RawMaterialInboundDetail_Material (RawMaterialID) COMMENT '原材料索引',
    INDEX IX_RawMaterialInboundDetail_Batch (BatchNumber) COMMENT '批次号索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='原材料入库单明细表';

-- 15. 原材料出库单 (RawMaterialOutbound)
CREATE TABLE RawMaterialOutbound (
    OutboundID INT PRIMARY KEY AUTO_INCREMENT COMMENT '出库单ID',
    OutboundNumber VARCHAR(30) NOT NULL UNIQUE COMMENT '出库单号',
    WarehouseID INT NOT NULL COMMENT '仓库ID',
    OutboundType VARCHAR(20) NOT NULL COMMENT '出库类型：Production-生产领料，Transfer-调拨，Return-退货，Other-其他',
    DepartmentID INT COMMENT '领料部门ID',
    ProductionOrderID INT COMMENT '生产订单ID（生产领料时使用）',
    OutboundDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '出库日期',
    OperatorUserID INT NOT NULL COMMENT '操作人员ID',
    Status VARCHAR(20) NOT NULL DEFAULT 'Draft' COMMENT '状态：Draft-草稿，Pending-待处理，Completed-已完成，Cancelled-已取消',
    TotalAmount DECIMAL(18,2) DEFAULT 0 COMMENT '总金额',
    Remarks VARCHAR(500) COMMENT '备注',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    -- 由于外键约束问题,先移除Department表的外键引用
    -- FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID),
    FOREIGN KEY (OperatorUserID) REFERENCES User(UserID),
    INDEX IX_RawMaterialOutbound_Number (OutboundNumber) COMMENT '出库单号索引',
    INDEX IX_RawMaterialOutbound_Date (OutboundDate) COMMENT '出库日期索引',
    INDEX IX_RawMaterialOutbound_Type (OutboundType) COMMENT '出库类型索引',
    INDEX IX_RawMaterialOutbound_Status (Status) COMMENT '状态索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='原材料出库单主表';

-- 16. 原材料出库单明细 (RawMaterialOutboundDetail)
CREATE TABLE RawMaterialOutboundDetail (
    DetailID INT PRIMARY KEY AUTO_INCREMENT COMMENT '明细ID',
    OutboundID INT NOT NULL COMMENT '出库单ID',
    RawMaterialID INT NOT NULL COMMENT '原材料ID',
    LocationID VARCHAR(30) NOT NULL COMMENT '库位ID',
    Quantity DECIMAL(18,3) NOT NULL COMMENT '出库数量',
    UnitPrice DECIMAL(18,2) NOT NULL DEFAULT 0 COMMENT '单价',
    Amount DECIMAL(18,2) NOT NULL DEFAULT 0 COMMENT '金额',
    BatchNumber VARCHAR(50) COMMENT '批次号',
    Remarks VARCHAR(300) COMMENT '备注',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (OutboundID) REFERENCES RawMaterialOutbound(OutboundID) ON DELETE CASCADE,
    FOREIGN KEY (RawMaterialID) REFERENCES RawMaterial(MaterialID),
    FOREIGN KEY (LocationID) REFERENCES Location(LocationID),
    INDEX IX_RawMaterialOutboundDetail_Outbound (OutboundID) COMMENT '出库单索引',
    INDEX IX_RawMaterialOutboundDetail_Material (RawMaterialID) COMMENT '原材料索引',
    INDEX IX_RawMaterialOutboundDetail_Location (LocationID) COMMENT '库位索引',
    INDEX IX_RawMaterialOutboundDetail_Batch (BatchNumber) COMMENT '批次号索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='原材料出库单明细表';

-- 需要先创建部门表，然后修复外键引用
-- 首先添加部门表
CREATE TABLE Department (
    DepartmentID INT PRIMARY KEY AUTO_INCREMENT COMMENT '部门ID',
    DepartmentCode VARCHAR(20) NOT NULL UNIQUE COMMENT '部门编码',
    DepartmentName VARCHAR(100) NOT NULL COMMENT '部门名称',
    ParentID INT DEFAULT 0 COMMENT '上级部门ID',
    ManagerID INT COMMENT '部门负责人ID',
    Description VARCHAR(200) COMMENT '描述',
    Status TINYINT(1) DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (ManagerID) REFERENCES User(UserID),
    INDEX IX_Department_Code (DepartmentCode) COMMENT '部门编码索引',
    INDEX IX_Department_Parent (ParentID) COMMENT '上级部门索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门表';
-- 修复外键引用问题
-- ALTER TABLE RawMaterialInboundDetail DROP FOREIGN KEY RawMaterialInboundDetail_ibfk_2;
-- ALTER TABLE RawMaterialInboundDetail ADD FOREIGN KEY (RawMaterialID) REFERENCES RawMaterial(MaterialID);


-- ====================================
-- 成品入出库相关表
-- ====================================

-- 17. 成品入库单 (FinishedProductInbound)
CREATE TABLE FinishedProductInbound (
    InboundID INT PRIMARY KEY AUTO_INCREMENT COMMENT '入库单ID',
    InboundNumber VARCHAR(30) NOT NULL UNIQUE COMMENT '入库单号',
    FactoryID INT NOT NULL COMMENT '来源加工厂ID',
    WarehouseID INT NOT NULL COMMENT '仓库ID',
    InboundDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '入库日期',
    OperatorUserID INT NOT NULL COMMENT '操作人员ID',
    Status VARCHAR(20) NOT NULL DEFAULT 'Draft' COMMENT '状态：Draft-草稿，Pending-待处理，Completed-已完成，Cancelled-已取消',
    TotalQuantity DECIMAL(18,2) DEFAULT 0 COMMENT '总数量',
    Remarks VARCHAR(500) COMMENT '备注',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (FactoryID) REFERENCES ProcessingFactory(FactoryID),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID),
    FOREIGN KEY (OperatorUserID) REFERENCES User(UserID),
    INDEX IX_FinishedProductInbound_Number (InboundNumber) COMMENT '入库单号索引',
    INDEX IX_FinishedProductInbound_Date (InboundDate) COMMENT '入库日期索引',
    INDEX IX_FinishedProductInbound_Factory (FactoryID) COMMENT '加工厂索引',
    INDEX IX_FinishedProductInbound_Status (Status) COMMENT '状态索引'
) ENGINE=InnoDB AUTO_INCREMENT=30001 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成品入库单主表';

-- 18. 成品入库单明细 (FinishedProductInboundDetail)
CREATE TABLE FinishedProductInboundDetail (
    DetailID INT PRIMARY KEY AUTO_INCREMENT COMMENT '明细ID',
    InboundID INT NOT NULL COMMENT '入库单ID',
    FinishedProductID INT NOT NULL COMMENT '成品ID',
    LocationID VARCHAR(30) NOT NULL COMMENT '库位ID',
    Quantity DECIMAL(18,3) NOT NULL COMMENT '入库数量',
    BatchNumber VARCHAR(50) COMMENT '批次号',
    ProductionDate DATE COMMENT '生产日期',
    QualityStatus VARCHAR(20) DEFAULT 'Qualified' COMMENT '质量状态：Qualified-合格，Unqualified-不合格，Pending-待检',
    Remarks VARCHAR(300) COMMENT '备注',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (InboundID) REFERENCES FinishedProductInbound(InboundID) ON DELETE CASCADE,
    FOREIGN KEY (FinishedProductID) REFERENCES FinishedProduct(ProductID),
    FOREIGN KEY (LocationID) REFERENCES Location(LocationID),
    INDEX IX_FinishedProductInboundDetail_Inbound (InboundID) COMMENT '入库单索引',
    INDEX IX_FinishedProductInboundDetail_Product (FinishedProductID) COMMENT '成品索引',
    INDEX IX_FinishedProductInboundDetail_Location (LocationID) COMMENT '库位索引',
    INDEX IX_FinishedProductInboundDetail_Batch (BatchNumber) COMMENT '批次号索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成品入库单明细表';

-- 19. 成品出库单 (FinishedProductOutbound)
CREATE TABLE FinishedProductOutbound (
    OutboundID INT PRIMARY KEY AUTO_INCREMENT COMMENT '出库单ID',
    OutboundNumber VARCHAR(30) NOT NULL UNIQUE COMMENT '出库单号',
    CustomerID INT NOT NULL COMMENT '客户ID',
    WarehouseID INT NOT NULL COMMENT '仓库ID',
    OutboundType VARCHAR(20) NOT NULL DEFAULT 'Sale' COMMENT '出库类型：Sale-销售，Transfer-调拨，Return-退货，Other-其他',
    OrderNumber VARCHAR(30) COMMENT '订单号',
    OutboundDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '出库日期',
    DeliveryDate DATE COMMENT '预计发货日期',
    OperatorUserID INT NOT NULL COMMENT '操作人员ID',
    Status VARCHAR(20) NOT NULL DEFAULT 'Draft' COMMENT '状态：Draft-草稿，Pending-待处理，Completed-已完成，Cancelled-已取消',
    TotalQuantity DECIMAL(18,2) DEFAULT 0 COMMENT '总数量',
    Remarks VARCHAR(500) COMMENT '备注',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID),
    FOREIGN KEY (OperatorUserID) REFERENCES User(UserID),
    INDEX IX_FinishedProductOutbound_Number (OutboundNumber) COMMENT '出库单号索引',
    INDEX IX_FinishedProductOutbound_Date (OutboundDate) COMMENT '出库日期索引',
    INDEX IX_FinishedProductOutbound_Customer (CustomerID) COMMENT '客户索引',
    INDEX IX_FinishedProductOutbound_Type (OutboundType) COMMENT '出库类型索引',
    INDEX IX_FinishedProductOutbound_Status (Status) COMMENT '状态索引'
) ENGINE=InnoDB AUTO_INCREMENT=40001 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成品出库单主表';

-- 20. 成品出库单明细 (FinishedProductOutboundDetail)
CREATE TABLE FinishedProductOutboundDetail (
    DetailID INT PRIMARY KEY AUTO_INCREMENT COMMENT '明细ID',
    OutboundID INT NOT NULL COMMENT '出库单ID',
    FinishedProductID INT NOT NULL COMMENT '成品ID',
    LocationID VARCHAR(30) NOT NULL COMMENT '库位ID',
    Quantity DECIMAL(18,3) NOT NULL COMMENT '出库数量',
    BatchNumber VARCHAR(50) COMMENT '批次号',
    Remarks VARCHAR(300) COMMENT '备注',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (OutboundID) REFERENCES FinishedProductOutbound(OutboundID) ON DELETE CASCADE,
    FOREIGN KEY (FinishedProductID) REFERENCES FinishedProduct(ProductID),
    FOREIGN KEY (LocationID) REFERENCES Location(LocationID),
    INDEX IX_FinishedProductOutboundDetail_Outbound (OutboundID) COMMENT '出库单索引',
    INDEX IX_FinishedProductOutboundDetail_Product (FinishedProductID) COMMENT '成品索引',
    INDEX IX_FinishedProductOutboundDetail_Location (LocationID) COMMENT '库位索引',
    INDEX IX_FinishedProductOutboundDetail_Batch (BatchNumber) COMMENT '批次号索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成品出库单明细表';

-- ====================================
-- 库存管理相关表
-- ====================================

-- 21. 库存表 (Inventory)
CREATE TABLE Inventory (
    InventoryID INT PRIMARY KEY AUTO_INCREMENT COMMENT '库存ID',
    ItemType VARCHAR(20) NOT NULL COMMENT '物料类型：RawMaterial-原材料，FinishedProduct-成品',
    ItemID INT NOT NULL COMMENT '物料ID（原材料ID或成品ID）',
    LocationID VARCHAR(30) NOT NULL COMMENT '库位ID',
    BatchNumber VARCHAR(50) COMMENT '批次号',
    CurrentQuantity DECIMAL(18,3) NOT NULL DEFAULT 0 COMMENT '当前库存数量',
    AvailableQuantity DECIMAL(18,3) NOT NULL DEFAULT 0 COMMENT '可用数量',
    ReservedQuantity DECIMAL(18,3) NOT NULL DEFAULT 0 COMMENT '预留数量',
    UnitCost DECIMAL(18,4) DEFAULT 0 COMMENT '单位成本',
    ProductionDate DATE COMMENT '生产日期',
    ExpiryDate DATE COMMENT '过期日期',
    LastInboundDate DATETIME COMMENT '最后入库时间',
    LastOutboundDate DATETIME COMMENT '最后出库时间',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (LocationID) REFERENCES Location(LocationID),
    UNIQUE KEY UK_Inventory_Item_Location_Batch (ItemType, ItemID, LocationID, BatchNumber) COMMENT '同一库位同批次物料唯一约束',
    INDEX IX_Inventory_Item (ItemType, ItemID) COMMENT '物料索引',
    INDEX IX_Inventory_Location (LocationID) COMMENT '库位索引',
    INDEX IX_Inventory_Batch (BatchNumber) COMMENT '批次号索引',
    INDEX IX_Inventory_LowStock (CurrentQuantity) COMMENT '低库存索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存表';

-- 22. 库存变动记录表 (InventoryTransaction)
CREATE TABLE InventoryTransaction (
    TransactionID INT PRIMARY KEY AUTO_INCREMENT COMMENT '变动记录ID',
    InventoryID INT NOT NULL COMMENT '库存ID',
    TransactionType VARCHAR(20) NOT NULL COMMENT '变动类型：Inbound-入库，Outbound-出库，Transfer-调拨，Adjust-调整',
    ReferenceType VARCHAR(30) COMMENT '关联单据类型',
    ReferenceID INT COMMENT '关联单据ID',
    QuantityBefore DECIMAL(18,3) NOT NULL COMMENT '变动前数量',
    QuantityChange DECIMAL(18,3) NOT NULL COMMENT '变动数量（正数为增加，负数为减少）',
    QuantityAfter DECIMAL(18,3) NOT NULL COMMENT '变动后数量',
    UnitCost DECIMAL(18,4) DEFAULT 0 COMMENT '单位成本',
    TransactionDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '变动时间',
    OperatorUserID INT NOT NULL COMMENT '操作人员ID',
    Remarks VARCHAR(300) COMMENT '备注',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (InventoryID) REFERENCES Inventory(InventoryID),
    FOREIGN KEY (OperatorUserID) REFERENCES User(UserID),
    INDEX IX_InventoryTransaction_Inventory (InventoryID) COMMENT '库存索引',
    INDEX IX_InventoryTransaction_Type (TransactionType) COMMENT '变动类型索引',
    INDEX IX_InventoryTransaction_Date (TransactionDate) COMMENT '变动时间索引',
    INDEX IX_InventoryTransaction_Reference (ReferenceType, ReferenceID) COMMENT '关联单据索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存变动记录表';

-- 23. 盘点单 (Stocktaking)
CREATE TABLE Stocktaking (
    StocktakingID INT PRIMARY KEY AUTO_INCREMENT COMMENT '盘点单ID',
    StocktakingNumber VARCHAR(30) NOT NULL UNIQUE COMMENT '盘点单号',
    WarehouseID INT NOT NULL COMMENT '盘点仓库ID',
    StocktakingType VARCHAR(20) NOT NULL DEFAULT 'Full' COMMENT '盘点类型：Full-全盘，Partial-部分盘，Cyclic-循环盘点',
    StocktakingDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '盘点日期',
    PlanStartDate DATE COMMENT '计划开始日期',
    PlanEndDate DATE COMMENT '计划结束日期',
    ActualStartDate DATETIME COMMENT '实际开始时间',
    ActualEndDate DATETIME COMMENT '实际结束时间',
    OperatorUserID INT NOT NULL COMMENT '操作人员ID',
    Status VARCHAR(20) NOT NULL DEFAULT 'Draft' COMMENT '状态：Draft-草稿，InProgress-进行中，Completed-已完成，Cancelled-已取消',
    Remarks VARCHAR(500) COMMENT '备注',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID),
    FOREIGN KEY (OperatorUserID) REFERENCES User(UserID),
    INDEX IX_Stocktaking_Number (StocktakingNumber) COMMENT '盘点单号索引',
    INDEX IX_Stocktaking_Date (StocktakingDate) COMMENT '盘点日期索引',
    INDEX IX_Stocktaking_Warehouse (WarehouseID) COMMENT '仓库索引',
    INDEX IX_Stocktaking_Status (Status) COMMENT '状态索引'
) ENGINE=InnoDB AUTO_INCREMENT=50001 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='盘点单主表';

-- 24. 盘点明细 (StocktakingDetail)
CREATE TABLE StocktakingDetail (
    DetailID INT PRIMARY KEY AUTO_INCREMENT COMMENT '明细ID',
    StocktakingID INT NOT NULL COMMENT '盘点单ID',
    ItemType VARCHAR(20) NOT NULL COMMENT '物料类型：RawMaterial-原材料，FinishedProduct-成品',
    ItemID INT NOT NULL COMMENT '物料ID',
    LocationID VARCHAR(30) NOT NULL COMMENT '库位ID',
    BatchNumber VARCHAR(50) COMMENT '批次号',
    SystemQuantity DECIMAL(18,3) NOT NULL DEFAULT 0 COMMENT '系统数量',
    ActualQuantity DECIMAL(18,3) NOT NULL DEFAULT 0 COMMENT '实际盘点数量',
    DifferenceQuantity DECIMAL(18,3) GENERATED ALWAYS AS (ActualQuantity - SystemQuantity) STORED COMMENT '差异数量',
    UnitCost DECIMAL(18,4) DEFAULT 0 COMMENT '单位成本',
    DifferenceAmount DECIMAL(18,2) GENERATED ALWAYS AS (DifferenceQuantity * UnitCost) STORED COMMENT '差异金额',
    StockStatus VARCHAR(20) DEFAULT 'Normal' COMMENT '库存状态：Normal-正常，Damaged-损坏，Expired-过期',
    CounterUserID INT COMMENT '盘点人员ID',
    CountTime DATETIME COMMENT '盘点时间',
    Remarks VARCHAR(300) COMMENT '备注',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (StocktakingID) REFERENCES Stocktaking(StocktakingID) ON DELETE CASCADE,
    FOREIGN KEY (LocationID) REFERENCES Location(LocationID),
    FOREIGN KEY (CounterUserID) REFERENCES User(UserID),
    INDEX IX_StocktakingDetail_Stocktaking (StocktakingID) COMMENT '盘点单索引',
    INDEX IX_StocktakingDetail_Item (ItemType, ItemID) COMMENT '物料索引',
    INDEX IX_StocktakingDetail_Location (LocationID) COMMENT '库位索引',
    INDEX IX_StocktakingDetail_Difference (DifferenceQuantity) COMMENT '差异数量索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='盘点明细表';

-- ====================================
-- 系统配置和日志相关表
-- ====================================

-- 25. 系统配置表 (SystemConfig)
CREATE TABLE SystemConfig (
    ConfigID INT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID',
    ConfigKey VARCHAR(50) NOT NULL UNIQUE COMMENT '配置键',
    ConfigValue TEXT COMMENT '配置值',
    ConfigType VARCHAR(20) DEFAULT 'String' COMMENT '配置类型：String-字符串，Number-数字，Boolean-布尔值，JSON-JSON对象',
    Category VARCHAR(30) DEFAULT 'System' COMMENT '配置分类',
    Description VARCHAR(200) COMMENT '描述',
    IsEditable TINYINT(1) DEFAULT 1 COMMENT '是否可编辑',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX IX_SystemConfig_Key (ConfigKey) COMMENT '配置键索引',
    INDEX IX_SystemConfig_Category (Category) COMMENT '配置分类索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 26. 操作日志表 (OperationLog)
CREATE TABLE OperationLog (
    LogID INT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    UserID INT COMMENT '操作用户ID',
    Username VARCHAR(50) COMMENT '用户名',
    OperationType VARCHAR(30) NOT NULL COMMENT '操作类型：Login-登录，Logout-登出，Create-创建，Update-更新，Delete-删除，Query-查询',
    ModuleName VARCHAR(50) COMMENT '模块名称',
    FunctionName VARCHAR(100) COMMENT '功能名称',
    RequestMethod VARCHAR(10) COMMENT '请求方法：GET、POST、PUT、DELETE',
    RequestUrl VARCHAR(200) COMMENT '请求URL',
    RequestParams TEXT COMMENT '请求参数',
    ResponseResult TEXT COMMENT '响应结果',
    ExecutionTime INT DEFAULT 0 COMMENT '执行时间（毫秒）',
    IPAddress VARCHAR(50) COMMENT 'IP地址',
    UserAgent VARCHAR(500) COMMENT '用户代理',
    Status VARCHAR(20) DEFAULT 'Success' COMMENT '状态：Success-成功，Failed-失败',
    ErrorMessage TEXT COMMENT '错误信息',
    OperationTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    FOREIGN KEY (UserID) REFERENCES User(UserID),
    INDEX IX_OperationLog_User (UserID) COMMENT '用户索引',
    INDEX IX_OperationLog_Type (OperationType) COMMENT '操作类型索引',
    INDEX IX_OperationLog_Time (OperationTime) COMMENT '操作时间索引',
    INDEX IX_OperationLog_Module (ModuleName) COMMENT '模块名称索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- 27. 单据编号生成表 (NumberSequence)
CREATE TABLE NumberSequence (
    SequenceID INT PRIMARY KEY AUTO_INCREMENT COMMENT '序列ID',
    SequenceType VARCHAR(30) NOT NULL UNIQUE COMMENT '序列类型：RawInbound-原材料入库，RawOutbound-原材料出库，ProductInbound-成品入库，ProductOutbound-成品出库，Stocktaking-盘点',
    Prefix VARCHAR(10) NOT NULL COMMENT '前缀',
    CurrentNumber INT NOT NULL DEFAULT 0 COMMENT '当前序号',
    NumberLength INT DEFAULT 6 COMMENT '序号长度',
    DateFormat VARCHAR(20) DEFAULT 'YYYYMMDD' COMMENT '日期格式',
    ResetType VARCHAR(10) DEFAULT 'Daily' COMMENT '重置类型：Daily-每日，Monthly-每月，Yearly-每年，Never-从不',
    LastResetDate DATE COMMENT '最后重置日期',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX IX_NumberSequence_Type (SequenceType) COMMENT '序列类型索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='单据编号生成表';


-- ==========================================================
-- 创新功能：波次管理 (Wave Picking) 附加表结构
-- 包含：波次主表 (Wave) 和 波次明细表 (WaveDetail)
-- ==========================================================

-- 波次主表
DROP TABLE IF EXISTS `Wave`;
CREATE TABLE `Wave` (
  `WaveID` int(11) NOT NULL AUTO_INCREMENT COMMENT '波次ID',
  `WaveNo` varchar(50) NOT NULL COMMENT '波次编号 (例: WV202301010001)',
  `Status` varchar(20) NOT NULL DEFAULT 'Pending' COMMENT '波次状态 (Pending:待拣货, Picking:拣货中, Completed:已完成, Cancelled:已取消)',
  `CreatedBy` int(11) DEFAULT NULL COMMENT '创建人ID',
  `CreatedTime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `CompletedTime` datetime DEFAULT NULL COMMENT '完成时间',
  `Remark` varchar(255) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`WaveID`),
  UNIQUE KEY `WaveNo_UNIQUE` (`WaveNo`),
  KEY `fk_Wave_User1_idx` (`CreatedBy`),
  CONSTRAINT `fk_Wave_User1` FOREIGN KEY (`CreatedBy`) REFERENCES `User` (`UserID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='波次拣货主表';

-- 波次明细表 (关联波次与出库单)
DROP TABLE IF EXISTS `WaveDetail`;
CREATE TABLE `WaveDetail` (
  `WaveDetailID` int(11) NOT NULL AUTO_INCREMENT COMMENT '波次明细ID',
  `WaveID` int(11) NOT NULL COMMENT '关联的波次ID',
  `OutboundID` int(11) NOT NULL COMMENT '关联的原出库单ID (RawMaterialOutbound)',
  `Status` varchar(20) NOT NULL DEFAULT 'Pending' COMMENT '该单拣货状态 (Pending, Picked)',
  `PickedTime` datetime DEFAULT NULL COMMENT '拣货完成时间',
  PRIMARY KEY (`WaveDetailID`),
  KEY `fk_WaveDetail_Wave1_idx` (`WaveID`),
  KEY `fk_WaveDetail_Outbound1_idx` (`OutboundID`),
  CONSTRAINT `fk_WaveDetail_Wave1` FOREIGN KEY (`WaveID`) REFERENCES `Wave` (`WaveID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_WaveDetail_Outbound1` FOREIGN KEY (`OutboundID`) REFERENCES `RawMaterialOutbound` (`OutboundID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='波次明细表(关联出库单)';
