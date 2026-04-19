// =============================================================================
// Ticket Service
// =============================================================================
// Business logic for ticket creation, assignment, status changes, messages, tags, and stats.
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface TicketCreateInput {
  userId: string;
  categoryId?: string;
  subject: string;
  description: string;
  priority?: string;
}

export interface TicketUpdateInput {
  categoryId?: string;
  subject?: string;
  description?: string;
  priority?: string;
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  categoryId?: string;
  assignedAgentId?: string;
  tagId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface MessageCreateInput {
  senderId: string;
  senderType: string;
  body: string;
  isInternal?: boolean;
}

export interface TicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  avgResolutionHours: number;
  slaBreachedCount: number;
  unassignedCount: number;
  ticketsToday: number;
}

// =============================================================================
// Ticket Service
// =============================================================================

export class TicketService {
  constructor(private db: PrismaClient) {}

  /**
   * Generate a sequential ticket number using the user's settings prefix.
   * Creates default settings if none exist (prefix: "TKT-", starting at 1001).
   */
  async generateTicketNumber(userId: string): Promise<string> {
    let settings = await this.db.helpdeskSettings.findUnique({ where: { userId } });
    if (!settings) {
      settings = await this.db.helpdeskSettings.upsert({
        where: { userId },
        create: { userId, ticketPrefix: 'TKT-', nextTicketNumber: 1001 },
        update: {},
      });
    }
    const ticketNumber = `${settings.ticketPrefix}${settings.nextTicketNumber.toString().padStart(4, '0')}`;
    await this.db.helpdeskSettings.update({
      where: { userId },
      data: { nextTicketNumber: { increment: 1 } },
    });
    return ticketNumber;
  }

  /**
   * Create a new support ticket. Generates a unique ticket number automatically.
   */
  async create(input: TicketCreateInput) {
    const ticketNumber = await this.generateTicketNumber(input.userId);

    return this.db.ticket.create({
      data: {
        userId: input.userId,
        ticketNumber,
        categoryId: input.categoryId || null,
        assignedAgentId: null,
        subject: input.subject,
        description: input.description,
        status: 'OPEN',
        priority: (input.priority as never) || 'MEDIUM',
      },
      include: { category: true, assignedAgent: true, tags: { include: { tag: true } } },
    });
  }

  /**
   * Update ticket details. Validates ownership.
   */
  async update(id: string, userId: string, input: TicketUpdateInput) {
    const belongs = await this.db.ticket.findFirst({ where: { id, userId } });
    if (!belongs) {
      throw new Error('Ticket not found');
    }

    return this.db.ticket.update({
      where: { id },
      data: {
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.subject !== undefined && { subject: input.subject }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.priority !== undefined && { priority: input.priority as never }),
      },
      include: { category: true, assignedAgent: true, tags: { include: { tag: true } } },
    });
  }

  /**
   * Delete a ticket. Validates ownership.
   */
  async delete(id: string, userId: string): Promise<void> {
    const belongs = await this.db.ticket.findFirst({ where: { id, userId } });
    if (!belongs) {
      throw new Error('Ticket not found');
    }

    await this.db.ticket.delete({ where: { id } });
  }

  /**
   * Get a single ticket by ID with ownership check
   */
  async getById(id: string, userId: string) {
    const ticket = await this.db.ticket.findFirst({
      where: { id, userId },
      include: {
        category: true,
        assignedAgent: true,
        tags: { include: { tag: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    return ticket;
  }

  /**
   * List tickets with filtering, search, and pagination
   */
  async list(userId: string, filters: TicketFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Record<string, unknown> = { userId };

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.assignedAgentId) where.assignedAgentId = filters.assignedAgentId;
    if (filters.tagId) where.tags = { some: { tagId: filters.tagId } };

    if (filters.dateFrom || filters.dateTo) {
      const createdAt: Record<string, Date> = {};
      if (filters.dateFrom) createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) createdAt.lte = new Date(filters.dateTo);
      where.createdAt = createdAt;
    }

    if (filters.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { ticketNumber: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.db.ticket.findMany({
        where: where as never,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true, assignedAgent: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.db.ticket.count({ where: where as never }),
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
   * Assign a ticket to an agent. Validates ownership.
   */
  async assign(id: string, userId: string, agentId: string) {
    const belongs = await this.db.ticket.findFirst({ where: { id, userId } });
    if (!belongs) {
      throw new Error('Ticket not found');
    }

    return this.db.ticket.update({
      where: { id },
      data: { assignedAgentId: agentId },
      include: { category: true, assignedAgent: true, tags: { include: { tag: true } } },
    });
  }

  /**
   * Change ticket status with automatic timestamp tracking.
   * Sets resolvedAt when moving to RESOLVED, closedAt when moving to CLOSED.
   */
  async changeStatus(id: string, userId: string, status: string) {
    const belongs = await this.db.ticket.findFirst({ where: { id, userId } });
    if (!belongs) {
      throw new Error('Ticket not found');
    }

    const updateData: Record<string, unknown> = { status: status as never };
    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    } else if (status === 'CLOSED') {
      updateData.closedAt = new Date();
    }

    return this.db.ticket.update({
      where: { id },
      data: updateData as never,
      include: { category: true, assignedAgent: true, tags: { include: { tag: true } } },
    });
  }

  /**
   * Add a message to a ticket thread. Tracks first response time for SLA.
   * Messages can be internal (agent-only notes) or public (visible to requester).
   */
  async addMessage(ticketId: string, userId: string, input: MessageCreateInput) {
    const ticket = await this.db.ticket.findFirst({ where: { id: ticketId, userId } });
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Track first agent response for SLA metrics
    if (!ticket.firstResponseAt && input.senderType === 'agent') {
      await this.db.ticket.update({
        where: { id: ticketId },
        data: { firstResponseAt: new Date() },
      });
    }

    return this.db.ticketMessage.create({
      data: {
        ticketId,
        senderId: input.senderId,
        senderType: input.senderType,
        body: input.body,
        isInternal: input.isInternal || false,
      },
    });
  }

  /**
   * Get all messages for a ticket thread, ordered chronologically
   */
  async getMessages(ticketId: string, userId: string) {
    const belongs = await this.db.ticket.findFirst({ where: { id: ticketId, userId } });
    if (!belongs) {
      throw new Error('Ticket not found');
    }

    return this.db.ticketMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Add a tag to a ticket for categorization
   */
  async addTag(ticketId: string, userId: string, tagId: string): Promise<void> {
    const belongs = await this.db.ticket.findFirst({ where: { id: ticketId, userId } });
    if (!belongs) {
      throw new Error('Ticket not found');
    }

    await this.db.ticketTagLink.create({
      data: { ticketId, tagId },
    });
  }

  /**
   * Remove a tag from a ticket
   */
  async removeTag(ticketId: string, userId: string, tagId: string): Promise<void> {
    const belongs = await this.db.ticket.findFirst({ where: { id: ticketId, userId } });
    if (!belongs) {
      throw new Error('Ticket not found');
    }

    await this.db.ticketTagLink.deleteMany({
      where: { ticketId, tagId },
    });
  }

  /**
   * Get aggregate ticket statistics for the dashboard
   */
  async getStats(userId: string): Promise<TicketStats> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalTickets, openTickets, inProgressTickets, resolvedTickets, slaBreachedCount, unassignedCount, ticketsToday, resolvedTicketsWithTimes] = await Promise.all([
      this.db.ticket.count({ where: { userId } }),
      this.db.ticket.count({ where: { userId, status: 'OPEN' } }),
      this.db.ticket.count({ where: { userId, status: 'IN_PROGRESS' } }),
      this.db.ticket.count({ where: { userId, status: 'RESOLVED' } }),
      this.db.ticket.count({ where: { userId, slaBreached: true } }),
      this.db.ticket.count({ where: { userId, assignedAgentId: null, status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
      this.db.ticket.count({ where: { userId, createdAt: { gte: todayStart } } }),
      this.db.ticket.findMany({
        where: { userId, resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
      }),
    ]);

    // Calculate average resolution hours manually
    let avgResolutionHours = 0;
    if (resolvedTicketsWithTimes.length > 0) {
      const totalHours = resolvedTicketsWithTimes.reduce((sum, t) => {
        if (t.resolvedAt) {
          return sum + (t.resolvedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
        }
        return sum;
      }, 0);
      avgResolutionHours = Math.round((totalHours / resolvedTicketsWithTimes.length) * 10) / 10;
    }

    return {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      avgResolutionHours,
      slaBreachedCount,
      unassignedCount,
      ticketsToday,
    };
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createTicketService(db: PrismaClient): TicketService {
  return new TicketService(db);
}

let instance: TicketService | null = null;

export function getTicketService(db?: PrismaClient): TicketService {
  if (db) return createTicketService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new TicketService(globalDb);
  }
  return instance;
}

export default TicketService;
