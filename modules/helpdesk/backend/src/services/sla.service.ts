// =============================================================================
// SLA Policy Service
// =============================================================================
// Business logic for Service Level Agreement policies: CRUD, priority-based
// lookup, activation/deactivation, and breach detection.
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface SlaCreateInput {
  userId: string;
  name: string;
  description?: string;
  priority: string;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  businessHoursOnly?: boolean;
  escalationEmail?: string;
}

export interface SlaUpdateInput {
  name?: string;
  description?: string;
  priority?: string;
  firstResponseMinutes?: number;
  resolutionMinutes?: number;
  businessHoursOnly?: boolean;
  escalationEmail?: string;
}

export interface SlaFilters {
  search?: string;
  isActive?: boolean;
  priority?: string;
  page?: number;
  limit?: number;
}

export interface SlaBreachResult {
  ticketId: string;
  ticketNumber: string;
  policyName: string;
  breachType: 'first_response' | 'resolution';
  expectedMinutes: number;
  actualMinutes: number;
  breachedAt: Date;
}

// =============================================================================
// SLA Policy Service
// =============================================================================

export class SlaService {
  constructor(private db: PrismaClient) {}

  /**
   * Create a new SLA policy. Validates that no active policy already exists
   * for the same priority level.
   */
  async create(input: SlaCreateInput) {
    if (input.firstResponseMinutes <= 0) {
      throw new Error('First response time must be greater than 0');
    }

    if (input.resolutionMinutes <= 0) {
      throw new Error('Resolution time must be greater than 0');
    }

    if (input.firstResponseMinutes >= input.resolutionMinutes) {
      throw new Error('First response time must be less than resolution time');
    }

    const policyExists = await this.db.slaPolicy.findFirst({
      where: { userId: input.userId, priority: input.priority as never, isActive: true },
    });
    if (policyExists) {
      throw new Error(`An active SLA policy already exists for ${input.priority} priority. Deactivate it first or update the existing policy.`);
    }

    return this.db.slaPolicy.create({
      data: {
        userId: input.userId,
        name: input.name,
        description: input.description || null,
        priority: input.priority as never,
        firstResponseMinutes: input.firstResponseMinutes,
        resolutionMinutes: input.resolutionMinutes,
        businessHoursOnly: input.businessHoursOnly ?? false,
        escalationEmail: input.escalationEmail || null,
        isActive: true,
      },
    });
  }

  /**
   * Update an existing SLA policy. Validates ownership and time constraints.
   */
  async update(id: string, userId: string, input: SlaUpdateInput) {
    const existing = await this.db.slaPolicy.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new Error('SLA policy not found');
    }

    // Validate time constraints with merged values
    const firstResponse = input.firstResponseMinutes ?? existing.firstResponseMinutes;
    const resolution = input.resolutionMinutes ?? existing.resolutionMinutes;

    if (firstResponse <= 0) {
      throw new Error('First response time must be greater than 0');
    }

    if (resolution <= 0) {
      throw new Error('Resolution time must be greater than 0');
    }

    if (firstResponse >= resolution) {
      throw new Error('First response time must be less than resolution time');
    }

    // Check priority uniqueness if changing priority
    if (input.priority && input.priority !== existing.priority) {
      const policyExists = await this.db.slaPolicy.findFirst({
        where: { userId, priority: input.priority as never, isActive: true, id: { not: id } },
      });
      if (policyExists) {
        throw new Error(`An active SLA policy already exists for ${input.priority} priority`);
      }
    }

    return this.db.slaPolicy.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.priority !== undefined && { priority: input.priority as never }),
        ...(input.firstResponseMinutes !== undefined && { firstResponseMinutes: input.firstResponseMinutes }),
        ...(input.resolutionMinutes !== undefined && { resolutionMinutes: input.resolutionMinutes }),
        ...(input.businessHoursOnly !== undefined && { businessHoursOnly: input.businessHoursOnly }),
        ...(input.escalationEmail !== undefined && { escalationEmail: input.escalationEmail }),
      },
    });
  }

  /**
   * Delete an SLA policy. Validates ownership.
   */
  async delete(id: string, userId: string): Promise<void> {
    const belongs = await this.db.slaPolicy.findFirst({ where: { id, userId } });
    if (!belongs) {
      throw new Error('SLA policy not found');
    }

    await this.db.slaPolicy.delete({ where: { id } });
  }

  /**
   * Get a single SLA policy by ID with ownership check
   */
  async getById(id: string, userId: string) {
    return this.db.slaPolicy.findFirst({ where: { id, userId } });
  }

  /**
   * List SLA policies with filtering and pagination
   */
  async list(userId: string, filters: SlaFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Record<string, unknown> = { userId };

    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.priority) where.priority = filters.priority;

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.db.slaPolicy.findMany({
        where: where as never,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.slaPolicy.count({ where: where as never }),
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
   * Get the active SLA policy for a specific ticket priority.
   * Returns null if no policy is configured for that priority.
   */
  async getForPriority(userId: string, priority: string) {
    return this.db.slaPolicy.findFirst({
      where: { userId, priority: priority as never, isActive: true },
    });
  }

  /**
   * Toggle an SLA policy's active state.
   * When deactivating, ensures no duplicate active policy exists on reactivation.
   */
  async toggleActive(id: string, userId: string) {
    const sla = await this.db.slaPolicy.findFirst({ where: { id, userId } });
    if (!sla) {
      throw new Error('SLA policy not found');
    }

    // When reactivating, check for priority conflicts
    if (!sla.isActive) {
      const policyExists = await this.db.slaPolicy.findFirst({
        where: { userId, priority: sla.priority, isActive: true, id: { not: id } },
      });
      if (policyExists) {
        throw new Error(`Cannot reactivate: an active SLA policy already exists for ${sla.priority} priority`);
      }
    }

    return this.db.slaPolicy.update({
      where: { id },
      data: { isActive: !sla.isActive },
    });
  }

  /**
   * Check all open tickets for SLA breaches. Compares elapsed time against
   * the applicable SLA policy for each ticket's priority level.
   *
   * This method is designed to be called by a cron job or scheduled task.
   * Returns a list of newly breached tickets.
   */
  async checkBreaches(userId: string): Promise<{
    breaches: SlaBreachResult[];
    checkedCount: number;
    errors: string[];
  }> {
    const activeSlas = await this.db.slaPolicy.findMany({
      where: { userId, isActive: true },
    });

    const openTickets = await this.db.ticket.findMany({
      where: {
        userId,
        status: { notIn: ['RESOLVED', 'CLOSED'] },
        slaBreached: false,
      },
    });

    // Build a priority -> SLA lookup map
    const slaPolicyMap = new Map<string, typeof activeSlas[0]>();
    for (const sla of activeSlas) {
      slaPolicyMap.set(sla.priority, sla);
    }

    const breaches: SlaBreachResult[] = [];
    const errors: string[] = [];
    const now = new Date();

    for (const ticket of openTickets) {
      try {
        const sla = slaPolicyMap.get(ticket.priority);
        if (!sla) {
          continue;
        }

        const ticketAgeMinutes = Math.floor((now.getTime() - ticket.createdAt.getTime()) / (1000 * 60));

        // Check first response breach
        if (!ticket.firstResponseAt && ticketAgeMinutes > sla.firstResponseMinutes) {
          breaches.push({
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            policyName: sla.name,
            breachType: 'first_response',
            expectedMinutes: sla.firstResponseMinutes,
            actualMinutes: ticketAgeMinutes,
            breachedAt: now,
          });

          await this.db.ticket.update({
            where: { id: ticket.id },
            data: { slaBreached: true },
          });
          continue;
        }

        // Check resolution breach
        if (!ticket.resolvedAt && ticketAgeMinutes > sla.resolutionMinutes) {
          breaches.push({
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            policyName: sla.name,
            breachType: 'resolution',
            expectedMinutes: sla.resolutionMinutes,
            actualMinutes: ticketAgeMinutes,
            breachedAt: now,
          });

          await this.db.ticket.update({
            where: { id: ticket.id },
            data: { slaBreached: true },
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error checking SLA breach';
        errors.push(`Ticket ${ticket.ticketNumber}: ${message}`);
      }
    }

    return {
      breaches,
      checkedCount: openTickets.length,
      errors,
    };
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createSlaService(db: PrismaClient): SlaService {
  return new SlaService(db);
}

let instance: SlaService | null = null;

export function getSlaService(db?: PrismaClient): SlaService {
  if (db) return createSlaService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new SlaService(globalDb);
  }
  return instance;
}

export default SlaService;
