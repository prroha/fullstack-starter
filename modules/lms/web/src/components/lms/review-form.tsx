'use client';

import { useState, useCallback } from 'react';
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
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isEditing = !!existingReview;
  const displayRating = hoveredStar || rating;

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

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
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {isEditing ? 'Edit Your Review' : 'Write a Review'}
        </h3>
        <p className="text-sm text-gray-500">
          {isEditing
            ? 'Update your rating and comments below.'
            : 'Share your experience with this course.'}
        </p>
      </div>

      {/* Star rating input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="p-0.5 focus:outline-none focus:ring-2 focus:ring-amber-300 rounded transition-transform hover:scale-110"
              aria-label={`Rate ${star} out of 5`}
            >
              <svg
                className={`w-8 h-8 transition-colors ${
                  star <= displayRating
                    ? 'text-amber-400'
                    : 'text-gray-200'
                }`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" />
              </svg>
            </button>
          ))}
          {displayRating > 0 && (
            <span className="ml-2 text-sm text-gray-600 font-medium">
              {ratingLabels[displayRating]}
            </span>
          )}
        </div>
      </div>

      {/* Comment textarea */}
      <div>
        <label
          htmlFor="review-comment"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Comment{' '}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell others about your experience with this course..."
          rows={4}
          maxLength={2000}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y transition-shadow"
        />
        <p className="mt-1 text-xs text-gray-400 text-right">
          {comment.length} / 2000
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
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

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <svg
            className="w-4 h-4 text-green-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          <p className="text-sm text-green-700">
            {isEditing
              ? 'Your review has been updated!'
              : 'Thank you for your review!'}
          </p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Submitting...
          </>
        ) : isEditing ? (
          'Update Review'
        ) : (
          'Submit Review'
        )}
      </button>
    </form>
  );
}
