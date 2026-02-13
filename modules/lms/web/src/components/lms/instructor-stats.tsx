'use client';

import { StatCard } from '@/components/ui/stat-card';
import { Progress } from '@/components/ui/progress';
import type { InstructorStats as InstructorStatsType } from '../../lib/lms/types';

interface InstructorStatsProps {
  stats: InstructorStatsType;
}

export default function InstructorStats({ stats }: InstructorStatsProps) {
  const formattedRevenue = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(stats.totalRevenue);

  const formattedRevenueDetailed = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(stats.totalRevenue);

  const completionPercent = Math.round(stats.completionRate * 100);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Total Courses */}
        <StatCard
          label="Total Courses"
          value={stats.totalCourses.toLocaleString()}
          trendLabel={`${stats.publishedCourses} published`}
          variant="info"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
              />
            </svg>
          }
        />

        {/* Total Students */}
        <StatCard
          label="Total Students"
          value={stats.totalStudents.toLocaleString()}
          variant="info"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
              />
            </svg>
          }
        />

        {/* Total Revenue */}
        <StatCard
          label="Total Revenue"
          value={formattedRevenue}
          trendLabel={stats.totalRevenue > 0 ? formattedRevenueDetailed : undefined}
          variant="success"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          }
        />

        {/* Average Rating */}
        <StatCard
          label="Average Rating"
          value={
            stats.averageRating > 0
              ? stats.averageRating.toFixed(1)
              : 'N/A'
          }
          trendLabel={stats.averageRating > 0 ? 'out of 5.0' : 'No ratings yet'}
          variant="warning"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
              />
            </svg>
          }
        />

        {/* Completion Rate */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Completion Rate
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {completionPercent}%
              </p>
            </div>
            <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
              <svg
                className="w-5 h-5 text-purple-600 dark:text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <Progress value={completionPercent} size="sm" />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {completionPercent >= 75
              ? 'Great completion rate'
              : completionPercent >= 50
                ? 'Good - room for improvement'
                : completionPercent > 0
                  ? 'Consider improving engagement'
                  : 'No completions yet'}
          </p>
        </div>
      </div>
    </div>
  );
}
