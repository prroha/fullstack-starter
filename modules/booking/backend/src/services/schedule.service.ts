// =============================================================================
// Booking Schedule Service
// =============================================================================
// Business logic for weekly schedule management and date-specific overrides.
// Uses placeholder db operations - replace with actual Prisma client.

// =============================================================================
// Types
// =============================================================================

export interface ScheduleInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface OverrideCreateInput {
  providerId: string;
  date: string;
  isBlocked: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface OverrideFilters {
  startDate?: string;
  endDate?: string;
}

interface ScheduleRecord {
  id: string;
  providerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ScheduleOverrideRecord {
  id: string;
  providerId: string;
  date: string;
  isBlocked: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================
// TODO: Implement with Prisma when booking schema is provisioned.
// Currently returns empty/mock data. Replace placeholder calls with actual
// Prisma client queries (e.g., db.schedule.create({ data })).
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  // TODO: Implement with Prisma — db.schedule.findMany({ where: { providerId }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] })
  async findWeeklySchedule(providerId: string): Promise<ScheduleRecord[]> {
    void providerId;
    return [];
  },

  // TODO: Implement with Prisma — db.schedule.upsert({ where: { providerId_dayOfWeek }, create, update })
  async upsertSchedule(providerId: string, data: ScheduleInput): Promise<ScheduleRecord> {
    return {
      id: 'schedule_' + Date.now(),
      providerId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      isActive: data.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  // TODO: Implement with Prisma — db.schedule.deleteMany({ where: { providerId } })
  async deleteSchedulesForProvider(providerId: string): Promise<void> {
    void providerId;
  },

  // TODO: Implement with Prisma — db.scheduleOverride.findMany with date range filters
  async findOverrides(providerId: string, _filters: OverrideFilters): Promise<ScheduleOverrideRecord[]> {
    void providerId;
    return [];
  },

  // TODO: Implement with Prisma — db.scheduleOverride.create({ data })
  async createOverride(data: {
    providerId: string;
    date: string;
    isBlocked: boolean;
    startTime: string | null;
    endTime: string | null;
    reason: string | null;
  }): Promise<ScheduleOverrideRecord> {
    return {
      id: 'override_' + Date.now(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  // TODO: Implement with Prisma — db.scheduleOverride.findUnique({ where: { id } })
  async findOverrideById(id: string): Promise<ScheduleOverrideRecord | null> {
    void id;
    return null;
  },

  // TODO: Implement with Prisma — db.scheduleOverride.delete({ where: { id } })
  async deleteOverride(id: string): Promise<void> {
    void id;
  },
};

// =============================================================================
// Schedule Service
// =============================================================================

export class ScheduleService {
  /**
   * Get the full weekly schedule for a provider (all 7 days)
   */
  async getWeeklySchedule(providerId: string): Promise<ScheduleRecord[]> {
    return dbOperations.findWeeklySchedule(providerId);
  }

  /**
   * Update the weekly schedule for a provider.
   * Replaces all existing schedule entries with the new set.
   */
  async updateWeeklySchedule(
    providerId: string,
    schedules: ScheduleInput[],
  ): Promise<ScheduleRecord[]> {
    // Validate inputs
    for (const schedule of schedules) {
      if (schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
        throw new Error(`Invalid day of week: ${schedule.dayOfWeek}. Must be 0-6 (Sunday-Saturday).`);
      }

      if (schedule.isActive) {
        if (!schedule.startTime || !schedule.endTime) {
          throw new Error(`Start and end times are required for active days.`);
        }

        const startMins = this.timeToMinutes(schedule.startTime);
        const endMins = this.timeToMinutes(schedule.endTime);

        if (startMins >= endMins) {
          throw new Error(`Start time must be before end time for day ${schedule.dayOfWeek}.`);
        }
      }
    }

    // Delete existing schedules and create new ones
    await dbOperations.deleteSchedulesForProvider(providerId);

    const results: ScheduleRecord[] = [];
    for (const schedule of schedules) {
      const record = await dbOperations.upsertSchedule(providerId, schedule);
      results.push(record);
    }

    return results;
  }

  /**
   * List schedule overrides for a provider within an optional date range
   */
  async listOverrides(providerId: string, filters: OverrideFilters): Promise<ScheduleOverrideRecord[]> {
    return dbOperations.findOverrides(providerId, filters);
  }

  /**
   * Create a schedule override (day off, custom hours, etc.)
   */
  async createOverride(input: OverrideCreateInput): Promise<ScheduleOverrideRecord> {
    // Validate time range if provided
    if (input.startTime && input.endTime) {
      const startMins = this.timeToMinutes(input.startTime);
      const endMins = this.timeToMinutes(input.endTime);

      if (startMins >= endMins) {
        throw new Error('Start time must be before end time.');
      }
    }

    // If blocked without specific times, it blocks the entire day
    if (input.isBlocked && !input.startTime && !input.endTime) {
      // Full day block - valid
    }

    return dbOperations.createOverride({
      providerId: input.providerId,
      date: input.date,
      isBlocked: input.isBlocked,
      startTime: input.startTime || null,
      endTime: input.endTime || null,
      reason: input.reason || null,
    });
  }

  /**
   * Delete a schedule override
   */
  async deleteOverride(id: string): Promise<void> {
    const override = await dbOperations.findOverrideById(id);
    if (!override) {
      throw new Error('Schedule override not found');
    }

    return dbOperations.deleteOverride(id);
  }

  /**
   * Convert "HH:mm" time string to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

// =============================================================================
// Factory
// =============================================================================

let scheduleServiceInstance: ScheduleService | null = null;

export function getScheduleService(): ScheduleService {
  if (!scheduleServiceInstance) {
    scheduleServiceInstance = new ScheduleService();
  }
  return scheduleServiceInstance;
}

export default ScheduleService;
