// =============================================================================
// Agent Service
// =============================================================================
// Business logic for helpdesk agent management: CRUD, activation/deactivation,
// workload tracking, and department assignment.
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

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

// =============================================================================
// Agent Service
// =============================================================================

export class AgentService {
  constructor(private db: PrismaClient) {}

  /**
   * Create a new helpdesk agent. Validates email uniqueness within the account.
   */
  async create(input: AgentCreateInput) {
    const emailExists = await this.db.helpdeskAgent.findFirst({
      where: { userId: input.userId, email: input.email },
    });
    if (emailExists) {
      throw new Error('An agent with this email already exists');
    }

    return this.db.helpdeskAgent.create({
      data: {
        userId: input.userId,
        name: input.name,
        email: input.email,
        role: (input.role as never) || 'AGENT',
        department: input.department || null,
        isActive: true,
        maxOpenTickets: input.maxOpenTickets || 25,
        specialties: input.specialties || [],
      },
    });
  }

  /**
   * Update an existing agent. Validates ownership and email uniqueness.
   */
  async update(id: string, userId: string, input: AgentUpdateInput) {
    const belongs = await this.db.helpdeskAgent.findFirst({ where: { id, userId } });
    if (!belongs) {
      throw new Error('Agent not found');
    }

    if (input.email) {
      const emailExists = await this.db.helpdeskAgent.findFirst({
        where: { userId, email: input.email, id: { not: id } },
      });
      if (emailExists) {
        throw new Error('An agent with this email already exists');
      }
    }

    return this.db.helpdeskAgent.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.role !== undefined && { role: input.role as never }),
        ...(input.department !== undefined && { department: input.department }),
        ...(input.maxOpenTickets !== undefined && { maxOpenTickets: input.maxOpenTickets }),
        ...(input.specialties !== undefined && { specialties: input.specialties }),
      },
    });
  }

  /**
   * Delete an agent. Validates ownership and checks for active assigned tickets.
   */
  async delete(id: string, userId: string): Promise<void> {
    const belongs = await this.db.helpdeskAgent.findFirst({ where: { id, userId } });
    if (!belongs) {
      throw new Error('Agent not found');
    }

    const hasTickets = await this.db.ticket.findFirst({
      where: { assignedAgentId: id, status: { notIn: ['RESOLVED', 'CLOSED'] } },
    });
    if (hasTickets) {
      throw new Error('Cannot delete an agent with active assigned tickets. Reassign or resolve tickets first, or deactivate the agent.');
    }

    await this.db.helpdeskAgent.delete({ where: { id } });
  }

  /**
   * Get a single agent by ID with ownership check
   */
  async getById(id: string, userId: string) {
    return this.db.helpdeskAgent.findFirst({
      where: { id, userId },
      include: { _count: { select: { assignedTickets: true } } },
    });
  }

  /**
   * Find an agent by their linked user ID (useful for auth-based lookups)
   */
  async getByUserId(userId: string, agentUserId: string) {
    return this.db.helpdeskAgent.findFirst({
      where: { userId, email: agentUserId },
    });
  }

  /**
   * List agents with filtering and pagination
   */
  async list(userId: string, filters: AgentFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Record<string, unknown> = { userId };

    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.department) where.department = filters.department;
    if (filters.role) where.role = filters.role;

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { department: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.db.helpdeskAgent.findMany({
        where: where as never,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.db.helpdeskAgent.count({ where: where as never }),
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
   * Get all active agents (no pagination, for assignment dropdowns)
   */
  async listActive(userId: string) {
    return this.db.helpdeskAgent.findMany({
      where: { userId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Toggle an agent's active state.
   * Inactive agents cannot be assigned new tickets but retain existing assignments.
   */
  async toggleActive(id: string, userId: string) {
    const agent = await this.db.helpdeskAgent.findFirst({ where: { id, userId } });
    if (!agent) {
      throw new Error('Agent not found');
    }

    return this.db.helpdeskAgent.update({
      where: { id },
      data: { isActive: !agent.isActive },
    });
  }

  /**
   * Get workload metrics for a specific agent.
   * Returns open/in-progress ticket counts, resolution rate, and utilization.
   */
  async getWorkload(id: string, userId: string): Promise<AgentWorkload | null> {
    const agent = await this.db.helpdeskAgent.findFirst({ where: { id, userId } });
    if (!agent) {
      throw new Error('Agent not found');
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [openTickets, inProgressTickets, resolvedToday] = await Promise.all([
      this.db.ticket.count({ where: { assignedAgentId: id, status: 'OPEN' } }),
      this.db.ticket.count({ where: { assignedAgentId: id, status: 'IN_PROGRESS' } }),
      this.db.ticket.count({
        where: { assignedAgentId: id, status: 'RESOLVED', resolvedAt: { gte: todayStart } },
      }),
    ]);

    const totalActive = openTickets + inProgressTickets;
    const utilizationPercent = agent.maxOpenTickets > 0
      ? Math.round((totalActive / agent.maxOpenTickets) * 100)
      : 0;

    return {
      agentId: agent.id,
      agentName: agent.name,
      openTickets,
      inProgressTickets,
      resolvedToday,
      avgResponseMinutes: 0, // Would require tracking response times in messages
      maxOpenTickets: agent.maxOpenTickets,
      utilizationPercent,
    };
  }

  /**
   * Get workload overview for all agents. Useful for the manager dashboard.
   */
  async getAllWorkloads(userId: string): Promise<AgentWorkload[]> {
    const agents = await this.db.helpdeskAgent.findMany({
      where: { userId, isActive: true },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const workloads: AgentWorkload[] = [];

    for (const agent of agents) {
      const [openTickets, inProgressTickets, resolvedToday] = await Promise.all([
        this.db.ticket.count({ where: { assignedAgentId: agent.id, status: 'OPEN' } }),
        this.db.ticket.count({ where: { assignedAgentId: agent.id, status: 'IN_PROGRESS' } }),
        this.db.ticket.count({
          where: { assignedAgentId: agent.id, status: 'RESOLVED', resolvedAt: { gte: todayStart } },
        }),
      ]);

      const totalActive = openTickets + inProgressTickets;
      const utilizationPercent = agent.maxOpenTickets > 0
        ? Math.round((totalActive / agent.maxOpenTickets) * 100)
        : 0;

      workloads.push({
        agentId: agent.id,
        agentName: agent.name,
        openTickets,
        inProgressTickets,
        resolvedToday,
        avgResponseMinutes: 0,
        maxOpenTickets: agent.maxOpenTickets,
        utilizationPercent,
      });
    }

    return workloads;
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createAgentService(db: PrismaClient): AgentService {
  return new AgentService(db);
}

let instance: AgentService | null = null;

export function getAgentService(db?: PrismaClient): AgentService {
  if (db) return createAgentService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new AgentService(globalDb);
  }
  return instance;
}

export default AgentService;
