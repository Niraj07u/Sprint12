import React, { useState, useRef, useEffect } from 'react';

export function MessageInput({ onSendMessage, onKeystroke, disabled, currentRoom }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled, currentRoom]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      onKeystroke();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    onKeystroke();
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="input-dispatch-area">
      <div className="input-box-wrapper">
        <textarea
          ref={textareaRef}
          className="message-textarea"
          rows={1}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? 'Connecting to WebSocket Pipeline...'
              : `Broadcast payload to #${currentRoom?.name || 'channel'}...`
          }
          disabled={disabled}
        />
        <button
          className="btn-send"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          title="Dispatch Payload (Enter)"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            send
          </span>
        </button>
      </div>

      <div className="input-hints">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ color: 'var(--primary)' }}>●</span>
          <span>Real-time keystroke detection active</span>
        </div>
        <div>
          <span>Press </span>
          <kbd style={{ background: 'var(--surface-highest)', padding: '0.1rem 0.35rem', borderRadius: '3px', color: '#fff' }}>
            Enter ↵
          </kbd>
          <span> to dispatch</span>
        </div>
      </div>
    </div>
  );
}
