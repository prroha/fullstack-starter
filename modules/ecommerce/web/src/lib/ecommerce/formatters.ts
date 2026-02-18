import type { EcommerceOrderStatus } from './types';

export { formatPrice } from '@/lib/utils';

/**
 * Format an order status enum value to a human-readable label.
 */
const statusLabels: Record<EcommerceOrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export function formatOrderStatus(status: EcommerceOrderStatus): string {
  return statusLabels[status] ?? status;
}

/**
 * Get Tailwind CSS color classes for an order status badge.
 */
const statusColors: Record<EcommerceOrderStatus, string> = {
  PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  CONFIRMED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  PROCESSING: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  SHIPPED: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  DELIVERED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  CANCELLED: 'bg-muted text-muted-foreground',
  REFUNDED: 'bg-destructive/10 text-destructive',
};

export function getOrderStatusColor(status: EcommerceOrderStatus): string {
  return statusColors[status] ?? 'bg-muted text-muted-foreground';
}

/**
 * Format a quantity with singular/plural label.
 */
export function formatQuantity(quantity: number, singular = 'item', plural = 'items'): string {
  return `${quantity} ${quantity === 1 ? singular : plural}`;
}
