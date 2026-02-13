'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Product, ProductStatus } from '@/lib/ecommerce/types';
import { sellerApi, productApi } from '@/lib/ecommerce/api';
import { formatPrice } from '@/lib/ecommerce/formatters';
import { Badge } from '@/components/ui/badge';
import type { BadgeProps } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

const STATUS_VARIANTS: Record<ProductStatus, BadgeProps['variant']> = {
  DRAFT: 'outline',
  ACTIVE: 'success',
  ARCHIVED: 'warning',
};

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sellerApi.getProducts(page, 20);
      setProducts(response.items);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  async function handleDelete(productId: string, productTitle: string) {
    if (!window.confirm(`Are you sure you want to delete "${productTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(productId);
      await productApi.delete(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setDeleting(null);
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between">
            <div className="h-8 w-40 bg-gray-200 rounded" />
            <div className="h-10 w-32 bg-gray-200 rounded-lg" />
          </div>
          <div className="h-96 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
          <p className="mt-1 text-gray-600">
            Manage your product catalog.
          </p>
        </div>
        <Link
          href="/dashboard/seller/products/new"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Product
        </Link>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Product List */}
      {products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">
            No products yet. Create your first product!
          </p>
          <Link
            href="/dashboard/seller/products/new"
            className="inline-block mt-4 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Product
          </Link>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].url}
                        alt={product.images[0].altText || product.title}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-400 text-xs">IMG</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {product.title}
                      </p>
                      {product.sku && (
                        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <span className="text-sm text-gray-900">
                      {formatPrice(product.price, product.currency)}
                    </span>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="ml-2 text-xs text-gray-400 line-through">
                        {formatPrice(product.compareAtPrice, product.currency)}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`text-sm ${
                      product.stock <= product.lowStockThreshold
                        ? 'text-red-600 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {product.stock}
                  </span>
                  {product.stock <= product.lowStockThreshold && product.stock > 0 && (
                    <span className="ml-1 text-xs text-red-500">Low</span>
                  )}
                  {product.stock === 0 && (
                    <span className="ml-1 text-xs text-red-600">Out of stock</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[product.status]}>
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/dashboard/seller/products/${product.id}`}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit
                  </Link>
                  <span className="mx-2 text-gray-300">|</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(product.id, product.title)}
                    isLoading={deleting === product.id}
                  >
                    {deleting === product.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
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
