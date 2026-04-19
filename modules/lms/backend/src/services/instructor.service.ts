// =============================================================================
// LMS Instructor Service
// =============================================================================
// Analytics aggregation for instructor dashboard, earnings, and course stats.
// Uses dependency injection for PrismaClient.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface InstructorStats {
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
}

export interface CourseAnalytics {
  courseId: string;
  courseTitle: string;
  enrollmentCount: number;
  completionCount: number;
  completionRate: number;
  averageRating: number;
  reviewCount: number;
  revenue: number;
}

export interface EarningsData {
  period: string;
  amount: number;
  enrollments: number;
}

// =============================================================================
// Instructor Service
// =============================================================================

export class InstructorService {
  constructor(private db: PrismaClient) {}

  /**
   * Get aggregate stats for an instructor's dashboard
   */
  async getDashboardStats(instructorId: string): Promise<InstructorStats> {
    const [
      totalCourses,
      publishedCourses,
      totalStudents,
      avgRatingResult,
      totalEnrollments,
      completedEnrollments,
    ] = await Promise.all([
      this.db.course.count({ where: { instructorId } }),
      this.db.course.count({ where: { instructorId, status: 'PUBLISHED' } }),
      this.db.enrollment.count({
        where: {
          course: { instructorId },
          status: { in: ['ACTIVE', 'COMPLETED'] },
        },
      }),
      this.db.review.aggregate({
        where: { course: { instructorId } },
        _avg: { rating: true },
      }),
      this.db.enrollment.count({
        where: { course: { instructorId } },
      }),
      this.db.enrollment.count({
        where: { course: { instructorId }, status: 'COMPLETED' },
      }),
    ]);

    // Calculate revenue: sum of (enrollment count * course price) for each course
    const courses = await this.db.course.findMany({
      where: { instructorId },
      select: { id: true, price: true },
    });

    let totalRevenue = 0;
    for (const course of courses) {
      const enrollCount = await this.db.enrollment.count({
        where: {
          courseId: course.id,
          status: { in: ['ACTIVE', 'COMPLETED'] },
        },
      });
      totalRevenue += enrollCount * course.price;
    }

    const averageRating = avgRatingResult._avg.rating || 0;
    const completionRate = totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

    return {
      totalCourses,
      publishedCourses,
      totalStudents,
      totalRevenue,
      averageRating: Math.round(averageRating * 10) / 10,
      completionRate,
    };
  }

  /**
   * Get per-course analytics for an instructor
   */
  async getCourseAnalytics(instructorId: string): Promise<CourseAnalytics[]> {
    const courses = await this.db.course.findMany({
      where: { instructorId },
      select: { id: true, title: true, price: true },
    });

    const analytics: CourseAnalytics[] = [];

    for (const course of courses) {
      const [enrollmentCount, completionCount, reviewAgg, reviewCount] = await Promise.all([
        this.db.enrollment.count({
          where: { courseId: course.id, status: { in: ['ACTIVE', 'COMPLETED'] } },
        }),
        this.db.enrollment.count({
          where: { courseId: course.id, status: 'COMPLETED' },
        }),
        this.db.review.aggregate({
          where: { courseId: course.id },
          _avg: { rating: true },
        }),
        this.db.review.count({
          where: { courseId: course.id },
        }),
      ]);

      analytics.push({
        courseId: course.id,
        courseTitle: course.title,
        enrollmentCount,
        completionCount,
        completionRate: enrollmentCount > 0
          ? Math.round((completionCount / enrollmentCount) * 100)
          : 0,
        averageRating: reviewAgg._avg.rating || 0,
        reviewCount,
        revenue: enrollmentCount * course.price,
      });
    }

    return analytics;
  }

  /**
   * Get earnings breakdown by period
   */
  async getEarnings(
    instructorId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'monthly',
    startDate?: Date,
    endDate?: Date,
  ): Promise<EarningsData[]> {
    const where: Record<string, unknown> = {
      course: { instructorId },
      status: { in: ['ACTIVE', 'COMPLETED'] },
    };

    if (startDate || endDate) {
      where.enrolledAt = {};
      if (startDate) {
        (where.enrolledAt as Record<string, unknown>).gte = startDate;
      }
      if (endDate) {
        (where.enrolledAt as Record<string, unknown>).lte = endDate;
      }
    }

    const enrollments = await this.db.enrollment.findMany({
      where,
      include: { course: { select: { price: true } } },
      orderBy: { enrolledAt: 'asc' },
    });

    // Group by period
    const grouped = new Map<string, { amount: number; enrollments: number }>();

    for (const enrollment of enrollments) {
      const date = enrollment.enrolledAt;
      let key: string;

      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly': {
          const weekStart = new Date(date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        }
        case 'monthly':
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      const existing = grouped.get(key) || { amount: 0, enrollments: 0 };
      existing.amount += enrollment.course.price;
      existing.enrollments += 1;
      grouped.set(key, existing);
    }

    return Array.from(grouped.entries()).map(([periodKey, data]) => ({
      period: periodKey,
      amount: data.amount,
      enrollments: data.enrollments,
    }));
  }

  /**
   * Get recent enrollments across all instructor courses
   */
  async getRecentEnrollments(instructorId: string, limit = 10) {
    const enrollments = await this.db.enrollment.findMany({
      where: { course: { instructorId } },
      include: { course: { select: { title: true } } },
      orderBy: { enrolledAt: 'desc' },
      take: limit,
    });

    return enrollments.map((e) => ({
      studentName: e.userId, // userId is available; actual name requires User join from core
      courseTitle: e.course.title,
      enrolledAt: e.enrolledAt,
    }));
  }

  /**
   * Get recent reviews across all instructor courses
   */
  async getRecentReviews(instructorId: string, limit = 10) {
    const reviews = await this.db.review.findMany({
      where: { course: { instructorId } },
      include: { course: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return reviews.map((r) => ({
      rating: r.rating,
      comment: r.comment,
      courseTitle: r.course.title,
      createdAt: r.createdAt,
    }));
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createInstructorService(db: PrismaClient): InstructorService {
  return new InstructorService(db);
}

let instance: InstructorService | null = null;

export function getInstructorService(db?: PrismaClient): InstructorService {
  if (db) return createInstructorService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new InstructorService(globalDb);
  }
  return instance;
}

export default InstructorService;
