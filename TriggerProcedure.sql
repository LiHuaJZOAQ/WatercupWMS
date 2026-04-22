-- ====================================
-- 水杯生产企业仓储管理系统 - 触发器和存储过程
-- 创建日期: 2025-06-21
-- 说明: 本文件包含数据库自动化逻辑和业务处理过程
-- ====================================

-- 设置分隔符，避免存储过程中的分号造成问题
DELIMITER //

-- ====================================
-- 触发器部分
-- ====================================

-- 1. 用户表触发器 - 自动生成用户编号
DROP TRIGGER IF EXISTS tr_user_before_insert//
CREATE TRIGGER tr_user_before_insert
    BEFORE INSERT ON user
    FOR EACH ROW
BEGIN
    -- 如果没有设置用户名或用户名为空，自动生成
    IF NEW.Username IS NULL OR NEW.Username = '' THEN
        SET NEW.Username = CONCAT('USER', LPAD(NEW.UserID, 6, '0'));
    END IF;
    
    -- 设置默认创建时间和更新时间
    IF NEW.CreatedAt IS NULL THEN
        SET NEW.CreatedAt = NOW();
    END IF;
    
    IF NEW.UpdatedAt IS NULL THEN
        SET NEW.UpdatedAt = NOW();
    END IF;
END//

-- 2. 原材料入库明细触发器 - 自动更新库存
DROP TRIGGER IF EXISTS tr_raw_inbound_detail_after_insert//
CREATE TRIGGER tr_raw_inbound_detail_after_insert
    AFTER INSERT ON rawmaterialinbounddetail
    FOR EACH ROW
BEGIN
    DECLARE v_inbound_status VARCHAR(20);
    DECLARE v_location_id VARCHAR(30);
    DECLARE v_inventory_id INT;
    
    -- 获取入库单状态
    SELECT Status INTO v_inbound_status 
    FROM rawmaterialinbound 
    WHERE InboundID = NEW.InboundID;
    
    -- 只有当入库单状态为"已完成"时才更新库存
    IF v_inbound_status = 'Completed' THEN
        -- 查找合适的库位（这里简化为第一个可用库位）
        SELECT LocationID INTO v_location_id
        FROM location l
        JOIN warehouse w ON l.WarehouseID = w.WarehouseID
        WHERE l.LocationType = 'Raw' 
          AND l.Status = 1 
          AND (l.Capacity - l.CurrentOccupancy) >= NEW.Quantity
        ORDER BY l.LocationID
        LIMIT 1;
        
        -- 如果找到合适的库位
        IF v_location_id IS NOT NULL THEN
            -- 检查是否已存在相同物料和批次的库存记录
            SELECT InventoryID INTO v_inventory_id
            FROM inventory
            WHERE ItemType = 'RawMaterial'
              AND ItemID = NEW.RawMaterialID
              AND LocationID = v_location_id
              AND BatchNumber = NEW.BatchNumber;
            
            -- 如果存在则更新，否则插入新记录
            IF v_inventory_id IS NOT NULL THEN
                UPDATE inventory 
                SET CurrentQuantity = CurrentQuantity + NEW.Quantity,
                    AvailableQuantity = AvailableQuantity + NEW.Quantity,
                    LastInboundDate = NOW(),
                    UpdatedAt = NOW()
                WHERE InventoryID = v_inventory_id;
            ELSE
                INSERT INTO inventory (
                    ItemType, ItemID, LocationID, BatchNumber, 
                    CurrentQuantity, AvailableQuantity, UnitCost,
                    ProductionDate, ExpiryDate, LastInboundDate
                ) VALUES (
                    'RawMaterial', NEW.RawMaterialID, v_location_id, NEW.BatchNumber,
                    NEW.Quantity, NEW.Quantity, NEW.UnitPrice,
                    NEW.ProductionDate, NEW.ExpiryDate, NOW()
                );
                SET v_inventory_id = LAST_INSERT_ID();
            END IF;
            
            -- 记录库存变动
            INSERT INTO inventorytransaction (
                InventoryID, TransactionType, ReferenceType, ReferenceID,
                QuantityBefore, QuantityChange, QuantityAfter, UnitCost,
                TransactionDate, OperatorUserID, Remarks
            ) VALUES (
                v_inventory_id, 'Inbound', 'RawMaterialInbound', NEW.InboundID,
                COALESCE((SELECT CurrentQuantity - NEW.Quantity FROM inventory WHERE InventoryID = v_inventory_id), 0),
                NEW.Quantity,
                (SELECT CurrentQuantity FROM inventory WHERE InventoryID = v_inventory_id),
                NEW.UnitPrice, NOW(),
                (SELECT OperatorUserID FROM rawmaterialinbound WHERE InboundID = NEW.InboundID),
                CONCAT('原材料入库 - ', NEW.Remarks)
            );
            
            -- 更新库位占用量
            UPDATE location 
            SET CurrentOccupancy = CurrentOccupancy + NEW.Quantity,
                IsOccupied = IF(CurrentOccupancy + NEW.Quantity > 0, 1, 0),
                UpdatedAt = NOW()
            WHERE LocationID = v_location_id;
        END IF;
    END IF;
END//

-- 3. 原材料出库明细触发器 - 自动减少库存
DROP TRIGGER IF EXISTS tr_raw_outbound_detail_after_insert//
CREATE TRIGGER tr_raw_outbound_detail_after_insert
    AFTER INSERT ON rawmaterialoutbounddetail
    FOR EACH ROW
BEGIN
    DECLARE v_outbound_status VARCHAR(20);
    DECLARE v_inventory_id INT;
    DECLARE v_current_qty DECIMAL(18,3);
    
    -- 获取出库单状态
    SELECT Status INTO v_outbound_status 
    FROM rawmaterialoutbound 
    WHERE OutboundID = NEW.OutboundID;
    
    -- 只有当出库单状态为"已完成"时才更新库存
    IF v_outbound_status = 'Completed' THEN
        -- 查找对应的库存记录
        SELECT InventoryID, CurrentQuantity INTO v_inventory_id, v_current_qty
        FROM inventory
        WHERE ItemType = 'RawMaterial'
          AND ItemID = NEW.RawMaterialID
          AND LocationID = NEW.LocationID
          AND BatchNumber = NEW.BatchNumber;
        
        -- 如果找到库存记录且数量足够
        IF v_inventory_id IS NOT NULL AND v_current_qty >= NEW.Quantity THEN
            -- 更新库存
            UPDATE inventory 
            SET CurrentQuantity = CurrentQuantity - NEW.Quantity,
                AvailableQuantity = AvailableQuantity - NEW.Quantity,
                LastOutboundDate = NOW(),
                UpdatedAt = NOW()
            WHERE InventoryID = v_inventory_id;
            
            -- 记录库存变动
            INSERT INTO inventorytransaction (
                InventoryID, TransactionType, ReferenceType, ReferenceID,
                QuantityBefore, QuantityChange, QuantityAfter, UnitCost,
                TransactionDate, OperatorUserID, Remarks
            ) VALUES (
                v_inventory_id, 'Outbound', 'RawMaterialOutbound', NEW.OutboundID,
                v_current_qty, -NEW.Quantity, v_current_qty - NEW.Quantity,
                NEW.UnitPrice, NOW(),
                (SELECT OperatorUserID FROM rawmaterialoutbound WHERE OutboundID = NEW.OutboundID),
                CONCAT('原材料出库 - ', NEW.Remarks)
            );
            
            -- 更新库位占用量
            UPDATE location 
            SET CurrentOccupancy = CurrentOccupancy - NEW.Quantity,
                IsOccupied = IF(CurrentOccupancy - NEW.Quantity > 0, 1, 0),
                UpdatedAt = NOW()
            WHERE LocationID = NEW.LocationID;
        END IF;
    END IF;
END//

-- 4. 成品入库明细触发器 - 自动更新库存
DROP TRIGGER IF EXISTS tr_product_inbound_detail_after_insert//
CREATE TRIGGER tr_product_inbound_detail_after_insert
    AFTER INSERT ON finishedproductinbounddetail
    FOR EACH ROW
BEGIN
    DECLARE v_inbound_status VARCHAR(20);
    DECLARE v_inventory_id INT;
    
    -- 获取入库单状态
    SELECT Status INTO v_inbound_status 
    FROM finishedproductinbound 
    WHERE InboundID = NEW.InboundID;
    
    -- 只有当入库单状态为"已完成"时才更新库存
    IF v_inbound_status = 'Completed' THEN
        -- 检查是否已存在相同成品和批次的库存记录
        SELECT InventoryID INTO v_inventory_id
        FROM inventory
        WHERE ItemType = 'FinishedProduct'
          AND ItemID = NEW.FinishedProductID
          AND LocationID = NEW.LocationID
          AND BatchNumber = NEW.BatchNumber;
        
        -- 如果存在则更新，否则插入新记录
        IF v_inventory_id IS NOT NULL THEN
            UPDATE inventory 
            SET CurrentQuantity = CurrentQuantity + NEW.Quantity,
                AvailableQuantity = AvailableQuantity + NEW.Quantity,
                LastInboundDate = NOW(),
                UpdatedAt = NOW()
            WHERE InventoryID = v_inventory_id;
        ELSE
            INSERT INTO inventory (
                ItemType, ItemID, LocationID, BatchNumber, 
                CurrentQuantity, AvailableQuantity,
                ProductionDate, LastInboundDate
            ) VALUES (
                'FinishedProduct', NEW.FinishedProductID, NEW.LocationID, NEW.BatchNumber,
                NEW.Quantity, NEW.Quantity,
                NEW.ProductionDate, NOW()
            );
            SET v_inventory_id = LAST_INSERT_ID();
        END IF;
        
        -- 记录库存变动
        INSERT INTO inventorytransaction (
            InventoryID, TransactionType, ReferenceType, ReferenceID,
            QuantityBefore, QuantityChange, QuantityAfter,
            TransactionDate, OperatorUserID, Remarks
        ) VALUES (
            v_inventory_id, 'Inbound', 'FinishedProductInbound', NEW.InboundID,
            COALESCE((SELECT CurrentQuantity - NEW.Quantity FROM inventory WHERE InventoryID = v_inventory_id), 0),
            NEW.Quantity,
            (SELECT CurrentQuantity FROM inventory WHERE InventoryID = v_inventory_id),
            NOW(),
            (SELECT OperatorUserID FROM finishedproductinbound WHERE InboundID = NEW.InboundID),
            CONCAT('成品入库 - ', NEW.Remarks)
        );
        
        -- 更新库位占用量
        UPDATE location 
        SET CurrentOccupancy = CurrentOccupancy + NEW.Quantity,
            IsOccupied = IF(CurrentOccupancy + NEW.Quantity > 0, 1, 0),
            UpdatedAt = NOW()
        WHERE LocationID = NEW.LocationID;
    END IF;
END//

-- 5. 库存低库存预警触发器
DROP TRIGGER IF EXISTS tr_inventory_low_stock_check//
CREATE TRIGGER tr_inventory_low_stock_check
    AFTER UPDATE ON inventory
    FOR EACH ROW
BEGIN
    DECLARE v_min_stock DECIMAL(18,2);
    DECLARE v_item_name VARCHAR(100);
    
    -- 检查是否是原材料还是成品，并获取最小库存设置
    IF NEW.ItemType = 'RawMaterial' THEN
        SELECT MinStock, MaterialName INTO v_min_stock, v_item_name
        FROM rawmaterial 
        WHERE MaterialID = NEW.ItemID;
    ELSEIF NEW.ItemType = 'FinishedProduct' THEN
        SELECT MinStock, ProductName INTO v_min_stock, v_item_name
        FROM finishedproduct 
        WHERE ProductID = NEW.ItemID;
    END IF;
    
    -- 如果当前库存低于最小库存，插入预警日志
    IF NEW.CurrentQuantity < v_min_stock THEN
        INSERT INTO operationlog (
            OperationType, ModuleName, FunctionName,
            ResponseResult, Status, OperationTime, ErrorMessage
        ) VALUES (
            'Warning', 'Inventory', '库存预警',
            CONCAT('物料: ', v_item_name, ', 当前库存: ', NEW.CurrentQuantity, ', 最小库存: ', v_min_stock),
            'Success', NOW(),
            CONCAT('库位: ', NEW.LocationID, ', 批次: ', NEW.BatchNumber)
        );
    END IF;
END//

-- ====================================
-- 存储过程部分
-- ====================================

-- 1. 生成单据编号的存储过程
DROP PROCEDURE IF EXISTS sp_generate_document_number//
CREATE PROCEDURE sp_generate_document_number(
    IN p_sequence_type VARCHAR(30),    -- 序列类型
    OUT p_document_number VARCHAR(30)  -- 生成的单据编号
)
BEGIN
    DECLARE v_prefix VARCHAR(10);
    DECLARE v_current_number INT;
    DECLARE v_number_length INT;
    DECLARE v_date_format VARCHAR(20);
    DECLARE v_reset_type VARCHAR(10);
    DECLARE v_last_reset_date DATE;
    DECLARE v_today DATE;
    DECLARE v_formatted_date VARCHAR(20);
    DECLARE v_padded_number VARCHAR(10);
    
    -- 获取当前日期
    SET v_today = CURDATE();
    
    -- 获取序列配置
    SELECT Prefix, CurrentNumber, NumberLength, DateFormat, ResetType, LastResetDate
    INTO v_prefix, v_current_number, v_number_length, v_date_format, v_reset_type, v_last_reset_date
    FROM numbersequence
    WHERE SequenceType = p_sequence_type;
    
    -- 检查是否需要重置序列
    IF (v_reset_type = 'Daily' AND v_last_reset_date < v_today) OR
       (v_reset_type = 'Monthly' AND (YEAR(v_last_reset_date) < YEAR(v_today) OR MONTH(v_last_reset_date) < MONTH(v_today))) OR
       (v_reset_type = 'Yearly' AND YEAR(v_last_reset_date) < YEAR(v_today)) THEN
        SET v_current_number = 0;
    END IF;
    
    -- 递增序号
    SET v_current_number = v_current_number + 1;
    
    -- 格式化日期
    CASE v_date_format
        WHEN 'YYYYMMDD' THEN SET v_formatted_date = DATE_FORMAT(v_today, '%Y%m%d');
        WHEN 'YYMMDD' THEN SET v_formatted_date = DATE_FORMAT(v_today, '%y%m%d');
        WHEN 'YYYYMM' THEN SET v_formatted_date = DATE_FORMAT(v_today, '%Y%m');
        WHEN 'YYMM' THEN SET v_formatted_date = DATE_FORMAT(v_today, '%y%m');
        ELSE SET v_formatted_date = DATE_FORMAT(v_today, '%Y%m%d');
    END CASE;
    
    -- 补零
    SET v_padded_number = LPAD(v_current_number, v_number_length, '0');
    
    -- 生成最终编号
    SET p_document_number = CONCAT(v_prefix, v_formatted_date, v_padded_number);
    
    -- 更新序列表
    UPDATE numbersequence 
    SET CurrentNumber = v_current_number,
        LastResetDate = v_today,
        UpdatedAt = NOW()
    WHERE SequenceType = p_sequence_type;
END//

-- 2. 库存查询存储过程
DROP PROCEDURE IF EXISTS sp_get_inventory_by_item//
CREATE PROCEDURE sp_get_inventory_by_item(
    IN p_item_type VARCHAR(20),     -- 物料类型
    IN p_item_id INT,               -- 物料ID
    IN p_warehouse_id INT           -- 仓库ID（可选）
)
BEGIN
    SELECT 
        i.InventoryID,
        i.ItemType,
        i.ItemID,
        CASE 
            WHEN i.ItemType = 'RawMaterial' THEN rm.MaterialName
            WHEN i.ItemType = 'FinishedProduct' THEN fp.ProductName
        END AS ItemName,
        i.LocationID,
        l.LocationName,
        w.WarehouseName,
        i.BatchNumber,
        i.CurrentQuantity,
        i.AvailableQuantity,
        i.ReservedQuantity,
        i.UnitCost,
        i.ProductionDate,
        i.ExpiryDate,
        i.LastInboundDate,
        i.LastOutboundDate,
        -- 库存状态判断
        CASE 
            WHEN i.ExpiryDate IS NOT NULL AND i.ExpiryDate < CURDATE() THEN 'Expired'
            WHEN i.CurrentQuantity <= 0 THEN 'OutOfStock'
            WHEN (i.ItemType = 'RawMaterial' AND i.CurrentQuantity <= rm.MinStock) OR
                 (i.ItemType = 'FinishedProduct' AND i.CurrentQuantity <= fp.MinStock) THEN 'LowStock'
            ELSE 'Normal'
        END AS StockStatus
    FROM inventory i
    LEFT JOIN location l ON i.LocationID = l.LocationID
    LEFT JOIN warehouse w ON l.WarehouseID = w.WarehouseID
    LEFT JOIN rawmaterial rm ON i.ItemType = 'RawMaterial' AND i.ItemID = rm.MaterialID
    LEFT JOIN finishedproduct fp ON i.ItemType = 'FinishedProduct' AND i.ItemID = fp.ProductID
    WHERE i.ItemType = p_item_type 
      AND i.ItemID = p_item_id
      AND (p_warehouse_id IS NULL OR w.WarehouseID = p_warehouse_id)
      AND i.CurrentQuantity > 0
    ORDER BY i.LocationID, i.BatchNumber;
END//

-- 3. 库存转移存储过程
DROP PROCEDURE IF EXISTS sp_transfer_inventory//
CREATE PROCEDURE sp_transfer_inventory(
    IN p_from_inventory_id INT,     -- 源库存ID
    IN p_to_location_id VARCHAR(30), -- 目标库位ID
    IN p_transfer_qty DECIMAL(18,3), -- 转移数量
    IN p_operator_user_id INT,       -- 操作人员ID
    IN p_remarks VARCHAR(300),       -- 备注
    OUT p_result_code INT,           -- 结果代码：0-成功，1-失败
    OUT p_result_message VARCHAR(500) -- 结果消息
)
BEGIN
    DECLARE v_current_qty DECIMAL(18,3);
    DECLARE v_available_qty DECIMAL(18,3);
    DECLARE v_item_type VARCHAR(20);
    DECLARE v_item_id INT;
    DECLARE v_batch_number VARCHAR(50);
    DECLARE v_unit_cost DECIMAL(18,4);
    DECLARE v_production_date DATE;
    DECLARE v_expiry_date DATE;
    DECLARE v_from_location_id VARCHAR(30);
    DECLARE v_to_inventory_id INT;
    DECLARE v_target_warehouse_id INT;
    DECLARE v_location_capacity DECIMAL(18,2);
    DECLARE v_location_occupancy DECIMAL(18,2);
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = 0;
        SET p_result_message = CONCAT('盘点处理完成，共处理 ', v_processed_count, ' 条差异记录');
        COMMIT;
    END IF;
END//

-- 5. 批量创建库位存储过程
DROP PROCEDURE IF EXISTS sp_batch_create_locations//
CREATE PROCEDURE sp_batch_create_locations(
    IN p_warehouse_id INT,          -- 仓库ID
    IN p_zone_prefix VARCHAR(10),   -- 区域前缀
    IN p_row_count INT,             -- 行数
    IN p_col_count INT,             -- 列数
    IN p_level_count INT,           -- 层数
    IN p_location_type VARCHAR(20), -- 库位类型
    IN p_capacity DECIMAL(18,2),    -- 每个库位容量
    OUT p_result_code INT,          -- 结果代码
    OUT p_result_message VARCHAR(500) -- 结果消息
)
BEGIN
    DECLARE v_warehouse_code VARCHAR(20);
    DECLARE v_row_num INT DEFAULT 1;
    DECLARE v_col_num INT DEFAULT 1;
    DECLARE v_level_num INT DEFAULT 1;
    DECLARE v_location_id VARCHAR(30);
    DECLARE v_location_name VARCHAR(50);
    DECLARE v_created_count INT DEFAULT 0;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = 1;
        SET p_result_message = '批量创建库位过程中发生错误';
    END;
    
    START TRANSACTION;
    
    -- 获取仓库编码
    SELECT WarehouseCode INTO v_warehouse_code
    FROM warehouse
    WHERE WarehouseID = p_warehouse_id;
    
    IF v_warehouse_code IS NULL THEN
        SET p_result_code = 1;
        SET p_result_message = '仓库不存在';
        ROLLBACK;
    ELSE
        -- 循环创建库位
        WHILE v_row_num <= p_row_count DO
            SET v_col_num = 1;
            WHILE v_col_num <= p_col_count DO
                SET v_level_num = 1;
                WHILE v_level_num <= p_level_count DO
                    -- 生成库位ID和名称
                    SET v_location_id = CONCAT(
                        v_warehouse_code, '-', 
                        p_zone_prefix, LPAD(v_row_num, 2, '0'), '-',
                        'R', LPAD(v_row_num, 2, '0'), '-',
                        'C', LPAD(v_col_num, 2, '0'), '-',
                        'L', LPAD(v_level_num, 2, '0')
                    );
                    
                    SET v_location_name = CONCAT(
                        p_zone_prefix, '区',
                        LPAD(v_row_num, 2, '0'), '排',
                        LPAD(v_col_num, 2, '0'), '列',
                        LPAD(v_level_num, 2, '0'), '层'
                    );
                    
                    -- 插入库位记录
                    INSERT INTO location (
                        LocationID, WarehouseID, LocationName, LocationType,
                        Zone, Row, Col, Level, Capacity, CurrentOccupancy, IsOccupied, Status
                    ) VALUES (
                        v_location_id, p_warehouse_id, v_location_name, p_location_type,
                        p_zone_prefix, LPAD(v_row_num, 2, '0'), LPAD(v_col_num, 2, '0'), 
                        LPAD(v_level_num, 2, '0'), p_capacity, 0, 0, 1
                    );
                    
                    SET v_created_count = v_created_count + 1;
                    SET v_level_num = v_level_num + 1;
                END WHILE;
                SET v_col_num = v_col_num + 1;
            END WHILE;
            SET v_row_num = v_row_num + 1;
        END WHILE;
        
        SET p_result_code = 0;
        SET p_result_message = CONCAT('成功创建 ', v_created_count, ' 个库位');
        COMMIT;
    END IF;
END//

-- 6. 获取低库存报告存储过程
DROP PROCEDURE IF EXISTS sp_get_low_stock_report//
CREATE PROCEDURE sp_get_low_stock_report(
    IN p_warehouse_id INT,          -- 仓库ID（可选）
    IN p_item_type VARCHAR(20)      -- 物料类型（可选）
)
BEGIN
    SELECT 
        i.ItemType,
        i.ItemID,
        CASE 
            WHEN i.ItemType = 'RawMaterial' THEN rm.MaterialCode
            WHEN i.ItemType = 'FinishedProduct' THEN fp.ProductCode
        END AS ItemCode,
        CASE 
            WHEN i.ItemType = 'RawMaterial' THEN rm.MaterialName
            WHEN i.ItemType = 'FinishedProduct' THEN fp.ProductName
        END AS ItemName,
        CASE 
            WHEN i.ItemType = 'RawMaterial' THEN rm.Unit
            WHEN i.ItemType = 'FinishedProduct' THEN fp.Unit
        END AS Unit,
        w.WarehouseName,
        SUM(i.CurrentQuantity) AS TotalCurrentStock,
        SUM(i.AvailableQuantity) AS TotalAvailableStock,
        CASE 
            WHEN i.ItemType = 'RawMaterial' THEN rm.MinStock
            WHEN i.ItemType = 'FinishedProduct' THEN fp.MinStock
        END AS MinStock,
        CASE 
            WHEN i.ItemType = 'RawMaterial' THEN rm.MaxStock
            WHEN i.ItemType = 'FinishedProduct' THEN fp.MaxStock
        END AS MaxStock,
        CASE 
            WHEN SUM(i.CurrentQuantity) <= 0 THEN '零库存'
            WHEN (i.ItemType = 'RawMaterial' AND SUM(i.CurrentQuantity) < rm.MinStock) OR
                 (i.ItemType = 'FinishedProduct' AND SUM(i.CurrentQuantity) < fp.MinStock) THEN '低库存'
            ELSE '正常'
        END AS StockStatus,
        -- 计算库存周转天数（简化计算）
        CASE 
            WHEN SUM(i.CurrentQuantity) > 0 THEN
                ROUND(SUM(i.CurrentQuantity) / GREATEST(
                    (SELECT COALESCE(AVG(ABS(QuantityChange)), 1) 
                     FROM inventorytransaction it 
                     WHERE it.InventoryID IN (
                         SELECT InventoryID FROM inventory 
                         WHERE ItemType = i.ItemType AND ItemID = i.ItemID
                     ) 
                     AND TransactionType = 'Outbound'
                     AND TransactionDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                    ), 1
                ), 1)
            ELSE 0
        END AS EstimatedDaysLeft
    FROM inventory i
    LEFT JOIN location l ON i.LocationID = l.LocationID
    LEFT JOIN warehouse w ON l.WarehouseID = w.WarehouseID
    LEFT JOIN rawmaterial rm ON i.ItemType = 'RawMaterial' AND i.ItemID = rm.MaterialID
    LEFT JOIN finishedproduct fp ON i.ItemType = 'FinishedProduct' AND i.ItemID = fp.ProductID
    WHERE (p_warehouse_id IS NULL OR w.WarehouseID = p_warehouse_id)
      AND (p_item_type IS NULL OR i.ItemType = p_item_type)
      AND (
          (i.ItemType = 'RawMaterial' AND i.CurrentQuantity <= rm.MinStock) OR
          (i.ItemType = 'FinishedProduct' AND i.CurrentQuantity <= fp.MinStock)
      )
    GROUP BY i.ItemType, i.ItemID, w.WarehouseID
    ORDER BY StockStatus DESC, TotalCurrentStock ASC;
END//

-- 7. 自动分配库位存储过程
DROP PROCEDURE IF EXISTS sp_auto_assign_location//
CREATE PROCEDURE sp_auto_assign_location(
    IN p_warehouse_id INT,          -- 仓库ID
    IN p_item_type VARCHAR(20),     -- 物料类型
    IN p_required_quantity DECIMAL(18,3), -- 需要的容量
    OUT p_location_id VARCHAR(30),  -- 分配的库位ID
    OUT p_result_code INT,          -- 结果代码
    OUT p_result_message VARCHAR(500) -- 结果消息
)
BEGIN
    DECLARE v_location_type VARCHAR(20);
    DECLARE v_available_capacity DECIMAL(18,2);
    
    -- 根据物料类型确定库位类型
    CASE p_item_type
        WHEN 'RawMaterial' THEN SET v_location_type = 'Raw';
        WHEN 'FinishedProduct' THEN SET v_location_type = 'Finished';
        ELSE SET v_location_type = 'Normal';
    END CASE;
    
    -- 查找合适的库位（优先选择已有库存的库位，其次选择空库位）
    SELECT l.LocationID
    INTO p_location_id
    FROM location l
    WHERE l.WarehouseID = p_warehouse_id
      AND l.LocationType = v_location_type
      AND l.Status = 1
      AND (l.Capacity - l.CurrentOccupancy) >= p_required_quantity
    ORDER BY 
        -- 优先级：已有相同类型物料的库位 > 空库位 > 其他
        CASE WHEN l.IsOccupied = 1 THEN 1 ELSE 0 END DESC,
        -- 选择剩余容量最小但足够的库位（提高空间利用率）
        (l.Capacity - l.CurrentOccupancy) ASC
    LIMIT 1;
    
    IF p_location_id IS NOT NULL THEN
        SET p_result_code = 0;
        SET p_result_message = CONCAT('成功分配库位: ', p_location_id);
    ELSE
        SET p_result_code = 1;
        SET p_result_message = '没有找到合适的库位';
    END IF;
END//

-- 8. 库存预留/释放存储过程
DROP PROCEDURE IF EXISTS sp_reserve_inventory//
CREATE PROCEDURE sp_reserve_inventory(
    IN p_item_type VARCHAR(20),     -- 物料类型
    IN p_item_id INT,               -- 物料ID
    IN p_reserve_quantity DECIMAL(18,3), -- 预留数量（负数表示释放）
    IN p_reference_type VARCHAR(30), -- 关联单据类型
    IN p_reference_id INT,          -- 关联单据ID
    IN p_operator_user_id INT,      -- 操作人员ID
    OUT p_result_code INT,          -- 结果代码
    OUT p_result_message VARCHAR(500) -- 结果消息
)
BEGIN
    DECLARE v_total_available DECIMAL(18,3);
    DECLARE v_processed_quantity DECIMAL(18,3) DEFAULT 0;
    DECLARE v_inventory_id INT;
    DECLARE v_available_qty DECIMAL(18,3);
    DECLARE v_location_id VARCHAR(30);
    DECLARE v_batch_number VARCHAR(50);
    DECLARE v_reserve_qty DECIMAL(18,3);
    
    DECLARE done INT DEFAULT FALSE;
    DECLARE inventory_cursor CURSOR FOR
        SELECT InventoryID, AvailableQuantity, LocationID, BatchNumber
        FROM inventory
        WHERE ItemType = p_item_type 
          AND ItemID = p_item_id
          AND AvailableQuantity > 0
        ORDER BY 
            -- 优先使用即将过期的库存（FIFO）
            CASE WHEN ExpiryDate IS NOT NULL THEN ExpiryDate ELSE '9999-12-31' END ASC,
            ProductionDate ASC,
            BatchNumber ASC;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = 1;
        SET p_result_message = '库存预留过程中发生错误';
    END;
    
    START TRANSACTION;
    
    IF p_reserve_quantity > 0 THEN
        -- 预留库存
        SELECT SUM(AvailableQuantity) INTO v_total_available
        FROM inventory
        WHERE ItemType = p_item_type AND ItemID = p_item_id;
        
        IF v_total_available < p_reserve_quantity THEN
            SET p_result_code = 1;
            SET p_result_message = CONCAT('可用库存不足，需要: ', p_reserve_quantity, '，可用: ', COALESCE(v_total_available, 0));
            ROLLBACK;
        ELSE
            OPEN inventory_cursor;
            
            reserve_loop: LOOP
                FETCH inventory_cursor INTO v_inventory_id, v_available_qty, v_location_id, v_batch_number;
                
                IF done OR v_processed_quantity >= p_reserve_quantity THEN
                    LEAVE reserve_loop;
                END IF;
                
                -- 计算本次预留数量
                SET v_reserve_qty = LEAST(v_available_qty, p_reserve_quantity - v_processed_quantity);
                
                -- 更新库存
                UPDATE inventory 
                SET AvailableQuantity = AvailableQuantity - v_reserve_qty,
                    ReservedQuantity = ReservedQuantity + v_reserve_qty,
                    UpdatedAt = NOW()
                WHERE InventoryID = v_inventory_id;
                
                -- 记录库存变动
                INSERT INTO inventorytransaction (
                    InventoryID, TransactionType, ReferenceType, ReferenceID,
                    QuantityBefore, QuantityChange, QuantityAfter,
                    TransactionDate, OperatorUserID, Remarks
                ) VALUES (
                    v_inventory_id, 'Reserve', p_reference_type, p_reference_id,
                    v_available_qty, -v_reserve_qty, v_available_qty - v_reserve_qty,
                    NOW(), p_operator_user_id, 
                    CONCAT('预留库存 ', v_reserve_qty, ' (', v_location_id, ', ', v_batch_number, ')')
                );
                
                SET v_processed_quantity = v_processed_quantity + v_reserve_qty;
            END LOOP;
            
            CLOSE inventory_cursor;
            
            SET p_result_code = 0;
            SET p_result_message = CONCAT('成功预留库存: ', v_processed_quantity);
            COMMIT;
        END IF;
    ELSE
        -- 释放预留库存
        SET p_reserve_quantity = ABS(p_reserve_quantity);
        
        UPDATE inventory 
        SET AvailableQuantity = AvailableQuantity + LEAST(ReservedQuantity, p_reserve_quantity),
            ReservedQuantity = ReservedQuantity - LEAST(ReservedQuantity, p_reserve_quantity),
            UpdatedAt = NOW()
        WHERE ItemType = p_item_type 
          AND ItemID = p_item_id
          AND ReservedQuantity > 0;
        
        SET p_result_code = 0;
        SET p_result_message = CONCAT('成功释放预留库存: ', p_reserve_quantity);
        COMMIT;
    END IF;
END//

-- 9. 获取库存周转分析存储过程
DROP PROCEDURE IF EXISTS sp_get_inventory_turnover_analysis//
CREATE PROCEDURE sp_get_inventory_turnover_analysis(
    IN p_start_date DATE,           -- 开始日期
    IN p_end_date DATE,             -- 结束日期
    IN p_warehouse_id INT,          -- 仓库ID（可选）
    IN p_item_type VARCHAR(20)      -- 物料类型（可选）
)
BEGIN
    SELECT 
        i.ItemType,
        i.ItemID,
        CASE 
            WHEN i.ItemType = 'RawMaterial' THEN rm.MaterialCode
            WHEN i.ItemType = 'FinishedProduct' THEN fp.ProductCode
        END AS ItemCode,
        CASE 
            WHEN i.ItemType = 'RawMaterial' THEN rm.MaterialName
            WHEN i.ItemType = 'FinishedProduct' THEN fp.ProductName
        END AS ItemName,
        w.WarehouseName,
        
        -- 期初库存
        COALESCE((
            SELECT SUM(QuantityAfter - QuantityChange) 
            FROM inventorytransaction it2
            WHERE it2.InventoryID = i.InventoryID 
              AND DATE(it2.TransactionDate) < p_start_date
            ORDER BY it2.TransactionDate DESC
            LIMIT 1
        ), 0) AS BeginningStock,
        
        -- 期末库存
        i.CurrentQuantity AS EndingStock,
        
        -- 期间入库总量
        COALESCE((
            SELECT SUM(ABS(it.QuantityChange))
            FROM inventorytransaction it
            WHERE it.InventoryID = i.InventoryID
              AND it.TransactionType = 'Inbound'
              AND DATE(it.TransactionDate) BETWEEN p_start_date AND p_end_date
        ), 0) AS TotalInbound,
        
        -- 期间出库总量
        COALESCE((
            SELECT SUM(ABS(it.QuantityChange))
            FROM inventorytransaction it
            WHERE it.InventoryID = i.InventoryID
              AND it.TransactionType = 'Outbound'
              AND DATE(it.TransactionDate) BETWEEN p_start_date AND p_end_date
        ), 0) AS TotalOutbound,
        
        -- 平均库存
        (COALESCE((
            SELECT SUM(QuantityAfter - QuantityChange) 
            FROM inventorytransaction it2
            WHERE it2.InventoryID = i.InventoryID 
              AND DATE(it2.TransactionDate) < p_start_date
            ORDER BY it2.TransactionDate DESC
            LIMIT 1
        ), 0) + i.CurrentQuantity) / 2 AS AvgStock,
        
        -- 库存周转率
        CASE 
            WHEN (COALESCE((
                SELECT SUM(QuantityAfter - QuantityChange) 
                FROM inventorytransaction it2
                WHERE it2.InventoryID = i.InventoryID 
                  AND DATE(it2.TransactionDate) < p_start_date
                ORDER BY it2.TransactionDate DESC
                LIMIT 1
            ), 0) + i.CurrentQuantity) / 2 > 0 THEN
                COALESCE((
                    SELECT SUM(ABS(it.QuantityChange))
                    FROM inventorytransaction it
                    WHERE it.InventoryID = i.InventoryID
                      AND it.TransactionType = 'Outbound'
                      AND DATE(it.TransactionDate) BETWEEN p_start_date AND p_end_date
                ), 0) / ((COALESCE((
                    SELECT SUM(QuantityAfter - QuantityChange) 
                    FROM inventorytransaction it2
                    WHERE it2.InventoryID = i.InventoryID 
                      AND DATE(it2.TransactionDate) < p_start_date
                    ORDER BY it2.TransactionDate DESC
                    LIMIT 1
                ), 0) + i.CurrentQuantity) / 2)
            ELSE 0
        END AS TurnoverRate,
        
        -- 周转天数
        CASE 
            WHEN COALESCE((
                SELECT SUM(ABS(it.QuantityChange))
                FROM inventorytransaction it
                WHERE it.InventoryID = i.InventoryID
                  AND it.TransactionType = 'Outbound'
                  AND DATE(it.TransactionDate) BETWEEN p_start_date AND p_end_date
            ), 0) > 0 THEN
                DATEDIFF(p_end_date, p_start_date) * ((COALESCE((
                    SELECT SUM(QuantityAfter - QuantityChange) 
                    FROM inventorytransaction it2
                    WHERE it2.InventoryID = i.InventoryID 
                      AND DATE(it2.TransactionDate) < p_start_date
                    ORDER BY it2.TransactionDate DESC
                    LIMIT 1
                ), 0) + i.CurrentQuantity) / 2) / COALESCE((
                    SELECT SUM(ABS(it.QuantityChange))
                    FROM inventorytransaction it
                    WHERE it.InventoryID = i.InventoryID
                      AND it.TransactionType = 'Outbound'
                      AND DATE(it.TransactionDate) BETWEEN p_start_date AND p_end_date
                ), 1)
            ELSE 99999
        END AS TurnoverDays
        
    FROM inventory i
    LEFT JOIN location l ON i.LocationID = l.LocationID  
    LEFT JOIN warehouse w ON l.WarehouseID = w.WarehouseID
    LEFT JOIN rawmaterial rm ON i.ItemType = 'RawMaterial' AND i.ItemID = rm.MaterialID
    LEFT JOIN finishedproduct fp ON i.ItemType = 'FinishedProduct' AND i.ItemID = fp.ProductID
    WHERE (p_warehouse_id IS NULL OR w.WarehouseID = p_warehouse_id)
      AND (p_item_type IS NULL OR i.ItemType = p_item_type)
      AND i.CurrentQuantity > 0
    ORDER BY TurnoverRate DESC, i.ItemType, i.ItemID;
END//

-- 10. 清理过期数据存储过程
DROP PROCEDURE IF EXISTS sp_cleanup_expired_data//
CREATE PROCEDURE sp_cleanup_expired_data(
    IN p_days_to_keep INT,          -- 保留天数
    OUT p_result_code INT,          -- 结果代码
    OUT p_result_message VARCHAR(500) -- 结果消息
)
BEGIN
    DECLARE v_deleted_logs INT DEFAULT 0;
    DECLARE v_deleted_transactions INT DEFAULT 0;
    DECLARE v_cutoff_date DATE;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = 1;
        SET p_result_message = '清理过程中发生错误';
    END;
    
    START TRANSACTION;
    
    -- 计算截止日期
    SET v_cutoff_date = DATE_SUB(CURDATE(), INTERVAL p_days_to_keep DAY);
    
    -- 清理操作日志
    DELETE FROM operationlog 
    WHERE OperationTime < v_cutoff_date;
    SET v_deleted_logs = ROW_COUNT();
    
    -- 清理库存变动记录（保留重要的入库、出库记录，只清理查询等操作）
    DELETE FROM inventorytransaction 
    WHERE TransactionDate < v_cutoff_date
      AND TransactionType NOT IN ('Inbound', 'Outbound', 'Adjust');
    SET v_deleted_transactions = ROW_COUNT();
    
    SET p_result_code = 0;
    SET p_result_message = CONCAT(
        '清理完成 - 删除操作日志: ', v_deleted_logs, 
        ' 条，删除库存变动记录: ', v_deleted_transactions, ' 条'
    );
    COMMIT;
END//

-- 恢复默认分隔符
DELIMITER ;

-- ====================================
-- 创建定时任务（需要开启事件调度器）
-- ====================================

-- 开启事件调度器
-- SET GLOBAL event_scheduler = ON;

-- 创建每日自动清理过期数据的事件
/*
DROP EVENT IF EXISTS evt_daily_cleanup;
CREATE EVENT evt_daily_cleanup
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURRENT_DATE + INTERVAL 1 DAY, '02:00:00')
DO
BEGIN
    DECLARE v_result_code INT;
    DECLARE v_result_message VARCHAR(500);
    
    CALL sp_cleanup_expired_data(90, v_result_code, v_result_message);
    
    INSERT INTO operationlog (
        OperationType, ModuleName, FunctionName, ResponseResult, Status, OperationTime
    ) VALUES (
        'Maintenance', 'System', '自动清理过期数据', v_result_message, 
        IF(v_result_code = 0, 'Success', 'Failed'), NOW()
    );
END;
*/

-- ====================================
-- 使用示例和测试
-- ====================================

/*
-- 1. 生成单据编号示例
CALL sp_generate_document_number('RawInbound', @doc_number);
SELECT @doc_number AS '生成的入库单号';

-- 2. 查询库存示例
CALL sp_get_inventory_by_item('RawMaterial', 1, NULL);

-- 3. 库存转移示例
CALL sp_transfer_inventory(1, 'WH001-A01-R01-C01-L02', 100, 1, '库存调拨测试', @result_code, @result_msg);
SELECT @result_code AS '结果代码', @result_msg AS '结果消息';

-- 4. 自动分配库位示例  
CALL sp_auto_assign_location(1, 'RawMaterial', 500, @location_id, @result_code, @result_msg);
SELECT @location_id AS '分配的库位', @result_code AS '结果代码', @result_msg AS '结果消息';

-- 5. 库存预留示例
CALL sp_reserve_inventory('RawMaterial', 1, 50, 'ProductionOrder', 1001, 1, @result_code, @result_msg);
SELECT @result_code AS '结果代码', @result_msg AS '结果消息';

-- 6. 获取低库存报告
CALL sp_get_low_stock_report(NULL, NULL);

-- 7. 库存周转分析
CALL sp_get_inventory_turnover_analysis('2025-01-01', '2025-06-21', NULL, NULL);

-- 8. 批量创建库位示例
CALL sp_batch_create_locations(1, 'D', 3, 3, 2, 'Raw', 1000.00, @result_code, @result_msg);
SELECT @result_code AS '结果代码', @result_msg AS '结果消息';

-- 9. 清理过期数据示例
CALL sp_cleanup_expired_data(30, @result_code, @result_msg);
SELECT @result_code AS '结果代码', @result_msg AS '结果消息';
*/ = 1;
        SET p_result_message = '转移过程中发生错误';
    END;
    
    START TRANSACTION;
    
    -- 获取源库存信息
    SELECT CurrentQuantity, AvailableQuantity, ItemType, ItemID, 
           LocationID, BatchNumber, UnitCost, ProductionDate, ExpiryDate
    INTO v_current_qty, v_available_qty, v_item_type, v_item_id,
         v_from_location_id, v_batch_number, v_unit_cost, v_production_date, v_expiry_date
    FROM inventory
    WHERE InventoryID = p_from_inventory_id;
    
    -- 检查库存是否足够
    IF v_available_qty < p_transfer_qty THEN
        SET p_result_code = 1;
        SET p_result_message = '可用库存不足';
        ROLLBACK;
    ELSE
        -- 检查目标库位容量
        SELECT l.WarehouseID, l.Capacity, l.CurrentOccupancy
        INTO v_target_warehouse_id, v_location_capacity, v_location_occupancy
        FROM location l
        WHERE l.LocationID = p_to_location_id;
        
        IF (v_location_capacity - v_location_occupancy) < p_transfer_qty THEN
            SET p_result_code = 1;
            SET p_result_message = '目标库位容量不足';
            ROLLBACK;
        ELSE
            -- 减少源库存
            UPDATE inventory 
            SET CurrentQuantity = CurrentQuantity - p_transfer_qty,
                AvailableQuantity = AvailableQuantity - p_transfer_qty,
                UpdatedAt = NOW()
            WHERE InventoryID = p_from_inventory_id;
            
            -- 检查目标库位是否已有相同物料和批次
            SELECT InventoryID INTO v_to_inventory_id
            FROM inventory
            WHERE ItemType = v_item_type 
              AND ItemID = v_item_id
              AND LocationID = p_to_location_id
              AND BatchNumber = v_batch_number;
            
            -- 如果目标库位已有相同库存，则合并
            IF v_to_inventory_id IS NOT NULL THEN
                UPDATE inventory 
                SET CurrentQuantity = CurrentQuantity + p_transfer_qty,
                    AvailableQuantity = AvailableQuantity + p_transfer_qty,
                    UpdatedAt = NOW()
                WHERE InventoryID = v_to_inventory_id;
            ELSE
                -- 创建新的库存记录
                INSERT INTO inventory (
                    ItemType, ItemID, LocationID, BatchNumber,
                    CurrentQuantity, AvailableQuantity, UnitCost,
                    ProductionDate, ExpiryDate
                ) VALUES (
                    v_item_type, v_item_id, p_to_location_id, v_batch_number,
                    p_transfer_qty, p_transfer_qty, v_unit_cost,
                    v_production_date, v_expiry_date
                );
                SET v_to_inventory_id = LAST_INSERT_ID();
            END IF;
            
            -- 记录源库存变动
            INSERT INTO inventorytransaction (
                InventoryID, TransactionType, QuantityBefore, QuantityChange, QuantityAfter,
                UnitCost, TransactionDate, OperatorUserID, Remarks
            ) VALUES (
                p_from_inventory_id, 'Transfer', v_current_qty, -p_transfer_qty, 
                v_current_qty - p_transfer_qty, v_unit_cost, NOW(), 
                p_operator_user_id, CONCAT('转移至 ', p_to_location_id, ' - ', p_remarks)
            );
            
            -- 记录目标库存变动
            INSERT INTO inventorytransaction (
                InventoryID, TransactionType, QuantityBefore, QuantityChange, QuantityAfter,
                UnitCost, TransactionDate, OperatorUserID, Remarks
            ) VALUES (
                v_to_inventory_id, 'Transfer', 
                (SELECT CurrentQuantity - p_transfer_qty FROM inventory WHERE InventoryID = v_to_inventory_id),
                p_transfer_qty,
                (SELECT CurrentQuantity FROM inventory WHERE InventoryID = v_to_inventory_id),
                v_unit_cost, NOW(), p_operator_user_id, 
                CONCAT('从 ', v_from_location_id, ' 转入 - ', p_remarks)
            );
            
            -- 更新库位占用量
            UPDATE location 
            SET CurrentOccupancy = CurrentOccupancy - p_transfer_qty,
                IsOccupied = IF(CurrentOccupancy - p_transfer_qty > 0, 1, 0),
                UpdatedAt = NOW()
            WHERE LocationID = v_from_location_id;
            
            UPDATE location 
            SET CurrentOccupancy = CurrentOccupancy + p_transfer_qty,
                IsOccupied = 1,
                UpdatedAt = NOW()
            WHERE LocationID = p_to_location_id;
            
            SET p_result_code = 0;
            SET p_result_message = '库存转移成功';
            COMMIT;
        END IF;
    END IF;
END//

-- 4. 库存盘点处理存储过程
DROP PROCEDURE IF EXISTS sp_process_stocktaking//
CREATE PROCEDURE sp_process_stocktaking(
    IN p_stocktaking_id INT,        -- 盘点单ID
    IN p_operator_user_id INT,      -- 操作人员ID
    OUT p_result_code INT,          -- 结果代码
    OUT p_result_message VARCHAR(500) -- 结果消息
)
BEGIN
    DECLARE v_stocktaking_status VARCHAR(20);
    DECLARE v_detail_count INT;
    DECLARE v_processed_count INT DEFAULT 0;
    
    DECLARE v_detail_id INT;
    DECLARE v_inventory_id INT;
    DECLARE v_item_type VARCHAR(20);
    DECLARE v_item_id INT;
    DECLARE v_location_id VARCHAR(30);
    DECLARE v_batch_number VARCHAR(50);
    DECLARE v_system_qty DECIMAL(18,3);
    DECLARE v_actual_qty DECIMAL(18,3);
    DECLARE v_difference_qty DECIMAL(18,3);
    DECLARE v_unit_cost DECIMAL(18,4);
    
    DECLARE done INT DEFAULT FALSE;
    DECLARE stocktaking_cursor CURSOR FOR
        SELECT DetailID, ItemType, ItemID, LocationID, BatchNumber,
               SystemQuantity, ActualQuantity, DifferenceQuantity, UnitCost
        FROM stocktakingdetail
        WHERE StocktakingID = p_stocktaking_id
          AND ABS(DifferenceQuantity) > 0;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = 1;
        SET p_result_message = '盘点处理过程中发生错误';
    END;
    
    START TRANSACTION;
    
    -- 检查盘点单状态
    SELECT Status INTO v_stocktaking_status
    FROM stocktaking
    WHERE StocktakingID = p_stocktaking_id;
    
    IF v_stocktaking_status != 'Completed' THEN
        SET p_result_code = 1;
        SET p_result_message = '盘点单状态不正确，只能处理已完成的盘点单';
        ROLLBACK;
    ELSE
        -- 获取有差异的盘点明细数量
        SELECT COUNT(*) INTO v_detail_count
        FROM stocktakingdetail
        WHERE StocktakingID = p_stocktaking_id
          AND ABS(DifferenceQuantity) > 0;
        
        -- 处理每个有差异的盘点明细
        OPEN stocktaking_cursor;
        
        stocktaking_loop: LOOP
            FETCH stocktaking_cursor INTO v_detail_id, v_item_type, v_item_id, 
                  v_location_id, v_batch_number, v_system_qty, v_actual_qty, 
                  v_difference_qty, v_unit_cost;
            
            IF done THEN
                LEAVE stocktaking_loop;
            END IF;
            
            -- 查找对应的库存记录
            SELECT InventoryID INTO v_inventory_id
            FROM inventory
            WHERE ItemType = v_item_type
              AND ItemID = v_item_id
              AND LocationID = v_location_id
              AND BatchNumber = v_batch_number;
            
            -- 如果找到库存记录，调整库存
            IF v_inventory_id IS NOT NULL THEN
                UPDATE inventory 
                SET CurrentQuantity = v_actual_qty,
                    AvailableQuantity = v_actual_qty,
                    UpdatedAt = NOW()
                WHERE InventoryID = v_inventory_id;
                
                -- 记录库存调整事务
                INSERT INTO inventorytransaction (
                    InventoryID, TransactionType, ReferenceType, ReferenceID,
                    QuantityBefore, QuantityChange, QuantityAfter, UnitCost,
                    TransactionDate, OperatorUserID, Remarks
                ) VALUES (
                    v_inventory_id, 'Adjust', 'Stocktaking', p_stocktaking_id,
                    v_system_qty, v_difference_qty, v_actual_qty, v_unit_cost,
                    NOW(), p_operator_user_id, 
                    CONCAT('盘点调整 - 盘点单号: ', 
                           (SELECT StocktakingNumber FROM stocktaking WHERE StocktakingID = p_stocktaking_id))
                );
                
                -- 更新库位占用量
                UPDATE location 
                SET CurrentOccupancy = CurrentOccupancy + v_difference_qty,
                    IsOccupied = IF(CurrentOccupancy + v_difference_qty > 0, 1, 0),
                    UpdatedAt = NOW()
                WHERE LocationID = v_location_id;
                
                SET v_processed_count = v_processed_count + 1;
            END IF;
        END LOOP;
        
        CLOSE stocktaking_cursor;
        
        SET p_result_code = 0;
        SET p_result_message = CONCAT('成功处理了 ', v_processed_count, ' 条盘点明细');
    END IF;

    COMMIT;
END//
DELIMITER ;
