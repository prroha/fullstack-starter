import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../providers/auth_provider.dart';
import '../../router/routes.dart';
import '../../widgets/atoms/app_button.dart';
import '../../widgets/molecules/app_snackbar.dart';
import '../../widgets/molecules/app_text_field.dart';

/// Password strength levels
enum PasswordStrength { weak, fair, good, strong }

/// Registration screen with form validation
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  PasswordStrength _passwordStrength = PasswordStrength.weak;

  @override
  void initState() {
    super.initState();
    _passwordController.addListener(_updatePasswordStrength);
  }

  @override
  void dispose() {
    _passwordController.removeListener(_updatePasswordStrength);
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _updatePasswordStrength() {
    final password = _passwordController.text;
    setState(() {
      _passwordStrength = _calculatePasswordStrength(password);
    });
  }

  PasswordStrength _calculatePasswordStrength(String password) {
    if (password.isEmpty) return PasswordStrength.weak;

    int score = 0;

    // Length checks
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Character type checks
    if (RegExp(r'[a-z]').hasMatch(password)) score++;
    if (RegExp(r'[A-Z]').hasMatch(password)) score++;
    if (RegExp(r'[0-9]').hasMatch(password)) score++;
    if (RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(password)) score++;

    if (score <= 2) return PasswordStrength.weak;
    if (score <= 4) return PasswordStrength.fair;
    if (score <= 5) return PasswordStrength.good;
    return PasswordStrength.strong;
  }

  Color _getStrengthColor(PasswordStrength strength) {
    switch (strength) {
      case PasswordStrength.weak:
        return Colors.red;
      case PasswordStrength.fair:
        return Colors.orange;
      case PasswordStrength.good:
        return Colors.yellow.shade700;
      case PasswordStrength.strong:
        return Colors.green;
    }
  }

  String _getStrengthLabel(PasswordStrength strength) {
    switch (strength) {
      case PasswordStrength.weak:
        return 'Weak';
      case PasswordStrength.fair:
        return 'Fair';
      case PasswordStrength.good:
        return 'Good';
      case PasswordStrength.strong:
        return 'Strong';
    }
  }

  double _getStrengthProgress(PasswordStrength strength) {
    switch (strength) {
      case PasswordStrength.weak:
        return 0.25;
      case PasswordStrength.fair:
        return 0.5;
      case PasswordStrength.good:
        return 0.75;
      case PasswordStrength.strong:
        return 1.0;
    }
  }

  String? _validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    // RFC 5322 compliant email regex pattern
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9.!#$%&*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?)+$',
    );
    if (!emailRegex.hasMatch(value)) {
      return 'Please enter a valid email';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    // Additional strength requirements
    if (!RegExp(r'[a-zA-Z]').hasMatch(value)) {
      return 'Password must contain at least one letter';
    }
    if (!RegExp(r'[0-9]').hasMatch(value)) {
      return 'Password must contain at least one number';
    }
    return null;
  }

  String? _validateConfirmPassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please confirm your password';
    }
    if (value != _passwordController.text) {
      return 'Passwords do not match';
    }
    return null;
  }

  Future<void> _handleRegister() async {
    if (_formKey.currentState?.validate() ?? false) {
      final success = await ref.read(authProvider.notifier).register(
            _emailController.text.trim(),
            _passwordController.text,
            _confirmPasswordController.text,
          );
      if (mounted) {
        if (success) {
          AppSnackbar.success(
            context,
            'Account created!',
            description: 'Welcome aboard. You are now signed in.',
          );
          context.go(Routes.home);
        } else {
          // Error is already shown in the UI, but also show a snackbar
          final error = ref.read(authProvider).error;
          if (error != null) {
            AppSnackbar.error(
              context,
              'Registration failed',
              description: error,
            );
          }
        }
      }
    }
  }

  Widget _buildPasswordStrengthIndicator() {
    final password = _passwordController.text;
    if (password.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: _getStrengthProgress(_passwordStrength),
                  backgroundColor: Colors.grey.shade300,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    _getStrengthColor(_passwordStrength),
                  ),
                  minHeight: 4,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Text(
              _getStrengthLabel(_passwordStrength),
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: _getStrengthColor(_passwordStrength),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          'Use 8+ characters with uppercase, lowercase, numbers, and symbols',
          style: TextStyle(
            fontSize: 11,
            color: AppColors.textSecondary.withAlpha(180),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final errorMessage = authState.error;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: AppSpacing.screenPadding,
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AppSpacing.gapXl,
                // Header
                const Text(
                  'Create Account',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                  textAlign: TextAlign.center,
                ),
                AppSpacing.gapSm,
                const Text(
                  'Sign up to get started',
                  style: TextStyle(
                    fontSize: 16,
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                AppSpacing.gapXl,
                AppSpacing.gapMd,

                // Error message - using safe null access
                if (errorMessage != null && errorMessage.isNotEmpty) ...[
                  Container(
                    padding: AppSpacing.cardPadding,
                    decoration: BoxDecoration(
                      color: AppColors.error.withAlpha(25),
                      borderRadius: AppSpacing.borderRadiusMd,
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: AppColors.error),
                        AppSpacing.gapHSm,
                        Expanded(
                          child: Text(
                            errorMessage,
                            style: const TextStyle(color: AppColors.error),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: AppColors.error, size: 18),
                          onPressed: () => ref.read(authProvider.notifier).clearError(),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      ],
                    ),
                  ),
                  AppSpacing.gapMd,
                ],

                // Email field
                AppTextField(
                  controller: _emailController,
                  label: 'Email',
                  hint: 'Enter your email',
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  prefixIcon: const Icon(Icons.email_outlined),
                  validator: _validateEmail,
                  enabled: !authState.isLoading,
                ),
                AppSpacing.gapMd,

                // Password field with strength indicator
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AppTextField(
                      controller: _passwordController,
                      label: 'Password',
                      hint: 'Enter your password',
                      obscureText: _obscurePassword,
                      textInputAction: TextInputAction.next,
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,
                        ),
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                      ),
                      validator: _validatePassword,
                      enabled: !authState.isLoading,
                    ),
                    _buildPasswordStrengthIndicator(),
                  ],
                ),
                AppSpacing.gapMd,

                // Confirm password field
                AppTextField(
                  controller: _confirmPasswordController,
                  label: 'Confirm Password',
                  hint: 'Confirm your password',
                  obscureText: _obscureConfirmPassword,
                  textInputAction: TextInputAction.done,
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscureConfirmPassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscureConfirmPassword = !_obscureConfirmPassword;
                      });
                    },
                  ),
                  validator: _validateConfirmPassword,
                  enabled: !authState.isLoading,
                  onSubmitted: (_) => _handleRegister(),
                ),
                AppSpacing.gapLg,

                // Register button
                AppButton(
                  label: 'Create Account',
                  onPressed: authState.isLoading ? null : _handleRegister,
                  isLoading: authState.isLoading,
                  isFullWidth: true,
                ),
                AppSpacing.gapMd,

                // Login link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'Already have an account? ',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                    TextButton(
                      onPressed: authState.isLoading
                          ? null
                          : () => context.go(Routes.login),
                      child: const Text(
                        'Sign In',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
