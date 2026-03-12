import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import Header from '../Layout/Header';
import { format } from 'date-fns';
import './Alerts.css';

const ICONS = { SQL_INJECTION:'💉',XSS:'📜',DDOS:'🌊',PORT_SCAN:'🔍',BRUTE_FORCE:'🔨',DIR_TRAVERSAL:'📂',CMD_INJECTION:'💻',SUSPICIOUS_PORT:'🚪',CSRF:'🎭',MALWARE:'🦠' };
const SEV_ORDER = { critical:0,high:1,medium:2,low:3 };

export default function Alerts() {
  const { liveAlerts, clearAlerts } = useSocket();
  const [statusF, setStatusF]   = useState('all');
  const [sevF,    setSevF]      = useState('all');
  const [acked,   setAcked]     = useState(new Set());

  const filtered = liveAlerts
    .filter(a => {
      if (statusF==='active') return !acked.has(a.id);
      if (statusF==='acknowledged') return acked.has(a.id);
      return true;
    })
    .filter(a => sevF==='all' || a.severity===sevF)
    .sort((a,b) => (SEV_ORDER[a.severity]-SEV_ORDER[b.severity]) || (new Date(b.timestamp)-new Date(a.timestamp)));

  const critCount = liveAlerts.filter(a => a.severity==='critical' && !acked.has(a.id)).length;
  const highCount = liveAlerts.filter(a => a.severity==='high'     && !acked.has(a.id)).length;

  return (
    <div className="page">
      <Header title="THREAT ALERTS" subtitle={`${liveAlerts.length} total — ${critCount} critical unacknowledged`}/>
      <div className="alerts__content">
        {critCount > 0 && (
          <div className="alerts__critical-banner">
            <span style={{fontSize:'20px'}}>🚨</span>
            <div>
              <div className="alerts__banner-title">CRITICAL ALERT — IMMEDIATE ACTION REQUIRED</div>
              <div className="alerts__banner-sub">{critCount} critical + {highCount} high unacknowledged</div>
            </div>
          </div>
        )}
        <div className="alerts__controls">
          {[['all',`All (${liveAlerts.length})`],['active',`Active (${liveAlerts.length-acked.size})`],['acknowledged',`Acked (${acked.size})`]].map(([v,l]) => (
            <button key={v} className={`filter-btn ${statusF===v?'active':'inactive'}`} onClick={() => setStatusF(v)}>{l}</button>
          ))}
          <div className="alerts__controls-right">
            <select className="cyber-select" value={sevF} onChange={e => setSevF(e.target.value)}>
              <option value="all">All Severities</option>
              {['critical','high','medium','low'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="cyber-btn cyber-btn-danger" onClick={clearAlerts}>CLEAR ALL</button>
          </div>
        </div>
        <div className="alerts__list">
          {filtered.length === 0 ? (
            <div className="cyber-card alerts__empty">
              <div className="alerts__empty-icon">✓</div>
              <div className="alerts__empty-title">NO ACTIVE THREATS</div>
              <div className="alerts__empty-sub">All clear — monitoring active</div>
            </div>
          ) : filtered.map((alert,i) => (
            <AlertCard key={alert.id||i} alert={alert} isNew={i<3}
              isAcked={acked.has(alert.id)}
              onAck={() => setAcked(p => new Set([...p, alert.id]))}/>
          ))}
        </div>
      </div>
    </div>
  );
}

function AlertCard({ alert, isNew, isAcked, onAck }) {
  const [expanded, setExpanded] = useState(false);
  const bc = { critical:'rgba(255,45,85,0.45)', high:'rgba(255,124,0,0.45)', medium:'rgba(255,215,0,0.3)', low:'rgba(0,212,255,0.3)' }[alert.severity] || 'var(--border-color)';
  return (
    <div className={`alert-card ${isNew&&!isAcked?'alert-new':''}`} style={{ border:`1px solid ${bc}`, opacity:isAcked?0.5:1 }}>
      <div className="alert-card__body">
        <div className="alert-card__emoji">{ICONS[alert.type]||'⚠️'}</div>
        <div className="alert-card__info">
          <div className="alert-card__title-row">
            <span className="alert-card__type">{alert.type?.replace(/_/g,' ')}</span>
            <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
            {alert.ruleTriggered && <span className="alert-card__rule">[{alert.ruleTriggered}]</span>}
            {isAcked && <span className="alert-card__ack">✓ acknowledged</span>}
          </div>
          <p className="alert-card__desc">{alert.description}</p>
          <div className="alert-card__meta">
            <InfoItem label="SOURCE"   value={alert.sourceIP} color="var(--accent-orange)"/>
            <InfoItem label="COUNTRY"  value={alert.country}/>
            <InfoItem label="PORT"     value={alert.port}/>
            <InfoItem label="PROTOCOL" value={alert.protocol}/>
            <InfoItem label="TIME"     value={alert.timestamp ? format(new Date(alert.timestamp),'HH:mm:ss') : '-'} color="var(--text-muted)"/>
          </div>
        </div>
        <div className="alert-card__actions">
          {!isAcked && <button className="cyber-btn cyber-btn-success" onClick={onAck}>ACK</button>}
          <button className="cyber-btn cyber-btn-primary" onClick={() => setExpanded(!expanded)}>{expanded?'LESS':'MORE'}</button>
        </div>
      </div>
      {expanded && (
        <div className="alert-card__detail">
          <div>ID: <span style={{color:'var(--accent-cyan)'}}>{alert.id}</span></div>
          <div>Rule: <span style={{color:'var(--accent-yellow)'}}>{alert.ruleTriggered}</span></div>
          <div>Timestamp: <span style={{color:'var(--text-primary)'}}>{alert.timestamp ? format(new Date(alert.timestamp),'yyyy-MM-dd HH:mm:ss') : '-'}</span></div>
          <div>Status: <span style={{color:isAcked?'var(--accent-green)':'var(--accent-red)'}}>{isAcked?'ACKNOWLEDGED':'ACTIVE'}</span></div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value, color='var(--text-secondary)' }) {
  return (
    <div>
      <div className="info-item__label">{label}</div>
      <div className="info-item__value" style={{color}}>{value||'-'}</div>
    </div>
  );
}
