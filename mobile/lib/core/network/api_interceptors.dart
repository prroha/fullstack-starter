import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/token_manager.dart';

/// Logging interceptor for debugging
class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (kDebugMode) {
      print('📤 ${options.method} ${options.uri}');
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (kDebugMode) {
      print('📥 ${response.statusCode} ${response.requestOptions.uri}');
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (kDebugMode) {
      print('❌ ${err.response?.statusCode} ${err.requestOptions.uri}');
      print('   ${err.message}');
    }
    handler.next(err);
  }
}

/// Auth interceptor for adding tokens and handling refresh
class AuthInterceptor extends Interceptor {
  final Ref _ref;

  AuthInterceptor(this._ref);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Skip auth for public endpoints
    if (_isPublicEndpoint(options.path)) {
      handler.next(options);
      return;
    }

    // Add access token if available
    final tokenManager = _ref.read(tokenManagerProvider);
    final accessToken = await tokenManager.getAccessToken();

    if (accessToken != null) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }

    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // Handle 401 - try to refresh token
    if (err.response?.statusCode == 401) {
      final tokenManager = _ref.read(tokenManagerProvider);

      try {
        // Attempt to refresh tokens
        final refreshToken = await tokenManager.getRefreshToken();
        if (refreshToken != null) {
          // TODO: Implement token refresh logic
          // For now, clear tokens and reject
          await tokenManager.clearTokens();
        }
      } catch (_) {
        await tokenManager.clearTokens();
      }
    }

    handler.next(err);
  }

  bool _isPublicEndpoint(String path) {
    const publicEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
    ];
    return publicEndpoints.any((e) => path.contains(e));
  }
}
