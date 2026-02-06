import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../core/services/push_notification_service.dart';

// Note: This provider can be used with Riverpod or Provider package
// For Riverpod, convert to StateNotifierProvider

// =============================================================================
// Notification State
// =============================================================================

/// Permission status for notifications
enum NotificationPermissionStatus {
  unknown,
  granted,
  denied,
  provisional,
}

/// State for notification operations
class NotificationState {
  final bool isInitialized;
  final bool isLoading;
  final String? token;
  final NotificationPermissionStatus permissionStatus;
  final PushNotificationSettings settings;
  final List<PushNotification> recentNotifications;
  final PushNotification? lastNotification;
  final String? error;

  const NotificationState({
    this.isInitialized = false,
    this.isLoading = false,
    this.token,
    this.permissionStatus = NotificationPermissionStatus.unknown,
    this.settings = const PushNotificationSettings(),
    this.recentNotifications = const [],
    this.lastNotification,
    this.error,
  });

  NotificationState copyWith({
    bool? isInitialized,
    bool? isLoading,
    String? token,
    NotificationPermissionStatus? permissionStatus,
    PushNotificationSettings? settings,
    List<PushNotification>? recentNotifications,
    PushNotification? lastNotification,
    String? error,
    bool clearToken = false,
    bool clearError = false,
    bool clearLastNotification = false,
  }) {
    return NotificationState(
      isInitialized: isInitialized ?? this.isInitialized,
      isLoading: isLoading ?? this.isLoading,
      token: clearToken ? null : (token ?? this.token),
      permissionStatus: permissionStatus ?? this.permissionStatus,
      settings: settings ?? this.settings,
      recentNotifications: recentNotifications ?? this.recentNotifications,
      lastNotification: clearLastNotification
          ? null
          : (lastNotification ?? this.lastNotification),
      error: clearError ? null : (error ?? this.error),
    );
  }

  bool get hasToken => token != null && token!.isNotEmpty;
  bool get hasError => error != null;
  bool get isPermissionGranted =>
      permissionStatus == NotificationPermissionStatus.granted;
}

// =============================================================================
// Notification Provider (ChangeNotifier)
// =============================================================================

/// Provider for managing notification state
/// Use with Provider package or convert to Riverpod StateNotifier
class NotificationProvider extends ChangeNotifier {
  final PushNotificationService _notificationService;

  NotificationState _state = const NotificationState();
  NotificationState get state => _state;

  // Stream subscriptions
  StreamSubscription<PushNotification>? _messageSubscription;
  StreamSubscription<NotificationAction>? _actionSubscription;
  StreamSubscription<String?>? _tokenRefreshSubscription;

  // Convenience getters
  bool get isInitialized => _state.isInitialized;
  bool get isLoading => _state.isLoading;
  String? get token => _state.token;
  NotificationPermissionStatus get permissionStatus => _state.permissionStatus;
  PushNotificationSettings get settings => _state.settings;
  List<PushNotification> get recentNotifications => _state.recentNotifications;
  PushNotification? get lastNotification => _state.lastNotification;
  String? get error => _state.error;
  bool get hasToken => _state.hasToken;
  bool get isPermissionGranted => _state.isPermissionGranted;

  NotificationProvider({PushNotificationService? notificationService})
      : _notificationService = notificationService ?? PushNotificationService();

  // ===========================================================================
  // Initialization
  // ===========================================================================

  /// Initialize notification service
  Future<void> initialize({
    PushNotificationSettings? settings,
    String? apiBaseUrl,
    String? authToken,
  }) async {
    if (_state.isInitialized) {
      debugPrint('[NotificationProvider] Already initialized');
      return;
    }

    _setState(_state.copyWith(isLoading: true, clearError: true));

    try {
      // Initialize the notification service
      await _notificationService.init(settings: settings);

      // Get the token
      final token = await _notificationService.getToken();

      // Setup stream listeners
      _setupStreamListeners();

      // Check permission status
      final hasPermission = await _notificationService.areNotificationsEnabled();

      _setState(_state.copyWith(
        isInitialized: true,
        isLoading: false,
        token: token,
        settings: settings ?? const PushNotificationSettings(),
        permissionStatus: hasPermission
            ? NotificationPermissionStatus.granted
            : NotificationPermissionStatus.denied,
      ));

      debugPrint('[NotificationProvider] Initialized successfully');

      // Register token with backend if apiBaseUrl is provided
      if (apiBaseUrl != null && token != null) {
        await _registerTokenWithBackend(apiBaseUrl, token, authToken);
      }
    } catch (e) {
      debugPrint('[NotificationProvider] Initialization error: $e');
      _setState(_state.copyWith(
        isLoading: false,
        error: 'Failed to initialize notifications: $e',
      ));
    }
  }

  void _setupStreamListeners() {
    // Listen for foreground messages
    _messageSubscription = _notificationService.onMessage.listen((notification) {
      debugPrint(
          '[NotificationProvider] Received notification: ${notification.title}');
      _addNotification(notification);
    });

    // Listen for notification actions (taps)
    _actionSubscription = _notificationService.onAction.listen((action) {
      debugPrint('[NotificationProvider] Notification action: ${action.type}');
      _handleNotificationAction(action);
    });

    // Listen for token refresh
    _tokenRefreshSubscription =
        _notificationService.onTokenRefresh.listen((newToken) {
      debugPrint('[NotificationProvider] Token refreshed');
      _setState(_state.copyWith(token: newToken));
    });
  }

  void _addNotification(PushNotification notification) {
    final updatedNotifications = [
      notification,
      ..._state.recentNotifications,
    ].take(50).toList(); // Keep last 50 notifications

    _setState(_state.copyWith(
      recentNotifications: updatedNotifications,
      lastNotification: notification,
    ));
  }

  void _handleNotificationAction(NotificationAction action) {
    // Override this method or add a callback for custom handling
    debugPrint(
        '[NotificationProvider] Action: ${action.type}, Data: ${action.notification.data}');
  }

  // ===========================================================================
  // Permission
  // ===========================================================================

  /// Request notification permission
  Future<bool> requestPermission() async {
    _setState(_state.copyWith(isLoading: true, clearError: true));

    try {
      final granted = await _notificationService.requestPermission();

      _setState(_state.copyWith(
        isLoading: false,
        permissionStatus: granted
            ? NotificationPermissionStatus.granted
            : NotificationPermissionStatus.denied,
      ));

      if (granted) {
        // Get token after permission is granted
        final token = await _notificationService.getToken();
        _setState(_state.copyWith(token: token));
      }

      return granted;
    } catch (e) {
      debugPrint('[NotificationProvider] Request permission error: $e');
      _setState(_state.copyWith(
        isLoading: false,
        error: 'Failed to request permission: $e',
      ));
      return false;
    }
  }

  /// Check if notifications are enabled
  Future<bool> checkPermission() async {
    final enabled = await _notificationService.areNotificationsEnabled();
    _setState(_state.copyWith(
      permissionStatus: enabled
          ? NotificationPermissionStatus.granted
          : NotificationPermissionStatus.denied,
    ));
    return enabled;
  }

  // ===========================================================================
  // Token Management
  // ===========================================================================

  /// Get the current FCM token
  Future<String?> getToken() async {
    try {
      final token = await _notificationService.getToken();
      _setState(_state.copyWith(token: token));
      return token;
    } catch (e) {
      debugPrint('[NotificationProvider] Get token error: $e');
      return null;
    }
  }

  /// Delete the current token (call on logout)
  Future<void> deleteToken() async {
    try {
      await _notificationService.deleteToken();
      _setState(_state.copyWith(clearToken: true));
    } catch (e) {
      debugPrint('[NotificationProvider] Delete token error: $e');
    }
  }

  /// Register token with backend
  Future<void> _registerTokenWithBackend(
    String apiBaseUrl,
    String token,
    String? authToken,
  ) async {
    try {
      // This would typically make an HTTP request to your backend
      // Example implementation:
      // final response = await http.post(
      //   Uri.parse('$apiBaseUrl/notifications/register'),
      //   headers: {
      //     'Content-Type': 'application/json',
      //     if (authToken != null) 'Authorization': 'Bearer $authToken',
      //   },
      //   body: jsonEncode({
      //     'token': token,
      //     'platform': Platform.isIOS ? 'ios' : 'android',
      //   }),
      // );

      debugPrint('[NotificationProvider] Token registered with backend');
    } catch (e) {
      debugPrint('[NotificationProvider] Backend registration error: $e');
    }
  }

  // ===========================================================================
  // Topic Subscription
  // ===========================================================================

  /// Subscribe to a topic
  Future<void> subscribeToTopic(String topic) async {
    _setState(_state.copyWith(isLoading: true, clearError: true));

    try {
      await _notificationService.subscribeToTopic(topic);

      final updatedSettings = _state.settings.copyWith(
        subscribedTopics: [..._state.settings.subscribedTopics, topic],
      );

      _setState(_state.copyWith(
        isLoading: false,
        settings: updatedSettings,
      ));

      debugPrint('[NotificationProvider] Subscribed to topic: $topic');
    } catch (e) {
      debugPrint('[NotificationProvider] Subscribe to topic error: $e');
      _setState(_state.copyWith(
        isLoading: false,
        error: 'Failed to subscribe to topic: $e',
      ));
    }
  }

  /// Unsubscribe from a topic
  Future<void> unsubscribeFromTopic(String topic) async {
    _setState(_state.copyWith(isLoading: true, clearError: true));

    try {
      await _notificationService.unsubscribeFromTopic(topic);

      final updatedSettings = _state.settings.copyWith(
        subscribedTopics:
            _state.settings.subscribedTopics.where((t) => t != topic).toList(),
      );

      _setState(_state.copyWith(
        isLoading: false,
        settings: updatedSettings,
      ));

      debugPrint('[NotificationProvider] Unsubscribed from topic: $topic');
    } catch (e) {
      debugPrint('[NotificationProvider] Unsubscribe from topic error: $e');
      _setState(_state.copyWith(
        isLoading: false,
        error: 'Failed to unsubscribe from topic: $e',
      ));
    }
  }

  /// Check if subscribed to a topic
  bool isSubscribedToTopic(String topic) {
    return _state.settings.subscribedTopics.contains(topic);
  }

  // ===========================================================================
  // Settings
  // ===========================================================================

  /// Update notification settings
  void updateSettings(PushNotificationSettings newSettings) {
    _notificationService.updateSettings(newSettings);
    _setState(_state.copyWith(settings: newSettings));
  }

  /// Toggle foreground notifications
  void setShowInForeground(bool show) {
    _notificationService.setShowInForeground(show);
    final updatedSettings = _state.settings.copyWith(showInForeground: show);
    _setState(_state.copyWith(settings: updatedSettings));
  }

  /// Toggle notification sounds
  void setPlaySound(bool play) {
    final updatedSettings = _state.settings.copyWith(playSound: play);
    _setState(_state.copyWith(settings: updatedSettings));
  }

  /// Toggle badge display
  void setShowBadge(bool show) {
    final updatedSettings = _state.settings.copyWith(showBadge: show);
    _setState(_state.copyWith(settings: updatedSettings));
  }

  // ===========================================================================
  // Local Notifications
  // ===========================================================================

  /// Show a local notification
  Future<void> showNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    try {
      await _notificationService.showLocalNotification(
        title: title,
        body: body,
        payload: payload,
      );
    } catch (e) {
      debugPrint('[NotificationProvider] Show notification error: $e');
    }
  }

  /// Cancel all notifications
  Future<void> cancelAllNotifications() async {
    await _notificationService.cancelAllNotifications();
  }

  // ===========================================================================
  // Notification History
  // ===========================================================================

  /// Clear recent notifications
  void clearRecentNotifications() {
    _setState(_state.copyWith(
      recentNotifications: [],
      clearLastNotification: true,
    ));
  }

  /// Remove a specific notification from history
  void removeNotification(PushNotification notification) {
    final updatedNotifications = _state.recentNotifications
        .where((n) => n.receivedAt != notification.receivedAt)
        .toList();
    _setState(_state.copyWith(recentNotifications: updatedNotifications));
  }

  /// Clear the last notification (after handling)
  void clearLastNotification() {
    _setState(_state.copyWith(clearLastNotification: true));
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  /// Clear error state
  void clearError() {
    _setState(_state.copyWith(clearError: true));
  }

  void _setState(NotificationState newState) {
    _state = newState;
    notifyListeners();
  }

  @override
  void dispose() {
    _messageSubscription?.cancel();
    _actionSubscription?.cancel();
    _tokenRefreshSubscription?.cancel();
    _notificationService.dispose();
    super.dispose();
  }
}

// =============================================================================
// Riverpod Providers (commented - uncomment when using Riverpod)
// =============================================================================

// import 'package:flutter_riverpod/flutter_riverpod.dart';
//
// /// Notification service provider
// final notificationServiceProvider = Provider<PushNotificationService>((ref) {
//   return PushNotificationService();
// });
//
// /// Notification state notifier
// class NotificationNotifier extends StateNotifier<NotificationState> {
//   final PushNotificationService _service;
//
//   NotificationNotifier(this._service) : super(const NotificationState());
//
//   // ... implement methods similar to NotificationProvider above
// }
//
// /// Notification state provider
// final notificationProvider =
//     StateNotifierProvider<NotificationNotifier, NotificationState>((ref) {
//   final service = ref.watch(notificationServiceProvider);
//   return NotificationNotifier(service);
// });
//
// /// FCM token provider
// final fcmTokenProvider = FutureProvider<String?>((ref) async {
//   final service = ref.watch(notificationServiceProvider);
//   return service.getToken();
// });
//
// /// Permission status provider
// final notificationPermissionProvider = FutureProvider<bool>((ref) async {
//   final service = ref.watch(notificationServiceProvider);
//   return service.areNotificationsEnabled();
// });
