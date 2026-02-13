// =============================================================================
// Booking Reminder Service
// =============================================================================
// Business logic for scheduling, listing, and managing booking reminders.
// Uses placeholder db operations - replace with actual Prisma client.

// =============================================================================
// Types
// =============================================================================

export type ReminderType = 'EMAIL' | 'SMS' | 'PUSH';

interface ReminderRecord {
  id: string;
  bookingId: string;
  type: ReminderType;
  scheduledAt: Date;
  sentAt: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================
// Replace with actual Prisma client:
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  async createReminder(data: {
    bookingId: string;
    type: ReminderType;
    scheduledAt: Date;
    status: string;
  }): Promise<ReminderRecord> {
    // Replace with: return db.reminder.create({ data });
    console.log('[DB] Creating reminder for booking:', data.bookingId, 'type:', data.type);
    return {
      id: 'reminder_' + Date.now(),
      bookingId: data.bookingId,
      type: data.type,
      scheduledAt: data.scheduledAt,
      sentAt: null,
      status: data.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async findPendingReminders(): Promise<ReminderRecord[]> {
    // Replace with:
    // return db.reminder.findMany({
    //   where: {
    //     status: 'PENDING',
    //     scheduledAt: { lte: new Date() },
    //   },
    //   include: { booking: { include: { service: true, provider: { include: { user: true } }, user: true } } },
    //   orderBy: { scheduledAt: 'asc' },
    // });
    console.log('[DB] Finding pending reminders due for sending');
    return [];
  },

  async markAsSent(id: string): Promise<ReminderRecord | null> {
    // Replace with: return db.reminder.update({ where: { id }, data: { status: 'SENT', sentAt: new Date(), updatedAt: new Date() } });
    console.log('[DB] Marking reminder as sent:', id);
    return null;
  },

  async findRemindersByBooking(bookingId: string): Promise<ReminderRecord[]> {
    // Replace with: return db.reminder.findMany({ where: { bookingId }, orderBy: { scheduledAt: 'asc' } });
    console.log('[DB] Finding reminders for booking:', bookingId);
    return [];
  },

  async cancelRemindersByBooking(bookingId: string): Promise<number> {
    // Replace with:
    // const result = await db.reminder.updateMany({
    //   where: { bookingId, status: 'PENDING' },
    //   data: { status: 'CANCELLED', updatedAt: new Date() },
    // });
    // return result.count;
    console.log('[DB] Cancelling reminders for booking:', bookingId);
    return 0;
  },

  async findReminderById(id: string): Promise<ReminderRecord | null> {
    // Replace with: return db.reminder.findUnique({ where: { id } });
    console.log('[DB] Finding reminder by ID:', id);
    return null;
  },
};

// =============================================================================
// Reminder Service
// =============================================================================

export class ReminderService {
  /**
   * Schedule a reminder for a booking
   */
  async scheduleReminder(
    bookingId: string,
    type: ReminderType,
    scheduledAt: Date,
  ): Promise<ReminderRecord> {
    if (scheduledAt <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    return dbOperations.createReminder({
      bookingId,
      type,
      scheduledAt,
      status: 'PENDING',
    });
  }

  /**
   * List all pending reminders that are due for sending
   */
  async listPendingReminders(): Promise<ReminderRecord[]> {
    return dbOperations.findPendingReminders();
  }

  /**
   * Mark a reminder as sent after successful delivery
   */
  async markAsSent(id: string): Promise<ReminderRecord | null> {
    const reminder = await dbOperations.findReminderById(id);
    if (!reminder) {
      throw new Error('Reminder not found');
    }

    if (reminder.status !== 'PENDING') {
      throw new Error('Only pending reminders can be marked as sent');
    }

    return dbOperations.markAsSent(id);
  }

  /**
   * Cancel all pending reminders for a booking (e.g., when booking is cancelled)
   */
  async cancelReminders(bookingId: string): Promise<number> {
    return dbOperations.cancelRemindersByBooking(bookingId);
  }
}

// =============================================================================
// Factory
// =============================================================================

let reminderServiceInstance: ReminderService | null = null;

export function getReminderService(): ReminderService {
  if (!reminderServiceInstance) {
    reminderServiceInstance = new ReminderService();
  }
  return reminderServiceInstance;
}

export default ReminderService;
