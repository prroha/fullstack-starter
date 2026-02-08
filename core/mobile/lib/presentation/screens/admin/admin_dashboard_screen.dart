import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../data/repositories/admin_repository.dart';
import '../../providers/admin_provider.dart';
import '../../router/routes.dart';
import '../../widgets/atoms/app_button.dart';
import '../../widgets/layout/error_state.dart';
import '../../widgets/layout/loading_overlay.dart';

/// Stats Card Widget
class StatsCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color? iconColor;

  const StatsCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: AppSpacing.cardContentPadding,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppSpacing.borderRadiusMd,
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withAlpha(13),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (iconColor ?? AppColors.primary).withAlpha(26),
                  borderRadius: AppSpacing.borderRadiusSm,
                ),
                child: Icon(
                  icon,
                  size: 20,
                  color: iconColor ?? AppColors.primary,
                ),
              ),
            ],
          ),
          AppSpacing.gapSm,
          Text(
            value,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

/// Signups Chart Widget
class SignupsChart extends StatelessWidget {
  final List<SignupByDay> data;

  const SignupsChart({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) return const SizedBox.shrink();

    final maxCount = data.map((d) => d.count).reduce((a, b) => a > b ? a : b);
    final effectiveMax = maxCount > 0 ? maxCount : 1;

    return Container(
      padding: AppSpacing.cardContentPadding,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppSpacing.borderRadiusMd,
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withAlpha(13),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Signups (Last 7 Days)',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          AppSpacing.gapMd,
          SizedBox(
            height: 150,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: data.map((day) {
                final height = (day.count / effectiveMax) * 120;
                final date = DateTime.parse(day.date);
                final dayLabel = _getDayLabel(date.weekday);

                return Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        '${day.count}',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      AppSpacing.gapXs,
                      Container(
                        height: height > 4 ? height : 4,
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(4),
                          ),
                        ),
                      ),
                      AppSpacing.gapXs,
                      Text(
                        dayLabel,
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  String _getDayLabel(int weekday) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[weekday - 1];
  }
}

/// Admin Dashboard Screen
class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() =>
      _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  @override
  void initState() {
    super.initState();
    // Load stats when screen is mounted
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(adminDashboardProvider.notifier).loadStats();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(adminDashboardProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        centerTitle: true,
        backgroundColor: AppColors.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.read(adminDashboardProvider.notifier).loadStats();
            },
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: LoadingOverlay(
        isLoading: state.isLoading,
        child: state.error != null
            ? ErrorStateWidget(
                message: state.error!,
                onRetry: () {
                  ref.read(adminDashboardProvider.notifier).loadStats();
                },
              )
            : state.stats == null
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: () async {
                      await ref
                          .read(adminDashboardProvider.notifier)
                          .loadStats();
                    },
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: AppSpacing.screenPadding,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Title
                          const Text(
                            'Overview',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          AppSpacing.gapMd,

                          // Stats Grid
                          GridView.count(
                            crossAxisCount: 2,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            mainAxisSpacing: 16,
                            crossAxisSpacing: 16,
                            childAspectRatio: 1.3,
                            children: [
                              StatsCard(
                                title: 'Total Users',
                                value: '${state.stats!.totalUsers}',
                                icon: Icons.people,
                              ),
                              StatsCard(
                                title: 'Active Users',
                                value: '${state.stats!.activeUsers}',
                                icon: Icons.check_circle,
                                iconColor: AppColors.success,
                              ),
                              StatsCard(
                                title: 'Inactive',
                                value: '${state.stats!.inactiveUsers}',
                                icon: Icons.cancel,
                                iconColor: AppColors.error,
                              ),
                              StatsCard(
                                title: 'Recent Signups',
                                value: '${state.stats!.recentSignups}',
                                icon: Icons.person_add,
                                iconColor: AppColors.info,
                              ),
                            ],
                          ),

                          AppSpacing.gapLg,

                          // Chart
                          SignupsChart(data: state.stats!.signupsByDay),

                          AppSpacing.gapLg,

                          // Manage Users Button
                          AppButton(
                            label: 'Manage Users',
                            onPressed: () {
                              context.push(Routes.adminUsers);
                            },
                            variant: AppButtonVariant.primary,
                            isFullWidth: true,
                            icon: Icons.people,
                          ),

                          AppSpacing.gapMd,

                          // Audit Logs Button
                          AppButton(
                            label: 'Audit Logs',
                            onPressed: () {
                              context.push(Routes.adminAuditLogs);
                            },
                            variant: AppButtonVariant.secondary,
                            isFullWidth: true,
                            icon: Icons.history,
                          ),

                          AppSpacing.gapMd,

                          // Back Button
                          AppButton(
                            label: 'Back to Home',
                            onPressed: () {
                              context.go(Routes.home);
                            },
                            variant: AppButtonVariant.outline,
                            isFullWidth: true,
                            icon: Icons.home,
                          ),

                          AppSpacing.gapLg,
                        ],
                      ),
                    ),
                  ),
      ),
    );
  }
}
