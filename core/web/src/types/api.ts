// =====================================================
// API Types
// =====================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

/**
 * Pagination metadata
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Pagination query parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Sort query parameters
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Search query parameters
 */
export interface SearchParams {
  search?: string;
  q?: string;
}

/**
 * Date range filter parameters
 */
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

/**
 * Combined list query parameters
 */
export interface ListQueryParams extends PaginationParams, SortParams, SearchParams {}

/**
 * Auth response with tokens
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Token refresh response
 */
export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Verify reset token response
 */
export interface VerifyResetTokenResponse {
  valid: boolean;
  email?: string;
}

/**
 * Verify email response
 */
export interface VerifyEmailResponse {
  verified: boolean;
  email: string;
}

/**
 * Search response type
 */
export interface SearchResponse {
  results: {
    users?: Array<{
      id: string;
      email: string;
      name: string | null;
      role: "USER" | "ADMIN";
      isActive: boolean;
      createdAt: string;
    }>;
    query: string;
    totalResults: number;
  };
}

/**
 * Admin stats response
 */
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  recentSignups: number;
  signupsByDay: Array<{ date: string; count: number }>;
}

/**
 * Export format options
 */
export type ExportFormat = "json" | "csv";
