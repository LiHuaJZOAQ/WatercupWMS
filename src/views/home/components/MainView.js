// ==================== 数据库操作类 ====================

class InventoryService {
  
  // 获取库存概览数据
  static async getInventoryOverview() {
    const connection = await pool.getConnection();
    try {
      // 原材料库存统计
      const [rawMaterials] = await connection.execute(`
        SELECT 
          COUNT(*) as total_items,
          SUM(i.CurrentQuantity) as total_quantity,
          SUM(CASE WHEN i.CurrentQuantity <= r.MinStock THEN 1 ELSE 0 END) as low_stock_count
        FROM inventory i
        LEFT JOIN rawmaterial r ON i.ItemID = r.MaterialID
        WHERE i.ItemType = 'RawMaterial'
      `);

      // 成品库存统计
      const [finishedProducts] = await connection.execute(`
        SELECT 
          COUNT(*) as total_items,
          SUM(i.CurrentQuantity) as total_quantity,
          SUM(CASE WHEN i.CurrentQuantity <= f.MinStock THEN 1 ELSE 0 END) as low_stock_count
        FROM inventory i
        LEFT JOIN finishedproduct f ON i.ItemID = f.ProductID
        WHERE i.ItemType = 'FinishedProduct'
      `);

      // 库位利用率
      const [locationStats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_locations,
          SUM(CASE WHEN IsOccupied = 1 THEN 1 ELSE 0 END) as occupied_locations,
          AVG(CurrentOccupancy/Capacity * 100) as avg_utilization
        FROM location
        WHERE Status = 1
      `);

      return {
        raw_materials: rawMaterials[0],
        finished_products: finishedProducts[0],
        location_stats: locationStats[0]
      };
    } finally {
      connection.release();
    }
  }

  // 获取实时库存监控数据
  static async getRealTimeInventory() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT 
          i.InventoryID,
          CASE 
            WHEN i.ItemType = 'RawMaterial' THEN r.MaterialName
            WHEN i.ItemType = 'FinishedProduct' THEN f.ProductName
          END as ItemName,
          i.LocationID,
          i.CurrentQuantity,
          i.AvailableQuantity,
          i.ReservedQuantity,
          CASE 
            WHEN i.ItemType = 'RawMaterial' THEN r.Unit
            WHEN i.ItemType = 'FinishedProduct' THEN f.Unit
          END as Unit,
          CASE 
            WHEN i.ItemType = 'RawMaterial' THEN r.MinStock
            WHEN i.ItemType = 'FinishedProduct' THEN f.MinStock
          END as MinStock,
          CASE 
            WHEN i.ItemType = 'RawMaterial' THEN r.MaxStock
            WHEN i.ItemType = 'FinishedProduct' THEN f.MaxStock
          END as MaxStock,
          i.ItemType,
          i.LastInboundDate,
          i.LastOutboundDate,
          l.WarehouseID,
          w.WarehouseName
        FROM inventory i
        LEFT JOIN rawmaterial r ON i.ItemType = 'RawMaterial' AND i.ItemID = r.MaterialID
        LEFT JOIN finishedproduct f ON i.ItemType = 'FinishedProduct' AND i.ItemID = f.ProductID
        LEFT JOIN location l ON i.LocationID = l.LocationID
        LEFT JOIN warehouse w ON l.WarehouseID = w.WarehouseID
        WHERE i.CurrentQuantity > 0
        ORDER BY 
          CASE 
            WHEN i.CurrentQuantity <= COALESCE(r.MinStock, f.MinStock) THEN 1
            WHEN i.CurrentQuantity <= COALESCE(r.MinStock, f.MinStock) * 1.5 THEN 2
            ELSE 3
          END,
          i.CurrentQuantity ASC
      `);

      return rows.map(row => ({
        id: row.InventoryID,
        name: row.ItemName,
        location: row.LocationID,
        current: parseFloat(row.CurrentQuantity),
        available: parseFloat(row.AvailableQuantity),
        reserved: parseFloat(row.ReservedQuantity),
        unit: row.Unit,
        minStock: parseFloat(row.MinStock || 0),
        maxStock: parseFloat(row.MaxStock || 0),
        percentage: Math.round((row.CurrentQuantity / (row.MaxStock || row.CurrentQuantity)) * 100),
        status: this.getStockStatus(row.CurrentQuantity, row.MinStock),
        warehouse: row.WarehouseName,
        lastInbound: row.LastInboundDate,
        lastOutbound: row.LastOutboundDate,
        type: row.ItemType
      }));
    } finally {
      connection.release();
    }
  }

  // 获取库存预警数据
  static async getStockAlerts() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT 
          i.InventoryID,
          CASE 
            WHEN i.ItemType = 'RawMaterial' THEN r.MaterialName
            WHEN i.ItemType = 'FinishedProduct' THEN f.ProductName
          END as ItemName,
          i.LocationID,
          i.CurrentQuantity,
          CASE 
            WHEN i.ItemType = 'RawMaterial' THEN r.MinStock
            WHEN i.ItemType = 'FinishedProduct' THEN f.MinStock
          END as MinStock,
          CASE 
            WHEN i.ItemType = 'RawMaterial' THEN r.Unit
            WHEN i.ItemType = 'FinishedProduct' THEN f.Unit
          END as Unit,
          i.ItemType,
          w.WarehouseName,
          TIMESTAMPDIFF(HOUR, COALESCE(i.LastOutboundDate, i.LastInboundDate), NOW()) as HoursSinceLastMove
        FROM inventory i
        LEFT JOIN rawmaterial r ON i.ItemType = 'RawMaterial' AND i.ItemID = r.MaterialID
        LEFT JOIN finishedproduct f ON i.ItemType = 'FinishedProduct' AND i.ItemID = f.ProductID
        LEFT JOIN location l ON i.LocationID = l.LocationID
        LEFT JOIN warehouse w ON l.WarehouseID = w.WarehouseID
        WHERE 
          i.CurrentQuantity <= COALESCE(r.MinStock, f.MinStock)
          OR i.CurrentQuantity <= COALESCE(r.MinStock, f.MinStock) * 1.5
        ORDER BY 
          CASE 
            WHEN i.CurrentQuantity <= COALESCE(r.MinStock, f.MinStock) THEN 1
            ELSE 2
          END,
          i.CurrentQuantity ASC
      `);

      return rows.map(row => ({
        id: row.InventoryID,
        title: `${row.ItemName}库存${row.CurrentQuantity <= row.MinStock ? '严重不足' : '预警'}`,
        description: `${row.ItemName}库存${row.CurrentQuantity <= row.MinStock ? '已低于' : '接近'}最小库存${row.MinStock}${row.Unit}，当前仅剩${row.CurrentQuantity}${row.Unit}`,
        level: row.CurrentQuantity <= row.MinStock ? 'critical' : 'warning',
        itemName: row.ItemName,
        currentStock: row.CurrentQuantity,
        minStock: row.MinStock,
        unit: row.Unit,
        location: row.LocationID,
        warehouse: row.WarehouseName,
        suggestedOrder: Math.ceil((row.MinStock * 2 - row.CurrentQuantity) / 100) * 100,
        time: this.getTimeAgo(row.HoursSinceLastMove),
        type: row.ItemType
      }));
    } finally {
      connection.release();
    }
  }

  // 获取库位分布数据
  static async getLocationDistribution(warehouseId) {
    const connection = await pool.getConnection();
    try {
      const [locations] = await connection.execute(`
        SELECT 
          l.LocationID,
          l.LocationName,
          l.LocationType,
          l.Zone,
          l.Row,
          l.Col,
          l.Level,
          l.Capacity,
          l.CurrentOccupancy,
          l.IsOccupied,
          COUNT(i.InventoryID) as ItemCount,
          SUM(i.CurrentQuantity) as TotalQuantity
        FROM location l
        LEFT JOIN inventory i ON l.LocationID = i.LocationID AND i.CurrentQuantity > 0
        WHERE l.WarehouseID = ? AND l.Status = 1
        GROUP BY l.LocationID
        ORDER BY l.Zone, l.Row, l.Col, l.Level
      `, [warehouseId]);

      return locations.map(loc => ({
        id: loc.LocationID,
        name: loc.LocationName,
        code: `${loc.Zone}${loc.Row}`,
        type: loc.LocationType.toLowerCase(),
        capacity: parseFloat(loc.Capacity),
        occupancy: Math.round((loc.CurrentOccupancy / loc.Capacity) * 100),
        status: this.getLocationStatus(loc.CurrentOccupancy / loc.Capacity * 100),
        itemCount: loc.ItemCount,
        totalQuantity: parseFloat(loc.TotalQuantity || 0),
        zone: loc.Zone,
        row: loc.Row,
        col: loc.Col,
        level: loc.Level
      }));
    } finally {
      connection.release();
    }
  }

  // 获取入库/出库统计数据
  static async getInOutboundStats(timeRange = 30) {
    const connection = await pool.getConnection();
    try {
      // 入库统计
      const [inboundStats] = await connection.execute(`
        SELECT 
          DATE(CreatedAt) as date,
          COUNT(*) as inbound_count,
          SUM(TotalQuantity) as total_inbound_quantity,
          'inbound' as type
        FROM finishedproductinbound 
        WHERE CreatedAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(CreatedAt)
        
        UNION ALL
        
        SELECT 
          DATE(CreatedAt) as date,
          COUNT(*) as inbound_count,
          COUNT(*) * 100 as total_inbound_quantity,
          'raw_inbound' as type
        FROM rawmaterialinbound 
        WHERE CreatedAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(CreatedAt)
        
        ORDER BY date DESC
      `, [timeRange, timeRange]);

      // 出库统计
      const [outboundStats] = await connection.execute(`
        SELECT 
          DATE(CreatedAt) as date,
          COUNT(*) as outbound_count,
          SUM(TotalQuantity) as total_outbound_quantity,
          'outbound' as type
        FROM finishedproductoutbound 
        WHERE CreatedAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(CreatedAt)
        
        UNION ALL
        
        SELECT 
          DATE(CreatedAt) as date,
          COUNT(*) as outbound_count,
          SUM(TotalAmount) as total_outbound_quantity,
          'raw_outbound' as type
        FROM rawmaterialoutbound 
        WHERE CreatedAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(CreatedAt)
        
        ORDER BY date DESC
      `, [timeRange]);

      return {
        inbound: inboundStats,
        outbound: outboundStats
      };
    } finally {
      connection.release();
    }
  }

  // 获取库存预警趋势数据
  static async getWarningTrend(timeRange = 30) {
    const connection = await pool.getConnection();
    try {
      const [trends] = await connection.execute(`
        SELECT 
          DATE(it.TransactionDate) as date,
          COUNT(CASE WHEN it.TransactionType = 'Inbound' THEN 1 END) as inbound_count,
          COUNT(CASE WHEN it.TransactionType = 'Outbound' THEN 1 END) as outbound_count,
          COUNT(CASE WHEN it.QuantityAfter <= 100 THEN 1 END) as low_stock_count,
          COUNT(CASE WHEN it.QuantityAfter <= 50 THEN 1 END) as critical_count
        FROM inventorytransaction it
        WHERE it.TransactionDate >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(it.TransactionDate)
        ORDER BY date DESC
        LIMIT ?
      `, [timeRange, timeRange]);

      return trends;
    } finally {
      connection.release();
    }
  }
   // 工具方法
  static getStockStatus(current, min) {
    if (!min) return 'normal';
    if (current <= min) return 'critical';
    if (current <= min * 1.5) return 'warning';
    return 'normal';
  }

  static getLocationStatus(percentage) {
    if (percentage === 0) return 'empty';
    if (percentage <= 25) return 'low';
    if (percentage <= 75) return 'medium';
    if (percentage <= 95) return 'high';
    return 'full';
  }

  static getTimeAgo(hours) {
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${Math.floor(hours)}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}天前`;
    return `${Math.floor(days / 7)}周前`;
  }
}