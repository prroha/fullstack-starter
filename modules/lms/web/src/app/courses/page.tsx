"use client";

import { useState, useEffect, useCallback } from "react";
import { courseApi } from "@/lib/lms/api";
import type { Course, Category, CourseFilters } from "@/lib/lms/types";
import { CourseGrid } from "@/components/lms/course-grid";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";

// =============================================================================
// Constants
// =============================================================================

const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const PRICE_OPTIONS = [
  { label: "All Prices", value: "" },
  { label: "Free", value: "free" },
  { label: "Paid", value: "paid" },
];
const PAGE_SIZE = 12;

// =============================================================================
// Course Catalog Page
// =============================================================================

export default function CoursesCatalogPage() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: CourseFilters = {
        page,
        limit: PAGE_SIZE,
      };

      if (search.trim()) filters.search = search.trim();
      if (selectedCategory) filters.category = selectedCategory;
      if (selectedLevel) filters.level = selectedLevel;
      if (selectedPrice === "free") {
        filters.minPrice = 0;
        filters.maxPrice = 0;
      } else if (selectedPrice === "paid") {
        filters.minPrice = 1;
      }

      const result = await courseApi.list(filters);
      setCourses(result.items);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedLevel, selectedPrice, page]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await courseApi.getCategories();
      setCategories(data);
    } catch {
      // Categories are non-critical; silently fail
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, selectedLevel, selectedPrice]);

  // ---------------------------------------------------------------------------
  // Select Options
  // ---------------------------------------------------------------------------

  const categoryOptions = [
    { label: "All Categories", value: "" },
    ...categories.map((cat) => ({ label: cat.name, value: cat.slug })),
  ];

  const levelOptions = [
    { label: "All Levels", value: "" },
    ...LEVELS.map((level) => ({
      label: level.charAt(0).toUpperCase() + level.slice(1),
      value: level,
    })),
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Course Catalog
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Browse our library of courses and start learning today.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <SearchInput
            debounceDelay={400}
            onSearch={setSearch}
            placeholder="Search courses..."
            size="lg"
          />

          {/* Filter Row */}
          <div className="flex flex-wrap gap-3">
            {/* Category Filter */}
            <Select
              options={categoryOptions}
              value={selectedCategory}
              onChange={setSelectedCategory}
              size="sm"
            />

            {/* Level Filter */}
            <Select
              options={levelOptions}
              value={selectedLevel}
              onChange={setSelectedLevel}
              size="sm"
            />

            {/* Price Filter */}
            <Select
              options={PRICE_OPTIONS}
              value={selectedPrice}
              onChange={setSelectedPrice}
              size="sm"
            />

            {/* Clear Filters */}
            {(selectedCategory || selectedLevel || selectedPrice || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("");
                  setSelectedLevel("");
                  setSelectedPrice("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Results Info */}
        {!loading && !error && (
          <p className="mb-6 text-sm text-muted-foreground">
            {total === 0
              ? "No courses found"
              : `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, total)} of ${total} courses`}
          </p>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchCourses} className="mt-4" size="sm">
              Try Again
            </Button>
          </div>
        )}

        {/* Course Grid */}
        {!loading && !error && courses.length > 0 && (
          <CourseGrid courses={courses} />
        )}

        {/* Empty State */}
        {!loading && !error && courses.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg font-medium text-foreground">
              No courses found
            </p>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your filters or search terms.
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-10">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={total}
              pageSize={PAGE_SIZE}
              showItemCount
            />
          </div>
        )}
      </div>
    </div>
  );
}
