// =============================================================================
// Booking Service
// =============================================================================
// Business logic for booking creation, conflict detection, lifecycle management,
// and admin analytics. Uses dependency-injected PrismaClient.

import type { PrismaClient, Prisma } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface BookingCreateInput {
  userId: string;
  serviceId: string;
  providerId: string;
  date: string;
  startTime: string;
  notes?: string;
}

export interface BookingRescheduleInput {
  date: string;
  startTime: string;
}

export interface BookingFilters {
  status?: string;
  search?: string;
  providerId?: string;
  serviceId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface BookingStats {
  totalBookings: number;
  todayBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  revenue: number;
}

// =============================================================================
// Booking Service
// =============================================================================

export class BookingService {
  constructor(private db: PrismaClient) {}

  /**
   * Generate a unique booking number
   */
  private generateBookingNumber(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `BK-${result}`;
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

  /**
   * Get available time slots for a provider+service on a given date.
   * Merges weekly schedule + overrides, generates time slots based on
   * service duration + buffer, and subtracts existing bookings.
   */
  async getAvailableSlots(providerId: string, serviceId: string, date: string): Promise<string[]> {
    const serviceInfo = await this.db.bookingService.findUnique({
      where: { id: serviceId },
      select: { id: true, name: true, duration: true, bufferTime: true, price: true, status: true },
    });
    if (!serviceInfo) {
      throw new Error('Service not found');
    }

    const { duration, bufferTime } = serviceInfo;
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

    // Build available time windows
    const windows: Array<{ start: string; end: string }> = [];

    // Custom override windows take precedence
    const customOverrides = overrides.filter((o) => !o.isBlocked && o.startTime && o.endTime);
    if (customOverrides.length > 0) {
      for (const override of customOverrides) {
        if (override.startTime && override.endTime) {
          windows.push({ start: override.startTime, end: override.endTime });
        }
      }
    } else {
      for (const schedule of schedules) {
        windows.push({ start: schedule.startTime, end: schedule.endTime });
      }
    }

    // Blocked time ranges
    const blockedRanges = overrides.filter((o) => o.isBlocked && o.startTime && o.endTime);

    // Existing bookings for the full day
    const existingBookings = await this.db.booking.findMany({
      where: {
        providerId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    // Generate available slot start times
    const availableSlots: string[] = [];
    const slotDuration = duration + bufferTime;

    for (const window of windows) {
      const windowStartMins = this.timeToMinutes(window.start);
      const windowEndMins = this.timeToMinutes(window.end);

      let currentMins = windowStartMins;

      while (currentMins + duration <= windowEndMins) {
        const slotStart = this.minutesToTime(currentMins);
        const slotEndMins = currentMins + duration;

        // Check blocked ranges
        const isBlocked = blockedRanges.some((block) => {
          if (!block.startTime || !block.endTime) return false;
          const blockStart = this.timeToMinutes(block.startTime);
          const blockEnd = this.timeToMinutes(block.endTime);
          return currentMins < blockEnd && slotEndMins > blockStart;
        });

        // Check existing bookings
        const isBooked = existingBookings.some((booking) => {
          const bookingStart = this.timeToMinutes(booking.startTime);
          const bookingEnd = this.timeToMinutes(booking.endTime);
          return currentMins < bookingEnd && slotEndMins > bookingStart;
        });

        if (!isBlocked && !isBooked) {
          availableSlots.push(slotStart);
        }

        currentMins += slotDuration;
      }
    }

    return availableSlots;
  }

  /**
   * Create a new booking.
   * Validates service is active, provider offers service, and slot is available.
   * Generates booking number and calculates end time from duration.
   */
  async createBooking(input: BookingCreateInput) {
    // Validate service exists and is active
    const serviceInfo = await this.db.bookingService.findUnique({
      where: { id: input.serviceId },
      select: { id: true, name: true, duration: true, bufferTime: true, price: true, status: true },
    });
    if (!serviceInfo) {
      throw new Error('Service not found');
    }
    if (serviceInfo.status !== 'ACTIVE') {
      throw new Error('Service is not currently available for booking');
    }

    // Validate provider offers this service
    const providerService = await this.db.providerService.findUnique({
      where: { providerId_serviceId: { providerId: input.providerId, serviceId: input.serviceId } },
    });
    if (!providerService) {
      throw new Error('Provider does not offer this service');
    }

    // Calculate end time
    const startMins = this.timeToMinutes(input.startTime);
    const endTime = this.minutesToTime(startMins + serviceInfo.duration);

    // Check for conflicting bookings
    const bookingDate = new Date(input.date);
    const startOfDay = new Date(input.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(input.date);
    endOfDay.setHours(23, 59, 59, 999);

    const conflicts = await this.db.booking.findMany({
      where: {
        providerId: input.providerId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: input.startTime } },
        ],
      },
    });
    if (conflicts.length > 0) {
      throw new Error('This time slot is no longer available');
    }

    // Validate slot is within provider schedule
    const availableSlots = await this.getAvailableSlots(input.providerId, input.serviceId, input.date);
    if (!availableSlots.includes(input.startTime)) {
      throw new Error('Selected time slot is not available');
    }

    // Generate booking number
    const bookingNumber = this.generateBookingNumber();

    return this.db.booking.create({
      data: {
        bookingNumber,
        userId: input.userId,
        serviceId: input.serviceId,
        providerId: input.providerId,
        date: bookingDate,
        startTime: input.startTime,
        endTime,
        totalAmount: serviceInfo.price,
        notes: input.notes || null,
        status: 'PENDING',
      },
      include: { service: true, provider: true },
    });
  }

  /**
   * List bookings for a user with filtering and pagination
   */
  async listUserBookings(filters: BookingFilters & { userId: string }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Prisma.BookingWhereInput = {
      userId: filters.userId,
      ...(filters.status ? { status: filters.status as Prisma.EnumBookingStatusFilter } : {}),
    };

    const [items, total] = await Promise.all([
      this.db.booking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { service: true, provider: true },
        orderBy: { date: 'desc' },
      }),
      this.db.booking.count({ where }),
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
   * List bookings for a provider with filtering and pagination
   */
  async listProviderBookings(providerId: string, filters: BookingFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Prisma.BookingWhereInput = {
      providerId,
      ...(filters.status ? { status: filters.status as Prisma.EnumBookingStatusFilter } : {}),
      ...(filters.search
        ? {
            OR: [
              { bookingNumber: { contains: filters.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.db.booking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { service: true },
        orderBy: { date: 'desc' },
      }),
      this.db.booking.count({ where }),
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
   * Get a single booking by ID
   */
  async getBookingById(id: string) {
    return this.db.booking.findUnique({
      where: { id },
      include: { service: true, provider: true },
    });
  }

  /**
   * Cancel a booking with reason
   */
  async cancelBooking(id: string, reason?: string) {
    const booking = await this.db.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw new Error('Booking is already cancelled');
    }

    if (booking.status === 'COMPLETED') {
      throw new Error('Cannot cancel a completed booking');
    }

    return this.db.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelReason: reason || null,
      },
      include: { service: true, provider: true },
    });
  }

  /**
   * Reschedule a booking to a new date/time
   */
  async rescheduleBooking(id: string, input: BookingRescheduleInput) {
    const booking = await this.db.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw new Error('Cannot reschedule a cancelled or completed booking');
    }

    // Get service info for duration calculation
    const serviceInfo = await this.db.bookingService.findUnique({
      where: { id: booking.serviceId },
      select: { duration: true },
    });
    if (!serviceInfo) {
      throw new Error('Service not found');
    }

    // Calculate new end time
    const startMins = this.timeToMinutes(input.startTime);
    const newEndTime = this.minutesToTime(startMins + serviceInfo.duration);

    // Check for conflicts at the new time (excluding current booking)
    const newDate = new Date(input.date);
    const startOfDay = new Date(input.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(input.date);
    endOfDay.setHours(23, 59, 59, 999);

    const conflicts = await this.db.booking.findMany({
      where: {
        providerId: booking.providerId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: ['PENDING', 'CONFIRMED'] },
        id: { not: id },
        OR: [
          { startTime: { lt: newEndTime }, endTime: { gt: input.startTime } },
        ],
      },
    });
    if (conflicts.length > 0) {
      throw new Error('New time slot is not available');
    }

    // Validate new slot is within provider schedule
    const availableSlots = await this.getAvailableSlots(booking.providerId, booking.serviceId, input.date);
    if (!availableSlots.includes(input.startTime)) {
      throw new Error('Selected time slot is not available');
    }

    return this.db.booking.update({
      where: { id },
      data: {
        date: newDate,
        startTime: input.startTime,
        endTime: newEndTime,
      },
      include: { service: true, provider: true },
    });
  }

  /**
   * Confirm a pending booking
   */
  async confirmBooking(id: string) {
    const booking = await this.db.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'PENDING') {
      throw new Error('Only pending bookings can be confirmed');
    }

    return this.db.booking.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: { service: true, provider: true },
    });
  }

  /**
   * Mark a booking as completed
   */
  async completeBooking(id: string) {
    const booking = await this.db.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new Error('Only confirmed bookings can be completed');
    }

    return this.db.booking.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: { service: true, provider: true },
    });
  }

  /**
   * Mark a booking as no-show
   */
  async markNoShow(id: string) {
    const booking = await this.db.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new Error('Only confirmed bookings can be marked as no-show');
    }

    return this.db.booking.update({
      where: { id },
      data: { status: 'NO_SHOW' },
      include: { service: true, provider: true },
    });
  }

  /**
   * Update booking status (admin override)
   */
  async updateBookingStatus(id: string, status: string) {
    const booking = await this.db.booking.findUnique({ where: { id } });
    if (!booking) {
      return null;
    }

    return this.db.booking.update({
      where: { id },
      data: { status: status as 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' },
      include: { service: true, provider: true },
    });
  }

  /**
   * List all bookings (admin view) with filtering and pagination
   */
  async listAllBookings(filters: BookingFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Prisma.BookingWhereInput = {
      ...(filters.status ? { status: filters.status as Prisma.EnumBookingStatusFilter } : {}),
      ...(filters.providerId ? { providerId: filters.providerId } : {}),
      ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
      ...(filters.startDate || filters.endDate
        ? {
            date: {
              ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
              ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
            },
          }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { bookingNumber: { contains: filters.search, mode: 'insensitive' as const } },
              { service: { name: { contains: filters.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.db.booking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { service: true, provider: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.db.booking.count({ where }),
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
   * Get aggregate booking statistics for admin dashboard
   */
  async getBookingStats(): Promise<BookingStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalBookings, todayBookings, completedBookings, cancelledBookings, revenueResult] = await Promise.all([
      this.db.booking.count(),
      this.db.booking.count({ where: { date: { gte: today, lt: tomorrow } } }),
      this.db.booking.count({ where: { status: 'COMPLETED' } }),
      this.db.booking.count({ where: { status: 'CANCELLED' } }),
      this.db.booking.aggregate({ where: { status: 'COMPLETED' }, _sum: { totalAmount: true } }),
    ]);

    return {
      totalBookings,
      todayBookings,
      completedBookings,
      cancelledBookings,
      revenue: revenueResult._sum.totalAmount || 0,
    };
  }

  /**
   * Export bookings as CSV
   */
  async exportBookings(filters: { status?: string; startDate?: string; endDate?: string }): Promise<string> {
    const where: Prisma.BookingWhereInput = {
      ...(filters.status ? { status: filters.status as Prisma.EnumBookingStatusFilter } : {}),
      ...(filters.startDate || filters.endDate
        ? {
            date: {
              ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
              ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
            },
          }
        : {}),
    };

    const bookings = await this.db.booking.findMany({
      where,
      include: { service: true, provider: true },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'Booking Number,Service,Provider ID,Date,Start Time,End Time,Status,Amount,Currency,Notes\n';
    const rows = bookings.map((b) =>
      [
        b.bookingNumber,
        b.service.name,
        b.providerId,
        b.date.toISOString().split('T')[0],
        b.startTime,
        b.endTime,
        b.status,
        b.totalAmount,
        b.currency,
        (b.notes || '').replace(/,/g, ';'),
      ].join(','),
    );

    return header + rows.join('\n');
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createBookingService(db: PrismaClient): BookingService {
  return new BookingService(db);
}

let instance: BookingService | null = null;
export function getBookingService(db?: PrismaClient): BookingService {
  if (db) return createBookingService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new BookingService(globalDb);
  }
  return instance;
}

export default BookingService;
