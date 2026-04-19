// =============================================================================
// Invoice Item Service
// =============================================================================
// Business logic for invoice line item CRUD and reordering.
// After each mutation, triggers invoice total recalculation.
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

export interface InvoiceItemUpdateInput {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  taxRateId?: string;
}

// =============================================================================
// Invoice Item Service
// =============================================================================

export class InvoiceItemService {
  constructor(private db: PrismaClient) {}

  /**
   * Recalculate and update invoice totals after item changes.
   * subtotal = sum of item totalPrice values
   * taxTotal = sum of per-item tax (computed from linked taxRate)
   * totalAmount = subtotal + taxTotal - discountAmount
   * amountDue = totalAmount - amountPaid
   */
  private async recalculateInvoiceTotals(invoiceId: string): Promise<void> {
    const invoice = await this.db.invoice.findUnique({
      where: { id: invoiceId },
      select: { discountAmount: true, amountPaid: true },
    });
    if (!invoice) return;

    const items = await this.db.invoiceItem.findMany({
      where: { invoiceId },
      include: { taxRate: true },
    });

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxTotal = items.reduce((sum, item) => {
      if (item.taxRate) {
        return sum + Math.round(item.totalPrice * (item.taxRate.rate / 100));
      }
      return sum;
    }, 0);
    const totalAmount = subtotal + taxTotal - invoice.discountAmount;
    const amountDue = totalAmount - invoice.amountPaid;

    await this.db.invoice.update({
      where: { id: invoiceId },
      data: { subtotal, taxTotal, totalAmount, amountDue },
    });
  }

  /**
   * Calculate tax amount for a line item
   */
  private async calculateTaxAmount(totalPrice: number, taxRateId: string | null): Promise<number> {
    if (!taxRateId) return 0;

    const taxRate = await this.db.taxRate.findUnique({
      where: { id: taxRateId },
      select: { rate: true },
    });
    if (!taxRate) return 0;

    return Math.round(totalPrice * (taxRate.rate / 100));
  }

  /**
   * Add a new line item to an invoice. Only DRAFT invoices can be modified.
   * Automatically calculates totalPrice, then recalculates invoice totals.
   */
  async add(invoiceId: string, userId: string, input: InvoiceItemInput) {
    const invoice = await this.db.invoice.findFirst({
      where: { id: invoiceId, userId },
    });
    if (!invoice) {
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

    const totalPrice = Math.round(input.quantity * input.unitPrice);

    // Get max sort order
    const maxResult = await this.db.invoiceItem.aggregate({
      where: { invoiceId },
      _max: { sortOrder: true },
    });
    const maxSortOrder = maxResult._max.sortOrder ?? -1;

    const item = await this.db.invoiceItem.create({
      data: {
        invoiceId,
        description: input.description,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        totalPrice,
        taxRateId: input.taxRateId || null,
        sortOrder: maxSortOrder + 1,
      },
    });

    await this.recalculateInvoiceTotals(invoiceId);

    return item;
  }

  /**
   * Update an existing line item. Only DRAFT invoices can be modified.
   * Recalculates totalPrice and invoice totals.
   */
  async update(itemId: string, userId: string, input: InvoiceItemUpdateInput) {
    const item = await this.db.invoiceItem.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new Error('Invoice item not found');
    }

    const invoice = await this.db.invoice.findFirst({
      where: { id: item.invoiceId, userId },
    });
    if (!invoice) {
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

    const totalPrice = Math.round(quantity * unitPrice);

    const updated = await this.db.invoiceItem.update({
      where: { id: itemId },
      data: {
        description: input.description !== undefined ? input.description : item.description,
        quantity,
        unitPrice,
        totalPrice,
        taxRateId,
      },
    });

    await this.recalculateInvoiceTotals(item.invoiceId);

    return updated;
  }

  /**
   * Delete a line item from an invoice. Only DRAFT invoices can be modified.
   * Recalculates invoice totals after deletion.
   */
  async delete(itemId: string, userId: string): Promise<void> {
    const item = await this.db.invoiceItem.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new Error('Invoice item not found');
    }

    const invoice = await this.db.invoice.findFirst({
      where: { id: item.invoiceId, userId },
    });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new Error('Only draft invoices can be modified');
    }

    await this.db.invoiceItem.delete({ where: { id: itemId } });
    await this.recalculateInvoiceTotals(item.invoiceId);
  }

  /**
   * Reorder line items. Accepts an array of item IDs in the desired order.
   * Updates the sortOrder field for each item.
   */
  async reorder(invoiceId: string, userId: string, itemIds: string[]): Promise<void> {
    const invoice = await this.db.invoice.findFirst({
      where: { id: invoiceId, userId },
    });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new Error('Only draft invoices can be modified');
    }

    // Validate all item IDs belong to this invoice
    const existingItems = await this.db.invoiceItem.findMany({
      where: { invoiceId },
      select: { id: true },
    });
    const existingIds = new Set(existingItems.map((item) => item.id));

    for (const itemId of itemIds) {
      if (!existingIds.has(itemId)) {
        throw new Error(`Item ${itemId} does not belong to this invoice`);
      }
    }

    // Update sort order for each item
    await Promise.all(
      itemIds.map((id, i) =>
        this.db.invoiceItem.update({ where: { id }, data: { sortOrder: i } })
      )
    );
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createInvoiceItemService(db: PrismaClient): InvoiceItemService {
  return new InvoiceItemService(db);
}

let instance: InvoiceItemService | null = null;
export function getInvoiceItemService(db?: PrismaClient): InvoiceItemService {
  if (db) return createInvoiceItemService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new InvoiceItemService(globalDb);
  }
  return instance;
}

export default InvoiceItemService;
