import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import Header from '../Layout/Header';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import './RealCapture.css';

function fmtUptime(s) {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return `${h}h ${m}m ${sec}s`;
}
function fmtKB(kb) {
  if (kb == null || isNaN(kb)) return '0 B/s';
  if (kb > 1024) return `${(kb/1024).toFixed(1)} MB/s`;
  return `${kb} KB/s`;
}

export default function RealCapture() {
  const { socket, connected } = useSocket();
  const [sysStats,  setSysStats]  = useState(null);
  const [netIfaces, setNetIfaces] = useState({});
  const [bwHistory, setBwHistory] = useState([]);
  const [lastUpdate,setLastUpdate]= useState(null);

  useEffect(() => {
    if (!socket) return;
    socket.on('system_stats', data => {
      setSysStats(data);
      setNetIfaces(data.networkInterfaces || {});
      setLastUpdate(new Date());
      if (data.bandwidth) {
        setBwHistory(prev => [...prev, {
          time:  format(new Date(), 'HH:mm:ss'),
          rx:    data.bandwidth.rxKBps || 0,
          tx:    data.bandwidth.txKBps || 0,
        }].slice(-40));
      }
    });
    return () => socket.off('system_stats');
  }, [socket]);

  const memPct = sysStats?.memUsePct || 0;
  const memColor = memPct > 85 ? 'var(--accent-red)' : memPct > 60 ? 'var(--accent-yellow)' : 'var(--accent-green)';

  return (
    <div className="page">
      <Header title="REAL NETWORK CAPTURE" subtitle="Live system & network interface monitoring"/>
      <div className="capture__content">

        {/* Mode Banner */}
        <div className="capture__mode-banner">
          <span className="capture__mode-icon">🔬</span>
          <div>
            <div className="capture__mode-title">REAL SYSTEM MONITORING ACTIVE</div>
            <div className="capture__mode-text">
              Reads actual OS network interfaces, memory, CPU, uptime from your server via Node.js <code>os</code> module.<br/>
              For full deep packet inspection, install <code>npm install cap</code> (requires <code>libpcap-dev</code>) and run backend as root.<br/>
              Attack detection runs on simulated traffic to avoid interfering with real traffic.
            </div>
          </div>
        </div>

        {/* Top stats */}
        <div className="capture__top-grid">
          <CapStat title="HOSTNAME"      value={sysStats?.hostname || '...'} color="var(--accent-cyan)"/>
          <CapStat title="OS UPTIME"     value={sysStats ? fmtUptime(sysStats.uptime) : '...'} color="var(--accent-green)"/>
          <CapStat title="CPU CORES"     value={sysStats?.cpuCount || '...'} color="var(--accent-purple)"/>
          <CapStat title="SOCKET"        value={connected ? 'CONNECTED' : 'OFFLINE'} color={connected?'var(--accent-green)':'var(--accent-red)'}/>
        </div>

        <div className="capture__sys-grid">
          {/* System Info */}
          <div className="cyber-card capture__sys-card">
            <div className="capture__sys-title"><span className="pulse-dot pulse-dot-green"/> REAL-TIME SYSTEM STATS</div>
            {sysStats ? (
              <>
                <div className="sys-row"><span className="sys-row__label">PLATFORM</span><span className="sys-row__value">{sysStats.platform}</span></div>
                <div className="sys-row"><span className="sys-row__label">TOTAL MEMORY</span><span className="sys-row__value">{sysStats.totalMemMB} MB</span></div>
                <div className="sys-row"><span className="sys-row__label">USED MEMORY</span><span className="sys-row__value" style={{color:memColor}}>{sysStats.usedMemMB} MB ({memPct}%)</span></div>
                <div className="sys-row"><span className="sys-row__label">FREE MEMORY</span><span className="sys-row__value" style={{color:'var(--accent-green)'}}>{sysStats.freeMemMB} MB</span></div>
                <div className="sys-row"><span className="sys-row__label">CPU MODEL</span><span className="sys-row__value" style={{fontSize:10}}>{sysStats.cpuModel?.substring(0,32)}...</span></div>
                <div className="sys-row"><span className="sys-row__label">LOAD AVG (1m)</span><span className="sys-row__value">{sysStats.loadAvg1m}</span></div>
                <div className="sys-row"><span className="sys-row__label">LOAD AVG (5m)</span><span className="sys-row__value">{sysStats.loadAvg5m}</span></div>
                <div className="sys-row"><span className="sys-row__label">ACTIVE CONNS</span><span className="sys-row__value">{sysStats.activeConnections ?? 'N/A'}</span></div>
                <div className="sys-row"><span className="sys-row__label">LAST UPDATE</span><span className="sys-row__value">{lastUpdate?format(lastUpdate,'HH:mm:ss'):'--'}</span></div>
                <div style={{marginTop:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontFamily:'var(--font-display)',fontSize:10,color:'var(--text-muted)',letterSpacing:1,marginBottom:6}}>
                    <span>MEMORY USAGE</span><span style={{color:memColor}}>{memPct}%</span>
                  </div>
                  <div className="capture__mem-bar">
                    <div className="capture__mem-fill" style={{width:`${memPct}%`, background:memColor, boxShadow:`0 0 8px ${memColor}50`}}/>
                  </div>
                </div>
              </>
            ) : (
              <div style={{color:'var(--text-muted)',fontFamily:'var(--font-mono)',fontSize:12,textAlign:'center',padding:30}}>
                Waiting for system data...<br/>
                <span style={{fontSize:10}}>Backend broadcasts every 5 seconds</span>
              </div>
            )}
          </div>

          {/* Network Interfaces */}
          <div className="cyber-card capture__iface-panel">
            <div className="capture__iface-title">REAL NETWORK INTERFACES</div>
            {Object.keys(netIfaces).length > 0 ? (
              Object.entries(netIfaces).map(([name, info]) => (
                <div key={name} className={`iface-card ${info.address?'active':''}`}>
                  <div className="iface-name">{name}</div>
                  <div>
                    <div className="iface-addr">{info.address || 'No IPv4'}</div>
                    <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-muted)'}}>
                      mask: {info.netmask || '-'}
                    </div>
                  </div>
                  <div className="iface-mac">{info.mac || '-'}</div>
                  {info.address && <span className="pulse-dot pulse-dot-green" style={{flexShrink:0}}/>}
                </div>
              ))
            ) : (
              <div style={{color:'var(--text-muted)',fontFamily:'var(--font-mono)',fontSize:12,textAlign:'center',padding:30}}>
                Waiting for interface data...
              </div>
            )}

            {/* Real bandwidth section */}
            {sysStats?.bandwidth && (
              <div style={{marginTop:16,paddingTop:16,borderTop:'1px solid rgba(26,58,92,0.5)'}}>
                <div style={{fontFamily:'var(--font-display)',fontSize:10,color:'var(--text-muted)',letterSpacing:2,marginBottom:12}}>REAL BANDWIDTH (eth0)</div>
                <div style={{display:'flex',gap:20}}>
                  <div>
                    <div style={{fontFamily:'var(--font-display)',fontSize:9,color:'var(--text-muted)',letterSpacing:1}}>INBOUND</div>
                    <div style={{fontFamily:'var(--font-display)',fontSize:18,color:'var(--accent-cyan)',fontWeight:700}}>{fmtKB(sysStats.bandwidth.rxKBps)}</div>
                  </div>
                  <div>
                    <div style={{fontFamily:'var(--font-display)',fontSize:9,color:'var(--text-muted)',letterSpacing:1}}>OUTBOUND</div>
                    <div style={{fontFamily:'var(--font-display)',fontSize:18,color:'var(--accent-purple)',fontWeight:700}}>{fmtKB(sysStats.bandwidth.txKBps)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real Bandwidth History Chart */}
        {bwHistory.length > 1 && (
          <div className="cyber-card capture__bw-panel">
            <div className="capture__bw-title">REAL BANDWIDTH HISTORY — eth0 (KB/s)</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={bwHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,58,92,0.4)"/>
                <XAxis dataKey="time" tick={{fill:'var(--text-muted)',fontSize:9,fontFamily:'Share Tech Mono'}} interval={4}/>
                <YAxis tick={{fill:'var(--text-muted)',fontSize:10}}/>
                <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border-color)',fontFamily:'Share Tech Mono',fontSize:11}}/>
                <Legend wrapperStyle={{fontFamily:'Share Tech Mono',fontSize:11,color:'var(--text-secondary)'}}/>
                <Line type="monotone" dataKey="rx" name="RX (KB/s)" stroke="#00d4ff" strokeWidth={2} dot={false}/>
                <Line type="monotone" dataKey="tx" name="TX (KB/s)" stroke="#a855f7" strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Install pcap guide */}
        <div className="cyber-card" style={{padding:20}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:10,color:'var(--text-muted)',letterSpacing:2,marginBottom:14}}>📦 ENABLE FULL PACKET CAPTURE (OPTIONAL)</div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:12,color:'var(--text-secondary)',lineHeight:2}}>
            To enable deep packet inspection and real MAC-layer captures, run these commands:
          </div>
          <div style={{background:'var(--bg-primary)',border:'1px solid var(--border-color)',borderRadius:6,padding:14,marginTop:12,fontFamily:'var(--font-mono)',fontSize:12,color:'var(--accent-green)',lineHeight:2}}>
            <div># Install libpcap (Linux/Ubuntu)</div>
            <div>sudo apt-get install libpcap-dev</div>
            <div style={{marginTop:8}}># Install Node.js binding</div>
            <div>cd backend && npm install cap</div>
            <div style={{marginTop:8}}># Run backend as root for raw socket access</div>
            <div>sudo NODE_ENV=production node server.js</div>
            <div style={{marginTop:8,color:'var(--text-muted)'}}># macOS: brew install libpcap</div>
          </div>
        </div>

      </div>
    </div>
  );
}

function CapStat({ title, value, color }) {
  return (
    <div className="cyber-card stat-card fade-in-up">
      <div className="stat-card__label">{title}</div>
      <div className="stat-card__value" style={{color, fontSize:18}}>{value}</div>
    </div>
  );
}
