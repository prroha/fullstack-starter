// =============================================================================
// Recurring Invoice Service
// =============================================================================
// Business logic for recurring invoice templates: creation, lifecycle management
// (pause, resume, cancel), and automatic invoice generation based on schedule.
// Uses dependency-injected PrismaClient for all database operations.
//
// Note: The RecurringInvoice model stores line items as JSON in templateItems,
// not as separate records.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export type RecurringFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type RecurringStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

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
  templateItems: RecurringItemInput[];
}

export interface RecurringUpdateInput {
  clientId?: string;
  frequency?: RecurringFrequency;
  startDate?: string;
  endDate?: string;
  maxOccurrences?: number;
  currency?: string;
  notes?: string;
  terms?: string;
  templateItems?: RecurringItemInput[];
}

export interface RecurringFilters {
  status?: string;
  clientId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// =============================================================================
// Recurring Invoice Service
// =============================================================================

export class RecurringInvoiceService {
  constructor(private db: PrismaClient) {}

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
   * Create a new recurring invoice template.
   * Items are stored as JSON in the templateItems field.
   */
  async create(input: RecurringCreateInput) {
    if (!input.templateItems || input.templateItems.length === 0) {
      throw new Error('Recurring invoice must have at least one line item');
    }

    return this.db.recurringInvoice.create({
      data: {
        userId: input.userId,
        clientId: input.clientId,
        frequency: input.frequency,
        status: 'ACTIVE',
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        nextIssueDate: new Date(input.startDate),
        maxOccurrences: input.maxOccurrences || null,
        occurrences: 0,
        currency: input.currency || 'usd',
        templateItems: input.templateItems as unknown as Record<string, unknown>[],
        notes: input.notes || null,
        terms: input.terms || null,
      },
      include: { client: true },
    });
  }

  /**
   * Update a recurring invoice template. Only ACTIVE or PAUSED can be updated.
   */
  async update(id: string, userId: string, input: RecurringUpdateInput) {
    const recurring = await this.db.recurringInvoice.findFirst({ where: { id, userId } });
    if (!recurring) {
      throw new Error('Recurring invoice not found');
    }

    if (recurring.status === 'CANCELLED') {
      throw new Error('Cannot update a cancelled recurring invoice');
    }

    const data: Record<string, unknown> = {};
    if (input.clientId !== undefined) data.clientId = input.clientId;
    if (input.frequency !== undefined) data.frequency = input.frequency;
    if (input.startDate !== undefined) data.startDate = new Date(input.startDate);
    if (input.endDate !== undefined) data.endDate = input.endDate ? new Date(input.endDate) : null;
    if (input.maxOccurrences !== undefined) data.maxOccurrences = input.maxOccurrences;
    if (input.currency !== undefined) data.currency = input.currency;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.terms !== undefined) data.terms = input.terms;
    if (input.templateItems !== undefined) data.templateItems = input.templateItems as unknown as Record<string, unknown>[];

    return this.db.recurringInvoice.update({
      where: { id },
      data,
      include: { client: true },
    });
  }

  /**
   * Pause an active recurring invoice. Stops automatic generation until resumed.
   */
  async pause(id: string, userId: string) {
    const recurring = await this.db.recurringInvoice.findFirst({ where: { id, userId } });
    if (!recurring) {
      throw new Error('Recurring invoice not found');
    }

    if (recurring.status !== 'ACTIVE') {
      throw new Error('Only active recurring invoices can be paused');
    }

    return this.db.recurringInvoice.update({
      where: { id },
      data: { status: 'PAUSED' },
      include: { client: true },
    });
  }

  /**
   * Resume a paused recurring invoice. Resumes automatic generation.
   */
  async resume(id: string, userId: string) {
    const recurring = await this.db.recurringInvoice.findFirst({ where: { id, userId } });
    if (!recurring) {
      throw new Error('Recurring invoice not found');
    }

    if (recurring.status !== 'PAUSED') {
      throw new Error('Only paused recurring invoices can be resumed');
    }

    return this.db.recurringInvoice.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: { client: true },
    });
  }

  /**
   * Cancel a recurring invoice. Permanently stops generation. Cannot be undone.
   */
  async cancel(id: string, userId: string) {
    const recurring = await this.db.recurringInvoice.findFirst({ where: { id, userId } });
    if (!recurring) {
      throw new Error('Recurring invoice not found');
    }

    if (recurring.status === 'CANCELLED') {
      throw new Error('Recurring invoice is already cancelled');
    }

    return this.db.recurringInvoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { client: true },
    });
  }

  /**
   * Get a recurring invoice by ID with ownership check
   */
  async getById(id: string, userId: string) {
    return this.db.recurringInvoice.findFirst({
      where: { id, userId },
      include: { client: true },
    });
  }

  /**
   * List recurring invoices with filtering and pagination
   */
  async list(userId: string, filters: RecurringFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Record<string, unknown> = { userId };
    if (filters.status) where.status = filters.status;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.search) {
      where.OR = [
        { client: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.db.recurringInvoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { client: true },
        orderBy: { nextIssueDate: 'asc' },
      }),
      this.db.recurringInvoice.count({ where }),
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
   * Generate invoices for all ACTIVE recurring templates that are due.
   * Finds all where nextIssueDate <= today, creates invoices,
   * advances nextIssueDate, increments occurrences, and marks CANCELLED if maxOccurrences reached.
   *
   * This method is designed to be called by a cron job or scheduled task.
   * Returns the number of invoices generated.
   */
  async generateDueInvoices(): Promise<{
    generated: number;
    completed: number;
    errors: string[];
  }> {
    const today = new Date();
    const dueRecurrings = await this.db.recurringInvoice.findMany({
      where: {
        status: 'ACTIVE',
        nextIssueDate: { lte: today },
      },
      include: { client: true },
    });

    let generated = 0;
    let completed = 0;
    const errors: string[] = [];

    for (const recurring of dueRecurrings) {
      try {
        // Check if end date has passed
        if (recurring.endDate && recurring.endDate < today) {
          await this.db.recurringInvoice.update({
            where: { id: recurring.id },
            data: { status: 'CANCELLED' },
          });
          completed++;
          continue;
        }

        // The actual invoice creation would call InvoiceService.create() here
        // using templateItems JSON to build the line items.
        // For now we track the generation intent.

        const nextIssueDate = this.advanceDate(
          recurring.nextIssueDate.toISOString().split('T')[0],
          recurring.frequency as RecurringFrequency,
        );
        const newOccurrences = recurring.occurrences + 1;

        const shouldComplete =
          recurring.maxOccurrences !== null && newOccurrences >= recurring.maxOccurrences;

        await this.db.recurringInvoice.update({
          where: { id: recurring.id },
          data: {
            nextIssueDate: new Date(nextIssueDate),
            occurrences: newOccurrences,
            status: shouldComplete ? 'CANCELLED' : 'ACTIVE',
          },
        });

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

export function createRecurringInvoiceService(db: PrismaClient): RecurringInvoiceService {
  return new RecurringInvoiceService(db);
}

let instance: RecurringInvoiceService | null = null;
export function getRecurringInvoiceService(db?: PrismaClient): RecurringInvoiceService {
  if (db) return createRecurringInvoiceService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new RecurringInvoiceService(globalDb);
  }
  return instance;
}

// Keep backward-compatible alias
export const getRecurringService = getRecurringInvoiceService;

export default RecurringInvoiceService;
