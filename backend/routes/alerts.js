const express = require('express');
const router  = express.Router();
const Alert   = require('../models/Alert');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { page=1, limit=20, severity, status } = req.query;
    const query = {};
    if (severity) query.severity = severity;
    if (status)   query.status   = status;
    const alerts = await Alert.find(query).sort({ timestamp:-1 }).limit(+limit).skip((+page-1)*+limit);
    const total  = await Alert.countDocuments(query);
    res.json({ success:true, data:alerts, total });
  } catch(err) { res.status(500).json({ success:false, error:err.message }); }
});

router.patch('/:id/acknowledge', protect, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status:'acknowledged', acknowledgedBy: req.user.username },
      { new:true }
    );
    req.app.get('io').emit('alert_updated', alert);
    res.json({ success:true, data:alert });
  } catch(err) { res.status(500).json({ success:false, error:err.message }); }
});

router.patch('/:id/resolve', protect, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status:'resolved', resolvedAt: new Date() },
      { new:true }
    );
    req.app.get('io').emit('alert_updated', alert);
    res.json({ success:true, data:alert });
  } catch(err) { res.status(500).json({ success:false, error:err.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success:true, message:'Alert dismissed' });
  } catch(err) { res.status(500).json({ success:false, error:err.message }); }
});

module.exports = router;
