// =============================================================================
// Events Types
// =============================================================================

// --- Enums (union types for frontend) ---

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED' | 'ARCHIVED';

export type EventType = 'IN_PERSON' | 'VIRTUAL' | 'HYBRID';

export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED' | 'ATTENDED';

// --- Category ---

export interface EventCategory {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// --- Venue ---

export interface EventVenue {
  id: string;
  userId: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  capacity: number | null;
  isVirtual: boolean;
  meetingUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueCreateInput {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  capacity?: number;
  isVirtual?: boolean;
  meetingUrl?: string;
}

export interface VenueUpdateInput {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  capacity?: number;
  isVirtual?: boolean;
  meetingUrl?: string;
}

// --- Event ---

export interface Event {
  id: string;
  userId: string;
  categoryId: string | null;
  venueId: string | null;
  title: string;
  slug: string;
  description: string | null;
  type: EventType;
  status: EventStatus;
  startDate: string;
  endDate: string;
  capacity: number | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  category?: EventCategory | null;
  venue?: EventVenue | null;
  speakers?: EventSpeaker[];
  registrations?: EventRegistration[];
}

export interface EventCreateInput {
  categoryId?: string;
  venueId?: string;
  title: string;
  description?: string;
  type?: EventType;
  status?: EventStatus;
  startDate: string;
  endDate: string;
  capacity?: number;
  price?: number;
  currency?: string;
  imageUrl?: string;
  isFeatured?: boolean;
}

export interface EventUpdateInput {
  categoryId?: string;
  venueId?: string;
  title?: string;
  description?: string;
  type?: EventType;
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  price?: number;
  currency?: string;
  imageUrl?: string;
  isFeatured?: boolean;
}

export interface EventFilters {
  status?: EventStatus;
  type?: EventType;
  categoryId?: string;
  venueId?: string;
  search?: string;
  startAfter?: string;
  startBefore?: string;
  page?: number;
  limit?: number;
}

// --- Registration ---

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  registrationNumber: string;
  attendeeName: string;
  attendeeEmail: string;
  notes: string | null;
  checkedInAt: string | null;
  createdAt: string;
  updatedAt: string;
  event?: Event;
}

export interface RegistrationCreateInput {
  attendeeName: string;
  attendeeEmail: string;
  notes?: string;
}

// --- Speaker ---

export interface EventSpeaker {
  id: string;
  eventId: string;
  userId: string;
  name: string;
  email: string | null;
  bio: string | null;
  avatarUrl: string | null;
  title: string | null;
  company: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SpeakerCreateInput {
  name: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  title?: string;
  company?: string;
}

export interface SpeakerUpdateInput {
  name?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  title?: string;
  company?: string;
}

// --- Settings ---

export interface EventSettings {
  id: string;
  userId: string;
  defaultView: string;
  defaultCategoryId: string | null;
  currency: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsUpdateInput {
  defaultView?: string;
  defaultCategoryId?: string;
  currency?: string;
  timezone?: string;
}

// --- Dashboard Stats ---

export interface DashboardStats {
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  confirmedRegistrations: number;
  totalVenues: number;
  totalRevenue: number;
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
