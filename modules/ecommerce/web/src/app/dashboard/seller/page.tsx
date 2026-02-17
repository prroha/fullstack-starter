'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { SellerStats as SellerStatsType, EcommerceOrder, ProductReview } from '@/lib/ecommerce/types';
import { sellerApi } from '@/lib/ecommerce/api';
import { formatPrice } from '@/lib/ecommerce/formatters';
import SellerStats from '@/components/ecommerce/seller-stats';
import OrderStatusBadge from '@/components/ecommerce/order-status-badge';
import { Rating } from '@/components/ui/rating';
import { Button } from '@/components/ui/button';

export default function SellerDashboardPage() {
  const [stats, setStats] = useState<SellerStatsType | null>(null);
  const [recentOrders, setRecentOrders] = useState<EcommerceOrder[]>([]);
  const [recentReviews, setRecentReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [statsData, ordersData, reviewsData] = await Promise.all([
          sellerApi.getStats(),
          sellerApi.getRecentOrders(5),
          sellerApi.getRecentReviews(5),
        ]);

        setStats(statsData);
        setRecentOrders(ordersData);
        setRecentReviews(reviewsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 bg-muted rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded-lg" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Seller Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Overview of your products, orders, and revenue.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/seller/products"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Manage Products
          </Link>
          <Link
            href="/dashboard/seller/orders"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-card text-foreground border border-border hover:bg-muted transition-colors"
          >
            View Orders
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && <SellerStats stats={stats} />}

      {/* Content Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
            <Link
              href="/dashboard/seller/orders"
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentOrders.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground">
                No orders yet.
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      #{order.orderNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-sm font-medium text-foreground">
                      {formatPrice(order.totalAmount, order.currency)}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Recent Reviews</h2>
          </div>
          <div className="divide-y divide-border">
            {recentReviews.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground">
                No reviews yet.
              </div>
            ) : (
              recentReviews.map((review) => (
                <div key={review.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {review.userName || 'Anonymous'}
                    </p>
                    <Rating value={review.rating} readOnly size="sm" />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
