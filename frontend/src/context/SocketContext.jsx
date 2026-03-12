import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);
const SEV_ICON = { critical:'🔴', high:'🟠', medium:'🟡', low:'🔵' };

export function SocketProvider({ children }) {
  const [socket,        setSocket]        = useState(null);
  const [connected,     setConnected]     = useState(false);
  const [liveAlerts,    setLiveAlerts]    = useState([]);
  const [trafficData,   setTrafficData]   = useState(null);
  const [liveStats,     setLiveStats]     = useState({ totalRequests:0, blockedAttacks:0, criticalThreats:0, warnings:0 });
  const [attackHistory, setAttackHistory] = useState([]);

  useEffect(() => {
    const s = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      transports:['websocket','polling'], reconnectionAttempts:5
    });
    s.on('connect',    () => { setConnected(true);  s.emit('subscribe_alerts'); s.emit('subscribe_traffic'); });
    s.on('disconnect', () => setConnected(false));
    s.on('new_alert',  alert => {
      setLiveAlerts(p => [alert, ...p].slice(0,100));
      toast.custom(t => (
        <div style={{
          background:'var(--bg-card,#0d1f35)',
          border:`1px solid ${alert.severity==='critical'?'#ff2d55':alert.severity==='high'?'#ff7c00':'#ffd700'}`,
          borderRadius:'6px', padding:'12px 16px',
          display:'flex', alignItems:'center', gap:'10px',
          opacity: t.visible?1:0, transition:'opacity 0.3s', maxWidth:'360px'
        }}>
          <span style={{fontSize:'18px'}}>{SEV_ICON[alert.severity]||'⚠️'}</span>
          <div>
            <div style={{fontFamily:'Orbitron',fontSize:'11px',color:'#e0f4ff',letterSpacing:'1px'}}>
              {alert.type?.replace(/_/g,' ')}
            </div>
            <div style={{fontFamily:'Share Tech Mono',fontSize:'11px',color:'#7ab8d4',marginTop:'2px'}}>
              {alert.sourceIP} — {alert.country}
            </div>
          </div>
        </div>
      ), { duration: alert.severity==='critical'?6000:3500, position:'bottom-right' });
    });
    s.on('attack_detected', a => setAttackHistory(p => [a,...p].slice(0,300)));
    s.on('traffic_update',  d => setTrafficData(d));
    s.on('stats_update',    s2 => setLiveStats(s2));
    setSocket(s);
    return () => s.disconnect();
  }, []);

  const clearAlerts = useCallback(() => setLiveAlerts([]), []);

  return (
    <SocketContext.Provider value={{ socket, connected, liveAlerts, trafficData, liveStats, attackHistory, clearAlerts }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
