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
 * Format a duration in minutes to a human-readable string.
 *
 * @param totalMinutes - The duration in minutes
 * @param style - 'short' outputs "2h 30m" (default), 'long' outputs "2 hr 30 min"
 *
 * Examples (short): "45m", "2h", "2h 30m"
 * Examples (long):  "45 min", "2 hr", "2 hr 30 min"
 */
export function formatDuration(totalMinutes: number, style: 'short' | 'long' = 'short'): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (style === 'long') {
    if (hours === 0) return `${minutes} min`;
    return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
  }

  // short style
  if (hours === 0) return `${minutes}m`;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
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
