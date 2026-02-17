// =============================================================================
// Invoicing Formatters
// =============================================================================

import type { InvoiceStatus, PaymentMethod, RecurringFrequency, RecurringStatus } from './types';

/**
 * Format a price stored in cents to a display currency string.
 * Returns "$0.00" for zero prices.
 */
export function formatPrice(priceInCents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(priceInCents / 100);
}

/**
 * Format an invoice status to a human-readable label.
 */
const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  VIEWED: 'Viewed',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
  VOID: 'Void',
};

export function formatInvoiceStatus(status: InvoiceStatus): string {
  return invoiceStatusLabels[status] ?? status;
}

/**
 * Get StatusBadge status type for an invoice status.
 */
const invoiceStatusBadgeMap: Record<InvoiceStatus, string> = {
  DRAFT: 'inactive',
  SENT: 'info',
  VIEWED: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'error',
  CANCELLED: 'inactive',
  VOID: 'inactive',
};

export function getInvoiceStatusBadge(status: InvoiceStatus): string {
  return invoiceStatusBadgeMap[status] ?? 'pending';
}

/**
 * Format a payment method enum to a human-readable label.
 */
const paymentMethodLabels: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Bank Transfer',
  CREDIT_CARD: 'Credit Card',
  CASH: 'Cash',
  CHECK: 'Check',
  OTHER: 'Other',
};

export function formatPaymentMethod(method: PaymentMethod): string {
  return paymentMethodLabels[method] ?? method;
}

/**
 * Format a recurring frequency to a human-readable label.
 */
const frequencyLabels: Record<RecurringFrequency, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
};

export function formatRecurringFrequency(frequency: RecurringFrequency): string {
  return frequencyLabels[frequency] ?? frequency;
}

/**
 * Format a recurring status to a human-readable label.
 */
const recurringStatusLabels: Record<RecurringStatus, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
};

export function formatRecurringStatus(status: RecurringStatus): string {
  return recurringStatusLabels[status] ?? status;
}

/**
 * Get StatusBadge status type for a recurring status.
 */
const recurringStatusBadgeMap: Record<RecurringStatus, string> = {
  ACTIVE: 'active',
  PAUSED: 'warning',
  CANCELLED: 'inactive',
};

export function getRecurringStatusBadge(status: RecurringStatus): string {
  return recurringStatusBadgeMap[status] ?? 'pending';
}

import { formatDate } from '@/lib/utils';
export { formatDate };

/**
 * Format a due date with overdue indication.
 */
export function formatDueDate(dateStr: string, status: InvoiceStatus): string {
  const formatted = formatDate(dateStr);
  if (status === 'OVERDUE') {
    const daysOverdue = Math.ceil(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
    );
    return `${formatted} (${daysOverdue}d overdue)`;
  }
  return formatted;
}
