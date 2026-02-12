'use client';

import { useState } from 'react';
import type { Course, Enrollment } from '../../lib/lms/types';
import { formatPrice } from '../../lib/lms/formatters';

interface EnrollmentButtonProps {
  course: Course;
  enrollment?: Enrollment | null;
  onEnroll: (courseId: string) => Promise<void> | void;
  onContinue: (courseId: string) => void;
}

export default function EnrollmentButton({
  course,
  enrollment,
  onEnroll,
  onContinue,
}: EnrollmentButtonProps) {
  const [loading, setLoading] = useState(false);

  const isFree = course.price === 0;
  const hasEnrollment = !!enrollment;
  const status = enrollment?.status;
  const progress = enrollment?.progress ?? 0;

  async function handleEnroll() {
    setLoading(true);
    try {
      await onEnroll(course.id);
    } finally {
      setLoading(false);
    }
  }

  function handleContinue() {
    onContinue(course.id);
  }

  // Completed enrollment
  if (hasEnrollment && status === 'COMPLETED') {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleContinue}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          <svg
            className="w-5 h-5"
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
          Completed
        </button>
        {/* Progress bar */}
        <div className="w-full bg-green-100 rounded-full h-1.5">
          <div
            className="bg-green-500 h-1.5 rounded-full"
            style={{ width: '100%' }}
          />
        </div>
        <p className="text-xs text-center text-green-600 font-medium">
          Course completed - Review anytime
        </p>
      </div>
    );
  }

  // Active enrollment
  if (hasEnrollment && status === 'ACTIVE') {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleContinue}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
            />
          </svg>
          Continue Learning
        </button>
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        <p className="text-xs text-center text-gray-500">
          {Math.round(progress)}% complete
        </p>
      </div>
    );
  }

  // Not enrolled, paid course
  if (!isFree && !hasEnrollment) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleEnroll}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <svg
              className="w-5 h-5 animate-spin"
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
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
              />
            </svg>
          )}
          {loading ? 'Processing...' : 'Buy Course'}
        </button>

        {/* Price display */}
        <div className="text-center">
          <span className="text-2xl font-bold text-gray-900">
            {formatPrice(course.price, course.currency)}
          </span>
          {course.compareAtPrice && course.compareAtPrice > course.price && (
            <span className="ml-2 text-sm text-gray-400 line-through">
              {formatPrice(course.compareAtPrice, course.currency)}
            </span>
          )}
        </div>

        {course.compareAtPrice && course.compareAtPrice > course.price && (
          <p className="text-xs text-center text-green-600 font-medium">
            Save{' '}
            {Math.round(
              ((course.compareAtPrice - course.price) /
                course.compareAtPrice) *
                100
            )}
            % off
          </p>
        )}
      </div>
    );
  }

  // Not enrolled, free course (default)
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleEnroll}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <svg
            className="w-5 h-5 animate-spin"
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
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        )}
        {loading ? 'Enrolling...' : 'Enroll Now'}
      </button>
      <p className="text-xs text-center text-gray-500">
        Free course - Start learning immediately
      </p>
    </div>
  );
}
