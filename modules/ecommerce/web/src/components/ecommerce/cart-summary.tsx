'use client';

import type { CartItem } from '../../lib/ecommerce/types';
import { formatPrice } from '../../lib/ecommerce/formatters';
import { Button } from '@/components/ui/button';

interface CartSummaryProps {
  items: CartItem[];
  shippingCost?: number;
  taxAmount?: number;
  onCheckout?: () => void;
}

export default function CartSummary({
  items,
  shippingCost = 0,
  taxAmount = 0,
  onCheckout,
}: CartSummaryProps) {
  const subtotal = items.reduce((sum, item) => {
    const unitPrice = item.variant?.price || item.product?.price || 0;
    return sum + item.quantity * unitPrice;
  }, 0);

  const total = subtotal + shippingCost + taxAmount;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Order Summary
      </h3>

      <div className="space-y-3">
        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Subtotal</span>
          <span className="text-sm font-medium text-gray-900">
            {formatPrice(subtotal)}
          </span>
        </div>

        {/* Shipping */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Shipping</span>
          <span className="text-sm font-medium text-gray-900">
            {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
          </span>
        </div>

        {/* Tax */}
        {taxAmount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Tax</span>
            <span className="text-sm font-medium text-gray-900">
              {formatPrice(taxAmount)}
            </span>
          </div>
        )}

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-gray-900">Total</span>
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(total)}
          </span>
        </div>
      </div>

      {/* Checkout button */}
      <Button
        type="button"
        onClick={onCheckout}
        className="mt-6 w-full gap-2"
      >
        Proceed to Checkout
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
      </Button>
    </div>
  );
}
