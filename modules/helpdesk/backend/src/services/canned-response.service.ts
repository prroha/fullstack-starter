// =============================================================================
// Canned Response Service
// =============================================================================
// Business logic for managing pre-written response templates that agents can
// quickly insert when replying to tickets. Supports categorization, variable
// placeholders, and per-agent shortcuts.
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

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

// =============================================================================
// Canned Response Service
// =============================================================================

export class CannedResponseService {
  constructor(private db: PrismaClient) {}

  /**
   * Create a new canned response template.
   * Validates shortcut uniqueness if provided.
   */
  async create(input: CannedResponseCreateInput) {
    if (input.shortcut) {
      const shortcutExists = await this.db.cannedResponse.findFirst({
        where: { userId: input.userId, shortcut: input.shortcut },
      });
      if (shortcutExists) {
        throw new Error('A canned response with this shortcut already exists');
      }
    }

    return this.db.cannedResponse.create({
      data: {
        userId: input.userId,
        title: input.title,
        content: input.content,
        shortcut: input.shortcut || null,
        categoryId: input.categoryId || null,
        isShared: input.isShared ?? true,
        createdByAgentId: input.createdByAgentId || null,
      },
      include: { category: true, createdByAgent: true },
    });
  }

  /**
   * Update an existing canned response. Validates ownership and shortcut uniqueness.
   */
  async update(id: string, userId: string, input: CannedResponseUpdateInput) {
    const belongs = await this.db.cannedResponse.findFirst({ where: { id, userId } });
    if (!belongs) {
      throw new Error('Canned response not found');
    }

    if (input.shortcut) {
      const shortcutExists = await this.db.cannedResponse.findFirst({
        where: { userId, shortcut: input.shortcut, id: { not: id } },
      });
      if (shortcutExists) {
        throw new Error('A canned response with this shortcut already exists');
      }
    }

    return this.db.cannedResponse.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.shortcut !== undefined && { shortcut: input.shortcut }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.isShared !== undefined && { isShared: input.isShared }),
      },
      include: { category: true, createdByAgent: true },
    });
  }

  /**
   * Delete a canned response. Validates ownership.
   */
  async delete(id: string, userId: string): Promise<void> {
    const belongs = await this.db.cannedResponse.findFirst({ where: { id, userId } });
    if (!belongs) {
      throw new Error('Canned response not found');
    }

    await this.db.cannedResponse.delete({ where: { id } });
  }

  /**
   * Get a single canned response by ID with ownership check.
   * Increments usage count (for tracking popular templates).
   */
  async getById(id: string, userId: string) {
    const response = await this.db.cannedResponse.findFirst({
      where: { id, userId },
      include: { category: true, createdByAgent: true },
    });

    // Track usage when an agent opens a canned response (likely to use it)
    if (response) {
      await this.db.cannedResponse.update({
        where: { id },
        data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
      });
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

    const where: Record<string, unknown> = { userId };

    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.isShared !== undefined) where.isShared = filters.isShared;
    if (filters.createdByAgentId) where.createdByAgentId = filters.createdByAgentId;

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
        { shortcut: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.db.cannedResponse.findMany({
        where: where as never,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true, createdByAgent: true },
        orderBy: { usageCount: 'desc' },
      }),
      this.db.cannedResponse.count({ where: where as never }),
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
   * Get all canned responses available to a specific agent.
   * Returns shared responses plus the agent's own private responses.
   * No pagination -- designed for agent quick-select dropdowns.
   */
  async getForAgent(userId: string, agentId: string) {
    return this.db.cannedResponse.findMany({
      where: {
        userId,
        OR: [
          { isShared: true },
          { createdByAgentId: agentId },
        ],
      },
      include: { category: true },
      orderBy: { usageCount: 'desc' },
    });
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

export function createCannedResponseService(db: PrismaClient): CannedResponseService {
  return new CannedResponseService(db);
}

let instance: CannedResponseService | null = null;

export function getCannedResponseService(db?: PrismaClient): CannedResponseService {
  if (db) return createCannedResponseService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new CannedResponseService(globalDb);
  }
  return instance;
}

export default CannedResponseService;
