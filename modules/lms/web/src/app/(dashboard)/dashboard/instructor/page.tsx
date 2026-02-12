'use client';

import { useState, useEffect } from 'react';
import type { InstructorStats, Review } from '@/lib/lms/types';
import { instructorApi } from '@/lib/lms/api';
import { InstructorStatsComponent } from '@/components/lms/instructor-stats';
import { Rating } from '@/components/ui/rating';

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
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold text-lg">Error</h2>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your courses, students, and revenue.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && <InstructorStatsComponent stats={stats} />}

      {/* Content Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Enrollments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Enrollments</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentEnrollments.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No recent enrollments yet.
              </div>
            ) : (
              recentEnrollments.map((enrollment, index) => (
                <div key={index} className="px-6 py-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {enrollment.studentName}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {enrollment.courseTitle}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <p className="text-xs text-gray-400">
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentReviews.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No reviews yet.
              </div>
            ) : (
              recentReviews.map((review) => (
                <div key={review.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {review.userName || 'Anonymous'}
                    </p>
                    <Rating value={review.rating} readOnly size="sm" />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
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
