import { cn } from "@/lib/utils";

// =====================================================
// TableSkeleton Component
// Reusable loading skeleton for admin data tables
// =====================================================

interface TableSkeletonProps {
  /** Number of columns in the table */
  columns: number;
  /** Number of data rows to display */
  rows: number;
  /** Whether to show the header row (default: true) */
  showHeader?: boolean;
  /** Whether to show the filter bar above the table (default: false) */
  showFilters?: boolean;
  /** Custom column widths as Tailwind width classes */
  columnWidths?: string[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Loading skeleton for admin data tables.
 * Matches the existing table layout structure with header row and data rows.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <TableSkeleton columns={6} rows={5} />
 *
 * // With filters and header
 * <TableSkeleton columns={6} rows={5} showHeader showFilters />
 *
 * // Custom column widths
 * <TableSkeleton
 *   columns={4}
 *   rows={5}
 *   columnWidths={["w-32", "w-48", "w-24", "w-20"]}
 * />
 * ```
 */
export function TableSkeleton({
  columns,
  rows,
  showHeader = true,
  showFilters = false,
  columnWidths,
  className,
}: TableSkeletonProps) {
  // Get width class for a column, with fallback to flex-1
  const getColumnWidth = (index: number): string => {
    if (columnWidths && columnWidths[index]) {
      return columnWidths[index];
    }
    // Default widths based on column position
    if (index === 0) return "w-32";
    if (index === columns - 1) return "w-20";
    return "flex-1";
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter bar skeleton */}
      {showFilters && (
        <div className="flex flex-wrap gap-4">
          {/* Search input */}
          <div className="h-10 bg-muted rounded-lg w-64 animate-pulse" />
          {/* Filter dropdowns */}
          <div className="h-10 bg-muted rounded-lg w-36 animate-pulse" />
          <div className="h-10 bg-muted rounded-lg w-36 animate-pulse" />
        </div>
      )}

      {/* Table container */}
      <div className="bg-background rounded-lg border overflow-hidden">
        {/* Header row */}
        {showHeader && (
          <div className="bg-muted/50 px-4 py-3 border-b">
            <div className="flex items-center gap-4">
              {Array.from({ length: columns }).map((_, i) => (
                <div
                  key={`header-${i}`}
                  className={cn(
                    "h-4 bg-muted rounded animate-pulse",
                    getColumnWidth(i)
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Data rows */}
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={`row-${rowIndex}`} className="px-4 py-4">
              <div className="flex items-center gap-4">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <div
                    key={`cell-${rowIndex}-${colIndex}`}
                    className={cn(
                      "h-4 bg-muted rounded animate-pulse",
                      getColumnWidth(colIndex)
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// AdminTableSkeleton Component
// Full-page skeleton for admin table pages including
// header, stats, filters, and table
// =====================================================

interface AdminTableSkeletonProps {
  /** Number of columns in the table */
  columns: number;
  /** Number of data rows to display */
  rows?: number;
  /** Number of stat cards to show (default: 4) */
  statsCount?: number;
  /** Whether to show stat cards (default: true) */
  showStats?: boolean;
  /** Whether to show the filter bar (default: true) */
  showFilters?: boolean;
  /** Number of filter dropdowns (default: 2) */
  filterCount?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Full-page loading skeleton for admin table pages.
 * Includes page header, stats row, filter bar, and data table.
 *
 * @example
 * ```tsx
 * // Basic usage - shows header, 4 stats, filters, and table
 * <AdminTableSkeleton columns={6} />
 *
 * // Customized
 * <AdminTableSkeleton
 *   columns={8}
 *   rows={10}
 *   statsCount={3}
 *   filterCount={3}
 * />
 * ```
 */
export function AdminTableSkeleton({
  columns,
  rows = 5,
  statsCount = 4,
  showStats = true,
  showFilters = true,
  filterCount = 2,
  className,
}: AdminTableSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-32 animate-pulse" />
          <div className="h-4 bg-muted rounded w-56 animate-pulse" />
        </div>
        <div className="h-10 bg-muted rounded w-28 animate-pulse" />
      </div>

      {/* Stats row skeleton */}
      {showStats && (
        <div className={cn(
          "grid gap-4",
          statsCount === 3 ? "md:grid-cols-3" :
          statsCount === 2 ? "md:grid-cols-2" :
          "md:grid-cols-4"
        )}>
          {Array.from({ length: statsCount }).map((_, i) => (
            <div
              key={`stat-${i}`}
              className="bg-background rounded-lg border p-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-20" />
                  <div className="h-6 bg-muted rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar skeleton */}
      {showFilters && (
        <div className="flex flex-wrap gap-4">
          <div className="h-10 bg-muted rounded-lg flex-1 max-w-sm animate-pulse" />
          {Array.from({ length: filterCount }).map((_, i) => (
            <div
              key={`filter-${i}`}
              className="h-10 bg-muted rounded-lg w-36 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Table skeleton */}
      <div className="bg-background rounded-lg border overflow-hidden">
        {/* Header row */}
        <div className="bg-muted/50 px-4 py-3 border-b">
          <div className="flex items-center gap-4">
            {Array.from({ length: columns }).map((_, i) => (
              <div
                key={`header-${i}`}
                className={cn(
                  "h-4 bg-muted rounded animate-pulse",
                  i === 0 ? "w-32" : i === columns - 1 ? "w-20" : "flex-1"
                )}
              />
            ))}
          </div>
        </div>

        {/* Data rows */}
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={`row-${rowIndex}`} className="px-4 py-4">
              <div className="flex items-center gap-4">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <div
                    key={`cell-${rowIndex}-${colIndex}`}
                    className={cn(
                      "h-4 bg-muted rounded animate-pulse",
                      colIndex === 0 ? "w-32" :
                      colIndex === columns - 1 ? "w-20" :
                      "flex-1"
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="h-4 bg-muted rounded w-48 animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded w-20 animate-pulse" />
            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
