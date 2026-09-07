import React from 'react';

export function TelemetryRail({
  roomUsers,
  currentRoom,
  socketId,
  transport,
  latency,
  connectionStatus
}) {
  return (
    <aside className="telemetry-rail">
      {/* Active Room Members */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--secondary)' }}>
            group
          </span>
          <span>Room Nodes</span>
        </div>
        <span className="font-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
          {roomUsers.length} ONLINE
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {roomUsers.length === 0 ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem', textAlign: 'center' }}>
            No other nodes in this room
          </div>
        ) : (
          roomUsers.map((user) => (
            <div
              key={user.socketId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: '1.1rem' }}>{user.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {user.username}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {user.role}
                </div>
              </div>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--success)',
                  boxShadow: '0 0 5px var(--success)'
                }}
              ></span>
            </div>
          ))
        )}
      </div>

      {/* Live Stream Telemetry Metrics Card */}
      <div className="telemetry-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 600, color: '#fff' }}>Pipeline Telemetry</span>
          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>
            radar
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Status:</span>
            <span style={{ color: connectionStatus === 'connected' ? 'var(--success)' : 'var(--error)' }}>
              {connectionStatus.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Transport:</span>
            <span style={{ color: 'var(--secondary)' }}>{transport}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Round-Trip:</span>
            <span style={{ color: latency !== null ? 'var(--primary)' : 'var(--text-muted)' }}>
              {latency !== null ? `${latency} ms` : 'Measuring...'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Active Room:</span>
            <span style={{ color: '#fff', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              #{currentRoom?.name || 'none'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Socket Ref:</span>
            <span style={{ color: 'var(--text-muted)' }}>
              {socketId ? `${socketId.slice(0, 6)}...` : 'n/a'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
