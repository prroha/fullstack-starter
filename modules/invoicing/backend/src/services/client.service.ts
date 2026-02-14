// =============================================================================
// Invoicing Client Service
// =============================================================================
// Business logic for client management, search, and billing statistics.
// Uses placeholder db operations - replace with actual Prisma client.

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

interface ClientRecord {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  taxId: string | null;
  billingAddress: Record<string, string> | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================
// Replace with actual Prisma client:
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  async createClient(data: {
    userId: string;
    name: string;
    email: string | null;
    phone: string | null;
    companyName: string | null;
    taxId: string | null;
    billingAddress: Record<string, string> | null;
    notes: string | null;
  }): Promise<ClientRecord> {
    // Replace with: return db.invoicingClient.create({ data });
    console.log('[DB] Creating client:', data.name);
    return {
      id: 'client_' + Date.now(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async updateClient(id: string, data: ClientUpdateInput): Promise<ClientRecord | null> {
    // Replace with: return db.invoicingClient.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
    console.log('[DB] Updating client:', id);
    return null;
  },

  async deleteClient(id: string): Promise<void> {
    // Replace with: await db.invoicingClient.delete({ where: { id } });
    console.log('[DB] Deleting client:', id);
  },

  async findClientById(id: string): Promise<ClientRecord | null> {
    // Replace with: return db.invoicingClient.findUnique({ where: { id }, include: { invoices: true } });
    console.log('[DB] Finding client by ID:', id);
    return null;
  },

  async findClients(userId: string, filters: ClientFilters): Promise<{ items: ClientRecord[]; total: number }> {
    // Replace with:
    // const where = {
    //   userId,
    //   OR: filters.search ? [
    //     { name: { contains: filters.search, mode: 'insensitive' } },
    //     { email: { contains: filters.search, mode: 'insensitive' } },
    //     { companyName: { contains: filters.search, mode: 'insensitive' } },
    //   ] : undefined,
    // };
    // const [items, total] = await Promise.all([
    //   db.invoicingClient.findMany({ where, skip: ((filters.page || 1) - 1) * (filters.limit || 20), take: filters.limit || 20, orderBy: { name: 'asc' } }),
    //   db.invoicingClient.count({ where }),
    // ]);
    console.log('[DB] Finding clients for user:', userId, filters);
    return { items: [], total: 0 };
  },

  async getClientStats(clientId: string): Promise<ClientStats> {
    // Replace with:
    // const [invoiceCount, billedResult, paidResult] = await Promise.all([
    //   db.invoice.count({ where: { clientId } }),
    //   db.invoice.aggregate({ where: { clientId }, _sum: { totalAmount: true } }),
    //   db.invoice.aggregate({ where: { clientId }, _sum: { amountPaid: true } }),
    // ]);
    console.log('[DB] Getting client stats:', clientId);
    return {
      invoiceCount: 0,
      totalBilled: 0,
      totalPaid: 0,
    };
  },

  async checkClientBelongsToUser(clientId: string, userId: string): Promise<boolean> {
    // Replace with: return !!(await db.invoicingClient.findFirst({ where: { id: clientId, userId } }));
    console.log('[DB] Checking client ownership:', clientId, userId);
    return false;
  },
};

// =============================================================================
// Client Service
// =============================================================================

export class ClientService {
  /**
   * Create a new client for the authenticated user
   */
  async create(input: ClientCreateInput): Promise<ClientRecord> {
    return dbOperations.createClient({
      userId: input.userId,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      companyName: input.companyName || null,
      taxId: input.taxId || null,
      billingAddress: input.billingAddress || null,
      notes: input.notes || null,
    });
  }

  /**
   * Update an existing client. Validates ownership.
   */
  async update(id: string, userId: string, input: ClientUpdateInput): Promise<ClientRecord | null> {
    const belongs = await dbOperations.checkClientBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Client not found');
    }

    return dbOperations.updateClient(id, input);
  }

  /**
   * Delete a client. Validates ownership.
   */
  async delete(id: string, userId: string): Promise<void> {
    const belongs = await dbOperations.checkClientBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Client not found');
    }

    return dbOperations.deleteClient(id);
  }

  /**
   * Get a single client by ID with ownership check
   */
  async getById(id: string, userId: string): Promise<ClientRecord | null> {
    const belongs = await dbOperations.checkClientBelongsToUser(id, userId);
    if (!belongs) {
      return null;
    }

    return dbOperations.findClientById(id);
  }

  /**
   * List clients for a user with search and pagination
   */
  async list(userId: string, filters: ClientFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await dbOperations.findClients(userId, {
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
   * Get billing statistics for a specific client
   */
  async getStats(clientId: string, userId: string): Promise<ClientStats> {
    const belongs = await dbOperations.checkClientBelongsToUser(clientId, userId);
    if (!belongs) {
      throw new Error('Client not found');
    }

    return dbOperations.getClientStats(clientId);
  }
}

// =============================================================================
// Factory
// =============================================================================

let clientServiceInstance: ClientService | null = null;

export function getClientService(): ClientService {
  if (!clientServiceInstance) {
    clientServiceInstance = new ClientService();
  }
  return clientServiceInstance;
}

export default ClientService;
