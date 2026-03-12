const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');

let captureActive = false;
let capturedPackets = [];
let captureLib = null;

// Try to load pcap (requires libpcap on system)
function tryLoadPcap() {
  try {
    captureLib = require('pcap');
    return true;
  } catch(e) {
    return false;
  }
}

const pcapAvailable = tryLoadPcap();

// GET status
router.get('/status', protect, (req, res) => {
  res.json({
    success: true,
    data: {
      available: pcapAvailable,
      active: captureActive,
      packetCount: capturedPackets.length,
      message: pcapAvailable
        ? 'libpcap available — real capture supported'
        : 'libpcap not found — install with: sudo apt install libpcap-dev && npm install pcap'
    }
  });
});

// POST start capture
router.post('/start', protect, (req, res) => {
  if (!pcapAvailable) {
    return res.status(400).json({
      success: false,
      error: 'pcap library not available. Install: sudo apt install libpcap-dev && npm install pcap',
      install: true
    });
  }
  if (captureActive) {
    return res.json({ success: true, message: 'Capture already running' });
  }

  try {
    const { iface = 'eth0', filter = '' } = req.body;
    const io = req.app.get('io');
    capturedPackets = [];

    const session = captureLib.createSession(iface, {
      filter: filter || 'tcp or udp',
      buffer_size: 10 * 1024 * 1024,
      snap_length: 65535
    });

    captureActive = true;

    session.on('packet', (rawPacket) => {
      try {
        const packet = captureLib.decode.packet(rawPacket);
        const parsed = parsePacket(packet, rawPacket);
        if (parsed) {
          capturedPackets.unshift(parsed);
          if (capturedPackets.length > 500) capturedPackets.pop();
          io.emit('real_packet', parsed);
        }
      } catch(e) {}
    });

    session.on('error', (err) => {
      captureActive = false;
      io.emit('capture_error', { message: err.message });
    });

    req.app.set('pcap_session', session);

    res.json({ success: true, message: `Capture started on ${iface}`, iface, filter });
  } catch(err) {
    captureActive = false;
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST stop capture
router.post('/stop', protect, (req, res) => {
  const session = req.app.get('pcap_session');
  if (session) {
    try { session.close(); } catch(e) {}
    req.app.set('pcap_session', null);
  }
  captureActive = false;
  res.json({ success: true, message: 'Capture stopped', totalPackets: capturedPackets.length });
});

// GET captured packets
router.get('/packets', protect, (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  res.json({ success: true, data: capturedPackets.slice(0, limit), total: capturedPackets.length });
});

// GET available interfaces
router.get('/interfaces', protect, (req, res) => {
  if (!pcapAvailable) {
    return res.json({ success: true, data: ['eth0', 'lo', 'wlan0'], simulated: true });
  }
  try {
    const { execSync } = require('child_process');
    const raw = execSync("ip -o link show | awk -F': ' '{print $2}'").toString();
    const ifaces = raw.split('\n').map(s => s.trim()).filter(Boolean);
    res.json({ success: true, data: ifaces });
  } catch(e) {
    res.json({ success: true, data: ['eth0', 'lo'] });
  }
});

// ---- Packet Parser ----
function parsePacket(packet, rawPacket) {
  try {
    const eth = packet?.link;
    if (!eth) return null;

    const ip = eth.ip || eth.ipv6;
    if (!ip) return null;

    const transport = ip.tcp || ip.udp || ip.icmp;
    const protocol  = ip.tcp ? 'TCP' : ip.udp ? 'UDP' : ip.icmp ? 'ICMP' : 'OTHER';

    return {
      id:        Date.now() + Math.random(),
      timestamp: new Date(),
      sourceIP:  ip.saddr?.addr?.join('.') || ip.saddr || 'unknown',
      destIP:    ip.daddr?.addr?.join('.') || ip.daddr || 'unknown',
      protocol,
      srcPort:   transport?.sport || null,
      dstPort:   transport?.dport || null,
      size:      rawPacket?.buf?.length || 0,
      ttl:       ip.ttl || null,
      flags:     ip.tcp ? {
        syn: !!(ip.tcp.flags & 0x02),
        ack: !!(ip.tcp.flags & 0x10),
        fin: !!(ip.tcp.flags & 0x01),
        rst: !!(ip.tcp.flags & 0x04),
        psh: !!(ip.tcp.flags & 0x08)
      } : null,
      real: true
    };
  } catch(e) {
    return null;
  }
}

module.exports = router;
