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
 * Examples: "30 min", "1 hr", "1 hr 30 min"
 */
export function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

/**
 * Format a time string "HH:mm" to 12-hour format.
 * Examples: "09:00" -> "9:00 AM", "14:30" -> "2:30 PM"
 */
export function formatTime(time: string): string {
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute} ${period}`;
}

/**
 * Format a time range "HH:mm" - "HH:mm" in 12-hour format.
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * Format a date string to a localized date.
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string to a short date.
 */
export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get the day name from a day-of-week number (0 = Sunday).
 */
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getDayName(dayOfWeek: number): string {
  return dayNames[dayOfWeek] ?? 'Unknown';
}

export function getShortDayName(dayOfWeek: number): string {
  return shortDayNames[dayOfWeek] ?? '???';
}

/**
 * Get status display label.
 */
const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
};

export function getStatusLabel(status: string): string {
  return statusLabels[status] ?? status;
}

/**
 * Get status color mapping for StatusBadge component.
 */
type StatusBadgeStatus = 'pending' | 'active' | 'success' | 'warning' | 'error' | 'info';

const statusBadgeMap: Record<string, StatusBadgeStatus> = {
  PENDING: 'pending',
  CONFIRMED: 'active',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'error',
  NO_SHOW: 'warning',
};

export function getBookingStatusBadge(status: string): StatusBadgeStatus {
  return statusBadgeMap[status] ?? 'pending';
}

/**
 * Get service status color mapping for Badge component.
 */
const serviceStatusVariants: Record<string, 'default' | 'secondary' | 'success' | 'warning'> = {
  DRAFT: 'secondary',
  ACTIVE: 'success',
  ARCHIVED: 'warning',
};

export function getServiceStatusVariant(status: string): 'default' | 'secondary' | 'success' | 'warning' {
  return serviceStatusVariants[status] ?? 'default';
}
