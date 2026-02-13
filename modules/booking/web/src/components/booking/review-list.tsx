"use client";

import { Rating } from "@/components/ui/rating";
import { Avatar } from "@/components/ui/avatar";
import type { BookingReview } from "@/lib/booking/types";
import { formatDate } from "@/lib/booking/formatters";

interface ReviewListProps {
  reviews: BookingReview[];
}

export default function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-6 text-center">
        No reviews yet. Be the first to leave a review.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {reviews.map((review, index) => (
        <div
          key={review.id}
          className={index < reviews.length - 1 ? "border-b border-border pb-4 mb-4" : "pb-2"}
        >
          <div className="flex items-start gap-3">
            <Avatar name={review.userName ?? "Anonymous"} size="sm" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground text-sm">
                  {review.userName ?? "Anonymous"}
                </span>
                <span className="text-muted-foreground text-sm">
                  {formatDate(review.createdAt)}
                </span>
              </div>
              <Rating value={review.rating} readOnly size="sm" />
              {review.comment && (
                <p className="text-foreground text-sm mt-1">{review.comment}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
