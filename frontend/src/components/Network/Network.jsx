import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import Header from '../Layout/Header';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './Network.css';

const PROTO_COLORS = { TCP:'#00d4ff',UDP:'#a855f7',HTTP:'#00ff9d',HTTPS:'#ffd700',FTP:'#ff7c00',SSH:'#ff2d55',DNS:'#4fc3f7',ICMP:'#e040fb' };

export default function Network() {
  const { trafficData, connected } = useSocket();
  const [packets,    setPackets]    = useState([]);
  const [bwHist,     setBwHist]     = useState([]);
  const [protoCounts,setProtoCounts]= useState({});
  const [stats,      setStats]      = useState({ activeConn:0, newConn:0, totalBytes:0 });

  useEffect(() => {
    if (!trafficData) return;
    setPackets(prev => [...(trafficData.packets||[]), ...prev].slice(0,50));
    setBwHist(prev => [...prev, {
      time:     format(new Date(),'HH:mm:ss'),
      inbound:  trafficData.bandwidth?.inbound  || 0,
      outbound: trafficData.bandwidth?.outbound || 0,
    }].slice(-40));
    setStats({ activeConn:trafficData.connections?.active||0, newConn:trafficData.connections?.new||0, totalBytes:trafficData.bandwidth?.totalBytes||0 });
    trafficData.packets?.forEach(p => {
      setProtoCounts(prev => ({...prev, [p.protocol]:(prev[p.protocol]||0)+1}));
    });
  }, [trafficData]);

  const fmtBytes = b => b>1048576?`${(b/1048576).toFixed(1)} MB`:b>1024?`${(b/1024).toFixed(1)} KB`:`${b} B`;

  return (
    <div className="page">
      <Header title="NETWORK TRAFFIC ANALYSIS" subtitle="Live packet inspection — layer 3/4 monitoring"/>
      <div className="network__content">
        <div className="network__stat-grid">
          <NetStat title="ACTIVE CONNECTIONS" value={stats.activeConn}              color="var(--accent-cyan)"   icon="⇄"/>
          <NetStat title="NEW CONNECTIONS"    value={stats.newConn}                 color="var(--accent-green)"  icon="+"/>
          <NetStat title="DATA TRANSFERRED"   value={fmtBytes(stats.totalBytes)}    color="var(--accent-purple)" icon="↕"/>
          <NetStat title="SYSTEM STATUS"      value={connected?'ONLINE':'OFFLINE'}  color={connected?'var(--accent-green)':'var(--accent-red)'} icon="◎"/>
        </div>

        <div className="cyber-card network__bandwidth-panel">
          <div className="network__bw-title">BANDWIDTH UTILIZATION — REAL TIME (Mbps)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={bwHist}>
              <defs>
                <linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.3}/><stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/></linearGradient>
                <linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#a855f7" stopOpacity={0.3}/><stop offset="95%" stopColor="#a855f7" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,58,92,0.4)"/>
              <XAxis dataKey="time" tick={{fill:'var(--text-muted)',fontSize:9,fontFamily:'Share Tech Mono'}} interval={4}/>
              <YAxis tick={{fill:'var(--text-muted)',fontSize:10}}/>
              <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border-color)',fontFamily:'Share Tech Mono',fontSize:11}}/>
              <Legend wrapperStyle={{fontFamily:'Share Tech Mono',fontSize:11,color:'var(--text-secondary)'}}/>
              <Area type="monotone" dataKey="inbound"  name="Inbound"  stroke="#00d4ff" fill="url(#bg1)" strokeWidth={2}/>
              <Area type="monotone" dataKey="outbound" name="Outbound" stroke="#a855f7" fill="url(#bg2)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="network__bottom-grid">
          <div className="cyber-card network__packets-panel">
            <div className="network__packets-hdr"><span className="pulse-dot pulse-dot-green"/> LIVE PACKET CAPTURE</div>
            <div className="network__packet-scroll">
              <table className="cyber-table">
                <thead><tr><th>TIME</th><th>SRC IP</th><th>DST IP</th><th>PROTO</th><th>PORT</th><th>COUNTRY</th><th>STATUS</th></tr></thead>
                <tbody>
                  {packets.map((p,i) => (
                    <tr key={p.id||i}>
                      <td className="text-muted">{p.timestamp?format(new Date(p.timestamp),'HH:mm:ss'):'-'}</td>
                      <td style={{color:p.isAttack?'var(--accent-orange)':'var(--text-secondary)'}}>{p.sourceIP}</td>
                      <td>{p.destIP}</td>
                      <td style={{color:PROTO_COLORS[p.protocol]||'var(--text-secondary)',fontWeight:600}}>{p.protocol}</td>
                      <td>{p.port}</td>
                      <td className="text-muted">{p.country||'-'}</td>
                      <td>{p.isAttack?<span className="packet-threat">⚠ THREAT</span>:<span className="packet-clean">✓ CLEAN</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="cyber-card network__proto-panel">
            <div className="network__proto-title">PROTOCOL DISTRIBUTION</div>
            <div className="network__proto-list">
              {Object.entries(protoCounts).sort(([,a],[,b])=>b-a).slice(0,8).map(([proto,count]) => {
                const total = Object.values(protoCounts).reduce((s,v)=>s+v,0);
                const pct   = total>0?Math.round((count/total)*100):0;
                const color = PROTO_COLORS[proto]||'var(--text-secondary)';
                return (
                  <div key={proto}>
                    <div className="proto-row__labels">
                      <span className="proto-row__name" style={{color}}>{proto}</span>
                      <span className="proto-row__count">{count} ({pct}%)</span>
                    </div>
                    <div className="proto-row__track">
                      <div className="proto-row__fill" style={{width:`${pct}%`,background:color,boxShadow:`0 0 5px ${color}50`}}/>
                    </div>
                  </div>
                );
              })}
              {Object.keys(protoCounts).length===0 && <div style={{color:'var(--text-muted)',fontFamily:'var(--font-mono)',fontSize:12,textAlign:'center',paddingTop:20}}>Waiting for traffic...</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NetStat({ title, value, color, icon }) {
  return (
    <div className="cyber-card net-stat-card">
      <div className="net-stat-card__label">{title}</div>
      <div className="net-stat-card__row">
        <span className="net-stat-card__icon" style={{color}}>{icon}</span>
        <span className="net-stat-card__value" style={{color}}>{value}</span>
      </div>
    </div>
  );
}
