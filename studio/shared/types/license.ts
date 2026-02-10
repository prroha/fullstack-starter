/**
 * License-related types for the Studio platform.
 * Licenses grant customers access to download purchased products.
 */

/**
 * Status of a license.
 */
export type LicenseStatus = "ACTIVE" | "EXPIRED" | "REVOKED";

/**
 * A license granting download access for a purchased order.
 */
export interface License {
  /** Unique license identifier (CUID) */
  id: string;
  /** Associated order ID */
  orderId: string;
  /** Unique license key for verification */
  licenseKey: string;
  /** Token used for download authentication */
  downloadToken: string | null;
  /** Number of times the product has been downloaded */
  downloadCount: number;
  /** Maximum allowed downloads (null = unlimited) */
  maxDownloads: number | null;
  /** Current license status */
  status: LicenseStatus;
  /** License expiration date (null = never expires) */
  expiresAt: string | null;
  /** Timestamp when license was revoked */
  revokedAt: string | null;
  /** Reason for revocation */
  revokedReason: string | null;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Last download timestamp */
  lastDownloadAt?: string | null;
  /** Associated order information */
  order?: LicenseOrderInfo;
}

/**
 * Order information included with license details.
 */
export interface LicenseOrderInfo {
  orderNumber: string;
  customerEmail: string;
  customerName: string | null;
  tier: string;
  template: { name: string } | null;
  user?: { id: string; email: string; name: string | null };
}

/**
 * Parameters for querying licenses with filtering and pagination.
 */
export interface GetLicensesParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  limit?: number;
  /** Filter by license status */
  status?: LicenseStatus;
  /** Search by license key, order number, or email */
  search?: string;
  /** Filter by order ID */
  orderId?: string;
  /** Sort field */
  sortBy?: LicenseSortField;
  /** Sort direction */
  sortOrder?: "asc" | "desc";
}

/**
 * Fields available for sorting licenses.
 */
export type LicenseSortField =
  | "createdAt"
  | "expiresAt"
  | "downloadCount"
  | "status";

/**
 * License statistics for dashboard.
 */
export interface LicenseStats {
  /** Total number of licenses */
  total: number;
  /** Number of active licenses */
  active: number;
  /** Number of expired licenses */
  expired: number;
  /** Number of revoked licenses */
  revoked: number;
  /** Total downloads across all licenses */
  totalDownloads: number;
}

/**
 * Data for extending a license.
 */
export interface ExtendLicenseData {
  /** Number of days to extend */
  days: number;
}

/**
 * Data for revoking a license.
 */
export interface RevokeLicenseData {
  /** Reason for revocation (required) */
  reason: string;
}

/**
 * Data for creating a new license (usually done automatically with order).
 */
export interface CreateLicenseData {
  orderId: string;
  maxDownloads?: number;
  expiresAt?: string;
}

/**
 * Response from regenerating a download token.
 */
export interface RegenerateTokenResponse {
  downloadToken: string;
}

/**
 * Download verification result.
 */
export interface DownloadVerification {
  /** Whether download is allowed */
  allowed: boolean;
  /** Reason if download is not allowed */
  reason?: string;
  /** Remaining downloads (null = unlimited) */
  remainingDownloads: number | null;
  /** License expiration date */
  expiresAt: string | null;
}
