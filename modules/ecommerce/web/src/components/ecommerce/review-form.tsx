'use client';

import { useState, useCallback } from 'react';
import { Rating } from '@/components/ui/rating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ReviewFormProps {
  productId: string;
  onSubmit: (data: { rating: number; comment?: string }) => void | Promise<void>;
  initialRating?: number;
  initialComment?: string;
}

export default function ReviewForm({
  productId: _productId,
  onSubmit,
  initialRating = 0,
  initialComment = '',
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (rating === 0) {
        setError('Please select a rating before submitting.');
        return;
      }

      setLoading(true);
      try {
        await onSubmit({
          rating,
          comment: comment.trim() || undefined,
        });
        setRating(0);
        setComment('');
      } catch {
        setError('Failed to submit review. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [rating, comment, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4">
      {/* Star rating input */}
      <div>
        <Label className="mb-2 block">
          Rating
        </Label>
        <Rating
          value={rating}
          onChange={setRating}
          size="lg"
          aria-label="Rate this product"
        />
      </div>

      {/* Comment textarea */}
      <div>
        <Label htmlFor="review-comment" className="mb-2 block">
          Comment{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={4}
          className="resize-y"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <svg
            className="w-4 h-4 text-red-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        disabled={rating === 0}
        isLoading={loading}
        className="w-full"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
}
