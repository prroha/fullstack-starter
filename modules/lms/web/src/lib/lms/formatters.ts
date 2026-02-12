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
 * Format a duration in minutes to a human-readable string.
 * Examples: "45m", "2h", "2h 30m"
 */
export function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

/**
 * Get Tailwind CSS classes for a course level badge.
 */
const levelColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
};

export function getLevelColor(level: string): string {
  return levelColors[level.toLowerCase()] ?? 'bg-gray-100 text-gray-800';
}
