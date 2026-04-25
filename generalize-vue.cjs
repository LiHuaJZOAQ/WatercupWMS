const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');
  replacements.forEach(({ search, replace }) => {
    content = content.split(search).join(replace);
  });
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${path.basename(filePath)}`);
}

const componentsDir = path.join(__dirname, 'src/views/home/components');

// 1. Partner.vue (was Supplier.vue)
replaceInFile(path.join(componentsDir, 'BasicData/Partner.vue'), [
  { search: '/suppliers', replace: '/partners' },
  { search: 'SupplierName', replace: 'PartnerName' },
  { search: 'SupplierCode', replace: 'PartnerCode' },
  { search: 'SupplierID', replace: 'PartnerID' },
  { search: 'supplier', replace: 'partner' },
  { search: '供应商', replace: '往来单位' }
]);

// 2. Item.vue (was FinishedProduct.vue)
replaceInFile(path.join(componentsDir, 'BasicData/Item.vue'), [
  { search: '/finished-products', replace: '/items' },
  { search: 'ProductName', replace: 'ItemName' },
  { search: 'ProductCode', replace: 'ItemCode' },
  { search: 'ProductID', replace: 'ItemID' },
  { search: 'product', replace: 'item' },
  { search: '成品', replace: '商品' },
  { search: 'Capacity', replace: 'Attributes' },
  { search: 'Color', replace: 'Attributes' },
  { search: 'Material', replace: 'Attributes' }
]);

// 3. InboundOrder.vue (was RawMaterial.vue in InStorage)
replaceInFile(path.join(componentsDir, 'InStorage/InboundOrder.vue'), [
  { search: '/inbound-orders', replace: '/inbound-orders' }, // actually it was inbound-orders mostly
  { search: '/suppliers', replace: '/partners' },
  { search: '/raw-materials', replace: '/items' },
  { search: 'SupplierName', replace: 'PartnerName' },
  { search: 'SupplierID', replace: 'PartnerID' },
  { search: 'MaterialName', replace: 'ItemName' },
  { search: 'MaterialID', replace: 'ItemID' },
  { search: 'MaterialCode', replace: 'ItemCode' },
  { search: '原料入库', replace: '入库单' },
  { search: '供应商', replace: '往来单位' },
  { search: '原料', replace: '商品' }
]);

// 4. OutboundOrder.vue (was OutRawMaterial.vue in OutStorage)
replaceInFile(path.join(componentsDir, 'OutStorage/OutboundOrder.vue'), [
  { search: '/outbound-orders', replace: '/outbound-orders' },
  { search: '/departments', replace: '/partners' },
  { search: '/raw-materials', replace: '/items' },
  { search: 'DepartmentName', replace: 'PartnerName' },
  { search: 'DepartmentID', replace: 'PartnerID' },
  { search: 'MaterialName', replace: 'ItemName' },
  { search: 'MaterialID', replace: 'ItemID' },
  { search: 'MaterialCode', replace: 'ItemCode' },
  { search: '原料出库', replace: '出库单' },
  { search: '领用部门', replace: '往来单位' },
  { search: '原料', replace: '商品' }
]);

// 5. Inventory.vue (was InventoryRawMaterial.vue)
replaceInFile(path.join(componentsDir, 'InventoryManage/Inventory.vue'), [
  { search: '/raw-inventory', replace: '/inventory' },
  { search: 'MaterialName', replace: 'ItemName' },
  { search: 'MaterialCode', replace: 'ItemCode' },
  { search: 'MaterialID', replace: 'ItemID' },
  { search: '原料', replace: '商品' }
]);

// 6. Location.vue (was LocationRawMaterial.vue)
replaceInFile(path.join(componentsDir, 'LocationManage/Location.vue'), [
  { search: '原料', replace: '通用' }
]);

// 7. Stocktaking.vue (was CheckRawMaterial.vue)
replaceInFile(path.join(componentsDir, 'CheckStorage/Stocktaking.vue'), [
  { search: 'MaterialName', replace: 'ItemName' },
  { search: 'MaterialCode', replace: 'ItemCode' },
  { search: 'MaterialID', replace: 'ItemID' },
  { search: '原料盘点', replace: '盘点作业' },
  { search: '原料', replace: '商品' }
]);

// 8. WavePicking.vue
replaceInFile(path.join(componentsDir, 'OutStorage/WavePicking.vue'), [
  { search: 'MaterialName', replace: 'ItemName' },
  { search: 'MaterialID', replace: 'ItemID' }
]);

console.log("Frontend vue files generalized.");
