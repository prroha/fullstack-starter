"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { use } from "react";
import { useSearchParams } from "next/navigation";
import { lessonApi, enrollmentApi } from "@/lib/lms/api";
import type { Section, Lesson, LessonProgress } from "@/lib/lms/types";
import { LessonSidebar } from "@/components/lms/lesson-sidebar";
import { LessonPlayer } from "@/components/lms/lesson-player";
import { ProgressBar } from "@/components/lms/progress-bar";

// =============================================================================
// Helper Functions
// =============================================================================

function getAllLessons(sections: Section[]): Lesson[] {
  return sections
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((s) =>
      [...s.lessons].sort((a, b) => a.sortOrder - b.sortOrder),
    );
}

function calculateOverallProgress(
  allLessons: Lesson[],
  progress: LessonProgress[],
): number {
  if (allLessons.length === 0) return 0;
  const completedCount = progress.filter((p) => p.completed).length;
  return Math.round((completedCount / allLessons.length) * 100);
}

// =============================================================================
// Course Learning Page
// =============================================================================

export default function CourseLearnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const enrollmentId = searchParams.get("enrollmentId") || "";
  const initialLessonId = searchParams.get("lessonId") || "";

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [sections, setSections] = useState<Section[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState<string>(initialLessonId);
  const [courseId, setCourseId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingLesson, setCompletingLesson] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ---------------------------------------------------------------------------
  // Derived Data
  // ---------------------------------------------------------------------------

  const allLessons = useMemo(() => getAllLessons(sections), [sections]);

  const currentLesson = useMemo(
    () => allLessons.find((l) => l.id === currentLessonId) || allLessons[0] || null,
    [allLessons, currentLessonId],
  );

  const currentLessonIndex = useMemo(
    () =>
      currentLesson
        ? allLessons.findIndex((l) => l.id === currentLesson.id)
        : -1,
    [allLessons, currentLesson],
  );

  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < allLessons.length - 1
      ? allLessons[currentLessonIndex + 1]
      : null;

  const overallProgress = useMemo(
    () => calculateOverallProgress(allLessons, progress),
    [allLessons, progress],
  );

  const completedLessonIds = useMemo(
    () => new Set(progress.filter((p) => p.completed).map((p) => p.lessonId)),
    [progress],
  );

  const currentLessonProgress = useMemo(
    () =>
      currentLesson
        ? progress.find((p) => p.lessonId === currentLesson.id) || null
        : null,
    [progress, currentLesson],
  );

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    if (!enrollmentId) {
      setError("No enrollment found. Please enroll in this course first.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // We need the courseId to fetch sections.
      // First get progress (which gives us enrollment info),
      // then fetch sections using the slug to find the course.
      // Since lessonApi.listSections needs a courseId and we only have a slug,
      // we'll fetch course by slug first.
      const { courseApi: courseApiImport } = await import("@/lib/lms/api");
      const course = await courseApiImport.getBySlug(slug);
      setCourseId(course.id);

      const [sectionsData, progressData] = await Promise.all([
        lessonApi.listSections(course.id),
        enrollmentApi.getProgress(enrollmentId),
      ]);

      setSections(sectionsData);
      setProgress(progressData);

      // Set initial lesson if none specified
      if (!initialLessonId && sectionsData.length > 0) {
        const lessons = getAllLessons(sectionsData);
        if (lessons.length > 0) {
          // Find the first uncompleted lesson, or default to the first lesson
          const completedIds = new Set(
            progressData.filter((p) => p.completed).map((p) => p.lessonId),
          );
          const firstUncompleted = lessons.find(
            (l) => !completedIds.has(l.id),
          );
          setCurrentLessonId(
            firstUncompleted ? firstUncompleted.id : lessons[0].id,
          );
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load course content",
      );
    } finally {
      setLoading(false);
    }
  }, [slug, enrollmentId, initialLessonId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------------------------------------------------------------------------
  // Lesson Navigation
  // ---------------------------------------------------------------------------

  const handleSelectLesson = useCallback((lessonId: string) => {
    setCurrentLessonId(lessonId);
  }, []);

  const handlePrevLesson = useCallback(() => {
    if (prevLesson) {
      setCurrentLessonId(prevLesson.id);
    }
  }, [prevLesson]);

  const handleNextLesson = useCallback(() => {
    if (nextLesson) {
      setCurrentLessonId(nextLesson.id);
    }
  }, [nextLesson]);

  // ---------------------------------------------------------------------------
  // Mark Lesson Complete
  // ---------------------------------------------------------------------------

  const handleCompleteLesson = useCallback(async () => {
    if (!currentLesson || !enrollmentId || completingLesson) return;

    try {
      setCompletingLesson(true);
      const updatedProgress = await enrollmentApi.completeLesson(
        enrollmentId,
        currentLesson.id,
      );

      setProgress((prev) => {
        const existing = prev.findIndex(
          (p) => p.lessonId === currentLesson.id,
        );
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = updatedProgress;
          return updated;
        }
        return [...prev, updatedProgress];
      });
    } catch (err) {
      console.error("Failed to complete lesson:", err);
    } finally {
      setCompletingLesson(false);
    }
  }, [currentLesson, enrollmentId, completingLesson]);

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">{error}</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <a
              href={`/courses/${slug}`}
              className="rounded-lg border border-input px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              Back to Course
            </a>
            {enrollmentId && (
              <button
                onClick={fetchData}
                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <a
            href={`/courses/${slug}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Course
          </a>

          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {completedLessonIds.size} / {allLessons.length} lessons completed
          </span>
          <div className="w-32 sm:w-48">
            <ProgressBar value={overallProgress} showPercentage={false} />
          </div>
          <span className="text-sm font-medium text-foreground">
            {overallProgress}%
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 z-30 w-80 border-r border-border bg-card pt-14 transition-transform lg:relative lg:inset-auto lg:z-auto lg:translate-x-0 lg:pt-0`}
        >
          {/* Mobile close button */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
            <span className="font-medium text-foreground">Course Content</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label="Close sidebar"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="h-full overflow-y-auto">
            <LessonSidebar
              sections={sections}
              currentLessonId={currentLesson?.id || ""}
              completedLessonIds={completedLessonIds}
              onSelectLesson={(lessonId) => {
                handleSelectLesson(lessonId);
                setSidebarOpen(false);
              }}
            />
          </div>
        </div>

        {/* Sidebar Overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Lesson Content */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {currentLesson ? (
            <>
              {/* Lesson Player */}
              <div className="flex-1">
                <LessonPlayer
                  lesson={currentLesson}
                />
              </div>

              {/* Bottom Navigation Bar */}
              <div className="border-t border-border bg-card px-4 py-4">
                <div className="mx-auto flex max-w-4xl items-center justify-between">
                  {/* Previous Button */}
                  <button
                    onClick={handlePrevLesson}
                    disabled={!prevLesson}
                    className="flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    <span className="hidden sm:inline">
                      {prevLesson ? prevLesson.title : "Previous"}
                    </span>
                    <span className="sm:hidden">Prev</span>
                  </button>

                  {/* Complete / Completed Button */}
                  {currentLesson &&
                    !completedLessonIds.has(currentLesson.id) && (
                      <button
                        onClick={handleCompleteLesson}
                        disabled={completingLesson}
                        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        {completingLesson ? (
                          "Marking..."
                        ) : (
                          <>
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Mark as Complete
                          </>
                        )}
                      </button>
                    )}

                  {currentLesson &&
                    completedLessonIds.has(currentLesson.id) && (
                      <span className="flex items-center gap-2 text-sm font-medium text-green-600">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Completed
                      </span>
                    )}

                  {/* Next Button */}
                  <button
                    onClick={handleNextLesson}
                    disabled={!nextLesson}
                    className="flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="hidden sm:inline">
                      {nextLesson ? nextLesson.title : "Next"}
                    </span>
                    <span className="sm:hidden">Next</span>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-muted-foreground">
                No lessons available in this course yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
