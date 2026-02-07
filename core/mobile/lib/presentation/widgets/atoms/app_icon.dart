import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

/// Icon size presets.
enum AppIconSize {
  /// Extra small icon (12px)
  xs,

  /// Small icon (16px)
  sm,

  /// Medium icon (24px) - default
  md,

  /// Large icon (32px)
  lg,

  /// Extra large icon (48px)
  xl,
}

/// Icon color presets.
enum AppIconColor {
  /// Primary brand color
  primary,

  /// Secondary brand color
  secondary,

  /// Success/positive state
  success,

  /// Warning state
  warning,

  /// Error/danger state
  error,

  /// Info state
  info,

  /// Primary text color
  textPrimary,

  /// Secondary/muted text color
  textSecondary,

  /// White color for dark backgrounds
  white,
}

/// A styled icon wrapper with size and color presets.
///
/// This is an atom-level widget that provides consistent icon styling
/// across the application.
///
/// Example:
/// ```dart
/// AppIcon(
///   Icons.home,
///   size: AppIconSize.lg,
///   color: AppIconColor.primary,
/// )
/// ```
class AppIcon extends StatelessWidget {
  /// The icon to display.
  final IconData icon;

  /// The size preset for the icon.
  final AppIconSize size;

  /// The color preset for the icon. If null, uses default icon color.
  final AppIconColor? colorPreset;

  /// Custom color that overrides the color preset.
  final Color? customColor;

  /// Semantic label for accessibility.
  final String? semanticLabel;

  const AppIcon(
    this.icon, {
    super.key,
    this.size = AppIconSize.md,
    this.colorPreset,
    this.customColor,
    this.semanticLabel,
  });

  /// Creates a primary colored icon.
  const AppIcon.primary(
    this.icon, {
    super.key,
    this.size = AppIconSize.md,
    this.semanticLabel,
  })  : colorPreset = AppIconColor.primary,
        customColor = null;

  /// Creates a success colored icon.
  const AppIcon.success(
    this.icon, {
    super.key,
    this.size = AppIconSize.md,
    this.semanticLabel,
  })  : colorPreset = AppIconColor.success,
        customColor = null;

  /// Creates an error colored icon.
  const AppIcon.error(
    this.icon, {
    super.key,
    this.size = AppIconSize.md,
    this.semanticLabel,
  })  : colorPreset = AppIconColor.error,
        customColor = null;

  /// Creates a warning colored icon.
  const AppIcon.warning(
    this.icon, {
    super.key,
    this.size = AppIconSize.md,
    this.semanticLabel,
  })  : colorPreset = AppIconColor.warning,
        customColor = null;

  @override
  Widget build(BuildContext context) {
    return Icon(
      icon,
      size: _getSize(),
      color: _getColor(),
      semanticLabel: semanticLabel,
    );
  }

  double _getSize() {
    switch (size) {
      case AppIconSize.xs:
        return 12;
      case AppIconSize.sm:
        return 16;
      case AppIconSize.md:
        return 24;
      case AppIconSize.lg:
        return 32;
      case AppIconSize.xl:
        return 48;
    }
  }

  Color? _getColor() {
    if (customColor != null) return customColor;
    if (colorPreset == null) return null;

    switch (colorPreset!) {
      case AppIconColor.primary:
        return AppColors.primary;
      case AppIconColor.secondary:
        return AppColors.secondary;
      case AppIconColor.success:
        return AppColors.success;
      case AppIconColor.warning:
        return AppColors.warning;
      case AppIconColor.error:
        return AppColors.error;
      case AppIconColor.info:
        return AppColors.info;
      case AppIconColor.textPrimary:
        return AppColors.textPrimary;
      case AppIconColor.textSecondary:
        return AppColors.textSecondary;
      case AppIconColor.white:
        return AppColors.white;
    }
  }
}
