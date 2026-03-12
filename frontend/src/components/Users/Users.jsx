import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Header from '../Layout/Header';
import { format } from 'date-fns';
import './Users.css';

const ROLE_COLORS = { admin:'var(--accent-purple)', analyst:'var(--accent-cyan)', viewer:'var(--text-muted)' };
const EMPTY_FORM  = { username:'', email:'', password:'', role:'analyst' };

export default function Users() {
  const { user: me, hasRole } = useAuth();
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [activityUser, setActivityUser] = useState(null);
  const [activity,  setActivity]  = useState([]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data.data || []);
    } catch(e) { toast.error('Could not load users'); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async e => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) return toast.error('All fields required');
    setLoading(true);
    try {
      await axios.post('/api/users', form);
      toast.success(`User "${form.username}" created!`);
      setForm(EMPTY_FORM);
      fetchUsers();
    } catch(err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleToggleActive = async (id, isActive, username) => {
    try {
      await axios.patch(`/api/users/${id}`, { isActive: !isActive });
      toast.success(`${username} ${!isActive?'activated':'deactivated'}`);
      fetchUsers();
    } catch(err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleChangeRole = async (id, role, username) => {
    try {
      await axios.patch(`/api/users/${id}`, { role });
      toast.success(`${username} role → ${role}`);
      fetchUsers();
    } catch(err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/users/${id}`);
      toast.success(`User "${username}" deleted`);
      fetchUsers();
    } catch(err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const loadActivity = async (id, username) => {
    try {
      const res = await axios.get(`/api/users/${id}/activity`);
      setActivity(res.data.data || []);
      setActivityUser(username);
    } catch(e) { toast.error('Could not load activity'); }
  };

  if (!hasRole('admin')) {
    return (
      <div className="page">
        <Header title="USER MANAGEMENT" subtitle="Admin access required"/>
        <div style={{padding:60,textAlign:'center',fontFamily:'var(--font-mono)',color:'var(--accent-red)'}}>
          🔒 Admin role required to access this page
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Header title="USER MANAGEMENT" subtitle={`${users.length} total users — ${users.filter(u=>u.isActive).length} active`}/>
      <div className="users__content">
        <div className="users__top-grid">

          {/* Create User Form */}
          <div className="cyber-card users__form-panel">
            <div className="users__form-title">+ CREATE NEW USER</div>
            <form onSubmit={handleCreate}>
              <div className="users__form-grid">
                <div>
                  <label className="cyber-label">Username *</label>
                  <input className="cyber-input" placeholder="john_analyst" value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value}))}/>
                </div>
                <div>
                  <label className="cyber-label">Email *</label>
                  <input className="cyber-input" type="email" placeholder="user@company.io" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/>
                </div>
              </div>
              <div className="users__form-full">
                <label className="cyber-label">Password *</label>
                <input className="cyber-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}/>
              </div>
              <div className="users__form-full">
                <label className="cyber-label">Role</label>
                <div style={{display:'flex',gap:8}}>
                  {['admin','analyst','viewer'].map(r => (
                    <button type="button" key={r} onClick={()=>setForm(p=>({...p,role:r}))}
                      style={{padding:'8px 14px',borderRadius:4,border:`1px solid ${form.role===r?ROLE_COLORS[r]:'var(--border-color)'}`,
                        background:form.role===r?'rgba(0,212,255,0.08)':'transparent',
                        color:form.role===r?ROLE_COLORS[r]:'var(--text-muted)',
                        fontFamily:'var(--font-mono)',fontSize:12,cursor:'pointer',flex:1}}>
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <button className="cyber-btn cyber-btn-primary" type="submit" disabled={loading} style={{width:'100%',padding:'10px',marginTop:4}}>
                {loading ? 'CREATING...' : '+ CREATE USER'}
              </button>
            </form>
          </div>

          {/* Stats */}
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {[
              { label:'TOTAL USERS',  value:users.length,                              color:'var(--accent-cyan)'   },
              { label:'ADMINS',       value:users.filter(u=>u.role==='admin').length,   color:'var(--accent-purple)' },
              { label:'ANALYSTS',     value:users.filter(u=>u.role==='analyst').length, color:'var(--accent-cyan)'   },
              { label:'VIEWERS',      value:users.filter(u=>u.role==='viewer').length,  color:'var(--text-muted)'    },
            ].map(s => (
              <div key={s.label} className="cyber-card stat-card">
                <div className="stat-card__label">{s.label}</div>
                <div className="stat-card__value" style={{color:s.color,fontSize:22}}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* User List */}
        <div className="cyber-card users__list-panel">
          <div className="users__list-title">ALL USERS</div>
          {users.map(u => (
            <div key={u._id} className={`user-card ${u.isActive?'':'inactive'}`}>
              <div className="user-card__avatar">{u.username?.[0]?.toUpperCase()}</div>
              <div style={{flex:1,minWidth:0}}>
                <div className="user-card__name">
                  {u.username}
                  {u._id === me?._id && <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--accent-green)',marginLeft:8}}>(you)</span>}
                </div>
                <div className="user-card__email">{u.email}</div>
                <div className="user-card__meta">
                  <span className="user-card__meta-item">Logins: {u.loginCount||0}</span>
                  <span className="user-card__meta-item">Last: {u.lastLogin?format(new Date(u.lastLogin),'MM/dd HH:mm'):'Never'}</span>
                  <span className="user-card__meta-item">Created: {format(new Date(u.createdAt),'MM/dd/yyyy')}</span>
                </div>
              </div>

              <span className={`badge badge-${u.role}`}>{u.role}</span>
              <span style={{fontFamily:'var(--font-mono)',fontSize:11,color:u.isActive?'var(--accent-green)':'var(--accent-red)'}}>
                {u.isActive?'●  ACTIVE':'○  INACTIVE'}
              </span>

              {u._id !== me?._id && (
                <div className="user-card__actions">
                  <select className="cyber-select" style={{fontSize:11,padding:'5px 8px'}} value={u.role} onChange={e=>handleChangeRole(u._id,e.target.value,u.username)}>
                    {['admin','analyst','viewer'].map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                  <button className="cyber-btn cyber-btn-primary" style={{fontSize:10,padding:'5px 10px'}} onClick={()=>loadActivity(u._id,u.username)}>LOGS</button>
                  <button className={`cyber-btn ${u.isActive?'cyber-btn-warning':'cyber-btn-success'}`} style={{fontSize:10,padding:'5px 10px'}} onClick={()=>handleToggleActive(u._id,u.isActive,u.username)}>
                    {u.isActive?'DEACTIVATE':'ACTIVATE'}
                  </button>
                  <button className="cyber-btn cyber-btn-danger" style={{fontSize:10,padding:'5px 10px'}} onClick={()=>handleDelete(u._id,u.username)}>DELETE</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Activity Log Modal */}
        {activityUser && (
          <div className="cyber-card activity__panel">
            <div className="activity__title" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span>ACTIVITY LOG — {activityUser}</span>
              <button className="cyber-btn cyber-btn-primary" style={{fontSize:10}} onClick={()=>setActivityUser(null)}>CLOSE</button>
            </div>
            {activity.length === 0 ? (
              <div style={{color:'var(--text-muted)',fontFamily:'var(--font-mono)',fontSize:12}}>No activity recorded</div>
            ) : (
              <div style={{maxHeight:300,overflowY:'auto'}}>
                <table className="cyber-table">
                  <thead><tr><th>TIME</th><th>ACTION</th><th>DETAILS</th><th>IP</th></tr></thead>
                  <tbody>
                    {activity.map((a,i) => (
                      <tr key={i}>
                        <td className="text-muted">{format(new Date(a.timestamp),'MM/dd HH:mm:ss')}</td>
                        <td style={{color:'var(--accent-cyan)'}}>{a.action}</td>
                        <td className="text-secondary">{a.details}</td>
                        <td className="text-muted">{a.ip||'-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
