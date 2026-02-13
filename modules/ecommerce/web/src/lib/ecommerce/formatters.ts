import type { EcommerceOrderStatus } from './types';

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
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  REFUNDED: 'bg-red-100 text-red-800',
};

export function getOrderStatusColor(status: EcommerceOrderStatus): string {
  return statusColors[status] ?? 'bg-gray-100 text-gray-800';
}

/**
 * Format a quantity with singular/plural label.
 */
export function formatQuantity(quantity: number, singular = 'item', plural = 'items'): string {
  return `${quantity} ${quantity === 1 ? singular : plural}`;
}
