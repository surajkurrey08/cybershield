import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useAuth }   from '../../context/AuthContext';
import { useTheme }  from '../../context/ThemeContext';
import './Sidebar.css';

const NAV = [
  { section:'MONITOR' },
  { path:'/',         icon:'⬡', label:'Dashboard',       exact:true },
  { path:'/network',  icon:'◈', label:'Network Traffic' },
  { path:'/capture',  icon:'📡', label:'Real Capture' },
  { path:'/alerts',   icon:'◉', label:'Threat Alerts',  badge:true },
  { path:'/logs',     icon:'≡', label:'Attack Logs' },
  { path:'/geomap',   icon:'🌐', label:'Geo Map' },
  { section:'MANAGE' },
  { path:'/ipblock',  icon:'🚫', label:'IP Firewall' },
  { path:'/rules',    icon:'◆', label:'Detection Rules' },
  { section:'ADMIN',  adminOnly:true },
  { path:'/users',    icon:'👥', label:'User Management', adminOnly:true },
];

export default function Sidebar() {
  const { connected, liveAlerts } = useSocket();
  const { user, logout, hasRole } = useAuth();
  const { theme, toggleTheme }    = useTheme();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const activeAlerts = liveAlerts.filter(a => a.status === 'active').length;

  return (
    <>
      {/* Mobile toggle */}
      <button className="sidebar__toggle" onClick={() => setOpen(o => !o)}>☰</button>

      <aside className={`sidebar ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
        {/* Logo */}
        <div className="sidebar__logo">
          <div className="sidebar__logo-row">
            <div className="sidebar__logo-icon">🛡</div>
            <div>
              <div className="sidebar__logo-text-top">CYBER</div>
              <div className="sidebar__logo-text-bot">SHIELD</div>
            </div>
            {/* Theme toggle */}
            <button onClick={e => { e.stopPropagation(); toggleTheme(); }} style={{
              marginLeft:'auto', background:'transparent', border:'1px solid var(--border-color)',
              borderRadius:'4px', padding:'4px 8px', cursor:'pointer', color:'var(--text-secondary)', fontSize:'14px'
            }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
          </div>
          <div className="sidebar__status">
            <span className={`pulse-dot ${connected ? 'pulse-dot-green' : 'pulse-dot-red'}`} />
            <span className={`sidebar__status-text ${connected ? 'online' : 'offline'}`}>
              {connected ? 'SYSTEM ONLINE' : 'RECONNECTING...'}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar__nav">
          {NAV.map((item, i) => {
            if (item.section) {
              if (item.adminOnly && !hasRole('admin')) return null;
              return <div key={i} className="sidebar__nav-section">{item.section}</div>;
            }
            if (item.adminOnly && !hasRole('admin')) return null;
            const isActive = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <NavLink key={item.path} to={item.path} className="sidebar__nav-link">
                <div className={`sidebar__nav-item ${isActive ? 'active' : ''}`}>
                  <span className="sidebar__nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && activeAlerts > 0 && (
                    <span className="sidebar__nav-badge">{activeAlerts > 99 ? '99+' : activeAlerts}</span>
                  )}
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* User info */}
        {user && (
          <div className="sidebar__user">
            <div className="sidebar__user-avatar">
              {user.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="sidebar__user-name">{user.username}</div>
              <div className="sidebar__user-role">{user.role?.toUpperCase()}</div>
            </div>
            <button className="sidebar__logout-btn" onClick={logout} title="Logout">⏻</button>
          </div>
        )}
      </aside>
    </>
  );
}
