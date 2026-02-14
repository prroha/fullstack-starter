// =============================================================================
// Invoicing API Client
// =============================================================================

import type {
  InvoicingClient,
  ClientCreateInput,
  ClientUpdateInput,
  TaxRate,
  TaxRateCreateInput,
  TaxRateUpdateInput,
  Invoice,
  InvoiceCreateInput,
  InvoiceUpdateInput,
  InvoiceFilters,
  InvoiceItem,
  InvoiceItemInput,
  InvoiceItemUpdateInput,
  InvoicePayment,
  PaymentCreateInput,
  RecurringInvoice,
  RecurringCreateInput,
  RecurringUpdateInput,
  InvoicingSettings,
  SettingsUpdateInput,
  InvoicingDashboardStats,
  PaginatedResponse,
} from './types';

// =============================================================================
// Config
// =============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const INV_BASE = `${API_BASE}/invoicing`;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || json.message || `Request failed: ${res.status}`);
  }

  return json.data ?? json;
}

// =============================================================================
// Clients
// =============================================================================

export const clientApi = {
  list(page = 1, limit = 20, search?: string): Promise<PaginatedResponse<InvoicingClient>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    return request(`${INV_BASE}/clients?${params}`);
  },

  getById(id: string): Promise<InvoicingClient> {
    return request(`${INV_BASE}/clients/${id}`);
  },

  create(data: ClientCreateInput): Promise<InvoicingClient> {
    return request(`${INV_BASE}/clients`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: ClientUpdateInput): Promise<InvoicingClient> {
    return request(`${INV_BASE}/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${INV_BASE}/clients/${id}`, { method: 'DELETE' });
  },

  getStats(id: string): Promise<{ invoiceCount: number; totalBilled: number; totalPaid: number }> {
    return request(`${INV_BASE}/clients/${id}/stats`);
  },
};

// =============================================================================
// Invoices
// =============================================================================

export const invoiceApi = {
  list(filters?: InvoiceFilters): Promise<PaginatedResponse<Invoice>> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.clientId) params.set('clientId', filters.clientId);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return request(`${INV_BASE}/invoices${qs ? `?${qs}` : ''}`);
  },

  getById(id: string): Promise<Invoice> {
    return request(`${INV_BASE}/invoices/${id}`);
  },

  create(data: InvoiceCreateInput): Promise<Invoice> {
    return request(`${INV_BASE}/invoices`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: InvoiceUpdateInput): Promise<Invoice> {
    return request(`${INV_BASE}/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${INV_BASE}/invoices/${id}`, { method: 'DELETE' });
  },

  send(id: string): Promise<Invoice> {
    return request(`${INV_BASE}/invoices/${id}/send`, { method: 'POST' });
  },

  void(id: string): Promise<Invoice> {
    return request(`${INV_BASE}/invoices/${id}/void`, { method: 'POST' });
  },

  duplicate(id: string): Promise<Invoice> {
    return request(`${INV_BASE}/invoices/${id}/duplicate`, { method: 'POST' });
  },

  getStats(): Promise<InvoicingDashboardStats> {
    return request(`${INV_BASE}/invoices/stats`);
  },
};

// =============================================================================
// Invoice Items
// =============================================================================

export const invoiceItemApi = {
  add(invoiceId: string, data: InvoiceItemInput): Promise<InvoiceItem> {
    return request(`${INV_BASE}/invoices/${invoiceId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(invoiceId: string, itemId: string, data: InvoiceItemUpdateInput): Promise<InvoiceItem> {
    return request(`${INV_BASE}/invoices/${invoiceId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(invoiceId: string, itemId: string): Promise<void> {
    return request(`${INV_BASE}/invoices/${invoiceId}/items/${itemId}`, { method: 'DELETE' });
  },

  reorder(invoiceId: string, itemIds: string[]): Promise<void> {
    return request(`${INV_BASE}/invoices/${invoiceId}/items/reorder`, {
      method: 'POST',
      body: JSON.stringify({ itemIds }),
    });
  },
};

// =============================================================================
// Payments
// =============================================================================

export const paymentApi = {
  list(invoiceId: string): Promise<InvoicePayment[]> {
    return request(`${INV_BASE}/invoices/${invoiceId}/payments`);
  },

  record(invoiceId: string, data: PaymentCreateInput): Promise<InvoicePayment> {
    return request(`${INV_BASE}/invoices/${invoiceId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete(invoiceId: string, paymentId: string): Promise<void> {
    return request(`${INV_BASE}/invoices/${invoiceId}/payments/${paymentId}`, { method: 'DELETE' });
  },
};

// =============================================================================
// Tax Rates
// =============================================================================

export const taxRateApi = {
  list(): Promise<TaxRate[]> {
    return request(`${INV_BASE}/tax-rates`);
  },

  create(data: TaxRateCreateInput): Promise<TaxRate> {
    return request(`${INV_BASE}/tax-rates`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: TaxRateUpdateInput): Promise<TaxRate> {
    return request(`${INV_BASE}/tax-rates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${INV_BASE}/tax-rates/${id}`, { method: 'DELETE' });
  },

  setDefault(id: string): Promise<TaxRate> {
    return request(`${INV_BASE}/tax-rates/${id}/default`, { method: 'POST' });
  },
};

// =============================================================================
// Recurring Invoices
// =============================================================================

export const recurringApi = {
  list(page = 1, limit = 20): Promise<PaginatedResponse<RecurringInvoice>> {
    return request(`${INV_BASE}/recurring?page=${page}&limit=${limit}`);
  },

  getById(id: string): Promise<RecurringInvoice> {
    return request(`${INV_BASE}/recurring/${id}`);
  },

  create(data: RecurringCreateInput): Promise<RecurringInvoice> {
    return request(`${INV_BASE}/recurring`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: RecurringUpdateInput): Promise<RecurringInvoice> {
    return request(`${INV_BASE}/recurring/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  pause(id: string): Promise<RecurringInvoice> {
    return request(`${INV_BASE}/recurring/${id}/pause`, { method: 'POST' });
  },

  resume(id: string): Promise<RecurringInvoice> {
    return request(`${INV_BASE}/recurring/${id}/resume`, { method: 'POST' });
  },

  cancel(id: string): Promise<RecurringInvoice> {
    return request(`${INV_BASE}/recurring/${id}/cancel`, { method: 'POST' });
  },
};

// =============================================================================
// Settings
// =============================================================================

export const settingsApi = {
  get(): Promise<InvoicingSettings> {
    return request(`${INV_BASE}/settings`);
  },

  update(data: SettingsUpdateInput): Promise<InvoicingSettings> {
    return request(`${INV_BASE}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
