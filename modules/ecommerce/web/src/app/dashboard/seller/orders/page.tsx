'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import type { EcommerceOrder } from '@/lib/ecommerce/types';
import { sellerApi } from '@/lib/ecommerce/api';
import { formatPrice } from '@/lib/ecommerce/formatters';
import OrderStatusBadge from '@/components/ecommerce/order-status-badge';
import { Pagination } from '@/components/ui/pagination';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<EcommerceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sellerApi.getOrders(page);
      setOrders(response.items);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  function toggleExpand(orderId: string) {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h2 className="text-destructive font-semibold text-lg">Error</h2>
          <p className="text-destructive mt-1">{error}</p>
          <Button
            variant="destructive"
            onClick={() => window.location.reload()}
            className="mt-3"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Orders</h1>
        <p className="mt-1 text-muted-foreground">
          Manage orders for your products.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Orders table */}
      {orders.length === 0 ? (
        <div className="text-center py-10 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground text-lg">No orders yet.</p>
          <p className="text-muted-foreground text-sm mt-2">
            Orders will appear here once customers purchase your products.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const itemCount = order.items?.length || 0;

              return (
                <Fragment key={order.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <TableCell>
                      <span className="text-sm font-medium text-foreground">
                        #{order.orderNumber}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground font-mono">
                        {order.userId.slice(0, 8)}...
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-foreground text-right">
                      {itemCount}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground text-right">
                      {formatPrice(order.totalAmount, order.currency)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(order.id);
                        }}
                      >
                        {isExpanded ? 'Hide' : 'Show'}
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Expanded detail row */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted">
                        <div className="space-y-4">
                          {/* Order items */}
                          {order.items && order.items.length > 0 ? (
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-2">
                                Order Items
                              </h4>
                              <div className="space-y-2">
                                {order.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between bg-card rounded-lg border border-border px-4 py-3"
                                  >
                                    <div>
                                      <p className="text-sm font-medium text-foreground">
                                        {item.productTitle}
                                      </p>
                                      {item.variantName && (
                                        <p className="text-xs text-muted-foreground">
                                          Variant: {item.variantName}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm text-foreground">
                                        {item.quantity} x {formatPrice(item.unitPrice, order.currency)}
                                      </p>
                                      <p className="text-sm font-medium text-foreground">
                                        {formatPrice(item.totalPrice, order.currency)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No item details available.</p>
                          )}

                          {/* Order summary row */}
                          <div className="flex items-center justify-between text-sm border-t border-border pt-3">
                            <div className="space-x-6 text-muted-foreground">
                              <span>Subtotal: {formatPrice(order.subtotal, order.currency)}</span>
                              <span>Shipping: {formatPrice(order.shippingCost, order.currency)}</span>
                              <span>Tax: {formatPrice(order.taxAmount, order.currency)}</span>
                            </div>
                            <span className="font-semibold text-foreground">
                              Total: {formatPrice(order.totalAmount, order.currency)}
                            </span>
                          </div>

                          {/* Notes */}
                          {order.notes && (
                            <div className="border-t border-border pt-3">
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Notes</p>
                              <p className="text-sm text-muted-foreground">{order.notes}</p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
