import React from 'react';

export function ChannelSidebar({
  availableRooms,
  currentRoom,
  onSelectRoom,
  connectionStatus
}) {
  return (
    <aside className="channel-sidebar">
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>
            hub
          </span>
          <span>WebSocket Channels</span>
        </div>
        <span className="font-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
          {availableRooms.length} PIPELINES
        </span>
      </div>

      <div className="channel-list">
        {availableRooms.map((room) => {
          const isActive = currentRoom?.id === room.id;
          return (
            <div
              key={room.id}
              className={`channel-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectRoom(room.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                {isActive ? (
                  <div className="active-channel-indicator"></div>
                ) : (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '16px', color: 'var(--text-muted)' }}
                  >
                    tag
                  </span>
                )}
                <div style={{ minWidth: 0 }}>
                  <div className="channel-tag" style={{ color: isActive ? '#fff' : 'inherit' }}>
                    #{room.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '180px'
                    }}
                  >
                    {room.description}
                  </div>
                </div>
              </div>
              <span className="channel-badge">{room.badge || 'Room'}</span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          padding: '0.85rem',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(8, 11, 17, 0.5)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span className="font-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Routing Engine
          </span>
          <span className="font-mono" style={{ fontSize: '0.6875rem', color: 'var(--secondary)' }}>
            Strict Isolation
          </span>
        </div>
        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          Payloads are isolated within the active channel and never broadcast cross-room.
        </div>
      </div>
    </aside>
  );
}
