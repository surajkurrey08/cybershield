import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import Header from '../Layout/Header';
import './Dashboard.css';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format } from 'date-fns';

const ATTACK_COLORS = {
  SQL_INJECTION:'#ff2d55', XSS:'#ff7c00', DDOS:'#a855f7',
  PORT_SCAN:'#00d4ff', BRUTE_FORCE:'#ffd700', DIR_TRAVERSAL:'#ff6b9d',
  CMD_INJECTION:'#ff4500', SUSPICIOUS_PORT:'#00ff9d', CSRF:'#4fc3f7', MALWARE:'#e040fb'
};
const PIE_COLORS = ['#ff2d55','#ff7c00','#a855f7','#00d4ff','#ffd700','#00ff9d','#4fc3f7','#e040fb'];

const CTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="recharts-tooltip">
      <p style={{ color:'var(--text-secondary)', marginBottom:4 }}>{label}</p>
      {payload.map((p,i) => <p key={i} style={{ color:p.color }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function Dashboard() {
  const { liveStats, attackHistory, trafficData } = useSocket();
  const [trafficHist,  setTrafficHist]  = useState([]);
  const [typeCounts,   setTypeCounts]   = useState({});
  const [recentAttacks,setRecentAttacks]= useState([]);

  useEffect(() => {
    if (!trafficData) return;
    setTrafficHist(prev => [...prev, {
      time:     format(new Date(),'HH:mm:ss'),
      inbound:  trafficData.bandwidth?.inbound  || 0,
      outbound: trafficData.bandwidth?.outbound || 0,
      conns:    trafficData.connections?.active || 0,
      attacks:  trafficData.packets?.filter(p=>p.isAttack).length || 0
    }].slice(-30));
  }, [trafficData]);

  useEffect(() => {
    if (!attackHistory.length) return;
    const counts = {};
    attackHistory.forEach(a => { counts[a.type] = (counts[a.type]||0)+1; });
    setTypeCounts(counts);
    setRecentAttacks(attackHistory.slice(0,10));
  }, [attackHistory]);

  const pieData = Object.entries(typeCounts).map(([name,value]) => ({ name, value }));

  return (
    <div className="page">
      <Header title="SECURITY DASHBOARD" subtitle={`${attackHistory.length} threats detected this session`} />
      <div className="dashboard__content">

        {/* Stat Cards */}
        <div className="dashboard__stat-grid">
          <StatCard title="TOTAL PACKETS"   value={liveStats.totalRequests?.toLocaleString()||'0'} icon="◎" color="var(--accent-cyan)"   sub="analyzed" />
          <StatCard title="THREATS BLOCKED" value={liveStats.blockedAttacks?.toLocaleString()||'0'} icon="🛡" color="var(--accent-green)"  sub="neutralized" />
          <StatCard title="CRITICAL"        value={liveStats.criticalThreats?.toLocaleString()||'0'} icon="⚠" color="var(--accent-red)"    sub="require action" pulse={liveStats.criticalThreats>0} />
          <StatCard title="SESSION ATTACKS" value={attackHistory.length}                             icon="◉" color="var(--accent-yellow)" sub="this session" />
        </div>

        {/* Row 1 */}
        <div className="dashboard__charts-row1">
          <div className="cyber-card chart-panel">
            <div className="chart-title">NETWORK TRAFFIC — REAL TIME</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trafficHist}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,58,92,0.4)"/>
                <XAxis dataKey="time" tick={{fill:'var(--text-muted)',fontSize:9,fontFamily:'Share Tech Mono'}} interval={4}/>
                <YAxis tick={{fill:'var(--text-muted)',fontSize:10}}/>
                <Tooltip content={<CTooltip/>}/>
                <Legend wrapperStyle={{fontFamily:'Share Tech Mono',fontSize:11,color:'var(--text-secondary)'}}/>
                <Area type="monotone" dataKey="inbound"  name="Inbound (Mbps)"  stroke="#00d4ff" fill="url(#g1)" strokeWidth={2}/>
                <Area type="monotone" dataKey="outbound" name="Outbound (Mbps)" stroke="#a855f7" fill="url(#g2)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="cyber-card chart-panel">
            <div className="chart-title">ATTACK DISTRIBUTION</div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {pieData.map((e,i) => <Cell key={i} fill={ATTACK_COLORS[e.name]||PIE_COLORS[i%PIE_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip content={<CTooltip/>}/>
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="chart-empty">Waiting for data...</div>}
          </div>
        </div>

        {/* Row 2 */}
        <div className="dashboard__charts-row2">
          <div className="cyber-card chart-panel">
            <div className="chart-title">ATTACK RATE PER CYCLE</div>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={trafficHist.slice(-15)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,58,92,0.4)"/>
                <XAxis dataKey="time" tick={{fill:'var(--text-muted)',fontSize:9}} interval={2}/>
                <YAxis tick={{fill:'var(--text-muted)',fontSize:10}}/>
                <Tooltip content={<CTooltip/>}/>
                <Bar dataKey="attacks" name="Attacks" fill="#ff2d55" radius={[2,2,0,0]} fillOpacity={0.85}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="cyber-card chart-panel">
            <div className="chart-title">ACTIVE CONNECTIONS</div>
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={trafficHist}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,58,92,0.4)"/>
                <XAxis dataKey="time" tick={{fill:'var(--text-muted)',fontSize:9}} interval={4}/>
                <YAxis tick={{fill:'var(--text-muted)',fontSize:10}}/>
                <Tooltip content={<CTooltip/>}/>
                <Line type="monotone" dataKey="conns" name="Connections" stroke="#00ff9d" strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Attacks */}
        <div className="cyber-card dashboard__attacks-panel">
          <div className="chart-title">RECENT THREAT ACTIVITY</div>
          {recentAttacks.length > 0 ? (
            <div style={{overflowX:'auto'}}>
              <table className="cyber-table">
                <thead><tr>
                  <th>TIME</th><th>TYPE</th><th>SEVERITY</th>
                  <th>SOURCE IP</th><th>COUNTRY</th><th>PORT</th><th>RULE</th>
                </tr></thead>
                <tbody>
                  {recentAttacks.map((a,i) => (
                    <tr key={a.id||i} className={i===0?'alert-new':''}>
                      <td className="text-muted">{a.timestamp ? format(new Date(a.timestamp),'HH:mm:ss') : '-'}</td>
                      <td style={{color:ATTACK_COLORS[a.type]||'var(--accent-cyan)',fontWeight:600}}>{a.type?.replace(/_/g,' ')}</td>
                      <td><span className={`badge badge-${a.severity}`}>{a.severity}</span></td>
                      <td style={{color:'var(--accent-orange)'}}>{a.sourceIP}</td>
                      <td className="text-muted">{a.country||'-'}</td>
                      <td>{a.port}</td>
                      <td className="text-muted" style={{fontSize:'10px'}}>{a.ruleTriggered}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dashboard__empty">
              <div className="dashboard__empty-icon">◎</div>
              Monitoring active — no threats yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, sub, pulse }) {
  return (
    <div className="cyber-card stat-card fade-in-up">
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div>
          <div className="stat-card__label">{title}</div>
          <div className="stat-card__value" style={{color, textShadow:`0 0 18px ${color}50`, animation:pulse?'pulse-dot 1s infinite':'none'}}>{value}</div>
          <div className="stat-card__sub">{sub}</div>
        </div>
        <div className="stat-card__icon" style={{filter:`drop-shadow(0 0 6px ${color})`}}>{icon}</div>
      </div>
    </div>
  );
}
