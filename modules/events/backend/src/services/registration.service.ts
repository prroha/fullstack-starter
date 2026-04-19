// =============================================================================
// Registration Service
// =============================================================================
// Business logic for event registrations: register, cancel, confirm, check-in.
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface RegistrationCreateInput {
  eventId: string;
  userId: string;
  attendeeName: string;
  attendeeEmail: string;
  notes?: string;
}

export interface RegistrationFilters {
  eventId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// =============================================================================
// Helpers
// =============================================================================

function generateRegistrationNumber(): string {
  const prefix = 'EVT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// =============================================================================
// Registration Service
// =============================================================================

export class RegistrationService {
  constructor(private db: PrismaClient) {}

  async register(input: RegistrationCreateInput) {
    return this.db.eventRegistration.create({
      data: {
        eventId: input.eventId,
        userId: input.userId,
        status: 'PENDING',
        registrationNumber: generateRegistrationNumber(),
        attendeeName: input.attendeeName,
        attendeeEmail: input.attendeeEmail,
        notes: input.notes || null,
      },
      include: { event: true },
    });
  }

  private async changeStatus(id: string, userId: string, status: string, extra?: Record<string, unknown>) {
    // Registration belongs to user if the parent event belongs to user
    const registration = await this.db.eventRegistration.findFirst({
      where: { id, event: { userId } },
    });
    if (!registration) throw new Error('Registration not found');

    return this.db.eventRegistration.update({
      where: { id },
      data: { status: status as 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED' | 'ATTENDED', ...extra },
      include: { event: true },
    });
  }

  async cancel(id: string, userId: string) {
    return this.changeStatus(id, userId, 'CANCELLED');
  }

  async confirm(id: string, userId: string) {
    return this.changeStatus(id, userId, 'CONFIRMED');
  }

  async checkIn(id: string, userId: string) {
    return this.changeStatus(id, userId, 'ATTENDED', { checkedInAt: new Date() });
  }

  async getById(id: string, userId: string) {
    return this.db.eventRegistration.findFirst({
      where: { id, event: { userId } },
      include: { event: true },
    });
  }

  async listByEvent(eventId: string) {
    return this.db.eventRegistration.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAll(userId: string, filters: RegistrationFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { event: { userId } };

    if (filters.eventId) where.eventId = filters.eventId;
    if (filters.status) where.status = filters.status;

    if (filters.search) {
      where.OR = [
        { attendeeName: { contains: filters.search, mode: 'insensitive' } },
        { attendeeEmail: { contains: filters.search, mode: 'insensitive' } },
        { registrationNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.db.eventRegistration.findMany({
        where,
        include: { event: { select: { id: true, title: true, startDate: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.db.eventRegistration.count({ where }),
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

  async getStats(userId: string) {
    const [total, confirmed, cancelled, attended] = await Promise.all([
      this.db.eventRegistration.count({ where: { event: { userId } } }),
      this.db.eventRegistration.count({ where: { event: { userId }, status: 'CONFIRMED' } }),
      this.db.eventRegistration.count({ where: { event: { userId }, status: 'CANCELLED' } }),
      this.db.eventRegistration.count({ where: { event: { userId }, status: 'ATTENDED' } }),
    ]);

    return { total, confirmed, cancelled, attended };
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createRegistrationService(db: PrismaClient): RegistrationService {
  return new RegistrationService(db);
}

let instance: RegistrationService | null = null;

export function getRegistrationService(db?: PrismaClient): RegistrationService {
  if (db) return createRegistrationService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new RegistrationService(globalDb);
  }
  return instance;
}

export default RegistrationService;
