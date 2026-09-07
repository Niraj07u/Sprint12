import React from 'react';

export function TypingIndicator({ typingUsers }) {
  if (!typingUsers || typingUsers.length === 0) {
    return <div className="typing-container" />;
  }

  let text = '';
  if (typingUsers.length === 1) {
    text = `${typingUsers[0].username} is typing...`;
  } else if (typingUsers.length === 2) {
    text = `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`;
  } else {
    text = `${typingUsers[0].username} and ${typingUsers.length - 1} others are typing...`;
  }

  return (
    <div className="typing-container">
      <div className="typing-dots">
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
      </div>
      <span>{text}</span>
    </div>
  );
}
