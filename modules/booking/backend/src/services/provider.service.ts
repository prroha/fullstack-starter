// =============================================================================
// Booking Provider Service
// =============================================================================
// Business logic for provider management, service linking, and availability.
// Uses placeholder db operations - replace with actual Prisma client.

// =============================================================================
// Types
// =============================================================================

export interface ProviderCreateInput {
  userId: string;
  bio?: string;
  avatarUrl?: string;
  specialties?: string[];
}

export interface ProviderUpdateInput {
  bio?: string;
  avatarUrl?: string;
  specialties?: string[];
}

export interface ProviderFilters {
  search?: string;
  serviceId?: string;
  page?: number;
  limit?: number;
}

interface ProviderRecord {
  id: string;
  userId: string;
  bio: string | null;
  avatarUrl: string | null;
  specialties: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProviderServiceLinkRecord {
  id: string;
  providerId: string;
  serviceId: string;
  createdAt: Date;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface ScheduleRecord {
  id: string;
  providerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface ScheduleOverrideRecord {
  id: string;
  providerId: string;
  date: string;
  isBlocked: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

interface BookingSlotRecord {
  startTime: string;
  endTime: string;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================
// Replace with actual Prisma client:
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  async findProviders(filters: ProviderFilters): Promise<{ items: ProviderRecord[]; total: number }> {
    // Replace with:
    // const where = {
    //   isActive: true,
    //   services: filters.serviceId ? { some: { serviceId: filters.serviceId } } : undefined,
    //   OR: filters.search ? [
    //     { user: { name: { contains: filters.search, mode: 'insensitive' } } },
    //     { bio: { contains: filters.search, mode: 'insensitive' } },
    //   ] : undefined,
    // };
    // const [items, total] = await Promise.all([
    //   db.provider.findMany({ where, skip: ((filters.page || 1) - 1) * (filters.limit || 20), take: filters.limit || 20, include: { user: true, services: { include: { service: true } } } }),
    //   db.provider.count({ where }),
    // ]);
    console.log('[DB] Finding providers with filters:', filters);
    return { items: [], total: 0 };
  },

  async findProviderById(id: string): Promise<ProviderRecord | null> {
    // Replace with: return db.provider.findUnique({ where: { id }, include: { user: true, services: { include: { service: true } }, reviews: true } });
    console.log('[DB] Finding provider by ID:', id);
    return null;
  },

  async findProviderByUserId(userId: string): Promise<ProviderRecord | null> {
    // Replace with: return db.provider.findUnique({ where: { userId }, include: { user: true, services: { include: { service: true } } } });
    console.log('[DB] Finding provider by user ID:', userId);
    return null;
  },

  async createProvider(data: ProviderCreateInput): Promise<ProviderRecord> {
    // Replace with: return db.provider.create({ data: { userId: data.userId, bio: data.bio, avatarUrl: data.avatarUrl, specialties: data.specialties || [] }, include: { user: true } });
    console.log('[DB] Creating provider for user:', data.userId);
    return {
      id: 'provider_' + Date.now(),
      userId: data.userId,
      bio: data.bio || null,
      avatarUrl: data.avatarUrl || null,
      specialties: data.specialties || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async updateProvider(id: string, data: ProviderUpdateInput): Promise<ProviderRecord | null> {
    // Replace with: return db.provider.update({ where: { id }, data });
    console.log('[DB] Updating provider:', id);
    return null;
  },

  async linkService(providerId: string, serviceId: string): Promise<ProviderServiceLinkRecord> {
    // Replace with: return db.providerService.create({ data: { providerId, serviceId } });
    console.log('[DB] Linking provider to service:', providerId, serviceId);
    return {
      id: 'link_' + Date.now(),
      providerId,
      serviceId,
      createdAt: new Date(),
    };
  },

  async unlinkService(providerId: string, serviceId: string): Promise<void> {
    // Replace with: await db.providerService.delete({ where: { providerId_serviceId: { providerId, serviceId } } });
    console.log('[DB] Unlinking provider from service:', providerId, serviceId);
  },

  async getProviderAvgRating(providerId: string): Promise<number> {
    // Replace with:
    // const result = await db.review.aggregate({ where: { providerId }, _avg: { rating: true } });
    // return result._avg.rating || 0;
    console.log('[DB] Getting average rating for provider:', providerId);
    return 0;
  },

  async getProviderScheduleForDay(providerId: string, dayOfWeek: number): Promise<ScheduleRecord[]> {
    // Replace with: return db.schedule.findMany({ where: { providerId, dayOfWeek, isActive: true }, orderBy: { startTime: 'asc' } });
    console.log('[DB] Getting schedule for provider:', providerId, 'day:', dayOfWeek);
    return [];
  },

  async getProviderOverridesForDate(providerId: string, date: string): Promise<ScheduleOverrideRecord[]> {
    // Replace with: return db.scheduleOverride.findMany({ where: { providerId, date } });
    console.log('[DB] Getting overrides for provider:', providerId, 'date:', date);
    return [];
  },

  async getExistingBookingsForDate(providerId: string, serviceId: string, date: string): Promise<BookingSlotRecord[]> {
    // Replace with:
    // return db.booking.findMany({
    //   where: { providerId, serviceId, date, status: { in: ['PENDING', 'CONFIRMED'] } },
    //   select: { startTime: true, endTime: true },
    //   orderBy: { startTime: 'asc' },
    // });
    console.log('[DB] Getting existing bookings for date:', providerId, serviceId, date);
    return [];
  },

  async getServiceDuration(serviceId: string): Promise<{ duration: number; bufferTime: number } | null> {
    // Replace with: return db.service.findUnique({ where: { id: serviceId }, select: { duration: true, bufferTime: true } });
    console.log('[DB] Getting service duration:', serviceId);
    return null;
  },
};

// =============================================================================
// Provider Service
// =============================================================================

export class ProviderService {
  /**
   * List providers with filtering and pagination
   */
  async listProviders(filters: ProviderFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await dbOperations.findProviders({
      ...filters,
      page,
      limit,
    });

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  /**
   * Get a single provider by ID with services and avg rating
   */
  async getProviderById(id: string) {
    const provider = await dbOperations.findProviderById(id);
    if (!provider) return null;

    const avgRating = await dbOperations.getProviderAvgRating(id);
    return { ...provider, avgRating: Math.round(avgRating * 10) / 10 };
  }

  /**
   * Get a provider by user ID
   */
  async getProviderByUserId(userId: string) {
    return dbOperations.findProviderByUserId(userId);
  }

  /**
   * Create a new provider profile
   */
  async createProvider(input: ProviderCreateInput) {
    return dbOperations.createProvider(input);
  }

  /**
   * Update a provider profile
   */
  async updateProvider(id: string, input: ProviderUpdateInput) {
    return dbOperations.updateProvider(id, input);
  }

  /**
   * Link a provider to a service they can perform
   */
  async linkService(providerId: string, serviceId: string) {
    return dbOperations.linkService(providerId, serviceId);
  }

  /**
   * Unlink a provider from a service
   */
  async unlinkService(providerId: string, serviceId: string) {
    return dbOperations.unlinkService(providerId, serviceId);
  }

  /**
   * Get available time slots for a provider on a given date for a service.
   * Merges weekly schedule + overrides, generates slots based on service
   * duration + buffer, and subtracts existing bookings.
   */
  async getProviderAvailability(providerId: string, serviceId: string, date: string): Promise<TimeSlot[]> {
    // Get service duration info
    const serviceInfo = await dbOperations.getServiceDuration(serviceId);
    if (!serviceInfo) {
      throw new Error('Service not found');
    }

    const { duration, bufferTime } = serviceInfo;

    // Determine the day of week (0 = Sunday, 6 = Saturday)
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Get weekly schedule for this day
    const schedules = await dbOperations.getProviderScheduleForDay(providerId, dayOfWeek);

    // Get overrides for this specific date
    const overrides = await dbOperations.getProviderOverridesForDate(providerId, date);

    // Check if the entire day is blocked
    const dayBlocked = overrides.some((o) => o.isBlocked && !o.startTime);
    if (dayBlocked) {
      return [];
    }

    // Build available time windows from schedule, applying overrides
    const windows: Array<{ start: string; end: string }> = [];

    // If there are custom override windows, use those instead of weekly schedule
    const customOverrides = overrides.filter((o) => !o.isBlocked && o.startTime && o.endTime);
    if (customOverrides.length > 0) {
      for (const override of customOverrides) {
        if (override.startTime && override.endTime) {
          windows.push({ start: override.startTime, end: override.endTime });
        }
      }
    } else {
      // Use weekly schedule
      for (const schedule of schedules) {
        windows.push({ start: schedule.startTime, end: schedule.endTime });
      }
    }

    // Remove blocked time ranges from overrides
    const blockedRanges = overrides.filter((o) => o.isBlocked && o.startTime && o.endTime);

    // Get existing bookings
    const existingBookings = await dbOperations.getExistingBookingsForDate(providerId, serviceId, date);

    // Generate time slots from available windows
    const slots: TimeSlot[] = [];
    const slotDuration = duration + bufferTime;

    for (const window of windows) {
      const windowStartMins = this.timeToMinutes(window.start);
      const windowEndMins = this.timeToMinutes(window.end);

      let currentMins = windowStartMins;

      while (currentMins + duration <= windowEndMins) {
        const slotStart = this.minutesToTime(currentMins);
        const slotEnd = this.minutesToTime(currentMins + duration);

        // Check if slot is blocked by override
        const isBlocked = blockedRanges.some((block) => {
          if (!block.startTime || !block.endTime) return false;
          const blockStart = this.timeToMinutes(block.startTime);
          const blockEnd = this.timeToMinutes(block.endTime);
          return currentMins < blockEnd && currentMins + duration > blockStart;
        });

        // Check if slot conflicts with existing bookings
        const isBooked = existingBookings.some((booking) => {
          const bookingStart = this.timeToMinutes(booking.startTime);
          const bookingEnd = this.timeToMinutes(booking.endTime);
          return currentMins < bookingEnd && currentMins + duration > bookingStart;
        });

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          available: !isBlocked && !isBooked,
        });

        currentMins += slotDuration;
      }
    }

    return slots;
  }

  /**
   * Convert "HH:mm" time string to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to "HH:mm" time string
   */
  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
}

// =============================================================================
// Factory
// =============================================================================

let providerServiceInstance: ProviderService | null = null;

export function getProviderService(): ProviderService {
  if (!providerServiceInstance) {
    providerServiceInstance = new ProviderService();
  }
  return providerServiceInstance;
}

export default ProviderService;
