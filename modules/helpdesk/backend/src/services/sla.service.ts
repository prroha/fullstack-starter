// =============================================================================
// SLA Policy Service
// =============================================================================
// Business logic for Service Level Agreement policies: CRUD, priority-based
// lookup, activation/deactivation, and breach detection.
// Uses placeholder db operations - replace with actual Prisma client.

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

interface SlaRecord {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  priority: string;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  businessHoursOnly: boolean;
  escalationEmail: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TicketForSlaCheck {
  id: string;
  ticketNumber: string;
  priority: string;
  status: string;
  slaBreached: boolean;
  firstResponseAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================
// TODO: Implement with Prisma when helpdesk schema is provisioned.
// Currently returns empty/mock data. Replace placeholder calls with actual
// Prisma client queries (e.g., db.helpdeskSlaPolicy.create({ data })).
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  // TODO: Implement with Prisma — db.helpdeskSlaPolicy.create({ data })
  async createSla(data: {
    userId: string;
    name: string;
    description: string | null;
    priority: string;
    firstResponseMinutes: number;
    resolutionMinutes: number;
    businessHoursOnly: boolean;
    escalationEmail: string | null;
    isActive: boolean;
  }): Promise<SlaRecord> {
    return {
      id: 'sla_' + Date.now(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  // TODO: Implement with Prisma — db.helpdeskSlaPolicy.update({ where: { id }, data })
  async updateSla(id: string, _data: Partial<SlaRecord>): Promise<SlaRecord | null> {
    void id;
    return null;
  },

  // TODO: Implement with Prisma — db.helpdeskSlaPolicy.delete({ where: { id } })
  async deleteSla(id: string): Promise<void> {
    void id;
  },

  // TODO: Implement with Prisma — db.helpdeskSlaPolicy.findUnique({ where: { id } })
  async findSlaById(id: string): Promise<SlaRecord | null> {
    void id;
    return null;
  },

  // TODO: Implement with Prisma — db.helpdeskSlaPolicy.findMany with filters + count
  async findSlas(userId: string, _filters: SlaFilters): Promise<{ items: SlaRecord[]; total: number }> {
    void userId;
    return { items: [], total: 0 };
  },

  // TODO: Implement with Prisma — db.helpdeskSlaPolicy.findFirst({ where: { userId, priority, isActive: true } })
  async findSlaForPriority(userId: string, priority: string): Promise<SlaRecord | null> {
    void userId; void priority;
    return null;
  },

  // TODO: Implement with Prisma — db.helpdeskSlaPolicy.findMany({ where: { userId, isActive: true } })
  async findAllActiveSlas(userId: string): Promise<SlaRecord[]> {
    void userId;
    return [];
  },

  // TODO: Implement with Prisma — db.helpdeskTicket.findMany({ where: { userId, status not RESOLVED/CLOSED, slaBreached: false } })
  async findOpenTicketsForSlaCheck(userId: string): Promise<TicketForSlaCheck[]> {
    void userId;
    return [];
  },

  // TODO: Implement with Prisma — db.helpdeskTicket.update({ where: { id: ticketId }, data: { slaBreached: true } })
  async markTicketSlaBreached(ticketId: string): Promise<void> {
    void ticketId;
  },

  // TODO: Implement with Prisma — db.helpdeskSlaPolicy.findFirst({ where: { id: slaId, userId } })
  async checkSlaBelongsToUser(slaId: string, userId: string): Promise<boolean> {
    void slaId; void userId;
    return false;
  },

  // TODO: Implement with Prisma — db.helpdeskSlaPolicy.findFirst({ where: { userId, priority, isActive: true } })
  async checkPriorityPolicyExists(userId: string, priority: string, _excludeId?: string): Promise<boolean> {
    void userId; void priority;
    return false;
  },
};

// =============================================================================
// SLA Policy Service
// =============================================================================

export class SlaService {
  /**
   * Create a new SLA policy. Validates that no active policy already exists
   * for the same priority level.
   */
  async create(input: SlaCreateInput): Promise<SlaRecord> {
    if (input.firstResponseMinutes <= 0) {
      throw new Error('First response time must be greater than 0');
    }

    if (input.resolutionMinutes <= 0) {
      throw new Error('Resolution time must be greater than 0');
    }

    if (input.firstResponseMinutes >= input.resolutionMinutes) {
      throw new Error('First response time must be less than resolution time');
    }

    const policyExists = await dbOperations.checkPriorityPolicyExists(input.userId, input.priority);
    if (policyExists) {
      throw new Error(`An active SLA policy already exists for ${input.priority} priority. Deactivate it first or update the existing policy.`);
    }

    return dbOperations.createSla({
      userId: input.userId,
      name: input.name,
      description: input.description || null,
      priority: input.priority,
      firstResponseMinutes: input.firstResponseMinutes,
      resolutionMinutes: input.resolutionMinutes,
      businessHoursOnly: input.businessHoursOnly ?? false,
      escalationEmail: input.escalationEmail || null,
      isActive: true,
    });
  }

  /**
   * Update an existing SLA policy. Validates ownership and time constraints.
   */
  async update(id: string, userId: string, input: SlaUpdateInput): Promise<SlaRecord | null> {
    const belongs = await dbOperations.checkSlaBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('SLA policy not found');
    }

    const existing = await dbOperations.findSlaById(id);
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
      const policyExists = await dbOperations.checkPriorityPolicyExists(userId, input.priority, id);
      if (policyExists) {
        throw new Error(`An active SLA policy already exists for ${input.priority} priority`);
      }
    }

    return dbOperations.updateSla(id, input as Partial<SlaRecord>);
  }

  /**
   * Delete an SLA policy. Validates ownership.
   */
  async delete(id: string, userId: string): Promise<void> {
    const belongs = await dbOperations.checkSlaBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('SLA policy not found');
    }

    return dbOperations.deleteSla(id);
  }

  /**
   * Get a single SLA policy by ID with ownership check
   */
  async getById(id: string, userId: string): Promise<SlaRecord | null> {
    const belongs = await dbOperations.checkSlaBelongsToUser(id, userId);
    if (!belongs) {
      return null;
    }

    return dbOperations.findSlaById(id);
  }

  /**
   * List SLA policies with filtering and pagination
   */
  async list(userId: string, filters: SlaFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await dbOperations.findSlas(userId, {
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
   * Get the active SLA policy for a specific ticket priority.
   * Returns null if no policy is configured for that priority.
   */
  async getForPriority(userId: string, priority: string): Promise<SlaRecord | null> {
    return dbOperations.findSlaForPriority(userId, priority);
  }

  /**
   * Toggle an SLA policy's active state.
   * When deactivating, ensures no duplicate active policy exists on reactivation.
   */
  async toggleActive(id: string, userId: string): Promise<SlaRecord | null> {
    const belongs = await dbOperations.checkSlaBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('SLA policy not found');
    }

    const sla = await dbOperations.findSlaById(id);
    if (!sla) {
      throw new Error('SLA policy not found');
    }

    // When reactivating, check for priority conflicts
    if (!sla.isActive) {
      const policyExists = await dbOperations.checkPriorityPolicyExists(userId, sla.priority, id);
      if (policyExists) {
        throw new Error(`Cannot reactivate: an active SLA policy already exists for ${sla.priority} priority`);
      }
    }

    return dbOperations.updateSla(id, { isActive: !sla.isActive } as Partial<SlaRecord>);
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
    const activeSlas = await dbOperations.findAllActiveSlas(userId);
    const openTickets = await dbOperations.findOpenTicketsForSlaCheck(userId);

    // Build a priority → SLA lookup map
    const slaPolicyMap = new Map<string, SlaRecord>();
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
          // No SLA policy for this priority, skip
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

          await dbOperations.markTicketSlaBreached(ticket.id);
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

          await dbOperations.markTicketSlaBreached(ticket.id);
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

let slaServiceInstance: SlaService | null = null;

export function getSlaService(): SlaService {
  if (!slaServiceInstance) {
    slaServiceInstance = new SlaService();
  }
  return slaServiceInstance;
}

export default SlaService;
