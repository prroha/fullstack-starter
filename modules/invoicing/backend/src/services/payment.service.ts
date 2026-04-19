// =============================================================================
// Invoice Payment Service
// =============================================================================
// Business logic for recording and managing invoice payments.
// Tracks payment amounts, updates invoice status, and records activity.
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface PaymentRecordInput {
  invoiceId: string;
  amount: number;
  method: string;
  reference?: string;
  paidAt?: string;
  notes?: string;
}

// =============================================================================
// Payment Service
// =============================================================================

export class PaymentService {
  constructor(private db: PrismaClient) {}

  /**
   * Determine invoice status based on payment amounts.
   * PAID: amountPaid >= totalAmount
   * PARTIALLY_PAID: amountPaid > 0 but < totalAmount
   * Otherwise keep current status (SENT, etc.)
   */
  private determineStatus(totalAmount: number, amountPaid: number, currentStatus: string): string {
    if (amountPaid >= totalAmount) {
      return 'PAID';
    }
    if (amountPaid > 0) {
      return 'PARTIALLY_PAID';
    }
    // If all payments removed, revert to SENT (not DRAFT)
    if (currentStatus === 'PARTIALLY_PAID' || currentStatus === 'PAID') {
      return 'SENT';
    }
    return currentStatus;
  }

  /**
   * Format amount in cents as a display string (e.g., 15000 -> "$150.00")
   */
  private formatAmount(amountInCents: number): string {
    return `$${(amountInCents / 100).toFixed(2)}`;
  }

  /**
   * Record a payment against an invoice.
   * Updates amountPaid, amountDue, and status. Records activity.
   * Cannot record payments on DRAFT or VOID invoices.
   */
  async record(userId: string, input: PaymentRecordInput) {
    const invoice = await this.db.invoice.findFirst({
      where: { id: input.invoiceId, userId },
    });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'DRAFT') {
      throw new Error('Cannot record payment on a draft invoice. Send it first.');
    }

    if (invoice.status === 'VOID') {
      throw new Error('Cannot record payment on a void invoice');
    }

    if (input.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const payment = await this.db.invoicePayment.create({
      data: {
        invoiceId: input.invoiceId,
        amount: input.amount,
        method: input.method as 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CASH' | 'CHECK' | 'OTHER',
        reference: input.reference || null,
        paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
      },
    });

    // Recalculate payment totals
    const newAmountPaid = invoice.amountPaid + input.amount;
    const newAmountDue = invoice.totalAmount - newAmountPaid;
    const newStatus = this.determineStatus(invoice.totalAmount, newAmountPaid, invoice.status);

    await this.db.invoice.update({
      where: { id: input.invoiceId },
      data: {
        amountPaid: newAmountPaid,
        amountDue: Math.max(0, newAmountDue),
        status: newStatus as 'PAID' | 'PARTIALLY_PAID' | 'SENT',
      },
    });

    await this.db.invoiceActivity.create({
      data: {
        invoiceId: input.invoiceId,
        action: 'payment_recorded',
        details: `Payment of ${this.formatAmount(input.amount)} recorded via ${input.method}`,
      },
    });

    return payment;
  }

  /**
   * Delete a payment. Reverses the payment amount and recalculates invoice status.
   * Records activity for the reversal.
   */
  async delete(paymentId: string, userId: string): Promise<void> {
    const payment = await this.db.invoicePayment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new Error('Payment not found');
    }

    const invoice = await this.db.invoice.findFirst({
      where: { id: payment.invoiceId, userId },
    });
    if (!invoice) {
      throw new Error('Payment not found');
    }

    await this.db.invoicePayment.delete({ where: { id: paymentId } });

    // Recalculate from remaining payments
    const result = await this.db.invoicePayment.aggregate({
      where: { invoiceId: payment.invoiceId },
      _sum: { amount: true },
    });
    const remainingTotal = result._sum.amount ?? 0;
    const newAmountDue = invoice.totalAmount - remainingTotal;
    const newStatus = this.determineStatus(invoice.totalAmount, remainingTotal, invoice.status);

    await this.db.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        amountPaid: remainingTotal,
        amountDue: Math.max(0, newAmountDue),
        status: newStatus as 'PAID' | 'PARTIALLY_PAID' | 'SENT',
      },
    });

    await this.db.invoiceActivity.create({
      data: {
        invoiceId: payment.invoiceId,
        action: 'payment_deleted',
        details: `Payment of ${this.formatAmount(payment.amount)} reversed`,
      },
    });
  }

  /**
   * List all payments for an invoice with ownership check
   */
  async list(invoiceId: string, userId: string) {
    const invoice = await this.db.invoice.findFirst({ where: { id: invoiceId, userId } });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return this.db.invoicePayment.findMany({
      where: { invoiceId },
      orderBy: { paidAt: 'desc' },
    });
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createPaymentService(db: PrismaClient): PaymentService {
  return new PaymentService(db);
}

let instance: PaymentService | null = null;
export function getPaymentService(db?: PrismaClient): PaymentService {
  if (db) return createPaymentService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new PaymentService(globalDb);
  }
  return instance;
}

export default PaymentService;
