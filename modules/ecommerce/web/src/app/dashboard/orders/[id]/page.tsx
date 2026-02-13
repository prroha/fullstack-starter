'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import type { EcommerceOrder, EcommerceOrderStatus } from '@/lib/ecommerce/types';
import { customerApi, orderApi } from '@/lib/ecommerce/api';
import { formatPrice, formatOrderStatus } from '@/lib/ecommerce/formatters';
import OrderStatusBadge from '@/components/ecommerce/order-status-badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

const ORDER_TIMELINE_STEPS: EcommerceOrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];

function getStepIndex(status: EcommerceOrderStatus): number {
  const idx = ORDER_TIMELINE_STEPS.indexOf(status);
  return idx >= 0 ? idx : -1;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [order, setOrder] = useState<EcommerceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerApi.getOrderById(id);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  async function handleCancel() {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      setCancelling(true);
      await orderApi.cancel(id);
      await fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-48 bg-muted rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-40 bg-muted rounded-lg" />
            <div className="h-40 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !order) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold text-lg">Error</h2>
          <p className="text-red-600 mt-1">{error}</p>
          <Button asChild variant="secondary" size="sm" className="mt-3">
            <Link href="/dashboard/orders">Back to Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const currentStepIndex = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const isRefunded = order.status === 'REFUNDED';
  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Orders
      </Link>

      {/* Order header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Order #{order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancel}
              isLoading={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Order status timeline */}
      {!isCancelled && !isRefunded && (
        <div className="bg-card rounded-lg border border-border p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-6">Order Status</h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />

            <div className="space-y-6">
              {ORDER_TIMELINE_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div key={step} className="relative flex items-start gap-4 pl-0">
                    {/* Circle */}
                    <div
                      className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        isCompleted
                          ? 'bg-green-500 border-green-500'
                          : 'bg-card border-border'
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                      )}
                    </div>

                    {/* Label */}
                    <div className="pt-1">
                      <p
                        className={`text-sm font-medium ${
                          isCurrent
                            ? 'text-green-700'
                            : isCompleted
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {formatOrderStatus(step)}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-green-600 mt-0.5">Current status</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Cancelled / Refunded notice */}
      {(isCancelled || isRefunded) && (
        <div className={`rounded-lg p-4 mb-8 ${isCancelled ? 'bg-muted border border-border' : 'bg-red-50 border border-red-200'}`}>
          <p className={`font-medium ${isCancelled ? 'text-foreground' : 'text-red-700'}`}>
            This order has been {isCancelled ? 'cancelled' : 'refunded'}.
          </p>
        </div>
      )}

      {/* Order items table */}
      <div className="bg-card rounded-lg border border-border mb-8">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Items</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items && order.items.length > 0 ? (
              order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/shop/${item.productSlug}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {item.productTitle}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.variantName || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground text-right">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground text-right">
                    {formatPrice(item.unitPrice, order.currency)}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground text-right">
                    {formatPrice(item.totalPrice, order.currency)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order totals */}
      <div className="bg-card rounded-lg border border-border p-6 mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Order Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">{formatPrice(order.subtotal, order.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="text-foreground">{formatPrice(order.shippingCost, order.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span className="text-foreground">{formatPrice(order.taxAmount, order.currency)}</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between">
            <span className="text-base font-semibold text-foreground">Total</span>
            <span className="text-base font-semibold text-foreground">
              {formatPrice(order.totalAmount, order.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {/* Shipping address */}
        {order.shippingAddress && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Shipping Address</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && <p>Phone: {order.shippingAddress.phone}</p>}
            </div>
          </div>
        )}

        {/* Billing address */}
        {order.billingAddress && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Billing Address</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">
                {order.billingAddress.firstName} {order.billingAddress.lastName}
              </p>
              <p>{order.billingAddress.line1}</p>
              {order.billingAddress.line2 && <p>{order.billingAddress.line2}</p>}
              <p>
                {order.billingAddress.city}, {order.billingAddress.state}{' '}
                {order.billingAddress.postalCode}
              </p>
              <p>{order.billingAddress.country}</p>
              {order.billingAddress.phone && <p>Phone: {order.billingAddress.phone}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Notes</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
