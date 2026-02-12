// =============================================================================
// LMS Course Service
// =============================================================================
// Business logic for course management, slug generation, and category handling.
// Uses placeholder db operations - replace with actual Prisma client.

// =============================================================================
// Types
// =============================================================================

export interface CourseCreateInput {
  title: string;
  description: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  instructorId: string;
  price?: number;
  compareAtPrice?: number;
  currency?: string;
  level?: string;
  language?: string;
  maxStudents?: number;
  categoryIds?: string[];
}

export interface CourseUpdateInput {
  title?: string;
  description?: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  price?: number;
  compareAtPrice?: number;
  level?: string;
  language?: string;
  maxStudents?: number;
  categoryIds?: string[];
}

export interface CourseFilters {
  status?: string;
  instructorId?: string;
  categorySlug?: string;
  level?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
}

interface CourseRecord {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  instructorId: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  status: string;
  level: string | null;
  language: string;
  duration: number;
  maxStudents: number | null;
  isFeatured: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string | null;
  displayOrder: number;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================
// Replace with actual Prisma client:
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  async findCourses(filters: CourseFilters): Promise<{ items: CourseRecord[]; total: number }> {
    // Replace with:
    // const where = { status: filters.status, instructorId: filters.instructorId, ... };
    // const [items, total] = await Promise.all([
    //   db.course.findMany({ where, skip, take, include: { categories: true, sections: true } }),
    //   db.course.count({ where }),
    // ]);
    console.log('[DB] Finding courses with filters:', filters);
    return { items: [], total: 0 };
  },

  async findCourseById(id: string): Promise<CourseRecord | null> {
    // Replace with: return db.course.findUnique({ where: { id }, include: { categories: true, sections: { include: { lessons: true } } } });
    console.log('[DB] Finding course by ID:', id);
    return null;
  },

  async findCourseBySlug(slug: string): Promise<CourseRecord | null> {
    // Replace with: return db.course.findUnique({ where: { slug }, include: { categories: true, sections: { include: { lessons: true } }, reviews: true } });
    console.log('[DB] Finding course by slug:', slug);
    return null;
  },

  async createCourse(data: CourseCreateInput & { slug: string }): Promise<CourseRecord> {
    // Replace with:
    // return db.course.create({
    //   data: {
    //     ...data,
    //     categories: { create: data.categoryIds?.map(id => ({ categoryId: id })) },
    //   },
    //   include: { categories: true },
    // });
    console.log('[DB] Creating course:', data.title);
    return {
      id: 'course_' + Date.now(),
      ...data,
      shortDescription: data.shortDescription || null,
      thumbnailUrl: data.thumbnailUrl || null,
      price: data.price || 0,
      compareAtPrice: data.compareAtPrice || null,
      currency: data.currency || 'usd',
      status: 'DRAFT',
      level: data.level || null,
      language: data.language || 'en',
      duration: 0,
      maxStudents: data.maxStudents || null,
      isFeatured: false,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async updateCourse(id: string, data: CourseUpdateInput): Promise<CourseRecord | null> {
    // Replace with: return db.course.update({ where: { id }, data: { ...data, categories: { ... } } });
    console.log('[DB] Updating course:', id);
    return null;
  },

  async deleteCourse(id: string): Promise<void> {
    // Replace with: await db.course.delete({ where: { id } });
    console.log('[DB] Deleting course:', id);
  },

  async publishCourse(id: string): Promise<CourseRecord | null> {
    // Replace with: return db.course.update({ where: { id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
    console.log('[DB] Publishing course:', id);
    return null;
  },

  async unpublishCourse(id: string): Promise<CourseRecord | null> {
    // Replace with: return db.course.update({ where: { id }, data: { status: 'DRAFT', publishedAt: null } });
    console.log('[DB] Unpublishing course:', id);
    return null;
  },

  async findCategories(): Promise<CategoryRecord[]> {
    // Replace with: return db.category.findMany({ orderBy: { displayOrder: 'asc' } });
    console.log('[DB] Finding categories');
    return [];
  },

  async findCategoryBySlug(slug: string): Promise<CategoryRecord | null> {
    // Replace with: return db.category.findUnique({ where: { slug } });
    console.log('[DB] Finding category by slug:', slug);
    return null;
  },

  async createCategory(data: { name: string; slug: string; description?: string; iconName?: string }): Promise<CategoryRecord> {
    // Replace with: return db.category.create({ data });
    console.log('[DB] Creating category:', data.name);
    return {
      id: 'cat_' + Date.now(),
      ...data,
      description: data.description || null,
      iconName: data.iconName || null,
      displayOrder: 0,
    };
  },

  async slugExists(slug: string): Promise<boolean> {
    // Replace with: return !!(await db.course.findUnique({ where: { slug } }));
    console.log('[DB] Checking slug existence:', slug);
    return false;
  },

  async getCourseStats(courseId: string): Promise<{ enrollmentCount: number; avgRating: number; revenue: number }> {
    // Replace with aggregation queries
    console.log('[DB] Getting course stats:', courseId);
    return { enrollmentCount: 0, avgRating: 0, revenue: 0 };
  },
};

// =============================================================================
// Course Service
// =============================================================================

export class CourseService {
  /**
   * Generate a unique URL slug from the course title
   */
  async generateSlug(title: string): Promise<string> {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = base;
    let counter = 1;

    while (await dbOperations.slugExists(slug)) {
      slug = `${base}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * List courses with filtering and pagination
   */
  async listCourses(filters: CourseFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await dbOperations.findCourses({
      ...filters,
      page,
      limit,
    });

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  /**
   * Get a single course by ID
   */
  async getCourseById(id: string) {
    return dbOperations.findCourseById(id);
  }

  /**
   * Get a single course by slug (public-facing)
   */
  async getCourseBySlug(slug: string) {
    const course = await dbOperations.findCourseBySlug(slug);
    if (!course) return null;

    const stats = await dbOperations.getCourseStats(course.id);
    return { ...course, ...stats };
  }

  /**
   * Create a new course
   */
  async createCourse(input: CourseCreateInput) {
    const slug = await this.generateSlug(input.title);
    return dbOperations.createCourse({ ...input, slug });
  }

  /**
   * Update an existing course
   */
  async updateCourse(id: string, input: CourseUpdateInput) {
    return dbOperations.updateCourse(id, input);
  }

  /**
   * Delete a course (cascades to sections, lessons, etc.)
   */
  async deleteCourse(id: string) {
    return dbOperations.deleteCourse(id);
  }

  /**
   * Publish a course (make it visible to students)
   */
  async publishCourse(id: string) {
    return dbOperations.publishCourse(id);
  }

  /**
   * Unpublish a course (hide from students)
   */
  async unpublishCourse(id: string) {
    return dbOperations.unpublishCourse(id);
  }

  /**
   * List all categories
   */
  async listCategories() {
    return dbOperations.findCategories();
  }

  /**
   * Create a new category
   */
  async createCategory(data: { name: string; description?: string; iconName?: string }) {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return dbOperations.createCategory({ ...data, slug });
  }
}

// =============================================================================
// Factory
// =============================================================================

let courseServiceInstance: CourseService | null = null;

export function getCourseService(): CourseService {
  if (!courseServiceInstance) {
    courseServiceInstance = new CourseService();
  }
  return courseServiceInstance;
}

export default CourseService;
