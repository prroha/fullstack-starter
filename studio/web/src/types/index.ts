// =====================================================
// Studio Types Index
// =====================================================
//
// Central export point for all types used in the Studio web app.
// Re-exports core types and provides studio-specific type extensions.
//
// Usage:
//   import { User, ApiResponse, PaginatedResponse } from "@/types";
//
// Note: Type re-export files (api.ts, user.ts, etc.) exist for
// IDE navigation convenience when jumping to type definitions.
// All types ultimately come from @core/types.
// =====================================================

// Re-export all core types
export * from "@core/types";

// =====================================================
// Studio-Specific Types
// =====================================================

/**
 * Common props for admin page components
 */
export interface AdminPageProps {
  params?: Record<string, string>;
  searchParams?: Record<string, string | string[] | undefined>;
}

/**
 * Table column definition for admin tables
 */
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (value: unknown, item: T) => React.ReactNode;
}

/**
 * Filter option for admin table filters
 */
export interface FilterOption {
  label: string;
  value: string;
}

/**
 * Sort configuration for admin tables
 */
export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

/**
 * Pagination state for admin tables
 */
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Common modal props
 */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Async operation state
 */
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Form state with validation
 */
export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}
