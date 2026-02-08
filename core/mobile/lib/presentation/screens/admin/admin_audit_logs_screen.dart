import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../data/repositories/admin_repository.dart';
import '../../providers/admin_provider.dart';
import '../../widgets/empty_states/empty_list.dart';
import '../../widgets/empty_states/empty_search.dart';
import '../../widgets/layout/error_state.dart';

/// Action badge colors
Color _getActionColor(AuditAction action) {
  switch (action) {
    case AuditAction.create:
    case AuditAction.login:
    case AuditAction.emailVerify:
    case AuditAction.adminAction:
      return AppColors.primary;
    case AuditAction.read:
    case AuditAction.logout:
      return AppColors.secondary;
    case AuditAction.update:
    case AuditAction.passwordChange:
    case AuditAction.passwordReset:
      return AppColors.warning;
    case AuditAction.delete:
    case AuditAction.loginFailed:
      return AppColors.error;
  }
}

/// Action Badge Widget
class ActionBadge extends StatelessWidget {
  final AuditAction action;

  const ActionBadge({super.key, required this.action});

  @override
  Widget build(BuildContext context) {
    final color = _getActionColor(action);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(26),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        action.displayName,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: color,
        ),
      ),
    );
  }
}

/// Audit Log List Item Widget
class AuditLogListItem extends StatelessWidget {
  final AuditLog log;
  final bool isExpanded;
  final VoidCallback onToggle;

  const AuditLogListItem({
    super.key,
    required this.log,
    required this.isExpanded,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM d, yyyy');
    final timeFormat = DateFormat('HH:mm');

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppSpacing.borderRadiusMd,
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withAlpha(10),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onToggle,
          borderRadius: AppSpacing.borderRadiusMd,
          child: Padding(
            padding: AppSpacing.cardContentPadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header row
                Row(
                  children: [
                    // Expand/Collapse icon
                    Icon(
                      isExpanded
                          ? Icons.keyboard_arrow_up
                          : Icons.keyboard_arrow_down,
                      color: AppColors.textSecondary,
                      size: 20,
                    ),
                    AppSpacing.gapHSm,
                    // Timestamp
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          dateFormat.format(log.createdAt),
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        Text(
                          timeFormat.format(log.createdAt),
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    AppSpacing.gapHMd,
                    // Action badge
                    ActionBadge(action: log.action),
                    const Spacer(),
                    // Entity
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          log.entity,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        if (log.entityId != null)
                          Text(
                            _truncateId(log.entityId!),
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
                // User info row
                AppSpacing.gapSm,
                Row(
                  children: [
                    const Icon(
                      Icons.person_outline,
                      size: 14,
                      color: AppColors.textSecondary,
                    ),
                    AppSpacing.gapHXs,
                    Expanded(
                      child: Text(
                        log.user != null
                            ? (log.user!.name ?? log.user!.email)
                            : 'System / Anonymous',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (log.ipAddress != null) ...[
                      const Icon(
                        Icons.language,
                        size: 14,
                        color: AppColors.textSecondary,
                      ),
                      AppSpacing.gapHXs,
                      Text(
                        log.ipAddress!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ],
                ),
                // Expanded details
                if (isExpanded) ...[
                  AppSpacing.gapMd,
                  const Divider(height: 1),
                  AppSpacing.gapMd,
                  _buildExpandedDetails(),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildExpandedDetails() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // User details
        if (log.user != null) ...[
          _buildDetailSection(
            'User Information',
            Icons.person_outline,
            [
              _buildDetailRow('ID', log.userId ?? 'N/A'),
              _buildDetailRow('Email', log.user!.email),
              _buildDetailRow('Name', log.user!.name ?? 'N/A'),
            ],
          ),
          AppSpacing.gapMd,
        ],
        // Request info
        _buildDetailSection(
          'Request Information',
          Icons.language,
          [
            _buildDetailRow('IP Address', log.ipAddress ?? 'N/A'),
            if (log.userAgent != null)
              _buildDetailRow('User Agent', log.userAgent!, wrap: true),
          ],
        ),
        // Changes
        if (log.changes != null && log.changes!.isNotEmpty) ...[
          AppSpacing.gapMd,
          _buildDetailSection(
            'Changes',
            Icons.edit_note,
            [_buildJsonBlock(log.changes!)],
          ),
        ],
        // Metadata
        if (log.metadata != null && log.metadata!.isNotEmpty) ...[
          AppSpacing.gapMd,
          _buildDetailSection(
            'Metadata',
            Icons.info_outline,
            [_buildJsonBlock(log.metadata!)],
          ),
        ],
      ],
    );
  }

  Widget _buildDetailSection(
    String title,
    IconData icon,
    List<Widget> children,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: AppColors.textSecondary),
            AppSpacing.gapHSm,
            Text(
              title,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
        AppSpacing.gapSm,
        Padding(
          padding: const EdgeInsets.only(left: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: children,
          ),
        ),
      ],
    );
  }

  Widget _buildDetailRow(String label, String value, {bool wrap = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: wrap
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$label:',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            )
          : Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$label: ',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                Expanded(
                  child: Text(
                    value,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildJsonBlock(Map<String, dynamic> json) {
    final entries = json.entries.toList();
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: entries.map((e) {
          return Text(
            '${e.key}: ${e.value}',
            style: const TextStyle(
              fontSize: 11,
              fontFamily: 'monospace',
              color: AppColors.textPrimary,
            ),
          );
        }).toList(),
      ),
    );
  }

  String _truncateId(String id) {
    if (id.length <= 12) return id;
    return '${id.substring(0, 8)}...';
  }
}

/// Filter Bottom Sheet
class FilterBottomSheet extends ConsumerStatefulWidget {
  final AdminAuditLogsState state;
  final AdminAuditLogsNotifier notifier;

  const FilterBottomSheet({
    super.key,
    required this.state,
    required this.notifier,
  });

  @override
  ConsumerState<FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends ConsumerState<FilterBottomSheet> {
  late AuditAction? _selectedAction;
  late String? _selectedEntity;
  late DateTime? _startDate;
  late DateTime? _endDate;

  @override
  void initState() {
    super.initState();
    _selectedAction = widget.state.actionFilter;
    _selectedEntity = widget.state.entityFilter;
    _startDate = widget.state.startDate;
    _endDate = widget.state.endDate;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Filters',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed: () {
                  setState(() {
                    _selectedAction = null;
                    _selectedEntity = null;
                    _startDate = null;
                    _endDate = null;
                  });
                },
                child: const Text('Clear All'),
              ),
            ],
          ),
          AppSpacing.gapMd,
          // Action filter
          const Text(
            'Action',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          AppSpacing.gapSm,
          DropdownButtonFormField<AuditAction?>(
            value: _selectedAction,
            decoration: InputDecoration(
              border: OutlineInputBorder(
                borderRadius: AppSpacing.borderRadiusSm,
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 8,
              ),
            ),
            items: [
              const DropdownMenuItem(value: null, child: Text('All Actions')),
              ...widget.state.availableActions.map(
                (action) => DropdownMenuItem(
                  value: action,
                  child: Text(action.displayName),
                ),
              ),
            ],
            onChanged: (value) {
              setState(() {
                _selectedAction = value;
              });
            },
          ),
          AppSpacing.gapMd,
          // Entity filter
          const Text(
            'Entity',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          AppSpacing.gapSm,
          DropdownButtonFormField<String?>(
            value: _selectedEntity,
            decoration: InputDecoration(
              border: OutlineInputBorder(
                borderRadius: AppSpacing.borderRadiusSm,
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 8,
              ),
            ),
            items: [
              const DropdownMenuItem(value: null, child: Text('All Entities')),
              ...widget.state.availableEntities.map(
                (entity) => DropdownMenuItem(
                  value: entity,
                  child: Text(entity),
                ),
              ),
            ],
            onChanged: (value) {
              setState(() {
                _selectedEntity = value;
              });
            },
          ),
          AppSpacing.gapMd,
          // Date range
          const Text(
            'Date Range',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          AppSpacing.gapSm,
          Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: () => _selectDate(context, true),
                  child: InputDecorator(
                    decoration: InputDecoration(
                      labelText: 'From',
                      border: OutlineInputBorder(
                        borderRadius: AppSpacing.borderRadiusSm,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                    ),
                    child: Text(
                      _startDate != null
                          ? DateFormat('MMM d, yyyy').format(_startDate!)
                          : 'Select',
                      style: TextStyle(
                        color: _startDate != null
                            ? AppColors.textPrimary
                            : AppColors.textSecondary,
                      ),
                    ),
                  ),
                ),
              ),
              AppSpacing.gapHMd,
              Expanded(
                child: InkWell(
                  onTap: () => _selectDate(context, false),
                  child: InputDecorator(
                    decoration: InputDecoration(
                      labelText: 'To',
                      border: OutlineInputBorder(
                        borderRadius: AppSpacing.borderRadiusSm,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                    ),
                    child: Text(
                      _endDate != null
                          ? DateFormat('MMM d, yyyy').format(_endDate!)
                          : 'Select',
                      style: TextStyle(
                        color: _endDate != null
                            ? AppColors.textPrimary
                            : AppColors.textSecondary,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          AppSpacing.gapLg,
          // Apply button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                widget.notifier.setActionFilter(_selectedAction);
                widget.notifier.setEntityFilter(_selectedEntity);
                widget.notifier.setDateRange(_startDate, _endDate);
                Navigator.of(context).pop();
              },
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: AppSpacing.borderRadiusSm,
                ),
              ),
              child: const Text('Apply Filters'),
            ),
          ),
          AppSpacing.gapMd,
        ],
      ),
    );
  }

  Future<void> _selectDate(BuildContext context, bool isStart) async {
    final initialDate = isStart
        ? (_startDate ?? DateTime.now())
        : (_endDate ?? DateTime.now());
    final firstDate = DateTime(2020);
    final lastDate = DateTime.now().add(const Duration(days: 1));

    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate,
      lastDate: lastDate,
    );

    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
        } else {
          _endDate = picked;
        }
      });
    }
  }
}

/// Admin Audit Logs Screen
class AdminAuditLogsScreen extends ConsumerStatefulWidget {
  const AdminAuditLogsScreen({super.key});

  @override
  ConsumerState<AdminAuditLogsScreen> createState() =>
      _AdminAuditLogsScreenState();
}

class _AdminAuditLogsScreenState extends ConsumerState<AdminAuditLogsScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(adminAuditLogsProvider.notifier).initialize();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showFilterSheet() {
    final state = ref.read(adminAuditLogsProvider);
    final notifier = ref.read(adminAuditLogsProvider.notifier);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: FilterBottomSheet(
          state: state,
          notifier: notifier,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(adminAuditLogsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Audit Logs'),
        centerTitle: true,
        backgroundColor: AppColors.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: Badge(
              isLabelVisible: state.hasActiveFilters,
              child: const Icon(Icons.filter_list),
            ),
            onPressed: _showFilterSheet,
            tooltip: 'Filters',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.read(adminAuditLogsProvider.notifier).loadLogs();
            },
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: Column(
        children: [
          // Search - with proper keyboard action and clear button visibility
          Container(
            color: AppColors.surface,
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by entity, IP, or user...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: AppSpacing.borderRadiusSm,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        tooltip: 'Clear search',
                        onPressed: () {
                          _searchController.clear();
                          ref
                              .read(adminAuditLogsProvider.notifier)
                              .setSearch('');
                        },
                      )
                    : null,
              ),
              onChanged: (value) {
                // Update UI to show/hide clear button
                setState(() {});
              },
              onSubmitted: (value) {
                ref.read(adminAuditLogsProvider.notifier).setSearch(value);
              },
              textInputAction: TextInputAction.search,
            ),
          ),
          // Active filters indicator
          if (state.hasActiveFilters)
            Container(
              color: AppColors.surface,
              padding: const EdgeInsets.only(left: 16, right: 16, bottom: 12),
              child: Row(
                children: [
                  const Icon(
                    Icons.filter_alt,
                    size: 16,
                    color: AppColors.primary,
                  ),
                  AppSpacing.gapHSm,
                  Text(
                    'Filters active',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.primary,
                    ),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: () {
                      _searchController.clear();
                      ref.read(adminAuditLogsProvider.notifier).clearFilters();
                    },
                    child: const Text('Clear'),
                  ),
                ],
              ),
            ),
          // Content
          Expanded(
            child: state.error != null
                ? ErrorStateWidget(
                    message: state.error!,
                    onRetry: () {
                      ref.read(adminAuditLogsProvider.notifier).loadLogs();
                    },
                  )
                : state.isLoading && state.logs.isEmpty
                    ? const Center(child: CircularProgressIndicator())
                    : state.logs.isEmpty
                        ? _buildEmptyState(state)
                        : RefreshIndicator(
                            onRefresh: () async {
                              await ref
                                  .read(adminAuditLogsProvider.notifier)
                                  .loadLogs();
                            },
                            child: ListView.builder(
                              padding: AppSpacing.screenPadding,
                              itemCount: state.logs.length + 1,
                              itemBuilder: (context, index) {
                                if (index == state.logs.length) {
                                  return _buildPagination(state);
                                }

                                final log = state.logs[index];
                                return AuditLogListItem(
                                  log: log,
                                  isExpanded: state.expandedLogId == log.id,
                                  onToggle: () {
                                    ref
                                        .read(adminAuditLogsProvider.notifier)
                                        .toggleExpandedLog(log.id);
                                  },
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(AdminAuditLogsState state) {
    if (state.hasActiveFilters) {
      return EmptySearch(
        searchQuery: state.search.isNotEmpty ? state.search : null,
        onClearSearch: () {
          _searchController.clear();
          ref.read(adminAuditLogsProvider.notifier).clearFilters();
        },
        clearLabel: 'Clear filters',
      );
    }

    return const EmptyList(
      icon: Icons.history,
      title: 'No audit logs',
      description:
          'System activity will be recorded here as users interact with the application.',
    );
  }

  Widget _buildPagination(AdminAuditLogsState state) {
    if (state.totalPages <= 1) return AppSpacing.gapMd;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        children: [
          Text(
            'Showing ${state.logs.length} of ${state.total} logs',
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
          AppSpacing.gapSm,
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                onPressed: state.hasPrev
                    ? () =>
                        ref.read(adminAuditLogsProvider.notifier).prevPage()
                    : null,
                icon: const Icon(Icons.chevron_left),
              ),
              AppSpacing.gapHMd,
              Text(
                'Page ${state.page} of ${state.totalPages}',
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
              ),
              AppSpacing.gapHMd,
              IconButton(
                onPressed: state.hasNext
                    ? () =>
                        ref.read(adminAuditLogsProvider.notifier).nextPage()
                    : null,
                icon: const Icon(Icons.chevron_right),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
