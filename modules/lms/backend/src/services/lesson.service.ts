// =============================================================================
// LMS Lesson Service
// =============================================================================
// Business logic for section and lesson management, ordering, and content.
// Uses placeholder db operations - replace with actual Prisma client.

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

interface SectionRecord {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface LessonRecord {
  id: string;
  sectionId: string;
  title: string;
  description: string | null;
  type: string;
  contentUrl: string | null;
  contentText: string | null;
  duration: number;
  sortOrder: number;
  isFree: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================

const dbOperations = {
  // --- Sections ---
  async findSectionsByCourse(courseId: string): Promise<SectionRecord[]> {
    // Replace with: return db.section.findMany({ where: { courseId }, orderBy: { sortOrder: 'asc' }, include: { lessons: { orderBy: { sortOrder: 'asc' } } } });
    console.log('[DB] Finding sections for course:', courseId);
    return [];
  },

  async findSectionById(id: string): Promise<SectionRecord | null> {
    // Replace with: return db.section.findUnique({ where: { id }, include: { lessons: { orderBy: { sortOrder: 'asc' } } } });
    console.log('[DB] Finding section:', id);
    return null;
  },

  async createSection(data: SectionCreateInput & { sortOrder: number }): Promise<SectionRecord> {
    // Replace with: return db.section.create({ data });
    console.log('[DB] Creating section:', data.title);
    return {
      id: 'section_' + Date.now(),
      courseId: data.courseId,
      title: data.title,
      description: data.description || null,
      sortOrder: data.sortOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async updateSection(id: string, data: SectionUpdateInput): Promise<SectionRecord | null> {
    // Replace with: return db.section.update({ where: { id }, data });
    console.log('[DB] Updating section:', id);
    return null;
  },

  async deleteSection(id: string): Promise<void> {
    // Replace with: await db.section.delete({ where: { id } });
    console.log('[DB] Deleting section:', id);
  },

  async getMaxSectionOrder(courseId: string): Promise<number> {
    // Replace with: const max = await db.section.aggregate({ where: { courseId }, _max: { sortOrder: true } }); return max._max.sortOrder || 0;
    console.log('[DB] Getting max section order for course:', courseId);
    return 0;
  },

  async reorderSections(courseId: string, orderedIds: string[]): Promise<void> {
    // Replace with: await Promise.all(orderedIds.map((id, i) => db.section.update({ where: { id }, data: { sortOrder: i } })));
    console.log('[DB] Reordering sections for course:', courseId);
  },

  // --- Lessons ---
  async findLessonById(id: string): Promise<LessonRecord | null> {
    // Replace with: return db.lesson.findUnique({ where: { id }, include: { section: true } });
    console.log('[DB] Finding lesson:', id);
    return null;
  },

  async createLesson(data: LessonCreateInput & { sortOrder: number }): Promise<LessonRecord> {
    // Replace with: return db.lesson.create({ data });
    console.log('[DB] Creating lesson:', data.title);
    return {
      id: 'lesson_' + Date.now(),
      sectionId: data.sectionId,
      title: data.title,
      description: data.description || null,
      type: data.type || 'VIDEO',
      contentUrl: data.contentUrl || null,
      contentText: data.contentText || null,
      duration: data.duration || 0,
      sortOrder: data.sortOrder,
      isFree: data.isFree || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async updateLesson(id: string, data: LessonUpdateInput): Promise<LessonRecord | null> {
    // Replace with: return db.lesson.update({ where: { id }, data });
    console.log('[DB] Updating lesson:', id);
    return null;
  },

  async deleteLesson(id: string): Promise<void> {
    // Replace with: await db.lesson.delete({ where: { id } });
    console.log('[DB] Deleting lesson:', id);
  },

  async getMaxLessonOrder(sectionId: string): Promise<number> {
    // Replace with: const max = await db.lesson.aggregate({ where: { sectionId }, _max: { sortOrder: true } }); return max._max.sortOrder || 0;
    console.log('[DB] Getting max lesson order for section:', sectionId);
    return 0;
  },

  async reorderLessons(sectionId: string, orderedIds: string[]): Promise<void> {
    // Replace with: await Promise.all(orderedIds.map((id, i) => db.lesson.update({ where: { id }, data: { sortOrder: i } })));
    console.log('[DB] Reordering lessons for section:', sectionId);
  },

  async updateCourseDuration(courseId: string): Promise<void> {
    // Replace with:
    // const total = await db.lesson.aggregate({ where: { section: { courseId } }, _sum: { duration: true } });
    // await db.course.update({ where: { id: courseId }, data: { duration: total._sum.duration || 0 } });
    console.log('[DB] Updating course duration:', courseId);
  },
};

// =============================================================================
// Lesson Service
// =============================================================================

export class LessonService {
  // --- Section Methods ---

  async listSections(courseId: string) {
    return dbOperations.findSectionsByCourse(courseId);
  }

  async getSection(id: string) {
    return dbOperations.findSectionById(id);
  }

  async createSection(input: SectionCreateInput) {
    const maxOrder = await dbOperations.getMaxSectionOrder(input.courseId);
    return dbOperations.createSection({ ...input, sortOrder: maxOrder + 1 });
  }

  async updateSection(id: string, input: SectionUpdateInput) {
    return dbOperations.updateSection(id, input);
  }

  async deleteSection(id: string) {
    return dbOperations.deleteSection(id);
  }

  async reorderSections(courseId: string, orderedIds: string[]) {
    return dbOperations.reorderSections(courseId, orderedIds);
  }

  // --- Lesson Methods ---

  async getLesson(id: string) {
    return dbOperations.findLessonById(id);
  }

  async createLesson(input: LessonCreateInput) {
    const maxOrder = await dbOperations.getMaxLessonOrder(input.sectionId);
    const lesson = await dbOperations.createLesson({ ...input, sortOrder: maxOrder + 1 });

    // Recalculate course duration if the lesson has duration
    if (input.duration && input.duration > 0) {
      const section = await dbOperations.findSectionById(input.sectionId);
      if (section) {
        await dbOperations.updateCourseDuration(section.courseId);
      }
    }

    return lesson;
  }

  async updateLesson(id: string, input: LessonUpdateInput) {
    const lesson = await dbOperations.updateLesson(id, input);

    // Recalculate course duration if duration changed
    if (input.duration !== undefined) {
      const existing = await dbOperations.findLessonById(id);
      if (existing) {
        const section = await dbOperations.findSectionById(existing.sectionId);
        if (section) {
          await dbOperations.updateCourseDuration(section.courseId);
        }
      }
    }

    return lesson;
  }

  async deleteLesson(id: string) {
    const lesson = await dbOperations.findLessonById(id);
    await dbOperations.deleteLesson(id);

    // Recalculate course duration after deletion
    if (lesson) {
      const section = await dbOperations.findSectionById(lesson.sectionId);
      if (section) {
        await dbOperations.updateCourseDuration(section.courseId);
      }
    }
  }

  async reorderLessons(sectionId: string, orderedIds: string[]) {
    return dbOperations.reorderLessons(sectionId, orderedIds);
  }
}

// =============================================================================
// Factory
// =============================================================================

let lessonServiceInstance: LessonService | null = null;

export function getLessonService(): LessonService {
  if (!lessonServiceInstance) {
    lessonServiceInstance = new LessonService();
  }
  return lessonServiceInstance;
}

export default LessonService;
