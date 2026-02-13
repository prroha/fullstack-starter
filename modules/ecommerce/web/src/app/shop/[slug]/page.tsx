"use client";

import { useState, useEffect, useCallback, use } from "react";
import { productApi, reviewApi, cartApi } from "@/lib/ecommerce/api";
import { formatPrice } from "@/lib/ecommerce/formatters";
import type { Product, ProductReview, RatingStats } from "@/lib/ecommerce/types";
import ProductImages from "@/components/ecommerce/product-images";
import VariantSelector from "@/components/ecommerce/variant-selector";
import AddToCartButton from "@/components/ecommerce/add-to-cart-button";
import ReviewList from "@/components/ecommerce/review-list";
import ReviewForm from "@/components/ecommerce/review-form";
import PriceDisplay from "@/components/ecommerce/price-display";
import { Rating } from "@/components/ui/rating";

// =============================================================================
// Product Detail Page
// =============================================================================

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productApi.getBySlug(slug);
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load product");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const fetchReviews = useCallback(async (productId: string, page: number) => {
    try {
      const result = await reviewApi.listByProduct(productId, page, 10);
      setReviews(result.items);
      setReviewTotalPages(result.pagination.totalPages);
    } catch {
      // Reviews are non-critical
    }
  }, []);

  const fetchRatingStats = useCallback(async (productId: string) => {
    try {
      const stats = await reviewApi.getRatingStats(productId);
      setRatingStats(stats);
    } catch {
      // Stats are non-critical
    }
  }, []);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (product) {
      fetchReviews(product.id, reviewPage);
      fetchRatingStats(product.id);
    }
  }, [product?.id, reviewPage, fetchReviews, fetchRatingStats]);

  // ---------------------------------------------------------------------------
  // Review submitted callback
  // ---------------------------------------------------------------------------

  const handleReviewSubmitted = useCallback(async (data: { rating: number; comment?: string }) => {
    if (product) {
      try {
        await reviewApi.create({ productId: product.id, rating: data.rating, comment: data.comment });
        fetchReviews(product.id, 1);
        fetchRatingStats(product.id);
        setReviewPage(1);
      } catch (err) {
        console.error('Failed to submit review:', err);
      }
    }
  }, [product, fetchReviews, fetchRatingStats]);

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Skeleton */}
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="aspect-square animate-pulse rounded-lg bg-muted" />
            </div>
            <div className="lg:col-span-5 space-y-4">
              <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-10 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-12 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error / Not Found State
  // ---------------------------------------------------------------------------

  if (error || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">
            {error || "Product not found"}
          </p>
          <button
            onClick={fetchProduct}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
          <div className="mt-4">
            <a
              href="/shop"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Shop
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const images = product.images ?? [];
  const variants = product.variants ?? [];
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;
  const effectivePrice = selectedVariant ? selectedVariant.price : product.price;
  const effectiveStock = selectedVariant ? selectedVariant.stock : product.stock;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <a href="/shop" className="hover:text-foreground transition-colors">
            Shop
          </a>
          <span>/</span>
          <span className="text-foreground">{product.title}</span>
        </nav>

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left: Images */}
          <div className="lg:col-span-7">
            <ProductImages images={images} productTitle={product.title} />
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-5 space-y-6">
            {/* Title */}
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {product.title}
            </h1>

            {/* Rating + Review Count */}
            {product.avgRating !== undefined && (
              <div className="flex items-center gap-2">
                <Rating
                  value={product.avgRating}
                  readOnly
                  allowHalf
                  size="sm"
                  showValue
                />
                {product.reviewCount !== undefined && (
                  <span className="text-sm text-muted-foreground">
                    ({product.reviewCount} review
                    {product.reviewCount !== 1 ? "s" : ""})
                  </span>
                )}
              </div>
            )}

            {/* Price */}
            <PriceDisplay
              price={effectivePrice}
              compareAtPrice={product.compareAtPrice}
              currency={product.currency}
            />

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-muted-foreground">
                {product.shortDescription}
              </p>
            )}

            {/* Variant Selector */}
            {variants.length > 0 && (
              <VariantSelector
                variants={variants}
                selectedVariantId={selectedVariantId}
                onSelect={setSelectedVariantId}
              />
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {effectiveStock > 0 ? (
                <>
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-green-700">
                    {effectiveStock <= product.lowStockThreshold
                      ? `Only ${effectiveStock} left in stock`
                      : "In Stock"}
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-sm text-red-700">Out of Stock</span>
                </>
              )}
            </div>

            {/* Add to Cart */}
            <AddToCartButton
              productId={product.id}
              variantId={selectedVariantId ?? undefined}
              stock={effectiveStock}
              onAdd={async (productId, variantId, quantity) => {
                try {
                  await cartApi.addItem({ productId, variantId, quantity: quantity ?? 1 });
                } catch (err) {
                  console.error('Failed to add to cart:', err);
                }
              }}
            />

            {/* Seller Info */}
            {product.sellerName && (
              <div className="border-t border-border pt-4 text-sm">
                <span className="text-muted-foreground">Sold by </span>
                <span className="font-medium text-foreground">
                  {product.sellerName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Full Description */}
        {product.description && (
          <div className="mt-12 lg:max-w-3xl">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              About This Product
            </h2>
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <p className="whitespace-pre-wrap">{product.description}</p>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-12 lg:max-w-3xl">
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            Customer Reviews
            {ratingStats && ratingStats.total > 0 && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({ratingStats.total} review{ratingStats.total !== 1 ? "s" : ""})
              </span>
            )}
          </h2>

          {/* Review Form */}
          <div className="mb-8">
            <ReviewForm
              productId={product.id}
              onSubmit={handleReviewSubmitted}
            />
          </div>

          {/* Reviews List */}
          <ReviewList
            reviews={reviews}
            ratingStats={ratingStats}
          />

          {/* Review Pagination */}
          {reviewTotalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                disabled={reviewPage <= 1}
                className="rounded-lg border border-input px-4 py-2 text-sm text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {reviewPage} of {reviewTotalPages}
              </span>
              <button
                onClick={() => setReviewPage((p) => Math.min(reviewTotalPages, p + 1))}
                disabled={reviewPage >= reviewTotalPages}
                className="rounded-lg border border-input px-4 py-2 text-sm text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
