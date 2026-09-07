import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export function useSocket() {
  const socketRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected'
  const [socketId, setSocketId] = useState(null);
  const [transport, setTransport] = useState('unknown');
  const [latency, setLatency] = useState(null);

  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('devcraft_ws_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [availableRooms, setAvailableRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [roomUsers, setRoomUsers] = useState([]);

  // Ref to track typing timer for keystroke debouncing
  const typingTimeoutRef = useRef(null);
  const isTypingEmittedRef = useRef(false);

  // Initialize persistent WebSocket connection
  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      setSocketId(socket.id);
      setTransport(socket.io?.engine?.transport?.name || 'websocket');

      // Transport upgrade listener
      socket.io?.engine?.on('upgrade', (newTransport) => {
        setTransport(newTransport.name);
      });
    });

    socket.on('connection:ack', (ack) => {
      setSocketId(ack.socketId);
      setAvailableRooms(ack.availableRooms || []);

      // If user had an existing session in localStorage, register it immediately
      const savedSession = localStorage.getItem('devcraft_ws_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        socket.emit('session:register', parsed, (res) => {
          if (res?.session) setSession(res.session);
        });
      }
    });

    // Handle room message history on join
    socket.on('room:history', ({ roomId, messages: history }) => {
      setMessages(history);
    });

    // Handle incoming broadcasted payload
    socket.on('message:broadcast', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Handle typing status updates for the active room
    socket.on('typing:update', ({ roomId, typingUsers: list }) => {
      setTypingUsers(list.filter((u) => u.socketId !== socket.id));
    });

    // Handle active room participants
    socket.on('room:users', ({ roomId, users }) => {
      setRoomUsers(users);
    });

    // Handle session updates
    socket.on('session:updated', (updated) => {
      setSession(updated);
      localStorage.setItem('devcraft_ws_session', JSON.stringify(updated));
    });

    // Latency Ping-Pong monitor
    socket.on('latency:pong', ({ clientTimestamp }) => {
      setLatency(Date.now() - clientTimestamp);
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setConnectionStatus('disconnected');
    });

    // Periodic heartbeat to compute latency
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('latency:ping', Date.now());
      }
    }, 3000);

    return () => {
      clearInterval(pingInterval);
      socket.disconnect();
    };
  }, []);

  // Register or update user session
  const registerSession = useCallback((identityData) => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve(false);
      socketRef.current.emit('session:register', identityData, (res) => {
        if (res?.success) {
          setSession(res.session);
          localStorage.setItem('devcraft_ws_session', JSON.stringify(res.session));
          resolve(res.session);
        } else {
          resolve(false);
        }
      });
    });
  }, []);

  // Join a specific WebSocket room / channel
  const joinRoom = useCallback((roomId) => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve(false);

      // Stop any typing before switching room
      if (isTypingEmittedRef.current && currentRoom) {
        socketRef.current.emit('typing:stop', { roomId: currentRoom.id });
        isTypingEmittedRef.current = false;
      }

      socketRef.current.emit('room:join', { roomId }, (res) => {
        if (res?.success) {
          setCurrentRoom(res.room);
          setTypingUsers([]);
          resolve(res.room);
        } else {
          resolve(false);
        }
      });
    });
  }, [currentRoom]);

  // Dispatch message through room pipeline
  const sendMessage = useCallback((text) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !currentRoom) return reject(new Error('Not connected or no room'));

      // Cease typing indicator immediately upon send
      if (isTypingEmittedRef.current) {
        clearTimeout(typingTimeoutRef.current);
        socketRef.current.emit('typing:stop', { roomId: currentRoom.id });
        isTypingEmittedRef.current = false;
      }

      socketRef.current.emit('message:send', { roomId: currentRoom.id, text }, (res) => {
        if (res?.success) {
          resolve(res);
        } else {
          reject(new Error(res?.error || 'Send failed'));
        }
      });
    });
  }, [currentRoom]);

  // Handle client keystroke detection with debounced stop event
  const handleKeystroke = useCallback(() => {
    if (!socketRef.current || !currentRoom) return;

    if (!isTypingEmittedRef.current) {
      isTypingEmittedRef.current = true;
      socketRef.current.emit('typing:start', { roomId: currentRoom.id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingEmittedRef.current && socketRef.current && currentRoom) {
        socketRef.current.emit('typing:stop', { roomId: currentRoom.id });
        isTypingEmittedRef.current = false;
      }
    }, 1500);
  }, [currentRoom]);

  return {
    socket: socketRef.current,
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
  };
}
