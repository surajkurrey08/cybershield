// stats.js
const express = require('express');
const router  = express.Router();
const Attack  = require('../models/Attack');
const Alert   = require('../models/Alert');
const BlockedIP = require('../models/BlockedIP');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, async (req, res) => {
  try {
    const [totalAttacks, criticalCount, activeAlerts, last24h, blockedIPs] = await Promise.all([
      Attack.countDocuments(),
      Attack.countDocuments({ severity:'critical' }),
      Alert.countDocuments({ status:'active' }),
      Attack.countDocuments({ timestamp:{ $gte: new Date(Date.now()-86400000) }}),
      BlockedIP.countDocuments({ isActive:true })
    ]);
    res.json({ success:true, data:{ totalAttacks, criticalCount, activeAlerts, last24h, blockedIPs }});
  } catch(err) { res.status(500).json({ success:false, error:err.message }); }
});

module.exports = router;
