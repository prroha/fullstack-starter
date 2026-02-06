import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

/// Analytics provider type
enum AnalyticsProvider {
  mixpanel,
  custom,
  none,
}

/// User properties for identification
class UserProperties {
  final String? email;
  final String? name;
  final String? plan;
  final DateTime? createdAt;
  final Map<String, dynamic>? extra;

  const UserProperties({
    this.email,
    this.name,
    this.plan,
    this.createdAt,
    this.extra,
  });

  Map<String, dynamic> toMap() {
    return {
      if (email != null) 'email': email,
      if (name != null) 'name': name,
      if (plan != null) 'plan': plan,
      if (createdAt != null) 'created_at': createdAt!.toIso8601String(),
      ...?extra,
    };
  }
}

/// Analytics service configuration
class AnalyticsConfig {
  final AnalyticsProvider provider;
  final String? token;
  final String? apiUrl;
  final bool debug;
  final bool enabled;
  final Duration timeout;
  final int maxRetries;
  final int batchSize;
  final Duration flushInterval;

  const AnalyticsConfig({
    required this.provider,
    this.token,
    this.apiUrl,
    this.debug = false,
    this.enabled = true,
    this.timeout = const Duration(seconds: 10),
    this.maxRetries = 3,
    this.batchSize = 20,
    this.flushInterval = const Duration(seconds: 30),
  });
}

/// Event model for tracking
class AnalyticsEventData {
  final String event;
  final Map<String, dynamic>? properties;
  final String? sessionId;
  final DateTime timestamp;

  AnalyticsEventData({
    required this.event,
    this.properties,
    this.sessionId,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  Map<String, dynamic> toJson() {
    return {
      'event': event,
      if (properties != null) 'properties': properties,
      if (sessionId != null) 'sessionId': sessionId,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

/// Abstract analytics provider interface
abstract class AnalyticsProviderInterface {
  Future<void> init(AnalyticsConfig config);
  Future<void> identify(String userId, {UserProperties? properties});
  Future<void> track(String event, {Map<String, dynamic>? properties});
  Future<void> screen(String name, {Map<String, dynamic>? properties});
  Future<void> reset();
  Future<void> flush();
}

/// Mixpanel analytics provider
class MixpanelAnalyticsProvider implements AnalyticsProviderInterface {
  // Note: Mixpanel instance would be initialized here
  // import 'package:mixpanel_flutter/mixpanel_flutter.dart';
  // Mixpanel? _mixpanel;
  bool _debug = false;
  bool _initialized = false;

  @override
  Future<void> init(AnalyticsConfig config) async {
    _debug = config.debug;

    if (config.token == null || config.token!.isEmpty) {
      _log('Mixpanel token not provided');
      return;
    }

    try {
      // Uncomment when mixpanel_flutter is installed:
      // _mixpanel = await Mixpanel.init(
      //   config.token!,
      //   trackAutomaticEvents: true,
      // );
      _initialized = true;
      _log('Mixpanel initialized');
    } catch (e) {
      _log('Failed to initialize Mixpanel: $e');
    }
  }

  @override
  Future<void> identify(String userId, {UserProperties? properties}) async {
    if (!_initialized) return;

    try {
      // _mixpanel?.identify(userId);
      // if (properties != null) {
      //   _mixpanel?.getPeople().set(properties.toMap());
      // }
      _log('Identified user: $userId');
    } catch (e) {
      _log('Failed to identify user: $e');
    }
  }

  @override
  Future<void> track(String event, {Map<String, dynamic>? properties}) async {
    if (!_initialized) return;

    try {
      // _mixpanel?.track(event, properties: properties);
      _log('Tracked event: $event ${properties ?? ''}');
    } catch (e) {
      _log('Failed to track event: $e');
    }
  }

  @override
  Future<void> screen(String name, {Map<String, dynamic>? properties}) async {
    if (!_initialized) return;

    try {
      // _mixpanel?.track('Screen View', properties: {
      //   'screen_name': name,
      //   ...?properties,
      // });
      _log('Screen view: $name');
    } catch (e) {
      _log('Failed to track screen: $e');
    }
  }

  @override
  Future<void> reset() async {
    if (!_initialized) return;

    try {
      // _mixpanel?.reset();
      _log('Analytics reset');
    } catch (e) {
      _log('Failed to reset: $e');
    }
  }

  @override
  Future<void> flush() async {
    if (!_initialized) return;

    try {
      // _mixpanel?.flush();
      _log('Analytics flushed');
    } catch (e) {
      _log('Failed to flush: $e');
    }
  }

  void _log(String message) {
    if (_debug) {
      debugPrint('[Analytics:Mixpanel] $message');
    }
  }
}

/// Custom API-based analytics provider using Dio
class CustomAnalyticsProvider implements AnalyticsProviderInterface {
  late Dio _dio;
  late AnalyticsConfig _config;
  String? _userId;
  String? _sessionId;
  bool _initialized = false;
  final List<AnalyticsEventData> _eventQueue = [];
  bool _isFlushing = false;

  @override
  Future<void> init(AnalyticsConfig config) async {
    _config = config;

    // Configure Dio instance
    _dio = Dio(BaseOptions(
      baseUrl: config.apiUrl ?? '/api/analytics',
      connectTimeout: config.timeout,
      receiveTimeout: config.timeout,
      sendTimeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    // Add interceptors for logging and retry logic
    if (config.debug) {
      _dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
        logPrint: (obj) => debugPrint('[Analytics:HTTP] $obj'),
      ));
    }

    // Add retry interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onError: (error, handler) async {
          if (_shouldRetry(error)) {
            try {
              final response = await _retryRequest(error.requestOptions);
              handler.resolve(response);
              return;
            } catch (e) {
              // Retry failed, proceed with error
            }
          }
          handler.next(error);
        },
      ),
    );

    _initialized = true;
    _sessionId = _generateSessionId();
    _log('Custom analytics initialized with API: ${config.apiUrl}');

    // Start periodic flush timer
    _startPeriodicFlush();
  }

  @override
  Future<void> identify(String userId, {UserProperties? properties}) async {
    if (!_initialized) return;

    _userId = userId;

    try {
      await _sendEvent('identify', {
        'userId': userId,
        ...?properties?.toMap(),
      });
      _log('Identified user: $userId');
    } catch (e) {
      _log('Failed to identify user: $e');
    }
  }

  @override
  Future<void> track(String event, {Map<String, dynamic>? properties}) async {
    if (!_initialized) return;

    final eventData = AnalyticsEventData(
      event: event,
      properties: properties,
      sessionId: _sessionId,
    );

    // Add to queue for batch processing
    _eventQueue.add(eventData);
    _log('Queued event: $event (queue size: ${_eventQueue.length})');

    // Flush if queue is full
    if (_eventQueue.length >= _config.batchSize) {
      await flush();
    }
  }

  @override
  Future<void> screen(String name, {Map<String, dynamic>? properties}) async {
    if (!_initialized) return;

    await track('screen_view', properties: {
      'screen_name': name,
      ...?properties,
    });
    _log('Screen view: $name');
  }

  @override
  Future<void> reset() async {
    if (!_initialized) return;

    // Flush remaining events before reset
    await flush();

    _userId = null;
    _sessionId = _generateSessionId();
    _eventQueue.clear();
    _log('Analytics reset');
  }

  @override
  Future<void> flush() async {
    if (!_initialized || _isFlushing || _eventQueue.isEmpty) return;

    _isFlushing = true;

    try {
      // Take current events from queue
      final eventsToSend = List<AnalyticsEventData>.from(_eventQueue);
      _eventQueue.clear();

      if (eventsToSend.length == 1) {
        // Send single event
        await _sendSingleEvent(eventsToSend.first);
      } else {
        // Send batch
        await _sendBatchEvents(eventsToSend);
      }

      _log('Flushed ${eventsToSend.length} events');
    } catch (e) {
      _log('Failed to flush events: $e');
      // Re-add failed events to queue for retry
      // Note: In production, you might want to limit retries or persist failed events
    } finally {
      _isFlushing = false;
    }
  }

  /// Send a single event to the track endpoint
  Future<void> _sendSingleEvent(AnalyticsEventData eventData) async {
    final payload = {
      'event': eventData.event,
      'properties': eventData.properties,
      'sessionId': eventData.sessionId,
      'timestamp': eventData.timestamp.toIso8601String(),
    };

    await _dio.post('/track', data: payload);
  }

  /// Send multiple events to the batch track endpoint
  Future<void> _sendBatchEvents(List<AnalyticsEventData> events) async {
    final payload = {
      'events': events.map((e) => e.toJson()).toList(),
    };

    await _dio.post('/track/batch', data: payload);
  }

  /// Send identify or other custom events
  Future<void> _sendEvent(String type, Map<String, dynamic> data) async {
    try {
      final payload = {
        'type': type,
        'userId': _userId,
        'sessionId': _sessionId,
        'timestamp': DateTime.now().toIso8601String(),
        ...data,
      };

      await _dio.post('/track', data: payload);
    } catch (e) {
      _log('Failed to send event: $e');
      rethrow;
    }
  }

  /// Check if request should be retried
  bool _shouldRetry(DioException error) {
    // Retry on network errors and server errors (5xx)
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.connectionError) {
      return true;
    }

    final statusCode = error.response?.statusCode;
    if (statusCode != null && statusCode >= 500) {
      return true;
    }

    return false;
  }

  /// Retry a failed request with exponential backoff
  Future<Response> _retryRequest(RequestOptions requestOptions, {int attempt = 1}) async {
    if (attempt > _config.maxRetries) {
      throw DioException(
        requestOptions: requestOptions,
        message: 'Max retries exceeded',
      );
    }

    // Exponential backoff
    final delay = Duration(milliseconds: 100 * (1 << attempt));
    await Future.delayed(delay);

    _log('Retrying request (attempt $attempt)');

    try {
      return await _dio.fetch(requestOptions);
    } on DioException catch (e) {
      if (_shouldRetry(e) && attempt < _config.maxRetries) {
        return _retryRequest(requestOptions, attempt: attempt + 1);
      }
      rethrow;
    }
  }

  /// Generate a unique session ID
  String _generateSessionId() {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final random = (timestamp * 0x5DEECE66D + 0xB) & 0xFFFFFFFFFFFF;
    return 'sess_${random.toRadixString(36)}';
  }

  /// Start periodic flush timer
  void _startPeriodicFlush() {
    Future.delayed(_config.flushInterval, () async {
      if (_initialized) {
        await flush();
        _startPeriodicFlush();
      }
    });
  }

  void _log(String message) {
    if (_config.debug) {
      debugPrint('[Analytics:Custom] $message');
    }
  }

  /// Update authorization token (call after login)
  void setAuthToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  /// Clear authorization token (call after logout)
  void clearAuthToken() {
    _dio.options.headers.remove('Authorization');
  }
}

/// No-op analytics provider (disabled)
class NoopAnalyticsProvider implements AnalyticsProviderInterface {
  @override
  Future<void> init(AnalyticsConfig config) async {}

  @override
  Future<void> identify(String userId, {UserProperties? properties}) async {}

  @override
  Future<void> track(String event, {Map<String, dynamic>? properties}) async {}

  @override
  Future<void> screen(String name, {Map<String, dynamic>? properties}) async {}

  @override
  Future<void> reset() async {}

  @override
  Future<void> flush() async {}
}

/// Main Analytics Service
class AnalyticsService {
  static final AnalyticsService _instance = AnalyticsService._internal();

  factory AnalyticsService() => _instance;

  AnalyticsService._internal();

  AnalyticsProviderInterface _provider = NoopAnalyticsProvider();
  bool _initialized = false;
  final List<Future<void> Function()> _queue = [];

  /// Get the underlying provider (for advanced usage)
  AnalyticsProviderInterface get provider => _provider;

  /// Check if analytics is initialized
  bool get isInitialized => _initialized;

  /// Initialize analytics with configuration
  Future<void> init(AnalyticsConfig config) async {
    if (_initialized) return;

    if (!config.enabled) {
      _provider = NoopAnalyticsProvider();
      _initialized = true;
      return;
    }

    switch (config.provider) {
      case AnalyticsProvider.mixpanel:
        _provider = MixpanelAnalyticsProvider();
        break;
      case AnalyticsProvider.custom:
        _provider = CustomAnalyticsProvider();
        break;
      case AnalyticsProvider.none:
        _provider = NoopAnalyticsProvider();
        break;
    }

    await _provider.init(config);
    _initialized = true;

    // Process queued events
    for (final fn in _queue) {
      await fn();
    }
    _queue.clear();
  }

  /// Identify a user
  Future<void> identify(String userId, {UserProperties? properties}) async {
    if (!_initialized) {
      _queue.add(() => identify(userId, properties: properties));
      return;
    }
    await _provider.identify(userId, properties: properties);
  }

  /// Track an event
  Future<void> track(String event, {Map<String, dynamic>? properties}) async {
    if (!_initialized) {
      _queue.add(() => track(event, properties: properties));
      return;
    }
    await _provider.track(event, properties: properties);
  }

  /// Track a screen view
  Future<void> screen(String name, {Map<String, dynamic>? properties}) async {
    if (!_initialized) {
      _queue.add(() => screen(name, properties: properties));
      return;
    }
    await _provider.screen(name, properties: properties);
  }

  /// Reset analytics (on logout)
  Future<void> reset() async {
    if (_initialized) {
      await _provider.reset();
    }
  }

  /// Flush pending events
  Future<void> flush() async {
    if (_initialized) {
      await _provider.flush();
    }
  }

  /// Update auth token for custom provider
  void setAuthToken(String token) {
    if (_provider is CustomAnalyticsProvider) {
      (_provider as CustomAnalyticsProvider).setAuthToken(token);
    }
  }

  /// Clear auth token for custom provider
  void clearAuthToken() {
    if (_provider is CustomAnalyticsProvider) {
      (_provider as CustomAnalyticsProvider).clearAuthToken();
    }
  }
}

/// Global analytics instance
final analytics = AnalyticsService();

/// Common event names
class AnalyticsEvents {
  static const String signUp = 'sign_up';
  static const String login = 'login';
  static const String logout = 'logout';
  static const String purchase = 'purchase';
  static const String buttonClick = 'button_click';
  static const String formSubmit = 'form_submit';
  static const String error = 'error';
  static const String featureUsed = 'feature_used';
  static const String onboardingStep = 'onboarding_step';
  static const String subscriptionStarted = 'subscription_started';
  static const String subscriptionCanceled = 'subscription_canceled';
  static const String screenView = 'screen_view';
  static const String appOpen = 'app_open';
  static const String appClose = 'app_close';
  static const String pushNotificationReceived = 'push_notification_received';
  static const String pushNotificationOpened = 'push_notification_opened';
  static const String shareContent = 'share_content';
  static const String searchPerformed = 'search_performed';
  static const String itemViewed = 'item_viewed';
  static const String addToCart = 'add_to_cart';
  static const String removeFromCart = 'remove_from_cart';
  static const String checkoutStarted = 'checkout_started';
  static const String checkoutCompleted = 'checkout_completed';
}

/// Analytics screen observer for automatic screen tracking
class AnalyticsRouteObserver extends NavigatorObserver {
  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPush(route, previousRoute);
    _trackScreen(route);
  }

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {
    super.didReplace(newRoute: newRoute, oldRoute: oldRoute);
    if (newRoute != null) {
      _trackScreen(newRoute);
    }
  }

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPop(route, previousRoute);
    if (previousRoute != null) {
      _trackScreen(previousRoute);
    }
  }

  void _trackScreen(Route<dynamic> route) {
    final screenName = route.settings.name;
    if (screenName != null && screenName.isNotEmpty) {
      analytics.screen(screenName);
    }
  }
}
