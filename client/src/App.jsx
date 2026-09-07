import React, { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { Header } from './components/Header';
import { ChannelSidebar } from './components/ChannelSidebar';
import { ChatViewport } from './components/ChatViewport';
import { TelemetryRail } from './components/TelemetryRail';
import { SessionModal } from './components/SessionModal';

export function App() {
  const {
    connectionStatus,
    socketId,
    transport,
    latency,
    session,
    registerSession,
    availableRooms,
    currentRoom,
    joinRoom,
    messages,
    sendMessage,
    typingUsers,
    roomUsers,
    handleKeystroke
  } = useSocket();

  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  // Automatically join first room once rooms become available and user has no room
  useEffect(() => {
    if (availableRooms.length > 0 && !currentRoom) {
      joinRoom(availableRooms[0].id);
    }
  }, [availableRooms, currentRoom, joinRoom]);

  // Open modal if user connects for the first time without a saved session
  useEffect(() => {
    if (connectionStatus === 'connected' && !session) {
      setIsSessionModalOpen(true);
    }
  }, [connectionStatus, session]);

  const handleSaveSession = async (identityData) => {
    await registerSession(identityData);
    setIsSessionModalOpen(false);
  };

  return (
    <div className="app-shell">
      {/* Top Navigation */}
      <Header
        connectionStatus={connectionStatus}
        socketId={socketId}
        transport={transport}
        latency={latency}
        session={session}
        currentRoom={currentRoom}
        onOpenSessionModal={() => setIsSessionModalOpen(true)}
      />

      {/* Main Split Workbench */}
      <div className="main-content">
        {/* Left Rail: WebSocket Channels */}
        <ChannelSidebar
          availableRooms={availableRooms}
          currentRoom={currentRoom}
          onSelectRoom={(roomId) => joinRoom(roomId)}
          connectionStatus={connectionStatus}
        />

        {/* Center: Bidirectional Data Pipeline & Chat Viewport */}
        <ChatViewport
          currentRoom={currentRoom}
          messages={messages}
          typingUsers={typingUsers}
          currentUserSession={session}
          onSendMessage={sendMessage}
          onKeystroke={handleKeystroke}
          connectionStatus={connectionStatus}
          roomUsersCount={roomUsers.length}
        />

        {/* Right Rail: Online Nodes & Pipeline Telemetry */}
        <TelemetryRail
          roomUsers={roomUsers}
          currentRoom={currentRoom}
          socketId={socketId}
          transport={transport}
          latency={latency}
          connectionStatus={connectionStatus}
        />
      </div>

      {/* Session Identification Modal */}
      <SessionModal
        isOpen={isSessionModalOpen}
        currentSession={session}
        onSave={handleSaveSession}
        onClose={() => setIsSessionModalOpen(false)}
      />
    </div>
  );
}

export default App;
