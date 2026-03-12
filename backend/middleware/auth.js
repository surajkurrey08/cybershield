const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const logger  = require('../utils/logger');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, error: 'Not authorized — please login' });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'cybershield_secret');
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Session expired — please login again' });
      }
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'User not found or deactivated' });
    }
    req.user = user;
    next();
  } catch (err) {
    logger.error('Auth middleware error:', err.message);
    res.status(500).json({ success: false, error: 'Auth error' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: `Access denied — requires: ${roles.join(' or ')}` });
  }
  next();
};

module.exports = { protect, requireRole };
