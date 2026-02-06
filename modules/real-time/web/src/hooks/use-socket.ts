"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  SocketClient,
  getSocketClient,
  ConnectionStatus,
  PresenceInfo,
  ChatMessage,
  NotificationPayload,
  TypingEvent,
  RoomEvent,
  SocketConfig,
} from "../lib/socket";

// =============================================================================
// useSocket Hook - Main socket connection hook
// =============================================================================

export interface UseSocketOptions {
  config?: SocketConfig;
  token?: string;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

export interface UseSocketReturn {
  socket: SocketClient | null;
  status: ConnectionStatus;
  isConnected: boolean;
  connect: (token?: string) => void;
  disconnect: () => void;
  reconnectAttempt: number;
}

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { config, token, autoConnect = true, onConnect, onDisconnect, onError } = options;

  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const socketRef = useRef<SocketClient | null>(null);
  const mountedRef = useRef(true);

  // Initialize socket client
  useEffect(() => {
    socketRef.current = getSocketClient(config);

    const unsubscribeStatus = socketRef.current.onStatusChange((newStatus) => {
      if (mountedRef.current) {
        setStatus(newStatus);
        setReconnectAttempt(socketRef.current?.getReconnectAttempt() ?? 0);

        if (newStatus === "connected") {
          onConnect?.();
        } else if (newStatus === "disconnected") {
          onDisconnect?.("disconnected");
        } else if (newStatus === "error") {
          onError?.(new Error("Connection error"));
        }
      }
    });

    return () => {
      mountedRef.current = false;
      unsubscribeStatus();
    };
  }, [config, onConnect, onDisconnect, onError]);

  // Auto connect
  useEffect(() => {
    if (autoConnect && socketRef.current && !socketRef.current.isConnected()) {
      socketRef.current.connect(token);
    }

    return () => {
      if (socketRef.current?.isConnected()) {
        socketRef.current.disconnect();
      }
    };
  }, [autoConnect, token]);

  const connect = useCallback((authToken?: string) => {
    socketRef.current?.connect(authToken || token);
  }, [token]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  return {
    socket: socketRef.current,
    status,
    isConnected: status === "connected",
    connect,
    disconnect,
    reconnectAttempt,
  };
}

// =============================================================================
// usePresence Hook - Track user presence
// =============================================================================

export interface UsePresenceOptions {
  socket: SocketClient | null;
  trackUsers?: string[];
}

export interface UsePresenceReturn {
  presenceMap: Map<string, PresenceInfo>;
  getPresence: (userId: string) => PresenceInfo | undefined;
  updateMyPresence: (status: PresenceInfo["status"]) => void;
  isUserOnline: (userId: string) => boolean;
}

export function usePresence(options: UsePresenceOptions): UsePresenceReturn {
  const { socket, trackUsers } = options;
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceInfo>>(new Map());

  useEffect(() => {
    if (!socket) return;

    const unsubscribe = socket.onPresenceUpdate((presence) => {
      // If tracking specific users, only update those
      if (trackUsers && !trackUsers.includes(presence.userId)) {
        return;
      }

      setPresenceMap((prev) => {
        const next = new Map(prev);
        next.set(presence.userId, presence);
        return next;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [socket, trackUsers]);

  const getPresence = useCallback(
    (userId: string) => presenceMap.get(userId),
    [presenceMap]
  );

  const updateMyPresence = useCallback(
    (status: PresenceInfo["status"]) => {
      socket?.updatePresence(status);
    },
    [socket]
  );

  const isUserOnline = useCallback(
    (userId: string) => {
      const presence = presenceMap.get(userId);
      return presence?.status === "online" || presence?.status === "away" || presence?.status === "busy";
    },
    [presenceMap]
  );

  return {
    presenceMap,
    getPresence,
    updateMyPresence,
    isUserOnline,
  };
}

// =============================================================================
// useRoom Hook - Manage room membership
// =============================================================================

export interface UseRoomOptions {
  socket: SocketClient | null;
  room: string;
  autoJoin?: boolean;
}

export interface UseRoomReturn {
  isJoined: boolean;
  isJoining: boolean;
  error: string | null;
  join: () => Promise<void>;
  leave: () => void;
  members: string[];
}

export function useRoom(options: UseRoomOptions): UseRoomReturn {
  const { socket, room, autoJoin = true } = options;

  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<string[]>([]);

  // Handle user joined/left
  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = (event: RoomEvent) => {
      if (event.room === room && event.userId) {
        setMembers((prev) => {
          if (prev.includes(event.userId!)) return prev;
          return [...prev, event.userId!];
        });
      }
    };

    const handleUserLeft = (event: RoomEvent) => {
      if (event.room === room && event.userId) {
        setMembers((prev) => prev.filter((id) => id !== event.userId));
      }
    };

    const unsubJoined = socket.onUserJoined(handleUserJoined);
    const unsubLeft = socket.onUserLeft(handleUserLeft);

    return () => {
      unsubJoined();
      unsubLeft();
    };
  }, [socket, room]);

  const join = useCallback(async () => {
    if (!socket || isJoined || isJoining) return;

    setIsJoining(true);
    setError(null);

    try {
      await socket.joinRoom(room);
      setIsJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room");
    } finally {
      setIsJoining(false);
    }
  }, [socket, room, isJoined, isJoining]);

  const leave = useCallback(() => {
    if (!socket || !isJoined) return;
    socket.leaveRoom(room);
    setIsJoined(false);
    setMembers([]);
  }, [socket, room, isJoined]);

  // Auto join
  useEffect(() => {
    if (autoJoin && socket?.isConnected() && !isJoined && !isJoining) {
      join();
    }

    return () => {
      if (isJoined && socket) {
        socket.leaveRoom(room);
      }
    };
  }, [autoJoin, socket, isJoined, isJoining, join, room]);

  return {
    isJoined,
    isJoining,
    error,
    join,
    leave,
    members,
  };
}

// =============================================================================
// useChat Hook - Chat functionality with messages and typing
// =============================================================================

export interface UseChatOptions {
  socket: SocketClient | null;
  room: string;
  maxMessages?: number;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  typingUsers: string[];
  sendMessage: (content: string, metadata?: Record<string, unknown>) => void;
  startTyping: () => void;
  stopTyping: () => void;
  clearMessages: () => void;
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const { socket, room, maxMessages = 100 } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message: ChatMessage) => {
      if (message.room === room) {
        setMessages((prev) => {
          const next = [...prev, message];
          // Limit messages
          if (next.length > maxMessages) {
            return next.slice(-maxMessages);
          }
          return next;
        });
      }
    };

    const unsubscribe = socket.onMessage(handleMessage);

    return () => {
      unsubscribe();
    };
  }, [socket, room, maxMessages]);

  // Handle typing indicators
  useEffect(() => {
    if (!socket) return;

    const handleTypingStart = (event: TypingEvent) => {
      if (event.room === room) {
        setTypingUsers((prev) => {
          if (prev.includes(event.userId)) return prev;
          return [...prev, event.userId];
        });

        // Auto-remove after timeout
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((id) => id !== event.userId));
        }, 5000);
      }
    };

    const handleTypingStop = (event: TypingEvent) => {
      if (event.room === room) {
        setTypingUsers((prev) => prev.filter((id) => id !== event.userId));
      }
    };

    const unsubStart = socket.onTypingStart(handleTypingStart);
    const unsubStop = socket.onTypingStop(handleTypingStop);

    return () => {
      unsubStart();
      unsubStop();
    };
  }, [socket, room]);

  const sendMessage = useCallback(
    (content: string, metadata?: Record<string, unknown>) => {
      socket?.sendMessage(room, content, metadata);
    },
    [socket, room]
  );

  const startTyping = useCallback(() => {
    socket?.startTyping(room);

    // Auto-stop typing after 3 seconds of no input
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket?.stopTyping(room);
    }, 3000);
  }, [socket, room]);

  const stopTyping = useCallback(() => {
    socket?.stopTyping(room);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket, room]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    clearMessages,
  };
}

// =============================================================================
// useNotifications Hook - Handle real-time notifications
// =============================================================================

export interface UseNotificationsOptions {
  socket: SocketClient | null;
  maxNotifications?: number;
  onNotification?: (notification: NotificationPayload) => void;
}

export interface UseNotificationsReturn {
  notifications: NotificationPayload[];
  unreadCount: number;
  markAsRead: (index: number) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export function useNotifications(options: UseNotificationsOptions): UseNotificationsReturn {
  const { socket, maxNotifications = 50, onNotification } = options;

  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [readIndices, setReadIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: NotificationPayload) => {
      setNotifications((prev) => {
        const next = [notification, ...prev];
        if (next.length > maxNotifications) {
          return next.slice(0, maxNotifications);
        }
        return next;
      });
      onNotification?.(notification);
    };

    const unsubscribe = socket.onNotification(handleNotification);

    return () => {
      unsubscribe();
    };
  }, [socket, maxNotifications, onNotification]);

  const unreadCount = notifications.length - readIndices.size;

  const markAsRead = useCallback((index: number) => {
    setReadIndices((prev) => new Set([...prev, index]));
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIndices(new Set(notifications.map((_, i) => i)));
  }, [notifications]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setReadIndices(new Set());
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}
