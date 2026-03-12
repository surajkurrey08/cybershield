const express   = require('express');
const router    = express.Router();
const jwt       = require('jsonwebtoken');
const User      = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');
const logger    = require('../utils/logger');

const genToken = (user) => jwt.sign(
  { id: user._id, username: user.username, role: user.role, email: user.email },
  process.env.JWT_SECRET || 'cybershield_secret',
  { expiresIn: process.env.JWT_EXPIRE || '7d' }
);

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Username, email and password required' });
    }
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(400).json({ success: false, error: 'Username or email already taken' });
    }
    const user = await User.create({ username, email, password, role: role || 'analyst' });
    user.logActivity('REGISTER', 'Account created', req.ip);
    await user.save();
    const token = genToken(user);
    logger.info(`New user registered: ${username}`);
    res.status(201).json({ success: true, token, user: user.toJSON() });
  } catch (err) {
    logger.error('Register error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, error: 'Account deactivated — contact admin' });
    }
    user.lastLogin  = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    user.logActivity('LOGIN', 'Successful login', req.ip);
    await user.save();
    const token = genToken(user);
    logger.info(`User logged in: ${username}`);
    res.json({ success: true, token, user: user.toJSON() });
  } catch (err) {
    logger.error('Login error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/auth/update-profile
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { email, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (email) user.email = email;
    if (avatar !== undefined) user.avatar = avatar;
    user.logActivity('PROFILE_UPDATE', 'Profile updated', req.ip);
    await user.save();
    res.json({ success: true, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Both passwords required' });
    }
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, error: 'Current password incorrect' });
    }
    user.password = newPassword;
    user.logActivity('PASSWORD_CHANGE', 'Password changed', req.ip);
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.logActivity('LOGOUT', 'User logged out', req.ip);
    await user.save();
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
