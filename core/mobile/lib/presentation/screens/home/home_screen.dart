import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../providers/auth_provider.dart';
import '../../router/routes.dart';
import '../../widgets/atoms/app_button.dart';
import '../../widgets/molecules/app_snackbar.dart';
import '../../widgets/molecules/email_verification_banner.dart';
import '../../widgets/molecules/theme_toggle.dart';
import '../../widgets/notifications/notification_bell.dart';

/// Home screen with user info and logout functionality
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  Future<void> _handleLogout(BuildContext context, WidgetRef ref) async {
    // Show confirmation dialog
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text(
              'Logout',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );

    if (shouldLogout == true && context.mounted) {
      await ref.read(authProvider.notifier).logout();
      if (context.mounted) {
        AppSnackbar.info(
          context,
          'Logged out',
          description: 'You have been signed out successfully.',
        );
        context.go(Routes.login);
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
        centerTitle: true,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => context.push(Routes.search),
            tooltip: 'Search',
          ),
          const NotificationBell(),
          const ThemeToggle(variant: ThemeToggleVariant.icon),
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: () => context.go(Routes.profile),
            tooltip: 'Profile',
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.go(Routes.settings),
            tooltip: 'Settings',
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Email verification banner - shown when email is not verified
            if (!authState.isEmailVerified)
              EmailVerificationBanner(email: authState.email),

            Expanded(
              child: Padding(
                padding: AppSpacing.screenPadding,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    AppSpacing.gapLg,
                    // Welcome card
                    Container(
                      padding: AppSpacing.cardContentPadding,
                      decoration: BoxDecoration(
                        color: colorScheme.surface,
                        borderRadius: AppSpacing.borderRadiusMd,
                        boxShadow: [
                          BoxShadow(
                            color: colorScheme.shadow.withAlpha(20),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 40,
                            backgroundColor: colorScheme.primary,
                            child: Icon(
                              Icons.person,
                              size: 40,
                              color: colorScheme.onPrimary,
                            ),
                          ),
                          AppSpacing.gapMd,
                          Text(
                            'Welcome!',
                            style: theme.textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          AppSpacing.gapXs,
                          if (authState.email != null)
                            Text(
                              authState.email!,
                              style: theme.textTheme.bodyLarge?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                              ),
                            ),
                        ],
                      ),
                    ),
                    AppSpacing.gapXl,

                    // Info section
                    Text(
                      'You are successfully logged in.',
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                      textAlign: TextAlign.center,
                    ),

                    AppSpacing.gapLg,

                    // Profile button
                    AppButton(
                      label: 'View Profile',
                      onPressed: () => context.go(Routes.profile),
                      variant: AppButtonVariant.primary,
                      isFullWidth: true,
                      icon: Icons.person,
                    ),
                    AppSpacing.gapMd,

                    // Settings button
                    AppButton(
                      label: 'Settings',
                      onPressed: () => context.go(Routes.settings),
                      variant: AppButtonVariant.outline,
                      isFullWidth: true,
                      icon: Icons.settings,
                    ),

                    // Admin button - only visible for admin users
                    if (authState.isAdmin) ...[
                      AppSpacing.gapMd,
                      AppButton(
                        label: 'Admin Dashboard',
                        onPressed: () => context.push(Routes.adminDashboard),
                        variant: AppButtonVariant.secondary,
                        isFullWidth: true,
                        icon: Icons.admin_panel_settings,
                      ),
                    ],

                    const Spacer(),

                    // Logout button
                    AppButton(
                      label: 'Logout',
                      onPressed: () => _handleLogout(context, ref),
                      variant: AppButtonVariant.outline,
                      isFullWidth: true,
                      icon: Icons.logout,
                    ),
                    AppSpacing.gapMd,
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
