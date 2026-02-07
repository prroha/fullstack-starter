# Mobile Flutter Cheatsheet

> Production-Grade Flutter Development Best Practices (2025–2026 Edition)

---

## Core Philosophy

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   🎯 Review this cheatsheet before every major release              │
│                                                                     │
│   📱 Mobile-first mindset: Design for constraints                   │
│      → Battery, network, memory, screen size                        │
│                                                                     │
│   🏗️ Architecture matters more in mobile                            │
│      → Harder to refactor once shipped to app stores                │
│                                                                     │
│   🔄 Offline-first when possible                                    │
│      → Users expect apps to work without perfect connectivity       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Project Structure (Clean Architecture)

### Recommended Structure
```
lib/
├── main.dart                    # Entry point
├── app.dart                     # MaterialApp configuration
│
├── core/                        # Shared utilities
│   ├── constants/              # App-wide constants
│   │   ├── api_constants.dart
│   │   ├── app_constants.dart
│   │   └── storage_keys.dart
│   ├── errors/                 # Error handling
│   │   ├── exceptions.dart
│   │   └── failures.dart
│   ├── network/                # HTTP client, interceptors
│   │   ├── api_client.dart
│   │   └── api_interceptors.dart
│   ├── services/               # Core services
│   │   ├── storage_service.dart
│   │   └── connectivity_service.dart
│   ├── theme/                  # Design system
│   │   ├── app_theme.dart
│   │   ├── app_colors.dart
│   │   ├── app_typography.dart
│   │   └── app_spacing.dart
│   └── utils/                  # Helper functions
│       ├── validators.dart
│       ├── formatters.dart
│       └── extensions.dart
│
├── data/                        # Data layer
│   ├── datasources/            # Remote & local data sources
│   │   ├── remote/
│   │   │   └── auth_remote_datasource.dart
│   │   └── local/
│   │       └── auth_local_datasource.dart
│   ├── models/                 # DTOs (JSON serialization)
│   │   ├── user_model.dart
│   │   └── response_model.dart
│   └── repositories/           # Repository implementations
│       └── auth_repository_impl.dart
│
├── domain/                      # Business logic (no dependencies)
│   ├── entities/               # Business objects
│   │   └── user.dart
│   ├── repositories/           # Repository interfaces
│   │   └── auth_repository.dart
│   └── usecases/               # Business operations
│       ├── login_usecase.dart
│       └── logout_usecase.dart
│
└── presentation/                # UI layer
    ├── providers/              # State management
    │   └── auth_provider.dart
    ├── router/                 # Navigation
    │   ├── app_router.dart
    │   └── routes.dart
    ├── screens/                # Full pages
    │   ├── auth/
    │   │   ├── login_screen.dart
    │   │   └── register_screen.dart
    │   └── home/
    │       └── home_screen.dart
    └── widgets/                # Reusable components
        ├── common/
        │   ├── app_button.dart
        │   ├── app_text_field.dart
        │   └── loading_widget.dart
        └── specific/
            └── user_avatar.dart
```

### Layer Dependencies
```
┌─────────────────────────────────────────────┐
│              Presentation                    │
│         (Screens, Widgets, Providers)       │
└─────────────────┬───────────────────────────┘
                  │ depends on
                  ▼
┌─────────────────────────────────────────────┐
│                Domain                        │
│     (Entities, Repositories, UseCases)      │
└─────────────────┬───────────────────────────┘
                  │ depends on
                  ▼
┌─────────────────────────────────────────────┐
│                 Data                         │
│   (Models, DataSources, Implementations)    │
└─────────────────────────────────────────────┘

Rule: Domain has NO dependencies on Data or Presentation
```

### Architecture Checklist
- [ ] Clear separation of concerns
- [ ] Domain layer has no external dependencies
- [ ] Repository pattern for data access
- [ ] Dependency injection configured
- [ ] Feature-based organization for large apps

---

## 2. State Management

### Choosing a Solution
| Solution | Best For | Complexity | Learning Curve |
|----------|----------|------------|----------------|
| **Provider** | Simple apps, beginners | Low | Easy |
| **Riverpod** | Medium-large apps, type safety | Medium | Medium |
| **BLoC** | Large apps, strict patterns | High | Steep |
| **GetX** | Rapid prototyping | Low | Easy |
| **MobX** | Reactive programming fans | Medium | Medium |

### Provider (Simple)
```dart
// Provider definition
class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  String? _error;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  String? get error => _error;

  Future<void> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _user = await _authRepository.login(email, password);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void logout() {
    _user = null;
    notifyListeners();
  }
}

// Usage in widget
class LoginScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, child) {
        if (auth.isLoading) {
          return const LoadingWidget();
        }

        return LoginForm(
          onSubmit: (email, password) => auth.login(email, password),
          error: auth.error,
        );
      },
    );
  }
}
```

### Riverpod (Recommended)
```dart
// Providers
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(ref.read(apiClientProvider));
});

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(authRepositoryProvider));
});

// State
@freezed
class AuthState with _$AuthState {
  const factory AuthState.initial() = _Initial;
  const factory AuthState.loading() = _Loading;
  const factory AuthState.authenticated(User user) = _Authenticated;
  const factory AuthState.unauthenticated() = _Unauthenticated;
  const factory AuthState.error(String message) = _Error;
}

// Notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(const AuthState.initial());

  Future<void> login(String email, String password) async {
    state = const AuthState.loading();

    final result = await _repository.login(email, password);

    result.fold(
      (failure) => state = AuthState.error(failure.message),
      (user) => state = AuthState.authenticated(user),
    );
  }

  void logout() {
    _repository.logout();
    state = const AuthState.unauthenticated();
  }
}

// Usage
class LoginScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);

    return authState.when(
      initial: () => const LoginForm(),
      loading: () => const LoadingWidget(),
      authenticated: (user) => const HomeScreen(),
      unauthenticated: () => const LoginForm(),
      error: (message) => LoginForm(error: message),
    );
  }
}
```

### BLoC Pattern
```dart
// Events
abstract class AuthEvent {}

class LoginRequested extends AuthEvent {
  final String email;
  final String password;
  LoginRequested(this.email, this.password);
}

class LogoutRequested extends AuthEvent {}

// States
abstract class AuthState {}

class AuthInitial extends AuthState {}
class AuthLoading extends AuthState {}
class AuthSuccess extends AuthState {
  final User user;
  AuthSuccess(this.user);
}
class AuthFailure extends AuthState {
  final String error;
  AuthFailure(this.error);
}

// BLoC
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _repository;

  AuthBloc(this._repository) : super(AuthInitial()) {
    on<LoginRequested>(_onLoginRequested);
    on<LogoutRequested>(_onLogoutRequested);
  }

  Future<void> _onLoginRequested(
    LoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());

    try {
      final user = await _repository.login(event.email, event.password);
      emit(AuthSuccess(user));
    } catch (e) {
      emit(AuthFailure(e.toString()));
    }
  }

  void _onLogoutRequested(LogoutRequested event, Emitter<AuthState> emit) {
    _repository.logout();
    emit(AuthInitial());
  }
}

// Usage
class LoginScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        if (state is AuthLoading) {
          return const LoadingWidget();
        }
        if (state is AuthFailure) {
          return LoginForm(error: state.error);
        }
        return const LoginForm();
      },
    );
  }
}
```

---

## 3. Error Handling (Either Pattern)

### Define Failures
```dart
// failures.dart
abstract class Failure {
  final String message;
  final String? code;

  const Failure(this.message, [this.code]);
}

class ServerFailure extends Failure {
  const ServerFailure([String message = 'Server error']) : super(message);
}

class NetworkFailure extends Failure {
  const NetworkFailure([String message = 'No internet connection'])
      : super(message);
}

class CacheFailure extends Failure {
  const CacheFailure([String message = 'Cache error']) : super(message);
}

class ValidationFailure extends Failure {
  final Map<String, String>? fieldErrors;

  const ValidationFailure(String message, {this.fieldErrors}) : super(message);
}

class AuthFailure extends Failure {
  const AuthFailure([String message = 'Authentication failed']) : super(message);
}
```

### Repository with Either
```dart
import 'package:dartz/dartz.dart';

// Repository interface
abstract class AuthRepository {
  Future<Either<Failure, User>> login(String email, String password);
  Future<Either<Failure, User>> register(RegisterRequest request);
  Future<Either<Failure, void>> logout();
}

// Implementation
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final AuthLocalDataSource _localDataSource;

  AuthRepositoryImpl(this._remoteDataSource, this._localDataSource);

  @override
  Future<Either<Failure, User>> login(String email, String password) async {
    try {
      final userModel = await _remoteDataSource.login(email, password);
      await _localDataSource.cacheUser(userModel);
      return Right(userModel.toEntity());
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on NetworkException {
      return Left(const NetworkFailure());
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}

// Usage in provider/bloc
Future<void> login(String email, String password) async {
  state = const AuthState.loading();

  final result = await _repository.login(email, password);

  result.fold(
    (failure) => state = AuthState.error(failure.message),
    (user) => state = AuthState.authenticated(user),
  );
}
```

### Global Error Handler
```dart
// main.dart
void main() {
  // Catch Flutter framework errors
  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    // Log to crash reporting
    FirebaseCrashlytics.instance.recordFlutterError(details);
  };

  // Catch async errors
  PlatformDispatcher.instance.onError = (error, stack) {
    FirebaseCrashlytics.instance.recordError(error, stack);
    return true;
  };

  runApp(const MyApp());
}
```

---

## 4. Networking

### API Client (Dio)
```dart
class ApiClient {
  late final Dio _dio;

  ApiClient({required String baseUrl, required TokenManager tokenManager}) {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _dio.interceptors.addAll([
      AuthInterceptor(tokenManager, _dio),
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        logPrint: (obj) => debugPrint(obj.toString()),
      ),
      RetryInterceptor(dio: _dio, retries: 3),
    ]);
  }

  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await _dio.get(path, queryParameters: queryParameters);
      return fromJson != null ? fromJson(response.data) : response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<T> post<T>(
    String path, {
    dynamic data,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await _dio.post(path, data: data);
      return fromJson != null ? fromJson(response.data) : response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return NetworkException('Connection timeout');
      case DioExceptionType.connectionError:
        return NetworkException('No internet connection');
      case DioExceptionType.badResponse:
        return _handleResponseError(e.response);
      default:
        return ServerException(e.message ?? 'Unknown error');
    }
  }

  Exception _handleResponseError(Response? response) {
    final statusCode = response?.statusCode ?? 500;
    final data = response?.data;

    switch (statusCode) {
      case 400:
        return ValidationException(data?['message'] ?? 'Invalid request');
      case 401:
        return UnauthorizedException();
      case 403:
        return ForbiddenException();
      case 404:
        return NotFoundException();
      case 429:
        return RateLimitException();
      default:
        return ServerException(data?['message'] ?? 'Server error');
    }
  }
}
```

### Auth Interceptor with Token Refresh
```dart
class AuthInterceptor extends Interceptor {
  final TokenManager _tokenManager;
  final Dio _dio;
  bool _isRefreshing = false;
  final List<Function> _pendingRequests = [];

  AuthInterceptor(this._tokenManager, this._dio);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _tokenManager.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      if (_isRefreshing) {
        // Queue request while refreshing
        _pendingRequests.add(() => _retryRequest(err.requestOptions, handler));
        return;
      }

      _isRefreshing = true;

      try {
        final refreshToken = await _tokenManager.getRefreshToken();
        if (refreshToken == null) {
          _tokenManager.clearTokens();
          handler.reject(err);
          return;
        }

        // Refresh tokens
        final response = await _dio.post(
          '/auth/refresh',
          data: {'refreshToken': refreshToken},
        );

        await _tokenManager.saveTokens(
          response.data['accessToken'],
          response.data['refreshToken'],
        );

        // Retry original request
        final retryResponse = await _retryRequest(err.requestOptions, handler);

        // Process pending requests
        for (final request in _pendingRequests) {
          request();
        }
        _pendingRequests.clear();

        handler.resolve(retryResponse);
      } catch (e) {
        _tokenManager.clearTokens();
        _pendingRequests.clear();
        handler.reject(err);
      } finally {
        _isRefreshing = false;
      }
    } else {
      handler.next(err);
    }
  }

  Future<Response> _retryRequest(
    RequestOptions options,
    ErrorInterceptorHandler handler,
  ) async {
    final token = await _tokenManager.getAccessToken();
    options.headers['Authorization'] = 'Bearer $token';
    return _dio.fetch(options);
  }
}
```

### Connectivity Handling
```dart
class ConnectivityService {
  final Connectivity _connectivity = Connectivity();

  Stream<bool> get onConnectivityChanged {
    return _connectivity.onConnectivityChanged.map((result) {
      return result != ConnectivityResult.none;
    });
  }

  Future<bool> get isConnected async {
    final result = await _connectivity.checkConnectivity();
    return result != ConnectivityResult.none;
  }
}

// Usage in repository
Future<Either<Failure, List<Post>>> getPosts() async {
  if (!await _connectivityService.isConnected) {
    // Return cached data
    try {
      final cached = await _localDataSource.getCachedPosts();
      return Right(cached.map((m) => m.toEntity()).toList());
    } catch (e) {
      return Left(const NetworkFailure('No internet and no cached data'));
    }
  }

  try {
    final posts = await _remoteDataSource.getPosts();
    await _localDataSource.cachePosts(posts);
    return Right(posts.map((m) => m.toEntity()).toList());
  } on ServerException catch (e) {
    return Left(ServerFailure(e.message));
  }
}
```

---

## 5. Local Storage

### Secure Storage (Tokens, Sensitive Data)
```dart
class SecureStorageService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  Future<void> write(String key, String value) async {
    await _storage.write(key: key, value: value);
  }

  Future<String?> read(String key) async {
    return _storage.read(key: key);
  }

  Future<void> delete(String key) async {
    await _storage.delete(key: key);
  }

  Future<void> deleteAll() async {
    await _storage.deleteAll();
  }
}

// Token Manager
class TokenManager {
  final SecureStorageService _storage;

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';

  TokenManager(this._storage);

  Future<void> saveTokens(String accessToken, String refreshToken) async {
    await Future.wait([
      _storage.write(_accessTokenKey, accessToken),
      _storage.write(_refreshTokenKey, refreshToken),
    ]);
  }

  Future<String?> getAccessToken() => _storage.read(_accessTokenKey);
  Future<String?> getRefreshToken() => _storage.read(_refreshTokenKey);

  Future<void> clearTokens() async {
    await Future.wait([
      _storage.delete(_accessTokenKey),
      _storage.delete(_refreshTokenKey),
    ]);
  }
}
```

### SharedPreferences (Settings, Non-Sensitive)
```dart
class PreferencesService {
  late SharedPreferences _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // Theme
  ThemeMode get themeMode {
    final value = _prefs.getString('theme_mode');
    switch (value) {
      case 'dark':
        return ThemeMode.dark;
      case 'light':
        return ThemeMode.light;
      default:
        return ThemeMode.system;
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    await _prefs.setString('theme_mode', mode.name);
  }

  // Onboarding
  bool get hasCompletedOnboarding {
    return _prefs.getBool('onboarding_complete') ?? false;
  }

  Future<void> completeOnboarding() async {
    await _prefs.setBool('onboarding_complete', true);
  }

  // Locale
  String? get locale => _prefs.getString('locale');

  Future<void> setLocale(String locale) async {
    await _prefs.setString('locale', locale);
  }
}
```

### Local Database (Drift/Hive)
```dart
// Drift (SQLite) - for relational data
@DriftDatabase(tables: [Users, Posts, Comments])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration {
    return MigrationStrategy(
      onCreate: (m) async {
        await m.createAll();
      },
      onUpgrade: (m, from, to) async {
        // Handle migrations
      },
    );
  }

  // Queries
  Future<List<UserData>> getAllUsers() => select(users).get();

  Future<UserData?> getUserById(int id) {
    return (select(users)..where((u) => u.id.equals(id))).getSingleOrNull();
  }

  Future<int> insertUser(UsersCompanion user) {
    return into(users).insert(user);
  }

  Stream<List<PostData>> watchPosts() => select(posts).watch();
}

// Hive - for NoSQL/fast reads
@HiveType(typeId: 0)
class CachedPost extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String title;

  @HiveField(2)
  final String content;

  @HiveField(3)
  final DateTime cachedAt;

  CachedPost({
    required this.id,
    required this.title,
    required this.content,
    required this.cachedAt,
  });
}

class PostCacheService {
  late Box<CachedPost> _box;

  Future<void> init() async {
    Hive.registerAdapter(CachedPostAdapter());
    _box = await Hive.openBox<CachedPost>('posts');
  }

  Future<void> cachePosts(List<CachedPost> posts) async {
    final map = {for (var p in posts) p.id: p};
    await _box.putAll(map);
  }

  List<CachedPost> getCachedPosts() {
    return _box.values.toList();
  }

  Future<void> clearCache() async {
    await _box.clear();
  }
}
```

---

## 6. Navigation (go_router)

### Router Configuration
```dart
final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
    refreshListenable: GoRouterRefreshStream(ref.read(authStateProvider.notifier).stream),

    redirect: (context, state) {
      final isAuthenticated = authState is AuthAuthenticated;
      final isAuthRoute = state.matchedLocation.startsWith('/auth');

      if (!isAuthenticated && !isAuthRoute) {
        return '/auth/login?redirect=${state.matchedLocation}';
      }

      if (isAuthenticated && isAuthRoute) {
        return state.uri.queryParameters['redirect'] ?? '/';
      }

      return null;
    },

    routes: [
      // Auth routes
      GoRoute(
        path: '/auth/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/auth/register',
        name: 'register',
        builder: (context, state) => const RegisterScreen(),
      ),

      // Main app shell
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(
            path: '/',
            name: 'home',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: '/profile',
            name: 'profile',
            builder: (context, state) => const ProfileScreen(),
          ),
          GoRoute(
            path: '/settings',
            name: 'settings',
            builder: (context, state) => const SettingsScreen(),
            routes: [
              GoRoute(
                path: 'notifications',
                name: 'notification-settings',
                builder: (context, state) => const NotificationSettingsScreen(),
              ),
            ],
          ),
        ],
      ),

      // Detail routes with parameters
      GoRoute(
        path: '/posts/:id',
        name: 'post-detail',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return PostDetailScreen(postId: id);
        },
      ),
    ],

    errorBuilder: (context, state) => ErrorScreen(error: state.error),
  );
});

// Navigation helpers
extension NavigationExtension on BuildContext {
  void goToLogin() => GoRouter.of(this).goNamed('login');
  void goToHome() => GoRouter.of(this).goNamed('home');
  void goToPost(String id) => GoRouter.of(this).goNamed('post-detail', pathParameters: {'id': id});
  void pop() => GoRouter.of(this).pop();
}
```

### Deep Linking
```yaml
# android/app/src/main/AndroidManifest.xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
        android:scheme="https"
        android:host="example.com"
        android:pathPrefix="/app" />
</intent-filter>

# ios/Runner/Info.plist
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>myapp</string>
        </array>
    </dict>
</array>
<key>FlutterDeepLinkingEnabled</key>
<true/>
```

---

## 7. UI Components & Theming

### Design System
```dart
// app_colors.dart
class AppColors {
  // Brand
  static const primary = Color(0xFF3B82F6);
  static const primaryDark = Color(0xFF2563EB);
  static const secondary = Color(0xFF10B981);

  // Neutral
  static const neutral50 = Color(0xFFFAFAFA);
  static const neutral100 = Color(0xFFF5F5F5);
  static const neutral200 = Color(0xFFE5E5E5);
  static const neutral300 = Color(0xFFD4D4D4);
  static const neutral500 = Color(0xFF737373);
  static const neutral700 = Color(0xFF404040);
  static const neutral900 = Color(0xFF171717);

  // Semantic
  static const success = Color(0xFF22C55E);
  static const warning = Color(0xFFF59E0B);
  static const error = Color(0xFFEF4444);
  static const info = Color(0xFF3B82F6);
}

// app_spacing.dart
class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;

  // Semantic
  static const double screenPadding = 16;
  static const double cardPadding = 16;
  static const double listItemSpacing = 12;
}

// app_typography.dart
class AppTypography {
  static const headlineLarge = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.bold,
    height: 1.2,
  );

  static const headlineMedium = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    height: 1.3,
  );

  static const titleLarge = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    height: 1.4,
  );

  static const bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    height: 1.5,
  );

  static const bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.normal,
    height: 1.5,
  );

  static const labelMedium = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    height: 1.4,
  );
}
```

### Theme Configuration
```dart
class AppTheme {
  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: Brightness.light,
      ),
      scaffoldBackgroundColor: AppColors.neutral50,
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 1,
      ),
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.neutral100,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }

  static ThemeData get dark {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: Brightness.dark,
      ),
      scaffoldBackgroundColor: AppColors.neutral900,
      // ... dark theme overrides
    );
  }
}
```

### Reusable Components
```dart
// app_button.dart
class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final ButtonVariant variant;
  final ButtonSize size;
  final IconData? icon;

  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.variant = ButtonVariant.primary,
    this.size = ButtonSize.medium,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: size.height,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: variant.style(context),
        child: isLoading
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: variant.loadingColor(context),
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: size.iconSize),
                    const SizedBox(width: 8),
                  ],
                  Text(label),
                ],
              ),
      ),
    );
  }
}

enum ButtonVariant { primary, secondary, outline, ghost }
enum ButtonSize {
  small(36, 16),
  medium(48, 20),
  large(56, 24);

  final double height;
  final double iconSize;
  const ButtonSize(this.height, this.iconSize);
}

// app_text_field.dart
class AppTextField extends StatelessWidget {
  final String label;
  final String? hint;
  final String? error;
  final TextEditingController? controller;
  final bool obscureText;
  final TextInputType? keyboardType;
  final ValueChanged<String>? onChanged;
  final Widget? suffixIcon;

  const AppTextField({
    super.key,
    required this.label,
    this.hint,
    this.error,
    this.controller,
    this.obscureText = false,
    this.keyboardType,
    this.onChanged,
    this.suffixIcon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTypography.labelMedium.copyWith(
            color: Theme.of(context).colorScheme.onSurface,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          onChanged: onChanged,
          decoration: InputDecoration(
            hintText: hint,
            errorText: error,
            suffixIcon: suffixIcon,
          ),
        ),
      ],
    );
  }
}
```

---

## 8. Performance Optimization

### Widget Optimization
```dart
// Use const constructors
const Text('Hello World');  // ✓
Text('Hello World');        // ✗

// Use const widgets
class MyWidget extends StatelessWidget {
  const MyWidget({super.key});  // ✓ Add const constructor

  @override
  Widget build(BuildContext context) {
    return const Column(      // ✓ const where possible
      children: [
        Text('Static text'),
        Icon(Icons.star),
      ],
    );
  }
}

// Avoid rebuilding unchanged widgets
class ParentWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // This will rebuild when parent rebuilds
        ExpensiveWidget(),

        // This won't rebuild (const)
        const ExpensiveWidget(),

        // Or extract to separate widget with own build
        const _IsolatedWidget(),
      ],
    );
  }
}
```

### List Optimization
```dart
// Use ListView.builder for long lists
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => ItemTile(item: items[index]),
);

// Add item extent for better performance
ListView.builder(
  itemCount: items.length,
  itemExtent: 80,  // Fixed height
  itemBuilder: (context, index) => ItemTile(item: items[index]),
);

// Use const item keys
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => ItemTile(
    key: ValueKey(items[index].id),  // Stable key
    item: items[index],
  ),
);

// For very long lists, use Sliver
CustomScrollView(
  slivers: [
    SliverAppBar(/* ... */),
    SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) => ItemTile(item: items[index]),
        childCount: items.length,
      ),
    ),
  ],
);
```

### Image Optimization
```dart
// Use cached_network_image
CachedNetworkImage(
  imageUrl: imageUrl,
  placeholder: (context, url) => const ShimmerPlaceholder(),
  errorWidget: (context, url, error) => const Icon(Icons.error),
  memCacheWidth: 300,  // Resize in memory
);

// Precache images
@override
void didChangeDependencies() {
  super.didChangeDependencies();
  precacheImage(AssetImage('assets/hero.png'), context);
}

// Use appropriate image formats
// - WebP for photos (smaller than PNG/JPEG)
// - SVG for icons (flutter_svg package)
// - Lottie for animations
```

### Avoid Jank
```dart
// Use compute() for heavy operations
Future<List<ProcessedItem>> processItems(List<RawItem> items) async {
  return compute(_processItemsIsolate, items);
}

List<ProcessedItem> _processItemsIsolate(List<RawItem> items) {
  return items.map((item) => ProcessedItem.from(item)).toList();
}

// Defer non-critical initialization
Future<void> _init() async {
  // Critical - do first
  await _authService.init();

  // Non-critical - defer
  WidgetsBinding.instance.addPostFrameCallback((_) {
    _analyticsService.init();
    _pushNotificationService.init();
  });
}
```

### Performance Checklist
- [ ] Use `const` constructors everywhere possible
- [ ] `ListView.builder` for long lists
- [ ] `itemExtent` for fixed-height items
- [ ] Stable keys for list items
- [ ] `CachedNetworkImage` for network images
- [ ] `compute()` for heavy operations
- [ ] Avoid rebuilding unchanged widgets
- [ ] Profile with DevTools

---

## 9. Accessibility

### Semantics
```dart
// Provide semantic labels
Semantics(
  label: 'Profile picture for ${user.name}',
  child: CircleAvatar(
    backgroundImage: NetworkImage(user.avatarUrl),
  ),
);

// Exclude decorative elements
Semantics(
  excludeSemantics: true,
  child: const Icon(Icons.decorative_pattern),
);

// Group related elements
MergeSemantics(
  child: Row(
    children: [
      const Icon(Icons.star),
      Text('${product.rating} stars'),
    ],
  ),
);

// Button semantics
Semantics(
  button: true,
  label: 'Add to cart',
  onTap: () => _addToCart(),
  child: Container(/* custom button */),
);
```

### Text Scaling
```dart
// Respect user's text scale preference
Text(
  'Hello',
  style: TextStyle(fontSize: 16),  // Will scale with system settings
);

// Limit scaling for specific elements
Text(
  'Logo Text',
  textScaler: TextScaler.linear(1.0),  // Fixed size
);

// Test with different scales
MediaQuery(
  data: MediaQuery.of(context).copyWith(
    textScaler: TextScaler.linear(2.0),  // 200% scale
  ),
  child: MyWidget(),
);
```

### Touch Targets
```dart
// Minimum 48x48 touch target
InkWell(
  onTap: onTap,
  child: Padding(
    padding: const EdgeInsets.all(12),  // Expand touch area
    child: Icon(Icons.menu, size: 24),  // 24 + 12*2 = 48
  ),
);

// Material widgets handle this automatically
IconButton(  // Already 48x48 by default
  icon: const Icon(Icons.menu),
  onPressed: onPressed,
);
```

### Screen Reader Support
```dart
// Announce dynamic changes
SemanticsService.announce('Item added to cart', TextDirection.ltr);

// Focus management
FocusScope.of(context).requestFocus(myFocusNode);

// Live regions for updates
Semantics(
  liveRegion: true,
  child: Text('$itemCount items in cart'),
);
```

### Accessibility Checklist
- [ ] All interactive elements have semantic labels
- [ ] Touch targets are at least 48x48
- [ ] Color is not the only indicator
- [ ] Text scales with system settings
- [ ] Screen reader tested (TalkBack/VoiceOver)
- [ ] Focus order is logical
- [ ] Decorative elements excluded from semantics

---

## 10. Internationalization (i18n)

### Setup (flutter_localizations + intl)
```yaml
# pubspec.yaml
dependencies:
  flutter_localizations:
    sdk: flutter
  intl: ^0.18.0

flutter:
  generate: true  # Enable code generation

# l10n.yaml
arb-dir: lib/l10n
template-arb-file: app_en.arb
output-localization-file: app_localizations.dart
```

### ARB Files
```json
// lib/l10n/app_en.arb
{
  "@@locale": "en",
  "appTitle": "My App",
  "welcomeMessage": "Welcome, {name}!",
  "@welcomeMessage": {
    "placeholders": {
      "name": {
        "type": "String"
      }
    }
  },
  "itemCount": "{count, plural, =0{No items} =1{1 item} other{{count} items}}",
  "@itemCount": {
    "placeholders": {
      "count": {
        "type": "int"
      }
    }
  },
  "lastUpdated": "Last updated: {date}",
  "@lastUpdated": {
    "placeholders": {
      "date": {
        "type": "DateTime",
        "format": "yMMMd"
      }
    }
  }
}

// lib/l10n/app_es.arb
{
  "@@locale": "es",
  "appTitle": "Mi App",
  "welcomeMessage": "¡Bienvenido, {name}!",
  "itemCount": "{count, plural, =0{Sin artículos} =1{1 artículo} other{{count} artículos}}"
}
```

### App Configuration
```dart
// main.dart
MaterialApp(
  localizationsDelegates: const [
    AppLocalizations.delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
  ],
  supportedLocales: const [
    Locale('en'),
    Locale('es'),
    Locale('fr'),
  ],
  locale: ref.watch(localeProvider),  // User preference
);

// Usage
Text(AppLocalizations.of(context)!.welcomeMessage('John'));
Text(AppLocalizations.of(context)!.itemCount(5));
```

### RTL Support
```dart
// Automatically handled, but be careful with:

// Use Directionality-aware widgets
Padding(
  padding: EdgeInsetsDirectional.only(start: 16),  // Not left
);

Row(
  children: [
    Expanded(child: Text('Label')),
    Icon(Icons.arrow_forward_ios),  // Use directional icons
  ],
);

// Or use TextDirection explicitly
Directionality(
  textDirection: TextDirection.rtl,
  child: MyWidget(),
);
```

---

## 11. Testing

### Unit Tests
```dart
// test/services/auth_service_test.dart
void main() {
  late AuthService authService;
  late MockApiClient mockApiClient;

  setUp(() {
    mockApiClient = MockApiClient();
    authService = AuthService(mockApiClient);
  });

  group('login', () {
    test('returns user on successful login', () async {
      when(mockApiClient.post(any, data: anyNamed('data')))
          .thenAnswer((_) async => userResponse);

      final result = await authService.login('test@example.com', 'password');

      expect(result.isRight(), true);
      result.fold(
        (l) => fail('Expected Right'),
        (user) => expect(user.email, 'test@example.com'),
      );
    });

    test('returns failure on invalid credentials', () async {
      when(mockApiClient.post(any, data: anyNamed('data')))
          .thenThrow(UnauthorizedException());

      final result = await authService.login('test@example.com', 'wrong');

      expect(result.isLeft(), true);
      result.fold(
        (failure) => expect(failure, isA<AuthFailure>()),
        (r) => fail('Expected Left'),
      );
    });
  });
}
```

### Widget Tests
```dart
// test/widgets/login_form_test.dart
void main() {
  testWidgets('shows error when email is invalid', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: LoginForm()),
    );

    // Enter invalid email
    await tester.enterText(find.byKey(const Key('email-field')), 'invalid');
    await tester.enterText(find.byKey(const Key('password-field')), 'password');

    // Submit
    await tester.tap(find.byType(ElevatedButton));
    await tester.pumpAndSettle();

    // Verify error
    expect(find.text('Invalid email'), findsOneWidget);
  });

  testWidgets('calls onSubmit with valid data', (tester) async {
    String? submittedEmail;
    String? submittedPassword;

    await tester.pumpWidget(
      MaterialApp(
        home: LoginForm(
          onSubmit: (email, password) {
            submittedEmail = email;
            submittedPassword = password;
          },
        ),
      ),
    );

    await tester.enterText(find.byKey(const Key('email-field')), 'test@example.com');
    await tester.enterText(find.byKey(const Key('password-field')), 'password123');
    await tester.tap(find.byType(ElevatedButton));
    await tester.pumpAndSettle();

    expect(submittedEmail, 'test@example.com');
    expect(submittedPassword, 'password123');
  });
}
```

### Integration Tests
```dart
// integration_test/app_test.dart
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('end-to-end test', () {
    testWidgets('login flow', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Verify on login screen
      expect(find.text('Sign In'), findsOneWidget);

      // Enter credentials
      await tester.enterText(find.byKey(const Key('email-field')), 'test@example.com');
      await tester.enterText(find.byKey(const Key('password-field')), 'password123');

      // Submit
      await tester.tap(find.text('Sign In'));
      await tester.pumpAndSettle();

      // Verify navigation to home
      expect(find.text('Welcome'), findsOneWidget);
    });
  });
}
```

### Golden Tests
```dart
// test/widgets/golden_test.dart
void main() {
  testWidgets('AppButton matches golden', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Center(
            child: AppButton(label: 'Click Me'),
          ),
        ),
      ),
    );

    await expectLater(
      find.byType(AppButton),
      matchesGoldenFile('goldens/app_button.png'),
    );
  });
}

// Update goldens: flutter test --update-goldens
```

### Testing Checklist
- [ ] Unit tests for services and repositories
- [ ] Widget tests for UI components
- [ ] Integration tests for critical flows
- [ ] Golden tests for design consistency
- [ ] Test coverage > 70% for business logic
- [ ] Tests run in CI

---

## 12. App Store Deployment

### Pre-Release Checklist
```
iOS:
- [ ] Bundle ID configured
- [ ] App icons (all sizes)
- [ ] Launch screen configured
- [ ] Info.plist permissions with descriptions
- [ ] Signing certificate and provisioning profile
- [ ] App Store Connect metadata
- [ ] Privacy policy URL
- [ ] Screenshots for all device sizes

Android:
- [ ] Package name configured
- [ ] App icons (all densities)
- [ ] Keystore created and secured
- [ ] Signing configured in build.gradle
- [ ] Google Play Console listing
- [ ] Privacy policy URL
- [ ] Screenshots and feature graphic
- [ ] Content rating questionnaire
```

### Build Commands
```bash
# iOS
flutter build ios --release
# Then archive in Xcode and upload to App Store Connect

# Android
flutter build appbundle --release
# Upload .aab to Google Play Console

# With flavor/environment
flutter build appbundle --release --flavor production -t lib/main_production.dart
```

### Version Management
```yaml
# pubspec.yaml
version: 1.2.3+45
# 1.2.3 = version name (shown to users)
# 45 = build number (must increment for each upload)
```

### CI/CD (GitHub Actions)
```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.19.0'
          channel: 'stable'

      - name: Get dependencies
        run: flutter pub get

      - name: Run tests
        run: flutter test

      - name: Decode keystore
        run: echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > android/app/keystore.jks

      - name: Build APK
        run: flutter build appbundle --release
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}

      - name: Upload to Play Store
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.PLAY_STORE_SERVICE_ACCOUNT }}
          packageName: com.example.app
          releaseFiles: build/app/outputs/bundle/release/app-release.aab
          track: internal

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.19.0'

      - name: Install CocoaPods
        run: cd ios && pod install

      - name: Build iOS
        run: flutter build ios --release --no-codesign

      - name: Upload to TestFlight
        uses: apple-actions/upload-testflight-build@v1
        with:
          app-path: build/ios/ipa/app.ipa
          issuer-id: ${{ secrets.APPSTORE_ISSUER_ID }}
          api-key-id: ${{ secrets.APPSTORE_API_KEY_ID }}
          api-private-key: ${{ secrets.APPSTORE_API_PRIVATE_KEY }}
```

---

## 13. Security

### Secure Storage
```dart
// Never store sensitive data in SharedPreferences
// Use flutter_secure_storage
final secureStorage = FlutterSecureStorage(
  aOptions: AndroidOptions(
    encryptedSharedPreferences: true,
  ),
);

await secureStorage.write(key: 'token', value: token);
```

### Certificate Pinning
```dart
// Using dio with certificate pinning
Dio dio = Dio();
(dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () {
  final client = HttpClient();
  client.badCertificateCallback = (cert, host, port) {
    // Compare cert with pinned certificate
    return cert.pem == pinnedCertificate;
  };
  return client;
};
```

### Code Obfuscation
```bash
# Build with obfuscation
flutter build apk --obfuscate --split-debug-info=build/debug-info

# Keep debug symbols for crash reporting
# Upload build/debug-info to Firebase Crashlytics
```

### Root/Jailbreak Detection
```dart
// Using flutter_jailbreak_detection
final isJailbroken = await FlutterJailbreakDetection.jailbroken;
final isDeveloperMode = await FlutterJailbreakDetection.developerMode;

if (isJailbroken) {
  // Handle compromised device
  showSecurityWarning();
}
```

### Security Checklist
- [ ] Tokens stored in secure storage
- [ ] Certificate pinning for sensitive APIs
- [ ] Code obfuscation enabled
- [ ] No sensitive data in logs
- [ ] Root/jailbreak detection (if needed)
- [ ] Biometric authentication for sensitive actions
- [ ] Input validation on all user inputs
- [ ] ProGuard/R8 rules for Android

---

## 14. Crash Reporting & Analytics

### Firebase Crashlytics
```dart
// Initialize in main.dart
await Firebase.initializeApp();

// Catch Flutter errors
FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterError;

// Catch async errors
PlatformDispatcher.instance.onError = (error, stack) {
  FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
  return true;
};

// Log non-fatal errors
try {
  // risky operation
} catch (e, stack) {
  FirebaseCrashlytics.instance.recordError(e, stack);
}

// Add context
FirebaseCrashlytics.instance.setUserIdentifier(userId);
FirebaseCrashlytics.instance.setCustomKey('screen', 'checkout');
```

### Analytics
```dart
// Firebase Analytics
final analytics = FirebaseAnalytics.instance;

// Log events
await analytics.logEvent(
  name: 'purchase',
  parameters: {
    'item_id': product.id,
    'item_name': product.name,
    'value': product.price,
  },
);

// Screen tracking (with go_router)
GoRouter(
  observers: [FirebaseAnalyticsObserver(analytics: analytics)],
);

// User properties
await analytics.setUserProperty(name: 'subscription', value: 'premium');
```

---

## Pre-Launch Checklist

### Code Quality
- [ ] No warnings or errors
- [ ] Code formatted (`dart format`)
- [ ] Lints passing (`flutter analyze`)
- [ ] Unused code removed
- [ ] TODOs addressed

### Architecture
- [ ] Clean architecture followed
- [ ] State management consistent
- [ ] Error handling comprehensive
- [ ] Offline support where needed

### UI/UX
- [ ] All screens responsive
- [ ] Loading states for async operations
- [ ] Error states with retry
- [ ] Empty states designed
- [ ] Accessibility tested

### Performance
- [ ] No jank (60fps)
- [ ] App size optimized
- [ ] Images optimized
- [ ] Memory leaks checked
- [ ] Startup time acceptable

### Security
- [ ] Secure storage for tokens
- [ ] No sensitive data in logs
- [ ] Code obfuscation enabled
- [ ] API keys not in code

### Testing
- [ ] Unit tests passing
- [ ] Widget tests passing
- [ ] Integration tests passing
- [ ] Manual testing on real devices

### Release
- [ ] Version and build number updated
- [ ] Changelog prepared
- [ ] App store metadata ready
- [ ] Screenshots updated
- [ ] Privacy policy current

---

## Resources

- [Flutter Documentation](https://docs.flutter.dev/)
- [Flutter Cookbook](https://docs.flutter.dev/cookbook)
- [Effective Dart](https://dart.dev/effective-dart)
- [Flutter Architecture Samples](https://fluttersamples.com/)
- [Riverpod Documentation](https://riverpod.dev/)
- [go_router Documentation](https://pub.dev/packages/go_router)
- [Flutter Performance Best Practices](https://docs.flutter.dev/perf/best-practices)

---

*Last updated: February 2026*
