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

  const AnalyticsConfig({
    required this.provider,
    this.token,
    this.apiUrl,
    this.debug = false,
    this.enabled = true,
  });
}

/// Abstract analytics provider interface
abstract class AnalyticsProviderInterface {
  Future<void> init(AnalyticsConfig config);
  Future<void> identify(String userId, {UserProperties? properties});
  Future<void> track(String event, {Map<String, dynamic>? properties});
  Future<void> screen(String name, {Map<String, dynamic>? properties});
  Future<void> reset();
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

  void _log(String message) {
    if (_debug) {
      debugPrint('[Analytics:Mixpanel] $message');
    }
  }
}

/// Custom API-based analytics provider
class CustomAnalyticsProvider implements AnalyticsProviderInterface {
  String _apiUrl = '';
  bool _debug = false;
  String? _userId;

  @override
  Future<void> init(AnalyticsConfig config) async {
    _apiUrl = config.apiUrl ?? '/api/analytics';
    _debug = config.debug;
    _log('Custom analytics initialized');
  }

  @override
  Future<void> identify(String userId, {UserProperties? properties}) async {
    _userId = userId;
    await _sendEvent('identify', {
      'userId': userId,
      ...?properties?.toMap(),
    });
    _log('Identified user: $userId');
  }

  @override
  Future<void> track(String event, {Map<String, dynamic>? properties}) async {
    await _sendEvent('track', {
      'event': event,
      'userId': _userId,
      'properties': properties,
      'timestamp': DateTime.now().toIso8601String(),
    });
    _log('Tracked event: $event');
  }

  @override
  Future<void> screen(String name, {Map<String, dynamic>? properties}) async {
    await _sendEvent('screen', {
      'screen': name,
      'userId': _userId,
      'properties': properties,
      'timestamp': DateTime.now().toIso8601String(),
    });
    _log('Screen view: $name');
  }

  @override
  Future<void> reset() async {
    _userId = null;
    _log('Analytics reset');
  }

  Future<void> _sendEvent(String type, Map<String, dynamic> data) async {
    // TODO: Implement HTTP request to your analytics API
    // try {
    //   await http.post(
    //     Uri.parse(_apiUrl),
    //     headers: {'Content-Type': 'application/json'},
    //     body: jsonEncode({'type': type, ...data}),
    //   );
    // } catch (e) {
    //   _log('Failed to send event: $e');
    // }
  }

  void _log(String message) {
    if (_debug) {
      debugPrint('[Analytics:Custom] $message');
    }
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
}

/// Main Analytics Service
class AnalyticsService {
  static final AnalyticsService _instance = AnalyticsService._internal();

  factory AnalyticsService() => _instance;

  AnalyticsService._internal();

  AnalyticsProviderInterface _provider = NoopAnalyticsProvider();
  bool _initialized = false;
  final List<Future<void> Function()> _queue = [];

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
}
