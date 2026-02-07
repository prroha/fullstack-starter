# CLAUDE.md - Fullstack Starter Mobile App

> **Last Updated**: 2026-02-06
> **Codebase Version**: 1.0.0+1
> **Maintainer**: AI-assisted documentation (auto-update on changes)

AI-optimized documentation for quick codebase navigation and understanding.

---

## Quick Search Keywords

Use these to quickly find what you need:
- **Authentication**: `token_manager.dart`, `AuthInterceptor`, `api_interceptors.dart`
- **API/Network**: `api_client.dart`, `api_constants.dart`, `Dio`
- **State**: `providers/`, `StateNotifier`, `Riverpod`, `ref.watch`, `ref.read`
- **Theme**: `app_colors.dart`, `app_spacing.dart`
- **Errors**: `failures.dart`, `exceptions.dart`, `Either`, `Failure`
- **Widgets**: `widgets/`, `atoms/`, `molecules/`, `organisms/`, `layout/`

---

## Recent Changes

<!-- Add new entries at the top -->
| Date | Change | Files |
|------|--------|-------|
| 2026-02-06 | Initial documentation | CLAUDE.md |

---

## Quick Reference

| Item | Location |
|------|----------|
| Entry point | `lib/main.dart` |
| App widget | `lib/app.dart` |
| API endpoints | `lib/core/constants/api_constants.dart` |
| Theme colors | `lib/core/theme/app_colors.dart` |
| Spacing | `lib/core/theme/app_spacing.dart` |

---

## Architecture Overview

### Tech Stack
- **Flutter** 3.2+ / Dart
- **State Management**: Riverpod (flutter_riverpod)
- **Navigation**: go_router (available, configure as needed)
- **HTTP**: Dio
- **Storage**: flutter_secure_storage
- **Functional**: dartz (Either type)
- **Code Gen**: freezed, json_serializable

### Clean Architecture Layers

```
lib/
├── core/           # Shared utilities, services, constants
├── data/           # API calls, models, repository implementations
├── domain/         # Business entities, repository interfaces
└── presentation/   # UI (screens, widgets, providers)
```

### Design Patterns
- **Repository Pattern**: Abstract interfaces in `domain/`, implementations in `data/`
- **StateNotifier**: State management pattern for providers
- **Either<Failure, T>**: Functional error handling (no exceptions in business logic)
- **Dependency Injection**: Riverpod providers for all dependencies

---

## Folder Structure

### `lib/core/`
```
core/
├── constants/
│   └── api_constants.dart      # API endpoints (IMPORTANT)
├── errors/
│   ├── exceptions.dart         # Exception classes
│   └── failures.dart           # Failure classes for Either
├── network/
│   ├── api_client.dart         # Dio provider setup
│   └── api_interceptors.dart   # Auth, logging interceptors
├── services/
│   └── token_manager.dart      # JWT token handling
└── theme/
    ├── app_colors.dart         # Color palette
    └── app_spacing.dart        # Spacing constants
```

### `lib/data/`
```
data/
├── datasources/
│   └── remote/                 # API datasources (create as needed)
├── models/                     # JSON serializable models
└── repositories/
    └── base_repository.dart    # safeCall mixin for error handling
```

### `lib/domain/`
```
domain/
├── entities/                   # Pure business objects (create as needed)
└── repositories/               # Abstract interfaces (create as needed)
```

### `lib/presentation/`
```
presentation/
├── providers/                  # Riverpod state management
├── screens/                    # Screen widgets
└── widgets/                    # Atomic design widgets
    ├── atoms/                  # Primitives (button, text, icon, badge)
    ├── molecules/              # Composed (text_field, card, search_bar)
    ├── organisms/              # Complex (header, drawer, avatar)
    └── layout/                 # Structural (scaffold, loading, error, empty)
```

---

## State Management

### Provider Pattern
```dart
// 1. State class (immutable)
class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;

  AuthState({this.user, this.isLoading = false, this.error});

  AuthState copyWith({...}) => AuthState(...);
}

// 2. StateNotifier with business logic
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(AuthState());

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await _repository.login(email, password);
    result.fold(
      (failure) => state = state.copyWith(isLoading: false, error: failure.message),
      (user) => state = state.copyWith(isLoading: false, user: user),
    );
  }
}

// 3. Provider definition
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return AuthNotifier(repository);
});
```

### Using Providers in Widgets
```dart
class LoginScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      body: authState.isLoading
        ? const CircularProgressIndicator()
        : LoginForm(
            onSubmit: (email, password) {
              ref.read(authProvider.notifier).login(email, password);
            },
          ),
    );
  }
}
```

---

## Data Layer

### API Client Setup
```dart
// lib/core/network/api_client.dart
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: ApiConstants.baseUrl,
    connectTimeout: Duration(seconds: 30),
    receiveTimeout: Duration(seconds: 30),
  ));
  dio.interceptors.addAll([
    LoggingInterceptor(),
    AuthInterceptor(ref),  // Auto-attaches JWT
  ]);
  return dio;
});
```

### API Constants
```dart
// lib/core/constants/api_constants.dart
class ApiConstants {
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:8000/api/v1', // Android emulator
  );

  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String me = '/auth/me';
  // Add your endpoints here
}
```

### Token Manager
```dart
// lib/core/services/token_manager.dart
abstract class TokenManager {
  Future<String?> getAccessToken();
  Future<String?> getRefreshToken();
  Future<void> saveTokens({required String accessToken, required String refreshToken});
  Future<void> clearTokens();
  Future<bool> hasValidTokens();
}
```

### Repository Pattern
```dart
// Domain interface (lib/domain/repositories/)
abstract class AuthRepository {
  Future<Either<Failure, User>> login({required String email, required String password});
}

// Data implementation (lib/data/repositories/)
class AuthRepositoryImpl with BaseRepository implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final TokenManager _tokenManager;

  @override
  Future<Either<Failure, User>> login({...}) {
    return safeCall(() async {
      final response = await _remoteDataSource.login(email: email, password: password);
      await _tokenManager.saveTokens(
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      );
      return response.user.toEntity();
    });
  }
}
```

---

## Error Handling

### Exception Types (`lib/core/errors/exceptions.dart`)
- `ServerException` - API errors with status code
- `NetworkException` - Connection issues
- `UnauthorizedException` - 401 errors
- `ValidationException` - 400/422 with field errors
- `CacheException` - Local storage errors

### Failure Types (`lib/core/errors/failures.dart`)
- `ServerFailure`
- `NetworkFailure`
- `UnauthorizedFailure`
- `ValidationFailure`
- `CacheFailure`
- `UnknownFailure`

### Usage Pattern
```dart
final result = await repository.getData();
result.fold(
  (failure) => showError(failure.message),
  (data) => handleSuccess(data),
);
```

### BaseRepository Mixin
```dart
// Wraps API calls with error handling
mixin BaseRepository {
  Future<Either<Failure, T>> safeCall<T>(Future<T> Function() call) async {
    try {
      final result = await call();
      return Right(result);
    } on UnauthorizedException catch (e) {
      return Left(UnauthorizedFailure(e.message));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(e.message));
    } on DioException catch (e) {
      return Left(_handleDioError(e));
    } catch (e) {
      return Left(UnknownFailure(e.toString()));
    }
  }
}
```

---

## UI Patterns

### Theme Colors
```dart
// lib/core/theme/app_colors.dart
class AppColors {
  static const Color primary = Color(0xFF2563EB);      // Blue
  static const Color secondary = Color(0xFF7C3AED);    // Violet
  static const Color success = Color(0xFF10B981);      // Green
  static const Color warning = Color(0xFFF59E0B);      // Amber
  static const Color error = Color(0xFFEF4444);        // Red
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color background = Color(0xFFF9FAFB);
  static const Color surface = Color(0xFFFFFFFF);
}
```

### Spacing Constants
```dart
// lib/core/theme/app_spacing.dart
class AppSpacing {
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;

  static const EdgeInsets screenPadding = EdgeInsets.all(md);
  static const EdgeInsets cardPadding = EdgeInsets.all(md);

  static final BorderRadius borderRadiusMd = BorderRadius.circular(12.0);

  static const SizedBox gapMd = SizedBox(height: md);
  static const SizedBox gapHMd = SizedBox(width: md);
}
```

### Widget Library (Atomic Design)

**Atoms** (`widgets/atoms/`)
| Widget | File | Purpose |
|--------|------|---------|
| `AppButton` | app_button.dart | Primary/secondary/outline/text buttons |
| `AppText` | app_text.dart | Styled text (heading, body, caption, label) |
| `AppIcon` | app_icon.dart | Icon with size/color presets |
| `AppBadge` | app_badge.dart | Notification/status badges |

**Molecules** (`widgets/molecules/`)
| Widget | File | Purpose |
|--------|------|---------|
| `AppTextField` | app_text_field.dart | Form text input with label/error |
| `AppCard` | app_card.dart | Card with header/content/footer |
| `AppSearchBar` | search_bar.dart | Search input with clear button |
| `PasswordField` | password_field.dart | Password input with show/hide |

**Organisms** (`widgets/organisms/`)
| Widget | File | Purpose |
|--------|------|---------|
| `AppHeader` | app_header.dart | App bar with back/title/actions |
| `AppDrawer` | app_drawer.dart | Navigation drawer with menu |
| `UserAvatar` | user_avatar.dart | Avatar with initials fallback |

**Layout** (`widgets/layout/`)
| Widget | File | Purpose |
|--------|------|---------|
| `ScreenScaffold` | screen_scaffold.dart | Scaffold with header/body/FAB |
| `LoadingWidget` | loading_overlay.dart | Centered loading spinner |
| `LoadingOverlay` | loading_overlay.dart | Content with loading overlay |
| `EmptyState` | empty_state.dart | Empty state with action |
| `ErrorState` | error_state.dart | Error state with retry |

---

## Quick Reference: How To...

### Add a New Screen

1. Create screen file in `lib/presentation/screens/{feature}/`:
```dart
class NewScreen extends ConsumerWidget {
  const NewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('New Screen')),
      body: const Center(child: Text('Content')),
    );
  }
}
```

2. Add route (if using go_router):
```dart
GoRoute(
  path: '/new-screen',
  builder: (context, state) => const NewScreen(),
),
```

### Add a New API Endpoint

1. Add endpoint constant in `lib/core/constants/api_constants.dart`:
```dart
static const String newEndpoint = '/new-endpoint';
static String newEndpointById(String id) => '/new-endpoint/$id';
```

2. Create datasource method:
```dart
Future<NewModel> getNewData() async {
  final response = await dio.get(ApiConstants.newEndpoint);
  return NewModel.fromJson(response.data['data']);
}
```

### Add a New Provider

1. Create state class:
```dart
class NewState {
  final bool isLoading;
  final String? error;
  final List<Item> items;

  NewState({this.isLoading = false, this.error, this.items = const []});

  NewState copyWith({...}) => NewState(...);
}
```

2. Create notifier:
```dart
class NewNotifier extends StateNotifier<NewState> {
  final NewRepository _repository;

  NewNotifier(this._repository) : super(NewState());

  Future<void> load() async {
    state = state.copyWith(isLoading: true);
    final result = await _repository.getItems();
    result.fold(
      (failure) => state = state.copyWith(isLoading: false, error: failure.message),
      (items) => state = state.copyWith(isLoading: false, items: items),
    );
  }
}
```

3. Create provider:
```dart
final newProvider = StateNotifierProvider<NewNotifier, NewState>((ref) {
  return NewNotifier(ref.watch(newRepositoryProvider));
});
```

### Add a New Model (with freezed)

1. Create model in `lib/data/models/`:
```dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'new_model.freezed.dart';
part 'new_model.g.dart';

@freezed
class NewModel with _$NewModel {
  const NewModel._();

  const factory NewModel({
    @Default('') String id,
    @Default('') String name,
  }) = _NewModel;

  factory NewModel.fromJson(Map<String, dynamic> json) => _$NewModelFromJson(json);

  NewEntity toEntity() => NewEntity(id: id, name: name);
}
```

2. Run code generation:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

---

## Code Generation

After modifying `@freezed` or `@JsonSerializable` classes:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

Watch mode during development:
```bash
flutter pub run build_runner watch --delete-conflicting-outputs
```

---

## Key Files Summary

| Purpose | File |
|---------|------|
| App entry | `lib/main.dart` |
| App widget | `lib/app.dart` |
| API base URL | `lib/core/constants/api_constants.dart` |
| Dio setup | `lib/core/network/api_client.dart` |
| Auth interceptor | `lib/core/network/api_interceptors.dart` |
| Token handling | `lib/core/services/token_manager.dart` |
| Colors | `lib/core/theme/app_colors.dart` |
| Spacing | `lib/core/theme/app_spacing.dart` |
| Error handling | `lib/data/repositories/base_repository.dart` |

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| API connection fails on emulator | Wrong base URL | Use `10.0.2.2` for Android emulator |
| API connection fails on device | Hardcoded localhost | Use `--dart-define=API_URL=http://YOUR_IP:8000/api/v1` |
| Token refresh fails | Invalid refresh token | Clear secure storage, re-login |
| 401 Unauthorized | Token expired | Check `AuthInterceptor` in `api_interceptors.dart` |
| State not updating | Provider not watched | Use `ref.watch()` not `ref.read()` for reactive updates |
| Build fails with freezed | Generated files outdated | Run `flutter pub run build_runner build` |
| Model parsing fails | JSON key mismatch | Check `@JsonKey()` annotations |

---

## Critical Code Locations

| Functionality | File | Key Class/Function |
|--------------|------|-------------------|
| Token storage | `lib/core/services/token_manager.dart` | `TokenManager` |
| Auth interceptor | `lib/core/network/api_interceptors.dart` | `AuthInterceptor` |
| API client | `lib/core/network/api_client.dart` | `dioProvider` |
| Error mapping | `lib/data/repositories/base_repository.dart` | `safeCall()` |
| Theme colors | `lib/core/theme/app_colors.dart` | `AppColors` |
| Spacing | `lib/core/theme/app_spacing.dart` | `AppSpacing` |

---

## Development Commands

```bash
# Run app
flutter run

# Run with custom API URL
flutter run --dart-define=API_URL=http://192.168.1.100:8000/api/v1

# Build APK
flutter build apk

# Build iOS
flutter build ios

# Generate code (freezed, json_serializable)
flutter pub run build_runner build --delete-conflicting-outputs

# Watch mode for code generation
flutter pub run build_runner watch --delete-conflicting-outputs

# Run tests
flutter test

# Analyze code
flutter analyze
```

---

## Notes

- All business logic should go through repositories (not directly calling datasources)
- Use `Either<Failure, T>` for all repository methods - no exceptions in business layer
- Providers should be the only way to access state in widgets
- Use `ConsumerWidget` or `ConsumerStatefulWidget` for widgets that need providers
- Models (`data/`) convert to Entities (`domain/`) via `toEntity()` method
- Always dispose controllers in `dispose()` method of StatefulWidgets
- Hot reload doesn't work for provider changes - use hot restart

---

*This documentation is designed to be self-growing. Update the "Recent Changes" section when making significant changes to the codebase.*
