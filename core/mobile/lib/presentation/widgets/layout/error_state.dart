import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../atoms/app_button.dart';

/// An error state widget with retry functionality.
///
/// This is a layout-level widget for displaying error states with
/// optional retry action.
///
/// Example:
/// ```dart
/// ErrorState(
///   message: 'Failed to load data',
///   onRetry: () => refetch(),
/// )
/// ```
class ErrorState extends StatelessWidget {
  /// The error message to display.
  final String message;

  /// Callback when the retry button is pressed.
  final VoidCallback? onRetry;

  /// Label for the retry button.
  final String retryLabel;

  /// The icon to display.
  final IconData icon;

  /// Icon size.
  final double iconSize;

  /// Optional title text.
  final String? title;

  /// Optional secondary action label.
  final String? secondaryActionLabel;

  /// Callback for secondary action.
  final VoidCallback? onSecondaryAction;

  /// Optional custom illustration widget.
  final Widget? illustration;

  const ErrorState({
    super.key,
    required this.message,
    this.onRetry,
    this.retryLabel = 'Retry',
    this.icon = Icons.error_outline,
    this.iconSize = 64,
    this.title,
    this.secondaryActionLabel,
    this.onSecondaryAction,
    this.illustration,
  });

  /// Creates an error state for network errors.
  const ErrorState.network({
    super.key,
    this.message = 'Unable to connect. Please check your internet connection.',
    this.onRetry,
    this.retryLabel = 'Try again',
  })  : icon = Icons.wifi_off,
        iconSize = 64,
        title = 'Connection error',
        secondaryActionLabel = null,
        onSecondaryAction = null,
        illustration = null;

  /// Creates an error state for server errors.
  const ErrorState.server({
    super.key,
    this.message = 'Something went wrong on our end. Please try again later.',
    this.onRetry,
    this.retryLabel = 'Retry',
  })  : icon = Icons.cloud_off,
        iconSize = 64,
        title = 'Server error',
        secondaryActionLabel = null,
        onSecondaryAction = null,
        illustration = null;

  /// Creates an error state for permission errors.
  const ErrorState.permission({
    super.key,
    this.message = 'You do not have permission to access this resource.',
    this.onRetry,
    this.retryLabel = 'Go back',
  })  : icon = Icons.lock_outline,
        iconSize = 64,
        title = 'Access denied',
        secondaryActionLabel = null,
        onSecondaryAction = null,
        illustration = null;

  /// Creates an error state for not found errors.
  const ErrorState.notFound({
    super.key,
    this.message = 'The requested resource could not be found.',
    this.onRetry,
    this.retryLabel = 'Go back',
  })  : icon = Icons.find_in_page_outlined,
        iconSize = 64,
        title = 'Not found',
        secondaryActionLabel = null,
        onSecondaryAction = null,
        illustration = null;

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
                color: AppColors.error,
              ),
            AppSpacing.gapLg,

            // Title
            if (title != null) ...[
              Text(
                title!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              AppSpacing.gapSm,
            ],

            // Message
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 16,
                height: 1.5,
              ),
            ),

            // Retry button
            if (onRetry != null) ...[
              AppSpacing.gapLg,
              AppButton(
                label: retryLabel,
                onPressed: onRetry,
                variant: AppButtonVariant.outline,
                icon: Icons.refresh,
              ),
            ],

            // Secondary action
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

/// Full screen error widget.
///
/// Example:
/// ```dart
/// ErrorScreen(
///   message: 'Something went wrong',
///   onRetry: () => refetch(),
/// )
/// ```
class ErrorScreen extends StatelessWidget {
  /// The error message to display.
  final String message;

  /// Callback when the retry button is pressed.
  final VoidCallback? onRetry;

  /// Label for the retry button.
  final String retryLabel;

  /// Optional title text.
  final String? title;

  /// The icon to display.
  final IconData icon;

  /// Background color.
  final Color? backgroundColor;

  const ErrorScreen({
    super.key,
    required this.message,
    this.onRetry,
    this.retryLabel = 'Retry',
    this.title,
    this.icon = Icons.error_outline,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor ?? AppColors.background,
      body: ErrorState(
        message: message,
        onRetry: onRetry,
        retryLabel: retryLabel,
        title: title,
        icon: icon,
      ),
    );
  }
}
