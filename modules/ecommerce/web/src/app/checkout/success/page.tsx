"use client";

import { useState, useEffect, useCallback, use } from "react";
import { orderApi } from "@/lib/ecommerce/api";
import { formatPrice } from "@/lib/ecommerce/formatters";
import type { EcommerceOrder } from "@/lib/ecommerce/types";
import OrderStatusBadge from "@/components/ecommerce/order-status-badge";

// =============================================================================
// Order Confirmation Page
// =============================================================================

export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = use(searchParams);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [order, setOrder] = useState<EcommerceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setError("No order ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await orderApi.getById(orderId);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="space-y-6 text-center">
            <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-muted" />
            <div className="mx-auto h-8 w-64 animate-pulse rounded bg-muted" />
            <div className="mx-auto h-4 w-48 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">
            {error || "Order not found"}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <a
              href="/shop"
              className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Continue Shopping
            </a>
            <a
              href="/dashboard/orders"
              className="rounded-lg border border-input px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              View My Orders
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const items = order.items ?? [];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Success Icon */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Order Confirmed!
          </h1>
          <p className="mt-2 text-muted-foreground">
            Thank you for your purchase. Your order has been placed successfully.
          </p>
        </div>

        {/* Order Info */}
        <div className="mt-10 rounded-lg border border-border bg-card p-6">
          {/* Order Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="text-lg font-semibold text-foreground">
                {order.orderNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="text-sm font-medium text-foreground">
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Items Table */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-foreground">Items</h3>
            <div className="mt-3 divide-y divide-border">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {item.productTitle}
                    </p>
                    {item.variantName && (
                      <p className="text-sm text-muted-foreground">
                        {item.variantName}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.unitPrice, order.currency)} x{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <span className="ml-4 font-medium text-foreground">
                    {formatPrice(item.totalPrice, order.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Totals */}
          <div className="mt-4 space-y-2 border-t border-border pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">
                {formatPrice(order.subtotal, order.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-foreground">
                {order.shippingCost === 0
                  ? "Free"
                  : formatPrice(order.shippingCost, order.currency)}
              </span>
            </div>
            {order.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="text-foreground">
                  {formatPrice(order.taxAmount, order.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">
                {formatPrice(order.totalAmount, order.currency)}
              </span>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">
                Shipping Address
              </h3>
              <div className="mt-2 text-sm text-muted-foreground">
                <p>
                  {order.shippingAddress.firstName}{" "}
                  {order.shippingAddress.lastName}
                </p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && (
                  <p>{order.shippingAddress.line2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && (
                  <p className="mt-1">{order.shippingAddress.phone}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Links */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <a
            href="/shop"
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Continue Shopping
          </a>
          <a
            href="/dashboard/orders"
            className="rounded-lg border border-input px-6 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            View My Orders
          </a>
        </div>
      </div>
    </div>
  );
}
