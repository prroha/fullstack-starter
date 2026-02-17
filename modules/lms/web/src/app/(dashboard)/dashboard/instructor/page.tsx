'use client';

import { useState, useEffect } from 'react';
import type { InstructorStats, Review } from '@/lib/lms/types';
import { instructorApi } from '@/lib/lms/api';
import { InstructorStatsComponent } from '@/components/lms/instructor-stats';
import { Rating } from '@/components/ui/rating';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/feedback/alert';

interface RecentEnrollment {
  studentName: string;
  courseTitle: string;
  enrolledAt: string;
}

export default function InstructorDashboardPage() {
  const [stats, setStats] = useState<InstructorStats | null>(null);
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [statsData, enrollmentsData, reviewsData] = await Promise.all([
          instructorApi.getStats(),
          instructorApi.getRecentEnrollments(10),
          instructorApi.getRecentReviews(10),
        ]);

        setStats(statsData);
        setRecentEnrollments(enrollmentsData);
        setRecentReviews(reviewsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive" title="Error">
          <p className="mt-1">{error}</p>
          <Button
            variant="destructive"
            onClick={() => window.location.reload()}
            className="mt-3"
          >
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Instructor Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Overview of your courses, students, and revenue.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && <InstructorStatsComponent stats={stats} />}

      {/* Content Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enrollments */}
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Recent Enrollments</h2>
          </div>
          <div className="divide-y divide-border">
            {recentEnrollments.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground">
                No recent enrollments yet.
              </div>
            ) : (
              recentEnrollments.map((enrollment, index) => (
                <div key={index} className="px-6 py-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {enrollment.studentName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {enrollment.courseTitle}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Recent Reviews</h2>
          </div>
          <div className="divide-y divide-border">
            {recentReviews.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground">
                No reviews yet.
              </div>
            ) : (
              recentReviews.map((review) => (
                <div key={review.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">
                      {review.userName || 'Anonymous'}
                    </p>
                    <Rating value={review.rating} readOnly size="sm" />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
