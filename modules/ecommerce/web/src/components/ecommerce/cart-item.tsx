'use client';

import { useState } from 'react';
import type { CartItem as CartItemType } from '../../lib/ecommerce/types';
import { formatPrice } from '../../lib/ecommerce/formatters';
import { Button } from '@/components/ui/button';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const [imgError, setImgError] = useState(false);

  const unitPrice = item.variant?.price || item.product?.price || 0;
  const lineTotal = item.quantity * unitPrice;
  const currency = item.product?.currency;
  const primaryImage = item.product?.images?.[0];

  return (
    <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
      {/* Product image */}
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
        {primaryImage && !imgError ? (
          <img
            src={primaryImage.url}
            alt={primaryImage.altText || item.product?.title || 'Product'}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="flex flex-1 flex-col gap-1">
        <h4 className="text-sm font-medium text-foreground">
          {item.product?.title || 'Product'}
        </h4>
        {item.variant?.name && (
          <p className="text-xs text-muted-foreground">{item.variant.name}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {formatPrice(unitPrice, currency)}
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center overflow-hidden rounded-md border border-border">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() =>
            onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
          }
          disabled={item.quantity <= 1}
          className="h-8 w-8 rounded-none border-0"
          aria-label="Decrease quantity"
        >
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </Button>
        <span className="flex h-8 w-8 items-center justify-center border-x border-border text-xs font-medium text-foreground">
          {item.quantity}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          className="h-8 w-8 rounded-none border-0"
          aria-label="Increase quantity"
        >
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </Button>
      </div>

      {/* Line total */}
      <div className="w-20 text-right">
        <span className="text-sm font-semibold text-foreground">
          {formatPrice(lineTotal, currency)}
        </span>
      </div>

      {/* Remove button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(item.id)}
        className="flex-shrink-0 text-muted-foreground hover:text-destructive"
        aria-label="Remove item"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </Button>
    </div>
  );
}
