// =============================================================================
// Booking Provider Service
// =============================================================================
// Business logic for provider management, service linking, and availability.
// Uses dependency-injected PrismaClient.

import type { PrismaClient, Prisma } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface ProviderCreateInput {
  userId: string;
  bio?: string;
  avatarUrl?: string;
  specialties?: string[];
  [key: string]: unknown;
}

export interface ProviderUpdateInput {
  bio?: string;
  avatarUrl?: string;
  specialties?: string[];
  [key: string]: unknown;
}

export interface ProviderFilters {
  search?: string;
  serviceId?: string;
  page?: number;
  limit?: number;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

// =============================================================================
// Provider Service
// =============================================================================

export class ProviderService {
  constructor(private db: PrismaClient) {}

  /**
   * List providers with filtering and pagination
   */
  async listProviders(filters: ProviderFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Prisma.ProviderWhereInput = {
      isActive: true,
      ...(filters.serviceId
        ? { services: { some: { serviceId: filters.serviceId } } }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { bio: { contains: filters.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.db.provider.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { services: { include: { service: true } } },
      }),
      this.db.provider.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single provider by ID with services and avg rating
   */
  async getProviderById(id: string) {
    const provider = await this.db.provider.findUnique({
      where: { id },
      include: {
        services: { include: { service: true } },
        reviews: true,
      },
    });
    if (!provider) return null;

    const ratingResult = await this.db.bookingReview.aggregate({
      where: { providerId: id },
      _avg: { rating: true },
    });

    const avgRating = ratingResult._avg.rating || 0;
    return { ...provider, avgRating: Math.round(avgRating * 10) / 10 };
  }

  /**
   * Get a provider by user ID
   */
  async getProviderByUserId(userId: string) {
    return this.db.provider.findUnique({
      where: { userId },
      include: { services: { include: { service: true } } },
    });
  }

  /**
   * Create a new provider profile
   */
  async createProvider(input: ProviderCreateInput) {
    return this.db.provider.create({
      data: {
        userId: input.userId,
        bio: input.bio || null,
        avatarUrl: input.avatarUrl || null,
        specialties: input.specialties || [],
      },
      include: { services: { include: { service: true } } },
    });
  }

  /**
   * Update a provider profile
   */
  async updateProvider(id: string, input: ProviderUpdateInput) {
    const existing = await this.db.provider.findUnique({ where: { id } });
    if (!existing) return null;

    return this.db.provider.update({
      where: { id },
      data: {
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        ...(input.specialties !== undefined ? { specialties: input.specialties } : {}),
      },
      include: { services: { include: { service: true } } },
    });
  }

  /**
   * Link a provider to a service they can perform
   */
  async linkService(providerId: string, serviceId: string) {
    return this.db.providerService.create({
      data: { providerId, serviceId },
    });
  }

  /**
   * Unlink a provider from a service
   */
  async unlinkService(providerId: string, serviceId: string) {
    await this.db.providerService.delete({
      where: { providerId_serviceId: { providerId, serviceId } },
    });
  }

  /**
   * Get available time slots for a provider on a given date for a service.
   * Merges weekly schedule + overrides, generates slots based on service
   * duration + buffer, and subtracts existing bookings.
   */
  async getAvailability(providerId: string, serviceId: string, date: string): Promise<TimeSlot[]> {
    // Get service duration info
    const serviceInfo = await this.db.bookingService.findUnique({
      where: { id: serviceId },
      select: { duration: true, bufferTime: true },
    });
    if (!serviceInfo) {
      throw new Error('Service not found');
    }

    const { duration, bufferTime } = serviceInfo;

    // Determine the day of week (0 = Sunday, 6 = Saturday)
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Get weekly schedule for this day
    const schedules = await this.db.schedule.findMany({
      where: { providerId, dayOfWeek, isActive: true },
      orderBy: { startTime: 'asc' },
    });

    // Get overrides for this specific date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const overrides = await this.db.scheduleOverride.findMany({
      where: { providerId, date: { gte: startOfDay, lte: endOfDay } },
    });

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
    const existingBookings = await this.db.booking.findMany({
      where: {
        providerId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { startTime: true, endTime: true },
      orderBy: { startTime: 'asc' },
    });

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

export function createProviderService(db: PrismaClient): ProviderService {
  return new ProviderService(db);
}

let instance: ProviderService | null = null;
export function getProviderService(db?: PrismaClient): ProviderService {
  if (db) return createProviderService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new ProviderService(globalDb);
  }
  return instance;
}

export default ProviderService;
