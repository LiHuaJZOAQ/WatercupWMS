const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { createResponse, successResponse, errorResponse, formatDateTime, validateRequired, executeQuery, executeTransaction } = require('../utils');
const moment = require('moment');
const ExcelJS = require('exceljs');

// ====================================
// 入库接口 - 完整版本
// ====================================

// 1. 获取筛选选项
router.get('/inbound-orders/options',  async (req, res) => {
  try {
    console.log('获取筛选选项 - 开始');
    
    // 并行查询所有选项数据
    const [
      suppliers,
      manufacturers,
      warehouses,
      materials,
      materialCodes,
      batchNumbers,
      inboundNumbers
    ] = await Promise.all([
      // 供应商列表
      executeQuery(`
        SELECT SupplierCode as value, SupplierName as label 
        FROM Supplier 
        WHERE Status = 1 
        ORDER BY SupplierName
      `),
      
      // 生产商（加工厂）列表  
      executeQuery(`
        SELECT FactoryCode as value, FactoryName as label 
        FROM ProcessingFactory 
        WHERE Status = 1 
        ORDER BY FactoryName
      `),
      
      // 仓库列表
      executeQuery(`
        SELECT WarehouseCode as value, WarehouseName as label 
        FROM Warehouse 
        WHERE Status = 1 
        ORDER BY WarehouseName
      `),
      
      // 原材料名称列表
      executeQuery(`
        SELECT MaterialCode as value, MaterialName as label 
        FROM RawMaterial 
        WHERE Status = 1 
        ORDER BY MaterialName
      `),
      
      // 原材料编号列表
      executeQuery(`
        SELECT DISTINCT MaterialCode as value, MaterialCode as label 
        FROM RawMaterial 
        WHERE Status = 1 
        ORDER BY MaterialCode
      `),
      
      // 批次号列表（最近100个）
      executeQuery(`
        SELECT DISTINCT BatchNumber as value, BatchNumber as label 
        FROM RawMaterialInboundDetail 
        WHERE BatchNumber IS NOT NULL AND BatchNumber != ''
        ORDER BY BatchNumber DESC 
        LIMIT 100
      `),
      
      // 入库单号列表（最近100个）
      executeQuery(`
        SELECT DISTINCT InboundNumber as value, InboundNumber as label 
        FROM RawMaterialInbound 
        ORDER BY InboundNumber DESC 
        LIMIT 100
      `)
    ]);

    const options = {
      // 订单状态选项
      orderStatus: [
        { value: "", label: "全部" },
        { value: "Draft", label: "草稿" },
        { value: "Pending", label: "待审核" },
        { value: "Completed", label: "已完成" },
        { value: "Cancelled", label: "已取消" }
      ],
      
      // 入库单号
      warehouseReceiptNos: inboundNumbers,
      
      // 来源单号（使用入库单号）
      sourceDocNos: inboundNumbers,
      
      // 原材料名称
      materialNames: materials,
      
      // 原材料编号
      materialNos: materialCodes,
      
      // 批次号
      batchNos: batchNumbers,
      
      // 仓库
      warehouses: warehouses,
      
      // 入库类型
      warehouseTypes: [
        { value: "Purchase", label: "采购入库" },
        { value: "Return", label: "退货入库" },
        { value: "Transfer", label: "调拨入库" },
        { value: "Production", label: "生产入库" },
        { value: "Other", label: "其他入库" }
      ],
      
      // 入库方式
      warehouseMethods: [
        { value: "Normal", label: "普通入库" },
        { value: "Urgent", label: "紧急入库" },
        { value: "Direct", label: "直接入库" },
        { value: "Batch", label: "批量入库" }
      ],
      
      // 供应商
      suppliers: suppliers,
      
      // 生产商
      manufacturers: manufacturers
    };

    console.log('获取筛选选项 - 成功');
    res.json(options);
    
  } catch (error) {
    console.error('获取筛选选项失败:', error);
    res.status(500).json(errorResponse('获取筛选选项失败'));
  }
});

// 2. 获取入库单列表
router.get('/inbound-orders',  async (req, res) => {
  try {
    console.log('获取入库单列表 - 参数:', req.query);
    
    const {
      page = 1,
      pageSize = 20,
      orderStatus,
      warehouseReceiptNo,
      sourceDocNo,
      materialName,
      materialNo,
      batchNo,
      warehouse,
      warehouseType,
      warehouseMethod,
      supplier,
      manufacturer,
      startDate,
      endDate
    } = req.query;

    // 参数验证
    const pageNum = parseInt(page);
    const size = parseInt(pageSize);
    if (pageNum < 1 || size < 1 || size > 1000) {
      return res.status(400).json(errorResponse('分页参数无效', 400));
    }

    // 构建查询条件
    let whereConditions = ['1 = 1'];
    let queryParams = [];

    // 状态筛选
    if (orderStatus && orderStatus.trim()) {
      whereConditions.push('ri.Status = ?');
      queryParams.push(orderStatus.trim());
    }

    // 入库单号筛选
    if (warehouseReceiptNo && warehouseReceiptNo.trim()) {
      whereConditions.push('ri.InboundNumber LIKE ?');
      queryParams.push(`%${warehouseReceiptNo.trim()}%`);
    }

    // 来源单号筛选
    if (sourceDocNo && sourceDocNo.trim()) {
      whereConditions.push('ri.InboundNumber LIKE ?');
      queryParams.push(`%${sourceDocNo.trim()}%`);
    }

    // 原材料名称筛选
    if (materialName && materialName.trim()) {
      whereConditions.push(`
        EXISTS (
          SELECT 1 FROM RawMaterialInboundDetail rid 
          JOIN RawMaterial rm ON rid.RawMaterialID = rm.MaterialID 
          WHERE rid.InboundID = ri.InboundID 
          AND rm.MaterialName LIKE ?
        )
      `);
      queryParams.push(`%${materialName.trim()}%`);
    }

    // 原材料编号筛选
    if (materialNo && materialNo.trim()) {
      whereConditions.push(`
        EXISTS (
          SELECT 1 FROM RawMaterialInboundDetail rid 
          JOIN RawMaterial rm ON rid.RawMaterialID = rm.MaterialID 
          WHERE rid.InboundID = ri.InboundID 
          AND rm.MaterialCode LIKE ?
        )
      `);
      queryParams.push(`%${materialNo.trim()}%`);
    }

    // 批次号筛选
    if (batchNo && batchNo.trim()) {
      whereConditions.push(`
        EXISTS (
          SELECT 1 FROM RawMaterialInboundDetail rid 
          WHERE rid.InboundID = ri.InboundID 
          AND rid.BatchNumber LIKE ?
        )
      `);
      queryParams.push(`%${batchNo.trim()}%`);
    }

    // 仓库筛选
    if (warehouse && warehouse.trim()) {
      whereConditions.push('w.WarehouseCode = ?');
      queryParams.push(warehouse.trim());
    }

    // 供应商筛选
    if (supplier && supplier.trim()) {
      whereConditions.push('s.SupplierCode = ?');
      queryParams.push(supplier.trim());
    }

    // 日期范围筛选
    if (startDate && startDate.trim()) {
      whereConditions.push('ri.InboundDate >= ?');
      queryParams.push(startDate.trim());
    }

    if (endDate && endDate.trim()) {
      whereConditions.push('ri.InboundDate <= ?');
      queryParams.push(endDate.trim());
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询总记录数
    const countSql = `
      SELECT COUNT(DISTINCT ri.InboundID) as total
      FROM RawMaterialInbound ri
      LEFT JOIN Supplier s ON ri.SupplierID = s.SupplierID
      LEFT JOIN Warehouse w ON ri.WarehouseID = w.WarehouseID
      WHERE ${whereClause}
    `;

    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0]?.total || 0;

    // 查询列表数据
    const offset = (pageNum - 1) * size;
    const listSql = `
      SELECT DISTINCT
        ri.InboundID as id,
        ri.InboundNumber as warehouseReceiptNo,
        COALESCE(summary.totalQuantity, 0) as receivedQuantity,
        0 as receivedGrossWeight,
        0 as receivedNetWeight,
        s.SupplierName as supplierName,
        s.SupplierName as manufacturerName,
        ri.CreatedAt as orderDate,
        ri.InboundDate as warehouseDate,
        ri.Status as status,
        w.WarehouseName as warehouseName,
        ri.TotalAmount as totalAmount,
        ri.Remarks as remarks
      FROM RawMaterialInbound ri
      LEFT JOIN Supplier s ON ri.SupplierID = s.SupplierID
      LEFT JOIN Warehouse w ON ri.WarehouseID = w.WarehouseID
      LEFT JOIN (
        SELECT 
          InboundID,
          SUM(Quantity) as totalQuantity
        FROM RawMaterialInboundDetail
        GROUP BY InboundID
      ) summary ON ri.InboundID = summary.InboundID
      WHERE ${whereClause}
      ORDER BY ri.InboundDate DESC, ri.InboundID DESC
      LIMIT ? OFFSET ?
    `;

    const listParams = [...queryParams, size, offset];
    const listResult = await executeQuery(listSql, listParams);

    // 格式化返回数据
    const list = listResult.map(item => ({
      ...item,
      orderDate: formatDateTime(item.orderDate),
      warehouseDate: formatDateTime(item.warehouseDate),
      receivedQuantity: parseFloat(item.receivedQuantity) || 0,
      totalAmount: parseFloat(item.totalAmount) || 0
    }));

    const response = {
      list: list,
      total: total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size)
    };

    console.log(`获取入库单列表 - 成功, 共${total}条记录`);
    res.json(response);

  } catch (error) {
    console.error('获取入库单列表失败:', error);
    res.status(500).json(errorResponse('获取入库单列表失败'));
  }
});

// 3. 导出入库单
router.get('/inbound-orders/export',  async (req, res) => {
  try {
    console.log('导出入库单 - 开始');
    
    // 使用与列表相同的筛选条件
    const {
      orderStatus,
      warehouseReceiptNo,
      sourceDocNo,
      materialName,
      materialNo,
      batchNo,
      warehouse,
      supplier,
      startDate,
      endDate
    } = req.query;

    // 构建查询条件（复用列表接口逻辑）
    let whereConditions = ['1 = 1'];
    let queryParams = [];

    if (orderStatus?.trim()) {
      whereConditions.push('ri.Status = ?');
      queryParams.push(orderStatus.trim());
    }

    if (warehouseReceiptNo?.trim()) {
      whereConditions.push('ri.InboundNumber LIKE ?');
      queryParams.push(`%${warehouseReceiptNo.trim()}%`);
    }

    if (warehouse?.trim()) {
      whereConditions.push('w.WarehouseCode = ?');
      queryParams.push(warehouse.trim());
    }

    if (supplier?.trim()) {
      whereConditions.push('s.SupplierCode = ?');
      queryParams.push(supplier.trim());
    }

    if (startDate?.trim()) {
      whereConditions.push('ri.InboundDate >= ?');
      queryParams.push(startDate.trim());
    }

    if (endDate?.trim()) {
      whereConditions.push('ri.InboundDate <= ?');
      queryParams.push(endDate.trim());
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询导出数据（不分页）
    const exportSql = `
      SELECT 
        ri.InboundNumber as '入库单号',
        s.SupplierName as '供应商名称',
        w.WarehouseName as '入库仓库',
        CASE ri.Status 
          WHEN 'Draft' THEN '草稿'
          WHEN 'Pending' THEN '待审核'
          WHEN 'Completed' THEN '已完成'
          WHEN 'Cancelled' THEN '已取消'
          ELSE ri.Status
        END as '状态',
        ri.InboundDate as '入库日期',
        ri.CreatedAt as '创建时间',
        COALESCE(summary.totalQuantity, 0) as '入库总数量',
        ri.TotalAmount as '总金额',
        ri.Remarks as '备注说明'
      FROM RawMaterialInbound ri
      LEFT JOIN Supplier s ON ri.SupplierID = s.SupplierID
      LEFT JOIN Warehouse w ON ri.WarehouseID = w.WarehouseID
      LEFT JOIN (
        SELECT 
          InboundID,
          SUM(Quantity) as totalQuantity
        FROM RawMaterialInboundDetail
        GROUP BY InboundID
      ) summary ON ri.InboundID = summary.InboundID
      WHERE ${whereClause}
      ORDER BY ri.InboundDate DESC, ri.InboundID DESC
      LIMIT 10000
    `;

    const exportData = await executeQuery(exportSql, queryParams);

    // 创建Excel工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('入库单列表');

    // 设置工作表属性
    workbook.creator = '水杯WMS系统';
    workbook.lastModifiedBy = '系统';
    workbook.created = new Date();

    if (exportData.length > 0) {
      // 获取列标题
      const headers = Object.keys(exportData[0]);
      
      // 添加标题行
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // 添加数据行
      exportData.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // 格式化日期
          if (header.includes('日期') || header.includes('时间')) {
            return value ? formatDateTime(value) : '';
          }
          return value;
        });
        worksheet.addRow(values);
      });

      // 自动调整列宽
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });
    } else {
      // 没有数据时添加提示
      worksheet.addRow(['暂无数据']);
    }

    // 设置响应头
    const fileName = `入库单列表_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    // 输出Excel文件
    await workbook.xlsx.write(res);
    res.end();

    console.log(`导出入库单 - 成功, 导出${exportData.length}条记录`);

  } catch (error) {
    console.error('导出入库单失败:', error);
    if (!res.headersSent) {
      res.status(500).json(errorResponse('导出入库单失败'));
    }
  }
});

// 4. 审核入库单
router.put('/inbound-orders/audit',  async (req, res) => {
  try {
    console.log('审核入库单 - 参数:', req.body);
    
    const { ids, status, reason } = req.body;

    // 参数验证
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(errorResponse('请选择要审核的入库单', 400));
    }

    if (!['Completed', 'approved', 'Cancelled', 'rejected'].includes(status)) {
      return res.status(400).json(errorResponse('审核状态无效，只能审核通过或拒绝', 400));
    }

    if (['Cancelled', 'rejected'].includes(status) && (!reason || !reason.trim())) {
      return res.status(400).json(errorResponse('拒绝审核时必须填写拒绝原因', 400));
    }

    // 标准化状态
    const finalStatus = ['approved', 'Completed'].includes(status) ? 'Completed' : 'Cancelled';

    let successCount = 0;
    let failCount = 0;
    const failDetails = [];

    // 批量处理审核
    for (const id of ids) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // 检查入库单状态
        const [checkResult] = await connection.execute(
          'SELECT InboundID, Status, InboundNumber FROM RawMaterialInbound WHERE InboundID = ?',
          [id]
        );

        if (checkResult.length === 0) {
          failCount++;
          failDetails.push(`入库单ID ${id} 不存在`);
          continue;
        }

        const inbound = checkResult[0];
        if (inbound.Status !== 'Pending') {
          failCount++;
          failDetails.push(`入库单 ${inbound.InboundNumber} 状态不是待审核，无法审核`);
          continue;
        }

        // 更新入库单状态
        const updateRemark = reason ? 
          `${inbound.Remarks || ''} [审核意见: ${reason.trim()}]`.trim() : 
          inbound.Remarks;

        await connection.execute(
          `UPDATE RawMaterialInbound 
           SET Status = ?, Remarks = ?, UpdatedAt = CURRENT_TIMESTAMP
           WHERE InboundID = ?`,
          [finalStatus, updateRemark, id]
        );

        // 如果审核通过，更新库存
        if (finalStatus === 'Completed') {
          // 获取入库单明细
          const [details] = await connection.execute(
            `SELECT 
              d.RawMaterialID, 
              d.Quantity, 
              d.BatchNumber, 
              i.WarehouseID
            FROM 
              RawMaterialInboundDetail d
              JOIN RawMaterialInbound i ON d.InboundID = i.InboundID
            WHERE 
              d.InboundID = ?`,
            [id]
          );

          // 为每个明细更新库存
          for (const detail of details) {
            // 查找默认库位
            const [locations] = await connection.execute(
              `SELECT LocationID FROM Location 
               WHERE WarehouseID = ? AND LocationType = 'Raw' AND Status = 1 
               LIMIT 1`,
              [detail.WarehouseID]
            );

            let locationId;
            if (locations.length > 0) {
              locationId = locations[0].LocationID;
            } else {
              // 创建默认库位
              locationId = `RAW-${detail.WarehouseID}-DEFAULT`;
              try {
                await connection.execute(
                  `INSERT INTO Location 
                   (LocationID, WarehouseID, LocationName, LocationType, Capacity, Status) 
                   VALUES (?, ?, ?, 'Raw', 1000, 1)`,
                  [locationId, detail.WarehouseID, '原材料默认库位']
                );
              } catch (err) {
                // 库位可能已存在，忽略错误
              }
            }

            // 检查是否已存在该物料的库存记录
            const [inventory] = await connection.execute(
              `SELECT InventoryID, CurrentQuantity FROM Inventory 
               WHERE ItemType = 'RawMaterial' AND ItemID = ? AND LocationID = ? AND BatchNumber = ?`,
              [detail.RawMaterialID, locationId, detail.BatchNumber || '']
            );

            if (inventory.length > 0) {
              // 更新现有库存
              const newQuantity = parseFloat(inventory[0].CurrentQuantity) + parseFloat(detail.Quantity);
              await connection.execute(
                `UPDATE Inventory SET 
                 CurrentQuantity = ?, 
                 AvailableQuantity = ?, 
                 LastInboundDate = NOW(), 
                 UpdatedAt = NOW() 
                 WHERE InventoryID = ?`,
                [newQuantity, newQuantity, inventory[0].InventoryID]
              );

              // 记录库存变动
              await connection.execute(
                `INSERT INTO InventoryTransaction 
                 (InventoryID, TransactionType, ReferenceType, ReferenceID, 
                  QuantityBefore, QuantityChange, QuantityAfter, 
                  TransactionDate, OperatorUserID) 
                 VALUES (?, 'Inbound', 'RawMaterialInbound', ?, ?, ?, ?, NOW(), ?)`,
                [
                  inventory[0].InventoryID, 
                  id, 
                  inventory[0].CurrentQuantity, 
                  detail.Quantity, 
                  newQuantity, 
                  req.user.id
                ]
              );
            } else {
              // 创建新的库存记录
              const [newInventory] = await connection.execute(
                `INSERT INTO Inventory 
                 (ItemType, ItemID, LocationID, BatchNumber, 
                  CurrentQuantity, AvailableQuantity, LastInboundDate) 
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [
                  'RawMaterial', 
                  detail.RawMaterialID, 
                  locationId, 
                  detail.BatchNumber || '', 
                  detail.Quantity, 
                  detail.Quantity
                ]
              );

              // 记录库存变动
              await connection.execute(
                `INSERT INTO InventoryTransaction 
                 (InventoryID, TransactionType, ReferenceType, ReferenceID, 
                  QuantityBefore, QuantityChange, QuantityAfter, 
                  TransactionDate, OperatorUserID) 
                 VALUES (?, 'Inbound', 'RawMaterialInbound', ?, ?, ?, ?, NOW(), ?)`,
                [
                  newInventory.insertId, 
                  id, 
                  0, 
                  detail.Quantity, 
                  detail.Quantity, 
                  req.user.id
                ]
              );
            }
          }
        }

        await connection.commit();
        successCount++;
        
        console.log(`入库单 ${inbound.InboundNumber} 审核成功: ${finalStatus}`);

      } catch (error) {
        await connection.rollback();
        failCount++;
        failDetails.push(`入库单ID ${id} 审核失败: ${error.message}`);
        console.error(`审核入库单 ${id} 失败:`, error);
      } finally {
        connection.release();
      }
    }

    const result = {
      successCount,
      failCount,
      details: failDetails
    };

    const message = `审核完成: 成功${successCount}个，失败${failCount}个`;
    console.log('审核入库单 - 完成:', result);
    
    res.json(successResponse(result, message));

  } catch (error) {
    console.error('审核入库单失败:', error);
    res.status(500).json(errorResponse('审核入库单失败'));
  }
});

// 5. 撤销入库单
router.put('/inbound-orders/revoke',  async (req, res) => {
  try {
    console.log('撤销入库单 - 参数:', req.body);
    
    const { ids } = req.body;

    // 参数验证
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(errorResponse('请选择要撤销的入库单', 400));
    }

    let successCount = 0;
    let failCount = 0;
    const failDetails = [];

    // 批量处理撤销
    for (const id of ids) {
      try {
        // 检查入库单状态
        const checkResult = await executeQuery(
          'SELECT InboundID, Status, InboundNumber FROM RawMaterialInbound WHERE InboundID = ?',
          [id]
        );

        if (checkResult.length === 0) {
          failCount++;
          failDetails.push(`入库单ID ${id} 不存在`);
          continue;
        }

        const inbound = checkResult[0];
        if (inbound.Status === 'Completed') {
          failCount++;
          failDetails.push(`入库单 ${inbound.InboundNumber} 已完成，无法撤销`);
          continue;
        }

        if (inbound.Status === 'Cancelled') {
          failCount++;
          failDetails.push(`入库单 ${inbound.InboundNumber} 已取消，无需重复撤销`);
          continue;
        }

        // 撤销入库单
        await executeQuery(
          'UPDATE RawMaterialInbound SET Status = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE InboundID = ?',
          ['Cancelled', id]
        );

        successCount++;
        console.log(`入库单 ${inbound.InboundNumber} 撤销成功`);

      } catch (error) {
        failCount++;
        failDetails.push(`入库单ID ${id} 撤销失败: ${error.message}`);
        console.error(`撤销入库单 ${id} 失败:`, error);
      }
    }

    const result = {
      successCount,
      failCount,
      details: failDetails
    };

    const message = `撤销完成: 成功${successCount}个，失败${failCount}个`;
    console.log('撤销入库单 - 完成:', result);
    
    res.json(successResponse(result, message));

  } catch (error) {
    console.error('撤销入库单失败:', error);
    res.status(500).json(errorResponse('撤销入库单失败'));
  }
});

// 6. 获取打印数据
router.get('/inbound-orders/:id/print',  async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`获取打印数据 - 入库单ID: ${id}`);

    // 参数验证
    if (!id || isNaN(id)) {
      return res.status(400).json(errorResponse('入库单ID无效', 400));
    }

    // 获取入库单主信息
    const inboundSql = `
      SELECT 
        ri.InboundID as id,
        ri.InboundNumber as warehouseReceiptNo,
        ri.InboundDate,
        ri.Status,
        ri.Remarks,
        ri.TotalAmount,
        s.SupplierName,
        s.SupplierCode,
        s.ContactPerson as supplierContact,
        s.ContactPhone as supplierPhone,
        w.WarehouseName,
        w.WarehouseCode,
        u.FullName as operatorName,
        u.Username as operatorCode
      FROM RawMaterialInbound ri
      LEFT JOIN Supplier s ON ri.SupplierID = s.SupplierID
      LEFT JOIN Warehouse w ON ri.WarehouseID = w.WarehouseID
      LEFT JOIN User u ON ri.OperatorUserID = u.UserID
      WHERE ri.InboundID = ?
    `;

    const inboundResult = await executeQuery(inboundSql, [id]);

    if (inboundResult.length === 0) {
      return res.status(404).json(errorResponse('入库单不存在', 404));
    }

    // 获取入库单明细
    const detailsSql = `
      SELECT 
        rm.MaterialName as materialName,
        rm.MaterialCode as materialCode,
        rm.Specification as specification,
        rid.Quantity as quantity,
        rm.Unit as unit,
        rid.BatchNumber,
        rid.UnitPrice,
        rid.Amount,
        rid.QualityStatus,
        rid.Remarks as detailRemarks,
        rid.ProductionDate,
        rid.ExpiryDate
      FROM RawMaterialInboundDetail rid
      LEFT JOIN RawMaterial rm ON rid.RawMaterialID = rm.MaterialID
      WHERE rid.InboundID = ?
      ORDER BY rid.DetailID
    `;

    const detailsResult = await executeQuery(detailsSql, [id]);

    // 组装打印数据
    const printData = {
      ...inboundResult[0],
      InboundDate: formatDateTime(inboundResult[0].InboundDate),
      details: detailsResult.map(detail => ({
        ...detail,
        quantity: parseFloat(detail.quantity) || 0,
        UnitPrice: parseFloat(detail.UnitPrice) || 0,
        Amount: parseFloat(detail.Amount) || 0,
        ProductionDate: detail.ProductionDate ? moment(detail.ProductionDate).format('YYYY-MM-DD') : null,
        ExpiryDate: detail.ExpiryDate ? moment(detail.ExpiryDate).format('YYYY-MM-DD') : null
      })),
      printTime: formatDateTime(new Date()),
      printUser: req.user.fullName || req.user.username,
      totalQuantity: detailsResult.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0),
      totalAmount: parseFloat(inboundResult[0].TotalAmount) || 0
    };

    console.log(`获取打印数据 - 成功, 入库单: ${printData.warehouseReceiptNo}`);
    res.json(printData);

  } catch (error) {
    console.error('获取打印数据失败:', error);
    res.status(500).json(errorResponse('获取打印数据失败'));
  }
});

// 7. 获取新建入库单选项
router.get('/inbound-orders/create-options',  async (req, res) => {
  try {
    console.log('获取新建入库单选项 - 开始');

    // 并行查询所有选项数据
    const [
      suppliers,
      manufacturers,
      warehouses,
      materials
    ] = await Promise.all([
      // 供应商列表
      executeQuery(`
        SELECT SupplierID as value, SupplierName as label, SupplierCode
        FROM Supplier 
        WHERE Status = 1 
        ORDER BY SupplierName
      `),
      
      // 生产商（加工厂）列表
      executeQuery(`
        SELECT FactoryID as value, FactoryName as label, FactoryCode
        FROM ProcessingFactory 
        WHERE Status = 1 
        ORDER BY FactoryName
      `),
      
      // 仓库列表
      executeQuery(`
        SELECT WarehouseID as value, WarehouseName as label, WarehouseCode
        FROM Warehouse 
        WHERE Status = 1 
        ORDER BY WarehouseName
      `),
      
      // 原材料列表
      executeQuery(`
        SELECT 
          MaterialID,
          MaterialCode as materialNo,
          MaterialName as materialName,
          Specification as specification,
          Unit as unit,
          Category as category,
          Description as description
        FROM RawMaterial 
        WHERE Status = 1 
        ORDER BY MaterialName
      `)
    ]);

    const options = {
      // 入库类型
      warehouseTypes: [
        { value: "purchase", label: "采购入库" },
        { value: "return", label: "退货入库" },
        { value: "transfer", label: "调拨入库" },
        { value: "production", label: "生产入库" },
        { value: "other", label: "其他入库" }
      ],
      
      // 仓库列表
      warehouses: warehouses,
      
      // 入库方式
      warehouseMethods: [
        { value: "normal", label: "普通入库" },
        { value: "urgent", label: "紧急入库" },
        { value: "direct", label: "直接入库" },
        { value: "batch", label: "批量入库" }
      ],
      
      // 供应商列表
      suppliers: suppliers,
      
      // 生产商列表
      manufacturers: manufacturers,
      
      // 原材料列表
      materials: materials
    };

    console.log('获取新建入库单选项 - 成功');
    res.json(options);

  } catch (error) {
    console.error('获取新建入库单选项失败:', error);
    res.status(500).json(errorResponse('获取新建入库单选项失败'));
  }
});

// 8. 创建入库单
router.post('/inbound-orders',  async (req, res) => {
  try {
    console.log('创建入库单 - 参数:', req.body);
    
    const {
      warehouseReceiptNo,
      warehouseType,
      warehouse,
      warehouseMethod,
      supplier,
      manufacturer,
      remark,
      details
    } = req.body;

    // 参数验证
    if (!warehouse || !supplier) {
      return res.status(400).json(errorResponse('仓库和供应商不能为空', 400));
    }

    if (!details || !Array.isArray(details) || details.length === 0) {
      return res.status(400).json(errorResponse('请添加入库明细', 400));
    }

    // 验证明细数据
    for (let i = 0; i < details.length; i++) {
      const detail = details[i];
      
      if (!detail.materialNo && !detail.materialId) {
        return res.status(400).json(errorResponse(`第${i + 1}行明细: 缺少原材料信息`, 400));
      }
      
      const quantity = detail.expectedQuantity || detail.quantity;
      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json(errorResponse(`第${i + 1}行明细: 数量必须大于0`, 400));
      }
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 生成入库单号（如果没有提供）
      let finalInboundNumber = warehouseReceiptNo;
      if (!finalInboundNumber || finalInboundNumber.trim() === '') {
        finalInboundNumber = `RI${moment().format('YYYYMMDD')}${String(Date.now()).slice(-6)}`;
      }

      // 检查入库单号是否已存在
      const [existsResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM RawMaterialInbound WHERE InboundNumber = ?',
        [finalInboundNumber]
      );

      if (existsResult[0].count > 0) {
        finalInboundNumber = `RI${moment().format('YYYYMMDD')}${String(Date.now()).slice(-6)}`;
      }

      // 插入入库单主表
      const [inboundResult] = await connection.execute(
        `INSERT INTO RawMaterialInbound 
         (InboundNumber, SupplierID, WarehouseID, InboundDate, OperatorUserID, Status, Remarks) 
         VALUES (?, ?, ?, NOW(), ?, 'Pending', ?)`,
        [finalInboundNumber, supplier, warehouse, req.user.id, remark || '']
      );

      const inboundId = inboundResult.insertId;
      let totalAmount = 0;

      // 插入入库单明细
      for (const detail of details) {
        let materialId;
        
        // 获取原材料ID
        if (detail.materialId) {
          materialId = detail.materialId;
        } else {
          const [materialRows] = await connection.execute(
            'SELECT MaterialID FROM RawMaterial WHERE MaterialCode = ? AND Status = 1',
            [detail.materialNo]
          );

          if (materialRows.length === 0) {
            throw new Error(`未找到原材料: ${detail.materialNo}`);
          }
          materialId = materialRows[0].MaterialID;
        }

        const quantity = detail.expectedQuantity || detail.quantity;
        const unitPrice = parseFloat(detail.unitPrice) || 0;
        const amount = quantity * unitPrice;
        totalAmount += amount;

        // 插入明细记录
        await connection.execute(
          `INSERT INTO RawMaterialInboundDetail 
           (InboundID, RawMaterialID, Quantity, UnitPrice, Amount, BatchNumber, Remarks) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            inboundId, 
            materialId, 
            quantity, 
            unitPrice,
            amount,
            detail.batchNo || '',
            detail.remarks || ''
          ]
        );
      }

      // 更新入库单总金额
      await connection.execute(
        'UPDATE RawMaterialInbound SET TotalAmount = ? WHERE InboundID = ?',
        [totalAmount, inboundId]
      );

      await connection.commit();

      const result = {
        id: inboundId,
        warehouseReceiptNo: finalInboundNumber,
        status: 'Pending',
        totalAmount: totalAmount,
        detailCount: details.length
      };

      console.log('创建入库单 - 成功:', result);
      res.status(201).json(successResponse(result, '入库单创建成功'));

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('创建入库单失败:', error);
    res.status(500).json(errorResponse(error.message || '创建入库单失败'));
  }
});

// 9. 获取入库单详情
router.get('/inbound-orders/:id',  async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`获取入库单详情 - ID: ${id}`);

    if (!id || isNaN(id)) {
      return res.status(400).json(errorResponse('入库单ID无效', 400));
    }

    // 获取入库单主信息
    const inboundSql = `
      SELECT 
        ri.InboundID as id,
        ri.InboundNumber as warehouseReceiptNo,
        ri.Status as status,
        ri.InboundDate as warehouseDate,
        ri.TotalAmount,
        ri.Remarks as remark,
        ri.CreatedAt,
        ri.UpdatedAt,
        ri.WarehouseID as warehouse,
        w.WarehouseName as warehouseName,
        ri.SupplierID as supplier,
        s.SupplierName as supplierName,
        ri.OperatorUserID as operatorId,
        u.FullName as operatorName
      FROM RawMaterialInbound ri
      LEFT JOIN Warehouse w ON ri.WarehouseID = w.WarehouseID
      LEFT JOIN Supplier s ON ri.SupplierID = s.SupplierID
      LEFT JOIN User u ON ri.OperatorUserID = u.UserID
      WHERE ri.InboundID = ?
    `;

    const inboundResult = await executeQuery(inboundSql, [id]);

    if (inboundResult.length === 0) {
      return res.status(404).json(errorResponse('入库单不存在', 404));
    }

    // 获取入库单明细
    const detailsSql = `
      SELECT 
        rid.DetailID as id,
        rid.RawMaterialID as materialId,
        rm.MaterialCode as materialNo,
        rm.MaterialName as materialName,
        rm.Specification as specification,
        rm.Unit as unit,
        rid.BatchNumber as batchNo,
        rid.Quantity as quantity,
        rid.UnitPrice as unitPrice,
        rid.Amount as amount,
        rid.Remarks as remarks
      FROM RawMaterialInboundDetail rid
      LEFT JOIN RawMaterial rm ON rid.RawMaterialID = rm.MaterialID
      WHERE rid.InboundID = ?
      ORDER BY rid.DetailID
    `;

    const detailsResult = await executeQuery(detailsSql, [id]);

    // 组装详情数据
    const inboundDetail = {
      ...inboundResult[0],
      warehouseDate: formatDateTime(inboundResult[0].warehouseDate),
      CreatedAt: formatDateTime(inboundResult[0].CreatedAt),
      UpdatedAt: formatDateTime(inboundResult[0].UpdatedAt),
      TotalAmount: parseFloat(inboundResult[0].TotalAmount) || 0,
      details: detailsResult.map(detail => ({
        ...detail,
        quantity: parseFloat(detail.quantity) || 0,
        unitPrice: parseFloat(detail.unitPrice) || 0,
        amount: parseFloat(detail.amount) || 0
      })),
      totalQuantity: detailsResult.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0),
      detailCount: detailsResult.length
    };

    console.log(`获取入库单详情 - 成功, 单号: ${inboundDetail.warehouseReceiptNo}`);
    res.json(successResponse(inboundDetail));

  } catch (error) {
    console.error('获取入库单详情失败:', error);
    res.status(500).json(errorResponse('获取入库单详情失败'));
  }
});

// 10. 修改入库单
router.put('/inbound-orders/:id',  async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`修改入库单 - ID: ${id}`, req.body);

    if (!id || isNaN(id)) {
      return res.status(400).json(errorResponse('入库单ID无效', 400));
    }

    const {
      warehouseReceiptNo,
      warehouseType,
      warehouse,
      warehouseMethod,
      supplier,
      manufacturer,
      remark,
      details
    } = req.body;

    // 检查入库单是否存在且可编辑
    const checkResult = await executeQuery(
      'SELECT InboundID, Status, InboundNumber FROM RawMaterialInbound WHERE InboundID = ?',
      [id]
    );

    if (checkResult.length === 0) {
      return res.status(404).json(errorResponse('入库单不存在', 404));
    }

    if (!['Draft', 'Pending'].includes(checkResult[0].Status)) {
      return res.status(400).json(errorResponse('只有草稿或待审核状态的入库单可以修改', 400));
    }

    // 参数验证
    if (!warehouse || !supplier) {
      return res.status(400).json(errorResponse('仓库和供应商不能为空', 400));
    }

    if (!details || !Array.isArray(details) || details.length === 0) {
      return res.status(400).json(errorResponse('请添加入库明细', 400));
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 更新主表
      await connection.execute(
        `UPDATE RawMaterialInbound 
         SET InboundNumber = ?, SupplierID = ?, WarehouseID = ?, 
             Remarks = ?, UpdatedAt = NOW()
         WHERE InboundID = ?`,
        [warehouseReceiptNo, supplier, warehouse, remark || '', id]
      );

      // 删除原有明细
      await connection.execute(
        'DELETE FROM RawMaterialInboundDetail WHERE InboundID = ?',
        [id]
      );

      let totalAmount = 0;

      // 插入新明细
      for (const detail of details) {
        let materialId;
        
        if (detail.materialId) {
          materialId = detail.materialId;
        } else {
          const [materialRows] = await connection.execute(
            'SELECT MaterialID FROM RawMaterial WHERE MaterialCode = ? AND Status = 1',
            [detail.materialNo]
          );

          if (materialRows.length === 0) {
            throw new Error(`未找到原材料: ${detail.materialNo}`);
          }
          materialId = materialRows[0].MaterialID;
        }

        const quantity = detail.expectedQuantity || detail.quantity;
        const unitPrice = parseFloat(detail.unitPrice) || 0;
        const amount = quantity * unitPrice;
        totalAmount += amount;

        await connection.execute(
          `INSERT INTO RawMaterialInboundDetail 
           (InboundID, RawMaterialID, Quantity, UnitPrice, Amount, BatchNumber, Remarks) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id, 
            materialId, 
            quantity, 
            unitPrice,
            amount,
            detail.batchNo || detail.BatchNumber || '',
            detail.remarks || detail.Remarks || ''
          ]
        );
      }

      // 更新总金额
      await connection.execute(
        'UPDATE RawMaterialInbound SET TotalAmount = ?, UpdatedAt = NOW() WHERE InboundID = ?',
        [totalAmount, id]
      );

      await connection.commit();

      const result = {
        id: parseInt(id),
        warehouseReceiptNo: warehouseReceiptNo,
        status: checkResult[0].Status,
        totalAmount: totalAmount,
        detailCount: details.length
      };

      console.log('修改入库单 - 成功:', result);
      res.json(successResponse(result, '入库单修改成功'));

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('修改入库单失败:', error);
    res.status(500).json(errorResponse(error.message || '修改入库单失败'));
  }
});

// 11. 删除入库单
router.delete('/inbound-orders/:id',  async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`删除入库单 - ID: ${id}`);

    if (!id || isNaN(id)) {
      return res.status(400).json(errorResponse('入库单ID无效', 400));
    }

    // 检查入库单状态
    const checkResult = await executeQuery(
      'SELECT InboundID, Status, InboundNumber FROM RawMaterialInbound WHERE InboundID = ?',
      [id]
    );

    if (checkResult.length === 0) {
      return res.status(404).json(errorResponse('入库单不存在', 404));
    }

    if (checkResult[0].Status === 'Completed') {
      return res.status(400).json(errorResponse('已完成的入库单不能删除', 400));
    }

    // 删除入库单（明细会因为外键级联删除自动删除）
    await executeQuery('DELETE FROM RawMaterialInbound WHERE InboundID = ?', [id]);

    console.log(`删除入库单 - 成功: ${checkResult[0].InboundNumber}`);
    res.json(successResponse(null, '入库单删除成功'));

  } catch (error) {
    console.error('删除入库单失败:', error);
    res.status(500).json(errorResponse('删除入库单失败'));
  }
});






module.exports = router;
