import 'package:flutter/material.dart';
import '../../../core/theme/app_spacing.dart';

/// A settings tile with a switch toggle.
class SettingsTile extends StatelessWidget {
  /// Icon to display on the left
  final IconData? icon;

  /// Main label text
  final String label;

  /// Secondary description text
  final String? description;

  /// Current toggle value
  final bool value;

  /// Callback when the toggle changes
  final ValueChanged<bool>? onChanged;

  /// Whether the tile is disabled
  final bool disabled;

  const SettingsTile({
    super.key,
    this.icon,
    required this.label,
    this.description,
    required this.value,
    this.onChanged,
    this.disabled = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final effectiveOpacity = disabled ? 0.5 : 1.0;

    return Opacity(
      opacity: effectiveOpacity,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: disabled ? null : () => onChanged?.call(!value),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.md,
            ),
            child: Row(
              children: [
                // Icon
                if (icon != null) ...[
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      icon,
                      size: 20,
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                ],

                // Label and description
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        style: theme.textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w500,
                          color: colorScheme.onSurface,
                        ),
                      ),
                      if (description != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          description!,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),

                // Switch
                const SizedBox(width: AppSpacing.sm),
                Switch(
                  value: value,
                  onChanged: disabled ? null : onChanged,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
