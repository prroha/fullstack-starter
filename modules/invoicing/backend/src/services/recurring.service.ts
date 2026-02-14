// =============================================================================
// Recurring Invoice Service
// =============================================================================
// Business logic for recurring invoice templates: creation, lifecycle management
// (pause, resume, cancel), and automatic invoice generation based on schedule.
// Uses placeholder db operations - replace with actual Prisma client.

// =============================================================================
// Types
// =============================================================================

export type RecurringFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type RecurringStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';

export interface RecurringItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRateId?: string;
}

export interface RecurringCreateInput {
  userId: string;
  clientId: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  maxOccurrences?: number;
  currency?: string;
  notes?: string;
  terms?: string;
  discountAmount?: number;
  items: RecurringItemInput[];
}

export interface RecurringUpdateInput {
  clientId?: string;
  frequency?: RecurringFrequency;
  endDate?: string;
  maxOccurrences?: number;
  currency?: string;
  notes?: string;
  terms?: string;
  discountAmount?: number;
}

export interface RecurringFilters {
  status?: string;
  clientId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface RecurringRecord {
  id: string;
  userId: string;
  clientId: string;
  frequency: RecurringFrequency;
  status: RecurringStatus;
  startDate: string;
  endDate: string | null;
  nextIssueDate: string;
  maxOccurrences: number | null;
  occurrences: number;
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes: string | null;
  terms: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RecurringItemRecord {
  id: string;
  recurringInvoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRateId: string | null;
  taxAmount: number;
  sortOrder: number;
}

interface TaxRateRecord {
  id: string;
  rate: number;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================
// Replace with actual Prisma client:
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  async findTaxRate(id: string): Promise<TaxRateRecord | null> {
    // Replace with: return db.taxRate.findUnique({ where: { id }, select: { id: true, rate: true } });
    console.log('[DB] Finding tax rate:', id);
    return null;
  },

  async createRecurring(data: {
    userId: string;
    clientId: string;
    frequency: RecurringFrequency;
    status: RecurringStatus;
    startDate: string;
    endDate: string | null;
    nextIssueDate: string;
    maxOccurrences: number | null;
    occurrences: number;
    currency: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    notes: string | null;
    terms: string | null;
  }): Promise<RecurringRecord> {
    // Replace with: return db.recurringInvoice.create({ data, include: { client: true, items: true } });
    console.log('[DB] Creating recurring invoice for client:', data.clientId, 'frequency:', data.frequency);
    return {
      id: 'recurring_' + Date.now(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async createRecurringItems(recurringInvoiceId: string, items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRateId: string | null;
    taxAmount: number;
    sortOrder: number;
  }>): Promise<RecurringItemRecord[]> {
    // Replace with:
    // return Promise.all(items.map(item =>
    //   db.recurringInvoiceItem.create({ data: { recurringInvoiceId, ...item } })
    // ));
    console.log('[DB] Creating recurring invoice items, count:', items.length);
    return items.map((item, index) => ({
      id: 'ritem_' + Date.now() + '_' + index,
      recurringInvoiceId,
      ...item,
    }));
  },

  async findRecurringById(id: string): Promise<RecurringRecord | null> {
    // Replace with: return db.recurringInvoice.findUnique({ where: { id }, include: { client: true, items: { orderBy: { sortOrder: 'asc' } } } });
    console.log('[DB] Finding recurring invoice by ID:', id);
    return null;
  },

  async findRecurringInvoices(userId: string, filters: RecurringFilters): Promise<{ items: RecurringRecord[]; total: number }> {
    // Replace with:
    // const where = {
    //   userId,
    //   status: filters.status || undefined,
    //   clientId: filters.clientId || undefined,
    //   OR: filters.search ? [
    //     { client: { name: { contains: filters.search, mode: 'insensitive' } } },
    //   ] : undefined,
    // };
    // const [items, total] = await Promise.all([
    //   db.recurringInvoice.findMany({ where, skip: ((filters.page || 1) - 1) * (filters.limit || 20), take: filters.limit || 20, include: { client: true }, orderBy: { nextIssueDate: 'asc' } }),
    //   db.recurringInvoice.count({ where }),
    // ]);
    console.log('[DB] Finding recurring invoices for user:', userId, filters);
    return { items: [], total: 0 };
  },

  async updateRecurring(id: string, data: Partial<RecurringRecord>): Promise<RecurringRecord | null> {
    // Replace with: return db.recurringInvoice.update({ where: { id }, data: { ...data, updatedAt: new Date() }, include: { client: true, items: true } });
    console.log('[DB] Updating recurring invoice:', id);
    return null;
  },

  async getRecurringItems(recurringInvoiceId: string): Promise<RecurringItemRecord[]> {
    // Replace with: return db.recurringInvoiceItem.findMany({ where: { recurringInvoiceId }, orderBy: { sortOrder: 'asc' } });
    console.log('[DB] Getting items for recurring invoice:', recurringInvoiceId);
    return [];
  },

  async findDueRecurringInvoices(today: string): Promise<RecurringRecord[]> {
    // Replace with:
    // return db.recurringInvoice.findMany({
    //   where: {
    //     status: 'ACTIVE',
    //     nextIssueDate: { lte: today },
    //   },
    //   include: { client: true, items: { orderBy: { sortOrder: 'asc' } } },
    // });
    console.log('[DB] Finding due recurring invoices for date:', today);
    return [];
  },

  async checkRecurringBelongsToUser(recurringId: string, userId: string): Promise<boolean> {
    // Replace with: return !!(await db.recurringInvoice.findFirst({ where: { id: recurringId, userId } }));
    console.log('[DB] Checking recurring invoice ownership:', recurringId, userId);
    return false;
  },
};

// =============================================================================
// Recurring Invoice Service
// =============================================================================

export class RecurringInvoiceService {
  /**
   * Calculate the next issue date based on the current date and frequency.
   */
  private advanceDate(dateStr: string, frequency: RecurringFrequency): string {
    const date = new Date(dateStr);

    switch (frequency) {
      case 'WEEKLY':
        date.setDate(date.getDate() + 7);
        break;
      case 'BIWEEKLY':
        date.setDate(date.getDate() + 14);
        break;
      case 'MONTHLY':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'QUARTERLY':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'YEARLY':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }

    return date.toISOString().split('T')[0];
  }

  /**
   * Calculate line item totals including tax
   */
  private async calculateItemTotals(items: RecurringItemInput[]): Promise<Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRateId: string | null;
    taxAmount: number;
    sortOrder: number;
  }>> {
    const calculated = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const totalPrice = item.quantity * item.unitPrice;

      let taxAmount = 0;
      if (item.taxRateId) {
        const taxRate = await dbOperations.findTaxRate(item.taxRateId);
        if (taxRate) {
          taxAmount = Math.round(totalPrice * (taxRate.rate / 100));
        }
      }

      calculated.push({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        taxRateId: item.taxRateId || null,
        taxAmount,
        sortOrder: i,
      });
    }

    return calculated;
  }

  /**
   * Create a new recurring invoice template with line items.
   */
  async create(input: RecurringCreateInput): Promise<RecurringRecord> {
    if (!input.items || input.items.length === 0) {
      throw new Error('Recurring invoice must have at least one line item');
    }

    const calculatedItems = await this.calculateItemTotals(input.items);

    const subtotal = calculatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = calculatedItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const discountAmount = input.discountAmount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    const recurring = await dbOperations.createRecurring({
      userId: input.userId,
      clientId: input.clientId,
      frequency: input.frequency,
      status: 'ACTIVE',
      startDate: input.startDate,
      endDate: input.endDate || null,
      nextIssueDate: input.startDate,
      maxOccurrences: input.maxOccurrences || null,
      occurrences: 0,
      currency: input.currency || 'USD',
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      notes: input.notes || null,
      terms: input.terms || null,
    });

    await dbOperations.createRecurringItems(recurring.id, calculatedItems);

    return recurring;
  }

  /**
   * Update a recurring invoice template. Only ACTIVE or PAUSED can be updated.
   */
  async update(id: string, userId: string, input: RecurringUpdateInput): Promise<RecurringRecord | null> {
    const belongs = await dbOperations.checkRecurringBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Recurring invoice not found');
    }

    const recurring = await dbOperations.findRecurringById(id);
    if (!recurring) {
      throw new Error('Recurring invoice not found');
    }

    if (recurring.status === 'CANCELLED' || recurring.status === 'COMPLETED') {
      throw new Error('Cannot update a cancelled or completed recurring invoice');
    }

    return dbOperations.updateRecurring(id, input as Partial<RecurringRecord>);
  }

  /**
   * Pause an active recurring invoice. Stops automatic generation until resumed.
   */
  async pause(id: string, userId: string): Promise<RecurringRecord | null> {
    const belongs = await dbOperations.checkRecurringBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Recurring invoice not found');
    }

    const recurring = await dbOperations.findRecurringById(id);
    if (!recurring) {
      throw new Error('Recurring invoice not found');
    }

    if (recurring.status !== 'ACTIVE') {
      throw new Error('Only active recurring invoices can be paused');
    }

    return dbOperations.updateRecurring(id, { status: 'PAUSED' } as Partial<RecurringRecord>);
  }

  /**
   * Resume a paused recurring invoice. Resumes automatic generation.
   */
  async resume(id: string, userId: string): Promise<RecurringRecord | null> {
    const belongs = await dbOperations.checkRecurringBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Recurring invoice not found');
    }

    const recurring = await dbOperations.findRecurringById(id);
    if (!recurring) {
      throw new Error('Recurring invoice not found');
    }

    if (recurring.status !== 'PAUSED') {
      throw new Error('Only paused recurring invoices can be resumed');
    }

    return dbOperations.updateRecurring(id, { status: 'ACTIVE' } as Partial<RecurringRecord>);
  }

  /**
   * Cancel a recurring invoice. Permanently stops generation. Cannot be undone.
   */
  async cancel(id: string, userId: string): Promise<RecurringRecord | null> {
    const belongs = await dbOperations.checkRecurringBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Recurring invoice not found');
    }

    const recurring = await dbOperations.findRecurringById(id);
    if (!recurring) {
      throw new Error('Recurring invoice not found');
    }

    if (recurring.status === 'CANCELLED') {
      throw new Error('Recurring invoice is already cancelled');
    }

    if (recurring.status === 'COMPLETED') {
      throw new Error('Cannot cancel a completed recurring invoice');
    }

    return dbOperations.updateRecurring(id, { status: 'CANCELLED' } as Partial<RecurringRecord>);
  }

  /**
   * Get a recurring invoice by ID with ownership check
   */
  async getById(id: string, userId: string): Promise<RecurringRecord | null> {
    const belongs = await dbOperations.checkRecurringBelongsToUser(id, userId);
    if (!belongs) return null;

    return dbOperations.findRecurringById(id);
  }

  /**
   * List recurring invoices with filtering and pagination
   */
  async list(userId: string, filters: RecurringFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await dbOperations.findRecurringInvoices(userId, {
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
   * Generate invoices for all ACTIVE recurring templates that are due.
   * Finds all where nextIssueDate <= today, creates invoices,
   * advances nextIssueDate, increments occurrences, and pauses if maxOccurrences reached.
   *
   * This method is designed to be called by a cron job or scheduled task.
   * Returns the number of invoices generated.
   */
  async generateDueInvoices(): Promise<{
    generated: number;
    completed: number;
    errors: string[];
  }> {
    const today = new Date().toISOString().split('T')[0];
    const dueRecurrings = await dbOperations.findDueRecurringInvoices(today);

    let generated = 0;
    let completed = 0;
    const errors: string[] = [];

    for (const recurring of dueRecurrings) {
      try {
        // Check if end date has passed
        if (recurring.endDate && recurring.endDate < today) {
          await dbOperations.updateRecurring(recurring.id, {
            status: 'COMPLETED',
          } as Partial<RecurringRecord>);
          completed++;
          continue;
        }

        // Get template items for the new invoice
        const items = await dbOperations.getRecurringItems(recurring.id);

        // The actual invoice creation would call InvoiceService.create() here.
        // For now, we log the intent and track the generation.
        console.log(
          '[RecurringService] Would create invoice for recurring:',
          recurring.id,
          'client:',
          recurring.clientId,
          'items:',
          items.length,
        );

        // Advance the next issue date
        const nextIssueDate = this.advanceDate(recurring.nextIssueDate, recurring.frequency);
        const newOccurrences = recurring.occurrences + 1;

        // Check if max occurrences reached
        const shouldComplete = recurring.maxOccurrences !== null && newOccurrences >= recurring.maxOccurrences;

        await dbOperations.updateRecurring(recurring.id, {
          nextIssueDate,
          occurrences: newOccurrences,
          status: shouldComplete ? 'COMPLETED' : 'ACTIVE',
        } as Partial<RecurringRecord>);

        generated++;
        if (shouldComplete) {
          completed++;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error generating invoice';
        errors.push(`Recurring ${recurring.id}: ${message}`);
      }
    }

    return { generated, completed, errors };
  }
}

// =============================================================================
// Factory
// =============================================================================

let recurringInvoiceServiceInstance: RecurringInvoiceService | null = null;

export function getRecurringInvoiceService(): RecurringInvoiceService {
  if (!recurringInvoiceServiceInstance) {
    recurringInvoiceServiceInstance = new RecurringInvoiceService();
  }
  return recurringInvoiceServiceInstance;
}

export default RecurringInvoiceService;
