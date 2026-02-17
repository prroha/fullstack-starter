"use client";

import { ReactNode } from "react";
import { Input, Select, Button, Label } from "@/components/ui";
import type { SelectOption } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface FilterField {
  type: "search" | "select" | "date" | "datetime-local";
  name: string;
  placeholder?: string;
  label?: string;
  options?: SelectOption[];
  className?: string;
}

export interface AdminFiltersProps {
  /** Search input value */
  search?: string;
  /** Search input change handler */
  onSearchChange?: (value: string) => void;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Array of select filter configurations */
  filters?: Array<{
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    className?: string;
  }>;
  /** Date range configuration */
  dateRange?: {
    startDate: string;
    endDate: string;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
    type?: "date" | "datetime-local";
  };
  /** Show clear filters button when true */
  hasActiveFilters?: boolean;
  /** Clear filters callback */
  onClearFilters?: () => void;
  /** Additional filter components rendered inline */
  children?: ReactNode;
  /** Optional className for the container */
  className?: string;
}

/**
 * Shared filter bar component for admin pages.
 * Supports search input, select dropdowns, date range filters, and custom children.
 */
export function AdminFilters({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  dateRange,
  hasActiveFilters,
  onClearFilters,
  children,
  className,
}: AdminFiltersProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-4">
        {onSearchChange && (
          <div className="flex-1 min-w-[200px]">
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={search || ""}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
        {filters.map((filter, index) => (
          <Select
            key={index}
            value={filter.value}
            onChange={filter.onChange}
            options={filter.options}
            className={filter.className || "w-40"}
          />
        ))}
        {children}
      </div>

      {dateRange && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">From:</Label>
            <Input
              type={dateRange.type || "date"}
              value={dateRange.startDate}
              onChange={(e) => dateRange.onStartDateChange(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">To:</Label>
            <Input
              type={dateRange.type || "date"}
              value={dateRange.endDate}
              onChange={(e) => dateRange.onEndDateChange(e.target.value)}
              className="w-auto"
            />
          </div>
          {hasActiveFilters && onClearFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {!dateRange && hasActiveFilters && onClearFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );
}

export default AdminFilters;
