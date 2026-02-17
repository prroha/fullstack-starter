// =============================================================================
// Events Formatters
// =============================================================================

import type { EventStatus, EventType, RegistrationStatus } from './types';

/**
 * Format an event status to a human-readable label.
 */
const eventStatusLabels: Record<EventStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

export function formatEventStatus(status: EventStatus): string {
  return eventStatusLabels[status] ?? status;
}

/**
 * Get StatusBadge status type for an event status.
 */
type StatusType = "active" | "inactive" | "pending" | "success" | "warning" | "error" | "info";

const eventStatusBadgeMap: Record<EventStatus, StatusType> = {
  DRAFT: 'pending',
  PUBLISHED: 'active',
  CANCELLED: 'error',
  COMPLETED: 'success',
  ARCHIVED: 'inactive',
};

export function getEventStatusBadge(status: EventStatus): StatusType {
  return eventStatusBadgeMap[status] ?? 'pending';
}

/**
 * Format an event type to a human-readable label.
 */
const eventTypeLabels: Record<EventType, string> = {
  IN_PERSON: 'In Person',
  VIRTUAL: 'Virtual',
  HYBRID: 'Hybrid',
};

export function formatEventType(type: EventType): string {
  return eventTypeLabels[type] ?? type;
}

/**
 * Get Badge variant for an event type.
 */
const eventTypeBadgeMap: Record<EventType, StatusType> = {
  IN_PERSON: 'info',
  VIRTUAL: 'active',
  HYBRID: 'warning',
};

export function getEventTypeBadge(type: EventType): StatusType {
  return eventTypeBadgeMap[type] ?? 'info';
}

/**
 * Format a registration status to a human-readable label.
 */
const registrationStatusLabels: Record<RegistrationStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  WAITLISTED: 'Waitlisted',
  ATTENDED: 'Attended',
};

export function formatRegistrationStatus(status: RegistrationStatus): string {
  return registrationStatusLabels[status] ?? status;
}

/**
 * Get StatusBadge status type for a registration status.
 */
const registrationStatusBadgeMap: Record<RegistrationStatus, StatusType> = {
  PENDING: 'pending',
  CONFIRMED: 'active',
  CANCELLED: 'error',
  WAITLISTED: 'warning',
  ATTENDED: 'success',
};

export function getRegistrationStatusBadge(status: RegistrationStatus): StatusType {
  return registrationStatusBadgeMap[status] ?? 'pending';
}

export { formatDate } from '@/lib/utils';

/**
 * Format a date range for display.
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    const startTime = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const endTime = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${startStr}, ${startTime} - ${endTime}`;
  }

  const endStr = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${startStr} - ${endStr}`;
}

export { formatPrice } from '@/lib/utils';

/**
 * Format capacity for display.
 */
export function formatCapacity(capacity: number | null, registrationCount?: number): string {
  if (capacity === null) return 'Unlimited';
  if (registrationCount !== undefined) {
    return `${registrationCount} / ${capacity}`;
  }
  return `${capacity} seats`;
}
