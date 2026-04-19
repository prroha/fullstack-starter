// =============================================================================
// Invoice Service
// =============================================================================
// Business logic for invoice creation, lifecycle management (send, void, duplicate),
// number generation, totals recalculation, and dashboard statistics.
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRateId?: string;
}

export interface InvoiceCreateInput {
  userId: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  currency?: string;
  notes?: string;
  terms?: string;
  discountAmount?: number;
  items?: InvoiceItemInput[];
}

export interface InvoiceUpdateInput {
  clientId?: string;
  issueDate?: string;
  dueDate?: string;
  currency?: string;
  notes?: string;
  terms?: string;
  discountAmount?: number;
}

export interface InvoiceFilters {
  status?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceStats {
  totalClients: number;
  totalInvoices: number;
  totalRevenue: number;
  totalOutstanding: number;
  overdueCount: number;
  overdueAmount: number;
  paidThisMonth: number;
  sentThisMonth: number;
}

// =============================================================================
// Invoice Service
// =============================================================================

export class InvoiceService {
  constructor(private db: PrismaClient) {}

  /**
   * Generate the next invoice number using user's settings prefix + auto-increment.
   * Default prefix is "INV-", default start number is 1001.
   */
  async generateInvoiceNumber(userId: string): Promise<string> {
    let settings = await this.db.invoicingSettings.findUnique({ where: { userId } });

    if (!settings) {
      settings = await this.db.invoicingSettings.create({
        data: {
          userId,
          invoicePrefix: 'INV-',
          nextNumber: 1001,
        },
      });
    }

    const invoiceNumber = `${settings.invoicePrefix}${settings.nextNumber.toString().padStart(4, '0')}`;

    await this.db.invoicingSettings.update({
      where: { userId },
      data: { nextNumber: { increment: 1 } },
    });

    return invoiceNumber;
  }

  /**
   * Recalculate invoice totals from line items.
   * subtotal = sum of item totalPrice values
   * taxTotal = sum of per-item tax (computed from linked taxRate)
   * totalAmount = subtotal + taxTotal - discountAmount
   * amountDue = totalAmount - amountPaid
   */
  private async recalculateTotals(invoiceId: string, discountAmount: number, amountPaid: number): Promise<{
    subtotal: number;
    taxTotal: number;
    totalAmount: number;
    amountDue: number;
  }> {
    const items = await this.db.invoiceItem.findMany({
      where: { invoiceId },
      include: { taxRate: true },
      orderBy: { sortOrder: 'asc' },
    });

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxTotal = items.reduce((sum, item) => {
      if (item.taxRate) {
        return sum + Math.round(item.totalPrice * (item.taxRate.rate / 100));
      }
      return sum;
    }, 0);
    const totalAmount = subtotal + taxTotal - discountAmount;
    const amountDue = totalAmount - amountPaid;

    return { subtotal, taxTotal, totalAmount, amountDue };
  }

  /**
   * Calculate line item data for creation (totalPrice from quantity * unitPrice)
   */
  private calculateItemData(items: InvoiceItemInput[]): Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRateId: string | null;
    sortOrder: number;
  }> {
    return items.map((item, i) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: Math.round(item.quantity * item.unitPrice),
      taxRateId: item.taxRateId || null,
      sortOrder: i,
    }));
  }

  /**
   * Compute tax total from items and their linked tax rates
   */
  private async computeTaxTotal(items: Array<{ totalPrice: number; taxRateId: string | null }>): Promise<number> {
    let taxTotal = 0;
    for (const item of items) {
      if (item.taxRateId) {
        const taxRate = await this.db.taxRate.findUnique({
          where: { id: item.taxRateId },
          select: { rate: true },
        });
        if (taxRate) {
          taxTotal += Math.round(item.totalPrice * (taxRate.rate / 100));
        }
      }
    }
    return taxTotal;
  }

  /**
   * Create a new invoice with line items.
   * Generates invoice number, calculates totals, and creates activity record.
   */
  async create(input: InvoiceCreateInput) {
    const items = input.items || [];
    if (items.length === 0) {
      throw new Error('Invoice must have at least one line item');
    }

    const invoiceNumber = await this.generateInvoiceNumber(input.userId);
    const calculatedItems = this.calculateItemData(items);

    const subtotal = calculatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxTotal = await this.computeTaxTotal(calculatedItems);
    const discountAmount = input.discountAmount || 0;
    const totalAmount = subtotal + taxTotal - discountAmount;

    const invoice = await this.db.invoice.create({
      data: {
        userId: input.userId,
        clientId: input.clientId,
        invoiceNumber,
        status: 'DRAFT',
        issueDate: new Date(input.issueDate),
        dueDate: new Date(input.dueDate),
        currency: input.currency || 'usd',
        subtotal,
        taxTotal,
        discountAmount,
        totalAmount,
        amountPaid: 0,
        amountDue: totalAmount,
        notes: input.notes || null,
        terms: input.terms || null,
        items: {
          create: calculatedItems,
        },
      },
      include: { client: true, items: { orderBy: { sortOrder: 'asc' } } },
    });

    await this.db.invoiceActivity.create({
      data: {
        invoiceId: invoice.id,
        action: 'created',
        details: `Invoice ${invoiceNumber} created`,
      },
    });

    return invoice;
  }

  /**
   * Update invoice metadata (not items). Only DRAFT invoices can be updated.
   */
  async update(id: string, userId: string, input: InvoiceUpdateInput) {
    const invoice = await this.db.invoice.findFirst({ where: { id, userId } });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new Error('Only draft invoices can be edited');
    }

    const updateData: Record<string, unknown> = {};
    if (input.clientId !== undefined) updateData.clientId = input.clientId;
    if (input.issueDate !== undefined) updateData.issueDate = new Date(input.issueDate);
    if (input.dueDate !== undefined) updateData.dueDate = new Date(input.dueDate);
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.terms !== undefined) updateData.terms = input.terms;

    if (input.discountAmount !== undefined) {
      updateData.discountAmount = input.discountAmount;
      const totals = await this.recalculateTotals(id, input.discountAmount, invoice.amountPaid);
      updateData.subtotal = totals.subtotal;
      updateData.taxTotal = totals.taxTotal;
      updateData.totalAmount = totals.totalAmount;
      updateData.amountDue = totals.amountDue;
    }

    return this.db.invoice.update({
      where: { id },
      data: updateData,
      include: { client: true, items: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  /**
   * Delete an invoice. Only DRAFT and VOID invoices can be deleted.
   */
  async delete(id: string, userId: string): Promise<void> {
    const invoice = await this.db.invoice.findFirst({ where: { id, userId } });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'DRAFT' && invoice.status !== 'VOID') {
      throw new Error('Only draft or void invoices can be deleted');
    }

    await this.db.invoice.delete({ where: { id } });
  }

  /**
   * Get a single invoice by ID with ownership check
   */
  async getById(id: string, userId: string) {
    const invoice = await this.db.invoice.findFirst({
      where: { id, userId },
      include: {
        client: true,
        items: { orderBy: { sortOrder: 'asc' }, include: { taxRate: true } },
        payments: { orderBy: { paidAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });

    return invoice;
  }

  /**
   * List invoices with filtering and pagination
   */
  async list(userId: string, filters: InvoiceFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Record<string, unknown> = { userId };
    if (filters.status) where.status = filters.status;
    if (filters.clientId) where.clientId = filters.clientId;

    const dateFilter: Record<string, unknown> = {};
    if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom);
    if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo);
    if (Object.keys(dateFilter).length > 0) where.issueDate = dateFilter;

    if (filters.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
        { client: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.db.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { client: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.db.invoice.count({ where }),
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
   * Send an invoice. Changes status from DRAFT to SENT, records activity.
   */
  async send(id: string, userId: string) {
    const invoice = await this.db.invoice.findFirst({ where: { id, userId } });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new Error('Only draft invoices can be sent');
    }

    const updated = await this.db.invoice.update({
      where: { id },
      data: { status: 'SENT' },
      include: { client: true, items: { orderBy: { sortOrder: 'asc' } } },
    });

    await this.db.invoiceActivity.create({
      data: {
        invoiceId: id,
        action: 'sent',
        details: `Invoice ${invoice.invoiceNumber} sent to client`,
      },
    });

    return updated;
  }

  /**
   * Void an invoice. Records activity. Cannot void already paid invoices.
   */
  async void(id: string, userId: string) {
    const invoice = await this.db.invoice.findFirst({ where: { id, userId } });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'VOID') {
      throw new Error('Invoice is already void');
    }

    if (invoice.status === 'PAID') {
      throw new Error('Cannot void a paid invoice');
    }

    const updated = await this.db.invoice.update({
      where: { id },
      data: { status: 'VOID' },
      include: { client: true, items: { orderBy: { sortOrder: 'asc' } } },
    });

    await this.db.invoiceActivity.create({
      data: {
        invoiceId: id,
        action: 'voided',
        details: `Invoice ${invoice.invoiceNumber} voided`,
      },
    });

    return updated;
  }

  /**
   * Duplicate an invoice. Creates a new DRAFT copy with a new invoice number,
   * reset payment amounts, and current date as issue date.
   */
  async duplicate(id: string, userId: string) {
    const original = await this.db.invoice.findFirst({
      where: { id, userId },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!original) {
      throw new Error('Invoice not found');
    }

    const invoiceNumber = await this.generateInvoiceNumber(userId);
    const today = new Date();

    const newInvoice = await this.db.invoice.create({
      data: {
        userId: original.userId,
        clientId: original.clientId,
        invoiceNumber,
        status: 'DRAFT',
        issueDate: today,
        dueDate: original.dueDate,
        currency: original.currency,
        subtotal: original.subtotal,
        taxTotal: original.taxTotal,
        discountAmount: original.discountAmount,
        totalAmount: original.totalAmount,
        amountPaid: 0,
        amountDue: original.totalAmount,
        notes: original.notes,
        terms: original.terms,
        items: {
          create: original.items.map((item, index) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            taxRateId: item.taxRateId,
            sortOrder: index,
          })),
        },
      },
      include: { client: true, items: { orderBy: { sortOrder: 'asc' } } },
    });

    await this.db.invoiceActivity.create({
      data: {
        invoiceId: newInvoice.id,
        action: 'created',
        details: `Invoice ${invoiceNumber} created (duplicated from ${original.invoiceNumber})`,
      },
    });

    return newInvoice;
  }

  /**
   * Get aggregate invoice statistics for the dashboard
   */
  async getStats(userId: string): Promise<InvoiceStats> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = new Date(now.toISOString().split('T')[0]);

    const [
      totalClients,
      totalInvoices,
      revenueResult,
      outstandingResult,
      overdueCount,
      overdueAmountResult,
      paidThisMonth,
      sentThisMonth,
    ] = await Promise.all([
      this.db.invoicingClient.count({ where: { userId } }),
      this.db.invoice.count({ where: { userId } }),
      this.db.invoice.aggregate({ where: { userId, status: 'PAID' }, _sum: { totalAmount: true } }),
      this.db.invoice.aggregate({ where: { userId, status: { in: ['SENT', 'PARTIALLY_PAID'] } }, _sum: { amountDue: true } }),
      this.db.invoice.count({ where: { userId, status: { in: ['SENT', 'PARTIALLY_PAID'] }, dueDate: { lt: today } } }),
      this.db.invoice.aggregate({ where: { userId, status: { in: ['SENT', 'PARTIALLY_PAID'] }, dueDate: { lt: today } }, _sum: { amountDue: true } }),
      this.db.invoice.count({ where: { userId, status: 'PAID', updatedAt: { gte: monthStart } } }),
      this.db.invoice.count({ where: { userId, status: { in: ['SENT', 'PAID', 'PARTIALLY_PAID'] }, createdAt: { gte: monthStart } } }),
    ]);

    return {
      totalClients,
      totalInvoices,
      totalRevenue: revenueResult._sum.totalAmount ?? 0,
      totalOutstanding: outstandingResult._sum.amountDue ?? 0,
      overdueCount,
      overdueAmount: overdueAmountResult._sum.amountDue ?? 0,
      paidThisMonth,
      sentThisMonth,
    };
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createInvoiceService(db: PrismaClient): InvoiceService {
  return new InvoiceService(db);
}

let instance: InvoiceService | null = null;
export function getInvoiceService(db?: PrismaClient): InvoiceService {
  if (db) return createInvoiceService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new InvoiceService(globalDb);
  }
  return instance;
}

export default InvoiceService;
