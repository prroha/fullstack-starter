// =============================================================================
// Invoice Item Service
// =============================================================================
// Business logic for invoice line item CRUD and reordering.
// After each mutation, triggers invoice total recalculation.
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

export interface InvoiceItemUpdateInput {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  taxRateId?: string;
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

interface InvoiceRecord {
  id: string;
  userId: string;
  status: string;
  discountAmount: number;
  amountPaid: number;
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
  async findInvoice(invoiceId: string): Promise<InvoiceRecord | null> {
    // Replace with: return db.invoice.findUnique({ where: { id: invoiceId }, select: { id: true, userId: true, status: true, discountAmount: true, amountPaid: true } });
    console.log('[DB] Finding invoice:', invoiceId);
    return null;
  },

  async findTaxRate(id: string): Promise<TaxRateRecord | null> {
    // Replace with: return db.taxRate.findUnique({ where: { id }, select: { id: true, rate: true } });
    console.log('[DB] Finding tax rate:', id);
    return null;
  },

  async getMaxSortOrder(invoiceId: string): Promise<number> {
    // Replace with:
    // const result = await db.invoiceItem.aggregate({ where: { invoiceId }, _max: { sortOrder: true } });
    // return result._max.sortOrder ?? -1;
    console.log('[DB] Getting max sort order for invoice:', invoiceId);
    return -1;
  },

  async createItem(data: {
    invoiceId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRateId: string | null;
    taxAmount: number;
    sortOrder: number;
  }): Promise<InvoiceItemRecord> {
    // Replace with: return db.invoiceItem.create({ data });
    console.log('[DB] Creating invoice item for invoice:', data.invoiceId);
    return {
      id: 'item_' + Date.now(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async findItemById(id: string): Promise<InvoiceItemRecord | null> {
    // Replace with: return db.invoiceItem.findUnique({ where: { id } });
    console.log('[DB] Finding invoice item by ID:', id);
    return null;
  },

  async updateItem(id: string, data: Partial<InvoiceItemRecord>): Promise<InvoiceItemRecord | null> {
    // Replace with: return db.invoiceItem.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
    console.log('[DB] Updating invoice item:', id);
    return null;
  },

  async deleteItem(id: string): Promise<void> {
    // Replace with: await db.invoiceItem.delete({ where: { id } });
    console.log('[DB] Deleting invoice item:', id);
  },

  async getInvoiceItems(invoiceId: string): Promise<InvoiceItemRecord[]> {
    // Replace with: return db.invoiceItem.findMany({ where: { invoiceId }, orderBy: { sortOrder: 'asc' } });
    console.log('[DB] Getting items for invoice:', invoiceId);
    return [];
  },

  async updateItemSortOrder(id: string, sortOrder: number): Promise<void> {
    // Replace with: await db.invoiceItem.update({ where: { id }, data: { sortOrder, updatedAt: new Date() } });
    console.log('[DB] Updating sort order for item:', id, 'to:', sortOrder);
  },

  async updateInvoiceTotals(invoiceId: string, data: {
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    amountDue: number;
  }): Promise<void> {
    // Replace with: await db.invoice.update({ where: { id: invoiceId }, data: { ...data, updatedAt: new Date() } });
    console.log('[DB] Updating invoice totals:', invoiceId, data);
  },
};

// =============================================================================
// Invoice Item Service
// =============================================================================

export class InvoiceItemService {
  /**
   * Recalculate and update invoice totals after item changes.
   * subtotal = sum of item totalPrice values
   * taxAmount = sum of item taxAmount values
   * totalAmount = subtotal + taxAmount - discountAmount
   * amountDue = totalAmount - amountPaid
   */
  private async recalculateInvoiceTotals(invoiceId: string): Promise<void> {
    const invoice = await dbOperations.findInvoice(invoiceId);
    if (!invoice) return;

    const items = await dbOperations.getInvoiceItems(invoiceId);

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + taxAmount - invoice.discountAmount;
    const amountDue = totalAmount - invoice.amountPaid;

    await dbOperations.updateInvoiceTotals(invoiceId, {
      subtotal,
      taxAmount,
      totalAmount,
      amountDue,
    });
  }

  /**
   * Calculate tax amount for a line item
   */
  private async calculateTaxAmount(totalPrice: number, taxRateId: string | null): Promise<number> {
    if (!taxRateId) return 0;

    const taxRate = await dbOperations.findTaxRate(taxRateId);
    if (!taxRate) return 0;

    return Math.round(totalPrice * (taxRate.rate / 100));
  }

  /**
   * Add a new line item to an invoice. Only DRAFT invoices can be modified.
   * Automatically calculates totalPrice and taxAmount, then recalculates invoice totals.
   */
  async add(invoiceId: string, userId: string, input: InvoiceItemInput): Promise<InvoiceItemRecord> {
    const invoice = await dbOperations.findInvoice(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.userId !== userId) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new Error('Only draft invoices can be modified');
    }

    if (input.quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }

    if (input.unitPrice < 0) {
      throw new Error('Unit price cannot be negative');
    }

    const totalPrice = input.quantity * input.unitPrice;
    const taxAmount = await this.calculateTaxAmount(totalPrice, input.taxRateId || null);
    const maxSortOrder = await dbOperations.getMaxSortOrder(invoiceId);

    const item = await dbOperations.createItem({
      invoiceId,
      description: input.description,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      totalPrice,
      taxRateId: input.taxRateId || null,
      taxAmount,
      sortOrder: maxSortOrder + 1,
    });

    await this.recalculateInvoiceTotals(invoiceId);

    return item;
  }

  /**
   * Update an existing line item. Only DRAFT invoices can be modified.
   * Recalculates totalPrice, taxAmount, and invoice totals.
   */
  async update(itemId: string, userId: string, input: InvoiceItemUpdateInput): Promise<InvoiceItemRecord | null> {
    const item = await dbOperations.findItemById(itemId);
    if (!item) {
      throw new Error('Invoice item not found');
    }

    const invoice = await dbOperations.findInvoice(item.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.userId !== userId) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new Error('Only draft invoices can be modified');
    }

    const quantity = input.quantity !== undefined ? input.quantity : item.quantity;
    const unitPrice = input.unitPrice !== undefined ? input.unitPrice : item.unitPrice;
    const taxRateId = input.taxRateId !== undefined ? input.taxRateId || null : item.taxRateId;

    if (quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }

    if (unitPrice < 0) {
      throw new Error('Unit price cannot be negative');
    }

    const totalPrice = quantity * unitPrice;
    const taxAmount = await this.calculateTaxAmount(totalPrice, taxRateId);

    const updated = await dbOperations.updateItem(itemId, {
      description: input.description !== undefined ? input.description : item.description,
      quantity,
      unitPrice,
      totalPrice,
      taxRateId,
      taxAmount,
    } as Partial<InvoiceItemRecord>);

    await this.recalculateInvoiceTotals(item.invoiceId);

    return updated;
  }

  /**
   * Delete a line item from an invoice. Only DRAFT invoices can be modified.
   * Recalculates invoice totals after deletion.
   */
  async delete(itemId: string, userId: string): Promise<void> {
    const item = await dbOperations.findItemById(itemId);
    if (!item) {
      throw new Error('Invoice item not found');
    }

    const invoice = await dbOperations.findInvoice(item.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.userId !== userId) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new Error('Only draft invoices can be modified');
    }

    await dbOperations.deleteItem(itemId);
    await this.recalculateInvoiceTotals(item.invoiceId);
  }

  /**
   * Reorder line items. Accepts an array of item IDs in the desired order.
   * Updates the sortOrder field for each item.
   */
  async reorder(invoiceId: string, userId: string, itemIds: string[]): Promise<void> {
    const invoice = await dbOperations.findInvoice(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.userId !== userId) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new Error('Only draft invoices can be modified');
    }

    // Validate all item IDs belong to this invoice
    const existingItems = await dbOperations.getInvoiceItems(invoiceId);
    const existingIds = new Set(existingItems.map((item) => item.id));

    for (const itemId of itemIds) {
      if (!existingIds.has(itemId)) {
        throw new Error(`Item ${itemId} does not belong to this invoice`);
      }
    }

    // Update sort order for each item
    for (let i = 0; i < itemIds.length; i++) {
      await dbOperations.updateItemSortOrder(itemIds[i], i);
    }
  }
}

// =============================================================================
// Factory
// =============================================================================

let invoiceItemServiceInstance: InvoiceItemService | null = null;

export function getInvoiceItemService(): InvoiceItemService {
  if (!invoiceItemServiceInstance) {
    invoiceItemServiceInstance = new InvoiceItemService();
  }
  return invoiceItemServiceInstance;
}

export default InvoiceItemService;
