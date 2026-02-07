import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

/// A menu item in the navigation drawer.
class AppDrawerItem {
  /// The icon displayed for the menu item.
  final IconData icon;

  /// The label displayed for the menu item.
  final String label;

  /// Route or callback identifier for the menu item.
  final String? route;

  /// Callback when the item is tapped.
  final VoidCallback? onTap;

  /// Whether this item is currently selected.
  final bool isSelected;

  /// Badge count to display.
  final int? badgeCount;

  const AppDrawerItem({
    required this.icon,
    required this.label,
    this.route,
    this.onTap,
    this.isSelected = false,
    this.badgeCount,
  });
}

/// A navigation drawer with menu items and optional header.
///
/// This is an organism-level widget that provides a consistent
/// navigation drawer layout.
///
/// Example:
/// ```dart
/// AppDrawer(
///   headerTitle: 'My App',
///   headerSubtitle: 'user@example.com',
///   items: [
///     AppDrawerItem(icon: Icons.home, label: 'Home', isSelected: true),
///     AppDrawerItem(icon: Icons.settings, label: 'Settings'),
///   ],
///   footerItems: [
///     AppDrawerItem(icon: Icons.logout, label: 'Logout'),
///   ],
/// )
/// ```
class AppDrawer extends StatelessWidget {
  /// Title displayed in the header.
  final String? headerTitle;

  /// Subtitle displayed in the header.
  final String? headerSubtitle;

  /// Avatar widget to display in the header.
  final Widget? headerAvatar;

  /// Custom header widget (replaces default header).
  final Widget? customHeader;

  /// Navigation menu items.
  final List<AppDrawerItem> items;

  /// Footer menu items (displayed at the bottom).
  final List<AppDrawerItem>? footerItems;

  /// Callback when a menu item is tapped.
  final void Function(AppDrawerItem item)? onItemTap;

  /// Width of the drawer.
  final double? width;

  const AppDrawer({
    super.key,
    this.headerTitle,
    this.headerSubtitle,
    this.headerAvatar,
    this.customHeader,
    required this.items,
    this.footerItems,
    this.onItemTap,
    this.width,
  });

  @override
  Widget build(BuildContext context) {
    return Drawer(
      width: width,
      backgroundColor: AppColors.surface,
      child: SafeArea(
        child: Column(
          children: [
            // Header
            if (customHeader != null)
              customHeader!
            else if (headerTitle != null || headerAvatar != null)
              _buildHeader(),

            // Main items
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                itemCount: items.length,
                itemBuilder: (context, index) =>
                    _buildMenuItem(context, items[index]),
              ),
            ),

            // Footer items
            if (footerItems != null && footerItems!.isNotEmpty) ...[
              const Divider(height: 1, color: AppColors.border),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                child: Column(
                  children: footerItems!
                      .map((item) => _buildMenuItem(context, item))
                      .toList(),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: AppSpacing.cardPadding,
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.border),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (headerAvatar != null) ...[
            headerAvatar!,
            AppSpacing.gapMd,
          ],
          if (headerTitle != null)
            Text(
              headerTitle!,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          if (headerSubtitle != null) ...[
            AppSpacing.gapXs,
            Text(
              headerSubtitle!,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMenuItem(BuildContext context, AppDrawerItem item) {
    return ListTile(
      leading: Icon(
        item.icon,
        color: item.isSelected ? AppColors.primary : AppColors.textSecondary,
      ),
      title: Text(
        item.label,
        style: TextStyle(
          color: item.isSelected ? AppColors.primary : AppColors.textPrimary,
          fontWeight: item.isSelected ? FontWeight.w600 : FontWeight.normal,
        ),
      ),
      trailing: item.badgeCount != null && item.badgeCount! > 0
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.error,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                item.badgeCount! > 99 ? '99+' : '${item.badgeCount}',
                style: const TextStyle(
                  color: AppColors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            )
          : null,
      selected: item.isSelected,
      selectedTileColor: AppColors.primary.withAlpha(25),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs,
      ),
      onTap: () {
        item.onTap?.call();
        onItemTap?.call(item);
        Navigator.of(context).pop();
      },
    );
  }
}
