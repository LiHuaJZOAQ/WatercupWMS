
-- ==========================================================
-- 通用型 WMS 数据库重构脚本 (General WMS Migration)
-- 将特定的"原料/成品/水杯"结构转化为通用 SKU 结构
-- ==========================================================

-- 1. 业务伙伴表整合 (Business Partner)
CREATE TABLE IF NOT EXISTS `Partner` (
  `PartnerID` int(11) NOT NULL AUTO_INCREMENT,
  `PartnerCode` varchar(50) NOT NULL UNIQUE COMMENT '往来单位编码',
  `PartnerName` varchar(100) NOT NULL COMMENT '单位名称',
  `Role` varchar(50) NOT NULL DEFAULT 'SUPPLIER' COMMENT '角色: SUPPLIER(供应商), CUSTOMER(客户), FACTORY(加工厂), CARRIER(承运商)',
  `ContactPerson` varchar(50) DEFAULT NULL,
  `ContactPhone` varchar(20) DEFAULT NULL,
  `Address` varchar(255) DEFAULT NULL,
  `Status` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`PartnerID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用往来单位表';

-- 迁移原有数据
INSERT INTO `Partner` (`PartnerCode`, `PartnerName`, `Role`, `ContactPerson`, `ContactPhone`, `Address`)
SELECT SupplierCode, SupplierName, 'SUPPLIER', ContactPerson, ContactPhone, Address FROM `Supplier`;

INSERT INTO `Partner` (`PartnerCode`, `PartnerName`, `Role`, `ContactPerson`, `ContactPhone`, `Address`)
SELECT CustomerCode, CustomerName, 'CUSTOMER', ContactPerson, ContactPhone, Address FROM `Customer`;

-- 2. 商品档案表整合 (Item / SKU)
CREATE TABLE IF NOT EXISTS `Item` (
  `ItemID` int(11) NOT NULL AUTO_INCREMENT,
  `ItemCode` varchar(50) NOT NULL UNIQUE COMMENT '商品/SKU编码',
  `ItemName` varchar(100) NOT NULL COMMENT '商品名称',
  `ItemType` varchar(50) NOT NULL DEFAULT 'NORMAL' COMMENT '类型: RAW(原料), FINISHED(成品), PACKAGING(包材)',
  `Category` varchar(50) DEFAULT NULL COMMENT '类目',
  `Unit` varchar(20) DEFAULT NULL COMMENT '计量单位',
  `Specification` varchar(100) DEFAULT NULL COMMENT '规格',
  `Attributes` JSON DEFAULT NULL COMMENT '动态扩展属性(如颜色,容量,尺寸,重量)',
  `MinStock` int(11) DEFAULT '0',
  `MaxStock` int(11) DEFAULT '999999',
  `Status` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`ItemID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用商品档案表(SKU)';

-- 迁移原料数据
INSERT INTO `Item` (`ItemCode`, `ItemName`, `ItemType`, `Category`, `Unit`, `Specification`, `MinStock`, `MaxStock`)
SELECT MaterialCode, MaterialName, 'RAW', Category, Unit, Specification, MinStock, MaxStock FROM `RawMaterial`;

-- 迁移成品数据 (将特定字段转为 JSON Attributes)
INSERT INTO `Item` (`ItemCode`, `ItemName`, `ItemType`, `Category`, `Unit`, `Attributes`)
SELECT ProductCode, ProductName, 'FINISHED', Category, Unit, JSON_OBJECT('color', Color, 'capacity', Capacity, 'material', Material) FROM `FinishedProduct`;

-- 3. 统一入库单表 (Inbound Order)
CREATE TABLE IF NOT EXISTS `InboundOrder` (
  `InboundID` int(11) NOT NULL AUTO_INCREMENT,
  `InboundNo` varchar(50) NOT NULL UNIQUE,
  `OrderType` varchar(50) NOT NULL DEFAULT 'PURCHASE' COMMENT '入库类型: PURCHASE(采购), PRODUCTION(生产), TRANSFER(调拨), RETURN(退货)',
  `PartnerID` int(11) DEFAULT NULL COMMENT '关联业务伙伴',
  `Status` varchar(20) NOT NULL DEFAULT 'Pending' COMMENT 'Draft, Pending, Completed, Cancelled',
  `CreatedBy` int(11) DEFAULT NULL,
  `CreatedTime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `AuditBy` int(11) DEFAULT NULL,
  `AuditTime` datetime DEFAULT NULL,
  `Remark` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`InboundID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用入库单';

CREATE TABLE IF NOT EXISTS `InboundOrderDetail` (
  `DetailID` int(11) NOT NULL AUTO_INCREMENT,
  `InboundID` int(11) NOT NULL,
  `ItemID` int(11) NOT NULL,
  `Quantity` int(11) NOT NULL,
  `LocationCode` varchar(50) DEFAULT NULL COMMENT '建议/实际上架库位',
  PRIMARY KEY (`DetailID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用入库单明细';

-- 4. 统一出库单表 (Outbound Order)
CREATE TABLE IF NOT EXISTS `OutboundOrder` (
  `OutboundID` int(11) NOT NULL AUTO_INCREMENT,
  `OutboundNo` varchar(50) NOT NULL UNIQUE,
  `OrderType` varchar(50) NOT NULL DEFAULT 'SALES' COMMENT '出库类型: SALES(销售), PRODUCTION(领料), TRANSFER(调拨)',
  `PartnerID` int(11) DEFAULT NULL,
  `Status` varchar(20) NOT NULL DEFAULT 'Pending' COMMENT 'Draft, Pending, Picking, Completed, Cancelled',
  `CreatedBy` int(11) DEFAULT NULL,
  `CreatedTime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `AuditBy` int(11) DEFAULT NULL,
  `AuditTime` datetime DEFAULT NULL,
  `Remark` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`OutboundID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用出库单';

CREATE TABLE IF NOT EXISTS `OutboundOrderDetail` (
  `DetailID` int(11) NOT NULL AUTO_INCREMENT,
  `OutboundID` int(11) NOT NULL,
  `ItemID` int(11) NOT NULL,
  `Quantity` int(11) NOT NULL,
  `LocationCode` varchar(50) DEFAULT NULL COMMENT '拣货库位',
  PRIMARY KEY (`DetailID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用出库单明细';

-- 5. 调整波次关联 (指向新的 OutboundOrder)
ALTER TABLE `WaveDetail` DROP FOREIGN KEY `fk_WaveDetail_Outbound1`;
-- 这里不再硬关联特定的 RawMaterialOutbound，而是关联通用 OutboundOrder
-- (实际操作中需等数据迁移完毕再建立约束)

