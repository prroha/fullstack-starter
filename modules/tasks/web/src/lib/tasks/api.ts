// =============================================================================
// Tasks API Client
// =============================================================================

import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskFilters,
  TaskComment,
  CommentCreateInput,
  CommentUpdateInput,
  TaskProject,
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectStats,
  TaskLabel,
  LabelCreateInput,
  LabelUpdateInput,
  TaskSettings,
  SettingsUpdateInput,
  DashboardStats,
  PaginatedResponse,
} from './types';

// =============================================================================
// Config
// =============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const TASKS_BASE = `${API_BASE}/tasks`;

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
// Projects
// =============================================================================

export const projectApi = {
  list(includeArchived = false): Promise<TaskProject[]> {
    const params = includeArchived ? '?includeArchived=true' : '';
    return request(`${TASKS_BASE}/projects${params}`);
  },

  getById(id: string): Promise<TaskProject> {
    return request(`${TASKS_BASE}/projects/${id}`);
  },

  getStats(id: string): Promise<ProjectStats> {
    return request(`${TASKS_BASE}/projects/${id}/stats`);
  },

  create(data: ProjectCreateInput): Promise<TaskProject> {
    return request(`${TASKS_BASE}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: ProjectUpdateInput): Promise<TaskProject> {
    return request(`${TASKS_BASE}/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${TASKS_BASE}/projects/${id}`, { method: 'DELETE' });
  },

  archive(id: string): Promise<TaskProject> {
    return request(`${TASKS_BASE}/projects/${id}/archive`, { method: 'POST' });
  },

  unarchive(id: string): Promise<TaskProject> {
    return request(`${TASKS_BASE}/projects/${id}/unarchive`, { method: 'POST' });
  },

  reorder(ids: string[]): Promise<void> {
    return request(`${TASKS_BASE}/projects/reorder`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },
};

// =============================================================================
// Tasks
// =============================================================================

export const taskApi = {
  list(filters?: TaskFilters): Promise<PaginatedResponse<Task>> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.projectId) params.set('projectId', filters.projectId);
    if (filters?.assigneeId) params.set('assigneeId', filters.assigneeId);
    if (filters?.labelId) params.set('labelId', filters.labelId);
    if (filters?.dueBefore) params.set('dueBefore', filters.dueBefore);
    if (filters?.dueAfter) params.set('dueAfter', filters.dueAfter);
    if (filters?.showCompleted !== undefined) params.set('showCompleted', String(filters.showCompleted));
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return request(`${TASKS_BASE}/tasks${qs ? `?${qs}` : ''}`);
  },

  getById(id: string): Promise<Task> {
    return request(`${TASKS_BASE}/tasks/${id}`);
  },

  create(data: TaskCreateInput): Promise<Task> {
    return request(`${TASKS_BASE}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: TaskUpdateInput): Promise<Task> {
    return request(`${TASKS_BASE}/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${TASKS_BASE}/tasks/${id}`, { method: 'DELETE' });
  },

  changeStatus(id: string, status: string): Promise<Task> {
    return request(`${TASKS_BASE}/tasks/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  assign(id: string, assigneeId: string | null): Promise<Task> {
    return request(`${TASKS_BASE}/tasks/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assigneeId }),
    });
  },

  reorder(ids: string[]): Promise<void> {
    return request(`${TASKS_BASE}/tasks/reorder`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },

  getStats(): Promise<DashboardStats> {
    return request(`${TASKS_BASE}/tasks/stats`);
  },

  // Nested: comments
  getComments(taskId: string): Promise<TaskComment[]> {
    return request(`${TASKS_BASE}/tasks/${taskId}/comments`);
  },

  addComment(taskId: string, data: CommentCreateInput): Promise<TaskComment> {
    return request(`${TASKS_BASE}/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Nested: labels
  addLabel(taskId: string, labelId: string): Promise<void> {
    return request(`${TASKS_BASE}/tasks/${taskId}/labels`, {
      method: 'POST',
      body: JSON.stringify({ labelId }),
    });
  },

  removeLabel(taskId: string, labelId: string): Promise<void> {
    return request(`${TASKS_BASE}/tasks/${taskId}/labels/${labelId}`, { method: 'DELETE' });
  },
};

// =============================================================================
// Comments (standalone update/delete)
// =============================================================================

export const commentApi = {
  update(id: string, data: CommentUpdateInput): Promise<TaskComment> {
    return request(`${TASKS_BASE}/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${TASKS_BASE}/comments/${id}`, { method: 'DELETE' });
  },
};

// =============================================================================
// Labels
// =============================================================================

export const labelApi = {
  list(): Promise<TaskLabel[]> {
    return request(`${TASKS_BASE}/labels`);
  },

  create(data: LabelCreateInput): Promise<TaskLabel> {
    return request(`${TASKS_BASE}/labels`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: LabelUpdateInput): Promise<TaskLabel> {
    return request(`${TASKS_BASE}/labels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${TASKS_BASE}/labels/${id}`, { method: 'DELETE' });
  },
};

// =============================================================================
// Settings
// =============================================================================

export const settingsApi = {
  get(): Promise<TaskSettings> {
    return request(`${TASKS_BASE}/settings`);
  },

  update(data: SettingsUpdateInput): Promise<TaskSettings> {
    return request(`${TASKS_BASE}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
