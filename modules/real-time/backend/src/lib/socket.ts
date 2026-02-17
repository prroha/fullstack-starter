import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

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
  jwtSecret?: string;
  requireAuth?: boolean;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role?: 'USER' | 'ADMIN';
  deviceId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  userRole?: 'USER' | 'ADMIN';
  userData?: Record<string, unknown>;
  isAuthenticated?: boolean;
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

export interface RoomConfig {
  name: string;
  isPrivate?: boolean;
  isAdminOnly?: boolean;
  allowedUsers?: string[];
  maxMembers?: number;
}

export interface RoomAccessResult {
  allowed: boolean;
  reason?: string;
}

export type RoomAccessChecker = (
  socket: AuthenticatedSocket,
  room: string
) => Promise<RoomAccessResult> | RoomAccessResult;

// =============================================================================
// Token Validation
// =============================================================================

/**
 * Verify and decode JWT token
 */
function verifyToken(token: string, secret: string): JwtPayload {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

// =============================================================================
// Socket Service
// =============================================================================

export class SocketService {
  private io: SocketServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map();
  private socketUsers: Map<string, string> = new Map();
  private jwtSecret: string = '';
  private requireAuth: boolean = false;
  private roomConfigs: Map<string, RoomConfig> = new Map();
  private customRoomAccessChecker: RoomAccessChecker | null = null;

  /**
   * Initialize Socket.IO server
   */
  init(httpServer: HttpServer, config: SocketConfig = {}): SocketServer {
    const corsOrigin = config.cors?.origin ||
      process.env.SOCKET_CORS_ORIGIN ||
      'http://localhost:3000';

    this.jwtSecret = config.jwtSecret || process.env.JWT_SECRET || '';
    this.requireAuth = config.requireAuth ?? true;

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
   * Set a custom room access checker for complex authorization logic
   */
  setRoomAccessChecker(checker: RoomAccessChecker): void {
    this.customRoomAccessChecker = checker;
  }

  /**
   * Configure a room with access control settings
   */
  configureRoom(config: RoomConfig): void {
    this.roomConfigs.set(config.name, config);
    console.log(`[SocketService] Room configured: ${config.name}`, {
      isPrivate: config.isPrivate,
      isAdminOnly: config.isAdminOnly,
    });
  }

  /**
   * Remove room configuration
   */
  removeRoomConfig(roomName: string): void {
    this.roomConfigs.delete(roomName);
  }

  /**
   * Set up default event handlers
   */
  private setupHandlers(): void {
    if (!this.io) return;

    // Connection-level authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token && this.jwtSecret) {
        try {
          const payload = verifyToken(token, this.jwtSecret);
          socket.userId = payload.userId;
          socket.userEmail = payload.email;
          socket.userRole = payload.role;
          socket.isAuthenticated = true;
          console.log(`[SocketService] Pre-authenticated connection for user: ${payload.userId}`);
        } catch (error) {
          // If auth is required and token is invalid, reject
          if (this.requireAuth) {
            const message = error instanceof Error ? error.message : 'Invalid token';
            console.log(`[SocketService] Connection rejected: ${message}`);
            return next(new Error(`Authentication failed: ${message}`));
          }
          // Otherwise, allow unauthenticated connection
          socket.isAuthenticated = false;
        }
      } else if (this.requireAuth) {
        // No token provided but auth is required
        console.log('[SocketService] Connection rejected: No token provided');
        return next(new Error('Authentication required'));
      }

      next();
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`[SocketService] Client connected: ${socket.id}`, {
        authenticated: socket.isAuthenticated,
        userId: socket.userId,
      });

      // If pre-authenticated, set up user tracking
      if (socket.isAuthenticated && socket.userId) {
        this.setupUserTracking(socket, socket.userId);
      }

      // Handle explicit authentication (for clients that connect first, then auth)
      socket.on('auth', async (data: { token?: string; userId?: string }) => {
        await this.handleAuth(socket, data);
      });

      // Handle joining rooms with access control
      socket.on('join', async (room: string) => {
        await this.handleJoinRoom(socket, room);
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
        if (!socket.isAuthenticated) {
          socket.emit('error', { code: 'AUTH_REQUIRED', message: 'Authentication required' });
          return;
        }
        socket.to(room).emit('typing:start', {
          userId: socket.userId,
          room,
        });
      });

      socket.on('typing:stop', (room: string) => {
        if (!socket.isAuthenticated) {
          socket.emit('error', { code: 'AUTH_REQUIRED', message: 'Authentication required' });
          return;
        }
        socket.to(room).emit('typing:stop', {
          userId: socket.userId,
          room,
        });
      });

      // Handle message sending
      socket.on('message', (data: { room: string; content: string; metadata?: Record<string, unknown> }) => {
        this.handleMessage(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.handleDisconnect(socket, reason);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`[SocketService] Socket error for ${socket.id}:`, error);
      });
    });
  }

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

  private setupUserTracking(socket: AuthenticatedSocket, userId: string): void {
    // Track socket for user
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket.id);
    this.socketUsers.set(socket.id, userId);

    // Join user's personal room
    socket.join(`user:${userId}`);
  }

  private async handleAuth(
    socket: AuthenticatedSocket,
    data: { token?: string; userId?: string }
  ): Promise<void> {
    // If already authenticated via middleware, just acknowledge
    if (socket.isAuthenticated && socket.userId) {
      socket.emit('auth:success', {
        userId: socket.userId,
        email: socket.userEmail,
        role: socket.userRole,
      });
      return;
    }

    // Validate token if provided
    if (data.token && this.jwtSecret) {
      try {
        const payload = verifyToken(data.token, this.jwtSecret);

        socket.userId = payload.userId;
        socket.userEmail = payload.email;
        socket.userRole = payload.role;
        socket.isAuthenticated = true;

        this.setupUserTracking(socket, payload.userId);

        socket.emit('auth:success', {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
        });
        console.log(`[SocketService] User authenticated: ${payload.userId}`);

        // Broadcast presence
        this.broadcastPresence(payload.userId, 'online');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid token';
        socket.emit('auth:error', {
          code: 'AUTH_FAILED',
          message: `Authentication failed: ${message}`,
        });
        console.log(`[SocketService] Auth failed for socket ${socket.id}: ${message}`);

        // Disconnect if auth is required
        if (this.requireAuth) {
          socket.disconnect(true);
        }
      }
    } else if (data.userId && !this.requireAuth) {
      // Allow userId-only auth if not requiring strict auth (development mode)
      console.warn('[SocketService] Warning: Using userId-only auth (no token validation)');
      socket.userId = data.userId;
      socket.isAuthenticated = true;

      this.setupUserTracking(socket, data.userId);

      socket.emit('auth:success', { userId: data.userId });
      console.log(`[SocketService] User authenticated (no token): ${data.userId}`);

      // Broadcast presence
      this.broadcastPresence(data.userId, 'online');
    } else {
      socket.emit('auth:error', {
        code: 'AUTH_REQUIRED',
        message: 'Token is required for authentication',
      });

      if (this.requireAuth) {
        socket.disconnect(true);
      }
    }
  }

  /**
   * Check if user can access a room
   */
  private async checkRoomAccess(
    socket: AuthenticatedSocket,
    room: string
  ): Promise<RoomAccessResult> {
    // Use custom checker if provided
    if (this.customRoomAccessChecker) {
      return this.customRoomAccessChecker(socket, room);
    }

    // Check room configuration
    const config = this.roomConfigs.get(room);

    // If no config, allow access (public room)
    if (!config) {
      return { allowed: true };
    }

    // Check if user is authenticated for private rooms
    if (config.isPrivate && !socket.isAuthenticated) {
      return {
        allowed: false,
        reason: 'Authentication required for private rooms',
      };
    }

    // Check admin-only rooms
    if (config.isAdminOnly && socket.userRole !== 'ADMIN') {
      return {
        allowed: false,
        reason: 'Admin access required',
      };
    }

    // Check allowed users list
    if (config.allowedUsers && config.allowedUsers.length > 0) {
      if (!socket.userId || !config.allowedUsers.includes(socket.userId)) {
        return {
          allowed: false,
          reason: 'You are not allowed to join this room',
        };
      }
    }

    // Check max members
    if (config.maxMembers) {
      const currentMembers = await this.getRoomClients(room);
      if (currentMembers.size >= config.maxMembers) {
        return {
          allowed: false,
          reason: 'Room is full',
        };
      }
    }

    return { allowed: true };
  }

  private async handleJoinRoom(socket: AuthenticatedSocket, room: string): Promise<void> {
    // Check room access
    const accessResult = await this.checkRoomAccess(socket, room);

    if (!accessResult.allowed) {
      socket.emit('join:error', {
        room,
        code: 'ACCESS_DENIED',
        message: accessResult.reason || 'Access denied',
      });
      console.log(`[SocketService] Join denied for ${socket.userId || socket.id} to room: ${room} - ${accessResult.reason}`);
      return;
    }

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
    if (!socket.userId || !socket.isAuthenticated) {
      socket.emit('error', { code: 'AUTH_REQUIRED', message: 'Authentication required' });
      return;
    }
    this.broadcastPresence(socket.userId, status);
  }

  private handleMessage(
    socket: AuthenticatedSocket,
    data: { room: string; content: string; metadata?: Record<string, unknown> }
  ): void {
    if (!socket.isAuthenticated || !socket.userId) {
      socket.emit('error', { code: 'AUTH_REQUIRED', message: 'Authentication required to send messages' });
      return;
    }

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      room: data.room,
      userId: socket.userId,
      content: data.content,
      metadata: data.metadata,
      timestamp: new Date().toISOString(),
    };

    // Send to all clients in the room including sender
    this.io?.to(data.room).emit('message', message);
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
   * Broadcast to authenticated users only
   */
  broadcastToAuthenticated(event: string, data: unknown): void {
    if (!this.io) return;
    for (const [userId] of this.userSockets) {
      this.sendToUser(userId, event, data);
    }
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
   * Get room configuration
   */
  getRoomConfig(room: string): RoomConfig | undefined {
    return this.roomConfigs.get(room);
  }

  /**
   * Add user to allowed list for a private room
   */
  addUserToRoom(room: string, userId: string): void {
    const config = this.roomConfigs.get(room);
    if (config) {
      if (!config.allowedUsers) {
        config.allowedUsers = [];
      }
      if (!config.allowedUsers.includes(userId)) {
        config.allowedUsers.push(userId);
      }
    }
  }

  /**
   * Remove user from allowed list for a private room
   */
  removeUserFromRoom(room: string, userId: string): void {
    const config = this.roomConfigs.get(room);
    if (config?.allowedUsers) {
      config.allowedUsers = config.allowedUsers.filter((id) => id !== userId);
    }
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

  /**
   * Force disconnect all users from a room
   */
  async clearRoom(room: string): Promise<void> {
    if (!this.io) return;
    const sockets = await this.io.in(room).fetchSockets();
    for (const socket of sockets) {
      socket.leave(room);
    }
    this.sendToRoom(room, 'room:cleared', { room });
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
// HTTP Server Integration Helper
// =============================================================================

/**
 * Initialize socket service with an HTTP server
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
