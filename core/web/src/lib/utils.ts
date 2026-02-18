import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a price stored in cents to a display currency string.
 * Returns "Free" for zero prices.
 */
export function formatPrice(priceInCents: number, currency = 'usd', locale = 'en-US'): string {
  if (priceInCents === 0) return 'Free';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(priceInCents / 100);
}

/**
 * Format a date string to a locale display string.
 * Example: "Feb 17, 2026"
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
