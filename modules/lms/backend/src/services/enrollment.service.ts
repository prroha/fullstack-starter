// =============================================================================
// LMS Enrollment Service
// =============================================================================
// Business logic for enrollment creation, progress tracking, and completion.
// Uses placeholder db operations - replace with actual Prisma client.

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

interface EnrollmentRecord {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  progress: number;
  enrolledAt: Date;
  completedAt: Date | null;
  expiresAt: Date | null;
}

interface ProgressRecord {
  id: string;
  enrollmentId: string;
  lessonId: string;
  completed: boolean;
  timeSpent: number;
  lastPosition: number;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================

const dbOperations = {
  async findEnrollment(userId: string, courseId: string): Promise<EnrollmentRecord | null> {
    // Replace with: return db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
    console.log('[DB] Finding enrollment:', userId, courseId);
    return null;
  },

  async findEnrollmentById(id: string): Promise<EnrollmentRecord | null> {
    // Replace with: return db.enrollment.findUnique({ where: { id }, include: { course: true } });
    console.log('[DB] Finding enrollment by ID:', id);
    return null;
  },

  async findEnrollmentsByUser(userId: string): Promise<EnrollmentRecord[]> {
    // Replace with: return db.enrollment.findMany({ where: { userId }, include: { course: true }, orderBy: { enrolledAt: 'desc' } });
    console.log('[DB] Finding enrollments for user:', userId);
    return [];
  },

  async findEnrollmentsByCourse(courseId: string): Promise<EnrollmentRecord[]> {
    // Replace with: return db.enrollment.findMany({ where: { courseId }, include: { progressItems: true } });
    console.log('[DB] Finding enrollments for course:', courseId);
    return [];
  },

  async createEnrollment(data: EnrollInput): Promise<EnrollmentRecord> {
    // Replace with: return db.enrollment.create({ data: { userId: data.userId, courseId: data.courseId, status: 'ACTIVE' } });
    console.log('[DB] Creating enrollment:', data.userId, data.courseId);
    return {
      id: 'enrollment_' + Date.now(),
      userId: data.userId,
      courseId: data.courseId,
      status: 'ACTIVE',
      progress: 0,
      enrolledAt: new Date(),
      completedAt: null,
      expiresAt: null,
    };
  },

  async updateEnrollment(id: string, data: Partial<EnrollmentRecord>): Promise<EnrollmentRecord | null> {
    // Replace with: return db.enrollment.update({ where: { id }, data });
    console.log('[DB] Updating enrollment:', id);
    return null;
  },

  async upsertProgress(data: ProgressUpdateInput): Promise<ProgressRecord> {
    // Replace with:
    // return db.progress.upsert({
    //   where: { enrollmentId_lessonId: { enrollmentId: data.enrollmentId, lessonId: data.lessonId } },
    //   create: { ...data, completedAt: data.completed ? new Date() : null },
    //   update: { ...data, completedAt: data.completed ? new Date() : undefined },
    // });
    console.log('[DB] Upserting progress:', data.enrollmentId, data.lessonId);
    return {
      id: 'progress_' + Date.now(),
      enrollmentId: data.enrollmentId,
      lessonId: data.lessonId,
      completed: data.completed || false,
      timeSpent: data.timeSpent || 0,
      lastPosition: data.lastPosition || 0,
      completedAt: data.completed ? new Date() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async getProgressForEnrollment(enrollmentId: string): Promise<ProgressRecord[]> {
    // Replace with: return db.progress.findMany({ where: { enrollmentId } });
    console.log('[DB] Getting progress for enrollment:', enrollmentId);
    return [];
  },

  async getTotalLessonsForCourse(courseId: string): Promise<number> {
    // Replace with: return db.lesson.count({ where: { section: { courseId } } });
    console.log('[DB] Getting total lessons for course:', courseId);
    return 0;
  },

  async getCompletedLessonsCount(enrollmentId: string): Promise<number> {
    // Replace with: return db.progress.count({ where: { enrollmentId, completed: true } });
    console.log('[DB] Getting completed lesson count:', enrollmentId);
    return 0;
  },

  async getEnrollmentCount(courseId: string): Promise<number> {
    // Replace with: return db.enrollment.count({ where: { courseId, status: { in: ['ACTIVE', 'COMPLETED'] } } });
    console.log('[DB] Getting enrollment count:', courseId);
    return 0;
  },

  async checkCourseCapacity(courseId: string): Promise<{ maxStudents: number | null; enrolled: number }> {
    // Replace with aggregation query
    console.log('[DB] Checking course capacity:', courseId);
    return { maxStudents: null, enrolled: 0 };
  },
};

// =============================================================================
// Enrollment Service
// =============================================================================

export class EnrollmentService {
  /**
   * Enroll a user in a course
   */
  async enroll(input: EnrollInput): Promise<EnrollmentRecord> {
    // Check if already enrolled
    const existing = await dbOperations.findEnrollment(input.userId, input.courseId);
    if (existing) {
      if (existing.status === 'DROPPED') {
        // Re-enroll
        const updated = await dbOperations.updateEnrollment(existing.id, {
          status: 'ACTIVE',
          progress: 0,
          completedAt: null,
        } as Partial<EnrollmentRecord>);
        return updated || existing;
      }
      throw new Error('Already enrolled in this course');
    }

    // Check capacity
    const capacity = await dbOperations.checkCourseCapacity(input.courseId);
    if (capacity.maxStudents !== null && capacity.enrolled >= capacity.maxStudents) {
      throw new Error('Course is full');
    }

    return dbOperations.createEnrollment(input);
  }

  /**
   * Get all enrollments for a user
   */
  async getUserEnrollments(userId: string) {
    return dbOperations.findEnrollmentsByUser(userId);
  }

  /**
   * Get all enrollments for a course
   */
  async getCourseEnrollments(courseId: string) {
    return dbOperations.findEnrollmentsByCourse(courseId);
  }

  /**
   * Track lesson progress
   */
  async updateProgress(input: ProgressUpdateInput) {
    const progress = await dbOperations.upsertProgress(input);

    // Recalculate enrollment progress percentage
    await this.recalculateProgress(input.enrollmentId);

    return progress;
  }

  /**
   * Mark a lesson as completed
   */
  async completeLesson(enrollmentId: string, lessonId: string) {
    const progress = await dbOperations.upsertProgress({
      enrollmentId,
      lessonId,
      completed: true,
    });

    // Recalculate and check for course completion
    await this.recalculateProgress(enrollmentId);

    return progress;
  }

  /**
   * Get progress for an enrollment
   */
  async getProgress(enrollmentId: string) {
    return dbOperations.getProgressForEnrollment(enrollmentId);
  }

  /**
   * Recalculate enrollment progress percentage and check completion
   */
  private async recalculateProgress(enrollmentId: string) {
    const enrollment = await dbOperations.findEnrollmentById(enrollmentId);
    if (!enrollment) return;

    const totalLessons = await dbOperations.getTotalLessonsForCourse(enrollment.courseId);
    if (totalLessons === 0) return;

    const completedLessons = await dbOperations.getCompletedLessonsCount(enrollmentId);
    const progressPercentage = Math.round((completedLessons / totalLessons) * 100);

    const updateData: Partial<EnrollmentRecord> = {
      progress: progressPercentage,
    };

    // Auto-complete enrollment when all lessons are done
    if (progressPercentage >= 100 && enrollment.status === 'ACTIVE') {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date();
    }

    await dbOperations.updateEnrollment(enrollmentId, updateData);
  }

  /**
   * Drop enrollment
   */
  async dropEnrollment(enrollmentId: string) {
    return dbOperations.updateEnrollment(enrollmentId, {
      status: 'DROPPED',
    } as Partial<EnrollmentRecord>);
  }
}

// =============================================================================
// Factory
// =============================================================================

let enrollmentServiceInstance: EnrollmentService | null = null;

export function getEnrollmentService(): EnrollmentService {
  if (!enrollmentServiceInstance) {
    enrollmentServiceInstance = new EnrollmentService();
  }
  return enrollmentServiceInstance;
}

export default EnrollmentService;
