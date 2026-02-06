"use client";

import { io, Socket, ManagerOptions, SocketOptions } from "socket.io-client";

// =============================================================================
// Types
// =============================================================================

export interface SocketConfig {
  url?: string;
  path?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
  auth?: {
    token?: string;
  };
}

export interface PresenceInfo {
  userId: string;
  status: "online" | "away" | "busy" | "offline";
  lastSeen?: string;
}

export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  room: string;
  userId: string;
  content: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface TypingEvent {
  userId: string;
  room: string;
}

export interface RoomEvent {
  room: string;
  userId?: string;
}

export interface AuthResult {
  userId: string;
  email?: string;
  role?: "USER" | "ADMIN";
}

export interface AuthError {
  code: string;
  message: string;
}

export interface JoinError {
  room: string;
  code: string;
  message: string;
}

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error";

export type SocketEventHandler<T = unknown> = (data: T) => void;

// =============================================================================
// Socket Client Class
// =============================================================================

export class SocketClient {
  private socket: Socket | null = null;
  private config: SocketConfig;
  private eventHandlers: Map<string, Set<SocketEventHandler>> = new Map();
  private connectionStatus: ConnectionStatus = "disconnected";
  private statusChangeCallbacks: Set<(status: ConnectionStatus) => void> = new Set();
  private reconnectAttempt: number = 0;

  constructor(config: SocketConfig = {}) {
    this.config = {
      url: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000",
      path: "/socket.io",
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      ...config,
    };
  }

  // ===========================================================================
  // Connection Management
  // ===========================================================================

  /**
   * Connect to the socket server
   */
  connect(token?: string): void {
    if (this.socket?.connected) {
      console.log("[SocketClient] Already connected");
      return;
    }

    const authToken = token || this.config.auth?.token;

    const options: Partial<ManagerOptions & SocketOptions> = {
      path: this.config.path,
      autoConnect: true,
      reconnection: this.config.reconnection,
      reconnectionAttempts: this.config.reconnectionAttempts,
      reconnectionDelay: this.config.reconnectionDelay,
      reconnectionDelayMax: this.config.reconnectionDelayMax,
      timeout: this.config.timeout,
      transports: ["websocket", "polling"],
      withCredentials: true,
    };

    if (authToken) {
      options.auth = { token: authToken };
    }

    this.updateStatus("connecting");
    this.socket = io(this.config.url!, options);
    this.setupEventListeners();
  }

  /**
   * Disconnect from the socket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.updateStatus("disconnected");
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusChangeCallbacks.add(callback);
    return () => {
      this.statusChangeCallbacks.delete(callback);
    };
  }

  private updateStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.statusChangeCallbacks.forEach((cb) => cb(status));
  }

  // ===========================================================================
  // Event Setup
  // ===========================================================================

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("[SocketClient] Connected");
      this.reconnectAttempt = 0;
      this.updateStatus("connected");
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`[SocketClient] Disconnected: ${reason}`);
      this.updateStatus("disconnected");
    });

    this.socket.on("connect_error", (error) => {
      console.error("[SocketClient] Connection error:", error.message);
      this.updateStatus("error");
    });

    this.socket.io.on("reconnect_attempt", (attempt) => {
      this.reconnectAttempt = attempt;
      console.log(`[SocketClient] Reconnection attempt ${attempt}`);
      this.updateStatus("reconnecting");
    });

    this.socket.io.on("reconnect", (attempt) => {
      console.log(`[SocketClient] Reconnected after ${attempt} attempts`);
      this.reconnectAttempt = 0;
      this.updateStatus("connected");
    });

    this.socket.io.on("reconnect_failed", () => {
      console.error("[SocketClient] Reconnection failed");
      this.updateStatus("error");
    });

    // Re-register all existing event handlers
    this.eventHandlers.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        this.socket?.on(event, handler);
      });
    });
  }

  // ===========================================================================
  // Authentication
  // ===========================================================================

  /**
   * Authenticate with a token (if not provided during connection)
   */
  authenticate(token: string): Promise<AuthResult> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Not connected"));
        return;
      }

      const handleSuccess = (data: AuthResult) => {
        this.socket?.off("auth:error", handleError);
        resolve(data);
      };

      const handleError = (error: AuthError) => {
        this.socket?.off("auth:success", handleSuccess);
        reject(new Error(error.message));
      };

      this.socket.once("auth:success", handleSuccess);
      this.socket.once("auth:error", handleError);
      this.socket.emit("auth", { token });

      // Timeout
      setTimeout(() => {
        this.socket?.off("auth:success", handleSuccess);
        this.socket?.off("auth:error", handleError);
        reject(new Error("Authentication timeout"));
      }, 10000);
    });
  }

  // ===========================================================================
  // Room Management
  // ===========================================================================

  /**
   * Join a room
   */
  joinRoom(room: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Not connected"));
        return;
      }

      const handleJoined = (data: RoomEvent) => {
        if (data.room === room) {
          this.socket?.off("join:error", handleError);
          resolve();
        }
      };

      const handleError = (error: JoinError) => {
        if (error.room === room) {
          this.socket?.off("joined", handleJoined);
          reject(new Error(error.message));
        }
      };

      this.socket.once("joined", handleJoined);
      this.socket.once("join:error", handleError);
      this.socket.emit("join", room);

      // Timeout
      setTimeout(() => {
        this.socket?.off("joined", handleJoined);
        this.socket?.off("join:error", handleError);
        reject(new Error("Join room timeout"));
      }, 10000);
    });
  }

  /**
   * Leave a room
   */
  leaveRoom(room: string): void {
    this.socket?.emit("leave", room);
  }

  // ===========================================================================
  // Messaging
  // ===========================================================================

  /**
   * Send a message to a room
   */
  sendMessage(room: string, content: string, metadata?: Record<string, unknown>): void {
    this.socket?.emit("message", { room, content, metadata });
  }

  /**
   * Start typing indicator
   */
  startTyping(room: string): void {
    this.socket?.emit("typing:start", room);
  }

  /**
   * Stop typing indicator
   */
  stopTyping(room: string): void {
    this.socket?.emit("typing:stop", room);
  }

  // ===========================================================================
  // Presence
  // ===========================================================================

  /**
   * Update presence status
   */
  updatePresence(status: PresenceInfo["status"]): void {
    this.socket?.emit("presence", status);
  }

  // ===========================================================================
  // Event Handling
  // ===========================================================================

  /**
   * Subscribe to an event
   */
  on<T = unknown>(event: string, handler: SocketEventHandler<T>): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler as SocketEventHandler);
    this.socket?.on(event, handler as SocketEventHandler);

    return () => {
      this.off(event, handler);
    };
  }

  /**
   * Unsubscribe from an event
   */
  off<T = unknown>(event: string, handler?: SocketEventHandler<T>): void {
    if (handler) {
      this.eventHandlers.get(event)?.delete(handler as SocketEventHandler);
      this.socket?.off(event, handler as SocketEventHandler);
    } else {
      this.eventHandlers.delete(event);
      this.socket?.off(event);
    }
  }

  /**
   * Subscribe to an event once
   */
  once<T = unknown>(event: string, handler: SocketEventHandler<T>): void {
    this.socket?.once(event, handler as SocketEventHandler);
  }

  /**
   * Emit an event
   */
  emit(event: string, data?: unknown): void {
    this.socket?.emit(event, data);
  }

  // ===========================================================================
  // Convenience Event Subscriptions
  // ===========================================================================

  /**
   * Subscribe to messages
   */
  onMessage(handler: SocketEventHandler<ChatMessage>): () => void {
    return this.on("message", handler);
  }

  /**
   * Subscribe to presence updates
   */
  onPresenceUpdate(handler: SocketEventHandler<PresenceInfo>): () => void {
    return this.on("presence:update", handler);
  }

  /**
   * Subscribe to notifications
   */
  onNotification(handler: SocketEventHandler<NotificationPayload>): () => void {
    return this.on("notification", handler);
  }

  /**
   * Subscribe to typing start events
   */
  onTypingStart(handler: SocketEventHandler<TypingEvent>): () => void {
    return this.on("typing:start", handler);
  }

  /**
   * Subscribe to typing stop events
   */
  onTypingStop(handler: SocketEventHandler<TypingEvent>): () => void {
    return this.on("typing:stop", handler);
  }

  /**
   * Subscribe to user joined events
   */
  onUserJoined(handler: SocketEventHandler<RoomEvent>): () => void {
    return this.on("user:joined", handler);
  }

  /**
   * Subscribe to user left events
   */
  onUserLeft(handler: SocketEventHandler<RoomEvent>): () => void {
    return this.on("user:left", handler);
  }

  /**
   * Subscribe to errors
   */
  onError(handler: SocketEventHandler<{ code: string; message: string }>): () => void {
    return this.on("error", handler);
  }

  // ===========================================================================
  // Utilities
  // ===========================================================================

  /**
   * Get the underlying socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Get reconnection attempt number
   */
  getReconnectAttempt(): number {
    return this.reconnectAttempt;
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let socketClientInstance: SocketClient | null = null;

/**
 * Get or create the socket client singleton
 */
export function getSocketClient(config?: SocketConfig): SocketClient {
  if (!socketClientInstance) {
    socketClientInstance = new SocketClient(config);
  }
  return socketClientInstance;
}

/**
 * Create a new socket client instance
 */
export function createSocketClient(config?: SocketConfig): SocketClient {
  return new SocketClient(config);
}

export default SocketClient;
