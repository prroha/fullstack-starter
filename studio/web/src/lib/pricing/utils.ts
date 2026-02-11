/**
 * Pricing Utility Functions
 *
 * Shared utilities for formatting prices across the Studio application.
 */

// =====================================================
// Price Formatting Options
// =====================================================

export interface FormatPriceOptions {
  /** ISO 4217 currency code (default: USD) */
  currency?: string;
  /** Locale for formatting (default: en-US) */
  locale?: string;
  /** Show decimal places (default: false for whole numbers) */
  showCents?: boolean;
  /** Text to display when price is 0 (default: undefined, shows $0) */
  freeText?: string;
}

// =====================================================
// Price Formatting Functions
// =====================================================

/**
 * Format price in cents to a localized currency string
 *
 * @param cents - Amount in cents (e.g., 1999 = $19.99)
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "$19.99" or "Free")
 *
 * @example
 * formatPrice(1999) // "$20"
 * formatPrice(1999, { showCents: true }) // "$19.99"
 * formatPrice(0, { freeText: "Free" }) // "Free"
 * formatPrice(4900, { currency: "EUR", locale: "de-DE" }) // "49 €"
 */
export function formatPrice(
  cents: number,
  options: FormatPriceOptions = {}
): string {
  const {
    currency = "USD",
    locale = "en-US",
    showCents = false,
    freeText,
  } = options;

  // Handle free/zero price
  if (cents === 0 && freeText !== undefined) {
    return freeText;
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  });

  return formatter.format(cents / 100);
}

/**
 * Format price for display in pricing pages (shows "Free" for $0)
 *
 * @param cents - Amount in cents
 * @param options - Formatting options (freeText defaults to "Free")
 * @returns Formatted price string
 *
 * @example
 * formatDisplayPrice(0) // "Free"
 * formatDisplayPrice(4900) // "$49"
 * formatDisplayPrice(14900) // "$149"
 */
export function formatDisplayPrice(
  cents: number,
  options: Omit<FormatPriceOptions, "freeText"> = {}
): string {
  return formatPrice(cents, { ...options, freeText: "Free" });
}

/**
 * Format price with cents for detailed views (invoices, orders, etc.)
 *
 * @param cents - Amount in cents
 * @param options - Formatting options
 * @returns Formatted price string with decimal places
 *
 * @example
 * formatDetailedPrice(1999) // "$19.99"
 * formatDetailedPrice(4900) // "$49.00"
 */
export function formatDetailedPrice(
  cents: number,
  options: Omit<FormatPriceOptions, "showCents"> = {}
): string {
  return formatPrice(cents, { ...options, showCents: true });
}

/**
 * Format price range
 *
 * @param minCents - Minimum price in cents
 * @param maxCents - Maximum price in cents
 * @param options - Formatting options
 * @returns Formatted price range string (e.g., "$49 - $149")
 */
export function formatPriceRange(
  minCents: number,
  maxCents: number,
  options: FormatPriceOptions = {}
): string {
  if (minCents === maxCents) {
    return formatPrice(minCents, options);
  }
  return `${formatPrice(minCents, options)} - ${formatPrice(maxCents, options)}`;
}

/**
 * Calculate savings percentage between original and discounted price
 *
 * @param originalCents - Original price in cents
 * @param discountedCents - Discounted price in cents
 * @returns Savings percentage (0-100)
 */
export function calculateSavingsPercentage(
  originalCents: number,
  discountedCents: number
): number {
  if (originalCents <= 0 || discountedCents >= originalCents) {
    return 0;
  }
  return Math.round(((originalCents - discountedCents) / originalCents) * 100);
}

/**
 * Format savings for display
 *
 * @param originalCents - Original price in cents
 * @param discountedCents - Discounted price in cents
 * @returns Formatted savings string (e.g., "Save 40%") or null if no savings
 */
export function formatSavings(
  originalCents: number,
  discountedCents: number
): string | null {
  const percentage = calculateSavingsPercentage(originalCents, discountedCents);
  if (percentage <= 0) {
    return null;
  }
  return `Save ${percentage}%`;
}
