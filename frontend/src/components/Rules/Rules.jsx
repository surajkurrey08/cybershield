import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Header from '../Layout/Header';
import './Rules.css';

const BUILT_IN = [
  { id:'RULE_001', name:'SQL Injection',     severity:'critical', description:'Detects SQL injection payloads: OR 1=1, UNION SELECT, DROP TABLE, xp_cmdshell...' },
  { id:'RULE_002', name:'XSS Attack',        severity:'high',     description:'Cross-Site Scripting: <script>, javascript:, onerror=, document.cookie...' },
  { id:'RULE_003', name:'DDoS Flood',        severity:'critical', description:'Request rate > 1000 req/s — volumetric flood attack detection' },
  { id:'RULE_004', name:'Port Scan',         severity:'medium',   description:'Scan flag detected or more than 10 ports scanned from single source IP' },
  { id:'RULE_005', name:'Brute Force',       severity:'high',     description:'More than 5 consecutive failed login attempts from same IP' },
  { id:'RULE_006', name:'Dir Traversal',     severity:'high',     description:'Directory traversal: ../../../, ..\\..\\, %2e%2e%2f patterns' },
  { id:'RULE_007', name:'Cmd Injection',     severity:'critical', description:'OS command injection: ; ls, && cat, | whoami, `id`, $(id) patterns' },
  { id:'RULE_008', name:'Suspicious Port',   severity:'low',      description:'External access on sensitive ports: 22, 23, 3389, 1433, 3306, 27017...' },
  { id:'RULE_009', name:'CSRF',              severity:'medium',   description:'Cross-Site Request Forgery attempt detected via CSRF flag or suspicious referer' },
  { id:'RULE_010', name:'Malware Signature', severity:'critical', description:'Known malware signatures: MZ header, EICAR test string, shellcode patterns' },
];
const SEV_COLORS = { critical:'var(--severity-critical)', high:'var(--severity-high)', medium:'var(--severity-medium)', low:'var(--severity-low)' };
const EMPTY_FORM = { name:'', description:'', type:'', severity:'medium', conditions:{ payloadContains:'', ports:'', requestRate:'', failedLogins:'' } };

export default function Rules() {
  const { hasRole } = useAuth();
  const [tab,        setTab]        = useState('builtin');
  const [enabled,    setEnabled]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('cs_rules_enabled') || 'null') || Object.fromEntries(BUILT_IN.map(r=>[r.id,true])); }
    catch { return Object.fromEntries(BUILT_IN.map(r=>[r.id,true])); }
  });
  const [customRules, setCustomRules] = useState([]);
  const [form,        setForm]       = useState(EMPTY_FORM);
  const [loading,     setLoading]    = useState(false);

  const fetchCustom = useCallback(async () => {
    try {
      const res = await axios.get('/api/customrules');
      setCustomRules(res.data.data || []);
    } catch(e) {}
  }, []);

  useEffect(() => { fetchCustom(); }, [fetchCustom]);

  const toggleBuiltin = (id) => {
    const next = { ...enabled, [id]: !enabled[id] };
    setEnabled(next);
    localStorage.setItem('cs_rules_enabled', JSON.stringify(next));
    toast.success(`Rule ${id} ${next[id] ? 'enabled' : 'disabled'}`);
  };

  const toggleCustom = async (id) => {
    try {
      await axios.patch(`/api/customrules/${id}/toggle`);
      fetchCustom();
      toast.success('Rule updated');
    } catch(e) { toast.error('Failed'); }
  };

  const handleCreate = async e => {
    e.preventDefault();
    if (!form.name || !form.description || !form.type || !form.severity) return toast.error('All fields required');
    setLoading(true);
    try {
      const conditions = {};
      if (form.conditions.payloadContains) conditions.payloadContains = form.conditions.payloadContains.split(',').map(s=>s.trim()).filter(Boolean);
      if (form.conditions.ports)           conditions.ports           = form.conditions.ports.split(',').map(s=>parseInt(s.trim())).filter(Boolean);
      if (form.conditions.requestRate)     conditions.requestRate     = parseInt(form.conditions.requestRate);
      if (form.conditions.failedLogins)    conditions.failedLogins    = parseInt(form.conditions.failedLogins);
      await axios.post('/api/customrules', { ...form, conditions });
      toast.success(`Rule "${form.name}" created!`);
      setForm(EMPTY_FORM);
      fetchCustom();
    } catch(err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    try {
      await axios.delete(`/api/customrules/${id}`);
      toast.success(`Rule "${name}" deleted`);
      fetchCustom();
    } catch(e) { toast.error('Failed'); }
  };

  const activeBuiltin = Object.values(enabled).filter(Boolean).length;
  const activeCustom  = customRules.filter(r=>r.isActive).length;

  return (
    <div className="page">
      <Header title="DETECTION RULES" subtitle={`${activeBuiltin} built-in + ${activeCustom} custom rules active`}/>
      <div className="rules__content">

        {/* Summary */}
        <div className="rules__summary-grid">
          <SummaryCard title="BUILT-IN RULES"    value={BUILT_IN.length}        color="var(--accent-cyan)"  />
          <SummaryCard title="ACTIVE BUILT-IN"   value={activeBuiltin}          color="var(--accent-green)" />
          <SummaryCard title="CUSTOM RULES"      value={customRules.length}     color="var(--accent-purple)"/>
          <SummaryCard title="ACTIVE CUSTOM"     value={activeCustom}           color="var(--accent-yellow)"/>
        </div>

        {/* Tabs */}
        <div className="rules__tabs">
          <button className={`rules__tab ${tab==='builtin'?'active':''}`}   onClick={()=>setTab('builtin')}>BUILT-IN RULES ({BUILT_IN.length})</button>
          <button className={`rules__tab ${tab==='custom'?'active':''}`}    onClick={()=>setTab('custom')}>CUSTOM RULES ({customRules.length})</button>
          {hasRole('admin','analyst') && <button className={`rules__tab ${tab==='builder'?'active':''}`} onClick={()=>setTab('builder')}>+ CREATE RULE</button>}
        </div>

        {/* Built-in rules grid */}
        {tab === 'builtin' && (
          <div className="rules__grid">
            {BUILT_IN.map(rule => (
              <div key={rule.id} className={`cyber-card rule-card ${enabled[rule.id]?'':'disabled'}`}>
                <div className="rule-card__body">
                  <div className="rule-card__info">
                    <div className="rule-card__top">
                      <span className="rule-card__id">{rule.id}</span>
                      <span className={`badge badge-${rule.severity}`}>{rule.severity}</span>
                    </div>
                    <div className="rule-card__name">{rule.name}</div>
                    <div className="rule-card__desc">{rule.description}</div>
                    <div className="rule-card__status">
                      <span className={`rule-card__dot ${enabled[rule.id]?'on':'off'}`}/>
                      <span className="rule-card__status-text" style={{color:enabled[rule.id]?'var(--accent-green)':'var(--text-muted)'}}>
                        {enabled[rule.id]?'ACTIVE':'DISABLED'}
                      </span>
                    </div>
                  </div>
                  <div onClick={()=>toggleBuiltin(rule.id)} className={`toggle-track ${enabled[rule.id]?'on':'off'}`} style={{flexShrink:0,cursor:'pointer'}}>
                    <div className={`toggle-thumb ${enabled[rule.id]?'on':'off'}`}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom rules */}
        {tab === 'custom' && (
          <div className="rules__grid">
            {customRules.length === 0 ? (
              <div style={{gridColumn:'1/-1',textAlign:'center',padding:'60px',color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>
                No custom rules yet — click "Create Rule" to add one
              </div>
            ) : customRules.map(rule => (
              <div key={rule._id} className={`cyber-card rule-card ${rule.isActive?'':'disabled'}`}>
                <div className="rule-card__body">
                  <div className="rule-card__info">
                    <div className="rule-card__top">
                      <span className="rule-card__id">CUSTOM</span>
                      <span className={`badge badge-${rule.severity}`}>{rule.severity}</span>
                    </div>
                    <div className="rule-card__name">{rule.name}</div>
                    <div className="rule-card__desc">{rule.description}</div>
                    <div className="rule-card__desc" style={{marginTop:4}}>Type: <span style={{color:'var(--accent-cyan)'}}>{rule.type}</span> | By: {rule.createdBy}</div>
                    <div className="rule-card__status">
                      <span className={`rule-card__dot ${rule.isActive?'on':'off'}`}/>
                      <span className="rule-card__status-text" style={{color:rule.isActive?'var(--accent-green)':'var(--text-muted)'}}>
                        {rule.isActive?'ACTIVE':'DISABLED'}
                      </span>
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end'}}>
                    <div onClick={()=>toggleCustom(rule._id)} className={`toggle-track ${rule.isActive?'on':'off'}`} style={{cursor:'pointer'}}>
                      <div className={`toggle-thumb ${rule.isActive?'on':'off'}`}/>
                    </div>
                    {hasRole('admin') && (
                      <button className="cyber-btn cyber-btn-danger" style={{fontSize:10,padding:'4px 10px'}} onClick={()=>handleDelete(rule._id,rule.name)}>DELETE</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Builder */}
        {tab === 'builder' && hasRole('admin','analyst') && (
          <div className="cyber-card rules__builder">
            <div className="rules__builder-title">🔧 CREATE CUSTOM DETECTION RULE</div>
            <form onSubmit={handleCreate}>
              <div className="rules__builder-grid">
                <div>
                  <label className="cyber-label">Rule Name *</label>
                  <input className="cyber-input" placeholder="e.g. Log4Shell Exploit" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/>
                </div>
                <div>
                  <label className="cyber-label">Rule Type / ID *</label>
                  <input className="cyber-input" placeholder="e.g. LOG4SHELL" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}/>
                </div>
              </div>
              <div className="rules__builder-full">
                <label className="cyber-label">Description *</label>
                <input className="cyber-input" placeholder="What does this rule detect?" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/>
              </div>
              <div style={{marginBottom:12}}>
                <label className="cyber-label">Severity *</label>
                <div style={{display:'flex',gap:8}}>
                  {['critical','high','medium','low'].map(s=>(
                    <button type="button" key={s} onClick={()=>setForm(p=>({...p,severity:s}))}
                      style={{padding:'7px 14px',borderRadius:4,border:`1px solid ${form.severity===s?SEV_COLORS[s]:'var(--border-color)'}`,
                        background:form.severity===s?`${SEV_COLORS[s]}20`:'transparent',
                        color:form.severity===s?SEV_COLORS[s]:'var(--text-muted)',
                        fontFamily:'var(--font-mono)',fontSize:12,cursor:'pointer'}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rules__builder-section">DETECTION CONDITIONS (fill what applies)</div>
              <div className="rules__builder-grid">
                <div>
                  <label className="cyber-label">Payload Keywords (comma-separated)</label>
                  <input className="cyber-input" placeholder="jndi:, ${env., Log4j" value={form.conditions.payloadContains} onChange={e=>setForm(p=>({...p,conditions:{...p.conditions,payloadContains:e.target.value}}))}/>
                </div>
                <div>
                  <label className="cyber-label">Suspicious Ports (comma-separated)</label>
                  <input className="cyber-input" placeholder="4444, 1337, 31337" value={form.conditions.ports} onChange={e=>setForm(p=>({...p,conditions:{...p.conditions,ports:e.target.value}}))}/>
                </div>
                <div>
                  <label className="cyber-label">Request Rate Threshold</label>
                  <input className="cyber-input" type="number" placeholder="e.g. 500 req/s" value={form.conditions.requestRate} onChange={e=>setForm(p=>({...p,conditions:{...p.conditions,requestRate:e.target.value}}))}/>
                </div>
                <div>
                  <label className="cyber-label">Failed Login Threshold</label>
                  <input className="cyber-input" type="number" placeholder="e.g. 10 attempts" value={form.conditions.failedLogins} onChange={e=>setForm(p=>({...p,conditions:{...p.conditions,failedLogins:e.target.value}}))}/>
                </div>
              </div>
              <button className="cyber-btn cyber-btn-success" type="submit" disabled={loading} style={{width:'100%',padding:'12px',marginTop:8,fontSize:12}}>
                {loading ? 'CREATING...' : '✓ CREATE DETECTION RULE'}
              </button>
            </form>

            <div className="rules__info-box">
              <div className="rules__info-title">ℹ HOW RULES WORK</div>
              Payload Keywords: Traffic is flagged if payload contains any of these strings (case-insensitive)<br/>
              Ports: Traffic on these ports from external IPs is flagged<br/>
              Request Rate: Packets with requestRate above this threshold are flagged<br/>
              Failed Logins: Packets with failedLogins above this are flagged<br/>
              At least one condition must match for the rule to trigger
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, color }) {
  return (
    <div className="cyber-card rules__summary-card">
      <div className="rules__summary-label" style={{fontFamily:'var(--font-display)',fontSize:9,color:'var(--text-muted)',letterSpacing:2}}>{title}</div>
      <div style={{fontFamily:'var(--font-display)',fontSize:26,fontWeight:700,color,marginTop:6}}>{value}</div>
    </div>
  );
}
