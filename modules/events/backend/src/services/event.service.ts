// =============================================================================
// Event Service
// =============================================================================
// Business logic for event management: CRUD, filtering, status changes,
// publishing, and dashboard stats.
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface EventCreateInput {
  userId: string;
  categoryId?: string;
  venueId?: string;
  title: string;
  description?: string;
  type?: string;
  status?: string;
  startDate: string;
  endDate: string;
  capacity?: number;
  price?: number;
  currency?: string;
  imageUrl?: string;
  isFeatured?: boolean;
}

export interface EventUpdateInput {
  categoryId?: string;
  venueId?: string;
  title?: string;
  description?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  price?: number;
  currency?: string;
  imageUrl?: string;
  isFeatured?: boolean;
}

export interface EventFilters {
  status?: string;
  type?: string;
  categoryId?: string;
  venueId?: string;
  search?: string;
  startAfter?: string;
  startBefore?: string;
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  confirmedRegistrations: number;
  totalVenues: number;
  totalRevenue: number;
}

// =============================================================================
// Helpers
// =============================================================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
}

// =============================================================================
// Event Service
// =============================================================================

export class EventService {
  constructor(private db: PrismaClient) {}

  async create(input: EventCreateInput) {
    return this.db.event.create({
      data: {
        userId: input.userId,
        categoryId: input.categoryId || null,
        venueId: input.venueId || null,
        title: input.title,
        slug: generateSlug(input.title),
        description: input.description || null,
        type: (input.type as 'IN_PERSON' | 'VIRTUAL' | 'HYBRID') || 'IN_PERSON',
        status: (input.status as 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED' | 'ARCHIVED') || 'DRAFT',
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        capacity: input.capacity ?? null,
        price: input.price ?? 0,
        currency: input.currency || 'USD',
        imageUrl: input.imageUrl || null,
        isFeatured: input.isFeatured ?? false,
      },
      include: { category: true, venue: true },
    });
  }

  async update(id: string, userId: string, input: EventUpdateInput) {
    const event = await this.db.event.findFirst({ where: { id, userId } });
    if (!event) throw new Error('Event not found');

    const data: Record<string, unknown> = {};
    if (input.categoryId !== undefined) data.categoryId = input.categoryId ?? null;
    if (input.venueId !== undefined) data.venueId = input.venueId ?? null;
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description ?? null;
    if (input.type !== undefined) data.type = input.type;
    if (input.status !== undefined) data.status = input.status;
    if (input.startDate !== undefined) data.startDate = new Date(input.startDate);
    if (input.endDate !== undefined) data.endDate = new Date(input.endDate);
    if (input.capacity !== undefined) data.capacity = input.capacity ?? null;
    if (input.price !== undefined) data.price = input.price;
    if (input.currency !== undefined) data.currency = input.currency;
    if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl ?? null;
    if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;

    return this.db.event.update({
      where: { id },
      data,
      include: { category: true, venue: true },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const event = await this.db.event.findFirst({ where: { id, userId } });
    if (!event) throw new Error('Event not found');

    await this.db.event.delete({ where: { id } });
  }

  async getById(id: string, userId: string) {
    return this.db.event.findFirst({
      where: { id, userId },
      include: {
        category: true,
        venue: true,
        speakers: { orderBy: { sortOrder: 'asc' } },
        registrations: true,
      },
    });
  }

  async list(userId: string, filters: EventFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.venueId) where.venueId = filters.venueId;

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.startAfter || filters.startBefore) {
      const startDate: Record<string, Date> = {};
      if (filters.startAfter) startDate.gte = new Date(filters.startAfter);
      if (filters.startBefore) startDate.lte = new Date(filters.startBefore);
      where.startDate = startDate;
    }

    const [items, total] = await Promise.all([
      this.db.event.findMany({
        where,
        include: { category: true, venue: true, _count: { select: { registrations: true } } },
        orderBy: { startDate: 'asc' },
        skip,
        take: limit,
      }),
      this.db.event.count({ where }),
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

  async changeStatus(id: string, userId: string, status: string) {
    const event = await this.db.event.findFirst({ where: { id, userId } });
    if (!event) throw new Error('Event not found');

    return this.db.event.update({
      where: { id },
      data: { status: status as 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED' | 'ARCHIVED' },
      include: { category: true, venue: true },
    });
  }

  async publish(id: string, userId: string) {
    return this.changeStatus(id, userId, 'PUBLISHED');
  }

  async cancel(id: string, userId: string) {
    return this.changeStatus(id, userId, 'CANCELLED');
  }

  async complete(id: string, userId: string) {
    return this.changeStatus(id, userId, 'COMPLETED');
  }

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const now = new Date();

    const [
      totalEvents,
      publishedEvents,
      draftEvents,
      upcomingEvents,
      totalRegistrations,
      confirmedRegistrations,
      totalVenues,
      revenueResult,
    ] = await Promise.all([
      this.db.event.count({ where: { userId } }),
      this.db.event.count({ where: { userId, status: 'PUBLISHED' } }),
      this.db.event.count({ where: { userId, status: 'DRAFT' } }),
      this.db.event.count({ where: { userId, startDate: { gte: now }, status: { in: ['PUBLISHED', 'DRAFT'] } } }),
      this.db.eventRegistration.count({
        where: { event: { userId } },
      }),
      this.db.eventRegistration.count({
        where: { event: { userId }, status: 'CONFIRMED' },
      }),
      this.db.eventVenue.count({ where: { userId } }),
      this.db.event.aggregate({
        where: { userId },
        _sum: { price: true },
      }),
    ]);

    return {
      totalEvents,
      publishedEvents,
      draftEvents,
      upcomingEvents,
      totalRegistrations,
      confirmedRegistrations,
      totalVenues,
      totalRevenue: revenueResult._sum.price ?? 0,
    };
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createEventService(db: PrismaClient): EventService {
  return new EventService(db);
}

let instance: EventService | null = null;

export function getEventService(db?: PrismaClient): EventService {
  if (db) return createEventService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new EventService(globalDb);
  }
  return instance;
}

export default EventService;
