'use client';

/**
 * Admin Stats Card Components
 *
 * This module re-exports the core StatCard component with admin-specific presets.
 * Use the core StatCard directly for most cases.
 *
 * @example
 * ```tsx
 * import { AdminStatsCard, AdminStatsGrid } from '@modules/admin-dashboard/web/src/components/admin-stats-card';
 *
 * <AdminStatsGrid>
 *   <AdminStatsCard
 *     title="Total Users"
 *     value={1234}
 *     trend="up"
 *     trendValue="+12%"
 *     icon={<UsersIcon />}
 *   />
 * </AdminStatsGrid>
 * ```
 */

import { cn } from '@/lib/utils';
import { StatCard, StatCardSkeleton, type StatCardProps, type TrendDirection } from '@/components/ui/stat-card';

// =============================================================================
// Re-export core types for convenience
// =============================================================================

export type { TrendDirection };

// =============================================================================
// Admin Stats Card Props
// =============================================================================

export interface AdminStatsCardProps {
  /** Card title */
  title: string;
  /** Main value to display */
  value: number | string;
  /** Optional description text */
  description?: string;
  /** Trend direction for styling */
  trend?: TrendDirection;
  /** Trend percentage or value */
  trendValue?: string;
  /** Icon component to display */
  icon?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Loading state */
  loading?: boolean;
  /** Click handler */
  onClick?: () => void;
}

// =============================================================================
// Admin Stats Card Component
// =============================================================================

/**
 * AdminStatsCard - A wrapper around core StatCard with admin-specific styling.
 *
 * For new implementations, consider using the core StatCard directly:
 * `import { StatCard } from '@/components/ui/stat-card';`
 */
export function AdminStatsCard({
  title,
  value,
  description,
  trend,
  trendValue,
  icon,
  className,
  loading = false,
  onClick,
}: AdminStatsCardProps) {
  // Parse trendValue to change percentage if it's a percentage string
  const changeValue = trendValue
    ? parseFloat(trendValue.replace(/[+%]/g, ''))
    : undefined;

  return (
    <StatCard
      label={title}
      value={typeof value === 'number' ? value.toLocaleString() : value}
      change={changeValue}
      trend={trend}
      trendLabel={description}
      icon={icon}
      isLoading={loading}
      onClick={onClick}
      variant="info"
      className={className}
    />
  );
}

// =============================================================================
// Stats Grid Component
// =============================================================================

export interface AdminStatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function AdminStatsGrid({
  children,
  columns = 4,
  className,
}: AdminStatsGridProps) {
  const columnClasses = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4',
        columnClasses[columns],
        className
      )}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Re-export core components for advanced use cases
// =============================================================================

export { StatCard, StatCardSkeleton };
export type { StatCardProps };

// =============================================================================
// Default Export
// =============================================================================

export default AdminStatsCard;
