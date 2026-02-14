// =============================================================================
// Invoice Payment Service
// =============================================================================
// Business logic for recording and managing invoice payments.
// Tracks payment amounts, updates invoice status, and records activity.
// Uses placeholder db operations - replace with actual Prisma client.

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

interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  reference: string | null;
  paidAt: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface InvoiceRecord {
  id: string;
  userId: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
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
  async findInvoice(invoiceId: string): Promise<InvoiceRecord | null> {
    // Replace with: return db.invoice.findUnique({ where: { id: invoiceId }, select: { id: true, userId: true, invoiceNumber: true, status: true, totalAmount: true, amountPaid: true, amountDue: true } });
    console.log('[DB] Finding invoice:', invoiceId);
    return null;
  },

  async createPayment(data: {
    invoiceId: string;
    amount: number;
    method: string;
    reference: string | null;
    paidAt: Date;
    notes: string | null;
  }): Promise<PaymentRecord> {
    // Replace with: return db.invoicePayment.create({ data });
    console.log('[DB] Creating payment for invoice:', data.invoiceId, 'amount:', data.amount);
    return {
      id: 'payment_' + Date.now(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async findPaymentById(id: string): Promise<PaymentRecord | null> {
    // Replace with: return db.invoicePayment.findUnique({ where: { id } });
    console.log('[DB] Finding payment by ID:', id);
    return null;
  },

  async deletePayment(id: string): Promise<void> {
    // Replace with: await db.invoicePayment.delete({ where: { id } });
    console.log('[DB] Deleting payment:', id);
  },

  async findPaymentsByInvoice(invoiceId: string): Promise<PaymentRecord[]> {
    // Replace with: return db.invoicePayment.findMany({ where: { invoiceId }, orderBy: { paidAt: 'desc' } });
    console.log('[DB] Finding payments for invoice:', invoiceId);
    return [];
  },

  async updateInvoicePaymentStatus(invoiceId: string, data: {
    amountPaid: number;
    amountDue: number;
    status: string;
    paidAt: Date | null;
  }): Promise<void> {
    // Replace with: await db.invoice.update({ where: { id: invoiceId }, data: { ...data, updatedAt: new Date() } });
    console.log('[DB] Updating invoice payment status:', invoiceId, data);
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

  async getTotalPayments(invoiceId: string): Promise<number> {
    // Replace with:
    // const result = await db.invoicePayment.aggregate({ where: { invoiceId }, _sum: { amount: true } });
    // return result._sum.amount ?? 0;
    console.log('[DB] Getting total payments for invoice:', invoiceId);
    return 0;
  },
};

// =============================================================================
// Payment Service
// =============================================================================

export class PaymentService {
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
  async record(userId: string, input: PaymentRecordInput): Promise<PaymentRecord> {
    const belongs = await dbOperations.checkInvoiceBelongsToUser(input.invoiceId, userId);
    if (!belongs) {
      throw new Error('Invoice not found');
    }

    const invoice = await dbOperations.findInvoice(input.invoiceId);
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

    const payment = await dbOperations.createPayment({
      invoiceId: input.invoiceId,
      amount: input.amount,
      method: input.method,
      reference: input.reference || null,
      paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
      notes: input.notes || null,
    });

    // Recalculate payment totals
    const newAmountPaid = invoice.amountPaid + input.amount;
    const newAmountDue = invoice.totalAmount - newAmountPaid;
    const newStatus = this.determineStatus(invoice.totalAmount, newAmountPaid, invoice.status);

    await dbOperations.updateInvoicePaymentStatus(input.invoiceId, {
      amountPaid: newAmountPaid,
      amountDue: Math.max(0, newAmountDue),
      status: newStatus,
      paidAt: newStatus === 'PAID' ? new Date() : null,
    });

    await dbOperations.createActivity({
      invoiceId: input.invoiceId,
      action: 'PAYMENT_RECORDED',
      description: `Payment of ${this.formatAmount(input.amount)} recorded via ${input.method}`,
    });

    return payment;
  }

  /**
   * Delete a payment. Reverses the payment amount and recalculates invoice status.
   * Records activity for the reversal.
   */
  async delete(paymentId: string, userId: string): Promise<void> {
    const payment = await dbOperations.findPaymentById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const belongs = await dbOperations.checkInvoiceBelongsToUser(payment.invoiceId, userId);
    if (!belongs) {
      throw new Error('Payment not found');
    }

    const invoice = await dbOperations.findInvoice(payment.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    await dbOperations.deletePayment(paymentId);

    // Recalculate from remaining payments
    const remainingTotal = await dbOperations.getTotalPayments(payment.invoiceId);
    const newAmountDue = invoice.totalAmount - remainingTotal;
    const newStatus = this.determineStatus(invoice.totalAmount, remainingTotal, invoice.status);

    await dbOperations.updateInvoicePaymentStatus(payment.invoiceId, {
      amountPaid: remainingTotal,
      amountDue: Math.max(0, newAmountDue),
      status: newStatus,
      paidAt: newStatus === 'PAID' ? new Date() : null,
    });

    await dbOperations.createActivity({
      invoiceId: payment.invoiceId,
      action: 'PAYMENT_DELETED',
      description: `Payment of ${this.formatAmount(payment.amount)} reversed`,
    });
  }

  /**
   * List all payments for an invoice with ownership check
   */
  async list(invoiceId: string, userId: string): Promise<PaymentRecord[]> {
    const belongs = await dbOperations.checkInvoiceBelongsToUser(invoiceId, userId);
    if (!belongs) {
      throw new Error('Invoice not found');
    }

    return dbOperations.findPaymentsByInvoice(invoiceId);
  }
}

// =============================================================================
// Factory
// =============================================================================

let paymentServiceInstance: PaymentService | null = null;

export function getPaymentService(): PaymentService {
  if (!paymentServiceInstance) {
    paymentServiceInstance = new PaymentService();
  }
  return paymentServiceInstance;
}

export default PaymentService;
