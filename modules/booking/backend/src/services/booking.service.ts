// =============================================================================
// Booking Service
// =============================================================================
// Business logic for booking creation, conflict detection, lifecycle management,
// and admin analytics. Uses placeholder db operations - replace with actual Prisma client.

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

interface BookingRecord {
  id: string;
  bookingNumber: string;
  userId: string;
  serviceId: string;
  providerId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number;
  notes: string | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ServiceInfoRecord {
  id: string;
  name: string;
  duration: number;
  bufferTime: number;
  price: number;
  status: string;
}

interface ProviderServiceCheck {
  providerId: string;
  serviceId: string;
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
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================
// Replace with actual Prisma client:
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  async findServiceInfo(serviceId: string): Promise<ServiceInfoRecord | null> {
    // Replace with: return db.service.findUnique({ where: { id: serviceId }, select: { id: true, name: true, duration: true, bufferTime: true, price: true, status: true } });
    console.log('[DB] Finding service info:', serviceId);
    return null;
  },

  async checkProviderOffersService(providerId: string, serviceId: string): Promise<ProviderServiceCheck | null> {
    // Replace with: return db.providerService.findUnique({ where: { providerId_serviceId: { providerId, serviceId } } });
    console.log('[DB] Checking provider offers service:', providerId, serviceId);
    return null;
  },

  async getScheduleForDay(providerId: string, dayOfWeek: number): Promise<ScheduleRecord[]> {
    // Replace with: return db.schedule.findMany({ where: { providerId, dayOfWeek, isActive: true }, orderBy: { startTime: 'asc' } });
    console.log('[DB] Getting schedule for day:', providerId, dayOfWeek);
    return [];
  },

  async getOverridesForDate(providerId: string, date: string): Promise<ScheduleOverrideRecord[]> {
    // Replace with: return db.scheduleOverride.findMany({ where: { providerId, date } });
    console.log('[DB] Getting overrides for date:', providerId, date);
    return [];
  },

  async getConflictingBookings(providerId: string, date: string, startTime: string, endTime: string): Promise<BookingRecord[]> {
    // Replace with:
    // return db.booking.findMany({
    //   where: {
    //     providerId,
    //     date,
    //     status: { in: ['PENDING', 'CONFIRMED'] },
    //     OR: [
    //       { startTime: { lt: endTime }, endTime: { gt: startTime } },
    //     ],
    //   },
    // });
    console.log('[DB] Checking conflicting bookings:', providerId, date, startTime, endTime);
    return [];
  },

  async createBooking(data: {
    bookingNumber: string;
    userId: string;
    serviceId: string;
    providerId: string;
    date: string;
    startTime: string;
    endTime: string;
    price: number;
    notes: string | null;
    status: string;
  }): Promise<BookingRecord> {
    // Replace with: return db.booking.create({ data, include: { service: true, provider: { include: { user: true } } } });
    console.log('[DB] Creating booking:', data.bookingNumber);
    return {
      id: 'booking_' + Date.now(),
      ...data,
      cancellationReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async findBookingById(id: string): Promise<BookingRecord | null> {
    // Replace with: return db.booking.findUnique({ where: { id }, include: { service: true, provider: { include: { user: true } }, user: true } });
    console.log('[DB] Finding booking by ID:', id);
    return null;
  },

  async findUserBookings(userId: string, filters: BookingFilters): Promise<{ items: BookingRecord[]; total: number }> {
    // Replace with:
    // const where = { userId, status: filters.status || undefined };
    // const [items, total] = await Promise.all([
    //   db.booking.findMany({ where, skip: ((filters.page || 1) - 1) * (filters.limit || 20), take: filters.limit || 20, include: { service: true, provider: { include: { user: true } } }, orderBy: { date: 'desc' } }),
    //   db.booking.count({ where }),
    // ]);
    console.log('[DB] Finding user bookings:', userId, filters);
    return { items: [], total: 0 };
  },

  async findProviderBookings(providerId: string, filters: BookingFilters): Promise<{ items: BookingRecord[]; total: number }> {
    // Replace with:
    // const where = {
    //   providerId,
    //   status: filters.status || undefined,
    //   OR: filters.search ? [
    //     { bookingNumber: { contains: filters.search, mode: 'insensitive' } },
    //     { user: { name: { contains: filters.search, mode: 'insensitive' } } },
    //   ] : undefined,
    // };
    // const [items, total] = await Promise.all([
    //   db.booking.findMany({ where, skip: ((filters.page || 1) - 1) * (filters.limit || 20), take: filters.limit || 20, include: { service: true, user: true }, orderBy: { date: 'desc' } }),
    //   db.booking.count({ where }),
    // ]);
    console.log('[DB] Finding provider bookings:', providerId, filters);
    return { items: [], total: 0 };
  },

  async findAllBookings(filters: BookingFilters): Promise<{ items: BookingRecord[]; total: number }> {
    // Replace with:
    // const where = {
    //   status: filters.status || undefined,
    //   OR: filters.search ? [
    //     { bookingNumber: { contains: filters.search, mode: 'insensitive' } },
    //     { user: { name: { contains: filters.search, mode: 'insensitive' } } },
    //     { service: { name: { contains: filters.search, mode: 'insensitive' } } },
    //   ] : undefined,
    // };
    // const [items, total] = await Promise.all([
    //   db.booking.findMany({ where, skip: ((filters.page || 1) - 1) * (filters.limit || 20), take: filters.limit || 20, include: { service: true, provider: { include: { user: true } }, user: true }, orderBy: { createdAt: 'desc' } }),
    //   db.booking.count({ where }),
    // ]);
    console.log('[DB] Finding all bookings:', filters);
    return { items: [], total: 0 };
  },

  async updateBookingStatus(id: string, status: string, extra?: { cancellationReason?: string; date?: string; startTime?: string; endTime?: string }): Promise<BookingRecord | null> {
    // Replace with: return db.booking.update({ where: { id }, data: { status, ...extra, updatedAt: new Date() } });
    console.log('[DB] Updating booking status:', id, status);
    return null;
  },

  async getBookingStats(): Promise<BookingStats> {
    // Replace with:
    // const today = new Date().toISOString().split('T')[0];
    // const [totalBookings, todayBookings, completedBookings, cancelledBookings, revenueResult] = await Promise.all([
    //   db.booking.count(),
    //   db.booking.count({ where: { date: today } }),
    //   db.booking.count({ where: { status: 'COMPLETED' } }),
    //   db.booking.count({ where: { status: 'CANCELLED' } }),
    //   db.booking.aggregate({ where: { status: 'COMPLETED' }, _sum: { price: true } }),
    // ]);
    console.log('[DB] Getting booking stats');
    return {
      totalBookings: 0,
      todayBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      revenue: 0,
    };
  },
};

// =============================================================================
// Booking Service
// =============================================================================

export class BookingService {
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
    const serviceInfo = await dbOperations.findServiceInfo(serviceId);
    if (!serviceInfo) {
      throw new Error('Service not found');
    }

    const { duration, bufferTime } = serviceInfo;
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Get weekly schedule for this day
    const schedules = await dbOperations.getScheduleForDay(providerId, dayOfWeek);

    // Get overrides for this specific date
    const overrides = await dbOperations.getOverridesForDate(providerId, date);

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

    // Existing bookings
    const existingBookings = await dbOperations.getConflictingBookings(providerId, date, '00:00', '23:59');

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
  async createBooking(input: BookingCreateInput): Promise<BookingRecord> {
    // Validate service exists and is active
    const serviceInfo = await dbOperations.findServiceInfo(input.serviceId);
    if (!serviceInfo) {
      throw new Error('Service not found');
    }
    if (serviceInfo.status !== 'ACTIVE') {
      throw new Error('Service is not currently available for booking');
    }

    // Validate provider offers this service
    const providerService = await dbOperations.checkProviderOffersService(input.providerId, input.serviceId);
    if (!providerService) {
      throw new Error('Provider does not offer this service');
    }

    // Calculate end time
    const startMins = this.timeToMinutes(input.startTime);
    const endTime = this.minutesToTime(startMins + serviceInfo.duration);

    // Check for conflicting bookings
    const conflicts = await dbOperations.getConflictingBookings(
      input.providerId,
      input.date,
      input.startTime,
      endTime,
    );
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

    return dbOperations.createBooking({
      bookingNumber,
      userId: input.userId,
      serviceId: input.serviceId,
      providerId: input.providerId,
      date: input.date,
      startTime: input.startTime,
      endTime,
      price: serviceInfo.price,
      notes: input.notes || null,
      status: 'PENDING',
    });
  }

  /**
   * List bookings for a user with filtering and pagination
   */
  async listUserBookings(userId: string, filters: BookingFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await dbOperations.findUserBookings(userId, {
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
   * List bookings for a provider with filtering and pagination
   */
  async listProviderBookings(providerId: string, filters: BookingFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await dbOperations.findProviderBookings(providerId, {
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
   * Get a single booking by ID
   */
  async getBookingById(id: string) {
    return dbOperations.findBookingById(id);
  }

  /**
   * Cancel a booking with reason
   */
  async cancelBooking(id: string, reason?: string) {
    const booking = await dbOperations.findBookingById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw new Error('Booking is already cancelled');
    }

    if (booking.status === 'COMPLETED') {
      throw new Error('Cannot cancel a completed booking');
    }

    return dbOperations.updateBookingStatus(id, 'CANCELLED', {
      cancellationReason: reason,
    });
  }

  /**
   * Reschedule a booking to a new date/time
   */
  async rescheduleBooking(id: string, input: BookingRescheduleInput) {
    const booking = await dbOperations.findBookingById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw new Error('Cannot reschedule a cancelled or completed booking');
    }

    // Get service info for duration calculation
    const serviceInfo = await dbOperations.findServiceInfo(booking.serviceId);
    if (!serviceInfo) {
      throw new Error('Service not found');
    }

    // Calculate new end time
    const startMins = this.timeToMinutes(input.startTime);
    const newEndTime = this.minutesToTime(startMins + serviceInfo.duration);

    // Check for conflicts at the new time (excluding current booking)
    const conflicts = await dbOperations.getConflictingBookings(
      booking.providerId,
      input.date,
      input.startTime,
      newEndTime,
    );
    const realConflicts = conflicts.filter((c) => c.id !== id);
    if (realConflicts.length > 0) {
      throw new Error('New time slot is not available');
    }

    // Validate new slot is within provider schedule
    const availableSlots = await this.getAvailableSlots(booking.providerId, booking.serviceId, input.date);
    if (!availableSlots.includes(input.startTime)) {
      throw new Error('Selected time slot is not available');
    }

    return dbOperations.updateBookingStatus(id, booking.status, {
      date: input.date,
      startTime: input.startTime,
      endTime: newEndTime,
    });
  }

  /**
   * Confirm a pending booking
   */
  async confirmBooking(id: string) {
    const booking = await dbOperations.findBookingById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'PENDING') {
      throw new Error('Only pending bookings can be confirmed');
    }

    return dbOperations.updateBookingStatus(id, 'CONFIRMED');
  }

  /**
   * Mark a booking as completed
   */
  async completeBooking(id: string) {
    const booking = await dbOperations.findBookingById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new Error('Only confirmed bookings can be completed');
    }

    return dbOperations.updateBookingStatus(id, 'COMPLETED');
  }

  /**
   * Mark a booking as no-show
   */
  async markNoShow(id: string) {
    const booking = await dbOperations.findBookingById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new Error('Only confirmed bookings can be marked as no-show');
    }

    return dbOperations.updateBookingStatus(id, 'NO_SHOW');
  }

  /**
   * List all bookings (admin view) with filtering and pagination
   */
  async listAllBookings(filters: BookingFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await dbOperations.findAllBookings({
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
   * Get aggregate booking statistics for admin dashboard
   */
  async getBookingStats(): Promise<BookingStats> {
    return dbOperations.getBookingStats();
  }
}

// =============================================================================
// Factory
// =============================================================================

let bookingServiceInstance: BookingService | null = null;

export function getBookingService(): BookingService {
  if (!bookingServiceInstance) {
    bookingServiceInstance = new BookingService();
  }
  return bookingServiceInstance;
}

export default BookingService;
