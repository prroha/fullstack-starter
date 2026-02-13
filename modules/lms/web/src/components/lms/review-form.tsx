'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/feedback/alert';
import { Rating } from '@/components/ui/rating';
import type { Review, ReviewCreateInput } from '../../lib/lms/types';

interface ReviewFormProps {
  courseId: string;
  existingReview?: Review | null;
  onSubmit: (data: ReviewCreateInput) => Promise<void> | void;
}

export default function ReviewForm({
  courseId,
  existingReview,
  onSubmit,
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isEditing = !!existingReview;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccess(false);

      if (rating === 0) {
        setError('Please select a rating.');
        return;
      }

      setSubmitting(true);
      try {
        await onSubmit({
          courseId,
          rating,
          comment: comment.trim() || undefined,
        });
        setSuccess(true);
        if (!isEditing) {
          setRating(0);
          setComment('');
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to submit review.'
        );
      } finally {
        setSubmitting(false);
      }
    },
    [courseId, rating, comment, isEditing, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {isEditing ? 'Edit Your Review' : 'Write a Review'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isEditing
            ? 'Update your rating and comments below.'
            : 'Share your experience with this course.'}
        </p>
      </div>

      {/* Star rating input */}
      <div>
        <Label className="mb-2">Rating</Label>
        <Rating value={rating} onChange={setRating} size="lg" showValue />
      </div>

      {/* Comment textarea */}
      <div>
        <Label htmlFor="review-comment" className="mb-2">
          Comment{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell others about your experience with this course..."
          rows={4}
          maxLength={2000}
          showCharacterCount
        />
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive">{error}</Alert>
      )}

      {/* Success message */}
      {success && (
        <Alert variant="success">
          {isEditing
            ? 'Your review has been updated!'
            : 'Thank you for your review!'}
        </Alert>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        disabled={rating === 0}
        isLoading={submitting}
        className="w-full"
      >
        {isEditing ? 'Update Review' : 'Submit Review'}
      </Button>
    </form>
  );
}
