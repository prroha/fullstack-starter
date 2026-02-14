// =============================================================================
// Canned Response Service
// =============================================================================
// Business logic for managing pre-written response templates that agents can
// quickly insert when replying to tickets. Supports categorization, variable
// placeholders, and per-agent shortcuts.
// Uses placeholder db operations - replace with actual Prisma client.

// =============================================================================
// Types
// =============================================================================

export interface CannedResponseCreateInput {
  userId: string;
  title: string;
  content: string;
  shortcut?: string;
  categoryId?: string;
  isShared?: boolean;
  createdByAgentId?: string;
}

export interface CannedResponseUpdateInput {
  title?: string;
  content?: string;
  shortcut?: string;
  categoryId?: string;
  isShared?: boolean;
}

export interface CannedResponseFilters {
  search?: string;
  categoryId?: string;
  isShared?: boolean;
  createdByAgentId?: string;
  page?: number;
  limit?: number;
}

interface CannedResponseRecord {
  id: string;
  userId: string;
  title: string;
  content: string;
  shortcut: string | null;
  categoryId: string | null;
  isShared: boolean;
  createdByAgentId: string | null;
  usageCount: number;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================
// Replace with actual Prisma client:
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  async createCannedResponse(data: {
    userId: string;
    title: string;
    content: string;
    shortcut: string | null;
    categoryId: string | null;
    isShared: boolean;
    createdByAgentId: string | null;
  }): Promise<CannedResponseRecord> {
    // Replace with: return db.helpdeskCannedResponse.create({ data, include: { category: true, createdByAgent: true } });
    console.log('[DB] Creating canned response:', data.title);
    return {
      id: 'canned_' + Date.now(),
      ...data,
      usageCount: 0,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async updateCannedResponse(id: string, data: Partial<CannedResponseRecord>): Promise<CannedResponseRecord | null> {
    // Replace with: return db.helpdeskCannedResponse.update({ where: { id }, data: { ...data, updatedAt: new Date() }, include: { category: true, createdByAgent: true } });
    console.log('[DB] Updating canned response:', id);
    return null;
  },

  async deleteCannedResponse(id: string): Promise<void> {
    // Replace with: await db.helpdeskCannedResponse.delete({ where: { id } });
    console.log('[DB] Deleting canned response:', id);
  },

  async findCannedResponseById(id: string): Promise<CannedResponseRecord | null> {
    // Replace with: return db.helpdeskCannedResponse.findUnique({ where: { id }, include: { category: true, createdByAgent: true } });
    console.log('[DB] Finding canned response by ID:', id);
    return null;
  },

  async findCannedResponses(userId: string, filters: CannedResponseFilters): Promise<{ items: CannedResponseRecord[]; total: number }> {
    // Replace with:
    // const where = {
    //   userId,
    //   categoryId: filters.categoryId || undefined,
    //   isShared: filters.isShared !== undefined ? filters.isShared : undefined,
    //   createdByAgentId: filters.createdByAgentId || undefined,
    //   OR: filters.search ? [
    //     { title: { contains: filters.search, mode: 'insensitive' } },
    //     { content: { contains: filters.search, mode: 'insensitive' } },
    //     { shortcut: { contains: filters.search, mode: 'insensitive' } },
    //   ] : undefined,
    // };
    // const [items, total] = await Promise.all([
    //   db.helpdeskCannedResponse.findMany({ where, skip: ((filters.page || 1) - 1) * (filters.limit || 20), take: filters.limit || 20, include: { category: true }, orderBy: [{ usageCount: 'desc' }, { title: 'asc' }] }),
    //   db.helpdeskCannedResponse.count({ where }),
    // ]);
    console.log('[DB] Finding canned responses for user:', userId, filters);
    return { items: [], total: 0 };
  },

  async findForAgent(userId: string, agentId: string): Promise<CannedResponseRecord[]> {
    // Replace with:
    // return db.helpdeskCannedResponse.findMany({
    //   where: {
    //     userId,
    //     OR: [
    //       { isShared: true },
    //       { createdByAgentId: agentId },
    //     ],
    //   },
    //   orderBy: [{ usageCount: 'desc' }, { title: 'asc' }],
    //   include: { category: true },
    // });
    console.log('[DB] Finding canned responses for agent:', agentId, 'user:', userId);
    return [];
  },

  async incrementUsageCount(id: string): Promise<void> {
    // Replace with: await db.helpdeskCannedResponse.update({ where: { id }, data: { usageCount: { increment: 1 }, lastUsedAt: new Date() } });
    console.log('[DB] Incrementing usage count for canned response:', id);
  },

  async checkShortcutExists(userId: string, shortcut: string, excludeId?: string): Promise<boolean> {
    // Replace with:
    // const where: any = { userId, shortcut };
    // if (excludeId) where.id = { not: excludeId };
    // return !!(await db.helpdeskCannedResponse.findFirst({ where }));
    console.log('[DB] Checking if shortcut exists:', shortcut);
    return false;
  },

  async checkCannedResponseBelongsToUser(cannedResponseId: string, userId: string): Promise<boolean> {
    // Replace with: return !!(await db.helpdeskCannedResponse.findFirst({ where: { id: cannedResponseId, userId } }));
    console.log('[DB] Checking canned response ownership:', cannedResponseId, userId);
    return false;
  },
};

// =============================================================================
// Canned Response Service
// =============================================================================

export class CannedResponseService {
  /**
   * Create a new canned response template.
   * Validates shortcut uniqueness if provided.
   */
  async create(input: CannedResponseCreateInput): Promise<CannedResponseRecord> {
    if (input.shortcut) {
      const shortcutExists = await dbOperations.checkShortcutExists(input.userId, input.shortcut);
      if (shortcutExists) {
        throw new Error('A canned response with this shortcut already exists');
      }
    }

    return dbOperations.createCannedResponse({
      userId: input.userId,
      title: input.title,
      content: input.content,
      shortcut: input.shortcut || null,
      categoryId: input.categoryId || null,
      isShared: input.isShared ?? true,
      createdByAgentId: input.createdByAgentId || null,
    });
  }

  /**
   * Update an existing canned response. Validates ownership and shortcut uniqueness.
   */
  async update(id: string, userId: string, input: CannedResponseUpdateInput): Promise<CannedResponseRecord | null> {
    const belongs = await dbOperations.checkCannedResponseBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Canned response not found');
    }

    if (input.shortcut) {
      const shortcutExists = await dbOperations.checkShortcutExists(userId, input.shortcut, id);
      if (shortcutExists) {
        throw new Error('A canned response with this shortcut already exists');
      }
    }

    return dbOperations.updateCannedResponse(id, input as Partial<CannedResponseRecord>);
  }

  /**
   * Delete a canned response. Validates ownership.
   */
  async delete(id: string, userId: string): Promise<void> {
    const belongs = await dbOperations.checkCannedResponseBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Canned response not found');
    }

    return dbOperations.deleteCannedResponse(id);
  }

  /**
   * Get a single canned response by ID with ownership check.
   * Increments usage count (for tracking popular templates).
   */
  async getById(id: string, userId: string): Promise<CannedResponseRecord | null> {
    const belongs = await dbOperations.checkCannedResponseBelongsToUser(id, userId);
    if (!belongs) {
      return null;
    }

    const response = await dbOperations.findCannedResponseById(id);

    // Track usage when an agent opens a canned response (likely to use it)
    if (response) {
      await dbOperations.incrementUsageCount(id);
    }

    return response;
  }

  /**
   * List canned responses with filtering and pagination.
   * Ordered by usage count (most popular first).
   */
  async list(userId: string, filters: CannedResponseFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await dbOperations.findCannedResponses(userId, {
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
   * Get all canned responses available to a specific agent.
   * Returns shared responses plus the agent's own private responses.
   * No pagination — designed for agent quick-select dropdowns.
   */
  async getForAgent(userId: string, agentId: string): Promise<CannedResponseRecord[]> {
    return dbOperations.findForAgent(userId, agentId);
  }

  /**
   * Render a canned response by replacing variable placeholders with actual values.
   * Supported placeholders: {{ticket_number}}, {{customer_name}}, {{agent_name}}, etc.
   */
  renderTemplate(content: string, variables: Record<string, string>): string {
    let rendered = content;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return rendered;
  }
}

// =============================================================================
// Factory
// =============================================================================

let cannedResponseServiceInstance: CannedResponseService | null = null;

export function getCannedResponseService(): CannedResponseService {
  if (!cannedResponseServiceInstance) {
    cannedResponseServiceInstance = new CannedResponseService();
  }
  return cannedResponseServiceInstance;
}

export default CannedResponseService;
