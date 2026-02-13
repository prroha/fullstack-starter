'use client';

import { formatPrice } from '../../lib/ecommerce/formatters';

interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number | null;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
} as const;

const compareSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
} as const;

export default function PriceDisplay({
  price,
  compareAtPrice,
  currency,
  size = 'md',
}: PriceDisplayProps) {
  const hasDiscount =
    compareAtPrice != null && compareAtPrice > price;
  const discountPercent = hasDiscount
    ? Math.round((1 - price / compareAtPrice!) * 100)
    : 0;

  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      {/* Current price */}
      <span className={`font-bold text-foreground ${sizeClasses[size]}`}>
        {formatPrice(price, currency)}
      </span>

      {/* Original price with line-through */}
      {hasDiscount && (
        <>
          <span
            className={`line-through text-muted-foreground ${compareSizeClasses[size]}`}
          >
            {formatPrice(compareAtPrice!, currency)}
          </span>
          <span className="bg-red-100 text-red-700 text-xs font-medium rounded px-1.5 py-0.5">
            Sale
          </span>
          <span className="text-xs text-red-600 font-medium">
            {discountPercent}% off
          </span>
        </>
      )}
    </div>
  );
}
