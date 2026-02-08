import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../data/repositories/auth_repository.dart';
import '../../router/routes.dart';
import '../../widgets/atoms/app_button.dart';
import '../../widgets/molecules/app_text_field.dart';

/// Reset password screen for setting a new password with a reset token
/// Note: Deep link handling is TODO - this screen expects a token query parameter
class ResetPasswordScreen extends ConsumerStatefulWidget {
  final String? token;

  const ResetPasswordScreen({super.key, this.token});

  @override
  ConsumerState<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isLoading = false;
  bool _isVerifying = true;
  bool _isValidToken = false;
  bool _success = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String? _tokenEmail;
  String? _error;

  @override
  void initState() {
    super.initState();
    _verifyToken();
  }

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _verifyToken() async {
    if (widget.token == null || widget.token!.isEmpty) {
      setState(() {
        _isVerifying = false;
        _isValidToken = false;
      });
      return;
    }

    final authRepo = ref.read(authRepositoryProvider);
    final result = await authRepo.verifyResetToken(widget.token!);

    if (!mounted) return;

    result.fold(
      (failure) {
        setState(() {
          _isVerifying = false;
          _isValidToken = false;
        });
      },
      (response) {
        setState(() {
          _isVerifying = false;
          _isValidToken = response.valid;
          _tokenEmail = response.email;
        });
      },
    );
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)').hasMatch(value)) {
      return 'Password must contain uppercase, lowercase, and a number';
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

  Future<void> _handleSubmit() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    final authRepo = ref.read(authRepositoryProvider);
    final result = await authRepo.resetPassword(
      token: widget.token!,
      password: _passwordController.text,
      confirmPassword: _confirmPasswordController.text,
    );

    if (!mounted) return;

    result.fold(
      (failure) {
        setState(() {
          _isLoading = false;
          _error = failure.message;
        });
      },
      (_) {
        setState(() {
          _isLoading = false;
          _success = true;
        });
        // Redirect to login after delay
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            context.go(Routes.login);
          }
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // Loading state
    if (_isVerifying) {
      return _buildLoadingView();
    }

    // Invalid or missing token
    if (!_isValidToken) {
      return _buildInvalidTokenView();
    }

    // Success state
    if (_success) {
      return _buildSuccessView();
    }

    // Reset form
    return _buildResetForm();
  }

  Widget _buildLoadingView() {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.neutral200,
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: CircularProgressIndicator(
                    strokeWidth: 3,
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                  ),
                ),
              ),
              AppSpacing.gapLg,
              const Text(
                'Verifying Reset Link...',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              AppSpacing.gapSm,
              const Text(
                'Please wait while we verify your request.',
                style: TextStyle(
                  fontSize: 16,
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInvalidTokenView() {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Error icon
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.error.withAlpha(25),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.warning_amber_rounded,
                  size: 40,
                  color: AppColors.error,
                ),
              ),
              AppSpacing.gapLg,

              // Error message
              const Text(
                'Invalid or Expired Link',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              AppSpacing.gapSm,
              const Text(
                'This password reset link is invalid or has expired. Please request a new one.',
                style: TextStyle(
                  fontSize: 16,
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              AppSpacing.gapXl,

              // Request new link button
              AppButton(
                label: 'Request New Reset Link',
                onPressed: () => context.go(Routes.forgotPassword),
                isFullWidth: true,
              ),
              AppSpacing.gapMd,

              // Back to login button
              AppButton(
                label: 'Back to Sign In',
                onPressed: () => context.go(Routes.login),
                variant: ButtonVariant.outline,
                isFullWidth: true,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSuccessView() {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Success icon
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.success.withAlpha(25),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle_outline,
                  size: 40,
                  color: AppColors.success,
                ),
              ),
              AppSpacing.gapLg,

              // Success message
              const Text(
                'Password Reset Successful!',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              AppSpacing.gapSm,
              const Text(
                'Your password has been reset. Redirecting you to sign in...',
                style: TextStyle(
                  fontSize: 16,
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              AppSpacing.gapXl,

              // Manual redirect link
              TextButton(
                onPressed: () => context.go(Routes.login),
                child: const Text(
                  'Click here if you\'re not redirected',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildResetForm() {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => context.go(Routes.login),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: AppSpacing.screenPadding,
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AppSpacing.gapMd,
                // Header
                const Text(
                  'Reset Your Password',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                  textAlign: TextAlign.center,
                ),
                AppSpacing.gapSm,
                Text(
                  _tokenEmail != null
                      ? 'Enter a new password for $_tokenEmail'
                      : 'Enter your new password below',
                  style: const TextStyle(
                    fontSize: 16,
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                AppSpacing.gapXl,
                AppSpacing.gapMd,

                // Error message
                if (_error != null && _error!.isNotEmpty) ...[
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
                            _error!,
                            style: const TextStyle(color: AppColors.error),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: AppColors.error, size: 18),
                          onPressed: () => setState(() => _error = null),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      ],
                    ),
                  ),
                  AppSpacing.gapMd,
                ],

                // Password field
                AppTextField(
                  controller: _passwordController,
                  label: 'New Password',
                  hint: 'Enter your new password',
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
                  enabled: !_isLoading,
                ),
                AppSpacing.gapSm,
                const Padding(
                  padding: EdgeInsets.only(left: 12),
                  child: Text(
                    'Must be at least 8 characters with uppercase, lowercase, and a number.',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
                AppSpacing.gapMd,

                // Confirm Password field
                AppTextField(
                  controller: _confirmPasswordController,
                  label: 'Confirm Password',
                  hint: 'Confirm your new password',
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
                  enabled: !_isLoading,
                  onSubmitted: (_) => _handleSubmit(),
                ),
                AppSpacing.gapLg,

                // Submit button
                AppButton(
                  label: 'Reset Password',
                  onPressed: _isLoading ? null : _handleSubmit,
                  isLoading: _isLoading,
                  isFullWidth: true,
                ),
                AppSpacing.gapMd,

                // Back to login link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'Remember your password? ',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                    TextButton(
                      onPressed: _isLoading ? null : () => context.go(Routes.login),
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
