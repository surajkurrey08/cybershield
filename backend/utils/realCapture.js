/**
 * Real Network Capture Utility
 * 
 * Uses Node.js built-in 'os' and 'net' modules to get actual
 * network interface stats and active connections.
 * For full packet capture, install: npm install cap (requires libpcap)
 * 
 * This module provides:
 * 1. Real network interface statistics (bytes in/out)
 * 2. Real active TCP/UDP connection counts  
 * 3. Actual system hostname, uptime, memory
 * 4. Simulated packet detail (for UI display)
 */

const os   = require('os');
const net  = require('net');
const { execSync } = require('child_process');

// Get real network interface stats from OS
function getRealNetworkStats() {
  const ifaces = os.networkInterfaces();
  const result = {};
  for (const [name, addrs] of Object.entries(ifaces)) {
    if (!addrs) continue;
    const ipv4 = addrs.find(a => a.family === 'IPv4' && !a.internal);
    if (ipv4) {
      result[name] = { address: ipv4.address, netmask: ipv4.netmask, mac: ipv4.mac };
    }
  }
  return result;
}

// Get real system stats
function getRealSystemStats() {
  const totalMem = os.totalmem();
  const freeMem  = os.freemem();
  const usedMem  = totalMem - freeMem;
  const cpus     = os.cpus();
  const loadAvg  = os.loadavg();
  return {
    hostname:   os.hostname(),
    platform:   os.platform(),
    uptime:     Math.floor(os.uptime()),
    totalMemMB: Math.round(totalMem  / 1024 / 1024),
    freeMemMB:  Math.round(freeMem   / 1024 / 1024),
    usedMemMB:  Math.round(usedMem   / 1024 / 1024),
    memUsePct:  Math.round((usedMem  / totalMem) * 100),
    cpuCount:   cpus.length,
    cpuModel:   cpus[0]?.model || 'Unknown',
    loadAvg1m:  loadAvg[0].toFixed(2),
    loadAvg5m:  loadAvg[1].toFixed(2),
  };
}

// Try to get real active connections count (Linux only)
function getActiveConnections() {
  try {
    const ss = execSync('ss -s 2>/dev/null || netstat -an 2>/dev/null | wc -l', { timeout: 500 }).toString().trim();
    const match = ss.match(/estab\s+(\d+)/i) || ss.match(/ESTABLISHED.*?(\d+)/i);
    return match ? parseInt(match[1]) : null;
  } catch(e) { return null; }
}

// Try to get real interface byte counts (Linux only)
function getInterfaceBytes(iface = 'eth0') {
  try {
    const rx = execSync(`cat /sys/class/net/${iface}/statistics/rx_bytes 2>/dev/null`, { timeout: 200 }).toString().trim();
    const tx = execSync(`cat /sys/class/net/${iface}/statistics/tx_bytes 2>/dev/null`, { timeout: 200 }).toString().trim();
    return { rxBytes: parseInt(rx) || 0, txBytes: parseInt(tx) || 0 };
  } catch(e) { return { rxBytes: 0, txBytes: 0 }; }
}

let _lastBytes = {};
function getRealBandwidth(iface = 'eth0') {
  const now   = Date.now();
  const bytes = getInterfaceBytes(iface);
  if (!_lastBytes[iface]) { _lastBytes[iface] = { ...bytes, time: now }; return null; }
  const elapsed = (now - _lastBytes[iface].time) / 1000;
  const rxRate  = Math.round((bytes.rxBytes - _lastBytes[iface].rxBytes) / elapsed / 1024); // KB/s
  const txRate  = Math.round((bytes.txBytes - _lastBytes[iface].txBytes) / elapsed / 1024); // KB/s
  _lastBytes[iface] = { ...bytes, time: now };
  return { rxKBps: Math.max(0,rxRate), txKBps: Math.max(0,txRate) };
}

module.exports = { getRealNetworkStats, getRealSystemStats, getActiveConnections, getRealBandwidth, getInterfaceBytes };
