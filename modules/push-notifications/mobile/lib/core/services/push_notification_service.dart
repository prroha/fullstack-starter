import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

// =============================================================================
// Types
// =============================================================================

/// Represents a push notification
class PushNotification {
  final String? title;
  final String? body;
  final String? imageUrl;
  final Map<String, dynamic>? data;
  final DateTime receivedAt;

  PushNotification({
    this.title,
    this.body,
    this.imageUrl,
    this.data,
    DateTime? receivedAt,
  }) : receivedAt = receivedAt ?? DateTime.now();

  factory PushNotification.fromJson(Map<String, dynamic> json) {
    return PushNotification(
      title: json['title'] as String?,
      body: json['body'] as String?,
      imageUrl: json['imageUrl'] as String?,
      data: json['data'] as Map<String, dynamic>?,
    );
  }

  factory PushNotification.fromRemoteMessage(RemoteMessage message) {
    return PushNotification(
      title: message.notification?.title,
      body: message.notification?.body,
      imageUrl: message.notification?.android?.imageUrl ??
          message.notification?.apple?.imageUrl,
      data: message.data,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'body': body,
      'imageUrl': imageUrl,
      'data': data,
      'receivedAt': receivedAt.toIso8601String(),
    };
  }

  @override
  String toString() => 'PushNotification(title: $title, body: $body)';
}

/// Notification action types
enum NotificationActionType {
  opened, // User tapped on notification
  dismissed, // User dismissed notification
  action, // User clicked on action button
}

/// Notification action
class NotificationAction {
  final NotificationActionType type;
  final String? actionId;
  final PushNotification notification;

  NotificationAction({
    required this.type,
    this.actionId,
    required this.notification,
  });
}

/// Push notification settings
class PushNotificationSettings {
  final bool enabled;
  final bool showInForeground;
  final bool playSound;
  final bool showBadge;
  final List<String> subscribedTopics;

  const PushNotificationSettings({
    this.enabled = true,
    this.showInForeground = true,
    this.playSound = true,
    this.showBadge = true,
    this.subscribedTopics = const [],
  });

  PushNotificationSettings copyWith({
    bool? enabled,
    bool? showInForeground,
    bool? playSound,
    bool? showBadge,
    List<String>? subscribedTopics,
  }) {
    return PushNotificationSettings(
      enabled: enabled ?? this.enabled,
      showInForeground: showInForeground ?? this.showInForeground,
      playSound: playSound ?? this.playSound,
      showBadge: showBadge ?? this.showBadge,
      subscribedTopics: subscribedTopics ?? this.subscribedTopics,
    );
  }
}

// =============================================================================
// Push Notification Service
// =============================================================================

/// Service for handling push notifications
class PushNotificationService {
  static final PushNotificationService _instance =
      PushNotificationService._internal();

  factory PushNotificationService() => _instance;

  PushNotificationService._internal();

  // Firebase Messaging instance
  FirebaseMessaging? _messaging;

  // Local notifications plugin
  FlutterLocalNotificationsPlugin? _localNotifications;

  bool _initialized = false;
  String? _token;
  PushNotificationSettings _settings = const PushNotificationSettings();

  // Stream controllers
  final StreamController<PushNotification> _onMessageController =
      StreamController<PushNotification>.broadcast();
  final StreamController<NotificationAction> _onActionController =
      StreamController<NotificationAction>.broadcast();
  final StreamController<String?> _onTokenRefreshController =
      StreamController<String?>.broadcast();

  /// Stream of foreground notifications
  Stream<PushNotification> get onMessage => _onMessageController.stream;

  /// Stream of notification actions (taps, dismissals)
  Stream<NotificationAction> get onAction => _onActionController.stream;

  /// Stream of token refreshes
  Stream<String?> get onTokenRefresh => _onTokenRefreshController.stream;

  /// Current FCM token
  String? get token => _token;

  /// Whether service is initialized
  bool get isInitialized => _initialized;

  /// Current settings
  PushNotificationSettings get settings => _settings;

  // ===========================================================================
  // Initialization
  // ===========================================================================

  /// Initialize push notification service
  Future<void> init({
    PushNotificationSettings? settings,
    void Function(PushNotification)? onBackgroundMessage,
  }) async {
    if (_initialized) {
      _log('Already initialized');
      return;
    }

    try {
      _settings = settings ?? const PushNotificationSettings();

      // Initialize Firebase
      await Firebase.initializeApp();
      _messaging = FirebaseMessaging.instance;

      // Request permission
      await requestPermission();

      // Get initial token
      _token = await getToken();
      if (_token != null) {
        _log('Initial token: ${_token!.substring(0, 20)}...');
      }

      // Setup local notifications for foreground display
      await _setupLocalNotifications();

      // Listen for token refresh
      _setupTokenRefresh();

      // Listen for foreground messages
      _setupForegroundMessageHandler();

      // Handle notification taps
      _setupNotificationTapHandler();

      // Set background message handler
      FirebaseMessaging.onBackgroundMessage(_handleBackgroundMessage);

      _initialized = true;
      _log('Push notification service initialized');
    } catch (e) {
      _log('Initialization error: $e');
      rethrow;
    }
  }

  /// Setup local notifications for displaying in foreground
  Future<void> _setupLocalNotifications() async {
    _localNotifications = FlutterLocalNotificationsPlugin();

    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications!.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Create notification channel for Android
    if (Platform.isAndroid) {
      const channel = AndroidNotificationChannel(
        'default_channel',
        'Default Notifications',
        description: 'Default notification channel for push notifications',
        importance: Importance.high,
      );

      await _localNotifications!
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);
    }

    _log('Local notifications setup complete');
  }

  void _onNotificationTapped(NotificationResponse response) {
    _log('Notification tapped: ${response.payload}');

    Map<String, dynamic>? data;
    if (response.payload != null) {
      try {
        data = jsonDecode(response.payload!) as Map<String, dynamic>;
      } catch (e) {
        _log('Failed to parse notification payload: $e');
      }
    }

    final notification = PushNotification(
      title: 'Notification',
      body: '',
      data: data,
    );

    _onActionController.add(NotificationAction(
      type: response.notificationResponseType ==
              NotificationResponseType.selectedNotificationAction
          ? NotificationActionType.action
          : NotificationActionType.opened,
      actionId: response.actionId,
      notification: notification,
    ));
  }

  void _setupTokenRefresh() {
    _messaging?.onTokenRefresh.listen((newToken) {
      _token = newToken;
      _onTokenRefreshController.add(newToken);
      _log('Token refreshed: ${newToken.substring(0, 20)}...');
    });
  }

  void _setupForegroundMessageHandler() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _log('Foreground message received: ${message.messageId}');

      final notification = PushNotification.fromRemoteMessage(message);
      _onMessageController.add(notification);

      if (_settings.showInForeground) {
        _showLocalNotification(notification);
      }
    });
  }

  void _setupNotificationTapHandler() {
    // Handle when app is opened from terminated state
    FirebaseMessaging.instance.getInitialMessage().then((message) {
      if (message != null) {
        _log('App opened from terminated state via notification');
        final notification = PushNotification.fromRemoteMessage(message);
        _onActionController.add(NotificationAction(
          type: NotificationActionType.opened,
          notification: notification,
        ));
      }
    });

    // Handle when app is in background and notification is tapped
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      _log('App opened from background via notification');
      final notification = PushNotification.fromRemoteMessage(message);
      _onActionController.add(NotificationAction(
        type: NotificationActionType.opened,
        notification: notification,
      ));
    });
  }

  // ===========================================================================
  // Permissions
  // ===========================================================================

  /// Request notification permission
  Future<bool> requestPermission() async {
    try {
      final settings = await _messaging?.requestPermission(
        alert: true,
        announcement: false,
        badge: _settings.showBadge,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: _settings.playSound,
      );

      final authorized =
          settings?.authorizationStatus == AuthorizationStatus.authorized;
      _log('Permission status: ${settings?.authorizationStatus}');
      return authorized;
    } catch (e) {
      _log('Permission request error: $e');
      return false;
    }
  }

  /// Check if notifications are enabled
  Future<bool> areNotificationsEnabled() async {
    try {
      final settings = await _messaging?.getNotificationSettings();
      return settings?.authorizationStatus == AuthorizationStatus.authorized;
    } catch (e) {
      _log('Check notifications enabled error: $e');
      return false;
    }
  }

  // ===========================================================================
  // Token Management
  // ===========================================================================

  /// Get the current FCM token
  Future<String?> getToken() async {
    try {
      _token = await _messaging?.getToken();
      return _token;
    } catch (e) {
      _log('Get token error: $e');
      return null;
    }
  }

  /// Delete the current token (useful for logout)
  Future<void> deleteToken() async {
    try {
      await _messaging?.deleteToken();
      _token = null;
      _log('Token deleted');
    } catch (e) {
      _log('Delete token error: $e');
    }
  }

  // ===========================================================================
  // Topic Subscription
  // ===========================================================================

  /// Subscribe to a topic
  Future<void> subscribeToTopic(String topic) async {
    try {
      await _messaging?.subscribeToTopic(topic);

      _settings = _settings.copyWith(
        subscribedTopics: [..._settings.subscribedTopics, topic],
      );
      _log('Subscribed to topic: $topic');
    } catch (e) {
      _log('Subscribe to topic error: $e');
      rethrow;
    }
  }

  /// Unsubscribe from a topic
  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _messaging?.unsubscribeFromTopic(topic);

      _settings = _settings.copyWith(
        subscribedTopics:
            _settings.subscribedTopics.where((t) => t != topic).toList(),
      );
      _log('Unsubscribed from topic: $topic');
    } catch (e) {
      _log('Unsubscribe from topic error: $e');
      rethrow;
    }
  }

  // ===========================================================================
  // Local Notifications
  // ===========================================================================

  /// Show a local notification
  Future<void> showLocalNotification({
    required String title,
    required String body,
    String? payload,
    String? imageUrl,
  }) async {
    try {
      const androidDetails = AndroidNotificationDetails(
        'default_channel',
        'Default Notifications',
        channelDescription: 'Default notification channel',
        importance: Importance.high,
        priority: Priority.high,
        showWhen: true,
      );

      const iosDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      );

      const details = NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      );

      await _localNotifications?.show(
        DateTime.now().millisecondsSinceEpoch ~/ 1000,
        title,
        body,
        details,
        payload: payload,
      );

      _log('Local notification shown: $title');
    } catch (e) {
      _log('Show local notification error: $e');
    }
  }

  /// Show a notification from a PushNotification object
  Future<void> _showLocalNotification(PushNotification notification) async {
    await showLocalNotification(
      title: notification.title ?? 'New Notification',
      body: notification.body ?? '',
      payload: notification.data != null ? jsonEncode(notification.data) : null,
      imageUrl: notification.imageUrl,
    );
  }

  /// Cancel all notifications
  Future<void> cancelAllNotifications() async {
    try {
      await _localNotifications?.cancelAll();
      _log('All notifications cancelled');
    } catch (e) {
      _log('Cancel notifications error: $e');
    }
  }

  /// Cancel a specific notification
  Future<void> cancelNotification(int id) async {
    try {
      await _localNotifications?.cancel(id);
      _log('Notification cancelled: $id');
    } catch (e) {
      _log('Cancel notification error: $e');
    }
  }

  // ===========================================================================
  // Settings
  // ===========================================================================

  /// Update notification settings
  void updateSettings(PushNotificationSettings newSettings) {
    _settings = newSettings;
    _log('Settings updated');
  }

  /// Enable/disable foreground notifications
  void setShowInForeground(bool show) {
    _settings = _settings.copyWith(showInForeground: show);
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  void _log(String message) {
    if (kDebugMode) {
      debugPrint('[PushNotificationService] $message');
    }
  }

  // ===========================================================================
  // Cleanup
  // ===========================================================================

  /// Dispose of resources
  void dispose() {
    _onMessageController.close();
    _onActionController.close();
    _onTokenRefreshController.close();
  }
}

// =============================================================================
// Background Message Handler
// =============================================================================

/// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> _handleBackgroundMessage(RemoteMessage message) async {
  // Ensure Firebase is initialized for background handling
  await Firebase.initializeApp();

  // Log the background message
  debugPrint(
      '[PushNotificationService] Background message: ${message.messageId}');
  debugPrint(
      '[PushNotificationService] Title: ${message.notification?.title}');
  debugPrint('[PushNotificationService] Body: ${message.notification?.body}');
  debugPrint('[PushNotificationService] Data: ${message.data}');

  // You can add custom handling here, such as:
  // - Updating local database
  // - Scheduling local notifications
  // - Syncing data
}

// =============================================================================
// Global Instance
// =============================================================================

/// Global push notification service instance
final pushNotifications = PushNotificationService();

// =============================================================================
// Common Topics
// =============================================================================

/// Common notification topics
class NotificationTopics {
  static const String general = 'general';
  static const String news = 'news';
  static const String promotions = 'promotions';
  static const String updates = 'updates';
  static const String alerts = 'alerts';
}
