// =============================================================================
// LMS Course Service
// =============================================================================
// Business logic for course management, slug generation, and category handling.
// Uses dependency injection for PrismaClient.

import type { PrismaClient } from '@prisma/client';

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

// =============================================================================
// Course Service
// =============================================================================

export class CourseService {
  constructor(private db: PrismaClient) {}

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

    while (await this.db.course.findUnique({ where: { slug } })) {
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
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.instructorId) {
      where.instructorId = filters.instructorId;
    }
    if (filters.level) {
      where.level = filters.level;
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        (where.price as Record<string, unknown>).gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        (where.price as Record<string, unknown>).lte = filters.maxPrice;
      }
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.categorySlug) {
      where.categories = {
        some: {
          category: { slug: filters.categorySlug },
        },
      };
    }

    const [items, total] = await Promise.all([
      this.db.course.findMany({
        where,
        skip,
        take: limit,
        include: {
          categories: { include: { category: true } },
          sections: { include: { lessons: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.db.course.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single course by ID
   */
  async getCourseById(id: string) {
    return this.db.course.findUnique({
      where: { id },
      include: {
        categories: { include: { category: true } },
        sections: {
          include: { lessons: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Get a single course by slug (public-facing)
   */
  async getCourseBySlug(slug: string) {
    const course = await this.db.course.findUnique({
      where: { slug },
      include: {
        categories: { include: { category: true } },
        sections: {
          include: { lessons: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
        reviews: true,
      },
    });
    if (!course) return null;

    const [enrollmentCount, avgRatingResult, revenue] = await Promise.all([
      this.db.enrollment.count({
        where: { courseId: course.id, status: { in: ['ACTIVE', 'COMPLETED'] } },
      }),
      this.db.review.aggregate({
        where: { courseId: course.id },
        _avg: { rating: true },
      }),
      this.db.enrollment.count({
        where: { courseId: course.id },
      }),
    ]);

    return {
      ...course,
      enrollmentCount,
      avgRating: avgRatingResult._avg.rating || 0,
      revenue: revenue * course.price,
    };
  }

  /**
   * Create a new course
   */
  async createCourse(input: CourseCreateInput) {
    const slug = await this.generateSlug(input.title);
    const { categoryIds, ...data } = input;

    return this.db.course.create({
      data: {
        ...data,
        slug,
        categories: categoryIds?.length
          ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
      },
      include: {
        categories: { include: { category: true } },
      },
    });
  }

  /**
   * Update an existing course
   */
  async updateCourse(id: string, input: CourseUpdateInput) {
    const { categoryIds, ...data } = input;

    // If categoryIds provided, replace all categories
    if (categoryIds !== undefined) {
      await this.db.courseCategory.deleteMany({ where: { courseId: id } });
    }

    return this.db.course.update({
      where: { id },
      data: {
        ...data,
        categories: categoryIds?.length
          ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
      },
      include: {
        categories: { include: { category: true } },
      },
    });
  }

  /**
   * Delete a course (cascades to sections, lessons, etc.)
   */
  async deleteCourse(id: string) {
    await this.db.course.delete({ where: { id } });
  }

  /**
   * Publish a course (make it visible to students)
   */
  async publishCourse(id: string) {
    return this.db.course.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
  }

  /**
   * Unpublish a course (hide from students)
   */
  async unpublishCourse(id: string) {
    return this.db.course.update({
      where: { id },
      data: { status: 'DRAFT', publishedAt: null },
    });
  }

  /**
   * List all categories
   */
  async listCategories() {
    return this.db.category.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Create a new category
   */
  async createCategory(data: { name: string; description?: string; iconName?: string }) {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return this.db.category.create({
      data: { ...data, slug },
    });
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createCourseService(db: PrismaClient): CourseService {
  return new CourseService(db);
}

let instance: CourseService | null = null;

export function getCourseService(db?: PrismaClient): CourseService {
  if (db) return createCourseService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new CourseService(globalDb);
  }
  return instance;
}

export default CourseService;
