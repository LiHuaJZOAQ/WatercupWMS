const fs = require('fs');
const path = require('path');

const stocktakingPath = path.join(__dirname, 'routes/stocktaking.js');
const locationsPath = path.join(__dirname, 'routes/locations.js');

const content = fs.readFileSync(stocktakingPath, 'utf-8');

// The section marker we need to split on is
// // ====================================
// // 盘点管理接口
// // ====================================

const parts = content.split('// ====================================\n// 盘点管理接口\n// ====================================');

if (parts.length === 2) {
  const preamble = `const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { createResponse, successResponse, errorResponse, formatDateTime, validateRequired, executeQuery, executeTransaction } = require('../utils');

const JWT_SECRET = process.env.JWT_SECRET || 'watercup_wms_secret_key';

`;

  // Fix the locations part by removing the preamble from parts[0]
  let locationsContent = parts[0].replace(/const express = require\('express'\);\nconst router = express.Router\(\);\nconst pool = require\('\.\.\/config\/db'\);\nconst { createResponse, successResponse, errorResponse, formatDateTime, validateRequired, executeQuery, executeTransaction } = require\('\.\.\/utils'\);\n\nconst JWT_SECRET = process\.env\.JWT_SECRET \|\| 'watercup_wms_secret_key';\n\n/, '');

  fs.writeFileSync(locationsPath, preamble + locationsContent + '\nmodule.exports = router;\n');
  fs.writeFileSync(stocktakingPath, preamble + '\n// ====================================\n// 盘点管理接口\n// ====================================\n' + parts[1]);
  console.log("Separated locations logic from stocktaking.js into locations.js");
} else {
  console.log("Could not split file correctly.");
}
