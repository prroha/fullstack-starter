import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// =====================================================
// Class Name Utility
// =====================================================

/**
 * Merge class names with Tailwind CSS conflict resolution
 * Combines clsx for conditional classes with tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =====================================================
// Currency Formatting
// =====================================================

/**
 * Format cents to dollars with currency symbol
 * @param cents - Amount in cents (e.g., 1999 = $19.99)
 * @param currency - ISO 4217 currency code (default: USD)
 * @returns Formatted currency string (e.g., "$19.99")
 */
export function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/**
 * Format cents to dollars without currency symbol
 * @param cents - Amount in cents
 * @returns Formatted number string (e.g., "19.99")
 */
export function formatCentsToDecimal(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Convert dollars to cents
 * @param dollars - Amount in dollars (e.g., 19.99)
 * @returns Amount in cents (e.g., 1999)
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 * @param cents - Amount in cents (e.g., 1999)
 * @returns Amount in dollars (e.g., 19.99)
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

// =====================================================
// Number Formatting
// =====================================================

/**
 * Format number with locale-specific separators
 * @param num - Number to format
 * @returns Formatted number string (e.g., "1,234,567")
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Format number with compact notation for large numbers
 * @param num - Number to format
 * @returns Compact formatted string (e.g., "1.2K", "3.4M")
 */
export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
  }).format(num);
}

/**
 * Format percentage value
 * @param value - Percentage value (e.g., 45.678)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "45.7%")
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a decimal as a percentage
 * @param decimal - Decimal value (e.g., 0.45678)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "45.7%")
 */
export function formatDecimalAsPercentage(decimal: number, decimals = 1): string {
  return formatPercentage(decimal * 100, decimals);
}

// =====================================================
// Date & Time Formatting
// =====================================================

/**
 * Format date in short format
 * @param date - Date object or ISO string
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Format date in long format
 * @param date - Date object or ISO string
 * @returns Formatted date string (e.g., "January 15, 2024")
 */
export function formatDateLong(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Format date and time
 * @param date - Date object or ISO string
 * @returns Formatted datetime string (e.g., "Jan 15, 2024, 3:30 PM")
 */
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

/**
 * Format date and time with seconds
 * @param date - Date object or ISO string
 * @returns Formatted datetime string (e.g., "Jan 15, 2024, 3:30:45 PM")
 */
export function formatDateTimeFull(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(date));
}

/**
 * Format time only
 * @param date - Date object or ISO string
 * @returns Formatted time string (e.g., "3:30 PM")
 */
export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @param date - Date object or ISO string
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((target.getTime() - now.getTime()) / 1000);
  const absSeconds = Math.abs(diffInSeconds);

  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

  if (absSeconds < 60) {
    return rtf.format(diffInSeconds, "second");
  } else if (absSeconds < 3600) {
    return rtf.format(Math.floor(diffInSeconds / 60), "minute");
  } else if (absSeconds < 86400) {
    return rtf.format(Math.floor(diffInSeconds / 3600), "hour");
  } else if (absSeconds < 2592000) {
    return rtf.format(Math.floor(diffInSeconds / 86400), "day");
  } else if (absSeconds < 31536000) {
    return rtf.format(Math.floor(diffInSeconds / 2592000), "month");
  } else {
    return rtf.format(Math.floor(diffInSeconds / 31536000), "year");
  }
}

/**
 * Format date for input[type="datetime-local"]
 * @param date - Date object or ISO string
 * @returns ISO string without timezone (e.g., "2024-01-15T15:30")
 */
export function formatDateTimeForInput(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().slice(0, 16);
}

/**
 * Format date for input[type="date"]
 * @param date - Date object or ISO string
 * @returns ISO date string (e.g., "2024-01-15")
 */
export function formatDateForInput(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

// =====================================================
// String Utilities
// =====================================================

/**
 * Truncate string with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length including ellipsis
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Capitalize first letter of string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert string to title case
 * @param str - String to convert
 * @returns Title case string
 */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Convert snake_case or kebab-case to Title Case
 * @param str - String to convert
 * @returns Title case string
 */
export function slugToTitle(str: string): string {
  return str
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// =====================================================
// Status Badge Utilities
// =====================================================

export type StatusVariant = "success" | "warning" | "error" | "info" | "default";

/**
 * Get status variant for order status
 * @param status - Order status
 * @returns Badge variant
 */
export function getOrderStatusVariant(status: string): StatusVariant {
  switch (status.toUpperCase()) {
    case "COMPLETED":
      return "success";
    case "PENDING":
    case "PROCESSING":
      return "warning";
    case "FAILED":
    case "CANCELLED":
      return "error";
    case "REFUNDED":
      return "info";
    default:
      return "default";
  }
}

/**
 * Get status variant for license status
 * @param status - License status
 * @returns Badge variant
 */
export function getLicenseStatusVariant(status: string): StatusVariant {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "success";
    case "EXPIRED":
      return "warning";
    case "REVOKED":
      return "error";
    default:
      return "default";
  }
}

// =====================================================
// Validation Utilities
// =====================================================

/**
 * Check if string is a valid email
 * @param email - Email string to validate
 * @returns Boolean indicating if valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if string is a valid URL
 * @param url - URL string to validate
 * @returns Boolean indicating if valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if string is a valid slug (lowercase, numbers, hyphens)
 * @param slug - Slug string to validate
 * @returns Boolean indicating if valid
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

// =====================================================
// Miscellaneous Utilities
// =====================================================

/**
 * Generate initials from name
 * @param name - Full name
 * @returns Initials (e.g., "JD" for "John Doe")
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

/**
 * Deep clone an object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function execution
 * @param fn - Function to debounce
 * @param ms - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Sleep/delay for specified milliseconds
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Download a file from URL
 * @param url - File URL
 * @param filename - Optional filename for download
 */
export function downloadFile(url: string, filename?: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves with success boolean
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}

// =====================================================
// Array Utilities
// =====================================================

/**
 * Group an array of objects by a key
 * @param array - Array to group
 * @param key - Key to group by
 * @returns Object with keys and arrays of items
 */
export function groupBy<T, K extends keyof T>(
  array: T[],
  key: K
): Record<string, T[]> {
  return array.reduce(
    (acc, item) => {
      const groupKey = String(item[key]);
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Remove duplicates from an array
 * @param array - Array with potential duplicates
 * @param key - Optional key for object comparison
 * @returns Array without duplicates
 */
export function uniqueBy<T>(array: T[], key?: keyof T): T[] {
  if (!key) {
    return [...new Set(array)];
  }
  const seen = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Sort an array of objects by a key
 * @param array - Array to sort
 * @param key - Key to sort by
 * @param order - Sort order (asc or desc)
 * @returns Sorted array
 */
export function sortBy<T>(
  array: T[],
  key: keyof T,
  order: "asc" | "desc" = "asc"
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === "asc" ? -1 : 1;
    if (aVal > bVal) return order === "asc" ? 1 : -1;
    return 0;
  });
}

// =====================================================
// Object Utilities
// =====================================================

/**
 * Pick specific keys from an object
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns New object with only specified keys
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Omit specific keys from an object
 * @param obj - Source object
 * @param keys - Keys to omit
 * @returns New object without specified keys
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Check if an object is empty
 * @param obj - Object to check
 * @returns Boolean indicating if empty
 */
export function isEmpty(obj: object | null | undefined): boolean {
  if (!obj) return true;
  return Object.keys(obj).length === 0;
}

// =====================================================
// ID Generation
// =====================================================

/**
 * Generate a UUID v4
 * Uses crypto.randomUUID when available, falls back to manual generation
 * @returns UUID string
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a short ID (8 characters)
 * Useful for display purposes where full UUID is too long
 * @returns Short ID string
 */
export function generateShortId(): string {
  return generateId().slice(0, 8);
}

// =====================================================
// Throttle
// =====================================================

/**
 * Throttle function execution
 * Unlike debounce, throttle executes immediately and then ignores
 * subsequent calls for the specified duration
 * @param fn - Function to throttle
 * @param ms - Minimum time between executions
 * @returns Throttled function
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

// =====================================================
// Safe JSON
// =====================================================

/**
 * Safely parse JSON with error handling
 * @param json - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed value or fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safely stringify an object to JSON
 * Handles circular references and other edge cases
 * @param value - Value to stringify
 * @param fallback - Fallback string if stringify fails
 * @returns JSON string or fallback
 */
export function safeJsonStringify(value: unknown, fallback = "{}"): string {
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}
