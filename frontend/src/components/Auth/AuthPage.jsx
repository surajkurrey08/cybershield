import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [tab,      setTab]      = useState('login');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [form,     setForm]     = useState({ username:'', email:'', password:'', confirmPassword:'', role:'analyst' });

  const set = (k, v) => { setForm(p => ({...p, [k]:v})); setError(''); };

  const handleLogin = async e => {
    e.preventDefault();
    if (!form.username || !form.password) return setError('Username and password required');
    setLoading(true);
    try {
      await login(form.username, form.password);
    } catch(err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleRegister = async e => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) return setError('All fields required');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register({ username:form.username, email:form.email, password:form.password, role:form.role });
    } catch(err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <span className="auth-logo-icon">🛡️</span>
          <div className="auth-logo-title">CYBERSHIELD</div>
          <div className="auth-logo-sub">ATTACK DETECTION SYSTEM v2.0</div>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${tab==='login'?'active':''}`} onClick={() => { setTab('login'); setError(''); }}>
            LOGIN
          </button>
          <button className={`auth-tab ${tab==='register'?'active':''}`} onClick={() => { setTab('register'); setError(''); }}>
            REGISTER
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {/* Login Form */}
        {tab === 'login' && (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-field">
              <label className="cyber-label">Username / Email</label>
              <div className="auth-input-wrap">
                <span className="auth-icon">◈</span>
                <input className="cyber-input" placeholder="admin" value={form.username}
                  onChange={e => set('username', e.target.value)} autoComplete="username" />
              </div>
            </div>
            <div className="auth-field">
              <label className="cyber-label">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-icon">◉</span>
                <input className="cyber-input" type="password" placeholder="••••••••" value={form.password}
                  onChange={e => set('password', e.target.value)} autoComplete="current-password" />
              </div>
            </div>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'AUTHENTICATING...' : 'ACCESS SYSTEM'}
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="auth-field">
              <label className="cyber-label">Username</label>
              <div className="auth-input-wrap">
                <span className="auth-icon">◈</span>
                <input className="cyber-input" placeholder="john_analyst" value={form.username}
                  onChange={e => set('username', e.target.value)} />
              </div>
            </div>
            <div className="auth-field">
              <label className="cyber-label">Email</label>
              <div className="auth-input-wrap">
                <span className="auth-icon">@</span>
                <input className="cyber-input" type="email" placeholder="user@company.io" value={form.email}
                  onChange={e => set('email', e.target.value)} />
              </div>
            </div>
            <div className="auth-field">
              <label className="cyber-label">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-icon">◉</span>
                <input className="cyber-input" type="password" placeholder="Min 6 characters" value={form.password}
                  onChange={e => set('password', e.target.value)} />
              </div>
            </div>
            <div className="auth-field">
              <label className="cyber-label">Confirm Password</label>
              <div className="auth-input-wrap">
                <span className="auth-icon">◉</span>
                <input className="cyber-input" type="password" placeholder="Repeat password" value={form.confirmPassword}
                  onChange={e => set('confirmPassword', e.target.value)} />
              </div>
            </div>
            <div className="auth-field">
              <label className="cyber-label">Role</label>
              <div className="auth-role-grid">
                {['admin','analyst','viewer'].map(r => (
                  <button type="button" key={r} className={`auth-role-btn ${form.role===r?'selected':''}`}
                    onClick={() => set('role', r)}>
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </button>
          </form>
        )}

        {/* Demo hint */}
        <div className="auth-demo-hint">
          Default admin: <span>admin</span> / <span>Admin@1234</span><br/>
          Run <span>npm run seed</span> to create demo users
        </div>

      </div>
    </div>
  );
}
