// =============================================================================
// Venue Service
// =============================================================================
// Business logic for event venue management: CRUD, filtering, and stats.
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface VenueCreateInput {
  userId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  capacity?: number;
  isVirtual?: boolean;
  meetingUrl?: string;
}

export interface VenueUpdateInput {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  capacity?: number;
  isVirtual?: boolean;
  meetingUrl?: string;
}

export interface VenueFilters {
  search?: string;
  isVirtual?: boolean;
  page?: number;
  limit?: number;
}

// =============================================================================
// Venue Service
// =============================================================================

export class VenueService {
  constructor(private db: PrismaClient) {}

  async create(input: VenueCreateInput) {
    return this.db.eventVenue.create({
      data: {
        userId: input.userId,
        name: input.name,
        address: input.address || null,
        city: input.city || null,
        state: input.state || null,
        country: input.country || null,
        capacity: input.capacity ?? null,
        isVirtual: input.isVirtual ?? false,
        meetingUrl: input.meetingUrl || null,
      },
    });
  }

  async update(id: string, userId: string, input: VenueUpdateInput) {
    const venue = await this.db.eventVenue.findFirst({ where: { id, userId } });
    if (!venue) throw new Error('Venue not found');

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.address !== undefined) data.address = input.address ?? null;
    if (input.city !== undefined) data.city = input.city ?? null;
    if (input.state !== undefined) data.state = input.state ?? null;
    if (input.country !== undefined) data.country = input.country ?? null;
    if (input.capacity !== undefined) data.capacity = input.capacity ?? null;
    if (input.isVirtual !== undefined) data.isVirtual = input.isVirtual;
    if (input.meetingUrl !== undefined) data.meetingUrl = input.meetingUrl ?? null;

    return this.db.eventVenue.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const venue = await this.db.eventVenue.findFirst({ where: { id, userId } });
    if (!venue) throw new Error('Venue not found');

    await this.db.eventVenue.delete({ where: { id } });
  }

  async getById(id: string, userId: string) {
    return this.db.eventVenue.findFirst({
      where: { id, userId },
      include: { events: { take: 10, orderBy: { startDate: 'desc' } } },
    });
  }

  async list(userId: string, filters: VenueFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (filters.isVirtual !== undefined) where.isVirtual = filters.isVirtual;

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.db.eventVenue.findMany({
        where,
        include: { _count: { select: { events: true } } },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.db.eventVenue.count({ where }),
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
    const [totalVenues, virtualVenues, capacityResult] = await Promise.all([
      this.db.eventVenue.count({ where: { userId } }),
      this.db.eventVenue.count({ where: { userId, isVirtual: true } }),
      this.db.eventVenue.aggregate({
        where: { userId },
        _sum: { capacity: true },
      }),
    ]);

    return {
      totalVenues,
      virtualVenues,
      totalCapacity: capacityResult._sum.capacity ?? 0,
    };
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createVenueService(db: PrismaClient): VenueService {
  return new VenueService(db);
}

let instance: VenueService | null = null;

export function getVenueService(db?: PrismaClient): VenueService {
  if (db) return createVenueService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new VenueService(globalDb);
  }
  return instance;
}

export default VenueService;
