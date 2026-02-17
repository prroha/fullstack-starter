import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a price stored in cents to a display currency string.
 * Returns "Free" for zero prices.
 */
export function formatPrice(priceInCents: number, currency = 'usd'): string {
  if (priceInCents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(priceInCents / 100);
}

/**
 * Format a date string to a locale display string.
 * Example: "Feb 17, 2026"
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
