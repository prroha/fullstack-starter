import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/services/socket_service.dart';

// =============================================================================
// Socket Connection State
// =============================================================================

/// State for socket connection management
class SocketConnectionState {
  final SocketConnectionStatus status;
  final bool isConnecting;
  final String? error;
  final int reconnectAttempt;

  const SocketConnectionState({
    this.status = SocketConnectionStatus.disconnected,
    this.isConnecting = false,
    this.error,
    this.reconnectAttempt = 0,
  });

  bool get isConnected => status == SocketConnectionStatus.connected;
  bool get isDisconnected => status == SocketConnectionStatus.disconnected;
  bool get isReconnecting => status == SocketConnectionStatus.reconnecting;
  bool get hasError => status == SocketConnectionStatus.error || error != null;

  SocketConnectionState copyWith({
    SocketConnectionStatus? status,
    bool? isConnecting,
    String? error,
    int? reconnectAttempt,
  }) {
    return SocketConnectionState(
      status: status ?? this.status,
      isConnecting: isConnecting ?? this.isConnecting,
      error: error,
      reconnectAttempt: reconnectAttempt ?? this.reconnectAttempt,
    );
  }
}

/// Socket connection notifier
class SocketConnectionNotifier extends StateNotifier<SocketConnectionState> {
  final SocketService _socketService;
  StreamSubscription<SocketConnectionStatus>? _statusSubscription;

  SocketConnectionNotifier(this._socketService)
      : super(const SocketConnectionState()) {
    _statusSubscription = _socketService.statusStream.listen(_onStatusChange);
  }

  void _onStatusChange(SocketConnectionStatus status) {
    state = state.copyWith(
      status: status,
      isConnecting: status == SocketConnectionStatus.connecting,
      error: status == SocketConnectionStatus.error ? 'Connection error' : null,
    );
  }

  Future<void> connect({String? token}) async {
    state = state.copyWith(isConnecting: true, error: null);
    try {
      await _socketService.connect(token: token);
    } catch (e) {
      state = state.copyWith(
        isConnecting: false,
        error: e.toString(),
        status: SocketConnectionStatus.error,
      );
    }
  }

  void disconnect() {
    _socketService.disconnect();
    state = state.copyWith(
      status: SocketConnectionStatus.disconnected,
      isConnecting: false,
    );
  }

  @override
  void dispose() {
    _statusSubscription?.cancel();
    super.dispose();
  }
}

/// Socket connection provider
final socketConnectionProvider =
    StateNotifierProvider<SocketConnectionNotifier, SocketConnectionState>((ref) {
  final service = ref.watch(socketServiceProvider);
  return SocketConnectionNotifier(service);
});

// =============================================================================
// Room State
// =============================================================================

/// State for room membership
class RoomState {
  final String room;
  final bool isJoined;
  final bool isJoining;
  final String? error;
  final List<String> members;

  const RoomState({
    required this.room,
    this.isJoined = false,
    this.isJoining = false,
    this.error,
    this.members = const [],
  });

  RoomState copyWith({
    String? room,
    bool? isJoined,
    bool? isJoining,
    String? error,
    List<String>? members,
  }) {
    return RoomState(
      room: room ?? this.room,
      isJoined: isJoined ?? this.isJoined,
      isJoining: isJoining ?? this.isJoining,
      error: error,
      members: members ?? this.members,
    );
  }
}

/// Room state notifier
class RoomNotifier extends StateNotifier<RoomState> {
  final SocketService _socketService;
  final String _room;
  StreamSubscription<RoomEvent>? _joinedSubscription;
  StreamSubscription<RoomEvent>? _leftSubscription;

  RoomNotifier(this._socketService, this._room)
      : super(RoomState(room: _room)) {
    _joinedSubscription = _socketService.userJoinedStream.listen(_onUserJoined);
    _leftSubscription = _socketService.userLeftStream.listen(_onUserLeft);
  }

  void _onUserJoined(RoomEvent event) {
    if (event.room == _room && event.userId != null) {
      if (!state.members.contains(event.userId)) {
        state = state.copyWith(members: [...state.members, event.userId!]);
      }
    }
  }

  void _onUserLeft(RoomEvent event) {
    if (event.room == _room && event.userId != null) {
      state = state.copyWith(
        members: state.members.where((id) => id != event.userId).toList(),
      );
    }
  }

  Future<void> join() async {
    if (state.isJoined || state.isJoining) return;

    state = state.copyWith(isJoining: true, error: null);
    try {
      await _socketService.joinRoom(_room);
      state = state.copyWith(isJoined: true, isJoining: false);
    } catch (e) {
      state = state.copyWith(
        isJoining: false,
        error: e.toString(),
      );
    }
  }

  void leave() {
    if (!state.isJoined) return;
    _socketService.leaveRoom(_room);
    state = state.copyWith(isJoined: false, members: []);
  }

  @override
  void dispose() {
    _joinedSubscription?.cancel();
    _leftSubscription?.cancel();
    if (state.isJoined) {
      _socketService.leaveRoom(_room);
    }
    super.dispose();
  }
}

/// Room state provider factory
final roomProvider = StateNotifierProvider.family<RoomNotifier, RoomState, String>(
  (ref, room) {
    final service = ref.watch(socketServiceProvider);
    return RoomNotifier(service, room);
  },
);

// =============================================================================
// Chat State
// =============================================================================

/// State for chat functionality
class ChatState {
  final String room;
  final List<ChatMessage> messages;
  final Set<String> typingUsers;
  final int maxMessages;

  const ChatState({
    required this.room,
    this.messages = const [],
    this.typingUsers = const {},
    this.maxMessages = 100,
  });

  ChatState copyWith({
    String? room,
    List<ChatMessage>? messages,
    Set<String>? typingUsers,
    int? maxMessages,
  }) {
    return ChatState(
      room: room ?? this.room,
      messages: messages ?? this.messages,
      typingUsers: typingUsers ?? this.typingUsers,
      maxMessages: maxMessages ?? this.maxMessages,
    );
  }
}

/// Chat state notifier
class ChatNotifier extends StateNotifier<ChatState> {
  final SocketService _socketService;
  final String _room;
  StreamSubscription<ChatMessage>? _messageSubscription;
  StreamSubscription<TypingEvent>? _typingStartSubscription;
  StreamSubscription<TypingEvent>? _typingStopSubscription;
  Timer? _typingTimer;

  ChatNotifier(this._socketService, this._room, {int maxMessages = 100})
      : super(ChatState(room: _room, maxMessages: maxMessages)) {
    _messageSubscription = _socketService.messageStream.listen(_onMessage);
    _typingStartSubscription = _socketService.typingStartStream.listen(_onTypingStart);
    _typingStopSubscription = _socketService.typingStopStream.listen(_onTypingStop);
  }

  void _onMessage(ChatMessage message) {
    if (message.room == _room) {
      var newMessages = [...state.messages, message];
      if (newMessages.length > state.maxMessages) {
        newMessages = newMessages.sublist(newMessages.length - state.maxMessages);
      }
      state = state.copyWith(messages: newMessages);
    }
  }

  void _onTypingStart(TypingEvent event) {
    if (event.room == _room) {
      state = state.copyWith(typingUsers: {...state.typingUsers, event.userId});

      // Auto-remove after timeout
      Future.delayed(const Duration(seconds: 5), () {
        if (mounted && state.typingUsers.contains(event.userId)) {
          state = state.copyWith(
            typingUsers: Set.from(state.typingUsers)..remove(event.userId),
          );
        }
      });
    }
  }

  void _onTypingStop(TypingEvent event) {
    if (event.room == _room) {
      state = state.copyWith(
        typingUsers: Set.from(state.typingUsers)..remove(event.userId),
      );
    }
  }

  void sendMessage(String content, {Map<String, dynamic>? metadata}) {
    _socketService.sendMessage(_room, content, metadata: metadata);
  }

  void startTyping() {
    _socketService.startTyping(_room);

    // Auto-stop typing after 3 seconds
    _typingTimer?.cancel();
    _typingTimer = Timer(const Duration(seconds: 3), () {
      _socketService.stopTyping(_room);
    });
  }

  void stopTyping() {
    _typingTimer?.cancel();
    _socketService.stopTyping(_room);
  }

  void clearMessages() {
    state = state.copyWith(messages: []);
  }

  @override
  void dispose() {
    _messageSubscription?.cancel();
    _typingStartSubscription?.cancel();
    _typingStopSubscription?.cancel();
    _typingTimer?.cancel();
    super.dispose();
  }
}

/// Chat state provider factory
final chatProvider = StateNotifierProvider.family<ChatNotifier, ChatState, String>(
  (ref, room) {
    final service = ref.watch(socketServiceProvider);
    return ChatNotifier(service, room);
  },
);

// =============================================================================
// Presence State
// =============================================================================

/// State for presence tracking
class PresenceState {
  final Map<String, PresenceInfo> presenceMap;

  const PresenceState({
    this.presenceMap = const {},
  });

  PresenceInfo? getPresence(String userId) => presenceMap[userId];

  bool isUserOnline(String userId) {
    final presence = presenceMap[userId];
    return presence?.status == PresenceStatus.online ||
        presence?.status == PresenceStatus.away ||
        presence?.status == PresenceStatus.busy;
  }

  List<String> get onlineUsers => presenceMap.entries
      .where((e) =>
          e.value.status == PresenceStatus.online ||
          e.value.status == PresenceStatus.away ||
          e.value.status == PresenceStatus.busy)
      .map((e) => e.key)
      .toList();

  PresenceState copyWith({
    Map<String, PresenceInfo>? presenceMap,
  }) {
    return PresenceState(
      presenceMap: presenceMap ?? this.presenceMap,
    );
  }
}

/// Presence state notifier
class PresenceNotifier extends StateNotifier<PresenceState> {
  final SocketService _socketService;
  StreamSubscription<PresenceInfo>? _presenceSubscription;

  PresenceNotifier(this._socketService) : super(const PresenceState()) {
    _presenceSubscription = _socketService.presenceStream.listen(_onPresenceUpdate);
  }

  void _onPresenceUpdate(PresenceInfo presence) {
    state = state.copyWith(
      presenceMap: {...state.presenceMap, presence.userId: presence},
    );
  }

  void updateMyPresence(PresenceStatus status) {
    _socketService.updatePresence(status);
  }

  @override
  void dispose() {
    _presenceSubscription?.cancel();
    super.dispose();
  }
}

/// Presence state provider
final presenceProvider =
    StateNotifierProvider<PresenceNotifier, PresenceState>((ref) {
  final service = ref.watch(socketServiceProvider);
  return PresenceNotifier(service);
});

// =============================================================================
// Notifications State
// =============================================================================

/// State for notifications
class NotificationsState {
  final List<NotificationPayload> notifications;
  final Set<int> readIndices;
  final int maxNotifications;

  const NotificationsState({
    this.notifications = const [],
    this.readIndices = const {},
    this.maxNotifications = 50,
  });

  int get unreadCount => notifications.length - readIndices.length;

  NotificationsState copyWith({
    List<NotificationPayload>? notifications,
    Set<int>? readIndices,
    int? maxNotifications,
  }) {
    return NotificationsState(
      notifications: notifications ?? this.notifications,
      readIndices: readIndices ?? this.readIndices,
      maxNotifications: maxNotifications ?? this.maxNotifications,
    );
  }
}

/// Notifications state notifier
class NotificationsNotifier extends StateNotifier<NotificationsState> {
  final SocketService _socketService;
  StreamSubscription<NotificationPayload>? _notificationSubscription;

  NotificationsNotifier(this._socketService, {int maxNotifications = 50})
      : super(NotificationsState(maxNotifications: maxNotifications)) {
    _notificationSubscription =
        _socketService.notificationStream.listen(_onNotification);
  }

  void _onNotification(NotificationPayload notification) {
    var newNotifications = [notification, ...state.notifications];
    if (newNotifications.length > state.maxNotifications) {
      newNotifications = newNotifications.sublist(0, state.maxNotifications);
    }
    state = state.copyWith(notifications: newNotifications);
  }

  void markAsRead(int index) {
    state = state.copyWith(readIndices: {...state.readIndices, index});
  }

  void markAllAsRead() {
    state = state.copyWith(
      readIndices: Set.from(List.generate(state.notifications.length, (i) => i)),
    );
  }

  void clearNotifications() {
    state = state.copyWith(notifications: [], readIndices: {});
  }

  @override
  void dispose() {
    _notificationSubscription?.cancel();
    super.dispose();
  }
}

/// Notifications state provider
final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, NotificationsState>((ref) {
  final service = ref.watch(socketServiceProvider);
  return NotificationsNotifier(service);
});
