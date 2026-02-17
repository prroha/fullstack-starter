"use client";

import { useState, useEffect, useCallback } from "react";
import { use } from "react";
import { courseApi } from "@/lib/lms/api";
import type { Course, Section, Review } from "@/lib/lms/types";
import { EnrollmentButton } from "@/components/lms/enrollment-button";
import { ReviewForm } from "@/components/lms/review-form";
import { ReviewList } from "@/components/lms/review-list";
import { Rating } from "@/components/ui/rating";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatPrice, formatDuration, getLevelColor } from "@/lib/lms/formatters";

// =============================================================================
// Collapsible Section Component
// =============================================================================

function CurriculumSection({
  section,
  defaultOpen,
}: {
  section: Section;
  defaultOpen: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const sectionDuration = section.lessons.reduce(
    (sum, l) => sum + l.duration,
    0,
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-none bg-card px-5 py-4 text-left hover:bg-accent/50 h-auto"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
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
          <span className="font-medium text-foreground">{section.title}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {section.lessons.length} lesson{section.lessons.length !== 1 ? "s" : ""}
          {" \u00B7 "}
          {formatDuration(sectionDuration)}
        </span>
      </Button>

      {isOpen && (
        <div className="divide-y divide-border">
          {section.lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="flex items-center justify-between px-5 py-3 pl-12"
            >
              <div className="flex items-center gap-3">
                {lesson.type === "VIDEO" && (
                  <svg
                    className="h-4 w-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                {lesson.type === "TEXT" && (
                  <svg
                    className="h-4 w-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
                {lesson.type === "PDF" && (
                  <svg
                    className="h-4 w-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                )}
                {lesson.type === "QUIZ" && (
                  <svg
                    className="h-4 w-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                <span className="text-sm text-foreground">{lesson.title}</span>
                {lesson.isFree && (
                  <Badge variant="success" size="sm">
                    Free Preview
                  </Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {lesson.duration > 0 ? formatDuration(lesson.duration) : "--"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Course Detail Page
// =============================================================================

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"curriculum" | "reviews">(
    "curriculum",
  );

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchCourse = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await courseApi.getBySlug(slug);
      setCourse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  // ---------------------------------------------------------------------------
  // Callback for when a new review is submitted
  // ---------------------------------------------------------------------------

  const handleReviewSubmitted = useCallback(
    (_review: Review) => {
      // Refresh the course data to get updated ratings and review counts
      fetchCourse();
    },
    [fetchCourse],
  );

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------

  if (error || !course) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">
            {error || "Course not found"}
          </p>
          <Button onClick={fetchCourse} className="mt-4" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Computed Values
  // ---------------------------------------------------------------------------

  const sections = course.sections || [];
  const totalLessons = sections.reduce(
    (sum, s) => sum + s.lessons.length,
    0,
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Course Info */}
            <div className="lg:col-span-2 space-y-4">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                <a href="/courses" className="hover:text-foreground transition-colors">
                  Courses
                </a>
                <span>/</span>
                <span className="text-foreground">{course.title}</span>
              </nav>

              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {course.title}
              </h1>

              {course.shortDescription && (
                <p className="text-lg text-muted-foreground">
                  {course.shortDescription}
                </p>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {course.avgRating !== undefined && (
                  <div className="flex items-center gap-1">
                    <Rating
                      value={course.avgRating}
                      readOnly
                      allowHalf
                      size="sm"
                      showValue
                    />
                    {course.reviewCount !== undefined && (
                      <span className="text-muted-foreground">
                        ({course.reviewCount} review
                        {course.reviewCount !== 1 ? "s" : ""})
                      </span>
                    )}
                  </div>
                )}

                {course.enrollmentCount !== undefined && (
                  <span className="text-muted-foreground">
                    {course.enrollmentCount.toLocaleString()} student
                    {course.enrollmentCount !== 1 ? "s" : ""}
                  </span>
                )}

                {course.instructorName && (
                  <span className="text-muted-foreground">
                    By{" "}
                    <span className="font-medium text-foreground">
                      {course.instructorName}
                    </span>
                  </span>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {course.level && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getLevelColor(course.level)}`}
                  >
                    {course.level.charAt(0).toUpperCase() +
                      course.level.slice(1)}
                  </span>
                )}
                <Badge variant="secondary" size="sm">
                  {course.language.toUpperCase()}
                </Badge>
                {course.duration > 0 && (
                  <Badge variant="secondary" size="sm">
                    {formatDuration(course.duration)} total
                  </Badge>
                )}
                {totalLessons > 0 && (
                  <Badge variant="secondary" size="sm">
                    {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>

            {/* Sidebar Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 rounded-lg border border-border bg-background p-6 shadow-sm space-y-4">
                {/* Thumbnail */}
                {course.thumbnailUrl && (
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="aspect-video w-full object-cover"
                    />
                  </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-foreground">
                    {formatPrice(course.price, course.currency)}
                  </span>
                  {course.compareAtPrice &&
                    course.compareAtPrice > course.price && (
                      <span className="text-lg text-muted-foreground line-through">
                        {formatPrice(course.compareAtPrice, course.currency)}
                      </span>
                    )}
                </div>

                {/* Enrollment Button */}
                <EnrollmentButton
                  course={course}
                  onEnroll={async (courseId) => {
                    // TODO: Wire up to enrollmentApi.enroll
                    console.log('Enroll in course:', courseId);
                  }}
                  onContinue={(courseId) => {
                    window.location.href = `/courses/${course.slug}/learn`;
                  }}
                />

                {/* Course Details */}
                <div className="space-y-3 border-t border-border pt-4 text-sm">
                  {course.duration > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium text-foreground">
                        {formatDuration(course.duration)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lessons</span>
                    <span className="font-medium text-foreground">
                      {totalLessons}
                    </span>
                  </div>
                  {course.level && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Level</span>
                      <span className="font-medium text-foreground">
                        {course.level.charAt(0).toUpperCase() +
                          course.level.slice(1)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Language</span>
                    <span className="font-medium text-foreground">
                      {course.language.toUpperCase()}
                    </span>
                  </div>
                  {course.maxStudents && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Max Students</span>
                      <span className="font-medium text-foreground">
                        {course.maxStudents.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="lg:max-w-3xl">
          {/* Description */}
          <div className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              About This Course
            </h2>
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <p className="whitespace-pre-wrap">{course.description}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border">
            <div className="flex gap-6">
              <Button
                variant="ghost"
                onClick={() => setActiveTab("curriculum")}
                className={`rounded-none border-b-2 pb-3 text-sm font-medium h-auto px-0 hover:bg-transparent ${
                  activeTab === "curriculum"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Curriculum
                {sections.length > 0 && (
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {sections.length} section{sections.length !== 1 ? "s" : ""}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("reviews")}
                className={`rounded-none border-b-2 pb-3 text-sm font-medium h-auto px-0 hover:bg-transparent ${
                  activeTab === "reviews"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Reviews
                {course.reviewCount !== undefined && course.reviewCount > 0 && (
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {course.reviewCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {/* Curriculum Tab */}
            {activeTab === "curriculum" && (
              <div className="space-y-3">
                {sections.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    No curriculum available yet.
                  </p>
                ) : (
                  sections
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((section, idx) => (
                      <CurriculumSection
                        key={section.id}
                        section={section}
                        defaultOpen={idx === 0}
                      />
                    ))
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                <ReviewForm
                  courseId={course.id}
                  onSubmit={async (data) => {
                    // TODO: Wire up to reviewApi.create
                    handleReviewSubmitted(data as unknown as Review);
                  }}
                />
                <ReviewList
                  reviews={course.reviews ?? []}
                  averageRating={course.avgRating ?? 0}
                  totalCount={course.reviewCount ?? 0}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
