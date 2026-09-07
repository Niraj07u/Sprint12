import React, { useEffect, useRef } from 'react';

export function MessageList({ messages, currentUserSession }) {
  const bottomAnchorRef = useRef(null);

  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function formatTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  if (messages.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          color: 'var(--text-muted)'
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '36px', opacity: 0.5 }}>
          forum
        </span>
        <div style={{ fontSize: '0.875rem' }}>No payloads dispatched yet in this channel.</div>
        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
          Type a message below to broadcast via WebSocket.
        </div>
      </div>
    );
  }

  return (
    <div className="message-feed">
      {messages.map((msg) => {
        if (msg.type === 'system') {
          return (
            <div key={msg.id} className="message-card system-message">
              <span style={{ fontSize: '1.1rem' }}>{msg.sender?.avatar || 'ℹ️'}</span>
              <div style={{ flex: 1, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>
                  [{msg.sender?.username || 'System'}]
                </span>{' '}
                {msg.text}
              </div>
              <span className="message-time">{formatTime(msg.timestamp)}</span>
            </div>
          );
        }

        const isSelf = currentUserSession?.username === msg.sender?.username;

        return (
          <div
            key={msg.id}
            className={`message-card ${isSelf ? 'own-message' : ''}`}
          >
            <div className="avatar-badge">{msg.sender?.avatar || '👾'}</div>

            <div className="message-body">
              <div className="message-meta">
                <span className="sender-name">
                  {msg.sender?.username || 'Anonymous'}
                  {isSelf && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary)', marginLeft: '0.35rem' }}>
                      (You)
                    </span>
                  )}
                </span>

                {msg.sender?.role && (
                  <span className="role-chip">{msg.sender.role}</span>
                )}

                <span className="message-time">{formatTime(msg.timestamp)}</span>

                {msg.metadata?.transport && (
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '0.625rem',
                      color: 'var(--text-muted)',
                      marginLeft: 'auto',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '0.05rem 0.35rem',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    via {msg.metadata.transport}
                  </span>
                )}
              </div>

              <div className="message-text">{msg.text}</div>
            </div>
          </div>
        );
      })}
      <div ref={bottomAnchorRef} />
    </div>
  );
}
