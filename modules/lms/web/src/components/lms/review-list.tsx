'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Review } from '../../lib/lms/types';
import { Rating } from '@/components/ui/rating';

interface ReviewListProps {
  reviews: Review[];
  averageRating: number;
  totalCount: number;
}

const REVIEWS_PER_PAGE = 5;

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-muted-foreground text-right">{star}</span>
      <svg
        className="w-3.5 h-3.5 text-amber-400 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" />
      </svg>
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="bg-amber-400 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-muted-foreground text-right">{count}</span>
    </div>
  );
}

export default function ReviewList({
  reviews,
  averageRating,
  totalCount,
}: ReviewListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  const paginatedReviews = reviews.slice(
    startIndex,
    startIndex + REVIEWS_PER_PAGE
  );

  // Calculate rating distribution from available reviews
  const distribution = [0, 0, 0, 0, 0];
  reviews.forEach((review) => {
    const idx = Math.min(4, Math.max(0, Math.round(review.rating) - 1));
    distribution[idx]++;
  });

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function getUserInitials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return (
    <div className="w-full max-w-3xl">
      {/* Average rating summary */}
      <div className="bg-muted/50 border border-border rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Score display */}
          <div className="text-center sm:text-left">
            <p className="text-4xl font-bold text-foreground">
              {averageRating.toFixed(1)}
            </p>
            <div className="mt-1">
              <Rating value={averageRating} readOnly allowHalf size="md" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalCount} {totalCount === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* Rating bars */}
          <div className="flex-1 w-full space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => (
              <RatingBar
                key={star}
                star={star}
                count={distribution[star - 1]}
                total={reviews.length}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
            />
          </svg>
          <p className="text-muted-foreground text-sm">No reviews yet.</p>
          <p className="text-muted-foreground/70 text-xs mt-1">
            Be the first to leave a review!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedReviews.map((review) => (
            <div
              key={review.id}
              className="bg-card border border-border rounded-lg p-5"
            >
              <div className="flex items-start gap-3">
                {/* User avatar */}
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-indigo-600">
                    {getUserInitials(review.userName)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Name and date */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {review.userName || 'Anonymous'}
                    </p>
                    <time className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDate(review.createdAt)}
                    </time>
                  </div>

                  {/* Stars */}
                  <div className="mt-1">
                    <Rating value={review.rating} readOnly allowHalf size="sm" />
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-
            {Math.min(startIndex + REVIEWS_PER_PAGE, reviews.length)} of{' '}
            {reviews.length}
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
