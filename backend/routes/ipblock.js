const express   = require('express');
const router    = express.Router();
const BlockedIP = require('../models/BlockedIP');
const { protect, requireRole } = require('../middleware/auth');

// GET all blocked IPs
router.get('/', protect, async (req, res) => {
  try {
    const { active } = req.query;
    const query = {};
    if (active === 'true') query.isActive = true;
    const ips = await BlockedIP.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: ips, total: ips.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST block an IP
router.post('/', protect, requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const { ip, reason, severity, expiresAt, notes } = req.body;
    if (!ip || !reason) {
      return res.status(400).json({ success: false, error: 'IP and reason required' });
    }
    const existing = await BlockedIP.findOne({ ip });
    if (existing) {
      existing.isActive     = true;
      existing.attackCount += 1;
      existing.reason       = reason;
      existing.blockedBy    = req.user.username;
      await existing.save();
      return res.json({ success: true, data: existing, message: 'IP block updated' });
    }
    const blocked = await BlockedIP.create({
      ip, reason, severity: severity || 'medium',
      blockedBy: req.user.username,
      expiresAt: expiresAt || null,
      notes: notes || '',
      autoBlocked: false
    });
    const io = req.app.get('io');
    io.emit('ip_blocked', blocked);
    res.status(201).json({ success: true, data: blocked });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH unblock IP
router.patch('/:id/unblock', protect, requireRole('admin'), async (req, res) => {
  try {
    const blocked = await BlockedIP.findByIdAndUpdate(
      req.params.id, { isActive: false }, { new: true }
    );
    if (!blocked) return res.status(404).json({ success: false, error: 'Not found' });
    const io = req.app.get('io');
    io.emit('ip_unblocked', blocked);
    res.json({ success: true, data: blocked });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE remove IP from list
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    await BlockedIP.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'IP removed from blocklist' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET check if IP is blocked
router.get('/check/:ip', protect, async (req, res) => {
  try {
    const blocked = await BlockedIP.findOne({ ip: req.params.ip, isActive: true });
    res.json({ success: true, isBlocked: !!blocked, data: blocked || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
