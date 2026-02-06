import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

// =============================================================================
// Types
// =============================================================================

/// Connection status enum
enum SocketConnectionStatus {
  disconnected,
  connecting,
  connected,
  reconnecting,
  error,
}

/// Presence status enum
enum PresenceStatus {
  online,
  away,
  busy,
  offline,
}

/// Presence info model
class PresenceInfo {
  final String userId;
  final PresenceStatus status;
  final DateTime? lastSeen;

  const PresenceInfo({
    required this.userId,
    required this.status,
    this.lastSeen,
  });

  factory PresenceInfo.fromJson(Map<String, dynamic> json) {
    return PresenceInfo(
      userId: json['userId'] as String,
      status: _parseStatus(json['status'] as String?),
      lastSeen: json['lastSeen'] != null
          ? DateTime.tryParse(json['lastSeen'] as String)
          : null,
    );
  }

  static PresenceStatus _parseStatus(String? status) {
    switch (status) {
      case 'online':
        return PresenceStatus.online;
      case 'away':
        return PresenceStatus.away;
      case 'busy':
        return PresenceStatus.busy;
      default:
        return PresenceStatus.offline;
    }
  }

  String get statusString {
    switch (status) {
      case PresenceStatus.online:
        return 'online';
      case PresenceStatus.away:
        return 'away';
      case PresenceStatus.busy:
        return 'busy';
      case PresenceStatus.offline:
        return 'offline';
    }
  }
}

/// Chat message model
class ChatMessage {
  final String id;
  final String room;
  final String userId;
  final String content;
  final Map<String, dynamic>? metadata;
  final DateTime timestamp;

  const ChatMessage({
    required this.id,
    required this.room,
    required this.userId,
    required this.content,
    this.metadata,
    required this.timestamp,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String,
      room: json['room'] as String,
      userId: json['userId'] as String,
      content: json['content'] as String,
      metadata: json['metadata'] as Map<String, dynamic>?,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'room': room,
        'userId': userId,
        'content': content,
        'metadata': metadata,
        'timestamp': timestamp.toIso8601String(),
      };
}

/// Notification payload model
class NotificationPayload {
  final String type;
  final String title;
  final String message;
  final Map<String, dynamic>? data;
  final DateTime timestamp;

  const NotificationPayload({
    required this.type,
    required this.title,
    required this.message,
    this.data,
    required this.timestamp,
  });

  factory NotificationPayload.fromJson(Map<String, dynamic> json) {
    return NotificationPayload(
      type: json['type'] as String,
      title: json['title'] as String,
      message: json['message'] as String,
      data: json['data'] as Map<String, dynamic>?,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }
}

/// Typing event model
class TypingEvent {
  final String userId;
  final String room;

  const TypingEvent({
    required this.userId,
    required this.room,
  });

  factory TypingEvent.fromJson(Map<String, dynamic> json) {
    return TypingEvent(
      userId: json['userId'] as String,
      room: json['room'] as String,
    );
  }
}

/// Room event model
class RoomEvent {
  final String room;
  final String? userId;

  const RoomEvent({
    required this.room,
    this.userId,
  });

  factory RoomEvent.fromJson(Map<String, dynamic> json) {
    return RoomEvent(
      room: json['room'] as String,
      userId: json['userId'] as String?,
    );
  }
}

/// Auth result model
class AuthResult {
  final String userId;
  final String? email;
  final String? role;

  const AuthResult({
    required this.userId,
    this.email,
    this.role,
  });

  factory AuthResult.fromJson(Map<String, dynamic> json) {
    return AuthResult(
      userId: json['userId'] as String,
      email: json['email'] as String?,
      role: json['role'] as String?,
    );
  }
}

/// Socket error model
class SocketError {
  final String code;
  final String message;

  const SocketError({
    required this.code,
    required this.message,
  });

  factory SocketError.fromJson(Map<String, dynamic> json) {
    return SocketError(
      code: json['code'] as String,
      message: json['message'] as String,
    );
  }
}

// =============================================================================
// Socket Service Configuration
// =============================================================================

/// Socket service configuration
class SocketConfig {
  final String url;
  final String path;
  final bool autoConnect;
  final int reconnectionAttempts;
  final int reconnectionDelay;
  final int reconnectionDelayMax;
  final int timeout;
  final String? token;

  const SocketConfig({
    required this.url,
    this.path = '/socket.io',
    this.autoConnect = false,
    this.reconnectionAttempts = 10,
    this.reconnectionDelay = 1000,
    this.reconnectionDelayMax = 10000,
    this.timeout = 20000,
    this.token,
  });

  SocketConfig copyWith({
    String? url,
    String? path,
    bool? autoConnect,
    int? reconnectionAttempts,
    int? reconnectionDelay,
    int? reconnectionDelayMax,
    int? timeout,
    String? token,
  }) {
    return SocketConfig(
      url: url ?? this.url,
      path: path ?? this.path,
      autoConnect: autoConnect ?? this.autoConnect,
      reconnectionAttempts: reconnectionAttempts ?? this.reconnectionAttempts,
      reconnectionDelay: reconnectionDelay ?? this.reconnectionDelay,
      reconnectionDelayMax: reconnectionDelayMax ?? this.reconnectionDelayMax,
      timeout: timeout ?? this.timeout,
      token: token ?? this.token,
    );
  }
}

// =============================================================================
// Socket Service Interface
// =============================================================================

abstract class SocketService {
  /// Current connection status
  SocketConnectionStatus get status;

  /// Stream of connection status changes
  Stream<SocketConnectionStatus> get statusStream;

  /// Check if connected
  bool get isConnected;

  /// Connect to the socket server
  Future<void> connect({String? token});

  /// Disconnect from the socket server
  void disconnect();

  /// Authenticate with a token
  Future<AuthResult> authenticate(String token);

  /// Join a room
  Future<void> joinRoom(String room);

  /// Leave a room
  void leaveRoom(String room);

  /// Send a message to a room
  void sendMessage(String room, String content, {Map<String, dynamic>? metadata});

  /// Start typing indicator
  void startTyping(String room);

  /// Stop typing indicator
  void stopTyping(String room);

  /// Update presence status
  void updatePresence(PresenceStatus status);

  /// Subscribe to messages
  Stream<ChatMessage> get messageStream;

  /// Subscribe to presence updates
  Stream<PresenceInfo> get presenceStream;

  /// Subscribe to notifications
  Stream<NotificationPayload> get notificationStream;

  /// Subscribe to typing events
  Stream<TypingEvent> get typingStartStream;

  /// Subscribe to typing stop events
  Stream<TypingEvent> get typingStopStream;

  /// Subscribe to user joined events
  Stream<RoomEvent> get userJoinedStream;

  /// Subscribe to user left events
  Stream<RoomEvent> get userLeftStream;

  /// Subscribe to errors
  Stream<SocketError> get errorStream;

  /// Dispose resources
  void dispose();
}

// =============================================================================
// Socket Service Implementation
// =============================================================================

class SocketServiceImpl implements SocketService {
  final SocketConfig config;
  io.Socket? _socket;

  SocketConnectionStatus _status = SocketConnectionStatus.disconnected;
  int _reconnectAttempt = 0;

  // Stream controllers
  final _statusController = StreamController<SocketConnectionStatus>.broadcast();
  final _messageController = StreamController<ChatMessage>.broadcast();
  final _presenceController = StreamController<PresenceInfo>.broadcast();
  final _notificationController = StreamController<NotificationPayload>.broadcast();
  final _typingStartController = StreamController<TypingEvent>.broadcast();
  final _typingStopController = StreamController<TypingEvent>.broadcast();
  final _userJoinedController = StreamController<RoomEvent>.broadcast();
  final _userLeftController = StreamController<RoomEvent>.broadcast();
  final _errorController = StreamController<SocketError>.broadcast();

  // Completer for join room operations
  final Map<String, Completer<void>> _joinCompleters = {};

  SocketServiceImpl({required this.config});

  @override
  SocketConnectionStatus get status => _status;

  @override
  Stream<SocketConnectionStatus> get statusStream => _statusController.stream;

  @override
  bool get isConnected => _status == SocketConnectionStatus.connected;

  void _updateStatus(SocketConnectionStatus newStatus) {
    if (_status != newStatus) {
      _status = newStatus;
      _statusController.add(newStatus);
    }
  }

  @override
  Future<void> connect({String? token}) async {
    if (_socket?.connected == true) {
      print('[SocketService] Already connected');
      return;
    }

    _updateStatus(SocketConnectionStatus.connecting);

    final authToken = token ?? config.token;

    final optionBuilder = io.OptionBuilder()
        .setTransports(['websocket', 'polling'])
        .setPath(config.path)
        .enableReconnection()
        .setReconnectionAttempts(config.reconnectionAttempts)
        .setReconnectionDelay(config.reconnectionDelay)
        .setReconnectionDelayMax(config.reconnectionDelayMax)
        .setTimeout(config.timeout);

    if (authToken != null) {
      optionBuilder.setAuth({'token': authToken});
    }

    _socket = io.io(config.url, optionBuilder.build());
    _setupEventListeners();

    _socket!.connect();
  }

  void _setupEventListeners() {
    if (_socket == null) return;

    _socket!.onConnect((_) {
      print('[SocketService] Connected');
      _reconnectAttempt = 0;
      _updateStatus(SocketConnectionStatus.connected);
    });

    _socket!.onDisconnect((reason) {
      print('[SocketService] Disconnected: $reason');
      _updateStatus(SocketConnectionStatus.disconnected);
    });

    _socket!.onConnectError((error) {
      print('[SocketService] Connection error: $error');
      _updateStatus(SocketConnectionStatus.error);
    });

    _socket!.onReconnectAttempt((attempt) {
      _reconnectAttempt = attempt as int;
      print('[SocketService] Reconnection attempt $_reconnectAttempt');
      _updateStatus(SocketConnectionStatus.reconnecting);
    });

    _socket!.onReconnect((attempt) {
      print('[SocketService] Reconnected after $attempt attempts');
      _reconnectAttempt = 0;
      _updateStatus(SocketConnectionStatus.connected);
    });

    _socket!.onReconnectFailed((_) {
      print('[SocketService] Reconnection failed');
      _updateStatus(SocketConnectionStatus.error);
    });

    // Custom event listeners
    _socket!.on('message', (data) {
      try {
        final message = ChatMessage.fromJson(data as Map<String, dynamic>);
        _messageController.add(message);
      } catch (e) {
        print('[SocketService] Error parsing message: $e');
      }
    });

    _socket!.on('presence:update', (data) {
      try {
        final presence = PresenceInfo.fromJson(data as Map<String, dynamic>);
        _presenceController.add(presence);
      } catch (e) {
        print('[SocketService] Error parsing presence: $e');
      }
    });

    _socket!.on('notification', (data) {
      try {
        final notification = NotificationPayload.fromJson(data as Map<String, dynamic>);
        _notificationController.add(notification);
      } catch (e) {
        print('[SocketService] Error parsing notification: $e');
      }
    });

    _socket!.on('typing:start', (data) {
      try {
        final event = TypingEvent.fromJson(data as Map<String, dynamic>);
        _typingStartController.add(event);
      } catch (e) {
        print('[SocketService] Error parsing typing:start: $e');
      }
    });

    _socket!.on('typing:stop', (data) {
      try {
        final event = TypingEvent.fromJson(data as Map<String, dynamic>);
        _typingStopController.add(event);
      } catch (e) {
        print('[SocketService] Error parsing typing:stop: $e');
      }
    });

    _socket!.on('user:joined', (data) {
      try {
        final event = RoomEvent.fromJson(data as Map<String, dynamic>);
        _userJoinedController.add(event);
      } catch (e) {
        print('[SocketService] Error parsing user:joined: $e');
      }
    });

    _socket!.on('user:left', (data) {
      try {
        final event = RoomEvent.fromJson(data as Map<String, dynamic>);
        _userLeftController.add(event);
      } catch (e) {
        print('[SocketService] Error parsing user:left: $e');
      }
    });

    _socket!.on('joined', (data) {
      try {
        final roomData = data as Map<String, dynamic>;
        final room = roomData['room'] as String;
        _joinCompleters[room]?.complete();
        _joinCompleters.remove(room);
      } catch (e) {
        print('[SocketService] Error parsing joined: $e');
      }
    });

    _socket!.on('join:error', (data) {
      try {
        final errorData = data as Map<String, dynamic>;
        final room = errorData['room'] as String;
        final message = errorData['message'] as String;
        _joinCompleters[room]?.completeError(Exception(message));
        _joinCompleters.remove(room);
      } catch (e) {
        print('[SocketService] Error parsing join:error: $e');
      }
    });

    _socket!.on('error', (data) {
      try {
        final error = SocketError.fromJson(data as Map<String, dynamic>);
        _errorController.add(error);
      } catch (e) {
        print('[SocketService] Error parsing error: $e');
      }
    });
  }

  @override
  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _updateStatus(SocketConnectionStatus.disconnected);
  }

  @override
  Future<AuthResult> authenticate(String token) async {
    if (_socket == null) {
      throw Exception('Not connected');
    }

    final completer = Completer<AuthResult>();

    void onSuccess(data) {
      _socket?.off('auth:error');
      completer.complete(AuthResult.fromJson(data as Map<String, dynamic>));
    }

    void onError(data) {
      _socket?.off('auth:success');
      final error = SocketError.fromJson(data as Map<String, dynamic>);
      completer.completeError(Exception(error.message));
    }

    _socket!.once('auth:success', onSuccess);
    _socket!.once('auth:error', onError);
    _socket!.emit('auth', {'token': token});

    // Timeout
    Future.delayed(const Duration(seconds: 10), () {
      if (!completer.isCompleted) {
        _socket?.off('auth:success');
        _socket?.off('auth:error');
        completer.completeError(Exception('Authentication timeout'));
      }
    });

    return completer.future;
  }

  @override
  Future<void> joinRoom(String room) async {
    if (_socket == null) {
      throw Exception('Not connected');
    }

    final completer = Completer<void>();
    _joinCompleters[room] = completer;

    _socket!.emit('join', room);

    // Timeout
    Future.delayed(const Duration(seconds: 10), () {
      if (_joinCompleters.containsKey(room)) {
        _joinCompleters[room]?.completeError(Exception('Join room timeout'));
        _joinCompleters.remove(room);
      }
    });

    return completer.future;
  }

  @override
  void leaveRoom(String room) {
    _socket?.emit('leave', room);
  }

  @override
  void sendMessage(String room, String content, {Map<String, dynamic>? metadata}) {
    _socket?.emit('message', {
      'room': room,
      'content': content,
      if (metadata != null) 'metadata': metadata,
    });
  }

  @override
  void startTyping(String room) {
    _socket?.emit('typing:start', room);
  }

  @override
  void stopTyping(String room) {
    _socket?.emit('typing:stop', room);
  }

  @override
  void updatePresence(PresenceStatus status) {
    _socket?.emit('presence', status.name);
  }

  @override
  Stream<ChatMessage> get messageStream => _messageController.stream;

  @override
  Stream<PresenceInfo> get presenceStream => _presenceController.stream;

  @override
  Stream<NotificationPayload> get notificationStream => _notificationController.stream;

  @override
  Stream<TypingEvent> get typingStartStream => _typingStartController.stream;

  @override
  Stream<TypingEvent> get typingStopStream => _typingStopController.stream;

  @override
  Stream<RoomEvent> get userJoinedStream => _userJoinedController.stream;

  @override
  Stream<RoomEvent> get userLeftStream => _userLeftController.stream;

  @override
  Stream<SocketError> get errorStream => _errorController.stream;

  @override
  void dispose() {
    disconnect();
    _statusController.close();
    _messageController.close();
    _presenceController.close();
    _notificationController.close();
    _typingStartController.close();
    _typingStopController.close();
    _userJoinedController.close();
    _userLeftController.close();
    _errorController.close();
  }
}

// =============================================================================
// Providers
// =============================================================================

/// Socket configuration provider
final socketConfigProvider = Provider<SocketConfig>((ref) {
  // Override this in your app with your actual configuration
  return const SocketConfig(
    url: 'http://localhost:8000',
    path: '/socket.io',
  );
});

/// Socket service provider
final socketServiceProvider = Provider<SocketService>((ref) {
  final config = ref.watch(socketConfigProvider);
  final service = SocketServiceImpl(config: config);

  ref.onDispose(() {
    service.dispose();
  });

  return service;
});

/// Connection status provider
final socketStatusProvider = StreamProvider<SocketConnectionStatus>((ref) {
  final service = ref.watch(socketServiceProvider);
  return service.statusStream;
});

/// Is connected provider
final isSocketConnectedProvider = Provider<bool>((ref) {
  final status = ref.watch(socketStatusProvider);
  return status.valueOrNull == SocketConnectionStatus.connected;
});
