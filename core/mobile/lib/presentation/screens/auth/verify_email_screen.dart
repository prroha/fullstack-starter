import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../data/repositories/auth_repository.dart';
import '../../router/routes.dart';
import '../../widgets/atoms/app_button.dart';
import '../../widgets/molecules/app_snackbar.dart';

/// Email verification screen that verifies a token from deep link
class VerifyEmailScreen extends ConsumerStatefulWidget {
  final String? token;

  const VerifyEmailScreen({
    super.key,
    this.token,
  });

  @override
  ConsumerState<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends ConsumerState<VerifyEmailScreen> {
  bool _isVerifying = true;
  bool _isSuccess = false;
  String? _error;
  String? _verifiedEmail;

  @override
  void initState() {
    super.initState();
    _verifyEmail();
  }

  Future<void> _verifyEmail() async {
    if (widget.token == null || widget.token!.isEmpty) {
      setState(() {
        _isVerifying = false;
        _error = 'No verification token provided';
      });
      return;
    }

    final authRepository = ref.read(authRepositoryProvider);
    final result = await authRepository.verifyEmail(widget.token!);

    result.fold(
      (failure) {
        setState(() {
          _isVerifying = false;
          _error = failure.message;
        });
      },
      (response) {
        setState(() {
          _isVerifying = false;
          _isSuccess = response.verified;
          _verifiedEmail = response.email;
        });

        if (response.verified && mounted) {
          AppSnackbar.success(
            context,
            'Email verified!',
            description: 'Your email has been verified successfully.',
          );

          // Navigate to home after a delay
          Future.delayed(const Duration(seconds: 3), () {
            if (mounted) {
              context.go(Routes.home);
            }
          });
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: Center(
            child: _buildContent(),
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_isVerifying) {
      return _buildLoadingState();
    }

    if (_isSuccess) {
      return _buildSuccessState();
    }

    return _buildErrorState();
  }

  Widget _buildLoadingState() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: AppColors.primary.withAlpha(25),
            borderRadius: BorderRadius.circular(32),
          ),
          child: const Center(
            child: SizedBox(
              width: 32,
              height: 32,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
              ),
            ),
          ),
        ),
        AppSpacing.gapLg,
        const Text(
          'Verifying your email...',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
          textAlign: TextAlign.center,
        ),
        AppSpacing.gapSm,
        const Text(
          'Please wait while we verify your email address.',
          style: TextStyle(
            fontSize: 16,
            color: AppColors.textSecondary,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildSuccessState() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: AppColors.success.withAlpha(25),
            borderRadius: BorderRadius.circular(32),
          ),
          child: const Icon(
            Icons.check_circle_outline,
            color: AppColors.success,
            size: 32,
          ),
        ),
        AppSpacing.gapLg,
        const Text(
          'Email verified!',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
          textAlign: TextAlign.center,
        ),
        AppSpacing.gapSm,
        Text(
          _verifiedEmail != null
              ? 'Your email $_verifiedEmail has been verified successfully.'
              : 'Your email has been verified successfully.',
          style: const TextStyle(
            fontSize: 16,
            color: AppColors.textSecondary,
          ),
          textAlign: TextAlign.center,
        ),
        AppSpacing.gapSm,
        const Text(
          'Redirecting you to the dashboard...',
          style: TextStyle(
            fontSize: 14,
            color: AppColors.textSecondary,
          ),
          textAlign: TextAlign.center,
        ),
        AppSpacing.gapXl,
        TextButton(
          onPressed: () => context.go(Routes.home),
          child: const Text(
            'Go to dashboard now',
            style: TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildErrorState() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: AppColors.error.withAlpha(25),
            borderRadius: BorderRadius.circular(32),
          ),
          child: const Icon(
            Icons.error_outline,
            color: AppColors.error,
            size: 32,
          ),
        ),
        AppSpacing.gapLg,
        const Text(
          'Verification failed',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
          textAlign: TextAlign.center,
        ),
        AppSpacing.gapSm,
        Text(
          _error ?? 'Unable to verify your email. The link may be invalid or expired.',
          style: const TextStyle(
            fontSize: 16,
            color: AppColors.textSecondary,
          ),
          textAlign: TextAlign.center,
        ),
        AppSpacing.gapXl,
        AppButton(
          label: 'Go to sign in',
          onPressed: () => context.go(Routes.login),
          isFullWidth: true,
        ),
        AppSpacing.gapMd,
        Text(
          'Need a new verification link? Sign in and request a new one.',
          style: TextStyle(
            fontSize: 14,
            color: AppColors.textSecondary.withAlpha(180),
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
