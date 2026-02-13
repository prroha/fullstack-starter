// =============================================================================
// Booking API Client
// =============================================================================
// API methods for all Booking endpoints. Uses fetch with configurable base URL.

import type {
  BookingService,
  ServiceCreateInput,
  ServiceUpdateInput,
  ServiceFilters,
  ServiceCategory,
  Provider,
  ProviderCreateInput,
  ProviderUpdateInput,
  ProviderFilters,
  Schedule,
  ScheduleInput,
  ScheduleOverride,
  ScheduleOverrideInput,
  Booking,
  BookingCreateInput,
  BookingFilters,
  AdminBookingFilters,
  BookingStats,
  ProviderStats,
  TimeSlot,
  BookingReview,
  ReviewCreateInput,
  ReviewUpdateInput,
  PaginatedResponse,
} from './types';

// =============================================================================
// Config
// =============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const BOOKING_BASE = `${API_BASE}/booking`;

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
// Services
// =============================================================================

export const serviceApi = {
  list(filters?: ServiceFilters): Promise<PaginatedResponse<BookingService>> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
    if (filters?.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
    if (filters?.minDuration !== undefined) params.set('minDuration', String(filters.minDuration));
    if (filters?.maxDuration !== undefined) params.set('maxDuration', String(filters.maxDuration));
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));

    const qs = params.toString();
    return request(`${BOOKING_BASE}/services${qs ? `?${qs}` : ''}`);
  },

  getBySlug(slug: string): Promise<BookingService> {
    return request(`${BOOKING_BASE}/services/${slug}`);
  },

  getCategories(): Promise<ServiceCategory[]> {
    return request(`${BOOKING_BASE}/services/categories`);
  },

  create(data: ServiceCreateInput): Promise<BookingService> {
    return request(`${BOOKING_BASE}/services`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: ServiceUpdateInput): Promise<BookingService> {
    return request(`${BOOKING_BASE}/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${BOOKING_BASE}/services/${id}`, { method: 'DELETE' });
  },

  publish(id: string): Promise<BookingService> {
    return request(`${BOOKING_BASE}/services/${id}/publish`, { method: 'POST' });
  },

  unpublish(id: string): Promise<BookingService> {
    return request(`${BOOKING_BASE}/services/${id}/unpublish`, { method: 'POST' });
  },
};

// =============================================================================
// Providers
// =============================================================================

export const providerApi = {
  list(filters?: ProviderFilters): Promise<PaginatedResponse<Provider>> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.serviceId) params.set('serviceId', filters.serviceId);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));

    const qs = params.toString();
    return request(`${BOOKING_BASE}/providers${qs ? `?${qs}` : ''}`);
  },

  getById(id: string): Promise<Provider> {
    return request(`${BOOKING_BASE}/providers/${id}`);
  },

  getAvailability(providerId: string, serviceId: string, date: string): Promise<TimeSlot[]> {
    const params = new URLSearchParams({ serviceId, date });
    return request(`${BOOKING_BASE}/providers/${providerId}/availability?${params}`);
  },

  create(data: ProviderCreateInput): Promise<Provider> {
    return request(`${BOOKING_BASE}/providers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: ProviderUpdateInput): Promise<Provider> {
    return request(`${BOOKING_BASE}/providers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  linkService(providerId: string, serviceId: string): Promise<void> {
    return request(`${BOOKING_BASE}/providers/${providerId}/services`, {
      method: 'POST',
      body: JSON.stringify({ serviceId }),
    });
  },

  unlinkService(providerId: string, serviceId: string): Promise<void> {
    return request(`${BOOKING_BASE}/providers/${providerId}/services/${serviceId}`, {
      method: 'DELETE',
    });
  },
};

// =============================================================================
// Bookings
// =============================================================================

export const bookingApi = {
  create(data: BookingCreateInput): Promise<Booking> {
    return request(`${BOOKING_BASE}/bookings`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  list(filters?: BookingFilters): Promise<PaginatedResponse<Booking>> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));

    const qs = params.toString();
    return request(`${BOOKING_BASE}/bookings${qs ? `?${qs}` : ''}`);
  },

  getById(id: string): Promise<Booking> {
    return request(`${BOOKING_BASE}/bookings/${id}`);
  },

  cancel(id: string, reason?: string): Promise<Booking> {
    return request(`${BOOKING_BASE}/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  reschedule(id: string, data: { date: string; startTime: string }): Promise<Booking> {
    return request(`${BOOKING_BASE}/bookings/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  confirm(id: string): Promise<Booking> {
    return request(`${BOOKING_BASE}/bookings/${id}/confirm`, { method: 'POST' });
  },

  complete(id: string): Promise<Booking> {
    return request(`${BOOKING_BASE}/bookings/${id}/complete`, { method: 'POST' });
  },

  markNoShow(id: string): Promise<Booking> {
    return request(`${BOOKING_BASE}/bookings/${id}/no-show`, { method: 'POST' });
  },
};

// =============================================================================
// Schedules
// =============================================================================

export const scheduleApi = {
  getWeekly(providerId: string): Promise<Schedule[]> {
    return request(`${BOOKING_BASE}/schedules/${providerId}`);
  },

  updateWeekly(providerId: string, schedules: ScheduleInput[]): Promise<Schedule[]> {
    return request(`${BOOKING_BASE}/schedules/${providerId}`, {
      method: 'PUT',
      body: JSON.stringify({ schedules }),
    });
  },

  listOverrides(providerId: string, startDate?: string, endDate?: string): Promise<ScheduleOverride[]> {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    const qs = params.toString();
    return request(`${BOOKING_BASE}/schedules/${providerId}/overrides${qs ? `?${qs}` : ''}`);
  },

  createOverride(providerId: string, data: ScheduleOverrideInput): Promise<ScheduleOverride> {
    return request(`${BOOKING_BASE}/schedules/${providerId}/overrides`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteOverride(providerId: string, overrideId: string): Promise<void> {
    return request(`${BOOKING_BASE}/schedules/${providerId}/overrides/${overrideId}`, {
      method: 'DELETE',
    });
  },
};

// =============================================================================
// Reviews
// =============================================================================

export const reviewApi = {
  listByService(serviceId: string, page?: number, limit?: number): Promise<PaginatedResponse<BookingReview>> {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));

    const qs = params.toString();
    return request(`${BOOKING_BASE}/reviews/service/${serviceId}${qs ? `?${qs}` : ''}`);
  },

  listByProvider(providerId: string, page?: number, limit?: number): Promise<PaginatedResponse<BookingReview>> {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));

    const qs = params.toString();
    return request(`${BOOKING_BASE}/reviews/provider/${providerId}${qs ? `?${qs}` : ''}`);
  },

  create(data: ReviewCreateInput): Promise<BookingReview> {
    return request(`${BOOKING_BASE}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: ReviewUpdateInput): Promise<BookingReview> {
    return request(`${BOOKING_BASE}/reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${BOOKING_BASE}/reviews/${id}`, { method: 'DELETE' });
  },
};

// =============================================================================
// Admin
// =============================================================================

export const adminBookingApi = {
  list(filters?: AdminBookingFilters): Promise<PaginatedResponse<Booking>> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.providerId) params.set('providerId', filters.providerId);
    if (filters?.serviceId) params.set('serviceId', filters.serviceId);
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));

    const qs = params.toString();
    return request(`${BOOKING_BASE}/admin/bookings${qs ? `?${qs}` : ''}`);
  },

  getStats(): Promise<BookingStats> {
    return request(`${BOOKING_BASE}/admin/bookings/stats`);
  },

  updateStatus(id: string, status: string): Promise<Booking> {
    return request(`${BOOKING_BASE}/admin/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  getExportUrl(): string {
    return `${BOOKING_BASE}/admin/bookings/export`;
  },
};

// =============================================================================
// Provider Dashboard
// =============================================================================

export const providerDashboardApi = {
  getStats(): Promise<ProviderStats> {
    return request(`${BOOKING_BASE}/providers/me/stats`);
  },

  getBookings(filters?: BookingFilters): Promise<PaginatedResponse<Booking>> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));

    const qs = params.toString();
    return request(`${BOOKING_BASE}/providers/me/bookings${qs ? `?${qs}` : ''}`);
  },
};
