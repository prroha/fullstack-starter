// =============================================================================
// Category Service
// =============================================================================
// Business logic for ticket category management: CRUD, reordering, and toggling
// active state. Categories help organize tickets into logical groups.
// Uses placeholder db operations - replace with actual Prisma client.

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

interface CategoryRecord {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  ticketCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================
// Replace with actual Prisma client:
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  async createCategory(data: {
    userId: string;
    name: string;
    description: string | null;
    color: string | null;
    parentId: string | null;
    isActive: boolean;
    sortOrder: number;
  }): Promise<CategoryRecord> {
    // Replace with: return db.helpdeskCategory.create({ data, include: { parent: true, _count: { select: { tickets: true } } } });
    console.log('[DB] Creating category:', data.name);
    return {
      id: 'cat_' + Date.now(),
      ...data,
      ticketCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async updateCategory(id: string, data: Partial<CategoryRecord>): Promise<CategoryRecord | null> {
    // Replace with: return db.helpdeskCategory.update({ where: { id }, data: { ...data, updatedAt: new Date() }, include: { parent: true, _count: { select: { tickets: true } } } });
    console.log('[DB] Updating category:', id);
    return null;
  },

  async deleteCategory(id: string): Promise<void> {
    // Replace with: await db.helpdeskCategory.delete({ where: { id } });
    console.log('[DB] Deleting category:', id);
  },

  async findCategoryById(id: string): Promise<CategoryRecord | null> {
    // Replace with: return db.helpdeskCategory.findUnique({ where: { id }, include: { parent: true, children: true, _count: { select: { tickets: true } } } });
    console.log('[DB] Finding category by ID:', id);
    return null;
  },

  async findCategories(userId: string, filters: CategoryFilters): Promise<{ items: CategoryRecord[]; total: number }> {
    // Replace with:
    // const where = {
    //   userId,
    //   isActive: filters.isActive !== undefined ? filters.isActive : undefined,
    //   parentId: filters.parentId !== undefined ? filters.parentId : undefined,
    //   OR: filters.search ? [
    //     { name: { contains: filters.search, mode: 'insensitive' } },
    //     { description: { contains: filters.search, mode: 'insensitive' } },
    //   ] : undefined,
    // };
    // const [items, total] = await Promise.all([
    //   db.helpdeskCategory.findMany({ where, skip: ((filters.page || 1) - 1) * (filters.limit || 50), take: filters.limit || 50, include: { parent: true, _count: { select: { tickets: true } } }, orderBy: { sortOrder: 'asc' } }),
    //   db.helpdeskCategory.count({ where }),
    // ]);
    console.log('[DB] Finding categories for user:', userId, filters);
    return { items: [], total: 0 };
  },

  async findAllCategories(userId: string): Promise<CategoryRecord[]> {
    // Replace with: return db.helpdeskCategory.findMany({ where: { userId, isActive: true }, orderBy: { sortOrder: 'asc' } });
    console.log('[DB] Finding all active categories for user:', userId);
    return [];
  },

  async getMaxSortOrder(userId: string): Promise<number> {
    // Replace with:
    // const result = await db.helpdeskCategory.aggregate({ where: { userId }, _max: { sortOrder: true } });
    // return result._max.sortOrder || 0;
    console.log('[DB] Getting max sort order for user:', userId);
    return 0;
  },

  async updateSortOrders(updates: Array<{ id: string; sortOrder: number }>): Promise<void> {
    // Replace with:
    // await Promise.all(updates.map(u => db.helpdeskCategory.update({ where: { id: u.id }, data: { sortOrder: u.sortOrder, updatedAt: new Date() } })));
    console.log('[DB] Updating sort orders for', updates.length, 'categories');
  },

  async checkCategoryBelongsToUser(categoryId: string, userId: string): Promise<boolean> {
    // Replace with: return !!(await db.helpdeskCategory.findFirst({ where: { id: categoryId, userId } }));
    console.log('[DB] Checking category ownership:', categoryId, userId);
    return false;
  },

  async isCategoryInUse(categoryId: string): Promise<boolean> {
    // Replace with: return !!(await db.helpdeskTicket.findFirst({ where: { categoryId } }));
    console.log('[DB] Checking if category is in use:', categoryId);
    return false;
  },

  async hasChildCategories(categoryId: string): Promise<boolean> {
    // Replace with: return !!(await db.helpdeskCategory.findFirst({ where: { parentId: categoryId } }));
    console.log('[DB] Checking if category has children:', categoryId);
    return false;
  },
};

// =============================================================================
// Category Service
// =============================================================================

export class CategoryService {
  /**
   * Create a new ticket category. Automatically assigns the next sort order.
   */
  async create(input: CategoryCreateInput): Promise<CategoryRecord> {
    const maxSortOrder = await dbOperations.getMaxSortOrder(input.userId);

    return dbOperations.createCategory({
      userId: input.userId,
      name: input.name,
      description: input.description || null,
      color: input.color || null,
      parentId: input.parentId || null,
      isActive: true,
      sortOrder: maxSortOrder + 1,
    });
  }

  /**
   * Update an existing category. Validates ownership.
   */
  async update(id: string, userId: string, input: CategoryUpdateInput): Promise<CategoryRecord | null> {
    const belongs = await dbOperations.checkCategoryBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Category not found');
    }

    // Prevent setting a category as its own parent
    if (input.parentId && input.parentId === id) {
      throw new Error('A category cannot be its own parent');
    }

    return dbOperations.updateCategory(id, input as Partial<CategoryRecord>);
  }

  /**
   * Delete a category. Validates ownership, checks for child categories and ticket usage.
   */
  async delete(id: string, userId: string): Promise<void> {
    const belongs = await dbOperations.checkCategoryBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Category not found');
    }

    const hasChildren = await dbOperations.hasChildCategories(id);
    if (hasChildren) {
      throw new Error('Cannot delete a category that has subcategories. Remove or reassign them first.');
    }

    const inUse = await dbOperations.isCategoryInUse(id);
    if (inUse) {
      throw new Error('Cannot delete a category that has tickets assigned. Reassign tickets first or deactivate the category.');
    }

    return dbOperations.deleteCategory(id);
  }

  /**
   * Get a single category by ID with ownership check
   */
  async getById(id: string, userId: string): Promise<CategoryRecord | null> {
    const belongs = await dbOperations.checkCategoryBelongsToUser(id, userId);
    if (!belongs) {
      return null;
    }

    return dbOperations.findCategoryById(id);
  }

  /**
   * List categories with filtering and pagination
   */
  async list(userId: string, filters: CategoryFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;

    const result = await dbOperations.findCategories(userId, {
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
   * Get all active categories (no pagination, for dropdowns/selectors)
   */
  async listAll(userId: string): Promise<CategoryRecord[]> {
    return dbOperations.findAllCategories(userId);
  }

  /**
   * Reorder categories by providing an array of { id, sortOrder } pairs.
   * Validates that all categories belong to the user.
   */
  async reorder(userId: string, updates: Array<{ id: string; sortOrder: number }>): Promise<void> {
    // Validate all categories belong to this user
    for (const update of updates) {
      const belongs = await dbOperations.checkCategoryBelongsToUser(update.id, userId);
      if (!belongs) {
        throw new Error(`Category ${update.id} not found`);
      }
    }

    await dbOperations.updateSortOrders(updates);
  }

  /**
   * Toggle a category's active state. Inactive categories cannot be assigned to new tickets.
   */
  async toggleActive(id: string, userId: string): Promise<CategoryRecord | null> {
    const belongs = await dbOperations.checkCategoryBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Category not found');
    }

    const category = await dbOperations.findCategoryById(id);
    if (!category) {
      throw new Error('Category not found');
    }

    return dbOperations.updateCategory(id, { isActive: !category.isActive } as Partial<CategoryRecord>);
  }
}

// =============================================================================
// Factory
// =============================================================================

let categoryServiceInstance: CategoryService | null = null;

export function getCategoryService(): CategoryService {
  if (!categoryServiceInstance) {
    categoryServiceInstance = new CategoryService();
  }
  return categoryServiceInstance;
}

export default CategoryService;
