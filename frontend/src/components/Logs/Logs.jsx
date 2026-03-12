import React, { useState, useEffect } from 'react';

const LEVELS = ['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'];

const levelColor = {
  INFO:  'var(--accent-cyan, #00e5ff)',
  WARN:  '#f59e0b',
  ERROR: '#ef4444',
  DEBUG: '#a78bfa',
};

const mockLogs = [
  { id: 1,  timestamp: '2026-03-12 18:01:01', level: 'INFO',  source: '192.168.1.10', message: 'Connection established' },
  { id: 2,  timestamp: '2026-03-12 18:01:05', level: 'WARN',  source: '10.0.0.5',     message: 'High packet rate detected' },
  { id: 3,  timestamp: '2026-03-12 18:01:10', level: 'ERROR', source: '203.0.113.42', message: 'Unauthorized access attempt blocked' },
  { id: 4,  timestamp: '2026-03-12 18:01:15', level: 'DEBUG', source: '192.168.1.1',  message: 'DNS query resolved' },
  { id: 5,  timestamp: '2026-03-12 18:01:20', level: 'INFO',  source: '192.168.1.22', message: 'User login successful' },
  { id: 6,  timestamp: '2026-03-12 18:01:25', level: 'ERROR', source: '198.51.100.9', message: 'Port scan detected from external IP' },
  { id: 7,  timestamp: '2026-03-12 18:01:30', level: 'WARN',  source: '10.0.0.8',     message: 'SSL certificate expiring soon' },
  { id: 8,  timestamp: '2026-03-12 18:01:35', level: 'INFO',  source: '192.168.1.5',  message: 'Firewall rule updated' },
  { id: 9,  timestamp: '2026-03-12 18:01:40', level: 'DEBUG', source: '192.168.1.15', message: 'Packet inspection complete' },
  { id: 10, timestamp: '2026-03-12 18:01:45', level: 'ERROR', source: '203.0.113.77', message: 'Brute force attack mitigated' },
];

const Logs = () => {
  const [logs, setLogs]           = useState(mockLogs);
  const [filter, setFilter]       = useState('ALL');
  const [search, setSearch]       = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
      const newLog = {
        id:        Date.now(),
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        level:     levels[Math.floor(Math.random() * levels.length)],
        source:    `192.168.1.${Math.floor(Math.random() * 255)}`,
        message:   'Live event captured by sensor',
      };
      setLogs(prev => [newLog, ...prev].slice(0, 100));
    }, 2000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filtered = logs.filter(log => {
    const matchLevel  = filter === 'ALL' || log.level === filter;
    const matchSearch = log.message.toLowerCase().includes(search.toLowerCase()) ||
                        log.source.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });

  const counts = logs.reduce((acc, l) => { acc[l.level] = (acc[l.level] || 0) + 1; return acc; }, {});

  return (
    <div style={{ padding: '24px', fontFamily: 'var(--font-mono, "Share Tech Mono", monospace)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: 'var(--accent-cyan, #00e5ff)', fontSize: 22, letterSpacing: 4, margin: 0 }}>
            📋 SYSTEM LOGS
          </h1>
          <p style={{ color: 'var(--text-secondary, #888)', fontSize: 12, marginTop: 4 }}>
            Real-time event monitoring
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ color: 'var(--text-secondary, #888)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              style={{ accentColor: 'var(--accent-cyan, #00e5ff)' }}
            />
            AUTO REFRESH
          </label>
          <button
            onClick={() => setLogs(mockLogs)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color, #333)',
              color: 'var(--text-secondary, #888)',
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: 11,
              letterSpacing: 2,
            }}
          >
            RESET
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {['INFO', 'WARN', 'ERROR', 'DEBUG'].map(lvl => (
          <div key={lvl} style={{
            background: 'var(--bg-card, #111)',
            border: `1px solid ${levelColor[lvl]}33`,
            padding: '10px 20px',
            borderRadius: 4,
            minWidth: 90,
            textAlign: 'center',
          }}>
            <div style={{ color: levelColor[lvl], fontSize: 20, fontWeight: 'bold' }}>{counts[lvl] || 0}</div>
            <div style={{ color: 'var(--text-secondary, #888)', fontSize: 10, letterSpacing: 2 }}>{lvl}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: 'var(--bg-card, #111)',
            border: '1px solid var(--border-color, #333)',
            color: 'var(--text-primary, #eee)',
            padding: '8px 14px',
            fontSize: 12,
            flex: 1,
            minWidth: 200,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          {LEVELS.map(lvl => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              style={{
                background: filter === lvl ? (levelColor[lvl] || 'var(--accent-cyan, #00e5ff)') : 'transparent',
                border: `1px solid ${levelColor[lvl] || 'var(--accent-cyan, #00e5ff)'}`,
                color: filter === lvl ? '#000' : (levelColor[lvl] || 'var(--accent-cyan, #00e5ff)'),
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: 11,
                letterSpacing: 1,
                fontFamily: 'inherit',
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Log Table */}
      <div style={{
        background: 'var(--bg-card, #0d0d0d)',
        border: '1px solid var(--border-color, #222)',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '180px 70px 130px 1fr',
          padding: '10px 16px',
          background: 'var(--bg-secondary, #161616)',
          borderBottom: '1px solid var(--border-color, #222)',
          color: 'var(--text-secondary, #666)',
          fontSize: 11,
          letterSpacing: 2,
        }}>
          <span>TIMESTAMP</span>
          <span>LEVEL</span>
          <span>SOURCE</span>
          <span>MESSAGE</span>
        </div>

        {/* Rows */}
        <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary, #555)', fontSize: 13 }}>
              No logs found
            </div>
          ) : (
            filtered.map((log, i) => (
              <div
                key={log.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '180px 70px 130px 1fr',
                  padding: '9px 16px',
                  borderBottom: '1px solid var(--border-color, #1a1a1a)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  fontSize: 12,
                  alignItems: 'center',
                }}
              >
                <span style={{ color: 'var(--text-secondary, #666)' }}>{log.timestamp}</span>
                <span style={{
                  color: levelColor[log.level],
                  fontWeight: 'bold',
                  fontSize: 10,
                  letterSpacing: 1,
                }}>
                  {log.level}
                </span>
                <span style={{ color: 'var(--accent-cyan, #00e5ff)', opacity: 0.8 }}>{log.source}</span>
                <span style={{ color: 'var(--text-primary, #ccc)' }}>{log.message}</span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border-color, #222)',
          color: 'var(--text-secondary, #555)',
          fontSize: 11,
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>SHOWING {filtered.length} OF {logs.length} ENTRIES</span>
          <span style={{ color: autoRefresh ? '#22c55e' : 'var(--text-secondary, #555)' }}>
            {autoRefresh ? '● LIVE' : '○ PAUSED'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Logs;
