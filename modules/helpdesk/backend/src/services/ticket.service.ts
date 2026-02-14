// =============================================================================
// Ticket Service
// =============================================================================
// Business logic for ticket creation, assignment, status changes, messages, tags, and stats.
// Uses placeholder db operations - replace with actual Prisma client.

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

interface TicketRecord {
  id: string;
  userId: string;
  ticketNumber: string;
  categoryId: string | null;
  assignedAgentId: string | null;
  subject: string;
  description: string;
  status: string;
  priority: string;
  slaBreached: boolean;
  firstResponseAt: Date | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MessageRecord {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: string;
  body: string;
  isInternal: boolean;
  createdAt: Date;
}

interface SettingsRecord {
  id: string;
  userId: string;
  ticketPrefix: string;
  nextTicketNumber: number;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================
// Replace with actual Prisma client:
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  async getSettings(userId: string): Promise<SettingsRecord | null> {
    // Replace with: return db.helpdeskSettings.findUnique({ where: { userId } });
    console.log('[DB] Getting helpdesk settings for user:', userId);
    return null;
  },

  async upsertSettings(userId: string, data: { ticketPrefix: string; nextTicketNumber: number }): Promise<SettingsRecord> {
    // Replace with: return db.helpdeskSettings.upsert({ where: { userId }, create: { userId, ...data }, update: data });
    console.log('[DB] Upserting helpdesk settings for user:', userId);
    return { id: 'settings_' + Date.now(), userId, ...data };
  },

  async incrementTicketNumber(userId: string): Promise<void> {
    // Replace with: await db.helpdeskSettings.update({ where: { userId }, data: { nextTicketNumber: { increment: 1 } } });
    console.log('[DB] Incrementing ticket number for user:', userId);
  },

  async createTicket(data: {
    userId: string;
    ticketNumber: string;
    categoryId: string | null;
    assignedAgentId: string | null;
    subject: string;
    description: string;
    status: string;
    priority: string;
  }): Promise<TicketRecord> {
    // Replace with: return db.helpdeskTicket.create({ data, include: { category: true, assignedAgent: true, tags: true } });
    console.log('[DB] Creating ticket:', data.ticketNumber);
    return {
      id: 'ticket_' + Date.now(),
      ...data,
      slaBreached: false,
      firstResponseAt: null,
      resolvedAt: null,
      closedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async findTicketById(id: string): Promise<TicketRecord | null> {
    // Replace with: return db.helpdeskTicket.findUnique({ where: { id }, include: { category: true, assignedAgent: true, tags: true, messages: { orderBy: { createdAt: 'asc' } } } });
    console.log('[DB] Finding ticket by ID:', id);
    return null;
  },

  async findTickets(userId: string, filters: TicketFilters): Promise<{ items: TicketRecord[]; total: number }> {
    // Replace with:
    // const where = {
    //   userId,
    //   status: filters.status || undefined,
    //   priority: filters.priority || undefined,
    //   categoryId: filters.categoryId || undefined,
    //   assignedAgentId: filters.assignedAgentId || undefined,
    //   tags: filters.tagId ? { some: { tagId: filters.tagId } } : undefined,
    //   createdAt: {
    //     gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    //     lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
    //   },
    //   OR: filters.search ? [
    //     { subject: { contains: filters.search, mode: 'insensitive' } },
    //     { ticketNumber: { contains: filters.search, mode: 'insensitive' } },
    //     { description: { contains: filters.search, mode: 'insensitive' } },
    //   ] : undefined,
    // };
    // const [items, total] = await Promise.all([
    //   db.helpdeskTicket.findMany({ where, skip: ((filters.page || 1) - 1) * (filters.limit || 20), take: filters.limit || 20, include: { category: true, assignedAgent: true }, orderBy: { createdAt: 'desc' } }),
    //   db.helpdeskTicket.count({ where }),
    // ]);
    console.log('[DB] Finding tickets for user:', userId, filters);
    return { items: [], total: 0 };
  },

  async updateTicket(id: string, data: Partial<TicketRecord>): Promise<TicketRecord | null> {
    // Replace with: return db.helpdeskTicket.update({ where: { id }, data: { ...data, updatedAt: new Date() }, include: { category: true, assignedAgent: true, tags: true } });
    console.log('[DB] Updating ticket:', id);
    return null;
  },

  async deleteTicket(id: string): Promise<void> {
    // Replace with: await db.helpdeskTicket.delete({ where: { id } });
    console.log('[DB] Deleting ticket:', id);
  },

  async createMessage(data: {
    ticketId: string;
    senderId: string;
    senderType: string;
    body: string;
    isInternal: boolean;
  }): Promise<MessageRecord> {
    // Replace with: return db.helpdeskMessage.create({ data });
    console.log('[DB] Creating message for ticket:', data.ticketId);
    return { id: 'msg_' + Date.now(), ...data, createdAt: new Date() };
  },

  async getMessages(ticketId: string): Promise<MessageRecord[]> {
    // Replace with: return db.helpdeskMessage.findMany({ where: { ticketId }, orderBy: { createdAt: 'asc' } });
    console.log('[DB] Getting messages for ticket:', ticketId);
    return [];
  },

  async addTag(ticketId: string, tagId: string): Promise<void> {
    // Replace with: await db.helpdeskTicketTag.create({ data: { ticketId, tagId } });
    console.log('[DB] Adding tag:', tagId, 'to ticket:', ticketId);
  },

  async removeTag(ticketId: string, tagId: string): Promise<void> {
    // Replace with: await db.helpdeskTicketTag.delete({ where: { ticketId_tagId: { ticketId, tagId } } });
    console.log('[DB] Removing tag:', tagId, 'from ticket:', ticketId);
  },

  async checkTicketBelongsToUser(ticketId: string, userId: string): Promise<boolean> {
    // Replace with: return !!(await db.helpdeskTicket.findFirst({ where: { id: ticketId, userId } }));
    console.log('[DB] Checking ticket ownership:', ticketId, userId);
    return false;
  },

  async getTicketStats(userId: string): Promise<TicketStats> {
    // Replace with:
    // const [total, open, inProgress, resolved, breached, unassigned, today, avgResolution] = await Promise.all([
    //   db.helpdeskTicket.count({ where: { userId } }),
    //   db.helpdeskTicket.count({ where: { userId, status: 'OPEN' } }),
    //   db.helpdeskTicket.count({ where: { userId, status: 'IN_PROGRESS' } }),
    //   db.helpdeskTicket.count({ where: { userId, status: 'RESOLVED' } }),
    //   db.helpdeskTicket.count({ where: { userId, slaBreached: true } }),
    //   db.helpdeskTicket.count({ where: { userId, assignedAgentId: null, status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
    //   db.helpdeskTicket.count({ where: { userId, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    //   db.helpdeskTicket.aggregate({ where: { userId, resolvedAt: { not: null } }, _avg: { resolutionHours: true } }),
    // ]);
    console.log('[DB] Getting ticket stats for user:', userId);
    return {
      totalTickets: 0,
      openTickets: 0,
      inProgressTickets: 0,
      resolvedTickets: 0,
      avgResolutionHours: 0,
      slaBreachedCount: 0,
      unassignedCount: 0,
      ticketsToday: 0,
    };
  },
};

// =============================================================================
// Ticket Service
// =============================================================================

export class TicketService {
  /**
   * Generate a sequential ticket number using the user's settings prefix.
   * Creates default settings if none exist (prefix: "TKT-", starting at 1001).
   */
  async generateTicketNumber(userId: string): Promise<string> {
    let settings = await dbOperations.getSettings(userId);
    if (!settings) {
      settings = await dbOperations.upsertSettings(userId, {
        ticketPrefix: 'TKT-',
        nextTicketNumber: 1001,
      });
    }
    const ticketNumber = `${settings.ticketPrefix}${settings.nextTicketNumber.toString().padStart(4, '0')}`;
    await dbOperations.incrementTicketNumber(userId);
    return ticketNumber;
  }

  /**
   * Create a new support ticket. Generates a unique ticket number automatically.
   */
  async create(input: TicketCreateInput): Promise<TicketRecord> {
    const ticketNumber = await this.generateTicketNumber(input.userId);

    const ticket = await dbOperations.createTicket({
      userId: input.userId,
      ticketNumber,
      categoryId: input.categoryId || null,
      assignedAgentId: null,
      subject: input.subject,
      description: input.description,
      status: 'OPEN',
      priority: input.priority || 'MEDIUM',
    });

    return ticket;
  }

  /**
   * Update ticket details. Validates ownership.
   */
  async update(id: string, userId: string, input: TicketUpdateInput): Promise<TicketRecord | null> {
    const belongs = await dbOperations.checkTicketBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Ticket not found');
    }

    return dbOperations.updateTicket(id, input as Partial<TicketRecord>);
  }

  /**
   * Delete a ticket. Validates ownership.
   */
  async delete(id: string, userId: string): Promise<void> {
    const belongs = await dbOperations.checkTicketBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Ticket not found');
    }

    return dbOperations.deleteTicket(id);
  }

  /**
   * Get a single ticket by ID with ownership check
   */
  async getById(id: string, userId: string): Promise<TicketRecord | null> {
    const belongs = await dbOperations.checkTicketBelongsToUser(id, userId);
    if (!belongs) {
      return null;
    }

    return dbOperations.findTicketById(id);
  }

  /**
   * List tickets with filtering, search, and pagination
   */
  async list(userId: string, filters: TicketFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await dbOperations.findTickets(userId, {
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
   * Assign a ticket to an agent. Validates ownership.
   */
  async assign(id: string, userId: string, agentId: string): Promise<TicketRecord | null> {
    const belongs = await dbOperations.checkTicketBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Ticket not found');
    }

    return dbOperations.updateTicket(id, { assignedAgentId: agentId } as Partial<TicketRecord>);
  }

  /**
   * Change ticket status with automatic timestamp tracking.
   * Sets resolvedAt when moving to RESOLVED, closedAt when moving to CLOSED.
   */
  async changeStatus(id: string, userId: string, status: string): Promise<TicketRecord | null> {
    const belongs = await dbOperations.checkTicketBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Ticket not found');
    }

    const updateData: Partial<TicketRecord> = { status } as Partial<TicketRecord>;
    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    } else if (status === 'CLOSED') {
      updateData.closedAt = new Date();
    }

    return dbOperations.updateTicket(id, updateData);
  }

  /**
   * Add a message to a ticket thread. Tracks first response time for SLA.
   * Messages can be internal (agent-only notes) or public (visible to requester).
   */
  async addMessage(ticketId: string, userId: string, input: MessageCreateInput): Promise<MessageRecord> {
    const belongs = await dbOperations.checkTicketBelongsToUser(ticketId, userId);
    if (!belongs) {
      throw new Error('Ticket not found');
    }

    // Track first agent response for SLA metrics
    const ticket = await dbOperations.findTicketById(ticketId);
    if (ticket && !ticket.firstResponseAt && input.senderType === 'agent') {
      await dbOperations.updateTicket(ticketId, { firstResponseAt: new Date() } as Partial<TicketRecord>);
    }

    return dbOperations.createMessage({
      ticketId,
      senderId: input.senderId,
      senderType: input.senderType,
      body: input.body,
      isInternal: input.isInternal || false,
    });
  }

  /**
   * Get all messages for a ticket thread, ordered chronologically
   */
  async getMessages(ticketId: string, userId: string): Promise<MessageRecord[]> {
    const belongs = await dbOperations.checkTicketBelongsToUser(ticketId, userId);
    if (!belongs) {
      throw new Error('Ticket not found');
    }

    return dbOperations.getMessages(ticketId);
  }

  /**
   * Add a tag to a ticket for categorization
   */
  async addTag(ticketId: string, userId: string, tagId: string): Promise<void> {
    const belongs = await dbOperations.checkTicketBelongsToUser(ticketId, userId);
    if (!belongs) {
      throw new Error('Ticket not found');
    }

    await dbOperations.addTag(ticketId, tagId);
  }

  /**
   * Remove a tag from a ticket
   */
  async removeTag(ticketId: string, userId: string, tagId: string): Promise<void> {
    const belongs = await dbOperations.checkTicketBelongsToUser(ticketId, userId);
    if (!belongs) {
      throw new Error('Ticket not found');
    }

    await dbOperations.removeTag(ticketId, tagId);
  }

  /**
   * Get aggregate ticket statistics for the dashboard
   */
  async getStats(userId: string): Promise<TicketStats> {
    return dbOperations.getTicketStats(userId);
  }
}

// =============================================================================
// Factory
// =============================================================================

let ticketServiceInstance: TicketService | null = null;

export function getTicketService(): TicketService {
  if (!ticketServiceInstance) {
    ticketServiceInstance = new TicketService();
  }
  return ticketServiceInstance;
}

export default TicketService;
