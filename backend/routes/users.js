const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');

// GET all users — admin only
router.get('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users, total: users.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single user
router.get('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create user — admin only
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ success: false, error: 'Username or email taken' });
    const user = await User.create({ username, email, password, role: role || 'analyst' });
    res.status(201).json({ success: true, data: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH update user role/status — admin only
router.patch('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const { role, isActive } = req.body;
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Cannot modify your own account' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (role !== undefined)     user.role     = role;
    if (isActive !== undefined) user.isActive = isActive;
    user.logActivity('ADMIN_UPDATE', `Role: ${role}, Active: ${isActive}`, req.ip);
    await user.save();
    res.json({ success: true, data: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE user — admin only
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET user activity log
router.get('/:id/activity', protect, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('activityLog username');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user.activityLog, username: user.username });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
