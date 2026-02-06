import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants/api_constants.dart';
import '../../core/errors/failures.dart';
import '../../core/network/api_client.dart';
import '../../core/services/token_manager.dart';
import 'base_repository.dart';

/// Auth repository provider
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(
    dio: ref.watch(dioProvider),
    tokenManager: ref.watch(tokenManagerProvider),
  );
});

/// Auth response model
class AuthResponse {
  final String userId;
  final String email;
  final String? name;
  final String accessToken;
  final String refreshToken;

  const AuthResponse({
    required this.userId,
    required this.email,
    this.name,
    required this.accessToken,
    required this.refreshToken,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? json;
    final user = data['user'] as Map<String, dynamic>;

    return AuthResponse(
      userId: user['id'] as String,
      email: user['email'] as String,
      name: user['name'] as String?,
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
    );
  }
}

/// Register response model (registration doesn't return tokens)
class RegisterResponse {
  final String userId;
  final String email;
  final String? name;

  const RegisterResponse({
    required this.userId,
    required this.email,
    this.name,
  });

  factory RegisterResponse.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? json;
    final user = data['user'] as Map<String, dynamic>;

    return RegisterResponse(
      userId: user['id'] as String,
      email: user['email'] as String,
      name: user['name'] as String?,
    );
  }
}

/// Token refresh response model
class TokenRefreshResponse {
  final String accessToken;
  final String refreshToken;
  final String userId;
  final String email;

  const TokenRefreshResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.userId,
    required this.email,
  });

  factory TokenRefreshResponse.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? json;
    final user = data['user'] as Map<String, dynamic>?;

    return TokenRefreshResponse(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
      userId: user?['id'] as String? ?? '',
      email: user?['email'] as String? ?? '',
    );
  }
}

/// Auth repository interface
abstract class AuthRepository {
  /// Login with email and password
  Future<Either<Failure, AuthResponse>> login({
    required String email,
    required String password,
  });

  /// Register a new user
  Future<Either<Failure, RegisterResponse>> register({
    required String email,
    required String password,
    String? name,
  });

  /// Refresh access token using refresh token
  Future<Either<Failure, TokenRefreshResponse>> refreshToken(
    String refreshToken,
  );

  /// Logout the current user
  Future<Either<Failure, void>> logout();
}

/// Auth repository implementation
class AuthRepositoryImpl with BaseRepository implements AuthRepository {
  final Dio _dio;
  final TokenManager _tokenManager;

  AuthRepositoryImpl({
    required Dio dio,
    required TokenManager tokenManager,
  })  : _dio = dio,
        _tokenManager = tokenManager;

  @override
  Future<Either<Failure, AuthResponse>> login({
    required String email,
    required String password,
  }) async {
    return safeCall(() async {
      final response = await _dio.post(
        ApiConstants.login,
        data: {
          'email': email,
          'password': password,
        },
      );

      final authResponse = AuthResponse.fromJson(response.data);

      // Save tokens
      await _tokenManager.saveTokens(
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
        userId: authResponse.userId,
      );

      return authResponse;
    });
  }

  @override
  Future<Either<Failure, RegisterResponse>> register({
    required String email,
    required String password,
    String? name,
  }) async {
    return safeCall(() async {
      final response = await _dio.post(
        ApiConstants.register,
        data: {
          'email': email,
          'password': password,
          if (name != null) 'name': name,
        },
      );

      return RegisterResponse.fromJson(response.data);
    });
  }

  @override
  Future<Either<Failure, TokenRefreshResponse>> refreshToken(
    String refreshToken,
  ) async {
    return safeCall(() async {
      final response = await _dio.post(
        ApiConstants.refresh,
        data: {
          'refreshToken': refreshToken,
        },
      );

      final tokenResponse = TokenRefreshResponse.fromJson(response.data);

      // Save new tokens
      await _tokenManager.saveTokens(
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
        userId: tokenResponse.userId,
      );

      return tokenResponse;
    });
  }

  @override
  Future<Either<Failure, void>> logout() async {
    return safeCall(() async {
      try {
        await _dio.post(ApiConstants.logout);
      } catch (_) {
        // Ignore logout API errors, still clear local tokens
      }
      await _tokenManager.clearTokens();
    });
  }
}
