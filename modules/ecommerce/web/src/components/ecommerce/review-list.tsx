'use client';

import type { ProductReview, RatingStats } from '../../lib/ecommerce/types';
import { Rating } from '@/components/ui/rating';
import { Skeleton } from '@/components/ui/skeleton';

interface ReviewListProps {
  reviews: ProductReview[];
  ratingStats?: RatingStats;
  loading?: boolean;
}

function RatingBar({
  star,
  count,
  total,
}: {
  star: number;
  count: number;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-muted-foreground text-right">{star}</span>
      <svg
        className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-muted-foreground text-right">{count}</span>
    </div>
  );
}

function SkeletonReviewItem() {
  return (
    <div className="border border-border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ReviewList({
  reviews,
  ratingStats,
  loading = false,
}: ReviewListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonReviewItem />
        <SkeletonReviewItem />
        <SkeletonReviewItem />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Rating distribution bar chart */}
      {ratingStats && (
        <div className="bg-muted/50 border border-border rounded-lg p-5 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Average score */}
            <div className="text-center sm:text-left">
              <p className="text-4xl font-bold text-foreground">
                {ratingStats.average.toFixed(1)}
              </p>
              <div className="mt-1">
                <Rating
                  value={ratingStats.average}
                  readOnly
                  allowHalf
                  size="sm"
                />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {ratingStats.total}{' '}
                {ratingStats.total === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Distribution bars */}
            <div className="flex-1 w-full space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => (
                <RatingBar
                  key={star}
                  star={star}
                  count={ratingStats.distribution[star] ?? 0}
                  total={ratingStats.total}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Review items */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">No reviews yet.</p>
          <p className="text-muted-foreground/70 text-xs mt-1">
            Be the first to leave a review!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {review.userName || 'Anonymous'}
                </span>
                <time className="text-xs text-muted-foreground flex-shrink-0">
                  {formatDate(review.createdAt)}
                </time>
              </div>
              <div className="mt-1">
                <Rating value={review.rating} readOnly size="sm" />
              </div>
              {review.comment && (
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
