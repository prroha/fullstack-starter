// =============================================================================
// Helpdesk API Client
// =============================================================================

import type {
  Ticket,
  TicketCreateInput,
  TicketUpdateInput,
  TicketFilters,
  TicketMessage,
  MessageCreateInput,
  HelpdeskCategory,
  CategoryCreateInput,
  CategoryUpdateInput,
  HelpdeskAgent,
  AgentCreateInput,
  AgentUpdateInput,
  AgentWorkload,
  KnowledgeBaseArticle,
  ArticleCreateInput,
  ArticleUpdateInput,
  CannedResponse,
  CannedResponseCreateInput,
  CannedResponseUpdateInput,
  SlaPolicy,
  SlaPolicyCreateInput,
  SlaPolicyUpdateInput,
  SlaBreachCheckResult,
  HelpdeskSettings,
  SettingsUpdateInput,
  HelpdeskDashboardStats,
  PaginatedResponse,
} from './types';

// =============================================================================
// Config
// =============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const HD_BASE = `${API_BASE}/helpdesk`;

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
// Tickets
// =============================================================================

export const ticketApi = {
  list(filters?: TicketFilters): Promise<PaginatedResponse<Ticket>> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.categoryId) params.set('categoryId', filters.categoryId);
    if (filters?.assignedAgentId) params.set('assignedAgentId', filters.assignedAgentId);
    if (filters?.tagId) params.set('tagId', filters.tagId);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return request(`${HD_BASE}/tickets${qs ? `?${qs}` : ''}`);
  },

  getById(id: string): Promise<Ticket> {
    return request(`${HD_BASE}/tickets/${id}`);
  },

  create(data: TicketCreateInput): Promise<Ticket> {
    return request(`${HD_BASE}/tickets`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: TicketUpdateInput): Promise<Ticket> {
    return request(`${HD_BASE}/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${HD_BASE}/tickets/${id}`, { method: 'DELETE' });
  },

  assign(id: string, agentId: string): Promise<Ticket> {
    return request(`${HD_BASE}/tickets/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ agentId }),
    });
  },

  changeStatus(id: string, status: string): Promise<Ticket> {
    return request(`${HD_BASE}/tickets/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  getMessages(id: string): Promise<TicketMessage[]> {
    return request(`${HD_BASE}/tickets/${id}/messages`);
  },

  addMessage(id: string, data: MessageCreateInput): Promise<TicketMessage> {
    return request(`${HD_BASE}/tickets/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  addTag(id: string, tagId: string): Promise<void> {
    return request(`${HD_BASE}/tickets/${id}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tagId }),
    });
  },

  removeTag(id: string, tagId: string): Promise<void> {
    return request(`${HD_BASE}/tickets/${id}/tags/${tagId}`, { method: 'DELETE' });
  },

  getStats(): Promise<HelpdeskDashboardStats> {
    return request(`${HD_BASE}/tickets/stats`);
  },
};

// =============================================================================
// Categories
// =============================================================================

export const categoryApi = {
  list(): Promise<HelpdeskCategory[]> {
    return request(`${HD_BASE}/categories`);
  },

  getById(id: string): Promise<HelpdeskCategory> {
    return request(`${HD_BASE}/categories/${id}`);
  },

  create(data: CategoryCreateInput): Promise<HelpdeskCategory> {
    return request(`${HD_BASE}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: CategoryUpdateInput): Promise<HelpdeskCategory> {
    return request(`${HD_BASE}/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${HD_BASE}/categories/${id}`, { method: 'DELETE' });
  },

  reorder(ids: string[]): Promise<void> {
    return request(`${HD_BASE}/categories/reorder`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },

  toggleActive(id: string): Promise<HelpdeskCategory> {
    return request(`${HD_BASE}/categories/${id}/toggle-active`, { method: 'POST' });
  },
};

// =============================================================================
// Agents
// =============================================================================

export const agentApi = {
  list(filters?: { search?: string; department?: string; role?: string; isActive?: boolean; page?: number; limit?: number }): Promise<PaginatedResponse<HelpdeskAgent>> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.department) params.set('department', filters.department);
    if (filters?.role) params.set('role', filters.role);
    if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
    params.set('page', String(filters?.page || 1));
    params.set('limit', String(filters?.limit || 20));
    return request(`${HD_BASE}/agents?${params}`);
  },

  getById(id: string): Promise<HelpdeskAgent> {
    return request(`${HD_BASE}/agents/${id}`);
  },

  getMe(): Promise<HelpdeskAgent> {
    return request(`${HD_BASE}/agents/me`);
  },

  create(data: AgentCreateInput): Promise<HelpdeskAgent> {
    return request(`${HD_BASE}/agents`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: AgentUpdateInput): Promise<HelpdeskAgent> {
    return request(`${HD_BASE}/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${HD_BASE}/agents/${id}`, { method: 'DELETE' });
  },

  toggleActive(id: string): Promise<HelpdeskAgent> {
    return request(`${HD_BASE}/agents/${id}/toggle-active`, { method: 'POST' });
  },

  getWorkload(): Promise<AgentWorkload[]> {
    return request(`${HD_BASE}/agents/workload`);
  },
};

// =============================================================================
// Knowledge Base Articles
// =============================================================================

export const articleApi = {
  list(page = 1, limit = 20, filters?: { search?: string; status?: string; categoryId?: string }): Promise<PaginatedResponse<KnowledgeBaseArticle>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.categoryId) params.set('categoryId', filters.categoryId);
    return request(`${HD_BASE}/articles?${params}`);
  },

  getById(id: string): Promise<KnowledgeBaseArticle> {
    return request(`${HD_BASE}/articles/${id}`);
  },

  create(data: ArticleCreateInput): Promise<KnowledgeBaseArticle> {
    return request(`${HD_BASE}/articles`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: ArticleUpdateInput): Promise<KnowledgeBaseArticle> {
    return request(`${HD_BASE}/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${HD_BASE}/articles/${id}`, { method: 'DELETE' });
  },

  publish(id: string): Promise<KnowledgeBaseArticle> {
    return request(`${HD_BASE}/articles/${id}/publish`, { method: 'POST' });
  },

  archive(id: string): Promise<KnowledgeBaseArticle> {
    return request(`${HD_BASE}/articles/${id}/archive`, { method: 'POST' });
  },

  recordFeedback(id: string, helpful: boolean): Promise<void> {
    return request(`${HD_BASE}/articles/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ helpful }),
    });
  },

  search(q: string): Promise<KnowledgeBaseArticle[]> {
    return request(`${HD_BASE}/articles/search?q=${encodeURIComponent(q)}`);
  },
};

// =============================================================================
// Canned Responses
// =============================================================================

export const cannedResponseApi = {
  list(page = 1, limit = 20, filters?: { search?: string; categoryId?: string }): Promise<PaginatedResponse<CannedResponse>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.search) params.set('search', filters.search);
    if (filters?.categoryId) params.set('categoryId', filters.categoryId);
    return request(`${HD_BASE}/canned-responses?${params}`);
  },

  getById(id: string): Promise<CannedResponse> {
    return request(`${HD_BASE}/canned-responses/${id}`);
  },

  getMine(): Promise<PaginatedResponse<CannedResponse>> {
    return request(`${HD_BASE}/canned-responses/mine`);
  },

  create(data: CannedResponseCreateInput): Promise<CannedResponse> {
    return request(`${HD_BASE}/canned-responses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: CannedResponseUpdateInput): Promise<CannedResponse> {
    return request(`${HD_BASE}/canned-responses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${HD_BASE}/canned-responses/${id}`, { method: 'DELETE' });
  },
};

// =============================================================================
// SLA Policies
// =============================================================================

export const slaApi = {
  list(filters?: { search?: string; priority?: string; isActive?: boolean; page?: number; limit?: number }): Promise<PaginatedResponse<SlaPolicy>> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return request(`${HD_BASE}/sla-policies${qs ? `?${qs}` : ''}`);
  },

  getById(id: string): Promise<SlaPolicy> {
    return request(`${HD_BASE}/sla-policies/${id}`);
  },

  create(data: SlaPolicyCreateInput): Promise<SlaPolicy> {
    return request(`${HD_BASE}/sla-policies`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: SlaPolicyUpdateInput): Promise<SlaPolicy> {
    return request(`${HD_BASE}/sla-policies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${HD_BASE}/sla-policies/${id}`, { method: 'DELETE' });
  },

  toggleActive(id: string): Promise<SlaPolicy> {
    return request(`${HD_BASE}/sla-policies/${id}/toggle-active`, { method: 'POST' });
  },

  checkBreaches(): Promise<SlaBreachCheckResult> {
    return request(`${HD_BASE}/sla-policies/check-breaches`);
  },
};

// =============================================================================
// Settings
// =============================================================================

export const settingsApi = {
  get(): Promise<HelpdeskSettings> {
    return request(`${HD_BASE}/settings`);
  },

  update(data: SettingsUpdateInput): Promise<HelpdeskSettings> {
    return request(`${HD_BASE}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
