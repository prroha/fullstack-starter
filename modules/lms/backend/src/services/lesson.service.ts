// =============================================================================
// LMS Lesson Service
// =============================================================================
// Business logic for section and lesson management, ordering, and content.
// Uses dependency injection for PrismaClient.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface SectionCreateInput {
  courseId: string;
  title: string;
  description?: string;
}

export interface SectionUpdateInput {
  title?: string;
  description?: string;
}

export interface LessonCreateInput {
  sectionId: string;
  title: string;
  description?: string;
  type?: 'VIDEO' | 'TEXT' | 'PDF' | 'QUIZ';
  contentUrl?: string;
  contentText?: string;
  duration?: number;
  isFree?: boolean;
}

export interface LessonUpdateInput {
  title?: string;
  description?: string;
  type?: 'VIDEO' | 'TEXT' | 'PDF' | 'QUIZ';
  contentUrl?: string;
  contentText?: string;
  duration?: number;
  isFree?: boolean;
}

// =============================================================================
// Lesson Service
// =============================================================================

export class LessonService {
  constructor(private db: PrismaClient) {}

  // --- Section Methods ---

  async listSections(courseId: string) {
    return this.db.section.findMany({
      where: { courseId },
      orderBy: { sortOrder: 'asc' },
      include: {
        lessons: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async getSection(id: string) {
    return this.db.section.findUnique({
      where: { id },
      include: {
        lessons: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async createSection(input: SectionCreateInput) {
    const maxResult = await this.db.section.aggregate({
      where: { courseId: input.courseId },
      _max: { sortOrder: true },
    });
    const maxOrder = maxResult._max.sortOrder || 0;

    return this.db.section.create({
      data: {
        courseId: input.courseId,
        title: input.title,
        description: input.description,
        sortOrder: maxOrder + 1,
      },
    });
  }

  async updateSection(id: string, input: SectionUpdateInput) {
    return this.db.section.update({
      where: { id },
      data: input,
    });
  }

  async deleteSection(id: string) {
    await this.db.section.delete({ where: { id } });
  }

  async reorderSections(courseId: string, orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, i) =>
        this.db.section.update({
          where: { id },
          data: { sortOrder: i },
        }),
      ),
    );
  }

  // --- Lesson Methods ---

  async getLesson(id: string) {
    return this.db.lesson.findUnique({
      where: { id },
      include: { section: true },
    });
  }

  async createLesson(input: LessonCreateInput) {
    const maxResult = await this.db.lesson.aggregate({
      where: { sectionId: input.sectionId },
      _max: { sortOrder: true },
    });
    const maxOrder = maxResult._max.sortOrder || 0;

    const lesson = await this.db.lesson.create({
      data: {
        sectionId: input.sectionId,
        title: input.title,
        description: input.description,
        type: input.type || 'VIDEO',
        contentUrl: input.contentUrl,
        contentText: input.contentText,
        duration: input.duration || 0,
        sortOrder: maxOrder + 1,
        isFree: input.isFree || false,
      },
    });

    // Recalculate course duration if the lesson has duration
    if (input.duration && input.duration > 0) {
      const section = await this.db.section.findUnique({
        where: { id: input.sectionId },
      });
      if (section) {
        await this.updateCourseDuration(section.courseId);
      }
    }

    return lesson;
  }

  async updateLesson(id: string, input: LessonUpdateInput) {
    const lesson = await this.db.lesson.update({
      where: { id },
      data: input,
    });

    // Recalculate course duration if duration changed
    if (input.duration !== undefined) {
      const existing = await this.db.lesson.findUnique({
        where: { id },
        include: { section: true },
      });
      if (existing) {
        await this.updateCourseDuration(existing.section.courseId);
      }
    }

    return lesson;
  }

  async deleteLesson(id: string) {
    const lesson = await this.db.lesson.findUnique({
      where: { id },
      include: { section: true },
    });

    await this.db.lesson.delete({ where: { id } });

    // Recalculate course duration after deletion
    if (lesson) {
      await this.updateCourseDuration(lesson.section.courseId);
    }
  }

  async reorderLessons(sectionId: string, orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, i) =>
        this.db.lesson.update({
          where: { id },
          data: { sortOrder: i },
        }),
      ),
    );
  }

  // --- Private Helpers ---

  private async updateCourseDuration(courseId: string) {
    const total = await this.db.lesson.aggregate({
      where: { section: { courseId } },
      _sum: { duration: true },
    });
    await this.db.course.update({
      where: { id: courseId },
      data: { duration: total._sum.duration || 0 },
    });
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createLessonService(db: PrismaClient): LessonService {
  return new LessonService(db);
}

let instance: LessonService | null = null;

export function getLessonService(db?: PrismaClient): LessonService {
  if (db) return createLessonService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new LessonService(globalDb);
  }
  return instance;
}

export default LessonService;
