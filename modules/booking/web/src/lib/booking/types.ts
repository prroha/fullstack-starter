// =============================================================================
// Booking TypeScript Interfaces
// =============================================================================

// --- Enums ---

export type ServiceStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type ReminderType = 'EMAIL' | 'SMS' | 'PUSH';

// --- Service Category ---

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string | null;
  displayOrder: number;
}

// --- Booking Service ---

export interface BookingService {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  duration: number;
  bufferTime: number;
  capacity: number;
  status: ServiceStatus;
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  categories?: ServiceCategory[];
  providers?: ProviderSummary[];
  avgRating?: number;
  reviewCount?: number;
}

export interface ServiceCreateInput {
  name: string;
  description: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  price?: number;
  compareAtPrice?: number;
  duration?: number;
  bufferTime?: number;
  capacity?: number;
  categoryIds?: string[];
}

export interface ServiceUpdateInput extends Partial<ServiceCreateInput> {}

export interface ServiceFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  page?: number;
  limit?: number;
}

// --- Provider ---

export interface Provider {
  id: string;
  userId: string;
  userName?: string;
  bio: string | null;
  avatarUrl: string | null;
  specialties: string[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  services?: BookingService[];
  avgRating?: number;
  reviewCount?: number;
  totalBookings?: number;
}

export interface ProviderSummary {
  id: string;
  userName?: string;
  avatarUrl: string | null;
  avgRating?: number;
}

export interface ProviderCreateInput {
  bio?: string;
  avatarUrl?: string;
  specialties?: string[];
}

export interface ProviderUpdateInput extends Partial<ProviderCreateInput> {}

export interface ProviderFilters {
  search?: string;
  serviceId?: string;
  page?: number;
  limit?: number;
}

// --- Schedule ---

export interface Schedule {
  id: string;
  providerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface ScheduleInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface ScheduleOverride {
  id: string;
  providerId: string;
  date: string;
  isBlocked: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  createdAt: string;
}

export interface ScheduleOverrideInput {
  date: string;
  isBlocked: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

// --- Booking ---

export interface Booking {
  id: string;
  bookingNumber: string;
  userId: string;
  serviceId: string;
  providerId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalAmount: number;
  currency: string;
  notes: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  service?: BookingService;
  provider?: Provider;
}

export interface BookingCreateInput {
  serviceId: string;
  providerId: string;
  date: string;
  startTime: string;
  notes?: string;
}

export interface BookingFilters {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}

export interface AdminBookingFilters extends BookingFilters {
  search?: string;
  providerId?: string;
  serviceId?: string;
  startDate?: string;
  endDate?: string;
}

// --- Time Slot ---

export interface TimeSlot {
  time: string;
  available: boolean;
}

// --- Review ---

export interface BookingReview {
  id: string;
  serviceId: string;
  providerId: string;
  userId: string;
  userName: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewCreateInput {
  serviceId: string;
  providerId: string;
  rating: number;
  comment?: string;
}

export interface ReviewUpdateInput {
  rating?: number;
  comment?: string;
}

// --- Provider Stats ---

export interface ProviderStats {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageRating: number;
}

// --- Admin Stats ---

export interface BookingStats {
  totalBookings: number;
  todayBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  revenue: number;
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
