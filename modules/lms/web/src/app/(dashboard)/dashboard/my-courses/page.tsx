"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { enrollmentApi } from "@/lib/lms/api";
import type { Enrollment } from "@/lib/lms/types";
import { EnrollmentCard } from "@/components/lms/enrollment-card";
import { ProgressBar } from "@/components/lms/progress-bar";

// =============================================================================
// Constants
// =============================================================================

type TabValue = "in-progress" | "completed";

// =============================================================================
// My Courses Dashboard Page
// =============================================================================

export default function MyCoursesPage() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("in-progress");

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await enrollmentApi.list();
      setEnrollments(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load your courses",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  // ---------------------------------------------------------------------------
  // Filtered Enrollments
  // ---------------------------------------------------------------------------

  const inProgressEnrollments = useMemo(
    () =>
      enrollments.filter(
        (e) => e.status === "ACTIVE" || e.status === "EXPIRED",
      ),
    [enrollments],
  );

  const completedEnrollments = useMemo(
    () => enrollments.filter((e) => e.status === "COMPLETED"),
    [enrollments],
  );

  const displayedEnrollments =
    activeTab === "in-progress" ? inProgressEnrollments : completedEnrollments;

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  const totalEnrolled = enrollments.length;
  const totalCompleted = completedEnrollments.length;
  const averageProgress =
    inProgressEnrollments.length > 0
      ? Math.round(
          inProgressEnrollments.reduce((sum, e) => sum + e.progress, 0) /
            inProgressEnrollments.length,
        )
      : 0;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          My Courses
        </h1>
        <p className="mt-1 text-muted-foreground">
          Track your learning progress and continue where you left off.
        </p>
      </div>

      {/* Stats Cards */}
      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Total Enrolled</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {totalEnrolled}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {totalCompleted}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Average Progress (In Progress)
            </p>
            <div className="mt-1 flex items-center gap-3">
              <p className="text-2xl font-bold text-foreground">
                {averageProgress}%
              </p>
              <div className="flex-1">
                <ProgressBar value={averageProgress} showPercentage={false} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">{error}</p>
          <button
            onClick={fetchEnrollments}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Tabs and Content */}
      {!loading && !error && (
        <>
          {/* Tabs */}
          <div className="border-b border-border">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("in-progress")}
                className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                  activeTab === "in-progress"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                In Progress
                {inProgressEnrollments.length > 0 && (
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {inProgressEnrollments.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                  activeTab === "completed"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Completed
                {completedEnrollments.length > 0 && (
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {completedEnrollments.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Enrollment Grid */}
          {displayedEnrollments.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayedEnrollments.map((enrollment) => (
                <EnrollmentCard
                  key={enrollment.id}
                  enrollment={enrollment}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <svg
                className="mx-auto h-16 w-16 text-muted-foreground/30"
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
              <p className="mt-4 text-lg font-medium text-foreground">
                {activeTab === "in-progress"
                  ? "No courses in progress"
                  : "No completed courses yet"}
              </p>
              <p className="mt-2 text-muted-foreground">
                {activeTab === "in-progress"
                  ? "Start learning by enrolling in a course."
                  : "Complete your first course to see it here."}
              </p>
              {activeTab === "in-progress" && (
                <a
                  href="/courses"
                  className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Browse Courses
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
