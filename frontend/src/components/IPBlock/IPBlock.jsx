import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { useAuth }   from '../../context/AuthContext';
import Header from '../Layout/Header';
import { format } from 'date-fns';
import './IPBlock.css';

const SEV_COLORS = { critical:'var(--accent-red)',high:'var(--accent-orange)',medium:'var(--accent-yellow)',low:'var(--accent-cyan)' };

export default function IPBlock() {
  const { hasRole } = useAuth();
  const { socket }  = useSocket();
  const [blocked,  setBlocked]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [form, setForm] = useState({ ip:'', reason:'', severity:'medium', notes:'' });

  const fetchBlocked = useCallback(async () => {
    try {
      const res = await axios.get('/api/ipblock');
      setBlocked(res.data.data || []);
    } catch(e) { console.error(e); }
  }, []);

  useEffect(() => { fetchBlocked(); }, [fetchBlocked]);

  useEffect(() => {
    if (!socket) return;
    socket.on('ip_blocked',   b  => setBlocked(p => [b, ...p.filter(x=>x._id!==b._id)]));
    socket.on('ip_unblocked', b  => setBlocked(p => p.map(x => x._id===b._id ? b : x)));
    return () => { socket.off('ip_blocked'); socket.off('ip_unblocked'); };
  }, [socket]);

  const handleBlock = async e => {
    e.preventDefault();
    if (!form.ip || !form.reason) return toast.error('IP and reason required');
    setLoading(true);
    try {
      await axios.post('/api/ipblock', form);
      toast.success(`IP ${form.ip} blocked!`);
      setForm({ ip:'', reason:'', severity:'medium', notes:'' });
      fetchBlocked();
    } catch(err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleUnblock = async (id, ip) => {
    try {
      await axios.patch(`/api/ipblock/${id}/unblock`);
      toast.success(`IP ${ip} unblocked`);
      fetchBlocked();
    } catch(err) { toast.error('Failed to unblock'); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/ipblock/${id}`);
      toast.success('Removed from blocklist');
      fetchBlocked();
    } catch(err) { toast.error('Failed'); }
  };

  const active   = blocked.filter(b => b.isActive);
  const inactive = blocked.filter(b => !b.isActive);

  return (
    <div className="page">
      <Header title="IP FIREWALL" subtitle={`${active.length} active blocks — ${blocked.length} total rules`}/>
      <div className="ipblock__content">
        <div className="ipblock__top-grid">

          {/* Block Form */}
          {hasRole('admin','analyst') && (
            <div className="cyber-card ipblock__form-panel">
              <div className="ipblock__form-title">🚫 BLOCK NEW IP ADDRESS</div>
              <form onSubmit={handleBlock}>
                <div className="ipblock__form-grid">
                  <div>
                    <label className="cyber-label">IP Address</label>
                    <input className="cyber-input" placeholder="e.g. 192.168.1.1" value={form.ip} onChange={e=>setForm(p=>({...p,ip:e.target.value}))}/>
                  </div>
                  <div>
                    <label className="cyber-label">Severity</label>
                    <select className="cyber-select" style={{width:'100%'}} value={form.severity} onChange={e=>setForm(p=>({...p,severity:e.target.value}))}>
                      {['critical','high','medium','low'].map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="ipblock__form-full">
                  <label className="cyber-label">Reason</label>
                  <input className="cyber-input" placeholder="e.g. Repeated SQL injection attempts" value={form.reason} onChange={e=>setForm(p=>({...p,reason:e.target.value}))}/>
                </div>
                <div className="ipblock__form-full">
                  <label className="cyber-label">Notes (optional)</label>
                  <input className="cyber-input" placeholder="Additional details..." value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
                </div>
                <button className="cyber-btn cyber-btn-danger" type="submit" disabled={loading} style={{width:'100%',padding:'10px',marginTop:4}}>
                  {loading ? 'BLOCKING...' : '🚫 BLOCK IP'}
                </button>
              </form>
            </div>
          )}

          {/* Stats */}
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {[
              { label:'ACTIVE BLOCKS',   value:active.length,   color:'var(--accent-red)' },
              { label:'AUTO-BLOCKED',    value:blocked.filter(b=>b.autoBlocked&&b.isActive).length, color:'var(--accent-purple)' },
              { label:'MANUAL BLOCKS',   value:blocked.filter(b=>!b.autoBlocked&&b.isActive).length, color:'var(--accent-orange)' },
              { label:'TOTAL ENTRIES',   value:blocked.length,  color:'var(--accent-cyan)' },
            ].map(s => (
              <div key={s.label} className="cyber-card stat-card">
                <div className="stat-card__label">{s.label}</div>
                <div className="stat-card__value" style={{color:s.color}}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Blocked IP List */}
        <div className="cyber-card ipblock__list-panel">
          <div className="ipblock__list-title">
            <span className="pulse-dot pulse-dot-red"/> ACTIVE BLOCKED IPs ({active.length})
          </div>
          <div className="ipblock__list">
            {active.length === 0 ? (
              <div className="ipblock__empty">No IPs currently blocked</div>
            ) : active.map(b => (
              <div key={b._id} className={`ip-card ${b.autoBlocked?'auto':''}`}>
                <div className="ip-card__ip">{b.ip}</div>
                <span className={`badge badge-${b.severity}`}>{b.severity}</span>
                {b.autoBlocked && <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--accent-purple)'}}>AUTO</span>}
                <div className="ip-card__reason">{b.reason}</div>
                <div className="ip-card__meta">
                  <div>{b.country||'Unknown'}</div>
                  <div>by {b.blockedBy}</div>
                  <div>{format(new Date(b.createdAt),'MM/dd HH:mm')}</div>
                </div>
                {hasRole('admin','analyst') && (
                  <div className="ip-card__actions">
                    <button className="cyber-btn cyber-btn-success" style={{fontSize:10,padding:'5px 10px'}} onClick={()=>handleUnblock(b._id,b.ip)}>UNBLOCK</button>
                    {hasRole('admin') && <button className="cyber-btn cyber-btn-danger" style={{fontSize:10,padding:'5px 10px'}} onClick={()=>handleDelete(b._id)}>DELETE</button>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {inactive.length > 0 && (
            <>
              <div style={{fontFamily:'var(--font-display)',fontSize:10,color:'var(--text-muted)',letterSpacing:2,margin:'20px 0 12px'}}>UNBLOCKED HISTORY ({inactive.length})</div>
              <div className="ipblock__list">
                {inactive.slice(0,5).map(b => (
                  <div key={b._id} className="ip-card" style={{opacity:0.5}}>
                    <div className="ip-card__ip">{b.ip}</div>
                    <span className={`badge badge-${b.severity}`}>{b.severity}</span>
                    <div className="ip-card__reason">{b.reason}</div>
                    <div className="ip-card__meta" style={{marginLeft:'auto'}}>unblocked</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
