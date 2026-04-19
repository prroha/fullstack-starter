// =============================================================================
// Booking Reminder Service
// =============================================================================
// Business logic for scheduling, listing, and managing booking reminders.
// Uses dependency-injected PrismaClient.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export type ReminderType = 'EMAIL' | 'SMS' | 'PUSH';

// =============================================================================
// Reminder Service
// =============================================================================

export class ReminderService {
  constructor(private db: PrismaClient) {}

  /**
   * Schedule a reminder for a booking
   */
  async scheduleReminder(
    bookingId: string,
    type: ReminderType,
    scheduledAt: Date,
  ) {
    if (scheduledAt <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    return this.db.bookingReminder.create({
      data: {
        bookingId,
        type,
        scheduledAt,
      },
    });
  }

  /**
   * List all pending reminders that are due for sending
   */
  async listPendingReminders() {
    return this.db.bookingReminder.findMany({
      where: {
        sentAt: null,
        scheduledAt: { lte: new Date() },
      },
      include: {
        booking: {
          include: { service: true, provider: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  /**
   * Mark a reminder as sent after successful delivery
   */
  async markAsSent(id: string) {
    const reminder = await this.db.bookingReminder.findUnique({ where: { id } });
    if (!reminder) {
      throw new Error('Reminder not found');
    }

    if (reminder.sentAt) {
      throw new Error('Reminder has already been sent');
    }

    return this.db.bookingReminder.update({
      where: { id },
      data: { sentAt: new Date() },
    });
  }

  /**
   * Cancel all pending reminders for a booking (by deleting unsent ones)
   */
  async cancelReminders(bookingId: string): Promise<number> {
    const result = await this.db.bookingReminder.deleteMany({
      where: {
        bookingId,
        sentAt: null,
      },
    });
    return result.count;
  }

  /**
   * List reminders for a specific booking
   */
  async listRemindersByBooking(bookingId: string) {
    return this.db.bookingReminder.findMany({
      where: { bookingId },
      orderBy: { scheduledAt: 'asc' },
    });
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createReminderService(db: PrismaClient): ReminderService {
  return new ReminderService(db);
}

let instance: ReminderService | null = null;
export function getReminderService(db?: PrismaClient): ReminderService {
  if (db) return createReminderService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new ReminderService(globalDb);
  }
  return instance;
}

export default ReminderService;
