import React from 'react';
import { MessageList } from './MessageList';
import { TypingIndicator } from './TypingIndicator';
import { MessageInput } from './MessageInput';

export function ChatViewport({
  currentRoom,
  messages,
  typingUsers,
  currentUserSession,
  onSendMessage,
  onKeystroke,
  connectionStatus,
  roomUsersCount
}) {
  return (
    <main className="chat-viewport">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-room-info">
          <div className="chat-room-title">
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>#</span>
            <span>{currentRoom?.name || 'select-channel'}</span>
          </div>
          <span style={{ color: 'var(--border-medium)' }}>|</span>
          <div className="chat-room-desc">{currentRoom?.description}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'var(--surface-high)',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--secondary)'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--secondary)',
                boxShadow: '0 0 6px var(--secondary)'
              }}
            ></span>
            <span>{roomUsersCount} Active</span>
          </div>
        </div>
      </div>

      {/* Message List */}
      <MessageList messages={messages} currentUserSession={currentUserSession} />

      {/* Typing Indicator */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* Input Dispatch Area */}
      <MessageInput
        onSendMessage={onSendMessage}
        onKeystroke={onKeystroke}
        disabled={connectionStatus !== 'connected' || !currentRoom}
        currentRoom={currentRoom}
      />
    </main>
  );
}
