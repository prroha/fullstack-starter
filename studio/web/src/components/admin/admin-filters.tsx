"use client";

import { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminFiltersProps {
  /** Search input value */
  search?: string;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Search input change handler */
  onSearchChange?: (value: string) => void;
  /** Whether filters are active (shows clear button) */
  hasActiveFilters?: boolean;
  /** Clear all filters handler */
  onClearFilters?: () => void;
  /** Additional filter components */
  children?: ReactNode;
  className?: string;
}

/**
 * Consistent filter bar for admin pages with search and custom filters
 */
export function AdminFilters({
  search = "",
  searchPlaceholder = "Search...",
  onSearchChange,
  hasActiveFilters = false,
  onClearFilters,
  children,
  className,
}: AdminFiltersProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap", className)}>
      {/* Search Input */}
      {onSearchChange && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:w-64"
          />
        </div>
      )}

      {/* Custom Filters */}
      {children}

      {/* Clear Filters */}
      {hasActiveFilters && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-input px-3 text-sm text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
          Clear Filters
        </button>
      )}
    </div>
  );
}

export default AdminFilters;
