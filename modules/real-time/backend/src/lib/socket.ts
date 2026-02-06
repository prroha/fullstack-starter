import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';

// =============================================================================
// Types
// =============================================================================

export interface SocketConfig {
  cors?: {
    origin: string | string[];
    methods?: string[];
    credentials?: boolean;
  };
  path?: string;
}

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userData?: Record<string, unknown>;
}

export interface RoomEvent {
  room: string;
  event: string;
  data: unknown;
}

export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp?: string;
}

export interface PresenceInfo {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: Date;
}

// =============================================================================
// Socket Service
// =============================================================================

export class SocketService {
  private io: SocketServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map();
  private socketUsers: Map<string, string> = new Map();

  /**
   * Initialize Socket.IO server
   */
  init(httpServer: HttpServer, config: SocketConfig = {}): SocketServer {
    const corsOrigin = config.cors?.origin ||
      process.env.SOCKET_CORS_ORIGIN ||
      'http://localhost:3000';

    this.io = new SocketServer(httpServer, {
      cors: {
        origin: corsOrigin,
        methods: config.cors?.methods || ['GET', 'POST'],
        credentials: config.cors?.credentials ?? true,
      },
      path: config.path || process.env.SOCKET_PATH || '/socket.io',
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupHandlers();
    console.log('[SocketService] Initialized');

    return this.io;
  }

  /**
   * Set up default event handlers
   */
  private setupHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`[SocketService] Client connected: ${socket.id}`);

      // Handle authentication
      socket.on('auth', (data: { userId: string; token?: string }) => {
        this.handleAuth(socket, data);
      });

      // Handle joining rooms
      socket.on('join', (room: string) => {
        this.handleJoinRoom(socket, room);
      });

      // Handle leaving rooms
      socket.on('leave', (room: string) => {
        this.handleLeaveRoom(socket, room);
      });

      // Handle presence updates
      socket.on('presence', (status: PresenceInfo['status']) => {
        this.handlePresenceUpdate(socket, status);
      });

      // Handle typing indicators
      socket.on('typing:start', (room: string) => {
        socket.to(room).emit('typing:start', {
          userId: socket.userId,
          room,
        });
      });

      socket.on('typing:stop', (room: string) => {
        socket.to(room).emit('typing:stop', {
          userId: socket.userId,
          room,
        });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.handleDisconnect(socket, reason);
      });
    });
  }

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

  private handleAuth(
    socket: AuthenticatedSocket,
    data: { userId: string; token?: string }
  ): void {
    // TODO: Validate token if provided
    socket.userId = data.userId;

    // Track socket for user
    if (!this.userSockets.has(data.userId)) {
      this.userSockets.set(data.userId, new Set());
    }
    this.userSockets.get(data.userId)!.add(socket.id);
    this.socketUsers.set(socket.id, data.userId);

    // Join user's personal room
    socket.join(`user:${data.userId}`);

    socket.emit('auth:success', { userId: data.userId });
    console.log(`[SocketService] User authenticated: ${data.userId}`);

    // Broadcast presence
    this.broadcastPresence(data.userId, 'online');
  }

  private handleJoinRoom(socket: AuthenticatedSocket, room: string): void {
    socket.join(room);
    socket.emit('joined', { room });
    console.log(`[SocketService] ${socket.userId || socket.id} joined room: ${room}`);

    // Notify others in the room
    socket.to(room).emit('user:joined', {
      userId: socket.userId,
      room,
    });
  }

  private handleLeaveRoom(socket: AuthenticatedSocket, room: string): void {
    socket.leave(room);
    socket.emit('left', { room });

    // Notify others in the room
    socket.to(room).emit('user:left', {
      userId: socket.userId,
      room,
    });
  }

  private handlePresenceUpdate(
    socket: AuthenticatedSocket,
    status: PresenceInfo['status']
  ): void {
    if (!socket.userId) return;
    this.broadcastPresence(socket.userId, status);
  }

  private handleDisconnect(socket: AuthenticatedSocket, reason: string): void {
    console.log(`[SocketService] Client disconnected: ${socket.id} (${reason})`);

    if (socket.userId) {
      // Remove socket from user's socket set
      const userSocketSet = this.userSockets.get(socket.userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(socket.userId);
          // User has no more connections, broadcast offline
          this.broadcastPresence(socket.userId, 'offline');
        }
      }
      this.socketUsers.delete(socket.id);
    }
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * Get the Socket.IO server instance
   */
  getIO(): SocketServer | null {
    return this.io;
  }

  /**
   * Send event to a specific user (all their connected sockets)
   */
  sendToUser(userId: string, event: string, data: unknown): void {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Send event to a room
   */
  sendToRoom(room: string, event: string, data: unknown): void {
    if (!this.io) return;
    this.io.to(room).emit(event, data);
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast(event: string, data: unknown): void {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  /**
   * Send a notification to a user
   */
  notify(userId: string, notification: NotificationPayload): void {
    this.sendToUser(userId, 'notification', {
      ...notification,
      timestamp: notification.timestamp || new Date().toISOString(),
    });
  }

  /**
   * Check if a user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  /**
   * Get all online user IDs
   */
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  /**
   * Get socket count for a user
   */
  getUserSocketCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }

  /**
   * Broadcast presence update
   */
  broadcastPresence(userId: string, status: PresenceInfo['status']): void {
    if (!this.io) return;

    const presence: PresenceInfo = {
      userId,
      status,
      lastSeen: status === 'offline' ? new Date() : undefined,
    };

    this.io.emit('presence:update', presence);
  }

  /**
   * Get connected clients count
   */
  getClientCount(): number {
    if (!this.io) return 0;
    return this.io.engine.clientsCount;
  }

  /**
   * Get clients in a room
   */
  async getRoomClients(room: string): Promise<Set<string>> {
    if (!this.io) return new Set();
    return this.io.in(room).allSockets();
  }

  /**
   * Disconnect a specific user
   */
  disconnectUser(userId: string): void {
    const socketIds = this.userSockets.get(userId);
    if (!socketIds || !this.io) return;

    for (const socketId of socketIds) {
      const socket = this.io.sockets.sockets.get(socketId);
      socket?.disconnect(true);
    }
  }
}

// =============================================================================
// Singleton & Factory
// =============================================================================

let socketServiceInstance: SocketService | null = null;

/**
 * Get or create the socket service singleton
 */
export function getSocketService(): SocketService {
  if (!socketServiceInstance) {
    socketServiceInstance = new SocketService();
  }
  return socketServiceInstance;
}

/**
 * Create a new socket service instance
 */
export function createSocketService(): SocketService {
  return new SocketService();
}

// =============================================================================
// Express Integration Helper
// =============================================================================

/**
 * Initialize socket service with an Express app
 */
export function initializeSocket(
  httpServer: HttpServer,
  config?: SocketConfig
): SocketService {
  const socketService = getSocketService();
  socketService.init(httpServer, config);
  return socketService;
}

export default SocketService;
