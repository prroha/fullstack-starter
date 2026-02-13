"use client";

import { useState } from "react";
import { Rating } from "@/components/ui/rating";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/feedback/alert";
import type { ReviewCreateInput, BookingReview } from "@/lib/booking/types";

interface ReviewFormProps {
  serviceId: string;
  providerId: string;
  existingReview?: BookingReview | null;
  onSubmit: (data: ReviewCreateInput) => Promise<void> | void;
}

export default function ReviewForm({
  serviceId,
  providerId,
  existingReview,
  onSubmit,
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditing = !!existingReview;

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const data: ReviewCreateInput = {
        serviceId,
        providerId,
        rating,
        comment: comment.trim() || undefined,
      };
      await onSubmit(data);
      setSuccess(
        isEditing
          ? "Review updated successfully."
          : "Review submitted successfully."
      );
      if (!isEditing) {
        setRating(0);
        setComment("");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit review."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" title="Error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" title="Success" onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Rating</Label>
        <Rating
          value={rating}
          onChange={setRating}
          max={5}
          showValue
          size="md"
          aria-label="Service rating"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-comment">Comment</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          rows={4}
          maxLength={2000}
          showCharacterCount
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          isLoading={isSubmitting}
          disabled={rating === 0}
        >
          {isEditing ? "Update Review" : "Submit Review"}
        </Button>
      </div>
    </div>
  );
}
