import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

/// Button variants for different visual styles.
enum AppButtonVariant { primary, secondary, outline, text }

/// Button sizes for different use cases.
enum AppButtonSize { small, medium, large }

/// A styled button with multiple variants and states.
///
/// This is an atom-level widget that provides consistent button styling
/// across the application.
///
/// Example:
/// ```dart
/// AppButton(
///   label: 'Submit',
///   onPressed: () => handleSubmit(),
///   variant: AppButtonVariant.primary,
/// )
/// ```
class AppButton extends StatelessWidget {
  /// The text label displayed on the button.
  final String label;

  /// Called when the button is pressed. Set to null to disable the button.
  final VoidCallback? onPressed;

  /// The visual variant of the button.
  final AppButtonVariant variant;

  /// The size of the button.
  final AppButtonSize size;

  /// Whether to show a loading indicator instead of the label.
  final bool isLoading;

  /// Whether the button should take the full width of its parent.
  final bool isFullWidth;

  /// An optional icon to display before the label.
  final IconData? icon;

  /// An optional icon to display after the label.
  final IconData? trailingIcon;

  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.medium,
    this.isLoading = false,
    this.isFullWidth = false,
    this.icon,
    this.trailingIcon,
  });

  @override
  Widget build(BuildContext context) {
    final button = _buildButton();

    if (isFullWidth) {
      return SizedBox(width: double.infinity, child: button);
    }
    return button;
  }

  EdgeInsets get _padding {
    switch (size) {
      case AppButtonSize.small:
        // Compact padding for small buttons, maintains 36dp height minimum
        return const EdgeInsets.symmetric(horizontal: 10, vertical: 4);
      case AppButtonSize.medium:
        // Tighter padding: 14h x 10v gives ~44dp height with 14px text
        return const EdgeInsets.symmetric(horizontal: 14, vertical: 10);
      case AppButtonSize.large:
        // Slightly tighter large button padding
        return const EdgeInsets.symmetric(horizontal: 18, vertical: 12);
    }
  }

  double get _fontSize {
    switch (size) {
      case AppButtonSize.small:
        return 12;
      case AppButtonSize.medium:
        return 14;
      case AppButtonSize.large:
        return 16;
    }
  }

  double get _iconSize {
    switch (size) {
      case AppButtonSize.small:
        return 14;
      case AppButtonSize.medium:
        return 18;
      case AppButtonSize.large:
        return 20;
    }
  }

  Widget _buildButton() {
    switch (variant) {
      case AppButtonVariant.primary:
        return ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.textOnPrimary,
            padding: _padding,
            textStyle: TextStyle(fontSize: _fontSize),
            shape: RoundedRectangleBorder(
              borderRadius: AppSpacing.borderRadiusMd,
            ),
          ),
          child: _buildChild(),
        );
      case AppButtonVariant.secondary:
        return ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.secondary,
            foregroundColor: AppColors.textOnPrimary,
            padding: _padding,
            textStyle: TextStyle(fontSize: _fontSize),
            shape: RoundedRectangleBorder(
              borderRadius: AppSpacing.borderRadiusMd,
            ),
          ),
          child: _buildChild(),
        );
      case AppButtonVariant.outline:
        return OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.primary,
            side: const BorderSide(color: AppColors.primary),
            padding: _padding,
            textStyle: TextStyle(fontSize: _fontSize),
            shape: RoundedRectangleBorder(
              borderRadius: AppSpacing.borderRadiusMd,
            ),
          ),
          child: _buildChild(),
        );
      case AppButtonVariant.text:
        return TextButton(
          onPressed: isLoading ? null : onPressed,
          style: TextButton.styleFrom(
            foregroundColor: AppColors.primary,
            padding: _padding,
            textStyle: TextStyle(fontSize: _fontSize),
          ),
          child: _buildChild(),
        );
    }
  }

  Widget _buildChild() {
    if (isLoading) {
      return SizedBox(
        height: _iconSize,
        width: _iconSize,
        child: const CircularProgressIndicator(strokeWidth: 2),
      );
    }

    final hasLeadingIcon = icon != null;
    final hasTrailingIcon = trailingIcon != null;

    if (!hasLeadingIcon && !hasTrailingIcon) {
      return Text(label);
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (hasLeadingIcon) ...[
          Icon(icon, size: _iconSize),
          AppSpacing.gapHXs, // Tighter gap between icon and text
        ],
        Text(label),
        if (hasTrailingIcon) ...[
          AppSpacing.gapHXs, // Tighter gap between text and icon
          Icon(trailingIcon, size: _iconSize),
        ],
      ],
    );
  }
}
