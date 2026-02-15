"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Input, Select, SearchInput } from "@/components/ui";

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
            className={cn(filter.width ?? "w-full sm:flex-1 sm:min-w-[240px]")}
          >
            <SearchInput
              id={`filter-${filter.key}`}
              placeholder={filter.placeholder ?? `Search...`}
              value={value}
              onChange={(val) => onChange(filter.key, val)}
              debounceDelay={0}
              aria-label={filter.label}
            />
          </div>
        );

      case "select":
        return (
          <div key={filter.key} className={cn("w-full sm:w-auto", filter.width)}>
            <label htmlFor={`filter-${filter.key}`} className="sr-only">
              {filter.label}
            </label>
            <Select
              id={`filter-${filter.key}`}
              value={value}
              onChange={(v) => onChange(filter.key, v)}
              options={filter.options || []}
              className="sm:min-w-[120px]"
            />
          </div>
        );

      case "date":
        return (
          <div key={filter.key} className={cn("w-full sm:w-auto", filter.width)}>
            <label htmlFor={`filter-${filter.key}`} className="sr-only">
              {filter.label}
            </label>
            <Input
              id={`filter-${filter.key}`}
              type="date"
              value={value}
              onChange={(e) => onChange(filter.key, e.target.value)}
              className="sm:w-auto"
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
        <Button variant="outline" onClick={onReset} type="button">
          <X className="h-4 w-4" aria-hidden="true" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}

export default AdminFilterBar;
