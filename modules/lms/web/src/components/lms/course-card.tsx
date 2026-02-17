'use client';

import { useState } from 'react';
import type { Course } from '../../lib/lms/types';
import { formatDuration, formatPrice, getLevelColor } from '../../lib/lms/formatters';
import { Rating } from '@/components/ui/rating';

interface CourseCardProps {
  course: Course;
  onClick?: (course: Course) => void;
}

export default function CourseCard({ course, onClick }: CourseCardProps) {
  const [imgError, setImgError] = useState(false);

  const handleClick = () => {
    onClick?.(course);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(course);
    }
  };

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `View course: ${course.title}` : undefined}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {course.thumbnailUrl && !imgError ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <svg
              className="h-12 w-12 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        )}

        {/* Free badge */}
        {course.price === 0 && (
          <span className="absolute top-2 left-2 rounded bg-success px-2 py-0.5 text-xs font-semibold text-success-foreground">
            Free
          </span>
        )}

        {/* Featured badge */}
        {course.isFeatured && (
          <span className="absolute top-2 right-2 rounded bg-warning px-2 py-0.5 text-xs font-semibold text-warning-foreground">
            Featured
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Level badge and duration */}
        <div className="mb-2 flex items-center justify-between">
          {course.level && (
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getLevelColor(
                course.level,
              )}`}
            >
              {course.level}
            </span>
          )}
          {course.duration > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formatDuration(course.duration)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
          {course.title}
        </h3>

        {/* Instructor */}
        {course.instructorName && (
          <p className="mb-2 text-xs text-muted-foreground">
            {course.instructorName}
          </p>
        )}

        {/* Rating */}
        <div className="mb-3 flex items-center gap-1">
          <Rating
            value={course.avgRating ?? 0}
            readOnly
            allowHalf
            size="sm"
            showValue
          />
          {(course.reviewCount ?? 0) > 0 && (
            <span className="text-sm text-muted-foreground">
              ({(course.reviewCount ?? 0).toLocaleString()})
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {formatPrice(course.price, course.currency)}
          </span>
          {course.compareAtPrice != null && course.compareAtPrice > course.price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(course.compareAtPrice, course.currency)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
