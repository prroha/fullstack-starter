'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { Course } from '../../lib/lms/types';
import CourseCard from './course-card';

interface CourseGridProps {
  courses: Course[];
  loading?: boolean;
  onCourseClick?: (course: Course) => void;
  emptyMessage?: string;
}

function CourseCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm animate-pulse">
      {/* Thumbnail skeleton */}
      <Skeleton className="aspect-video w-full rounded-none" />

      {/* Content skeleton */}
      <div className="flex flex-1 flex-col p-4">
        {/* Level and duration */}
        <div className="mb-2 flex items-center justify-between">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-12" />
        </div>

        {/* Title */}
        <div className="mb-1 space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Instructor */}
        <div className="mb-2 mt-1">
          <Skeleton className="h-3 w-24" />
        </div>

        {/* Rating */}
        <div className="mb-3 flex items-center gap-1">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-4 w-4" />
            ))}
          </div>
          <Skeleton className="h-3 w-8" />
        </div>

        <div className="flex-1" />

        {/* Price */}
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}

export default function CourseGrid({
  courses,
  loading = false,
  onCourseClick,
  emptyMessage = 'No courses found.',
}: CourseGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted py-16 px-4">
        <svg
          className="mb-4 h-12 w-12 text-muted-foreground"
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
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          onClick={onCourseClick}
        />
      ))}
    </div>
  );
}
