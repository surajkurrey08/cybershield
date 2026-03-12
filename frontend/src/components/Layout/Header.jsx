import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import './Header.css';

export default function Header({ title, subtitle }) {
  const { liveStats } = useSocket();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="header">
      <div className="header__left">
        <h1 className="header__title">{title}</h1>
        {subtitle && <p className="header__subtitle">{subtitle}</p>}
      </div>
      <div className="header__right">
        <div className="header__stats">
          <StatPill label="BLOCKED"  value={liveStats.blockedAttacks}  color="var(--accent-green)" />
          <StatPill label="CRITICAL" value={liveStats.criticalThreats} color="var(--accent-red)"   />
          <StatPill label="WARNINGS" value={liveStats.warnings}        color="var(--accent-yellow)"/>
        </div>
        <div className="header__clock">
          {time.toLocaleTimeString('en-US', { hour12: false })}
        </div>
      </div>
    </header>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div className="stat-pill">
      <div className="stat-pill__value" style={{ color }}>{value?.toLocaleString() || '0'}</div>
      <div className="stat-pill__label">{label}</div>
    </div>
  );
}
