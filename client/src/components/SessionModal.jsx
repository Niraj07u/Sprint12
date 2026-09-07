import React, { useState } from 'react';

const AVATAR_PRESETS = ['👩‍💻', '👨‍💻', '⚡', '🚀', '🤖', '👾', '🛠️', '🧬', '🔒', '🎯', '💡', '🔥'];
const ROLE_PRESETS = [
  'Fullstack Engineer',
  'WebSocket Architect',
  'Frontend Specialist',
  'Backend Core Dev',
  'DevOps & Telemetry'
];

export function SessionModal({ isOpen, currentSession, onSave, onClose }) {
  const [username, setUsername] = useState(currentSession?.username || '');
  const [avatar, setAvatar] = useState(currentSession?.avatar || '⚡');
  const [role, setRole] = useState(currentSession?.role || 'Fullstack Engineer');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Please provide a unique developer identifier.');
      return;
    }
    if (cleanUsername.length < 3) {
      setError('Identifier must be at least 3 characters.');
      return;
    }
    setError('');
    onSave({
      username: cleanUsername,
      avatar,
      role
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              badge
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
              Developer Session Handshake
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Identify your client node before streaming data payloads
            </p>
          </div>
          {currentSession && onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                close
              </span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--error)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 0.75rem',
                fontSize: '0.8125rem',
                color: '#fca5a5'
              }}
            >
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Developer Handle / Unique Identifier</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. dev-alex or sarah_fullstack"
              maxLength={24}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select Node Avatar</label>
            <div className="avatar-grid">
              {AVATAR_PRESETS.map((icon) => (
                <button
                  type="button"
                  key={icon}
                  className={`avatar-option ${avatar === icon ? 'selected' : ''}`}
                  onClick={() => setAvatar(icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Engineering Role Tag</label>
            <select
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {ROLE_PRESETS.map((r) => (
                <option key={r} value={r} style={{ background: 'var(--bg-canvas)' }}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              bolt
            </span>
            Establish Session Handshake
          </button>
        </form>
      </div>
    </div>
  );
}
