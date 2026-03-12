const express    = require('express');
const router     = express.Router();
const CustomRule = require('../models/CustomRule');
const { protect, requireRole } = require('../middleware/auth');

// GET all custom rules
router.get('/', protect, async (req, res) => {
  try {
    const rules = await CustomRule.find().sort({ createdAt: -1 });
    res.json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create custom rule
router.post('/', protect, requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const { name, description, type, severity, conditions } = req.body;
    if (!name || !description || !type || !severity) {
      return res.status(400).json({ success: false, error: 'name, description, type, severity required' });
    }
    const rule = await CustomRule.create({
      name, description,
      type: type.toUpperCase().replace(/\s+/g, '_'),
      severity, conditions: conditions || {},
      createdBy: req.user.username
    });
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH toggle rule active/inactive
router.patch('/:id/toggle', protect, requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const rule = await CustomRule.findById(req.params.id);
    if (!rule) return res.status(404).json({ success: false, error: 'Rule not found' });
    rule.isActive = !rule.isActive;
    await rule.save();
    res.json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update rule
router.put('/:id', protect, requireRole('admin', 'analyst'), async (req, res) => {
  try {
    const rule = await CustomRule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!rule) return res.status(404).json({ success: false, error: 'Rule not found' });
    res.json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE rule
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    await CustomRule.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Rule deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
