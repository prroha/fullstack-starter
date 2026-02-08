import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

/// A styled text input field with label, hint, and error support.
///
/// This is a molecule-level widget that combines a label, text input,
/// and error message into a cohesive form field component.
///
/// Example:
/// ```dart
/// AppTextField(
///   controller: emailController,
///   label: 'Email',
///   hint: 'Enter your email',
///   keyboardType: TextInputType.emailAddress,
///   validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
/// )
/// ```
class AppTextField extends StatelessWidget {
  /// Controller for the text field.
  final TextEditingController? controller;

  /// Optional label displayed above the field.
  final String? label;

  /// Placeholder text displayed when the field is empty.
  final String? hint;

  /// Error text displayed below the field.
  final String? errorText;

  /// Whether to obscure the text (for passwords).
  final bool obscureText;

  /// The type of keyboard to display.
  final TextInputType keyboardType;

  /// The action button on the keyboard.
  final TextInputAction textInputAction;

  /// Called when the text changes.
  final ValueChanged<String>? onChanged;

  /// Called when the user submits the field.
  final ValueChanged<String>? onSubmitted;

  /// Validator for form validation.
  final FormFieldValidator<String>? validator;

  /// Widget displayed at the start of the field.
  final Widget? prefixIcon;

  /// Widget displayed at the end of the field.
  final Widget? suffixIcon;

  /// Whether the field is enabled.
  final bool enabled;

  /// Maximum number of lines for the field.
  final int maxLines;

  /// Whether to autofocus this field.
  final bool autofocus;

  /// Focus node for controlling focus.
  final FocusNode? focusNode;

  /// Initial value for the field.
  final String? initialValue;

  /// Maximum length of the input.
  final int? maxLength;

  /// Helper text displayed below the field.
  final String? helperText;

  const AppTextField({
    super.key,
    this.controller,
    this.label,
    this.hint,
    this.errorText,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.textInputAction = TextInputAction.next,
    this.onChanged,
    this.onSubmitted,
    this.validator,
    this.prefixIcon,
    this.suffixIcon,
    this.enabled = true,
    this.maxLines = 1,
    this.autofocus = false,
    this.focusNode,
    this.initialValue,
    this.maxLength,
    this.helperText,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(
            label!,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w500,
              fontSize: 13, // Tighter label
            ),
          ),
          const SizedBox(height: 4), // Tighter label-to-field spacing
        ],
        TextFormField(
          controller: controller,
          initialValue: initialValue,
          obscureText: obscureText,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          onChanged: onChanged,
          onFieldSubmitted: onSubmitted,
          validator: validator,
          enabled: enabled,
          maxLines: maxLines,
          maxLength: maxLength,
          autofocus: autofocus,
          focusNode: focusNode,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 15, // Slightly tighter text
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 15,
            ),
            errorText: errorText,
            helperText: helperText,
            helperStyle: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 11,
            ),
            prefixIcon: prefixIcon,
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: enabled ? AppColors.surface : AppColors.border.withAlpha(50),
            // Tighter content padding: 12h x 10v for compact inputs
            contentPadding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md, // 12dp
              vertical: 10,
            ),
            isDense: true, // Enable dense mode for tighter layout
            border: OutlineInputBorder(
              borderRadius: AppSpacing.borderRadiusSm, // Tighter radius
              borderSide: const BorderSide(color: AppColors.border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: AppSpacing.borderRadiusSm,
              borderSide: const BorderSide(color: AppColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: AppSpacing.borderRadiusSm,
              borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: AppSpacing.borderRadiusSm,
              borderSide: const BorderSide(color: AppColors.error),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: AppSpacing.borderRadiusSm,
              borderSide: const BorderSide(color: AppColors.error, width: 1.5),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: AppSpacing.borderRadiusSm,
              borderSide: const BorderSide(color: AppColors.border),
            ),
          ),
        ),
      ],
    );
  }
}
