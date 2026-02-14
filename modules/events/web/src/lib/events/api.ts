// =============================================================================
// Events API Client
// =============================================================================

import type {
  Event,
  EventCreateInput,
  EventUpdateInput,
  EventFilters,
  EventVenue,
  VenueCreateInput,
  VenueUpdateInput,
  EventRegistration,
  RegistrationCreateInput,
  EventSpeaker,
  SpeakerCreateInput,
  SpeakerUpdateInput,
  EventSettings,
  SettingsUpdateInput,
  DashboardStats,
  PaginatedResponse,
} from './types';

// =============================================================================
// Config
// =============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const EVENTS_BASE = `${API_BASE}/events`;

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
// Events
// =============================================================================

export const eventApi = {
  list(filters?: EventFilters): Promise<PaginatedResponse<Event>> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.categoryId) params.set('categoryId', filters.categoryId);
    if (filters?.venueId) params.set('venueId', filters.venueId);
    if (filters?.startAfter) params.set('startAfter', filters.startAfter);
    if (filters?.startBefore) params.set('startBefore', filters.startBefore);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return request(`${EVENTS_BASE}/events${qs ? `?${qs}` : ''}`);
  },

  getById(id: string): Promise<Event> {
    return request(`${EVENTS_BASE}/events/${id}`);
  },

  create(data: EventCreateInput): Promise<Event> {
    return request(`${EVENTS_BASE}/events`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: EventUpdateInput): Promise<Event> {
    return request(`${EVENTS_BASE}/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${EVENTS_BASE}/events/${id}`, { method: 'DELETE' });
  },

  publish(id: string): Promise<Event> {
    return request(`${EVENTS_BASE}/events/${id}/publish`, { method: 'POST' });
  },

  cancel(id: string): Promise<Event> {
    return request(`${EVENTS_BASE}/events/${id}/cancel`, { method: 'POST' });
  },

  complete(id: string): Promise<Event> {
    return request(`${EVENTS_BASE}/events/${id}/complete`, { method: 'POST' });
  },

  getStats(): Promise<DashboardStats> {
    return request(`${EVENTS_BASE}/events/stats`);
  },

  getDashboardStats(): Promise<DashboardStats> {
    return request(`${EVENTS_BASE}/events/dashboard-stats`);
  },

  // Nested: speakers
  getSpeakers(eventId: string): Promise<EventSpeaker[]> {
    return request(`${EVENTS_BASE}/events/${eventId}/speakers`);
  },

  addSpeaker(eventId: string, data: SpeakerCreateInput): Promise<EventSpeaker> {
    return request(`${EVENTS_BASE}/events/${eventId}/speakers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Nested: registrations
  getRegistrations(eventId: string): Promise<EventRegistration[]> {
    return request(`${EVENTS_BASE}/events/${eventId}/registrations`);
  },

  register(eventId: string, data: RegistrationCreateInput): Promise<EventRegistration> {
    return request(`${EVENTS_BASE}/events/${eventId}/registrations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// =============================================================================
// Venues
// =============================================================================

export const venueApi = {
  list(filters?: { search?: string; isVirtual?: boolean; page?: number; limit?: number }): Promise<PaginatedResponse<EventVenue>> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.isVirtual !== undefined) params.set('isVirtual', String(filters.isVirtual));
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return request(`${EVENTS_BASE}/venues${qs ? `?${qs}` : ''}`);
  },

  getById(id: string): Promise<EventVenue> {
    return request(`${EVENTS_BASE}/venues/${id}`);
  },

  create(data: VenueCreateInput): Promise<EventVenue> {
    return request(`${EVENTS_BASE}/venues`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: VenueUpdateInput): Promise<EventVenue> {
    return request(`${EVENTS_BASE}/venues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${EVENTS_BASE}/venues/${id}`, { method: 'DELETE' });
  },

  getStats(): Promise<{ totalVenues: number; virtualVenues: number; totalCapacity: number }> {
    return request(`${EVENTS_BASE}/venues/stats`);
  },
};

// =============================================================================
// Registrations (standalone operations)
// =============================================================================

export const registrationApi = {
  list(filters?: { search?: string; status?: string; eventId?: string; page?: number; limit?: number }): Promise<PaginatedResponse<EventRegistration>> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.eventId) params.set('eventId', filters.eventId);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return request(`${EVENTS_BASE}/registrations${qs ? `?${qs}` : ''}`);
  },

  confirm(id: string): Promise<EventRegistration> {
    return request(`${EVENTS_BASE}/registrations/${id}/confirm`, { method: 'POST' });
  },

  checkIn(id: string): Promise<EventRegistration> {
    return request(`${EVENTS_BASE}/registrations/${id}/check-in`, { method: 'POST' });
  },

  cancel(id: string): Promise<EventRegistration> {
    return request(`${EVENTS_BASE}/registrations/${id}/cancel`, { method: 'POST' });
  },
};

// =============================================================================
// Speakers (standalone operations)
// =============================================================================

export const speakerApi = {
  update(id: string, data: SpeakerUpdateInput): Promise<EventSpeaker> {
    return request(`${EVENTS_BASE}/speakers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${EVENTS_BASE}/speakers/${id}`, { method: 'DELETE' });
  },

  reorder(ids: string[]): Promise<void> {
    return request(`${EVENTS_BASE}/speakers/reorder`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },
};

// =============================================================================
// Settings
// =============================================================================

export const settingsApi = {
  get(): Promise<EventSettings> {
    return request(`${EVENTS_BASE}/settings`);
  },

  update(data: SettingsUpdateInput): Promise<EventSettings> {
    return request(`${EVENTS_BASE}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
