require('dotenv').config();
module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'watercup_wms_secret_key',
  PORT: process.env.PORT || 3000
};
