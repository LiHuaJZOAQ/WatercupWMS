const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root', // 请修改为你的MySQL密码
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 初始化数据库
async function initDatabase() {
  let connection;

  try {
    // 连接MySQL（不指定数据库）
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });

    console.log('连接MySQL成功');

    // 创建数据库（如果不存在）
    await connection.execute(`CREATE DATABASE IF NOT EXISTS watercup_wms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('数据库创建成功或已存在');

    // 切换到新创建的数据库
    await connection.changeUser({ database: 'watercup_wms' });

    // 创建用户表（如果不存在）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS User (
        UserID INT AUTO_INCREMENT PRIMARY KEY,
        Username VARCHAR(50) NOT NULL UNIQUE,
        PasswordHash VARCHAR(255) NOT NULL,
        FullName VARCHAR(100),
        Email VARCHAR(100),
        Department VARCHAR(50),
        Position VARCHAR(50),
        Status TINYINT DEFAULT 1,
        LastLoginTime DATETIME,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('用户表创建成功或已存在');

    // 检查是否已存在管理员用户
    const [adminUsers] = await connection.execute('SELECT * FROM User WHERE Username = ?', ['admin']);

    if (adminUsers.length === 0) {
      // 创建默认管理员用户
      const passwordHash = await bcrypt.hash('admin123', 10);
      await connection.execute(
        'INSERT INTO User (Username, PasswordHash, FullName, Department, Position) VALUES (?, ?, ?, ?, ?)',
        ['admin', passwordHash, '系统管理员', 'IT部门', '管理员']
      );
      console.log('默认管理员用户创建成功');
    } else {
      console.log('管理员用户已存在，跳过创建');
    }

    // 创建供应商表（如果不存在）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Supplier (
        SupplierID INT AUTO_INCREMENT PRIMARY KEY,
        SupplierCode VARCHAR(50) NOT NULL UNIQUE,
        SupplierName VARCHAR(100) NOT NULL,
        ContactPerson VARCHAR(50),
        ContactPhone VARCHAR(20),
        Email VARCHAR(100),
        Address VARCHAR(255),
        Status TINYINT DEFAULT 1,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('供应商表创建成功或已存在');

    // 创建仓库表（如果不存在）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Warehouse (
        WarehouseID INT AUTO_INCREMENT PRIMARY KEY,
        WarehouseCode VARCHAR(50) NOT NULL UNIQUE,
        WarehouseName VARCHAR(100) NOT NULL,
        Location VARCHAR(255),
        Manager VARCHAR(50),
        ContactPhone VARCHAR(20),
        Status TINYINT DEFAULT 1,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('仓库表创建成功或已存在');

    // 创建原材料表（如果不存在）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS RawMaterial (
        MaterialID INT AUTO_INCREMENT PRIMARY KEY,
        MaterialCode VARCHAR(50) NOT NULL UNIQUE,
        MaterialName VARCHAR(100) NOT NULL,
        Specification VARCHAR(255),
        Unit VARCHAR(20),
        Category VARCHAR(50),
        MinStock DECIMAL(10,2) DEFAULT 0,
        MaxStock DECIMAL(10,2) DEFAULT 0,
        Status TINYINT DEFAULT 1,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('原材料表创建成功或已存在');

    // 创建库位表（如果不存在）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Location (
        LocationID VARCHAR(50) PRIMARY KEY,
        WarehouseID INT NOT NULL,
        LocationName VARCHAR(100) NOT NULL,
        LocationType ENUM('Raw', 'Finished', 'Mixed') NOT NULL,
        Capacity DECIMAL(10,2) DEFAULT 0,
        Status TINYINT DEFAULT 1,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID)
      )
    `);
    console.log('库位表创建成功或已存在');

    // 创建入库单主表（如果不存在）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS RawMaterialInbound (
        InboundID INT AUTO_INCREMENT PRIMARY KEY,
        InboundNumber VARCHAR(50) NOT NULL UNIQUE,
        SupplierID INT NOT NULL,
        WarehouseID INT NOT NULL,
        InboundDate DATETIME NOT NULL,
        OperatorUserID INT NOT NULL,
        Status ENUM('Pending', 'approved', 'rejected', 'Cancelled') NOT NULL DEFAULT 'Pending',
        Remarks TEXT,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (SupplierID) REFERENCES Supplier(SupplierID),
        FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID),
        FOREIGN KEY (OperatorUserID) REFERENCES User(UserID)
      )
    `);
    console.log('入库单主表创建成功或已存在');

    // 创建入库单明细表（如果不存在）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS RawMaterialInboundDetail (
        DetailID INT AUTO_INCREMENT PRIMARY KEY,
        InboundID INT NOT NULL,
        RawMaterialID INT NOT NULL,
        Quantity DECIMAL(10,2) NOT NULL,
        UnitPrice DECIMAL(10,2) DEFAULT 0,
        Amount DECIMAL(10,2) DEFAULT 0,
        BatchNumber VARCHAR(50),
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (InboundID) REFERENCES RawMaterialInbound(InboundID),
        FOREIGN KEY (RawMaterialID) REFERENCES RawMaterial(MaterialID)
      )
    `);
    console.log('入库单明细表创建成功或已存在');

    // 创建库存表（如果不存在）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Inventory (
        InventoryID INT AUTO_INCREMENT PRIMARY KEY,
        ItemType ENUM('RawMaterial', 'FinishedProduct') NOT NULL,
        ItemID INT NOT NULL,
        LocationID VARCHAR(50) NOT NULL,
        BatchNumber VARCHAR(50),
        CurrentQuantity DECIMAL(10,2) NOT NULL DEFAULT 0,
        AvailableQuantity DECIMAL(10,2) NOT NULL DEFAULT 0,
        LastInboundDate DATETIME,
        LastOutboundDate DATETIME,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (LocationID) REFERENCES Location(LocationID)
      )
    `);
    console.log('库存表创建成功或已存在');

    // 创建库存事务表（如果不存在）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS InventoryTransaction (
        TransactionID INT AUTO_INCREMENT PRIMARY KEY,
        InventoryID INT NOT NULL,
        TransactionType ENUM('Inbound', 'Outbound', 'Adjustment', 'Transfer') NOT NULL,
        ReferenceType VARCHAR(50) NOT NULL,
        ReferenceID INT NOT NULL,
        QuantityBefore DECIMAL(10,2) NOT NULL,
        QuantityChange DECIMAL(10,2) NOT NULL,
        QuantityAfter DECIMAL(10,2) NOT NULL,
        TransactionDate DATETIME NOT NULL,
        OperatorUserID INT NOT NULL,
        Remarks TEXT,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (InventoryID) REFERENCES Inventory(InventoryID),
        FOREIGN KEY (OperatorUserID) REFERENCES User(UserID)
      )
    `);
    console.log('库存事务表创建成功或已存在');

    // 添加测试数据
    await addTestData(connection);

    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 添加测试数据
async function addTestData(connection) {
  try {
    // 检查是否已存在测试数据
    const [suppliers] = await connection.execute('SELECT * FROM Supplier LIMIT 1');
    if (suppliers.length > 0) {
      console.log('测试数据已存在，跳过添加');
      return;
    }

    // 添加测试供应商
    await connection.execute(`
      INSERT INTO Supplier (SupplierCode, SupplierName, ContactPerson, ContactPhone, Email, Address) VALUES
      ('S001', '北京塑料制品有限公司', '张三', '13800138001', 'zhangsan@example.com', '北京市朝阳区'),
      ('S002', '上海包装材料有限公司', '李四', '13800138002', 'lisi@example.com', '上海市浦东新区'),
      ('S003', '广州原料供应有限公司', '王五', '13800138003', 'wangwu@example.com', '广州市天河区')
    `);
    console.log('测试供应商数据添加成功');

    // 添加测试仓库
    await connection.execute(`
      INSERT INTO Warehouse (WarehouseCode, WarehouseName, Location, Manager, ContactPhone) VALUES
      ('W001', '原材料仓库', '工厂东区', '赵六', '13800138004'),
      ('W002', '成品仓库', '工厂西区', '钱七', '13800138005'),
      ('W003', '中央仓库', '工厂北区', '孙八', '13800138006')
    `);
    console.log('测试仓库数据添加成功');

    // 添加测试原材料
    await connection.execute(`
      INSERT INTO RawMaterial (MaterialCode, MaterialName, Specification, Unit, Category, MinStock, MaxStock) VALUES
      ('RM001', 'PET塑料', '食品级', 'kg', '塑料', 100, 1000),
      ('RM002', 'PP塑料', '工业级', 'kg', '塑料', 200, 2000),
      ('RM003', '瓶盖', '28mm', '个', '配件', 500, 5000),
      ('RM004', '标签纸', 'A4', '张', '包装', 300, 3000),
      ('RM005', '包装盒', '小号', '个', '包装', 100, 1000)
    `);
    console.log('测试原材料数据添加成功');

    // 添加测试库位
    await connection.execute(`
      INSERT INTO Location (LocationID, WarehouseID, LocationName, LocationType, Capacity) VALUES
      ('LOC-W001-A01', 1, 'A区01货架', 'Raw', 1000),
      ('LOC-W001-A02', 1, 'A区02货架', 'Raw', 1000),
      ('LOC-W001-B01', 1, 'B区01货架', 'Raw', 1000),
      ('LOC-W002-A01', 2, 'A区01货架', 'Finished', 1000),
      ('LOC-W003-A01', 3, 'A区01货架', 'Mixed', 1000)
    `);
    console.log('测试库位数据添加成功');

    console.log('所有测试数据添加成功');
  } catch (error) {
    console.error('添加测试数据失败:', error);
    throw error;
  }
}

// 执行初始化
initDatabase();