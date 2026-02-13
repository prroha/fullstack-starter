'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { SellerStats as SellerStatsType, EcommerceOrder, ProductReview } from '@/lib/ecommerce/types';
import { sellerApi } from '@/lib/ecommerce/api';
import { formatPrice } from '@/lib/ecommerce/formatters';
import SellerStats from '@/components/ecommerce/seller-stats';
import OrderStatusBadge from '@/components/ecommerce/order-status-badge';
import { Rating } from '@/components/ui/rating';

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
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-64 bg-gray-200 rounded-lg" />
            <div className="h-64 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold text-lg">Error</h2>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Overview of your products, orders, and revenue.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/seller/products"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Manage Products
          </Link>
          <Link
            href="/dashboard/seller/orders"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            View Orders
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && <SellerStats stats={stats} />}

      {/* Content Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link
              href="/dashboard/seller/orders"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentOrders.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No orders yet.
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      #{order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-sm font-medium text-gray-900">
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentReviews.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No reviews yet.
              </div>
            ) : (
              recentReviews.map((review) => (
                <div key={review.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {review.userName || 'Anonymous'}
                    </p>
                    <Rating value={review.rating} readOnly size="sm" />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
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
