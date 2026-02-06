'use client';

import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

export type TrendDirection = 'up' | 'down' | 'neutral';

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
// Trend Icon Component
// =============================================================================

function TrendIcon({ direction }: { direction: TrendDirection }) {
  if (direction === 'up') {
    return (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    );
  }

  if (direction === 'down') {
    return (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    );
  }

  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 12h14"
      />
    </svg>
  );
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function StatsCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-16 bg-gray-200 rounded" />
          <div className="h-3 w-32 bg-gray-200 rounded" />
        </div>
        <div className="h-10 w-10 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

// =============================================================================
// Stats Card Component
// =============================================================================

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
  if (loading) {
    return <StatsCardSkeleton className={className} />;
  }

  const trendColors: Record<TrendDirection, string> = {
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-gray-500 bg-gray-50',
  };

  const trendTextColors: Record<TrendDirection, string> = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500',
  };

  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all',
        isClickable && 'cursor-pointer hover:shadow-md hover:border-gray-300',
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>

          {(description || (trend && trendValue)) && (
            <div className="mt-2 flex items-center gap-2">
              {trend && trendValue && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                    trendColors[trend]
                  )}
                >
                  <TrendIcon direction={trend} />
                  {trendValue}
                </span>
              )}
              {description && (
                <span
                  className={cn(
                    'text-sm',
                    trend ? trendTextColors[trend] : 'text-gray-500'
                  )}
                >
                  {description}
                </span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">{icon}</div>
        )}
      </div>
    </div>
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
        'grid grid-cols-1 gap-6',
        columnClasses[columns],
        className
      )}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Default Export
// =============================================================================

export default AdminStatsCard;
