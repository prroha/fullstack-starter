import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Theme mode options
enum AppThemeMode {
  system,
  light,
  dark,
}

/// Extension to convert between AppThemeMode and Flutter's ThemeMode
extension AppThemeModeExtension on AppThemeMode {
  ThemeMode toThemeMode() {
    switch (this) {
      case AppThemeMode.light:
        return ThemeMode.light;
      case AppThemeMode.dark:
        return ThemeMode.dark;
      case AppThemeMode.system:
        return ThemeMode.system;
    }
  }

  String get label {
    switch (this) {
      case AppThemeMode.light:
        return 'Light';
      case AppThemeMode.dark:
        return 'Dark';
      case AppThemeMode.system:
        return 'System';
    }
  }

  IconData get icon {
    switch (this) {
      case AppThemeMode.light:
        return Icons.light_mode;
      case AppThemeMode.dark:
        return Icons.dark_mode;
      case AppThemeMode.system:
        return Icons.settings_brightness;
    }
  }
}

/// Storage key for theme preference
const String _themeStorageKey = 'theme_mode';

/// Theme state class
class ThemeState {
  final AppThemeMode themeMode;
  final bool isLoading;

  const ThemeState({
    this.themeMode = AppThemeMode.system,
    this.isLoading = true,
  });

  ThemeState copyWith({
    AppThemeMode? themeMode,
    bool? isLoading,
  }) {
    return ThemeState(
      themeMode: themeMode ?? this.themeMode,
      isLoading: isLoading ?? this.isLoading,
    );
  }

  /// Get Flutter's ThemeMode
  ThemeMode get flutterThemeMode => themeMode.toThemeMode();
}

/// Theme notifier for managing theme state
class ThemeNotifier extends StateNotifier<ThemeState> {
  ThemeNotifier() : super(const ThemeState()) {
    _loadTheme();
  }

  /// Load theme from SharedPreferences
  Future<void> _loadTheme() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final storedTheme = prefs.getString(_themeStorageKey);

      AppThemeMode themeMode = AppThemeMode.system;
      if (storedTheme != null) {
        themeMode = AppThemeMode.values.firstWhere(
          (e) => e.name == storedTheme,
          orElse: () => AppThemeMode.system,
        );
      }

      state = ThemeState(themeMode: themeMode, isLoading: false);
    } catch (e) {
      state = const ThemeState(themeMode: AppThemeMode.system, isLoading: false);
    }
  }

  /// Set theme mode and persist to storage
  Future<void> setTheme(AppThemeMode mode) async {
    state = state.copyWith(themeMode: mode);

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_themeStorageKey, mode.name);
    } catch (e) {
      // Silently fail - theme is still applied in memory
    }
  }

  /// Toggle between light and dark mode (skips system)
  Future<void> toggleTheme(BuildContext context) async {
    final brightness = Theme.of(context).brightness;
    final isDark = brightness == Brightness.dark;
    await setTheme(isDark ? AppThemeMode.light : AppThemeMode.dark);
  }

  /// Cycle through all theme modes
  Future<void> cycleTheme() async {
    final modes = AppThemeMode.values;
    final currentIndex = modes.indexOf(state.themeMode);
    final nextIndex = (currentIndex + 1) % modes.length;
    await setTheme(modes[nextIndex]);
  }
}

/// Theme provider
final themeProvider = StateNotifierProvider<ThemeNotifier, ThemeState>((ref) {
  return ThemeNotifier();
});

/// Convenience provider to get the Flutter ThemeMode
final themeModeProvider = Provider<ThemeMode>((ref) {
  return ref.watch(themeProvider).flutterThemeMode;
});
