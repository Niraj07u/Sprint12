import React from 'react';

export function Header({
  connectionStatus,
  socketId,
  transport,
  latency,
  session,
  currentRoom,
  onOpenSessionModal
}) {
  return (
    <header className="top-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div className="brand-badge">
          <div className="brand-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              sync_alt
            </span>
          </div>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
              Devcraft <span style={{ color: 'var(--primary)' }}>Pipeline</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`status-pill`}>
            <span className={`status-dot ${connectionStatus}`}></span>
            <span style={{ textTransform: 'uppercase', fontSize: '0.6875rem' }}>
              {connectionStatus === 'connected' ? 'Pipeline Active' : connectionStatus}
            </span>
          </span>

          {connectionStatus === 'connected' && latency !== null && (
            <span
              className="status-pill font-mono"
              style={{
                color: latency < 30 ? 'var(--success)' : latency < 100 ? 'var(--warning)' : 'var(--error)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title="Round-Trip Time (RTT)"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                bolt
              </span>
              {latency}ms
            </span>
          )}

          {socketId && (
            <span
              className="status-pill font-mono"
              style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}
              title="Client WebSocket ID"
            >
              ID: {socketId.slice(0, 8)}... ({transport})
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {currentRoom && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--surface-high)',
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--secondary)' }}>
              tag
            </span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{currentRoom.name}</span>
          </div>
        )}

        {session ? (
          <button
            onClick={onOpenSessionModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--surface-high)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.3rem 0.75rem',
              cursor: 'pointer',
              color: 'var(--text-main)',
              transition: 'all 0.15s ease'
            }}
            title="Edit Session Profile"
          >
            <span style={{ fontSize: '1.1rem' }}>{session.avatar}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.2 }}>
                {session.username}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                {session.role}
              </div>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              tune
            </span>
          </button>
        ) : (
          <button className="btn-primary" onClick={onOpenSessionModal} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8125rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              login
            </span>
            Set Identity
          </button>
        )}
      </div>
    </header>
  );
}
