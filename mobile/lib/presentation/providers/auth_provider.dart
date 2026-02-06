import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/services/token_manager.dart';

/// Auth state class
class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final String? error;
  final String? userId;
  final String? email;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
    this.userId,
    this.email,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
    String? userId,
    String? email,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      userId: userId ?? this.userId,
      email: email ?? this.email,
    );
  }
}

/// Auth state notifier for managing authentication state
class AuthNotifier extends StateNotifier<AuthState> {
  final TokenManager _tokenManager;

  AuthNotifier(this._tokenManager) : super(const AuthState()) {
    _checkAuthStatus();
  }

  /// Check if user has valid tokens on app start
  Future<void> _checkAuthStatus() async {
    state = state.copyWith(isLoading: true);
    try {
      final hasTokens = await _tokenManager.hasValidTokens();
      state = state.copyWith(
        isAuthenticated: hasTokens,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isAuthenticated: false,
        isLoading: false,
      );
    }
  }

  /// Login with email and password
  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // TODO: Replace with actual API call
      // Simulating API call for demonstration
      await Future.delayed(const Duration(seconds: 1));

      // For demo purposes, accept any non-empty credentials
      if (email.isEmpty || password.isEmpty) {
        state = state.copyWith(
          isLoading: false,
          error: 'Email and password are required',
        );
        return false;
      }

      // Save mock tokens
      await _tokenManager.saveTokens(
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        userId: 'mock_user_id',
      );

      state = state.copyWith(
        isAuthenticated: true,
        isLoading: false,
        email: email,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }

  /// Register a new user
  Future<bool> register(String email, String password, String confirmPassword) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // TODO: Replace with actual API call
      // Simulating API call for demonstration
      await Future.delayed(const Duration(seconds: 1));

      // Basic validation
      if (email.isEmpty || password.isEmpty) {
        state = state.copyWith(
          isLoading: false,
          error: 'Email and password are required',
        );
        return false;
      }

      if (password != confirmPassword) {
        state = state.copyWith(
          isLoading: false,
          error: 'Passwords do not match',
        );
        return false;
      }

      if (password.length < 6) {
        state = state.copyWith(
          isLoading: false,
          error: 'Password must be at least 6 characters',
        );
        return false;
      }

      // Save mock tokens
      await _tokenManager.saveTokens(
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        userId: 'mock_user_id',
      );

      state = state.copyWith(
        isAuthenticated: true,
        isLoading: false,
        email: email,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }

  /// Logout the current user
  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    try {
      await _tokenManager.clearTokens();
      state = const AuthState(isAuthenticated: false, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Clear any error messages
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Auth provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final tokenManager = ref.watch(tokenManagerProvider);
  return AuthNotifier(tokenManager);
});
