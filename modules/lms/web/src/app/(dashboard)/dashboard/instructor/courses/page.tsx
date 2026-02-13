'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Course, CourseStatus } from '@/lib/lms/types';
import { courseApi } from '@/lib/lms/api';
import { formatPrice } from '@/lib/lms/formatters';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/feedback/alert';
import { Rating } from '@/components/ui/rating';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

const STATUS_BADGE_VARIANT: Record<CourseStatus, 'secondary' | 'success' | 'warning'> = {
  DRAFT: 'secondary',
  PUBLISHED: 'success',
  ARCHIVED: 'warning',
};

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        setError(null);
        const response = await courseApi.list({ limit: 100 });
        setCourses(response.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesStatus = statusFilter === 'ALL' || course.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your courses and track their performance.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/instructor/courses/new">
            + Create Course
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchInput
            placeholder="Search courses..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as CourseStatus | 'ALL')}
        />
      </div>

      {/* Course List */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground text-lg">
            {courses.length === 0
              ? 'You have not created any courses yet.'
              : 'No courses match your filters.'}
          </p>
          {courses.length === 0 && (
            <Button asChild className="mt-4">
              <Link href="/dashboard/instructor/courses/new">
                Create Your First Course
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-muted-foreground text-xs">IMG</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate max-w-xs">
                          {course.title}
                        </p>
                        {course.level && (
                          <p className="text-xs text-muted-foreground capitalize">{course.level}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[course.status]}>
                      {course.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {course.enrollmentCount ?? 0}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {course.avgRating != null ? (
                      <span className="flex items-center gap-1">
                        <Rating value={course.avgRating} readOnly size="sm" />
                        {course.reviewCount != null && (
                          <span className="text-muted-foreground">({course.reviewCount})</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No ratings</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatPrice(course.price, course.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/dashboard/instructor/courses/${course.id}`}
                      className="text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      Edit
                    </Link>
                    <span className="mx-2 text-border">|</span>
                    <Link
                      href={`/dashboard/instructor/courses/${course.id}/lessons`}
                      className="text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      Lessons
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary */}
      {courses.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredCourses.length} of {courses.length} courses
        </div>
      )}
    </div>
  );
}
