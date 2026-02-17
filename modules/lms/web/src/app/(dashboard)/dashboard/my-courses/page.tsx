"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { enrollmentApi } from "@/lib/lms/api";
import type { Enrollment } from "@/lib/lms/types";
import { EnrollmentCard } from "@/components/lms/enrollment-card";
import { ProgressBar } from "@/components/lms/progress-bar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@/components/ui/tabs";

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
  // Tab content renderer
  // ---------------------------------------------------------------------------

  const renderEnrollmentGrid = (items: Enrollment[], tabType: "in-progress" | "completed") => {
    if (items.length > 0) {
      return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((enrollment) => (
            <EnrollmentCard
              key={enrollment.id}
              enrollment={enrollment}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="py-10 text-center">
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
          {tabType === "in-progress"
            ? "No courses in progress"
            : "No completed courses yet"}
        </p>
        <p className="mt-2 text-muted-foreground">
          {tabType === "in-progress"
            ? "Start learning by enrolling in a course."
            : "Complete your first course to see it here."}
        </p>
        {tabType === "in-progress" && (
          <Button asChild className="mt-6">
            <Link href="/courses">Browse Courses</Link>
          </Button>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
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
            <p className="mt-1 text-2xl font-bold text-success">
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
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            onClick={fetchEnrollments}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Tabs and Content */}
      {!loading && !error && (
        <Tabs defaultIndex={0} variant="line">
          <TabList>
            <Tab>
              In Progress
              {inProgressEnrollments.length > 0 && (
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {inProgressEnrollments.length}
                </span>
              )}
            </Tab>
            <Tab>
              Completed
              {completedEnrollments.length > 0 && (
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {completedEnrollments.length}
                </span>
              )}
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              {renderEnrollmentGrid(inProgressEnrollments, "in-progress")}
            </TabPanel>
            <TabPanel>
              {renderEnrollmentGrid(completedEnrollments, "completed")}
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </div>
  );
}
