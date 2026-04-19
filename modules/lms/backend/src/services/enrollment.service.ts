// =============================================================================
// LMS Enrollment Service
// =============================================================================
// Business logic for enrollment creation, progress tracking, and completion.
// Uses dependency injection for PrismaClient.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface EnrollInput {
  userId: string;
  courseId: string;
}

export interface ProgressUpdateInput {
  enrollmentId: string;
  lessonId: string;
  completed?: boolean;
  timeSpent?: number;
  lastPosition?: number;
}

// =============================================================================
// Enrollment Service
// =============================================================================

export class EnrollmentService {
  constructor(private db: PrismaClient) {}

  /**
   * Enroll a user in a course
   */
  async enroll(input: EnrollInput) {
    // Check if already enrolled
    const existing = await this.db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: input.userId,
          courseId: input.courseId,
        },
      },
    });

    if (existing) {
      if (existing.status === 'DROPPED') {
        // Re-enroll
        return this.db.enrollment.update({
          where: { id: existing.id },
          data: {
            status: 'ACTIVE',
            progress: 0,
            completedAt: null,
          },
        });
      }
      throw new Error('Already enrolled in this course');
    }

    // Check capacity
    const course = await this.db.course.findUnique({
      where: { id: input.courseId },
      select: { maxStudents: true },
    });

    if (course?.maxStudents !== null && course?.maxStudents !== undefined) {
      const enrolled = await this.db.enrollment.count({
        where: {
          courseId: input.courseId,
          status: { in: ['ACTIVE', 'COMPLETED'] },
        },
      });
      if (enrolled >= course.maxStudents) {
        throw new Error('Course is full');
      }
    }

    return this.db.enrollment.create({
      data: {
        userId: input.userId,
        courseId: input.courseId,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Get all enrollments for a user
   */
  async getUserEnrollments(userId: string) {
    return this.db.enrollment.findMany({
      where: { userId },
      include: { course: true },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  /**
   * Get all enrollments for a course
   */
  async getCourseEnrollments(courseId: string) {
    return this.db.enrollment.findMany({
      where: { courseId },
      include: { progressItems: true },
    });
  }

  /**
   * Track lesson progress
   */
  async updateProgress(input: ProgressUpdateInput) {
    const progress = await this.db.progress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: input.enrollmentId,
          lessonId: input.lessonId,
        },
      },
      create: {
        enrollmentId: input.enrollmentId,
        lessonId: input.lessonId,
        completed: input.completed || false,
        timeSpent: input.timeSpent || 0,
        lastPosition: input.lastPosition || 0,
        completedAt: input.completed ? new Date() : null,
      },
      update: {
        completed: input.completed,
        timeSpent: input.timeSpent,
        lastPosition: input.lastPosition,
        completedAt: input.completed ? new Date() : undefined,
      },
    });

    // Recalculate enrollment progress percentage
    await this.recalculateProgress(input.enrollmentId);

    return progress;
  }

  /**
   * Mark a lesson as completed
   */
  async completeLesson(enrollmentId: string, lessonId: string) {
    const progress = await this.db.progress.upsert({
      where: {
        enrollmentId_lessonId: { enrollmentId, lessonId },
      },
      create: {
        enrollmentId,
        lessonId,
        completed: true,
        completedAt: new Date(),
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
    });

    // Recalculate and check for course completion
    await this.recalculateProgress(enrollmentId);

    return progress;
  }

  /**
   * Get progress for an enrollment
   */
  async getProgress(enrollmentId: string) {
    return this.db.progress.findMany({
      where: { enrollmentId },
    });
  }

  /**
   * Recalculate enrollment progress percentage and check completion
   */
  private async recalculateProgress(enrollmentId: string) {
    const enrollment = await this.db.enrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment) return;

    const totalLessons = await this.db.lesson.count({
      where: { section: { courseId: enrollment.courseId } },
    });
    if (totalLessons === 0) return;

    const completedLessons = await this.db.progress.count({
      where: { enrollmentId, completed: true },
    });

    const progressPercentage = Math.round((completedLessons / totalLessons) * 100);

    const updateData: Record<string, unknown> = {
      progress: progressPercentage,
    };

    // Auto-complete enrollment when all lessons are done
    if (progressPercentage >= 100 && enrollment.status === 'ACTIVE') {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date();
    }

    await this.db.enrollment.update({
      where: { id: enrollmentId },
      data: updateData,
    });
  }

  /**
   * Drop enrollment
   */
  async dropEnrollment(enrollmentId: string) {
    return this.db.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'DROPPED' },
    });
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createEnrollmentService(db: PrismaClient): EnrollmentService {
  return new EnrollmentService(db);
}

let instance: EnrollmentService | null = null;

export function getEnrollmentService(db?: PrismaClient): EnrollmentService {
  if (db) return createEnrollmentService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new EnrollmentService(globalDb);
  }
  return instance;
}

export default EnrollmentService;
