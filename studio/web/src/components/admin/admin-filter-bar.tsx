"use client";

import { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

/**
 * Filter configuration for a single filter field
 */
export interface FilterConfig {
  /** Filter type: search, select, or date */
  type: "search" | "select" | "date";
  /** Unique key for the filter value */
  key: string;
  /** Label for the filter (used for accessibility) */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Options for select type filters */
  options?: { value: string; label: string }[];
  /** Width class for the filter (e.g., "w-full", "sm:w-48") */
  width?: string;
}

/**
 * Props for the AdminFilterBar component
 */
export interface AdminFilterBarProps {
  /** Array of filter configurations */
  filters: FilterConfig[];
  /** Current filter values keyed by filter key */
  values: Record<string, string>;
  /** Callback when a filter value changes */
  onChange: (key: string, value: string) => void;
  /** Optional callback to reset all filters */
  onReset?: () => void;
  /** Whether any filters are currently active (shows reset button) */
  hasActiveFilters?: boolean;
  /** Additional children to render (e.g., custom filters) */
  children?: ReactNode;
  /** Additional className for the container */
  className?: string;
}

// =====================================================
// AdminFilterBar Component
// =====================================================

/**
 * A configurable filter bar for admin pages.
 *
 * Supports search inputs, select dropdowns, and date inputs.
 * Follows the existing AdminFilters pattern but with a schema-driven approach.
 *
 * @example
 * ```tsx
 * const filters: FilterConfig[] = [
 *   { type: 'search', key: 'search', label: 'Search', placeholder: 'Search...' },
 *   { type: 'select', key: 'status', label: 'Status', options: [...] },
 *   { type: 'date', key: 'from', label: 'From date' },
 *   { type: 'date', key: 'to', label: 'To date' },
 * ];
 *
 * <AdminFilterBar
 *   filters={filters}
 *   values={filterValues}
 *   onChange={(key, value) => setFilterValues(prev => ({ ...prev, [key]: value }))}
 *   onReset={() => setFilterValues(initialFilters)}
 *   hasActiveFilters={hasActiveFilters}
 * />
 * ```
 */
export function AdminFilterBar({
  filters,
  values,
  onChange,
  onReset,
  hasActiveFilters = false,
  children,
  className,
}: AdminFilterBarProps) {
  // Separate search filters from other filters for layout purposes
  const searchFilters = filters.filter((f) => f.type === "search");
  const otherFilters = filters.filter((f) => f.type !== "search");
  const dateFilters = filters.filter((f) => f.type === "date");
  const selectFilters = filters.filter((f) => f.type === "select");

  // Render a single filter based on its type
  const renderFilter = (filter: FilterConfig) => {
    const value = values[filter.key] ?? "";

    switch (filter.type) {
      case "search":
        return (
          <div
            key={filter.key}
            className={cn("relative", filter.width ?? "w-full sm:flex-1 sm:min-w-[240px]")}
          >
            <label htmlFor={`filter-${filter.key}`} className="sr-only">
              {filter.label}
            </label>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id={`filter-${filter.key}`}
              type="search"
              placeholder={filter.placeholder ?? `Search...`}
              value={value}
              onChange={(e) => onChange(filter.key, e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        );

      case "select":
        return (
          <div key={filter.key} className={cn("w-full sm:w-auto", filter.width)}>
            <label htmlFor={`filter-${filter.key}`} className="sr-only">
              {filter.label}
            </label>
            <select
              id={`filter-${filter.key}`}
              value={value}
              onChange={(e) => onChange(filter.key, e.target.value)}
              className={cn(
                "h-10 w-full sm:w-auto px-4 rounded-md border border-input bg-background text-sm",
                "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "appearance-none cursor-pointer",
                // Custom dropdown arrow
                "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]",
                "bg-no-repeat bg-[right_0.75rem_center] bg-[length:16px_16px]",
                "pr-10 sm:min-w-[120px]"
              )}
            >
              {filter.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case "date":
        return (
          <div key={filter.key} className={cn("w-full sm:w-auto", filter.width)}>
            <label htmlFor={`filter-${filter.key}`} className="sr-only">
              {filter.label}
            </label>
            <input
              id={`filter-${filter.key}`}
              type="date"
              value={value}
              onChange={(e) => onChange(filter.key, e.target.value)}
              className={cn(
                "h-10 w-full sm:w-auto px-3 rounded-md border border-input bg-background text-sm",
                "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              )}
              aria-label={filter.label}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4",
        className
      )}
      role="search"
      aria-label="Filter data"
    >
      {/* Search Filters (typically full width on mobile, flex on desktop) */}
      {searchFilters.map(renderFilter)}

      {/* Select Filters */}
      {selectFilters.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          {selectFilters.map(renderFilter)}
        </div>
      )}

      {/* Date Range Filters */}
      {dateFilters.length > 0 && (
        <fieldset className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
          <legend className="sr-only">Date range filter</legend>
          {dateFilters.map((filter, index) => (
            <div key={filter.key} className="flex items-center gap-2">
              {renderFilter(filter)}
              {/* Add "to" separator between date filters (but not after the last one) */}
              {index < dateFilters.length - 1 && (
                <span className="hidden sm:block text-muted-foreground" aria-hidden="true">
                  to
                </span>
              )}
            </div>
          ))}
        </fieldset>
      )}

      {/* Custom Children */}
      {children}

      {/* Reset Button */}
      {hasActiveFilters && onReset && (
        <button
          onClick={onReset}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-input px-3 text-sm text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          type="button"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Clear Filters
        </button>
      )}
    </div>
  );
}

export default AdminFilterBar;
