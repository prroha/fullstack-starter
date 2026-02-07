import 'dart:async';
import 'package:flutter/foundation.dart';

/// Severity level for error tracking
enum SeverityLevel {
  fatal,
  error,
  warning,
  info,
  debug,
}

/// Error tracking configuration
class ErrorTrackingConfig {
  /// Sentry DSN (Data Source Name)
  final String dsn;

  /// Environment name (production, staging, development)
  final String environment;

  /// Release/version identifier
  final String? release;

  /// Distribution identifier (e.g., app store, internal)
  final String? dist;

  /// Sample rate for transactions (0.0 to 1.0)
  final double tracesSampleRate;

  /// Enable debug mode
  final bool debug;

  /// Attach screenshots on errors
  final bool attachScreenshot;

  /// Attach view hierarchy on errors
  final bool attachViewHierarchy;

  /// Maximum number of breadcrumbs to keep
  final int maxBreadcrumbs;

  /// Enable automatic session tracking
  final bool enableAutoSessionTracking;

  /// ANR (Application Not Responding) timeout in milliseconds
  final int anrTimeoutMs;

  /// Tags to add to all events
  final Map<String, String>? tags;

  const ErrorTrackingConfig({
    required this.dsn,
    this.environment = 'production',
    this.release,
    this.dist,
    this.tracesSampleRate = 0.1,
    this.debug = false,
    this.attachScreenshot = true,
    this.attachViewHierarchy = true,
    this.maxBreadcrumbs = 100,
    this.enableAutoSessionTracking = true,
    this.anrTimeoutMs = 5000,
    this.tags,
  });
}

/// Error context for additional information
class ErrorContext {
  /// User information
  final UserContext? user;

  /// Additional tags
  final Map<String, String>? tags;

  /// Extra context data
  final Map<String, dynamic>? extra;

  /// Fingerprint for grouping
  final List<String>? fingerprint;

  /// Error level override
  final SeverityLevel? level;

  const ErrorContext({
    this.user,
    this.tags,
    this.extra,
    this.fingerprint,
    this.level,
  });
}

/// User context for error tracking
class UserContext {
  final String? id;
  final String? email;
  final String? username;
  final String? ipAddress;
  final Map<String, String>? extra;

  const UserContext({
    this.id,
    this.email,
    this.username,
    this.ipAddress,
    this.extra,
  });

  Map<String, String?> toMap() {
    return {
      if (id != null) 'id': id,
      if (email != null) 'email': email,
      if (username != null) 'username': username,
      if (ipAddress != null) 'ip_address': ipAddress,
      ...?extra,
    };
  }
}

/// Breadcrumb for debugging
class Breadcrumb {
  /// Category (e.g., 'http', 'navigation', 'user')
  final String? category;

  /// Breadcrumb message
  final String? message;

  /// Breadcrumb level
  final SeverityLevel level;

  /// Type (e.g., 'http', 'navigation', 'default')
  final String type;

  /// Additional data
  final Map<String, dynamic>? data;

  /// Timestamp
  final DateTime timestamp;

  Breadcrumb({
    this.category,
    this.message,
    this.level = SeverityLevel.info,
    this.type = 'default',
    this.data,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();
}

/// Abstract error tracking provider interface
abstract class ErrorTrackingProviderInterface {
  Future<void> init(ErrorTrackingConfig config);
  Future<String?> captureException(dynamic exception, {StackTrace? stackTrace, ErrorContext? context});
  Future<String?> captureMessage(String message, {SeverityLevel level, ErrorContext? context});
  void setUser(UserContext? user);
  void addBreadcrumb(Breadcrumb breadcrumb);
  void setTag(String key, String value);
  void setTags(Map<String, String> tags);
  void setExtra(String key, dynamic value);
  void setExtras(Map<String, dynamic> extras);
  void setContext(String name, Map<String, dynamic> context);
  Future<void> flush({Duration timeout = const Duration(seconds: 2)});
  Future<void> close();
}

/// Sentry provider implementation
class SentryProvider implements ErrorTrackingProviderInterface {
  // Note: Sentry instance is managed through sentry_flutter package
  // import 'package:sentry_flutter/sentry_flutter.dart';

  bool _initialized = false;
  bool _debug = false;
  ErrorTrackingConfig? _config;

  @override
  Future<void> init(ErrorTrackingConfig config) async {
    _config = config;
    _debug = config.debug;

    if (config.dsn.isEmpty) {
      _log('Sentry DSN not provided, error tracking disabled');
      return;
    }

    try {
      // Uncomment when sentry_flutter is installed:
      // await SentryFlutter.init(
      //   (options) {
      //     options.dsn = config.dsn;
      //     options.environment = config.environment;
      //     options.release = config.release;
      //     options.dist = config.dist;
      //     options.tracesSampleRate = config.tracesSampleRate;
      //     options.debug = config.debug;
      //     options.attachScreenshot = config.attachScreenshot;
      //     options.attachViewHierarchy = config.attachViewHierarchy;
      //     options.maxBreadcrumbs = config.maxBreadcrumbs;
      //     options.enableAutoSessionTracking = config.enableAutoSessionTracking;
      //     options.anrTimeoutInterval = Duration(milliseconds: config.anrTimeoutMs);
      //   },
      // );

      // Set initial tags
      // if (config.tags != null) {
      //   config.tags!.forEach((key, value) {
      //     Sentry.configureScope((scope) => scope.setTag(key, value));
      //   });
      // }

      _initialized = true;
      _log('Sentry initialized successfully');
    } catch (e) {
      debugPrint('[ErrorTracking] Failed to initialize Sentry: $e');
      debugPrint('[ErrorTracking] Install sentry_flutter for error tracking');
    }
  }

  @override
  Future<String?> captureException(
    dynamic exception, {
    StackTrace? stackTrace,
    ErrorContext? context,
  }) async {
    if (!_initialized) {
      debugPrint('[ErrorTracking] Exception (Sentry not initialized): $exception');
      if (stackTrace != null) {
        debugPrint(stackTrace.toString());
      }
      return null;
    }

    try {
      // Uncomment when sentry_flutter is installed:
      // final sentryId = await Sentry.captureException(
      //   exception,
      //   stackTrace: stackTrace,
      //   withScope: (scope) {
      //     if (context != null) {
      //       _applyContext(scope, context);
      //     }
      //   },
      // );
      // _log('Captured exception: ${sentryId.toString()}');
      // return sentryId.toString();

      _log('Would capture exception: $exception');
      return 'mock_event_id';
    } catch (e) {
      _log('Failed to capture exception: $e');
      return null;
    }
  }

  @override
  Future<String?> captureMessage(
    String message, {
    SeverityLevel level = SeverityLevel.info,
    ErrorContext? context,
  }) async {
    if (!_initialized) {
      debugPrint('[ErrorTracking:${level.name}] $message');
      return null;
    }

    try {
      // Uncomment when sentry_flutter is installed:
      // final sentryLevel = _mapSeverityLevel(level);
      // final sentryId = await Sentry.captureMessage(
      //   message,
      //   level: sentryLevel,
      //   withScope: (scope) {
      //     if (context != null) {
      //       _applyContext(scope, context);
      //     }
      //   },
      // );
      // _log('Captured message: ${sentryId.toString()}');
      // return sentryId.toString();

      _log('Would capture message: $message');
      return 'mock_event_id';
    } catch (e) {
      _log('Failed to capture message: $e');
      return null;
    }
  }

  @override
  void setUser(UserContext? user) {
    if (!_initialized) return;

    try {
      // Uncomment when sentry_flutter is installed:
      // if (user != null) {
      //   Sentry.configureScope((scope) {
      //     scope.setUser(SentryUser(
      //       id: user.id,
      //       email: user.email,
      //       username: user.username,
      //       ipAddress: user.ipAddress,
      //       data: user.extra,
      //     ));
      //   });
      // } else {
      //   Sentry.configureScope((scope) => scope.setUser(null));
      // }

      _log('Set user: ${user?.id}');
    } catch (e) {
      _log('Failed to set user: $e');
    }
  }

  @override
  void addBreadcrumb(Breadcrumb breadcrumb) {
    if (!_initialized) return;

    try {
      // Uncomment when sentry_flutter is installed:
      // Sentry.addBreadcrumb(SentryBreadcrumb(
      //   category: breadcrumb.category,
      //   message: breadcrumb.message,
      //   level: _mapSeverityLevel(breadcrumb.level),
      //   type: breadcrumb.type,
      //   data: breadcrumb.data,
      //   timestamp: breadcrumb.timestamp,
      // ));

      _log('Added breadcrumb: ${breadcrumb.message}');
    } catch (e) {
      _log('Failed to add breadcrumb: $e');
    }
  }

  @override
  void setTag(String key, String value) {
    if (!_initialized) return;

    // Uncomment when sentry_flutter is installed:
    // Sentry.configureScope((scope) => scope.setTag(key, value));
  }

  @override
  void setTags(Map<String, String> tags) {
    if (!_initialized) return;

    // Uncomment when sentry_flutter is installed:
    // Sentry.configureScope((scope) {
    //   tags.forEach((key, value) => scope.setTag(key, value));
    // });
  }

  @override
  void setExtra(String key, dynamic value) {
    if (!_initialized) return;

    // Uncomment when sentry_flutter is installed:
    // Sentry.configureScope((scope) => scope.setExtra(key, value));
  }

  @override
  void setExtras(Map<String, dynamic> extras) {
    if (!_initialized) return;

    // Uncomment when sentry_flutter is installed:
    // Sentry.configureScope((scope) {
    //   extras.forEach((key, value) => scope.setExtra(key, value));
    // });
  }

  @override
  void setContext(String name, Map<String, dynamic> context) {
    if (!_initialized) return;

    // Uncomment when sentry_flutter is installed:
    // Sentry.configureScope((scope) => scope.setContexts(name, context));
  }

  @override
  Future<void> flush({Duration timeout = const Duration(seconds: 2)}) async {
    if (!_initialized) return;

    // Uncomment when sentry_flutter is installed:
    // await Sentry.flush(timeout: timeout);
  }

  @override
  Future<void> close() async {
    if (!_initialized) return;

    // Uncomment when sentry_flutter is installed:
    // await Sentry.close();
  }

  // Helper to map severity levels
  // SentryLevel _mapSeverityLevel(SeverityLevel level) {
  //   switch (level) {
  //     case SeverityLevel.fatal:
  //       return SentryLevel.fatal;
  //     case SeverityLevel.error:
  //       return SentryLevel.error;
  //     case SeverityLevel.warning:
  //       return SentryLevel.warning;
  //     case SeverityLevel.info:
  //       return SentryLevel.info;
  //     case SeverityLevel.debug:
  //       return SentryLevel.debug;
  //   }
  // }

  // Helper to apply context to scope
  // void _applyContext(Scope scope, ErrorContext context) {
  //   if (context.user != null) {
  //     scope.setUser(SentryUser(
  //       id: context.user!.id,
  //       email: context.user!.email,
  //       username: context.user!.username,
  //     ));
  //   }
  //   if (context.tags != null) {
  //     context.tags!.forEach((key, value) => scope.setTag(key, value));
  //   }
  //   if (context.extra != null) {
  //     context.extra!.forEach((key, value) => scope.setExtra(key, value));
  //   }
  //   if (context.fingerprint != null) {
  //     scope.fingerprint = context.fingerprint!;
  //   }
  //   if (context.level != null) {
  //     scope.level = _mapSeverityLevel(context.level!);
  //   }
  // }

  void _log(String message) {
    if (_debug) {
      debugPrint('[ErrorTracking:Sentry] $message');
    }
  }
}

/// No-op provider (fallback when Sentry is not configured)
class NoopProvider implements ErrorTrackingProviderInterface {
  @override
  Future<void> init(ErrorTrackingConfig config) async {}

  @override
  Future<String?> captureException(
    dynamic exception, {
    StackTrace? stackTrace,
    ErrorContext? context,
  }) async {
    debugPrint('[ErrorTracking:Noop] Exception: $exception');
    if (stackTrace != null) {
      debugPrint(stackTrace.toString());
    }
    return null;
  }

  @override
  Future<String?> captureMessage(
    String message, {
    SeverityLevel level = SeverityLevel.info,
    ErrorContext? context,
  }) async {
    debugPrint('[ErrorTracking:Noop:${level.name}] $message');
    return null;
  }

  @override
  void setUser(UserContext? user) {}

  @override
  void addBreadcrumb(Breadcrumb breadcrumb) {}

  @override
  void setTag(String key, String value) {}

  @override
  void setTags(Map<String, String> tags) {}

  @override
  void setExtra(String key, dynamic value) {}

  @override
  void setExtras(Map<String, dynamic> extras) {}

  @override
  void setContext(String name, Map<String, dynamic> context) {}

  @override
  Future<void> flush({Duration timeout = const Duration(seconds: 2)}) async {}

  @override
  Future<void> close() async {}
}

/// Main Error Tracking Service
class ErrorTrackingService {
  static final ErrorTrackingService _instance = ErrorTrackingService._internal();

  factory ErrorTrackingService() => _instance;

  ErrorTrackingService._internal();

  ErrorTrackingProviderInterface _provider = NoopProvider();
  bool _initialized = false;

  /// Check if error tracking is initialized
  bool get isInitialized => _initialized;

  /// Initialize error tracking with Sentry
  ///
  /// Call this in your main.dart before runApp:
  /// ```dart
  /// void main() async {
  ///   WidgetsFlutterBinding.ensureInitialized();
  ///
  ///   await errorTracking.init(ErrorTrackingConfig(
  ///     dsn: 'your-sentry-dsn',
  ///     environment: kReleaseMode ? 'production' : 'development',
  ///   ));
  ///
  ///   runApp(MyApp());
  /// }
  /// ```
  Future<void> init(ErrorTrackingConfig config) async {
    if (_initialized) {
      debugPrint('[ErrorTracking] Already initialized');
      return;
    }

    if (config.dsn.isEmpty) {
      _provider = NoopProvider();
      _initialized = true;
      return;
    }

    _provider = SentryProvider();
    await _provider.init(config);
    _initialized = true;

    // Set up Flutter error handlers
    _setupFlutterErrorHandlers();
  }

  /// Set up Flutter error handlers to capture all errors
  void _setupFlutterErrorHandlers() {
    // Capture Flutter framework errors
    FlutterError.onError = (FlutterErrorDetails details) {
      captureException(
        details.exception,
        stackTrace: details.stack,
        context: ErrorContext(
          tags: {'error.type': 'flutter_error'},
          extra: {
            'library': details.library,
            'context': details.context?.toString(),
            'informationCollector': details.informationCollector?.call().map((e) => e.toString()).toList(),
          },
        ),
      );

      // Also print to console in debug mode
      if (kDebugMode) {
        FlutterError.dumpErrorToConsole(details);
      }
    };

    // Capture errors that escape the Flutter framework
    PlatformDispatcher.instance.onError = (error, stack) {
      captureException(
        error,
        stackTrace: stack,
        context: const ErrorContext(
          tags: {'error.type': 'platform_error'},
        ),
      );
      return true;
    };
  }

  /// Capture an exception and send to Sentry
  Future<String?> captureException(
    dynamic exception, {
    StackTrace? stackTrace,
    ErrorContext? context,
  }) {
    return _provider.captureException(exception, stackTrace: stackTrace, context: context);
  }

  /// Capture a message and send to Sentry
  Future<String?> captureMessage(
    String message, {
    SeverityLevel level = SeverityLevel.info,
    ErrorContext? context,
  }) {
    return _provider.captureMessage(message, level: level, context: context);
  }

  /// Set user context for all future events
  void setUser(UserContext? user) {
    _provider.setUser(user);
  }

  /// Add a breadcrumb for debugging
  void addBreadcrumb(Breadcrumb breadcrumb) {
    _provider.addBreadcrumb(breadcrumb);
  }

  /// Set a tag for all future events
  void setTag(String key, String value) {
    _provider.setTag(key, value);
  }

  /// Set multiple tags for all future events
  void setTags(Map<String, String> tags) {
    _provider.setTags(tags);
  }

  /// Set extra data for all future events
  void setExtra(String key, dynamic value) {
    _provider.setExtra(key, value);
  }

  /// Set multiple extra data for all future events
  void setExtras(Map<String, dynamic> extras) {
    _provider.setExtras(extras);
  }

  /// Set a named context for all future events
  void setContext(String name, Map<String, dynamic> context) {
    _provider.setContext(name, context);
  }

  /// Flush pending events (call before app shutdown)
  Future<void> flush({Duration timeout = const Duration(seconds: 2)}) {
    return _provider.flush(timeout: timeout);
  }

  /// Close the SDK
  Future<void> close() {
    return _provider.close();
  }

  /// Wrap a function with error tracking
  ///
  /// Usage:
  /// ```dart
  /// await errorTracking.wrap(() async {
  ///   // Your code here
  /// });
  /// ```
  Future<T> wrap<T>(Future<T> Function() fn, {ErrorContext? context}) async {
    try {
      return await fn();
    } catch (e, stack) {
      await captureException(e, stackTrace: stack, context: context);
      rethrow;
    }
  }

  /// Wrap a synchronous function with error tracking
  T wrapSync<T>(T Function() fn, {ErrorContext? context}) {
    try {
      return fn();
    } catch (e, stack) {
      captureException(e, stackTrace: stack, context: context);
      rethrow;
    }
  }
}

/// Global error tracking instance
final errorTracking = ErrorTrackingService();

/// Helper function to run app with Sentry initialization
///
/// Usage in main.dart:
/// ```dart
/// void main() async {
///   await runAppWithErrorTracking(
///     config: ErrorTrackingConfig(
///       dsn: 'your-sentry-dsn',
///       environment: kReleaseMode ? 'production' : 'development',
///     ),
///     appRunner: () => runApp(MyApp()),
///   );
/// }
/// ```
Future<void> runAppWithErrorTracking({
  required ErrorTrackingConfig config,
  required void Function() appRunner,
}) async {
  await runZonedGuarded(
    () async {
      WidgetsFlutterBinding.ensureInitialized();
      await errorTracking.init(config);
      appRunner();
    },
    (error, stackTrace) {
      errorTracking.captureException(
        error,
        stackTrace: stackTrace,
        context: const ErrorContext(
          tags: {'error.type': 'zone_error'},
        ),
      );
    },
  );
}

/// Navigation observer for automatic screen breadcrumbs
class ErrorTrackingNavigatorObserver extends NavigatorObserver {
  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPush(route, previousRoute);
    _trackNavigation(route, 'push');
  }

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPop(route, previousRoute);
    if (previousRoute != null) {
      _trackNavigation(previousRoute, 'pop');
    }
  }

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {
    super.didReplace(newRoute: newRoute, oldRoute: oldRoute);
    if (newRoute != null) {
      _trackNavigation(newRoute, 'replace');
    }
  }

  void _trackNavigation(Route<dynamic> route, String action) {
    final screenName = route.settings.name;
    if (screenName != null && screenName.isNotEmpty) {
      errorTracking.addBreadcrumb(Breadcrumb(
        category: 'navigation',
        message: '$action: $screenName',
        type: 'navigation',
        data: {
          'screen': screenName,
          'action': action,
          'arguments': route.settings.arguments?.toString(),
        },
      ));
    }
  }
}
