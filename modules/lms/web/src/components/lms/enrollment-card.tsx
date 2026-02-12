'use client';

import type { Enrollment } from '../../lib/lms/types';
import { ProgressBar } from './progress-bar';

interface EnrollmentCardProps {
  enrollment: Enrollment;
}

export default function EnrollmentCard({ enrollment }: EnrollmentCardProps) {
  const course = enrollment.course;
  const isCompleted = enrollment.status === 'COMPLETED';

  return (
    <div className="group overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md">
      {/* Thumbnail */}
      <a href={course ? `/courses/${course.slug}/learn?enrollmentId=${enrollment.id}` : '#'}>
        <div className="relative aspect-video overflow-hidden bg-muted">
          {course?.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg
                className="h-12 w-12 text-muted-foreground/30"
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

          {/* Status Badge */}
          {isCompleted && (
            <div className="absolute right-2 top-2 rounded-full bg-green-600 px-2.5 py-1 text-xs font-medium text-white">
              Completed
            </div>
          )}
        </div>
      </a>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <a
            href={course ? `/courses/${course.slug}/learn?enrollmentId=${enrollment.id}` : '#'}
            className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2"
          >
            {course?.title || 'Untitled Course'}
          </a>
          {course?.instructorName && (
            <p className="mt-1 text-sm text-muted-foreground">
              {course.instructorName}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">
              {Math.round(enrollment.progress)}%
            </span>
          </div>
          <ProgressBar value={enrollment.progress} showPercentage={false} />
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Enrolled{' '}
            {new Date(enrollment.enrolledAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          {enrollment.completedAt && (
            <span>
              Completed{' '}
              {new Date(enrollment.completedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )}
        </div>

        {/* Actions */}
        <a
          href={course ? `/courses/${course.slug}/learn?enrollmentId=${enrollment.id}` : '#'}
          className="block w-full rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {isCompleted ? 'Review Course' : 'Continue Learning'}
        </a>
      </div>
    </div>
  );
}
