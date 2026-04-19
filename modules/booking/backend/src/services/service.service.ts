// =============================================================================
// Booking Service Service
// =============================================================================
// Business logic for service management, slug generation, and category handling.
// Uses dependency-injected PrismaClient.

import type { PrismaClient, Prisma } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface ServiceCreateInput {
  name: string;
  description: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  price?: number;
  compareAtPrice?: number;
  duration: number;
  bufferTime?: number;
  capacity?: number;
  categoryIds?: string[];
  [key: string]: unknown;
}

export interface ServiceUpdateInput {
  name?: string;
  description?: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  price?: number;
  compareAtPrice?: number;
  duration?: number;
  bufferTime?: number;
  capacity?: number;
  categoryIds?: string[];
  [key: string]: unknown;
}

export interface ServiceFilters {
  status?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  search?: string;
  page?: number;
  limit?: number;
}

// =============================================================================
// Service Service
// =============================================================================

export class ServiceService {
  constructor(private db: PrismaClient) {}

  /**
   * Generate a unique URL slug from the service name
   */
  async generateSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = base;
    let counter = 1;

    while (await this.db.bookingService.findUnique({ where: { slug } })) {
      slug = `${base}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * List services with filtering and pagination
   */
  async listServices(filters: ServiceFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Prisma.BookingServiceWhereInput = {
      ...(filters.status ? { status: filters.status as Prisma.EnumServiceStatusFilter } : {}),
      ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
        ? {
            price: {
              ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
              ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
            },
          }
        : {}),
      ...(filters.minDuration !== undefined || filters.maxDuration !== undefined
        ? {
            duration: {
              ...(filters.minDuration !== undefined ? { gte: filters.minDuration } : {}),
              ...(filters.maxDuration !== undefined ? { lte: filters.maxDuration } : {}),
            },
          }
        : {}),
      ...(filters.categorySlug
        ? { categories: { some: { category: { slug: filters.categorySlug } } } }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: 'insensitive' as const } },
              { description: { contains: filters.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.db.bookingService.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          categories: { include: { category: true } },
          providers: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.db.bookingService.count({ where }),
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
   * Get a single service by slug (public-facing)
   */
  async getServiceBySlug(slug: string) {
    const service = await this.db.bookingService.findUnique({
      where: { slug },
      include: {
        categories: { include: { category: true } },
        providers: { include: { provider: true } },
        reviews: true,
      },
    });
    if (!service) return null;

    const [providerCount, ratingResult, totalBookings] = await Promise.all([
      this.db.providerService.count({ where: { serviceId: service.id } }),
      this.db.bookingReview.aggregate({ where: { serviceId: service.id }, _avg: { rating: true } }),
      this.db.booking.count({ where: { serviceId: service.id } }),
    ]);

    return {
      ...service,
      providerCount,
      avgRating: Math.round((ratingResult._avg.rating || 0) * 10) / 10,
      totalBookings,
    };
  }

  /**
   * Get a single service by ID
   */
  async getServiceById(id: string) {
    return this.db.bookingService.findUnique({
      where: { id },
      include: {
        categories: { include: { category: true } },
        providers: true,
      },
    });
  }

  /**
   * Create a new service
   */
  async createService(input: ServiceCreateInput) {
    const slug = await this.generateSlug(input.name);

    return this.db.bookingService.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        shortDescription: input.shortDescription || null,
        thumbnailUrl: input.thumbnailUrl || null,
        price: input.price || 0,
        compareAtPrice: input.compareAtPrice || null,
        duration: input.duration,
        bufferTime: input.bufferTime || 15,
        capacity: input.capacity || 1,
        ...(input.categoryIds && input.categoryIds.length > 0
          ? {
              categories: {
                create: input.categoryIds.map((categoryId) => ({ categoryId })),
              },
            }
          : {}),
      },
      include: {
        categories: { include: { category: true } },
      },
    });
  }

  /**
   * Update an existing service
   */
  async updateService(id: string, input: ServiceUpdateInput) {
    const existing = await this.db.bookingService.findUnique({ where: { id } });
    if (!existing) return null;

    // Build the update data, only including defined fields
    const data: Prisma.BookingServiceUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.shortDescription !== undefined) data.shortDescription = input.shortDescription;
    if (input.thumbnailUrl !== undefined) data.thumbnailUrl = input.thumbnailUrl;
    if (input.price !== undefined) data.price = input.price;
    if (input.compareAtPrice !== undefined) data.compareAtPrice = input.compareAtPrice;
    if (input.duration !== undefined) data.duration = input.duration;
    if (input.bufferTime !== undefined) data.bufferTime = input.bufferTime;
    if (input.capacity !== undefined) data.capacity = input.capacity;

    // Handle category updates
    if (input.categoryIds) {
      data.categories = {
        deleteMany: {},
        create: input.categoryIds.map((categoryId) => ({ categoryId })),
      };
    }

    return this.db.bookingService.update({
      where: { id },
      data,
      include: {
        categories: { include: { category: true } },
        providers: true,
      },
    });
  }

  /**
   * Delete a service
   */
  async deleteService(id: string) {
    await this.db.bookingService.delete({ where: { id } });
  }

  /**
   * Publish a service (make it bookable)
   */
  async publishService(id: string) {
    const existing = await this.db.bookingService.findUnique({ where: { id } });
    if (!existing) return null;

    return this.db.bookingService.update({
      where: { id },
      data: { status: 'ACTIVE', publishedAt: new Date() },
      include: { categories: { include: { category: true } } },
    });
  }

  /**
   * Unpublish a service (hide from booking)
   */
  async unpublishService(id: string) {
    const existing = await this.db.bookingService.findUnique({ where: { id } });
    if (!existing) return null;

    return this.db.bookingService.update({
      where: { id },
      data: { status: 'DRAFT', publishedAt: null },
      include: { categories: { include: { category: true } } },
    });
  }

  /**
   * List all categories
   */
  async listCategories() {
    return this.db.serviceCategory.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Create a new category
   */
  async createCategory(data: { name: string; description?: string; iconName?: string }) {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return this.db.serviceCategory.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        iconName: data.iconName || null,
      },
    });
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createServiceService(db: PrismaClient): ServiceService {
  return new ServiceService(db);
}

let instance: ServiceService | null = null;
export function getServiceService(db?: PrismaClient): ServiceService {
  if (db) return createServiceService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new ServiceService(globalDb);
  }
  return instance;
}

export default ServiceService;
