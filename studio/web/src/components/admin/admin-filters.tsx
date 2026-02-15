"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, SearchInput } from "@/components/ui";

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
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="sm:w-64"
          debounceDelay={0}
        />
      )}

      {/* Custom Filters */}
      {children}

      {/* Clear Filters */}
      {hasActiveFilters && onClearFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}

export default AdminFilters;
