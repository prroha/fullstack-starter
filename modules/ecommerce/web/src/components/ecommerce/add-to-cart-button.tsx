'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddToCartButtonProps {
  productId: string;
  variantId?: string;
  stock: number;
  onAdd: (productId: string, variantId?: string, quantity?: number) => void | Promise<void>;
}

export default function AddToCartButton({
  productId,
  variantId,
  stock,
  onAdd,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const outOfStock = stock === 0;

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(stock, prev + 1));
  };

  const handleAdd = async () => {
    setLoading(true);
    try {
      await onAdd(productId, variantId, quantity);
    } finally {
      setLoading(false);
    }
  };

  if (outOfStock) {
    return (
      <Button variant="secondary" disabled className="w-full">
        Out of Stock
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Quantity controls */}
      <div className="flex items-center">
        <Label className="mr-3">Qty</Label>
        <div className="flex items-center overflow-hidden rounded-lg border border-gray-300">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleDecrement}
            disabled={quantity <= 1}
            className="h-10 w-10 rounded-none border-0"
            aria-label="Decrease quantity"
          >
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
                d="M20 12H4"
              />
            </svg>
          </Button>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1 && val <= stock) setQuantity(val);
            }}
            min={1}
            max={stock}
            className="h-10 w-12 rounded-none border-x border-y-0 border-gray-300 text-center text-sm font-medium [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            aria-label="Quantity"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleIncrement}
            disabled={quantity >= stock}
            className="h-10 w-10 rounded-none border-0"
            aria-label="Increase quantity"
          >
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </Button>
        </div>
      </div>

      {/* Add to Cart button */}
      <Button
        type="button"
        onClick={handleAdd}
        isLoading={loading}
        className="w-full gap-2"
      >
        {!loading && (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
            />
          </svg>
        )}
        {loading ? 'Adding...' : 'Add to Cart'}
      </Button>
    </div>
  );
}
