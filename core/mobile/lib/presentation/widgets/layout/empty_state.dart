import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../atoms/app_button.dart';

/// An empty state widget with illustration, message, and optional action.
///
/// This is a layout-level widget for displaying empty states in lists,
/// search results, or other content areas.
///
/// Example:
/// ```dart
/// EmptyState(
///   icon: Icons.search_off,
///   title: 'No results found',
///   message: 'Try adjusting your search criteria',
///   actionLabel: 'Clear filters',
///   onAction: () => clearFilters(),
/// )
/// ```
class EmptyState extends StatelessWidget {
  /// The icon to display.
  final IconData icon;

  /// The title text.
  final String title;

  /// Optional description message.
  final String? message;

  /// Optional action button label.
  final String? actionLabel;

  /// Callback when the action button is pressed.
  final VoidCallback? onAction;

  /// Icon size.
  final double iconSize;

  /// Icon color.
  final Color? iconColor;

  /// Optional custom illustration widget.
  final Widget? illustration;

  /// Optional secondary action button label.
  final String? secondaryActionLabel;

  /// Callback for secondary action.
  final VoidCallback? onSecondaryAction;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.message,
    this.actionLabel,
    this.onAction,
    this.iconSize = 64,
    this.iconColor,
    this.illustration,
    this.secondaryActionLabel,
    this.onSecondaryAction,
  });

  /// Creates an empty state for no data scenarios.
  const EmptyState.noData({
    super.key,
    this.title = 'No data',
    this.message = 'There is nothing here yet',
    this.actionLabel,
    this.onAction,
  })  : icon = Icons.inbox_outlined,
        iconSize = 64,
        iconColor = null,
        illustration = null,
        secondaryActionLabel = null,
        onSecondaryAction = null;

  /// Creates an empty state for search results.
  const EmptyState.noResults({
    super.key,
    this.title = 'No results found',
    this.message = 'Try adjusting your search or filter criteria',
    this.actionLabel,
    this.onAction,
  })  : icon = Icons.search_off,
        iconSize = 64,
        iconColor = null,
        illustration = null,
        secondaryActionLabel = null,
        onSecondaryAction = null;

  /// Creates an empty state for network errors.
  const EmptyState.offline({
    super.key,
    this.title = 'No connection',
    this.message = 'Please check your internet connection',
    this.actionLabel = 'Retry',
    this.onAction,
  })  : icon = Icons.wifi_off,
        iconSize = 64,
        iconColor = null,
        illustration = null,
        secondaryActionLabel = null,
        onSecondaryAction = null;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: AppSpacing.screenPadding,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Illustration or icon
            if (illustration != null)
              illustration!
            else
              Icon(
                icon,
                size: iconSize,
                color: iconColor ?? AppColors.textMuted,
              ),
            AppSpacing.gapLg,

            // Title
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),

            // Message
            if (message != null) ...[
              AppSpacing.gapSm,
              Text(
                message!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
              ),
            ],

            // Actions
            if (actionLabel != null && onAction != null) ...[
              AppSpacing.gapLg,
              AppButton(
                label: actionLabel!,
                onPressed: onAction,
                variant: AppButtonVariant.primary,
              ),
            ],

            if (secondaryActionLabel != null && onSecondaryAction != null) ...[
              AppSpacing.gapSm,
              AppButton(
                label: secondaryActionLabel!,
                onPressed: onSecondaryAction,
                variant: AppButtonVariant.text,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
