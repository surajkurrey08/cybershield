const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');

// Real network capture is handled via Socket.io events
// This route provides config and status info

router.get('/status', protect, (req, res) => {
  const io = req.app.get('io');
  res.json({
    success: true,
    data: {
      mode:       process.env.CAPTURE_MODE || 'simulated',
      active:     true,
      interface:  process.env.NET_INTERFACE || 'eth0',
      filter:     process.env.BPF_FILTER    || 'tcp or udp',
      note:       'Real capture requires running backend as root with libpcap installed'
    }
  });
});

router.get('/interfaces', protect, (req, res) => {
  // In real deployment, use pcap.findalldevs()
  const interfaces = [
    { name:'eth0',    description:'Ethernet',      active:true  },
    { name:'lo',      description:'Loopback',       active:false },
    { name:'wlan0',   description:'WiFi',           active:false },
    { name:'docker0', description:'Docker Bridge',  active:false },
  ];
  res.json({ success:true, data:interfaces });
});

module.exports = router;
