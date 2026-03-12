// attacks.js
const express = require('express');
const router  = express.Router();
const Attack  = require('../models/Attack');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { page=1, limit=20, severity, type, startDate, endDate } = req.query;
    const query = {};
    if (severity)  query.severity   = severity;
    if (type)      query.attackType = type;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate)   query.timestamp.$lte = new Date(endDate);
    }
    const attacks = await Attack.find(query).sort({ timestamp: -1 })
      .limit(+limit).skip((+page-1) * +limit);
    const total = await Attack.countDocuments(query);
    res.json({ success:true, data:attacks, total, page:+page, pages:Math.ceil(total/limit) });
  } catch(err) { res.status(500).json({ success:false, error:err.message }); }
});

router.get('/stats/by-type', protect, async (req, res) => {
  try {
    const stats = await Attack.aggregate([
      { $group: { _id:'$attackType', count:{$sum:1}, lastSeen:{$max:'$timestamp'} }},
      { $sort:{ count:-1 }}
    ]);
    res.json({ success:true, data:stats });
  } catch(err) { res.status(500).json({ success:false, error:err.message }); }
});

router.get('/geo', protect, async (req, res) => {
  try {
    const attacks = await Attack.find({ lat:{$exists:true}, lon:{$exists:true} })
      .select('sourceIP lat lon country city attackType severity timestamp')
      .sort({ timestamp:-1 }).limit(200);
    res.json({ success:true, data:attacks });
  } catch(err) { res.status(500).json({ success:false, error:err.message }); }
});

router.patch('/:id/status', protect, async (req, res) => {
  try {
    const attack = await Attack.findByIdAndUpdate(req.params.id, { status:req.body.status }, { new:true });
    res.json({ success:true, data:attack });
  } catch(err) { res.status(500).json({ success:false, error:err.message }); }
});

module.exports = router;
