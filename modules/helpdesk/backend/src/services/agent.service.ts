// =============================================================================
// Agent Service
// =============================================================================
// Business logic for helpdesk agent management: CRUD, activation/deactivation,
// workload tracking, and department assignment.
// Uses placeholder db operations - replace with actual Prisma client.

// =============================================================================
// Types
// =============================================================================

export interface AgentCreateInput {
  userId: string;
  name: string;
  email: string;
  role?: string;
  department?: string;
  maxOpenTickets?: number;
  specialties?: string[];
}

export interface AgentUpdateInput {
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  maxOpenTickets?: number;
  specialties?: string[];
}

export interface AgentFilters {
  search?: string;
  isActive?: boolean;
  department?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export interface AgentWorkload {
  agentId: string;
  agentName: string;
  openTickets: number;
  inProgressTickets: number;
  resolvedToday: number;
  avgResponseMinutes: number;
  maxOpenTickets: number;
  utilizationPercent: number;
}

interface AgentRecord {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  isActive: boolean;
  maxOpenTickets: number;
  specialties: string[];
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================
// Replace with actual Prisma client:
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  async createAgent(data: {
    userId: string;
    name: string;
    email: string;
    role: string;
    department: string | null;
    isActive: boolean;
    maxOpenTickets: number;
    specialties: string[];
  }): Promise<AgentRecord> {
    // Replace with: return db.helpdeskAgent.create({ data });
    console.log('[DB] Creating agent:', data.name, 'email:', data.email);
    return {
      id: 'agent_' + Date.now(),
      ...data,
      lastActiveAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async updateAgent(id: string, data: Partial<AgentRecord>): Promise<AgentRecord | null> {
    // Replace with: return db.helpdeskAgent.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
    console.log('[DB] Updating agent:', id);
    return null;
  },

  async deleteAgent(id: string): Promise<void> {
    // Replace with: await db.helpdeskAgent.delete({ where: { id } });
    console.log('[DB] Deleting agent:', id);
  },

  async findAgentById(id: string): Promise<AgentRecord | null> {
    // Replace with: return db.helpdeskAgent.findUnique({ where: { id }, include: { _count: { select: { assignedTickets: true } } } });
    console.log('[DB] Finding agent by ID:', id);
    return null;
  },

  async findAgentByUserId(userId: string, agentUserId: string): Promise<AgentRecord | null> {
    // Replace with: return db.helpdeskAgent.findFirst({ where: { userId, email: agentUserId } });
    console.log('[DB] Finding agent by user ID:', agentUserId, 'for owner:', userId);
    return null;
  },

  async findAgents(userId: string, filters: AgentFilters): Promise<{ items: AgentRecord[]; total: number }> {
    // Replace with:
    // const where = {
    //   userId,
    //   isActive: filters.isActive !== undefined ? filters.isActive : undefined,
    //   department: filters.department || undefined,
    //   role: filters.role || undefined,
    //   OR: filters.search ? [
    //     { name: { contains: filters.search, mode: 'insensitive' } },
    //     { email: { contains: filters.search, mode: 'insensitive' } },
    //     { department: { contains: filters.search, mode: 'insensitive' } },
    //   ] : undefined,
    // };
    // const [items, total] = await Promise.all([
    //   db.helpdeskAgent.findMany({ where, skip: ((filters.page || 1) - 1) * (filters.limit || 20), take: filters.limit || 20, orderBy: { name: 'asc' } }),
    //   db.helpdeskAgent.count({ where }),
    // ]);
    console.log('[DB] Finding agents for user:', userId, filters);
    return { items: [], total: 0 };
  },

  async findAllActiveAgents(userId: string): Promise<AgentRecord[]> {
    // Replace with: return db.helpdeskAgent.findMany({ where: { userId, isActive: true }, orderBy: { name: 'asc' } });
    console.log('[DB] Finding all active agents for user:', userId);
    return [];
  },

  async checkAgentBelongsToUser(agentId: string, userId: string): Promise<boolean> {
    // Replace with: return !!(await db.helpdeskAgent.findFirst({ where: { id: agentId, userId } }));
    console.log('[DB] Checking agent ownership:', agentId, userId);
    return false;
  },

  async hasAssignedTickets(agentId: string): Promise<boolean> {
    // Replace with: return !!(await db.helpdeskTicket.findFirst({ where: { assignedAgentId: agentId, status: { notIn: ['RESOLVED', 'CLOSED'] } } }));
    console.log('[DB] Checking if agent has assigned tickets:', agentId);
    return false;
  },

  async checkEmailExists(userId: string, email: string, excludeId?: string): Promise<boolean> {
    // Replace with:
    // const where: any = { userId, email };
    // if (excludeId) where.id = { not: excludeId };
    // return !!(await db.helpdeskAgent.findFirst({ where }));
    console.log('[DB] Checking if agent email exists:', email);
    return false;
  },

  async getAgentWorkload(agentId: string): Promise<AgentWorkload | null> {
    // Replace with:
    // const agent = await db.helpdeskAgent.findUnique({ where: { id: agentId } });
    // if (!agent) return null;
    // const [open, inProgress, resolvedToday, avgResponse] = await Promise.all([
    //   db.helpdeskTicket.count({ where: { assignedAgentId: agentId, status: 'OPEN' } }),
    //   db.helpdeskTicket.count({ where: { assignedAgentId: agentId, status: 'IN_PROGRESS' } }),
    //   db.helpdeskTicket.count({ where: { assignedAgentId: agentId, status: 'RESOLVED', resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    //   db.helpdeskMessage.aggregate({ where: { senderId: agentId, senderType: 'agent' }, _avg: { responseTimeMinutes: true } }),
    // ]);
    console.log('[DB] Getting workload for agent:', agentId);
    return null;
  },

  async getAllAgentWorkloads(userId: string): Promise<AgentWorkload[]> {
    // Replace with: complex query joining agents with ticket counts
    console.log('[DB] Getting all agent workloads for user:', userId);
    return [];
  },
};

// =============================================================================
// Agent Service
// =============================================================================

export class AgentService {
  /**
   * Create a new helpdesk agent. Validates email uniqueness within the account.
   */
  async create(input: AgentCreateInput): Promise<AgentRecord> {
    const emailExists = await dbOperations.checkEmailExists(input.userId, input.email);
    if (emailExists) {
      throw new Error('An agent with this email already exists');
    }

    return dbOperations.createAgent({
      userId: input.userId,
      name: input.name,
      email: input.email,
      role: input.role || 'agent',
      department: input.department || null,
      isActive: true,
      maxOpenTickets: input.maxOpenTickets || 25,
      specialties: input.specialties || [],
    });
  }

  /**
   * Update an existing agent. Validates ownership and email uniqueness.
   */
  async update(id: string, userId: string, input: AgentUpdateInput): Promise<AgentRecord | null> {
    const belongs = await dbOperations.checkAgentBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Agent not found');
    }

    if (input.email) {
      const emailExists = await dbOperations.checkEmailExists(userId, input.email, id);
      if (emailExists) {
        throw new Error('An agent with this email already exists');
      }
    }

    return dbOperations.updateAgent(id, input as Partial<AgentRecord>);
  }

  /**
   * Delete an agent. Validates ownership and checks for active assigned tickets.
   */
  async delete(id: string, userId: string): Promise<void> {
    const belongs = await dbOperations.checkAgentBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Agent not found');
    }

    const hasTickets = await dbOperations.hasAssignedTickets(id);
    if (hasTickets) {
      throw new Error('Cannot delete an agent with active assigned tickets. Reassign or resolve tickets first, or deactivate the agent.');
    }

    return dbOperations.deleteAgent(id);
  }

  /**
   * Get a single agent by ID with ownership check
   */
  async getById(id: string, userId: string): Promise<AgentRecord | null> {
    const belongs = await dbOperations.checkAgentBelongsToUser(id, userId);
    if (!belongs) {
      return null;
    }

    return dbOperations.findAgentById(id);
  }

  /**
   * Find an agent by their linked user ID (useful for auth-based lookups)
   */
  async getByUserId(userId: string, agentUserId: string): Promise<AgentRecord | null> {
    return dbOperations.findAgentByUserId(userId, agentUserId);
  }

  /**
   * List agents with filtering and pagination
   */
  async list(userId: string, filters: AgentFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await dbOperations.findAgents(userId, {
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
   * Get all active agents (no pagination, for assignment dropdowns)
   */
  async listActive(userId: string): Promise<AgentRecord[]> {
    return dbOperations.findAllActiveAgents(userId);
  }

  /**
   * Toggle an agent's active state.
   * Inactive agents cannot be assigned new tickets but retain existing assignments.
   */
  async toggleActive(id: string, userId: string): Promise<AgentRecord | null> {
    const belongs = await dbOperations.checkAgentBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Agent not found');
    }

    const agent = await dbOperations.findAgentById(id);
    if (!agent) {
      throw new Error('Agent not found');
    }

    return dbOperations.updateAgent(id, { isActive: !agent.isActive } as Partial<AgentRecord>);
  }

  /**
   * Get workload metrics for a specific agent.
   * Returns open/in-progress ticket counts, resolution rate, and utilization.
   */
  async getWorkload(id: string, userId: string): Promise<AgentWorkload | null> {
    const belongs = await dbOperations.checkAgentBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Agent not found');
    }

    return dbOperations.getAgentWorkload(id);
  }

  /**
   * Get workload overview for all agents. Useful for the manager dashboard.
   */
  async getAllWorkloads(userId: string): Promise<AgentWorkload[]> {
    return dbOperations.getAllAgentWorkloads(userId);
  }
}

// =============================================================================
// Factory
// =============================================================================

let agentServiceInstance: AgentService | null = null;

export function getAgentService(): AgentService {
  if (!agentServiceInstance) {
    agentServiceInstance = new AgentService();
  }
  return agentServiceInstance;
}

export default AgentService;
