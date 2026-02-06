# Real-Time Module

Real-time communication powered by Socket.IO for notifications, chat, presence, and live updates.

## Features

- **User Presence**: Track online/offline status
- **Rooms**: Join and leave channels/rooms
- **Notifications**: Push notifications to specific users
- **Typing Indicators**: Real-time typing status
- **Broadcast**: Send to all connected clients
- **User Targeting**: Send to specific users across devices
- **TypeScript**: Full type definitions

## Installation

### Backend

1. Install Socket.IO:

```bash
cd core/backend
npm install socket.io
```

2. Copy the socket service:

```bash
cp modules/real-time/backend/src/lib/socket.ts core/backend/src/lib/
```

3. Initialize in your app:

```typescript
import express from 'express';
import { createServer } from 'http';
import { initializeSocket } from './lib/socket';

const app = express();
const httpServer = createServer(app);

// Initialize socket service
const socketService = initializeSocket(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
});

// Start server
httpServer.listen(3001, () => {
  console.log('Server running on port 3001');
});
```

### Web (Next.js/React)

1. Install Socket.IO client:

```bash
cd core/web
npm install socket.io-client
```

2. Create a socket hook:

```typescript
// src/lib/use-socket.ts
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export function useSocket(userId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      if (userId) {
        newSocket.emit('auth', { userId });
      }
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  const joinRoom = useCallback((room: string) => {
    socket?.emit('join', room);
  }, [socket]);

  const leaveRoom = useCallback((room: string) => {
    socket?.emit('leave', room);
  }, [socket]);

  return { socket, connected, joinRoom, leaveRoom };
}
```

## Usage Examples

### Backend: Send Notifications

```typescript
import { getSocketService } from './lib/socket';

const socket = getSocketService();

// Send notification to specific user
socket.notify('user_123', {
  type: 'message',
  title: 'New Message',
  message: 'You have a new message from John',
  data: { messageId: 'msg_456' },
});

// Send to a room
socket.sendToRoom('project:123', 'update', {
  type: 'task_completed',
  taskId: 'task_789',
});

// Broadcast to all
socket.broadcast('announcement', {
  message: 'System maintenance in 1 hour',
});
```

### Backend: Check User Status

```typescript
const socket = getSocketService();

// Check if user is online
if (socket.isUserOnline('user_123')) {
  // Send real-time message
} else {
  // Queue for later or send email
}

// Get all online users
const onlineUsers = socket.getOnlineUsers();
```

### Frontend: Listen for Events

```tsx
function NotificationListener() {
  const { socket, connected } = useSocket(userId);

  useEffect(() => {
    if (!socket) return;

    socket.on('notification', (data) => {
      toast.show(data.title, data.message);
    });

    socket.on('presence:update', (data) => {
      console.log(`${data.userId} is now ${data.status}`);
    });

    return () => {
      socket.off('notification');
      socket.off('presence:update');
    };
  }, [socket]);

  return <div>Connected: {connected ? 'Yes' : 'No'}</div>;
}
```

### Frontend: Room-based Chat

```tsx
function ChatRoom({ roomId }: { roomId: string }) {
  const { socket, joinRoom, leaveRoom } = useSocket(userId);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    joinRoom(roomId);

    socket?.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      leaveRoom(roomId);
    };
  }, [roomId, socket]);

  const sendMessage = (text: string) => {
    socket?.emit('message', { room: roomId, text });
  };

  return (
    <div>
      {messages.map((msg) => (
        <p key={msg.id}>{msg.text}</p>
      ))}
    </div>
  );
}
```

### Frontend: Typing Indicators

```tsx
function TypingInput({ roomId }: { roomId: string }) {
  const { socket } = useSocket(userId);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    socket?.on('typing:start', ({ userId }) => {
      setTypingUsers((prev) => [...prev, userId]);
    });

    socket?.on('typing:stop', ({ userId }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== userId));
    });

    return () => {
      socket?.off('typing:start');
      socket?.off('typing:stop');
    };
  }, [socket]);

  const handleTyping = () => {
    socket?.emit('typing:start', roomId);
    // Debounce and emit typing:stop
  };

  return (
    <div>
      {typingUsers.length > 0 && <p>{typingUsers.join(', ')} is typing...</p>}
      <input onChange={handleTyping} />
    </div>
  );
}
```

## Events

### Client to Server

| Event | Payload | Description |
|-------|---------|-------------|
| `auth` | `{ userId, token? }` | Authenticate connection |
| `join` | `string` (room name) | Join a room |
| `leave` | `string` (room name) | Leave a room |
| `presence` | `'online' \| 'away' \| 'busy'` | Update presence status |
| `typing:start` | `string` (room) | Start typing indicator |
| `typing:stop` | `string` (room) | Stop typing indicator |

### Server to Client

| Event | Payload | Description |
|-------|---------|-------------|
| `auth:success` | `{ userId }` | Authentication successful |
| `joined` | `{ room }` | Joined room confirmation |
| `left` | `{ room }` | Left room confirmation |
| `user:joined` | `{ userId, room }` | User joined the room |
| `user:left` | `{ userId, room }` | User left the room |
| `presence:update` | `PresenceInfo` | User presence changed |
| `notification` | `NotificationPayload` | Push notification |
| `typing:start` | `{ userId, room }` | User started typing |
| `typing:stop` | `{ userId, room }` | User stopped typing |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SOCKET_CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `SOCKET_PATH` | `/socket.io` | Socket.IO path |

## Scaling

For production with multiple server instances:

1. Use Redis adapter:

```bash
npm install @socket.io/redis-adapter redis
```

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

## Pricing Suggestion

$600-1000 for integration including:
- Socket.IO setup
- Authentication integration
- Presence system
- Notification delivery
- Frontend components
- Redis adapter for scaling
