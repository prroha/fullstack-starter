"use client";

import { useState, useEffect, useCallback } from "react";
import { cartApi } from "@/lib/ecommerce/api";
import { formatPrice } from "@/lib/ecommerce/formatters";
import type { Cart } from "@/lib/ecommerce/types";
import CartItemRow from "@/components/ecommerce/cart-item";
import CartSummary from "@/components/ecommerce/cart-summary";

// =============================================================================
// Shopping Cart Page
// =============================================================================

export default function CartPage() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cartApi.get();
      setCart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleUpdateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      try {
        const updatedCart = await cartApi.updateQuantity(itemId, quantity);
        setCart(updatedCart);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update quantity",
        );
      }
    },
    [],
  );

  const handleRemove = useCallback(
    async (itemId: string) => {
      try {
        const updatedCart = await cartApi.removeItem(itemId);
        setCart(updatedCart);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to remove item",
        );
      }
    },
    [],
  );

  const handleClear = useCallback(async () => {
    try {
      await cartApi.clear();
      setCart(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear cart");
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-8 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
            <div className="lg:col-span-4">
              <div className="h-48 animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const items = cart?.items ?? [];
  const isEmpty = items.length === 0;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Shopping Cart
          </h1>
          {!isEmpty && (
            <button
              onClick={handleClear}
              className="text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {isEmpty && !error && (
          <div className="py-20 text-center">
            <svg
              className="mx-auto h-16 w-16 text-muted-foreground/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
              />
            </svg>
            <p className="mt-4 text-lg font-medium text-foreground">
              Your cart is empty
            </p>
            <p className="mt-2 text-muted-foreground">
              Looks like you have not added anything to your cart yet.
            </p>
            <a
              href="/shop"
              className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Continue Shopping
            </a>
          </div>
        )}

        {/* Cart Content */}
        {!isEmpty && (
          <div className="mt-8 grid gap-8 lg:grid-cols-12">
            {/* Cart Items */}
            <div className="lg:col-span-8">
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemove}
                  />
                ))}
              </div>

              {/* Continue Shopping Link */}
              <div className="mt-6">
                <a
                  href="/shop"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  &larr; Continue Shopping
                </a>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <CartSummary items={cart!.items} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
