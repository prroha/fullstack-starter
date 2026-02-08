import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

/// A password text field with show/hide toggle functionality.
///
/// This is a molecule-level widget that combines a text field with
/// password-specific UI elements like visibility toggle.
///
/// Example:
/// ```dart
/// PasswordField(
///   controller: passwordController,
///   label: 'Password',
///   hint: 'Enter your password',
///   validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
/// )
/// ```
class PasswordField extends StatefulWidget {
  /// Controller for the password field.
  final TextEditingController? controller;

  /// Optional label displayed above the field.
  final String? label;

  /// Placeholder text.
  final String? hint;

  /// Error text displayed below the field.
  final String? errorText;

  /// The action button on the keyboard.
  final TextInputAction textInputAction;

  /// Called when the text changes.
  final ValueChanged<String>? onChanged;

  /// Called when the user submits the field.
  final ValueChanged<String>? onSubmitted;

  /// Validator for form validation.
  final FormFieldValidator<String>? validator;

  /// Whether the field is enabled.
  final bool enabled;

  /// Whether to autofocus this field.
  final bool autofocus;

  /// Focus node for controlling focus.
  final FocusNode? focusNode;

  /// Optional prefix icon.
  final IconData? prefixIcon;

  /// Helper text displayed below the field.
  final String? helperText;

  const PasswordField({
    super.key,
    this.controller,
    this.label,
    this.hint,
    this.errorText,
    this.textInputAction = TextInputAction.done,
    this.onChanged,
    this.onSubmitted,
    this.validator,
    this.enabled = true,
    this.autofocus = false,
    this.focusNode,
    this.prefixIcon = Icons.lock_outline,
    this.helperText,
  });

  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool _obscureText = true;

  void _toggleVisibility() {
    setState(() {
      _obscureText = !_obscureText;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Text(
            widget.label!,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w500,
              fontSize: 13, // Tighter label
            ),
          ),
          const SizedBox(height: 4), // Tighter label-to-field spacing
        ],
        TextFormField(
          controller: widget.controller,
          obscureText: _obscureText,
          keyboardType: TextInputType.visiblePassword,
          textInputAction: widget.textInputAction,
          onChanged: widget.onChanged,
          onFieldSubmitted: widget.onSubmitted,
          validator: widget.validator,
          enabled: widget.enabled,
          autofocus: widget.autofocus,
          focusNode: widget.focusNode,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 15, // Tighter text
          ),
          decoration: InputDecoration(
            hintText: widget.hint,
            hintStyle: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 15,
            ),
            errorText: widget.errorText,
            helperText: widget.helperText,
            helperStyle: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 11,
            ),
            prefixIcon: widget.prefixIcon != null
                ? Icon(widget.prefixIcon, size: 20)
                : null,
            suffixIcon: IconButton(
              icon: Icon(
                _obscureText
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined,
                color: AppColors.textMuted,
                size: 20,
              ),
              onPressed: _toggleVisibility,
            ),
            filled: true,
            fillColor: widget.enabled
                ? AppColors.surface
                : AppColors.border.withAlpha(50),
            // Tighter content padding: 12h x 10v
            contentPadding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md, // 12dp
              vertical: 10,
            ),
            isDense: true,
            border: OutlineInputBorder(
              borderRadius: AppSpacing.borderRadiusSm,
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
