// =============================================================================
// Invoice Service
// =============================================================================
// Business logic for invoice creation, lifecycle management (send, void, duplicate),
// number generation, totals recalculation, and dashboard statistics.
// Uses placeholder db operations - replace with actual Prisma client.

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
  items: InvoiceItemInput[];
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

interface InvoiceRecord {
  id: string;
  userId: string;
  clientId: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  notes: string | null;
  terms: string | null;
  sentAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface InvoiceItemRecord {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRateId: string | null;
  taxAmount: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface TaxRateRecord {
  id: string;
  rate: number;
}

interface InvoiceSettingsRecord {
  id: string;
  userId: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
}

interface ActivityRecord {
  id: string;
  invoiceId: string;
  action: string;
  description: string;
  createdAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================
// Replace with actual Prisma client:
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  async getInvoiceSettings(userId: string): Promise<InvoiceSettingsRecord | null> {
    // Replace with: return db.invoiceSettings.findUnique({ where: { userId } });
    console.log('[DB] Getting invoice settings for user:', userId);
    return null;
  },

  async upsertInvoiceSettings(userId: string, data: { invoicePrefix: string; nextInvoiceNumber: number }): Promise<InvoiceSettingsRecord> {
    // Replace with:
    // return db.invoiceSettings.upsert({
    //   where: { userId },
    //   create: { userId, ...data },
    //   update: data,
    // });
    console.log('[DB] Upserting invoice settings for user:', userId);
    return {
      id: 'settings_' + Date.now(),
      userId,
      invoicePrefix: data.invoicePrefix,
      nextInvoiceNumber: data.nextInvoiceNumber,
    };
  },

  async incrementNextInvoiceNumber(userId: string): Promise<void> {
    // Replace with: await db.invoiceSettings.update({ where: { userId }, data: { nextInvoiceNumber: { increment: 1 } } });
    console.log('[DB] Incrementing next invoice number for user:', userId);
  },

  async findTaxRate(id: string): Promise<TaxRateRecord | null> {
    // Replace with: return db.taxRate.findUnique({ where: { id }, select: { id: true, rate: true } });
    console.log('[DB] Finding tax rate:', id);
    return null;
  },

  async createInvoice(data: {
    userId: string;
    clientId: string;
    invoiceNumber: string;
    status: string;
    issueDate: string;
    dueDate: string;
    currency: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    amountPaid: number;
    amountDue: number;
    notes: string | null;
    terms: string | null;
  }): Promise<InvoiceRecord> {
    // Replace with: return db.invoice.create({ data, include: { client: true, items: true } });
    console.log('[DB] Creating invoice:', data.invoiceNumber);
    return {
      id: 'invoice_' + Date.now(),
      ...data,
      sentAt: null,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async createInvoiceItems(invoiceId: string, items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRateId: string | null;
    taxAmount: number;
    sortOrder: number;
  }>): Promise<InvoiceItemRecord[]> {
    // Replace with:
    // return Promise.all(items.map(item =>
    //   db.invoiceItem.create({ data: { invoiceId, ...item } })
    // ));
    console.log('[DB] Creating invoice items for invoice:', invoiceId, 'count:', items.length);
    return items.map((item, index) => ({
      id: 'item_' + Date.now() + '_' + index,
      invoiceId,
      ...item,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  },

  async findInvoiceById(id: string): Promise<InvoiceRecord | null> {
    // Replace with: return db.invoice.findUnique({ where: { id }, include: { client: true, items: { orderBy: { sortOrder: 'asc' } }, payments: true, activities: { orderBy: { createdAt: 'desc' } } } });
    console.log('[DB] Finding invoice by ID:', id);
    return null;
  },

  async findInvoices(userId: string, filters: InvoiceFilters): Promise<{ items: InvoiceRecord[]; total: number }> {
    // Replace with:
    // const where = {
    //   userId,
    //   status: filters.status || undefined,
    //   clientId: filters.clientId || undefined,
    //   issueDate: {
    //     gte: filters.dateFrom || undefined,
    //     lte: filters.dateTo || undefined,
    //   },
    //   OR: filters.search ? [
    //     { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
    //     { client: { name: { contains: filters.search, mode: 'insensitive' } } },
    //   ] : undefined,
    // };
    // const [items, total] = await Promise.all([
    //   db.invoice.findMany({ where, skip: ((filters.page || 1) - 1) * (filters.limit || 20), take: filters.limit || 20, include: { client: true }, orderBy: { createdAt: 'desc' } }),
    //   db.invoice.count({ where }),
    // ]);
    console.log('[DB] Finding invoices for user:', userId, filters);
    return { items: [], total: 0 };
  },

  async updateInvoice(id: string, data: Partial<InvoiceRecord>): Promise<InvoiceRecord | null> {
    // Replace with: return db.invoice.update({ where: { id }, data: { ...data, updatedAt: new Date() }, include: { client: true, items: true } });
    console.log('[DB] Updating invoice:', id);
    return null;
  },

  async deleteInvoice(id: string): Promise<void> {
    // Replace with:
    // await db.invoiceItem.deleteMany({ where: { invoiceId: id } });
    // await db.invoiceActivity.deleteMany({ where: { invoiceId: id } });
    // await db.invoicePayment.deleteMany({ where: { invoiceId: id } });
    // await db.invoice.delete({ where: { id } });
    console.log('[DB] Deleting invoice:', id);
  },

  async getInvoiceItems(invoiceId: string): Promise<InvoiceItemRecord[]> {
    // Replace with: return db.invoiceItem.findMany({ where: { invoiceId }, orderBy: { sortOrder: 'asc' } });
    console.log('[DB] Getting items for invoice:', invoiceId);
    return [];
  },

  async createActivity(data: {
    invoiceId: string;
    action: string;
    description: string;
  }): Promise<ActivityRecord> {
    // Replace with: return db.invoiceActivity.create({ data });
    console.log('[DB] Creating activity:', data.action, 'for invoice:', data.invoiceId);
    return {
      id: 'activity_' + Date.now(),
      ...data,
      createdAt: new Date(),
    };
  },

  async checkInvoiceBelongsToUser(invoiceId: string, userId: string): Promise<boolean> {
    // Replace with: return !!(await db.invoice.findFirst({ where: { id: invoiceId, userId } }));
    console.log('[DB] Checking invoice ownership:', invoiceId, userId);
    return false;
  },

  async getInvoiceStats(userId: string): Promise<InvoiceStats> {
    // Replace with:
    // const now = new Date();
    // const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    // const today = now.toISOString().split('T')[0];
    // const [totalClients, totalInvoices, revenueResult, outstandingResult, overdueCount, overdueAmountResult, paidThisMonth, sentThisMonth] = await Promise.all([
    //   db.invoicingClient.count({ where: { userId } }),
    //   db.invoice.count({ where: { userId } }),
    //   db.invoice.aggregate({ where: { userId, status: 'PAID' }, _sum: { totalAmount: true } }),
    //   db.invoice.aggregate({ where: { userId, status: { in: ['SENT', 'PARTIALLY_PAID'] } }, _sum: { amountDue: true } }),
    //   db.invoice.count({ where: { userId, status: { in: ['SENT', 'PARTIALLY_PAID'] }, dueDate: { lt: today } } }),
    //   db.invoice.aggregate({ where: { userId, status: { in: ['SENT', 'PARTIALLY_PAID'] }, dueDate: { lt: today } }, _sum: { amountDue: true } }),
    //   db.invoice.count({ where: { userId, status: 'PAID', paidAt: { gte: new Date(monthStart) } } }),
    //   db.invoice.count({ where: { userId, status: { in: ['SENT', 'PAID', 'PARTIALLY_PAID'] }, sentAt: { gte: new Date(monthStart) } } }),
    // ]);
    console.log('[DB] Getting invoice stats for user:', userId);
    return {
      totalClients: 0,
      totalInvoices: 0,
      totalRevenue: 0,
      totalOutstanding: 0,
      overdueCount: 0,
      overdueAmount: 0,
      paidThisMonth: 0,
      sentThisMonth: 0,
    };
  },
};

// =============================================================================
// Invoice Service
// =============================================================================

export class InvoiceService {
  /**
   * Generate the next invoice number using user's settings prefix + auto-increment.
   * Default prefix is "INV-", default start number is 1001.
   */
  async generateInvoiceNumber(userId: string): Promise<string> {
    let settings = await dbOperations.getInvoiceSettings(userId);

    if (!settings) {
      settings = await dbOperations.upsertInvoiceSettings(userId, {
        invoicePrefix: 'INV-',
        nextInvoiceNumber: 1001,
      });
    }

    const invoiceNumber = `${settings.invoicePrefix}${settings.nextInvoiceNumber.toString().padStart(4, '0')}`;

    await dbOperations.incrementNextInvoiceNumber(userId);

    return invoiceNumber;
  }

  /**
   * Recalculate invoice totals from line items.
   * subtotal = sum of item totalPrice values
   * taxAmount = sum of item taxAmount values
   * totalAmount = subtotal + taxAmount - discountAmount
   * amountDue = totalAmount - amountPaid
   */
  private async recalculateTotals(invoiceId: string, discountAmount: number, amountPaid: number): Promise<{
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    amountDue: number;
  }> {
    const items = await dbOperations.getInvoiceItems(invoiceId);

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + taxAmount - discountAmount;
    const amountDue = totalAmount - amountPaid;

    return { subtotal, taxAmount, totalAmount, amountDue };
  }

  /**
   * Calculate line item totals including tax
   */
  private async calculateItemTotals(items: InvoiceItemInput[]): Promise<Array<{
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
   * Create a new invoice with line items.
   * Generates invoice number, calculates totals, and creates activity record.
   */
  async create(input: InvoiceCreateInput): Promise<InvoiceRecord> {
    if (!input.items || input.items.length === 0) {
      throw new Error('Invoice must have at least one line item');
    }

    const invoiceNumber = await this.generateInvoiceNumber(input.userId);

    // Calculate item totals
    const calculatedItems = await this.calculateItemTotals(input.items);

    const subtotal = calculatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = calculatedItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const discountAmount = input.discountAmount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    const invoice = await dbOperations.createInvoice({
      userId: input.userId,
      clientId: input.clientId,
      invoiceNumber,
      status: 'DRAFT',
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      currency: input.currency || 'USD',
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      amountPaid: 0,
      amountDue: totalAmount,
      notes: input.notes || null,
      terms: input.terms || null,
    });

    await dbOperations.createInvoiceItems(invoice.id, calculatedItems);

    await dbOperations.createActivity({
      invoiceId: invoice.id,
      action: 'CREATED',
      description: `Invoice ${invoiceNumber} created`,
    });

    return invoice;
  }

  /**
   * Update invoice metadata (not items). Only DRAFT invoices can be updated.
   */
  async update(id: string, userId: string, input: InvoiceUpdateInput): Promise<InvoiceRecord | null> {
    const belongs = await dbOperations.checkInvoiceBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Invoice not found');
    }

    const invoice = await dbOperations.findInvoiceById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new Error('Only draft invoices can be edited');
    }

    // If discount changed, recalculate totals
    const updateData: Partial<InvoiceRecord> = { ...input } as Partial<InvoiceRecord>;

    if (input.discountAmount !== undefined) {
      const totals = await this.recalculateTotals(id, input.discountAmount, invoice.amountPaid);
      Object.assign(updateData, totals);
    }

    return dbOperations.updateInvoice(id, updateData);
  }

  /**
   * Delete an invoice. Only DRAFT and VOID invoices can be deleted.
   */
  async delete(id: string, userId: string): Promise<void> {
    const belongs = await dbOperations.checkInvoiceBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Invoice not found');
    }

    const invoice = await dbOperations.findInvoiceById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'DRAFT' && invoice.status !== 'VOID') {
      throw new Error('Only draft or void invoices can be deleted');
    }

    return dbOperations.deleteInvoice(id);
  }

  /**
   * Get a single invoice by ID with ownership check
   */
  async getById(id: string, userId: string): Promise<InvoiceRecord | null> {
    const belongs = await dbOperations.checkInvoiceBelongsToUser(id, userId);
    if (!belongs) {
      return null;
    }

    return dbOperations.findInvoiceById(id);
  }

  /**
   * List invoices with filtering and pagination
   */
  async list(userId: string, filters: InvoiceFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await dbOperations.findInvoices(userId, {
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
   * Send an invoice. Changes status from DRAFT to SENT, records sentAt and activity.
   */
  async send(id: string, userId: string): Promise<InvoiceRecord | null> {
    const belongs = await dbOperations.checkInvoiceBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Invoice not found');
    }

    const invoice = await dbOperations.findInvoiceById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new Error('Only draft invoices can be sent');
    }

    const updated = await dbOperations.updateInvoice(id, {
      status: 'SENT',
      sentAt: new Date(),
    } as Partial<InvoiceRecord>);

    await dbOperations.createActivity({
      invoiceId: id,
      action: 'SENT',
      description: `Invoice ${invoice.invoiceNumber} sent to client`,
    });

    return updated;
  }

  /**
   * Void an invoice. Records activity. Cannot void already paid invoices.
   */
  async void(id: string, userId: string): Promise<InvoiceRecord | null> {
    const belongs = await dbOperations.checkInvoiceBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Invoice not found');
    }

    const invoice = await dbOperations.findInvoiceById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'VOID') {
      throw new Error('Invoice is already void');
    }

    if (invoice.status === 'PAID') {
      throw new Error('Cannot void a paid invoice');
    }

    const updated = await dbOperations.updateInvoice(id, {
      status: 'VOID',
    } as Partial<InvoiceRecord>);

    await dbOperations.createActivity({
      invoiceId: id,
      action: 'VOIDED',
      description: `Invoice ${invoice.invoiceNumber} voided`,
    });

    return updated;
  }

  /**
   * Duplicate an invoice. Creates a new DRAFT copy with a new invoice number,
   * reset payment amounts, and current date as issue date.
   */
  async duplicate(id: string, userId: string): Promise<InvoiceRecord> {
    const belongs = await dbOperations.checkInvoiceBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Invoice not found');
    }

    const original = await dbOperations.findInvoiceById(id);
    if (!original) {
      throw new Error('Invoice not found');
    }

    const items = await dbOperations.getInvoiceItems(id);
    const invoiceNumber = await this.generateInvoiceNumber(userId);
    const today = new Date().toISOString().split('T')[0];

    const newInvoice = await dbOperations.createInvoice({
      userId: original.userId,
      clientId: original.clientId,
      invoiceNumber,
      status: 'DRAFT',
      issueDate: today,
      dueDate: original.dueDate,
      currency: original.currency,
      subtotal: original.subtotal,
      taxAmount: original.taxAmount,
      discountAmount: original.discountAmount,
      totalAmount: original.totalAmount,
      amountPaid: 0,
      amountDue: original.totalAmount,
      notes: original.notes,
      terms: original.terms,
    });

    if (items.length > 0) {
      await dbOperations.createInvoiceItems(
        newInvoice.id,
        items.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          taxRateId: item.taxRateId,
          taxAmount: item.taxAmount,
          sortOrder: index,
        })),
      );
    }

    await dbOperations.createActivity({
      invoiceId: newInvoice.id,
      action: 'CREATED',
      description: `Invoice ${invoiceNumber} created (duplicated from ${original.invoiceNumber})`,
    });

    return newInvoice;
  }

  /**
   * Get aggregate invoice statistics for the dashboard
   */
  async getStats(userId: string): Promise<InvoiceStats> {
    return dbOperations.getInvoiceStats(userId);
  }
}

// =============================================================================
// Factory
// =============================================================================

let invoiceServiceInstance: InvoiceService | null = null;

export function getInvoiceService(): InvoiceService {
  if (!invoiceServiceInstance) {
    invoiceServiceInstance = new InvoiceService();
  }
  return invoiceServiceInstance;
}

export default InvoiceService;
