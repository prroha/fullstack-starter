"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

export type PaginationSize = "sm" | "md" | "lg";

export interface PaginationProps {
  /** Current page (1-indexed) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Total number of items (for "Showing X-Y of Z" text) */
  totalItems?: number;
  /** Items per page (for "Showing X-Y of Z" text) */
  pageSize?: number;
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Show first/last page buttons */
  showFirstLast?: boolean;
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  /** Show "Showing X-Y of Z" text */
  showItemCount?: boolean;
  /** Size variant */
  size?: PaginationSize;
  /** Disabled state */
  disabled?: boolean;
  /** Number of siblings to show on each side of current page */
  siblingCount?: number;
  /** Additional class name */
  className?: string;
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Generates an array of page numbers with ellipsis for pagination
 */
function generatePaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): (number | "ellipsis")[] {
  const totalPageNumbers = siblingCount * 2 + 5; // siblings + first + last + current + 2 ellipses

  // If total pages is less than the page numbers we want to show
  if (totalPages <= totalPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - 1;

  const result: (number | "ellipsis")[] = [];

  // Always show first page
  result.push(1);

  // Left ellipsis
  if (showLeftEllipsis) {
    result.push("ellipsis");
  } else if (leftSiblingIndex > 1) {
    // Show page 2 if left sibling starts at 2
    result.push(2);
  }

  // Page numbers in the middle
  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    if (i !== 1 && i !== totalPages) {
      result.push(i);
    }
  }

  // Right ellipsis
  if (showRightEllipsis) {
    result.push("ellipsis");
  } else if (rightSiblingIndex < totalPages - 1) {
    // Show second-to-last page if right sibling ends before it
    result.push(totalPages - 1);
  }

  // Always show last page
  if (totalPages > 1) {
    result.push(totalPages);
  }

  return result;
}

// =====================================================
// Icons
// =====================================================

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function ChevronDoubleLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronDoubleRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

// =====================================================
// Pagination Component
// =====================================================

function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showFirstLast = false,
  showPageSizeSelector = false,
  showItemCount = false,
  size = "md",
  disabled = false,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const sizes = {
    sm: {
      button: "h-7 min-w-7 px-2 text-xs",
      icon: "h-3 w-3",
      gap: "gap-1",
    },
    md: {
      button: "h-8 min-w-8 px-2.5 text-sm",
      icon: "h-4 w-4",
      gap: "gap-1.5",
    },
    lg: {
      button: "h-10 min-w-10 px-3 text-base",
      icon: "h-5 w-5",
      gap: "gap-2",
    },
  };

  const currentSize = sizes[size];
  const pages = generatePaginationRange(page, totalPages, siblingCount);

  // Calculate "Showing X-Y of Z" values
  const startItem = totalItems ? (page - 1) * pageSize + 1 : 0;
  const endItem = totalItems ? Math.min(page * pageSize, totalItems) : 0;

  const handlePageChange = (newPage: number) => {
    if (!disabled && newPage >= 1 && newPage <= totalPages && newPage !== page) {
      onPageChange(newPage);
    }
  };

  const buttonBaseClasses = cn(
    "inline-flex items-center justify-center rounded-md font-medium",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    currentSize.button
  );

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-between", currentSize.gap, className)}
    >
      {/* Left section: Item count and page size selector */}
      <div className={cn("flex items-center", currentSize.gap)}>
        {showItemCount && totalItems !== undefined && (
          <span className={cn("text-muted-foreground", size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm")}>
            Showing {startItem}-{endItem} of {totalItems}
          </span>
        )}

        {showPageSizeSelector && onPageSizeChange && (
          <div className={cn("flex items-center", currentSize.gap)}>
            <span className={cn("text-muted-foreground", size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm")}>
              Per page:
            </span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={disabled}
              className={cn(
                "rounded-md border border-input bg-background px-2",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50",
                size === "sm" ? "h-7 text-xs" : size === "lg" ? "h-10 text-base" : "h-8 text-sm"
              )}
              aria-label="Items per page"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right section: Page navigation */}
      <div className={cn("flex items-center", currentSize.gap)} role="group" aria-label="Page navigation">
        {/* First page button */}
        {showFirstLast && (
          <button
            type="button"
            onClick={() => handlePageChange(1)}
            disabled={disabled || page === 1}
            className={cn(buttonBaseClasses, "hover:bg-accent hover:text-accent-foreground")}
            aria-label="Go to first page"
          >
            <ChevronDoubleLeftIcon className={currentSize.icon} />
          </button>
        )}

        {/* Previous page button */}
        <button
          type="button"
          onClick={() => handlePageChange(page - 1)}
          disabled={disabled || page === 1}
          className={cn(buttonBaseClasses, "hover:bg-accent hover:text-accent-foreground")}
          aria-label="Go to previous page"
        >
          <ChevronLeftIcon className={currentSize.icon} />
        </button>

        {/* Page numbers */}
        {pages.map((pageNum, index) => {
          if (pageNum === "ellipsis") {
            return (
              <span
                key={`ellipsis-${index}`}
                className={cn(
                  "inline-flex items-center justify-center text-muted-foreground",
                  currentSize.button
                )}
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          const isCurrentPage = pageNum === page;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => handlePageChange(pageNum)}
              disabled={disabled}
              className={cn(
                buttonBaseClasses,
                isCurrentPage
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              aria-label={`Go to page ${pageNum}`}
              aria-current={isCurrentPage ? "page" : undefined}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next page button */}
        <button
          type="button"
          onClick={() => handlePageChange(page + 1)}
          disabled={disabled || page === totalPages}
          className={cn(buttonBaseClasses, "hover:bg-accent hover:text-accent-foreground")}
          aria-label="Go to next page"
        >
          <ChevronRightIcon className={currentSize.icon} />
        </button>

        {/* Last page button */}
        {showFirstLast && (
          <button
            type="button"
            onClick={() => handlePageChange(totalPages)}
            disabled={disabled || page === totalPages}
            className={cn(buttonBaseClasses, "hover:bg-accent hover:text-accent-foreground")}
            aria-label="Go to last page"
          >
            <ChevronDoubleRightIcon className={currentSize.icon} />
          </button>
        )}
      </div>
    </nav>
  );
}

// =====================================================
// Exports
// =====================================================

export { Pagination };
