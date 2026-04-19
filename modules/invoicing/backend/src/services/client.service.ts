// =============================================================================
// Invoicing Client Service
// =============================================================================
// Business logic for client management, search, and billing statistics.
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface ClientCreateInput {
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  taxId?: string;
  billingAddress?: Record<string, string>;
  notes?: string;
}

export interface ClientUpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  taxId?: string;
  billingAddress?: Record<string, string>;
  notes?: string;
}

export interface ClientFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface ClientStats {
  invoiceCount: number;
  totalBilled: number;
  totalPaid: number;
}

// =============================================================================
// Client Service
// =============================================================================

export class ClientService {
  constructor(private db: PrismaClient) {}

  /**
   * Create a new client for the authenticated user
   */
  async create(input: ClientCreateInput) {
    return this.db.invoicingClient.create({
      data: {
        userId: input.userId,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        companyName: input.companyName || null,
        taxId: input.taxId || null,
        billingAddress: input.billingAddress || undefined,
        notes: input.notes || null,
      },
    });
  }

  /**
   * Update an existing client. Validates ownership.
   */
  async update(id: string, userId: string, input: ClientUpdateInput) {
    const client = await this.db.invoicingClient.findFirst({ where: { id, userId } });
    if (!client) {
      throw new Error('Client not found');
    }

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.email !== undefined) data.email = input.email;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.companyName !== undefined) data.companyName = input.companyName;
    if (input.taxId !== undefined) data.taxId = input.taxId;
    if (input.billingAddress !== undefined) data.billingAddress = input.billingAddress;
    if (input.notes !== undefined) data.notes = input.notes;

    return this.db.invoicingClient.update({ where: { id }, data });
  }

  /**
   * Delete a client. Validates ownership.
   */
  async delete(id: string, userId: string): Promise<void> {
    const client = await this.db.invoicingClient.findFirst({ where: { id, userId } });
    if (!client) {
      throw new Error('Client not found');
    }

    await this.db.invoicingClient.delete({ where: { id } });
  }

  /**
   * Get a single client by ID with ownership check
   */
  async getById(id: string, userId: string) {
    return this.db.invoicingClient.findFirst({
      where: { id, userId },
      include: { invoices: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
  }

  /**
   * List clients for a user with search and pagination
   */
  async list(userId: string, filters: ClientFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Record<string, unknown> = { userId };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { companyName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.db.invoicingClient.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.db.invoicingClient.count({ where }),
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
   * Get billing statistics for a specific client
   */
  async getStats(clientId: string, userId: string): Promise<ClientStats> {
    const client = await this.db.invoicingClient.findFirst({ where: { id: clientId, userId } });
    if (!client) {
      throw new Error('Client not found');
    }

    const [invoiceCount, billedResult, paidResult] = await Promise.all([
      this.db.invoice.count({ where: { clientId } }),
      this.db.invoice.aggregate({ where: { clientId }, _sum: { totalAmount: true } }),
      this.db.invoice.aggregate({ where: { clientId }, _sum: { amountPaid: true } }),
    ]);

    return {
      invoiceCount,
      totalBilled: billedResult._sum.totalAmount ?? 0,
      totalPaid: paidResult._sum.amountPaid ?? 0,
    };
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createClientService(db: PrismaClient): ClientService {
  return new ClientService(db);
}

let instance: ClientService | null = null;
export function getClientService(db?: PrismaClient): ClientService {
  if (db) return createClientService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new ClientService(globalDb);
  }
  return instance;
}

export default ClientService;
