const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { createResponse, successResponse, errorResponse, formatDateTime, validateRequired, executeQuery, executeTransaction } = require('../utils');

const JWT_SECRET = process.env.JWT_SECRET || 'watercup_wms_secret_key';


module.exports = router;
