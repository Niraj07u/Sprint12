import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 20000,
  pingInterval: 10000
});

// Predefined WebSocket channels / rooms (Phase 3)
const ROOMS = [
  {
    id: 'architecture-design',
    name: 'architecture-design',
    description: 'Component specs, design system tokens & Devcraft Precision architecture',
    icon: 'palette',
    badge: 'Design System'
  },
  {
    id: 'telemetry-pipeline',
    name: 'telemetry-pipeline',
    description: 'Real-time WebSocket telemetry, throughput metrics & latency monitoring',
    icon: 'monitoring',
    badge: 'Real-Time Telemetry'
  },
  {
    id: 'general-engineering',
    name: 'general-engineering',
    description: 'Fullstack engineering, protocol reviews & bidirectional pipeline chatter',
    icon: 'terminal',
    badge: 'Engineering'
  }
];

// In-memory data structures
const sessions = new Map(); // socket.id -> { socketId, username, avatar, role, currentRoom, connectedAt }
const roomMessages = new Map(); // roomId -> Array<Message>
const roomTypingUsers = new Map(); // roomId -> Map<socketId, { username, timeoutId }>

// Initialize room message buffers
ROOMS.forEach(room => {
  roomMessages.set(room.id, [
    {
      id: `sys-${Date.now()}-${room.id}`,
      type: 'system',
      text: `Channel #${room.name} initialized. Real-time broadcast pipeline active.`,
      roomId: room.id,
      timestamp: new Date().toISOString(),
      sender: {
        username: 'System Core',
        avatar: '⚡',
        role: 'system'
      }
    }
  ]);
  roomTypingUsers.set(room.id, new Map());
});

// Helper for formatted server terminal logging
function logHandshake(type, details) {
  const time = new Date().toLocaleTimeString();
  console.log(`\x1b[36m[WS-PIPELINE ${time}]\x1b[0m \x1b[35m[${type}]\x1b[0m`, details);
}

// REST health check and telemetry API
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    activeSockets: io.engine.clientsCount,
    rooms: ROOMS.map(r => ({
      id: r.id,
      name: r.name,
      activeUsers: Array.from(sessions.values()).filter(s => s.currentRoom === r.id).length,
      messageCount: (roomMessages.get(r.id) || []).length
    }))
  });
});

app.get('/api/rooms', (req, res) => {
  res.json(ROOMS);
});

// Socket.IO Connection Lifecycle
io.on('connection', (socket) => {
  // -------------------------------------------------------------
  // PHASE 1: BASE ARCHITECTURE (P0 - Handshake Logging)
  // -------------------------------------------------------------
  const handshake = socket.handshake;
  const clientInfo = {
    socketId: socket.id,
    address: handshake.address,
    transport: socket.conn.transport.name,
    issued: new Date(handshake.time).toISOString(),
    query: handshake.query,
    secure: handshake.secure
  };

  logHandshake('CLIENT_HANDSHAKE_ESTABLISHED', {
    socketId: socket.id,
    transport: clientInfo.transport,
    address: clientInfo.address,
    timestamp: clientInfo.issued
  });

  // Track transport upgrades (e.g. polling -> websocket)
  socket.conn.on('upgrade', (transport) => {
    logHandshake('TRANSPORT_UPGRADED', {
      socketId: socket.id,
      newTransport: transport.name
    });
  });

  // Default initial guest session
  const initialSession = {
    socketId: socket.id,
    username: `Dev-${socket.id.slice(0, 5).toUpperCase()}`,
    avatar: '👾',
    role: 'Engineer',
    currentRoom: null,
    connectedAt: new Date().toISOString()
  };
  sessions.set(socket.id, initialSession);

  // Send handshake acknowledgement with server capabilities
  socket.emit('connection:ack', {
    socketId: socket.id,
    serverTime: new Date().toISOString(),
    transport: socket.conn.transport.name,
    availableRooms: ROOMS,
    session: initialSession
  });

  // Telemetry Ping/Pong for RTT (Round Trip Time) Latency Check
  socket.on('latency:ping', (clientTimestamp) => {
    socket.emit('latency:pong', {
      clientTimestamp,
      serverTime: Date.now()
    });
  });

  // -------------------------------------------------------------
  // PHASE 2: STATE & INTEGRATION (P1 - Session Identification)
  // -------------------------------------------------------------
  socket.on('session:register', (sessionData, callback) => {
    const existing = sessions.get(socket.id) || {};
    const sanitizedSession = {
      ...existing,
      username: (sessionData.username || existing.username).trim().slice(0, 24),
      avatar: sessionData.avatar || existing.avatar || '⚡',
      role: sessionData.role || 'Fullstack Dev',
      customColor: sessionData.customColor || '#ff4785'
    };

    sessions.set(socket.id, sanitizedSession);
    logHandshake('SESSION_REGISTERED', sanitizedSession);

    // Notify the client that their session is verified
    if (typeof callback === 'function') {
      callback({ success: true, session: sanitizedSession });
    }
    socket.emit('session:updated', sanitizedSession);

    // If client is already in a room, refresh room users
    if (sanitizedSession.currentRoom) {
      broadcastRoomUsers(sanitizedSession.currentRoom);
    }
  });

  // -------------------------------------------------------------
  // PHASE 2: STATE & INTEGRATION (P1 - Real-Time Typing Indicators)
  // -------------------------------------------------------------
  socket.on('typing:start', ({ roomId }) => {
    const session = sessions.get(socket.id);
    if (!session || !roomId) return;

    const roomTyping = roomTypingUsers.get(roomId);
    if (!roomTyping) return;

    // Clear existing auto-clear timeout for this user
    if (roomTyping.has(socket.id)) {
      clearTimeout(roomTyping.get(socket.id).timeoutId);
    }

    // Set auto-clear timeout of 4 seconds in case client disconnects/stops typing abruptly
    const timeoutId = setTimeout(() => {
      if (roomTyping.has(socket.id)) {
        roomTyping.delete(socket.id);
        broadcastTypingStatus(roomId);
      }
    }, 4000);

    roomTyping.set(socket.id, {
      username: session.username,
      avatar: session.avatar,
      timeoutId
    });

    broadcastTypingStatus(roomId, socket.id);
  });

  socket.on('typing:stop', ({ roomId }) => {
    const roomTyping = roomTypingUsers.get(roomId);
    if (!roomTyping || !roomTyping.has(socket.id)) return;

    clearTimeout(roomTyping.get(socket.id).timeoutId);
    roomTyping.delete(socket.id);
    broadcastTypingStatus(roomId, socket.id);
  });

  function broadcastTypingStatus(roomId, excludeSocketId = null) {
    const roomTyping = roomTypingUsers.get(roomId);
    if (!roomTyping) return;

    const typingList = Array.from(roomTyping.entries()).map(([id, data]) => ({
      socketId: id,
      username: data.username,
      avatar: data.avatar
    }));

    if (excludeSocketId) {
      socket.to(roomId).emit('typing:update', {
        roomId,
        typingUsers: typingList
      });
    } else {
      io.to(roomId).emit('typing:update', {
        roomId,
        typingUsers: typingList
      });
    }
  }

  // -------------------------------------------------------------
  // PHASE 3: ADVANCED OPTIMIZATION (P2 - Room Architecture & Routing)
  // -------------------------------------------------------------
  socket.on('room:join', ({ roomId }, callback) => {
    const session = sessions.get(socket.id);
    if (!session) return;

    const targetRoom = ROOMS.find(r => r.id === roomId);
    if (!targetRoom) {
      if (typeof callback === 'function') callback({ success: false, error: 'Invalid room' });
      return;
    }

    // Leave previous room if any
    if (session.currentRoom && session.currentRoom !== roomId) {
      const prevRoomId = session.currentRoom;
      socket.leave(prevRoomId);

      // Clean up typing status in previous room
      const prevTyping = roomTypingUsers.get(prevRoomId);
      if (prevTyping && prevTyping.has(socket.id)) {
        clearTimeout(prevTyping.get(socket.id).timeoutId);
        prevTyping.delete(socket.id);
        broadcastTypingStatus(prevRoomId);
      }

      // Notify previous room
      const leaveNotice = {
        id: `sys-${Date.now()}-${socket.id}`,
        type: 'system',
        text: `${session.username} switched to #${targetRoom.name}`,
        roomId: prevRoomId,
        timestamp: new Date().toISOString(),
        sender: { username: 'System', avatar: 'ℹ️', role: 'system' }
      };
      pushRoomMessage(prevRoomId, leaveNotice);
      socket.to(prevRoomId).emit('message:broadcast', leaveNotice);
      broadcastRoomUsers(prevRoomId);
    }

    // Join target room
    socket.join(roomId);
    session.currentRoom = roomId;
    sessions.set(socket.id, session);

    logHandshake('CLIENT_JOINED_ROOM', {
      socketId: socket.id,
      username: session.username,
      roomId
    });

    // Send room message history to the newly joined client
    const history = roomMessages.get(roomId) || [];
    socket.emit('room:history', {
      roomId,
      messages: history
    });

    // Notify room peers (exclude self for system message or include as system broadcast)
    const joinNotice = {
      id: `sys-${Date.now()}-${socket.id}`,
      type: 'system',
      text: `${session.username} entered #${targetRoom.name}`,
      roomId,
      timestamp: new Date().toISOString(),
      sender: { username: 'System', avatar: '⚡', role: 'system' }
    };
    pushRoomMessage(roomId, joinNotice);
    io.to(roomId).emit('message:broadcast', joinNotice);

    // Broadcast updated room participants
    broadcastRoomUsers(roomId);

    if (typeof callback === 'function') {
      callback({ success: true, room: targetRoom });
    }
  });

  // -------------------------------------------------------------
  // PHASE 1 & 3: BIDIRECTIONAL BROADCAST (Strictly Room-Isolated)
  // -------------------------------------------------------------
  socket.on('message:send', (payload, callback) => {
    const session = sessions.get(socket.id);
    if (!session) {
      if (typeof callback === 'function') callback({ success: false, error: 'Unauthenticated' });
      return;
    }

    const roomId = payload.roomId || session.currentRoom;
    if (!roomId) {
      if (typeof callback === 'function') callback({ success: false, error: 'No room specified' });
      return;
    }

    const text = (payload.text || '').trim();
    if (!text) {
      if (typeof callback === 'function') callback({ success: false, error: 'Empty message' });
      return;
    }

    // Clear typing status immediately on message send
    const roomTyping = roomTypingUsers.get(roomId);
    if (roomTyping && roomTyping.has(socket.id)) {
      clearTimeout(roomTyping.get(socket.id).timeoutId);
      roomTyping.delete(socket.id);
      broadcastTypingStatus(roomId);
    }

    // Format incoming payload with verified session identity & server timestamp
    const messagePayload = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      type: 'user',
      text,
      roomId,
      timestamp: new Date().toISOString(),
      sender: {
        socketId: socket.id,
        username: session.username,
        avatar: session.avatar,
        role: session.role,
        customColor: session.customColor || '#ff4785'
      },
      metadata: {
        transport: socket.conn.transport.name,
        clientSequence: payload.clientSequence || 1
      }
    };

    logHandshake('PAYLOAD_DISPATCHED_AND_ROUTED', {
      messageId: messagePayload.id,
      sender: session.username,
      roomId,
      textLength: text.length
    });

    // Save to room message history (bounded buffer)
    pushRoomMessage(roomId, messagePayload);

    // P2: STRICT ROOM ISOLATION: Broadcast solely to clients subscribed to this channel
    io.to(roomId).emit('message:broadcast', messagePayload);

    if (typeof callback === 'function') {
      callback({ success: true, messageId: messagePayload.id, timestamp: messagePayload.timestamp });
    }
  });

  // Client Disconnect
  socket.on('disconnect', (reason) => {
    const session = sessions.get(socket.id);
    logHandshake('CLIENT_DISCONNECTED', {
      socketId: socket.id,
      username: session ? session.username : 'Unknown',
      reason
    });

    if (session && session.currentRoom) {
      const roomId = session.currentRoom;

      // Clean typing status
      const roomTyping = roomTypingUsers.get(roomId);
      if (roomTyping && roomTyping.has(socket.id)) {
        clearTimeout(roomTyping.get(socket.id).timeoutId);
        roomTyping.delete(socket.id);
        broadcastTypingStatus(roomId);
      }

      // System notification
      const disconnectNotice = {
        id: `sys-${Date.now()}-${socket.id}`,
        type: 'system',
        text: `${session.username} disconnected (${reason})`,
        roomId,
        timestamp: new Date().toISOString(),
        sender: { username: 'System', avatar: '🔌', role: 'system' }
      };
      pushRoomMessage(roomId, disconnectNotice);
      socket.to(roomId).emit('message:broadcast', disconnectNotice);
      broadcastRoomUsers(roomId);
    }

    sessions.delete(socket.id);
  });
});

// Helper to push message and keep buffer limited to 100 items per room
function pushRoomMessage(roomId, message) {
  if (!roomMessages.has(roomId)) {
    roomMessages.set(roomId, []);
  }
  const list = roomMessages.get(roomId);
  list.push(message);
  if (list.length > 100) {
    list.shift();
  }
}

// Helper to broadcast active users in a specific room
function broadcastRoomUsers(roomId) {
  const usersInRoom = Array.from(sessions.values())
    .filter(s => s.currentRoom === roomId)
    .map(s => ({
      socketId: s.socketId,
      username: s.username,
      avatar: s.avatar,
      role: s.role,
      connectedAt: s.connectedAt
    }));

  io.to(roomId).emit('room:users', {
    roomId,
    users: usersInRoom,
    count: usersInRoom.length
  });
}

// Start HTTP + WebSocket Server
server.listen(PORT, () => {
  console.log('\n======================================================');
  console.log(`\x1b[32m✔ Devcraft Precision WebSocket Pipeline Active\x1b[0m`);
  console.log(`  - Server listening on: \x1b[33mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`  - WebSocket Transport: \x1b[35msocket.io v4\x1b[0m`);
  console.log(`  - Isolated Channels: \x1b[36m${ROOMS.map(r => '#' + r.name).join(', ')}\x1b[0m`);
  console.log('======================================================\n');
});
