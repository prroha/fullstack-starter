/**
 * Settings-related types for the Studio platform.
 * Settings store configurable platform values.
 */

/**
 * Type of value stored in a setting.
 */
export type SettingType = "string" | "number" | "boolean" | "json";

/**
 * A platform setting (key-value configuration).
 */
export interface Setting {
  /** Unique setting identifier (CUID) */
  id: string;
  /** Unique setting key (e.g., "site.name", "pricing.currency") */
  key: string;
  /** Setting value (stored as string, parsed based on type) */
  value: string;
  /** Type of the value for parsing */
  type: SettingType;
  /** Human-readable description of the setting */
  description: string | null;
  /** Whether this setting is exposed to the public API */
  isPublic: boolean;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Setting with parsed value for type-safe access.
 */
export interface ParsedSetting<T = unknown> extends Omit<Setting, "value"> {
  /** The raw string value */
  rawValue: string;
  /** The parsed value based on type */
  value: T;
}

/**
 * Data required to create a new setting.
 */
export interface CreateSettingData {
  /** Unique setting key */
  key: string;
  /** Setting value (as string) */
  value: string;
  /** Value type */
  type?: SettingType;
  /** Description */
  description?: string;
  /** Whether setting is public */
  isPublic?: boolean;
}

/**
 * Data for updating an existing setting.
 */
export interface UpdateSettingData extends Partial<CreateSettingData> {}

/**
 * Parameters for querying settings with filtering and pagination.
 */
export interface GetSettingsParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  limit?: number;
  /** Search by key or description */
  search?: string;
  /** Filter by public visibility */
  isPublic?: boolean;
  /** Filter by key prefix (e.g., "site.", "pricing.") */
  prefix?: string;
  /** Sort field */
  sortBy?: SettingSortField;
  /** Sort direction */
  sortOrder?: "asc" | "desc";
}

/**
 * Fields available for sorting settings.
 */
export type SettingSortField = "key" | "createdAt" | "updatedAt";

/**
 * Bulk settings update item.
 */
export interface BulkSettingUpdate {
  key: string;
  value: string;
}

/**
 * Common setting keys used in the platform.
 */
export type CommonSettingKey =
  // Site settings
  | "site.name"
  | "site.description"
  | "site.url"
  | "site.logo"
  | "site.favicon"
  // Pricing settings
  | "pricing.currency"
  | "pricing.taxRate"
  | "pricing.taxIncluded"
  // Feature settings
  | "features.previewEnabled"
  | "features.guestCheckout"
  // Email settings
  | "email.fromAddress"
  | "email.fromName"
  // Download settings
  | "download.maxDownloads"
  | "download.expirationDays";

/**
 * Type helper for getting a setting value by key.
 */
export type SettingValue<K extends CommonSettingKey> = K extends
  | "pricing.taxRate"
  | "download.maxDownloads"
  | "download.expirationDays"
  ? number
  : K extends "pricing.taxIncluded" | "features.previewEnabled" | "features.guestCheckout"
    ? boolean
    : string;

/**
 * Audit log entry for tracking admin actions on settings.
 */
export interface SettingAuditEntry {
  id: string;
  adminId: string | null;
  adminEmail: string | null;
  action: "CREATE" | "UPDATE" | "DELETE";
  settingKey: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}
