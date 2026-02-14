// =============================================================================
// Invoicing TypeScript Interfaces
// =============================================================================

// --- Enums ---

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'VOID';
export type PaymentMethod = 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CASH' | 'CHECK' | 'OTHER';
export type RecurringFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type RecurringStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

// --- Address ---

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// --- Client ---

export interface InvoicingClient {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  taxId: string | null;
  billingAddress: Address | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  invoiceCount?: number;
  totalBilled?: number;
  totalPaid?: number;
}

export interface ClientCreateInput {
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  taxId?: string;
  billingAddress?: Address;
  notes?: string;
}

export interface ClientUpdateInput extends Partial<ClientCreateInput> {}

// --- Tax Rate ---

export interface TaxRate {
  id: string;
  userId: string;
  name: string;
  rate: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaxRateCreateInput {
  name: string;
  rate: number;
  isDefault?: boolean;
}

export interface TaxRateUpdateInput extends Partial<TaxRateCreateInput> {}

// --- Invoice ---

export interface Invoice {
  id: string;
  userId: string;
  clientId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxTotal: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  notes: string | null;
  terms: string | null;
  createdAt: string;
  updatedAt: string;
  client?: InvoicingClient;
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
  activities?: InvoiceActivity[];
}

export interface InvoiceCreateInput {
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
  search?: string;
  status?: InvoiceStatus;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// --- Invoice Item ---

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRateId: string | null;
  sortOrder: number;
  taxRate?: TaxRate;
}

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRateId?: string;
}

export interface InvoiceItemUpdateInput extends Partial<InvoiceItemInput> {}

// --- Invoice Payment ---

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  paidAt: string;
  createdAt: string;
}

export interface PaymentCreateInput {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paidAt: string;
}

// --- Recurring Invoice ---

export interface RecurringInvoice {
  id: string;
  userId: string;
  clientId: string;
  frequency: RecurringFrequency;
  status: RecurringStatus;
  startDate: string;
  endDate: string | null;
  nextIssueDate: string;
  templateItems: InvoiceItemInput[];
  currency: string;
  notes: string | null;
  terms: string | null;
  occurrences: number;
  maxOccurrences: number | null;
  createdAt: string;
  updatedAt: string;
  client?: InvoicingClient;
}

export interface RecurringCreateInput {
  clientId: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  templateItems: InvoiceItemInput[];
  currency?: string;
  notes?: string;
  terms?: string;
  maxOccurrences?: number;
}

export interface RecurringUpdateInput extends Partial<RecurringCreateInput> {}

// --- Invoice Activity ---

export interface InvoiceActivity {
  id: string;
  invoiceId: string;
  action: string;
  details: string | null;
  actorId: string | null;
  createdAt: string;
}

// --- Invoicing Settings ---

export interface InvoicingSettings {
  id: string;
  userId: string;
  businessName: string | null;
  businessEmail: string | null;
  businessPhone: string | null;
  businessAddress: Address | null;
  logoUrl: string | null;
  invoicePrefix: string;
  nextNumber: number;
  defaultCurrency: string;
  defaultDueDays: number;
  defaultTerms: string | null;
  defaultNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsUpdateInput {
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: Address;
  logoUrl?: string;
  invoicePrefix?: string;
  defaultCurrency?: string;
  defaultDueDays?: number;
  defaultTerms?: string;
  defaultNotes?: string;
}

// --- Dashboard Stats ---

export interface InvoicingDashboardStats {
  totalClients: number;
  totalInvoices: number;
  totalRevenue: number;
  totalOutstanding: number;
  overdueCount: number;
  overdueAmount: number;
  paidThisMonth: number;
  sentThisMonth: number;
}

// --- API Response ---

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
