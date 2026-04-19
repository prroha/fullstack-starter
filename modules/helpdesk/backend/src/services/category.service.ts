// =============================================================================
// Category Service
// =============================================================================
// Business logic for ticket category management: CRUD, reordering, and toggling
// active state. Categories help organize tickets into logical groups.
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface CategoryCreateInput {
  userId: string;
  name: string;
  description?: string;
  color?: string;
  parentId?: string;
}

export interface CategoryUpdateInput {
  name?: string;
  description?: string;
  color?: string;
  parentId?: string;
}

export interface CategoryFilters {
  search?: string;
  isActive?: boolean;
  parentId?: string;
  page?: number;
  limit?: number;
}

// =============================================================================
// Category Service
// =============================================================================

export class CategoryService {
  constructor(private db: PrismaClient) {}

  /**
   * Create a new ticket category. Automatically assigns the next sort order.
   */
  async create(input: CategoryCreateInput) {
    const maxResult = await this.db.helpdeskCategory.aggregate({
      where: { userId: input.userId },
      _max: { sortOrder: true },
    });
    const maxSortOrder = maxResult._max.sortOrder || 0;

    return this.db.helpdeskCategory.create({
      data: {
        userId: input.userId,
        name: input.name,
        description: input.description || null,
        color: input.color || null,
        parentId: input.parentId || null,
        isActive: true,
        sortOrder: maxSortOrder + 1,
      },
      include: { parent: true, _count: { select: { tickets: true } } },
    });
  }

  /**
   * Update an existing category. Validates ownership.
   */
  async update(id: string, userId: string, input: CategoryUpdateInput) {
    const belongs = await this.db.helpdeskCategory.findFirst({ where: { id, userId } });
    if (!belongs) {
      throw new Error('Category not found');
    }

    // Prevent setting a category as its own parent
    if (input.parentId && input.parentId === id) {
      throw new Error('A category cannot be its own parent');
    }

    return this.db.helpdeskCategory.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.color !== undefined && { color: input.color }),
        ...(input.parentId !== undefined && { parentId: input.parentId }),
      },
      include: { parent: true, _count: { select: { tickets: true } } },
    });
  }

  /**
   * Delete a category. Validates ownership, checks for child categories and ticket usage.
   */
  async delete(id: string, userId: string): Promise<void> {
    const belongs = await this.db.helpdeskCategory.findFirst({ where: { id, userId } });
    if (!belongs) {
      throw new Error('Category not found');
    }

    const hasChildren = await this.db.helpdeskCategory.findFirst({ where: { parentId: id } });
    if (hasChildren) {
      throw new Error('Cannot delete a category that has subcategories. Remove or reassign them first.');
    }

    const inUse = await this.db.ticket.findFirst({ where: { categoryId: id } });
    if (inUse) {
      throw new Error('Cannot delete a category that has tickets assigned. Reassign tickets first or deactivate the category.');
    }

    await this.db.helpdeskCategory.delete({ where: { id } });
  }

  /**
   * Get a single category by ID with ownership check
   */
  async getById(id: string, userId: string) {
    const category = await this.db.helpdeskCategory.findFirst({
      where: { id, userId },
      include: { parent: true, children: true, _count: { select: { tickets: true } } },
    });
    return category;
  }

  /**
   * List categories with filtering and pagination
   */
  async list(userId: string, filters: CategoryFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;

    const where: Record<string, unknown> = { userId };

    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.parentId !== undefined) where.parentId = filters.parentId;

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.db.helpdeskCategory.findMany({
        where: where as never,
        skip: (page - 1) * limit,
        take: limit,
        include: { parent: true, _count: { select: { tickets: true } } },
        orderBy: { sortOrder: 'asc' },
      }),
      this.db.helpdeskCategory.count({ where: where as never }),
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
   * Get all active categories (no pagination, for dropdowns/selectors)
   */
  async listAll(userId: string) {
    return this.db.helpdeskCategory.findMany({
      where: { userId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Reorder categories by providing an array of { id, sortOrder } pairs.
   * Validates that all categories belong to the user.
   */
  async reorder(userId: string, updates: Array<{ id: string; sortOrder: number }>): Promise<void> {
    // Validate all categories belong to this user
    for (const update of updates) {
      const belongs = await this.db.helpdeskCategory.findFirst({ where: { id: update.id, userId } });
      if (!belongs) {
        throw new Error(`Category ${update.id} not found`);
      }
    }

    await Promise.all(
      updates.map((u) =>
        this.db.helpdeskCategory.update({
          where: { id: u.id },
          data: { sortOrder: u.sortOrder },
        })
      )
    );
  }

  /**
   * Toggle a category's active state. Inactive categories cannot be assigned to new tickets.
   */
  async toggleActive(id: string, userId: string) {
    const category = await this.db.helpdeskCategory.findFirst({ where: { id, userId } });
    if (!category) {
      throw new Error('Category not found');
    }

    return this.db.helpdeskCategory.update({
      where: { id },
      data: { isActive: !category.isActive },
      include: { parent: true, _count: { select: { tickets: true } } },
    });
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createCategoryService(db: PrismaClient): CategoryService {
  return new CategoryService(db);
}

let instance: CategoryService | null = null;

export function getCategoryService(db?: PrismaClient): CategoryService {
  if (db) return createCategoryService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new CategoryService(globalDb);
  }
  return instance;
}

export default CategoryService;
