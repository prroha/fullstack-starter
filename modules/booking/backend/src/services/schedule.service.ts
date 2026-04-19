// =============================================================================
// Booking Schedule Service
// =============================================================================
// Business logic for weekly schedule management and date-specific overrides.
// Uses dependency-injected PrismaClient.

import type { PrismaClient, Prisma } from '@prisma/client';

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
  date: string;
  isBlocked?: boolean;
  isAvailable?: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface OverrideFilters {
  startDate?: string;
  endDate?: string;
}

// =============================================================================
// Schedule Service
// =============================================================================

export class ScheduleService {
  constructor(private db: PrismaClient) {}

  /**
   * Get the full weekly schedule for a provider (all 7 days)
   */
  async getWeeklySchedule(providerId: string) {
    return this.db.schedule.findMany({
      where: { providerId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Update the weekly schedule for a provider.
   * Replaces all existing schedule entries with the new set.
   */
  async updateWeeklySchedule(
    providerId: string,
    schedules: ScheduleInput[],
  ) {
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

    // Delete existing schedules and create new ones in a transaction
    return this.db.$transaction(async (tx) => {
      await tx.schedule.deleteMany({ where: { providerId } });

      const results = [];
      for (const schedule of schedules) {
        const record = await tx.schedule.create({
          data: {
            providerId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            isActive: schedule.isActive,
          },
        });
        results.push(record);
      }

      return results;
    });
  }

  /**
   * List schedule overrides for a provider within an optional date range
   */
  async listOverrides(providerId: string, startDate?: string, endDate?: string) {
    const where: Prisma.ScheduleOverrideWhereInput = {
      providerId,
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    return this.db.scheduleOverride.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Create a schedule override (day off, custom hours, etc.)
   */
  async createOverride(providerId: string, input: OverrideCreateInput) {
    // Determine isBlocked: if isAvailable is provided, invert it; otherwise use isBlocked or default to true
    const isBlocked = input.isAvailable !== undefined ? !input.isAvailable : (input.isBlocked ?? true);

    // Validate time range if provided
    if (input.startTime && input.endTime) {
      const startMins = this.timeToMinutes(input.startTime);
      const endMins = this.timeToMinutes(input.endTime);

      if (startMins >= endMins) {
        throw new Error('Start time must be before end time.');
      }
    }

    return this.db.scheduleOverride.create({
      data: {
        providerId,
        date: new Date(input.date),
        isBlocked,
        startTime: input.startTime || null,
        endTime: input.endTime || null,
        reason: input.reason || null,
      },
    });
  }

  /**
   * Delete a schedule override
   */
  async deleteOverride(id: string) {
    const override = await this.db.scheduleOverride.findUnique({ where: { id } });
    if (!override) {
      throw new Error('Schedule override not found');
    }

    await this.db.scheduleOverride.delete({ where: { id } });
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

export function createScheduleService(db: PrismaClient): ScheduleService {
  return new ScheduleService(db);
}

let instance: ScheduleService | null = null;
export function getScheduleService(db?: PrismaClient): ScheduleService {
  if (db) return createScheduleService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new ScheduleService(globalDb);
  }
  return instance;
}

export default ScheduleService;
