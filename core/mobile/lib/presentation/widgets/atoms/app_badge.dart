import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

/// Badge variants for different visual styles.
enum AppBadgeVariant {
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

  /// Neutral/gray state
  neutral,
}

/// Badge sizes.
enum AppBadgeSize {
  /// Small badge (compact)
  small,

  /// Medium badge (default)
  medium,
}

/// A badge widget for notifications, status indicators, and labels.
///
/// This is an atom-level widget that provides consistent badge styling
/// across the application.
///
/// Example:
/// ```dart
/// AppBadge(
///   label: 'New',
///   variant: AppBadgeVariant.success,
/// )
/// ```
class AppBadge extends StatelessWidget {
  /// The text label displayed in the badge. Can be null for dot badges.
  final String? label;

  /// The visual variant of the badge.
  final AppBadgeVariant variant;

  /// The size of the badge.
  final AppBadgeSize size;

  /// Whether to render as a dot (no label, circular).
  final bool isDot;

  /// Optional leading icon.
  final IconData? icon;

  const AppBadge({
    super.key,
    this.label,
    this.variant = AppBadgeVariant.primary,
    this.size = AppBadgeSize.medium,
    this.isDot = false,
    this.icon,
  });

  /// Creates a dot badge (typically for notification indicators).
  const AppBadge.dot({
    super.key,
    this.variant = AppBadgeVariant.error,
  })  : label = null,
        size = AppBadgeSize.small,
        isDot = true,
        icon = null;

  /// Creates a notification count badge.
  factory AppBadge.count(
    int count, {
    Key? key,
    AppBadgeVariant variant = AppBadgeVariant.error,
    int maxCount = 99,
  }) {
    final displayText = count > maxCount ? '$maxCount+' : '$count';
    return AppBadge(
      key: key,
      label: displayText,
      variant: variant,
      size: AppBadgeSize.small,
    );
  }

  /// Creates a status badge with an icon.
  const AppBadge.status(
    this.label, {
    super.key,
    this.variant = AppBadgeVariant.neutral,
    this.icon,
  })  : size = AppBadgeSize.medium,
        isDot = false;

  @override
  Widget build(BuildContext context) {
    if (isDot) {
      return Container(
        width: 8,
        height: 8,
        decoration: BoxDecoration(
          color: _getBackgroundColor(),
          shape: BoxShape.circle,
        ),
      );
    }

    return Container(
      padding: _getPadding(),
      decoration: BoxDecoration(
        color: _getBackgroundColor(),
        borderRadius: AppSpacing.borderRadiusFull,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(
              icon,
              size: _getIconSize(),
              color: _getTextColor(),
            ),
            if (label != null) SizedBox(width: size == AppBadgeSize.small ? 2 : 4),
          ],
          if (label != null)
            Text(
              label!,
              style: TextStyle(
                fontSize: _getFontSize(),
                fontWeight: FontWeight.w500,
                color: _getTextColor(),
                height: 1,
              ),
            ),
        ],
      ),
    );
  }

  EdgeInsets _getPadding() {
    switch (size) {
      case AppBadgeSize.small:
        return const EdgeInsets.symmetric(horizontal: 6, vertical: 2);
      case AppBadgeSize.medium:
        return const EdgeInsets.symmetric(horizontal: 8, vertical: 4);
    }
  }

  double _getFontSize() {
    switch (size) {
      case AppBadgeSize.small:
        return 10;
      case AppBadgeSize.medium:
        return 12;
    }
  }

  double _getIconSize() {
    switch (size) {
      case AppBadgeSize.small:
        return 10;
      case AppBadgeSize.medium:
        return 12;
    }
  }

  Color _getBackgroundColor() {
    switch (variant) {
      case AppBadgeVariant.primary:
        return AppColors.primary;
      case AppBadgeVariant.secondary:
        return AppColors.secondary;
      case AppBadgeVariant.success:
        return AppColors.success;
      case AppBadgeVariant.warning:
        return AppColors.warning;
      case AppBadgeVariant.error:
        return AppColors.error;
      case AppBadgeVariant.info:
        return AppColors.info;
      case AppBadgeVariant.neutral:
        return AppColors.border;
    }
  }

  Color _getTextColor() {
    switch (variant) {
      case AppBadgeVariant.neutral:
        return AppColors.textSecondary;
      default:
        return AppColors.white;
    }
  }
}
