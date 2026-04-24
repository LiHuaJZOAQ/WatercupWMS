const { verify } = require('jsonwebtoken');
const { errorResponse } = require('../utils');

const JWT_SECRET = process.env.JWT_SECRET || 'watercup_wms_secret_key';

const authenticateToken = (req, res, next) => {
  // Allow login route to bypass authentication
  if (req.path === '/users/login') {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(errorResponse('未提供认证令牌', 401));
  }

  verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json(errorResponse('令牌无效或已过期', 403));
    }
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;