-- ====================================
-- 水杯生产企业仓储管理系统测试数据
-- ====================================

USE watercup_wms;

-- 禁用外键检查，加快插入速度
SET FOREIGN_KEY_CHECKS = 0;

-- ====================================
-- 1. 基础数据插入
-- ====================================

-- 1.1 供应商数据
INSERT INTO Supplier (SupplierCode, SupplierName, ContactPerson, ContactPhone, Email, Address, Status) VALUES
('SUP001', '塑料原材料供应商', '张三', '13800138001', 'zhangsan@plastic.com', '广东省东莞市塑料工业园区A栋', 1),
('SUP002', '不锈钢材料供应商', '李四', '13800138002', 'lisi@steel.com', '江苏省无锡市钢材市场B区', 1),
('SUP003', '玻璃材料供应商', '王五', '13800138003', 'wangwu@glass.com', '山东省淄博市玻璃工业区C街', 1),
('SUP004', '包装材料供应商', '赵六', '13800138004', 'zhaoliu@package.com', '浙江省温州市包装产业园D区', 1),
('SUP005', '五金配件供应商', '钱七', '13800138005', 'qianqi@hardware.com', '广东省佛山市五金城E栋', 1);

-- 1.2 客户数据
INSERT INTO Customer (CustomerCode, CustomerName, ContactPerson, ContactPhone, Email, Address, Status) VALUES
('CUS001', '大型连锁超市A', '陈经理', '13900139001', 'chen@supermarketa.com', '北京市朝阳区商业街1号', 1),
('CUS002', '电商平台B', '刘总监', '13900139002', 'liu@ecommerceb.com', '上海市浦东新区科技园2号', 1),
('CUS003', '办公用品批发商C', '杨老板', '13900139003', 'yang@officec.com', '广州市天河区批发市场3号', 1),
('CUS004', '礼品公司D', '周主管', '13900139004', 'zhou@giftd.com', '深圳市南山区创业园4号', 1),
('CUS005', '酒店用品供应商E', '吴采购', '13900139005', 'wu@hotele.com', '杭州市西湖区商务区5号', 1),
('CUS006', '学校用品采购F', '郑主任', '13900139006', 'zheng@schoolf.com', '南京市鼓楼区教育园6号', 1);

-- 1.3 原材料数据
INSERT INTO RawMaterial (MaterialCode, MaterialName, Category, Unit, Specification, Description, MinStock, MaxStock, Status) VALUES
('RM001', 'PP塑料颗粒', '塑料原料', 'KG', '食品级PP', '用于制作塑料水杯杯体', 500.00, 5000.00, 1),
('RM002', 'PC塑料颗粒', '塑料原料', 'KG', '透明PC', '用于制作透明水杯', 300.00, 3000.00, 1),
('RM003', '不锈钢板', '金属原料', 'KG', '304不锈钢 1.0mm', '用于制作不锈钢保温杯', 200.00, 2000.00, 1),
('RM004', '玻璃原料', '玻璃原料', 'KG', '高硼硅玻璃', '用于制作玻璃水杯', 100.00, 1000.00, 1),
('RM005', '硅胶密封圈', '密封配件', 'PCS', '食品级硅胶', '用于保温杯密封', 1000, 10000, 1),
('RM006', '塑料杯盖', '配件', 'PCS', 'PP材质', '通用塑料杯盖', 2000, 20000, 1),
('RM007', '不锈钢杯盖', '配件', 'PCS', '304不锈钢', '保温杯专用杯盖', 500, 5000, 1),
('RM008', '包装盒', '包装材料', 'PCS', '彩印纸盒', '产品外包装盒', 5000, 50000, 1),
('RM009', '标签贴纸', '包装材料', 'PCS', '防水标签', '产品标识标签', 10000, 100000, 1),
('RM010', '吸管', '配件', 'PCS', '食品级PP吸管', '便携水杯配套吸管', 3000, 30000, 1);

-- 1.4 成品数据
INSERT INTO FinishedProduct (ProductCode, ProductName, Category, Unit, Specification, Color, Capacity, Material, Description, MinStock, MaxStock, Status) VALUES
('FP001', '经典塑料水杯', '塑料杯', 'PCS', '350ml标准杯', '透明', '350ml', 'PP塑料', '经典款塑料水杯，适合日常使用', 100, 1000, 1),
('FP002', '运动水壶', '塑料杯', 'PCS', '750ml大容量', '蓝色', '750ml', 'PC塑料', '运动专用大容量水壶', 80, 800, 1),
('FP003', '儿童卡通水杯', '塑料杯', 'PCS', '250ml小杯', '粉色', '250ml', 'PP塑料', '儿童专用卡通图案水杯', 150, 1500, 1),
('FP004', '不锈钢保温杯', '保温杯', 'PCS', '500ml保温', '银色', '500ml', '304不锈钢', '双层真空保温杯，保温12小时', 50, 500, 1),
('FP005', '商务保温杯', '保温杯', 'PCS', '450ml商务款', '黑色', '450ml', '304不锈钢', '商务人士专用保温杯', 60, 600, 1),
('FP006', '玻璃水杯套装', '玻璃杯', 'SET', '300ml*6只装', '透明', '300ml', '高硼硅玻璃', '家用玻璃水杯6只装', 30, 300, 1),
('FP007', '便携折叠杯', '便携杯', 'PCS', '200ml可折叠', '绿色', '200ml', '硅胶+PP', '旅行便携可折叠水杯', 100, 1000, 1),
('FP008', '智能温控杯', '智能杯', 'PCS', '400ml智能款', '白色', '400ml', '陶瓷+电子', '智能温控显示水杯', 20, 200, 1),
('FP009', '办公室茶杯', '陶瓷杯', 'PCS', '350ml办公款', '咖啡色', '350ml', '陶瓷', '办公室专用茶水杯', 80, 800, 1),
('FP010', '户外运动杯', '运动杯', 'PCS', '1000ml大容量', '橙色', '1000ml', 'Tritan材质', '户外运动大容量水杯', 40, 400, 1);

-- 1.5 仓库数据
INSERT INTO Warehouse (WarehouseCode, WarehouseName, Address, ManagerName, ContactPhone, Status) VALUES
('WH001', '原材料仓库', '生产基地A区1号仓库', '仓管张三', '18800188001', 1),
('WH002', '成品仓库', '生产基地B区2号仓库', '仓管李四', '18800188002', 1),
('WH003', '包装材料仓库', '生产基地C区3号仓库', '仓管王五', '18800188003', 1),
('WH004', '备品备件仓库', '生产基地D区4号仓库', '仓管赵六', '18800188004', 1);

-- 1.6 库位数据
INSERT INTO Location (LocationID, WarehouseID, LocationName, LocationType, Zone, Row, Col, Level, Capacity, CurrentOccupancy, IsOccupied, Status) VALUES
-- 原材料仓库库位
('WH001-A01-R01-C01-L01', 1, 'A区01排01列01层', 'Raw', 'A', '01', '01', '01', 1000.00, 0, 0, 1),
('WH001-A01-R01-C01-L02', 1, 'A区01排01列02层', 'Raw', 'A', '01', '01', '02', 1000.00, 0, 0, 1),
('WH001-A01-R01-C02-L01', 1, 'A区01排02列01层', 'Raw', 'A', '01', '02', '01', 1000.00, 0, 0, 1),
('WH001-A01-R01-C02-L02', 1, 'A区01排02列02层', 'Raw', 'A', '01', '02', '02', 1000.00, 0, 0, 1),
('WH001-A01-R02-C01-L01', 1, 'A区02排01列01层', 'Raw', 'A', '02', '01', '01', 1000.00, 0, 0, 1),
('WH001-A01-R02-C01-L02', 1, 'A区02排01列02层', 'Raw', 'A', '02', '01', '02', 1000.00, 0, 0, 1),
('WH001-A01-R02-C02-L01', 1, 'A区02排02列01层', 'Raw', 'A', '02', '02', '01', 1000.00, 0, 0, 1),
('WH001-A01-R02-C02-L02', 1, 'A区02排02列02层', 'Raw', 'A', '02', '02', '02', 1000.00, 0, 0, 1),
-- 成品仓库库位
('WH002-B01-R01-C01-L01', 2, 'B区01排01列01层', 'Finished', 'B', '01', '01', '01', 500.00, 0, 0, 1),
('WH002-B01-R01-C01-L02', 2, 'B区01排01列02层', 'Finished', 'B', '01', '01', '02', 500.00, 0, 0, 1),
('WH002-B01-R01-C02-L01', 2, 'B区01排02列01层', 'Finished', 'B', '01', '02', '01', 500.00, 0, 0, 1),
('WH002-B01-R01-C02-L02', 2, 'B区01排02列02层', 'Finished', 'B', '01', '02', '02', 500.00, 0, 0, 1),
('WH002-B01-R02-C01-L01', 2, 'B区02排01列01层', 'Finished', 'B', '02', '01', '01', 500.00, 0, 0, 1),
('WH002-B01-R02-C01-L02', 2, 'B区02排01列02层', 'Finished', 'B', '02', '01', '02', 500.00, 0, 0, 1),
('WH002-B01-R02-C02-L01', 2, 'B区02排02列01层', 'Finished', 'B', '02', '02', '01', 500.00, 0, 0, 1),
('WH002-B01-R02-C02-L02', 2, 'B区02排02列02层', 'Finished', 'B', '02', '02', '02', 500.00, 0, 0, 1),
-- 包装材料仓库库位
('WH003-C01-R01-C01-L01', 3, 'C区01排01列01层', 'Normal', 'C', '01', '01', '01', 2000.00, 0, 0, 1),
('WH003-C01-R01-C02-L01', 3, 'C区01排02列01层', 'Normal', 'C', '01', '02', '01', 2000.00, 0, 0, 1),
('WH003-C01-R02-C01-L01', 3, 'C区02排01列01层', 'Normal', 'C', '02', '01', '01', 2000.00, 0, 0, 1),
('WH003-C01-R02-C02-L01', 3, 'C区02排02列01层', 'Normal', 'C', '02', '02', '01', 2000.00, 0, 0, 1);

-- 1.7 加工厂数据
INSERT INTO ProcessingFactory (FactoryCode, FactoryName, ContactPerson, ContactPhone, Address, Status) VALUES
('FAC001', '塑料制品加工厂', '厂长陈一', '13700137001', '广东省东莞市制造业园区1号', 1),
('FAC002', '不锈钢制品厂', '厂长陈二', '13700137002', '江苏省无锡市工业园区2号', 1),
('FAC003', '玻璃制品厂', '厂长陈三', '13700137003', '山东省淄博市玻璃园区3号', 1),
('FAC004', '陶瓷制品厂', '厂长陈四', '13700137004', '江西省景德镇陶瓷园区4号', 1);

-- ====================================
-- 2. 用户权限相关数据
-- ====================================

-- 2.1 用户数据
INSERT INTO User (Username, PasswordHash, Email, FullName, Phone, Department, Position, IsActive) VALUES
-- ('admin', 'admin123hash', 'admin@watercup.com', '系统管理员', '13600136001', 'IT部门', '系统管理员', 1),
('warehouse01', 'warehouse123hash', 'wh01@watercup.com', '张仓管', '13600136002', '仓储部门', '仓库管理员', 1),
('warehouse02', 'warehouse123hash', 'wh02@watercup.com', '李仓管', '13600136003', '仓储部门', '仓库管理员', 1),
('purchase01', 'purchase123hash', 'pur01@watercup.com', '王采购', '13600136004', '采购部门', '采购员', 1),
('sales01', 'sales123hash', 'sales01@watercup.com', '赵销售', '13600136005', '销售部门', '销售员', 1),
('production01', 'prod123hash', 'prod01@watercup.com', '钱生产', '13600136006', '生产部门', '生产主管', 1),
('quality01', 'qa123hash', 'qa01@watercup.com', '孙质检', '13600136007', '质量部门', '质检员', 1),
('operator01', 'oper123hash', 'oper01@watercup.com', '周操作', '13600136008', '仓储部门', '仓库操作员', 1);

-- 2.2 部门数据
INSERT INTO Department (DepartmentCode, DepartmentName, ParentID, ManagerID, Description, Status) VALUES
('DEPT001', 'IT部门', 0, 1, '信息技术部门', 1),
('DEPT002', '仓储部门', 0, 2, '仓储管理部门', 1),
('DEPT003', '采购部门', 0, 4, '采购管理部门', 1),
('DEPT004', '销售部门', 0, 5, '销售管理部门', 1),
('DEPT005', '生产部门', 0, 6, '生产管理部门', 1),
('DEPT006', '质量部门', 0, 7, '质量管理部门', 1);

-- 2.3 角色数据
INSERT INTO Role (RoleName, Description, IsSystem) VALUES
('系统管理员', '系统最高权限管理员', 1),
('仓库管理员', '仓库管理权限', 0),
('采购员', '采购相关权限', 0),
('销售员', '销售相关权限', 0),
('生产主管', '生产管理权限', 0),
('质检员', '质量检验权限', 0),
('操作员', '基础操作权限', 0);

-- 2.4 用户角色关联
INSERT INTO UserRole (UserID, RoleID) VALUES
(1, 1), -- admin - 系统管理员
(2, 2), -- warehouse01 - 仓库管理员
(3, 2), -- warehouse02 - 仓库管理员
(4, 3), -- purchase01 - 采购员
(5, 4), -- sales01 - 销售员
(6, 5), -- production01 - 生产主管
(7, 6), -- quality01 - 质检员
(8, 7); -- operator01 - 操作员

-- 2.5 权限数据
INSERT INTO Permission (PermissionCode, PermissionName, ParentID, PermissionType, Path, Icon, SortOrder, Description) VALUES
('SYSTEM', '系统管理', 0, 'Menu', '/system', 'system', 1, '系统管理模块'),
('WAREHOUSE', '仓库管理', 0, 'Menu', '/warehouse', 'warehouse', 2, '仓库管理模块'),
('INVENTORY', '库存管理', 0, 'Menu', '/inventory', 'inventory', 3, '库存管理模块'),
('INBOUND', '入库管理', 0, 'Menu', '/inbound', 'inbound', 4, '入库管理模块'),
('OUTBOUND', '出库管理', 0, 'Menu', '/outbound', 'outbound', 5, '出库管理模块'),
('REPORT', '报表管理', 0, 'Menu', '/report', 'report', 6, '报表管理模块');

-- 2.6 角色权限关联
INSERT INTO RolePermission (RoleID, PermissionID) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), -- 系统管理员所有权限
(2, 2), (2, 3), (2, 4), (2, 5), -- 仓库管理员权限
(3, 4), -- 采购员权限
(4, 5), -- 销售员权限
(5, 2), (5, 4), (5, 5), -- 生产主管权限
(6, 3), (6, 4), (6, 5), -- 质检员权限
(7, 2), (7, 3); -- 操作员权限

-- ====================================
-- 3. 业务数据
-- ====================================

-- 3.1 原材料入库单数据
INSERT INTO RawMaterialInbound (InboundNumber, SupplierID, WarehouseID, InboundDate, OperatorUserID, Status, TotalAmount, Remarks) VALUES
('RI20250616001', 1, 1, '2025-06-15 09:00:00', 2, 'Completed', 15000.00, 'PP塑料颗粒月度采购'),
('RI20250616002', 2, 1, '2025-06-15 10:30:00', 2, 'Completed', 25000.00, '不锈钢板材采购'),
('RI20250616003', 3, 1, '2025-06-15 14:00:00', 2, 'Completed', 8000.00, '玻璃原料补库'),
('RI20250616004', 4, 3, '2025-06-16 08:00:00', 3, 'Pending', 12000.00, '包装材料采购'),
('RI20250616005', 5, 1, '2025-06-16 10:00:00', 2, 'Draft', 6000.00, '五金配件采购');

-- 3.2 原材料入库单明细数据
INSERT INTO RawMaterialInboundDetail (InboundID, RawMaterialID, Quantity, UnitPrice, Amount, BatchNumber, ProductionDate, ExpiryDate, QualityStatus, Remarks) VALUES
-- 入库单1明细
(1, 1, 1000.000, 15.00, 15000.00, 'PP20250615001', '2025-06-10', '2027-06-10', 'Qualified', 'PP塑料颗粒'),
-- 入库单2明细
(2, 3, 500.000, 50.00, 25000.00, 'SS20250615001', '2025-06-05', NULL, 'Qualified', '304不锈钢板'),
-- 入库单3明细
(3, 4, 200.000, 40.00, 8000.00, 'GL20250615001', '2025-06-08', NULL, 'Qualified', '高硼硅玻璃原料'),
-- 入库单4明细
(4, 8, 6000, 2.00, 12000.00, 'PK20250616001', '2025-06-14', NULL, 'Pending', '彩印包装盒'),
-- 入库单5明细
(5, 5, 2000, 3.00, 6000.00, 'SL20250616001', '2025-06-12', '2027-06-12', 'Qualified', '硅胶密封圈');

-- 3.3 原材料出库单数据
INSERT INTO RawMaterialOutbound (OutboundNumber, WarehouseID, OutboundType, DepartmentID, OutboundDate, OperatorUserID, Status, TotalAmount, Remarks) VALUES
('RO20250616001', 1, 'Production', 5, '2025-06-16 08:30:00', 8, 'Completed', 7500.00, '生产领料-塑料水杯'),
('RO20250616002', 1, 'Production', 5, '2025-06-16 10:00:00', 8, 'Completed', 10000.00, '生产领料-不锈钢保温杯'),
('RO20250616003', 3, 'Production', 5, '2025-06-16 14:00:00', 8, 'Pending', 3000.00, '生产领料-包装材料');

-- 3.4 原材料出库单明细数据
INSERT INTO RawMaterialOutboundDetail (OutboundID, RawMaterialID, LocationID, Quantity, UnitPrice, Amount, BatchNumber, Remarks) VALUES
-- 出库单1明细
(1, 1, 'WH001-A01-R01-C01-L01', 500.000, 15.00, 7500.00, 'PP20250615001', '塑料水杯生产用料'),
-- 出库单2明细
(2, 3, 'WH001-A01-R01-C02-L01', 200.000, 50.00, 10000.00, 'SS20250615001', '不锈钢保温杯生产用料'),
-- 出库单3明细
(3, 8, 'WH003-C01-R01-C01-L01', 1500, 2.00, 3000.00, 'PK20250616001', '包装盒领用');

-- 3.5 成品入库单数据
INSERT INTO FinishedProductInbound (InboundNumber, FactoryID, WarehouseID, InboundDate, OperatorUserID, Status, TotalQuantity, Remarks) VALUES
('FI20250616001', 1, 2, '2025-06-16 09:00:00', 2, 'Completed', 1000.00, '塑料水杯生产完成入库'),
('FI20250616002', 2, 2, '2025-06-16 11:00:00', 2, 'Completed', 200.00, '不锈钢保温杯生产完成'),
('FI20250616003', 1, 2, '2025-06-16 15:00:00', 2, 'Pending', 800.00, '运动水壶生产入库'),
('FI20250616004', 3, 2, '2025-06-16 16:30:00', 2, 'Draft', 150.00, '玻璃水杯套装生产入库');

-- 3.6 成品入库单明细数据
INSERT INTO FinishedProductInboundDetail (InboundID, FinishedProductID, LocationID, Quantity, BatchNumber, ProductionDate, QualityStatus, Remarks) VALUES
-- 成品入库单1明细
(30001, 1, 'WH002-B01-R01-C01-L01', 500.000, 'FP001-20250616-001', '2025-06-16', 'Qualified', '经典塑料水杯'),
(30001, 1, 'WH002-B01-R01-C01-L02', 500.000, 'FP001-20250616-002', '2025-06-16', 'Qualified', '经典塑料水杯'),
-- 成品入库单2明细
(30002, 4, 'WH002-B01-R01-C02-L01', 100.000, 'FP004-20250616-001', '2025-06-16', 'Qualified', '不锈钢保温杯'),
(30002, 4, 'WH002-B01-R01-C02-L02', 100.000, 'FP004-20250616-002', '2025-06-16', 'Qualified', '不锈钢保温杯'),
-- 成品入库单3明细
(30003, 2, 'WH002-B01-R02-C01-L01', 400.000, 'FP002-20250616-001', '2025-06-16', 'Pending', '运动水壶'),
(30003, 2, 'WH002-B01-R02-C01-L02', 400.000, 'FP002-20250616-002', '2025-06-16', 'Pending', '运动水壶'),
-- 成品入库单4明细
(30004, 6, 'WH002-B01-R02-C02-L01', 150.000, 'FP006-20250616-001', '2025-06-16', 'Qualified', '玻璃水杯套装');

-- 3.7 成品出库单数据
INSERT INTO FinishedProductOutbound (OutboundNumber, CustomerID, WarehouseID, OutboundType, OrderNumber, OutboundDate, DeliveryDate, OperatorUserID, Status, TotalQuantity, Remarks) VALUES
('FO20250616001', 1, 2, 'Sale', 'SO20250616001', '2025-06-16 10:00:00', '2025-06-17', 5, 'Completed', 300.00, '大型连锁超市订单'),
('FO20250616002', 2, 2, 'Sale', 'SO20250616002', '2025-06-16 14:00:00', '2025-06-18', 5, 'Pending', 150.00, '电商平台订单'),
('FO20250616003', 3, 2, 'Sale', 'SO20250616003', '2025-06-16 16:00:00', '2025-06-19', 5, 'Draft', 100.00, '办公用品批发商订单');

-- 3.8 成品出库单明细数据
INSERT INTO FinishedProductOutboundDetail (OutboundID, FinishedProductID, LocationID, Quantity, BatchNumber, Remarks) VALUES
-- 成品出库单1明细
(40001, 1, 'WH002-B01-R01-C01-L01', 200.000, 'FP001-20250616-001', '经典塑料水杯销售'),
(40001, 4, 'WH002-B01-R01-C02-L01', 100.000, 'FP004-20250616-001', '不锈钢保温杯销售'),
-- 成品出库单2明细
(40002, 2, 'WH002-B01-R02-C01-L01', 150.000, 'FP002-20250616-001', '运动水壶销售'),
-- 成品出库单3明细
(40003, 1, 'WH002-B01-R01-C01-L02', 100.000, 'FP001-20250616-002', '塑料水杯批发');

-- 3.9 库存数据
INSERT INTO Inventory (ItemType, ItemID, LocationID, BatchNumber, CurrentQuantity, AvailableQuantity, ReservedQuantity, UnitCost, ProductionDate, ExpiryDate, LastInboundDate, LastOutboundDate) VALUES
-- 原材料库存
('RawMaterial', 1, 'WH001-A01-R01-C01-L01', 'PP20250615001', 500.000, 500.000, 0.000, 15.00, '2025-06-10', '2027-06-10', '2025-06-15 09:00:00', '2025-06-16 08:30:00'),
('RawMaterial', 3, 'WH001-A01-R01-C02-L01', 'SS20250615001', 300.000, 300.000, 0.000, 50.00, '2025-06-05', NULL, '2025-06-15 10:30:00', '2025-06-16 10:00:00'),
('RawMaterial', 4, 'WH001-A01-R01-C02-L02', 'GL20250615001', 200.000, 200.000, 0.000, 40.00, '2025-06-08', NULL, '2025-06-15 14:00:00', NULL),
('RawMaterial', 5, 'WH001-A01-R02-C01-L01', 'SL20250616001', 2000, 2000, 0, 3.00, '2025-06-12', '2027-06-12', '2025-06-16 10:00:00', NULL),
('RawMaterial', 8, 'WH003-C01-R01-C01-L01', 'PK20250616001', 4500, 4500, 0, 2.00, '2025-06-14', NULL, '2025-06-16 08:00:00', '2025-06-16 14:00:00'),
-- 成品库存
('FinishedProduct', 1, 'WH002-B01-R01-C01-L01', 'FP001-20250616-001', 300.000, 300.000, 0.000, 12.50, '2025-06-16', NULL, '2025-06-16 09:00:00', '2025-06-16 10:00:00'),
('FinishedProduct', 1, 'WH002-B01-R01-C01-L02', 'FP001-20250616-002', 400.000, 400.000, 0.000, 12.50, '2025-06-16', NULL, '2025-06-16 09:00:00', '2025-06-16 16:00:00'),
('FinishedProduct', 2, 'WH002-B01-R02-C01-L01', 'FP002-20250616-001', 250.000, 100.000, 150.000, 18.75, '2025-06-16', NULL, '2025-06-16 15:00:00', '2025-06-16 14:00:00'),
('FinishedProduct', 2, 'WH002-B01-R02-C01-L02', 'FP002-20250616-002', 400.000, 400.000, 0.000, 18.75, '2025-06-16', NULL, '2025-06-16 15:00:00', NULL),
('FinishedProduct', 4, 'WH002-B01-R01-C02-L01', 'FP004-20250616-001', 0.000, 0.000, 0.000, 62.50, '2025-06-16', NULL, '2025-06-16 11:00:00', '2025-06-16 10:00:00'),
('FinishedProduct', 4, 'WH002-B01-R01-C02-L02', 'FP004-20250616-002', 100.000, 100.000, 0.000, 62.50, '2025-06-16', NULL, '2025-06-16 11:00:00', NULL),
('FinishedProduct', 6, 'WH002-B01-R02-C02-L01', 'FP006-20250616-001', 150.000, 150.000, 0.000, 45.00, '2025-06-16', NULL, '2025-06-16 16:30:00', NULL);

-- 3.10 库存变动记录数据
INSERT INTO InventoryTransaction (InventoryID, TransactionType, ReferenceType, ReferenceID, QuantityBefore, QuantityChange, QuantityAfter, UnitCost, TransactionDate, OperatorUserID, Remarks) VALUES
-- 原材料入库变动记录
(1, 'Inbound', 'RawMaterialInbound', 1, 0.000, 1000.000, 1000.000, 15.00, '2025-06-15 09:00:00', 2, 'PP塑料颗粒入库'),
(2, 'Inbound', 'RawMaterialInbound', 2, 0.000, 500.000, 500.000, 50.00, '2025-06-15 10:30:00', 2, '不锈钢板入库'),
(3, 'Inbound', 'RawMaterialInbound', 3, 0.000, 200.000, 200.000, 40.00, '2025-06-15 14:00:00', 2, '玻璃原料入库'),
(4, 'Inbound', 'RawMaterialInbound', 5, 0.000, 2000, 2000, 3.00, '2025-06-16 10:00:00', 2, '硅胶密封圈入库'),
(5, 'Inbound', 'RawMaterialInbound', 4, 0.000, 6000, 6000, 2.00, '2025-06-16 08:00:00', 3, '包装盒入库'),
-- 原材料出库变动记录
(1, 'Outbound', 'RawMaterialOutbound', 1, 1000.000, -500.000, 500.000, 15.00, '2025-06-16 08:30:00', 8, 'PP塑料颗粒生产领料'),
(2, 'Outbound', 'RawMaterialOutbound', 2, 500.000, -200.000, 300.000, 50.00, '2025-06-16 10:00:00', 8, '不锈钢板生产领料'),
(5, 'Outbound', 'RawMaterialOutbound', 3, 6000, -1500, 4500, 2.00, '2025-06-16 14:00:00', 8, '包装盒领料'),
-- 成品入库变动记录
(6, 'Inbound', 'FinishedProductInbound', 30001, 0.000, 500.000, 500.000, 12.50, '2025-06-16 09:00:00', 2, '经典塑料水杯入库'),
(7, 'Inbound', 'FinishedProductInbound', 30001, 0.000, 500.000, 500.000, 12.50, '2025-06-16 09:00:00', 2, '经典塑料水杯入库'),
(8, 'Inbound', 'FinishedProductInbound', 30003, 0.000, 400.000, 400.000, 18.75, '2025-06-16 15:00:00', 2, '运动水壶入库'),
(9, 'Inbound', 'FinishedProductInbound', 30003, 0.000, 400.000, 400.000, 18.75, '2025-06-16 15:00:00', 2, '运动水壶入库'),
(10, 'Inbound', 'FinishedProductInbound', 30002, 0.000, 100.000, 100.000, 62.50, '2025-06-16 11:00:00', 2, '不锈钢保温杯入库'),
(11, 'Inbound', 'FinishedProductInbound', 30002, 0.000, 100.000, 100.000, 62.50, '2025-06-16 11:00:00', 2, '不锈钢保温杯入库'),
(12, 'Inbound', 'FinishedProductInbound', 30004, 0.000, 150.000, 150.000, 45.00, '2025-06-16 16:30:00', 2, '玻璃水杯套装入库'),
-- 成品出库变动记录
(6, 'Outbound', 'FinishedProductOutbound', 40001, 500.000, -200.000, 300.000, 12.50, '2025-06-16 10:00:00', 5, '经典塑料水杯销售出库'),
(7, 'Outbound', 'FinishedProductOutbound', 40003, 500.000, -100.000, 400.000, 12.50, '2025-06-16 16:00:00', 5, '经典塑料水杯销售出库'),
(8, 'Outbound', 'FinishedProductOutbound', 40002, 400.000, -150.000, 250.000, 18.75, '2025-06-16 14:00:00', 5, '运动水壶销售出库'),
(10, 'Outbound', 'FinishedProductOutbound', 40001, 100.000, -100.000, 0.000, 62.50, '2025-06-16 10:00:00', 5, '不锈钢保温杯销售出库');

-- 3.11 盘点单数据
INSERT INTO Stocktaking (StocktakingNumber, WarehouseID, StocktakingType, StocktakingDate, PlanStartDate, PlanEndDate, ActualStartDate, ActualEndDate, OperatorUserID, Status, Remarks) VALUES
('ST20250615001', 1, 'Full', '2025-06-15 16:00:00', '2025-06-15', '2025-06-15', '2025-06-15 16:00:00', '2025-06-15 18:30:00', 2, 'Completed', '原材料仓库月度全盘'),
('ST20250616001', 2, 'Partial', '2025-06-16 09:00:00', '2025-06-16', '2025-06-16', '2025-06-16 09:00:00', NULL, 2, 'InProgress', '成品仓库部分盘点'),
('ST20250617001', 3, 'Cyclic', '2025-06-17 08:00:00', '2025-06-17', '2025-06-17', NULL, NULL, 3, 'Draft', '包装材料仓库循环盘点');

-- 3.12 盘点明细数据
INSERT INTO StocktakingDetail (StocktakingID, ItemType, ItemID, LocationID, BatchNumber, SystemQuantity, ActualQuantity, UnitCost, StockStatus, CounterUserID, CountTime, Remarks) VALUES
-- 盘点单1明细（原材料仓库全盘）
(50001, 'RawMaterial', 1, 'WH001-A01-R01-C01-L01', 'PP20250615001', 1000.000, 998.000, 15.00, 'Normal', 2, '2025-06-15 16:30:00', '少量损耗'),
(50001, 'RawMaterial', 3, 'WH001-A01-R01-C02-L01', 'SS20250615001', 500.000, 500.000, 50.00, 'Normal', 2, '2025-06-15 17:00:00', '数量正确'),
(50001, 'RawMaterial', 4, 'WH001-A01-R01-C02-L02', 'GL20250615001', 200.000, 200.000, 40.00, 'Normal', 2, '2025-06-15 17:30:00', '数量正确'),
-- 盘点单2明细（成品仓库部分盘点）
(50002, 'FinishedProduct', 1, 'WH002-B01-R01-C01-L01', 'FP001-20250616-001', 500.000, 500.000, 12.50, 'Normal', 2, '2025-06-16 09:30:00', '数量正确'),
(50002, 'FinishedProduct', 4, 'WH002-B01-R01-C02-L01', 'FP004-20250616-001', 100.000, 99.000, 62.50, 'Normal', 2, '2025-06-16 10:00:00', '差异1个'),
(50002, 'FinishedProduct', 4, 'WH002-B01-R01-C02-L02', 'FP004-20250616-002', 100.000, 100.000, 62.50, 'Normal', 2, '2025-06-16 10:30:00', '数量正确');

-- ====================================
-- 4. 系统配置数据
-- ====================================

-- 4.1 系统配置数据
INSERT INTO SystemConfig (ConfigKey, ConfigValue, ConfigType, Category, Description, IsEditable) VALUES
('SYSTEM_NAME', '水杯生产企业仓储管理系统', 'String', 'System', '系统名称', 1),
('SYSTEM_VERSION', '1.0.0', 'String', 'System', '系统版本', 0),
('DEFAULT_WAREHOUSE', 'WH001', 'String', 'Warehouse', '默认仓库', 1),
('AUTO_LOCATION_ASSIGN', 'true', 'Boolean', 'Warehouse', '自动分配库位', 1),
('MIN_STOCK_WARNING', 'true', 'Boolean', 'Inventory', '最小库存预警', 1),
('MAX_INBOUND_DAYS', '30', 'Number', 'Business', '最大入库天数', 1),
('PASSWORD_MIN_LENGTH', '8', 'Number', 'Security', '密码最小长度', 1),
('SESSION_TIMEOUT', '1800', 'Number', 'Security', '会话超时时间（秒）', 1),
('BACKUP_RETENTION_DAYS', '30', 'Number', 'System', '备份保留天数', 1),
('EMAIL_SMTP_HOST', 'smtp.company.com', 'String', 'Email', 'SMTP服务器', 1),
('EMAIL_SMTP_PORT', '587', 'Number', 'Email', 'SMTP端口', 1),
('REPORT_EXPORT_FORMAT', 'PDF,EXCEL', 'String', 'Report', '报表导出格式', 1);

-- 4.2 单据编号序列数据
INSERT INTO NumberSequence (SequenceType, Prefix, CurrentNumber, NumberLength, DateFormat, ResetType, LastResetDate) VALUES
('RawInbound', 'RI', 5, 6, 'YYYYMMDD', 'Daily', '2025-06-16'),
('RawOutbound', 'RO', 3, 6, 'YYYYMMDD', 'Daily', '2025-06-16'),
('ProductInbound', 'FI', 4, 6, 'YYYYMMDD', 'Daily', '2025-06-16'),
('ProductOutbound', 'FO', 3, 6, 'YYYYMMDD', 'Daily', '2025-06-16'),
('Stocktaking', 'ST', 3, 6, 'YYYYMMDD', 'Daily', '2025-06-17');

-- 4.3 操作日志数据
INSERT INTO OperationLog (UserID, Username, OperationType, ModuleName, FunctionName, RequestMethod, RequestUrl, RequestParams, ResponseResult, ExecutionTime, IPAddress, UserAgent, Status, OperationTime) VALUES
(1, 'admin', 'Login', 'System', '用户登录', 'POST', '/api/auth/login', '{"username":"admin"}', '{"success":true}', 125, '192.168.1.100', 'Mozilla/5.0 Chrome/91.0', 'Success', '2025-06-16 08:00:00'),
(2, 'warehouse01', 'Login', 'System', '用户登录', 'POST', '/api/auth/login', '{"username":"warehouse01"}', '{"success":true}', 98, '192.168.1.101', 'Mozilla/5.0 Chrome/91.0', 'Success', '2025-06-16 08:15:00'),
(2, 'warehouse01', 'Create', 'Inbound', '创建入库单', 'POST', '/api/inbound/raw', '{"supplierID":1}', '{"inboundID":1}', 245, '192.168.1.101', 'Mozilla/5.0 Chrome/91.0', 'Success', '2025-06-16 08:30:00'),
(2, 'warehouse01', 'Update', 'Inbound', '完成入库', 'PUT', '/api/inbound/raw/1', '{"status":"Completed"}', '{"success":true}', 186, '192.168.1.101', 'Mozilla/5.0 Chrome/91.0', 'Success', '2025-06-16 09:00:00'),
(5, 'sales01', 'Login', 'System', '用户登录', 'POST', '/api/auth/login', '{"username":"sales01"}', '{"success":true}', 105, '192.168.1.105', 'Mozilla/5.0 Chrome/91.0', 'Success', '2025-06-16 09:30:00'),
(5, 'sales01', 'Create', 'Outbound', '创建出库单', 'POST', '/api/outbound/product', '{"customerID":1}', '{"outboundID":40001}', 298, '192.168.1.105', 'Mozilla/5.0 Chrome/91.0', 'Success', '2025-06-16 10:00:00'),
(8, 'operator01', 'Login', 'System', '用户登录', 'POST', '/api/auth/login', '{"username":"operator01"}', '{"success":true}', 87, '192.168.1.108', 'Mozilla/5.0 Chrome/91.0', 'Success', '2025-06-16 10:30:00'),
(2, 'warehouse01', 'Create', 'Stocktaking', '创建盘点单', 'POST', '/api/stocktaking', '{"warehouseID":2}', '{"stocktakingID":50002}', 156, '192.168.1.101', 'Mozilla/5.0 Chrome/91.0', 'Success', '2025-06-16 11:00:00'),
(7, 'quality01', 'Login', 'System', '用户登录', 'POST', '/api/auth/login', '{"username":"quality01"}', '{"success":true}', 92, '192.168.1.107', 'Mozilla/5.0 Chrome/91.0', 'Success', '2025-06-16 11:30:00'),
(3, 'warehouse02', 'Query', 'Inventory', '查询库存', 'GET', '/api/inventory', '{"warehouseID":3}', '{"count":15}', 78, '192.168.1.103', 'Mozilla/5.0 Chrome/91.0', 'Success', '2025-06-16 12:00:00');

-- ====================================
-- 5. 更新库位占用状态
-- ====================================

-- 更新有库存的库位为占用状态
UPDATE Location SET 
    IsOccupied = 1, 
    CurrentOccupancy = (
        SELECT COALESCE(SUM(i.CurrentQuantity), 0) 
        FROM Inventory i 
        WHERE i.LocationID = Location.LocationID
    )
WHERE LocationID IN (
    SELECT DISTINCT LocationID FROM Inventory WHERE CurrentQuantity > 0
);

-- ====================================
-- 6. 数据一致性检查和修正
-- ====================================

-- 修正原材料入库单的部门外键引用
UPDATE RawMaterialOutbound SET DepartmentID = 5 WHERE DepartmentID IS NULL;

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- ====================================
-- 数据统计查询
-- ====================================

-- 查看插入的数据统计
SELECT 
    '供应商' as 数据类型, COUNT(*) as 记录数 FROM Supplier
UNION ALL
SELECT '客户', COUNT(*) FROM Customer
UNION ALL
SELECT '原材料', COUNT(*) FROM RawMaterial
UNION ALL
SELECT '成品', COUNT(*) FROM FinishedProduct
UNION ALL
SELECT '仓库', COUNT(*) FROM Warehouse
UNION ALL
SELECT '库位', COUNT(*) FROM Location
UNION ALL
SELECT '加工厂', COUNT(*) FROM ProcessingFactory
UNION ALL
SELECT '用户', COUNT(*) FROM User
UNION ALL
SELECT '部门', COUNT(*) FROM Department
UNION ALL
SELECT '角色', COUNT(*) FROM Role
UNION ALL
SELECT '原材料入库单', COUNT(*) FROM RawMaterialInbound
UNION ALL
SELECT '原材料出库单', COUNT(*) FROM RawMaterialOutbound
UNION ALL
SELECT '成品入库单', COUNT(*) FROM FinishedProductInbound
UNION ALL
SELECT '成品出库单', COUNT(*) FROM FinishedProductOutbound
UNION ALL
SELECT '库存记录', COUNT(*) FROM Inventory
UNION ALL
SELECT '库存变动记录', COUNT(*) FROM InventoryTransaction
UNION ALL
SELECT '盘点单', COUNT(*) FROM Stocktaking
UNION ALL
SELECT '系统配置', COUNT(*) FROM SystemConfig
UNION ALL
SELECT '操作日志', COUNT(*) FROM OperationLog;

-- 库存汇总查询
SELECT 
    i.ItemType as 物料类型,
    CASE i.ItemType 
        WHEN 'RawMaterial' THEN rm.MaterialName
        WHEN 'FinishedProduct' THEN fp.ProductName
    END as 物料名称,
    SUM(i.CurrentQuantity) as 总库存,
    SUM(i.AvailableQuantity) as 可用库存,
    SUM(i.ReservedQuantity) as 预留库存,
    COUNT(DISTINCT i.LocationID) as 库位数量
FROM Inventory i
LEFT JOIN RawMaterial rm ON i.ItemType = 'RawMaterial' AND i.ItemID = rm.MaterialID
LEFT JOIN FinishedProduct fp ON i.ItemType = 'FinishedProduct' AND i.ItemID = fp.ProductID
WHERE i.CurrentQuantity > 0
GROUP BY i.ItemType, i.ItemID
ORDER BY i.ItemType, i.ItemID;

-- 仓库库位使用情况
SELECT 
    w.WarehouseName as 仓库名称,
    l.LocationType as 库位类型,
    COUNT(*) as 总库位数,
    SUM(CASE WHEN l.IsOccupied = 1 THEN 1 ELSE 0 END) as 已占用库位,
    SUM(CASE WHEN l.IsOccupied = 0 THEN 1 ELSE 0 END) as 空闲库位,
    ROUND(SUM(CASE WHEN l.IsOccupied = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as 占用率
FROM Warehouse w
JOIN Location l ON w.WarehouseID = l.WarehouseID
GROUP BY w.WarehouseID, w.WarehouseName, l.LocationType
ORDER BY w.WarehouseID, l.LocationType;