"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface AdminPaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items across all pages */
  totalItems: number;
  /** Number of items per page */
  itemsPerPage: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Label for the items being paginated (default: "items") */
  itemLabel?: string;
  /** Maximum number of page buttons to show (default: 5) */
  maxPageButtons?: number;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// AdminPagination Component
// ============================================================================

/**
 * Shared pagination component for admin pages.
 * Displays page navigation with previous/next buttons, page numbers,
 * and item count information.
 */
export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemLabel = "items",
  maxPageButtons = 5,
  className,
}: AdminPaginationProps) {
  // Don't render if there's only one page or no items
  if (totalPages <= 1) {
    return null;
  }

  // Calculate the range of items being displayed
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Calculate which page numbers to display
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const halfMax = Math.floor(maxPageButtons / 2);

    let startPage: number;
    let endPage: number;

    if (totalPages <= maxPageButtons) {
      // Show all pages if total is less than max buttons
      startPage = 1;
      endPage = totalPages;
    } else if (currentPage <= halfMax + 1) {
      // Near the beginning
      startPage = 1;
      endPage = maxPageButtons;
    } else if (currentPage >= totalPages - halfMax) {
      // Near the end
      startPage = totalPages - maxPageButtons + 1;
      endPage = totalPages;
    } else {
      // In the middle
      startPage = currentPage - halfMax;
      endPage = currentPage + halfMax;
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t",
        className
      )}
    >
      {/* Item count info */}
      <p className="text-sm text-muted-foreground text-center sm:text-left">
        Showing {startItem} to {endItem} of {totalItems} {itemLabel}
      </p>

      {/* Navigation controls */}
      <nav
        className="flex items-center justify-center sm:justify-end gap-1"
        aria-label="Pagination"
        role="navigation"
      >
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className={cn(
            "p-2 border rounded-md transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            canGoPrevious
              ? "hover:bg-muted"
              : "opacity-50 cursor-not-allowed"
          )}
          aria-label="Go to previous page"
          aria-disabled={!canGoPrevious}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Page number buttons */}
        <div className="flex items-center gap-1" role="group" aria-label="Page numbers">
          {pageNumbers.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "min-w-[2rem] h-8 px-2 rounded-md text-sm font-medium transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                currentPage === pageNum
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
              aria-label={`Go to page ${pageNum}`}
              aria-current={currentPage === pageNum ? "page" : undefined}
            >
              {pageNum}
            </button>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className={cn(
            "p-2 border rounded-md transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            canGoNext
              ? "hover:bg-muted"
              : "opacity-50 cursor-not-allowed"
          )}
          aria-label="Go to next page"
          aria-disabled={!canGoNext}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
