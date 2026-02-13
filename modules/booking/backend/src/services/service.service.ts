// =============================================================================
// Booking Service Service
// =============================================================================
// Business logic for service management, slug generation, and category handling.
// Uses placeholder db operations - replace with actual Prisma client.

// =============================================================================
// Types
// =============================================================================

export interface ServiceCreateInput {
  name: string;
  description: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  price: number;
  compareAtPrice?: number;
  duration: number;
  bufferTime?: number;
  capacity?: number;
  categoryIds?: string[];
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

interface ServiceRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  duration: number;
  bufferTime: number;
  capacity: number;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string | null;
  displayOrder: number;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================
// Replace with actual Prisma client:
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  async findServices(filters: ServiceFilters): Promise<{ items: ServiceRecord[]; total: number }> {
    // Replace with:
    // const where = {
    //   status: filters.status,
    //   price: { gte: filters.minPrice, lte: filters.maxPrice },
    //   duration: { gte: filters.minDuration, lte: filters.maxDuration },
    //   categories: filters.categorySlug ? { some: { category: { slug: filters.categorySlug } } } : undefined,
    //   OR: filters.search ? [
    //     { name: { contains: filters.search, mode: 'insensitive' } },
    //     { description: { contains: filters.search, mode: 'insensitive' } },
    //   ] : undefined,
    // };
    // const [items, total] = await Promise.all([
    //   db.service.findMany({ where, skip: ((filters.page || 1) - 1) * (filters.limit || 20), take: filters.limit || 20, include: { categories: { include: { category: true } }, providers: true } }),
    //   db.service.count({ where }),
    // ]);
    console.log('[DB] Finding services with filters:', filters);
    return { items: [], total: 0 };
  },

  async findServiceById(id: string): Promise<ServiceRecord | null> {
    // Replace with: return db.service.findUnique({ where: { id }, include: { categories: { include: { category: true } }, providers: true } });
    console.log('[DB] Finding service by ID:', id);
    return null;
  },

  async findServiceBySlug(slug: string): Promise<ServiceRecord | null> {
    // Replace with: return db.service.findUnique({ where: { slug }, include: { categories: { include: { category: true } }, providers: { include: { provider: true } }, reviews: true } });
    console.log('[DB] Finding service by slug:', slug);
    return null;
  },

  async createService(data: ServiceCreateInput & { slug: string }): Promise<ServiceRecord> {
    // Replace with:
    // return db.service.create({
    //   data: {
    //     ...data,
    //     categories: { create: data.categoryIds?.map(id => ({ categoryId: id })) },
    //   },
    //   include: { categories: true },
    // });
    console.log('[DB] Creating service:', data.name);
    return {
      id: 'service_' + Date.now(),
      name: data.name,
      slug: data.slug,
      description: data.description,
      shortDescription: data.shortDescription || null,
      thumbnailUrl: data.thumbnailUrl || null,
      price: data.price,
      compareAtPrice: data.compareAtPrice || null,
      duration: data.duration,
      bufferTime: data.bufferTime || 0,
      capacity: data.capacity || 1,
      status: 'DRAFT',
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async updateService(id: string, data: ServiceUpdateInput): Promise<ServiceRecord | null> {
    // Replace with: return db.service.update({ where: { id }, data: { ...data, categories: data.categoryIds ? { deleteMany: {}, create: data.categoryIds.map(cid => ({ categoryId: cid })) } : undefined } });
    console.log('[DB] Updating service:', id);
    return null;
  },

  async deleteService(id: string): Promise<void> {
    // Replace with: await db.service.delete({ where: { id } });
    console.log('[DB] Deleting service:', id);
  },

  async publishService(id: string): Promise<ServiceRecord | null> {
    // Replace with: return db.service.update({ where: { id }, data: { status: 'ACTIVE', publishedAt: new Date() } });
    console.log('[DB] Publishing service:', id);
    return null;
  },

  async unpublishService(id: string): Promise<ServiceRecord | null> {
    // Replace with: return db.service.update({ where: { id }, data: { status: 'DRAFT', publishedAt: null } });
    console.log('[DB] Unpublishing service:', id);
    return null;
  },

  async findCategories(): Promise<CategoryRecord[]> {
    // Replace with: return db.serviceCategory.findMany({ orderBy: { displayOrder: 'asc' } });
    console.log('[DB] Finding categories');
    return [];
  },

  async createCategory(data: { name: string; slug: string; description?: string; iconName?: string }): Promise<CategoryRecord> {
    // Replace with: return db.serviceCategory.create({ data });
    console.log('[DB] Creating category:', data.name);
    return {
      id: 'cat_' + Date.now(),
      ...data,
      description: data.description || null,
      iconName: data.iconName || null,
      displayOrder: 0,
    };
  },

  async slugExists(slug: string): Promise<boolean> {
    // Replace with: return !!(await db.service.findUnique({ where: { slug } }));
    console.log('[DB] Checking slug existence:', slug);
    return false;
  },

  async getServiceStats(serviceId: string): Promise<{ providerCount: number; avgRating: number; totalBookings: number }> {
    // Replace with:
    // const [providerCount, ratingResult, totalBookings] = await Promise.all([
    //   db.providerService.count({ where: { serviceId } }),
    //   db.review.aggregate({ where: { serviceId }, _avg: { rating: true } }),
    //   db.booking.count({ where: { serviceId } }),
    // ]);
    console.log('[DB] Getting service stats:', serviceId);
    return { providerCount: 0, avgRating: 0, totalBookings: 0 };
  },
};

// =============================================================================
// Service Service
// =============================================================================

export class ServiceService {
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

    while (await dbOperations.slugExists(slug)) {
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

    const result = await dbOperations.findServices({
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
   * Get a single service by slug (public-facing)
   */
  async getServiceBySlug(slug: string) {
    const service = await dbOperations.findServiceBySlug(slug);
    if (!service) return null;

    const stats = await dbOperations.getServiceStats(service.id);
    return { ...service, ...stats };
  }

  /**
   * Get a single service by ID
   */
  async getServiceById(id: string) {
    return dbOperations.findServiceById(id);
  }

  /**
   * Create a new service
   */
  async createService(input: ServiceCreateInput) {
    const slug = await this.generateSlug(input.name);
    return dbOperations.createService({ ...input, slug });
  }

  /**
   * Update an existing service
   */
  async updateService(id: string, input: ServiceUpdateInput) {
    return dbOperations.updateService(id, input);
  }

  /**
   * Delete a service
   */
  async deleteService(id: string) {
    return dbOperations.deleteService(id);
  }

  /**
   * Publish a service (make it bookable)
   */
  async publishService(id: string) {
    return dbOperations.publishService(id);
  }

  /**
   * Unpublish a service (hide from booking)
   */
  async unpublishService(id: string) {
    return dbOperations.unpublishService(id);
  }

  /**
   * List all categories
   */
  async listCategories() {
    return dbOperations.findCategories();
  }

  /**
   * Create a new category
   */
  async createCategory(data: { name: string; description?: string; iconName?: string }) {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return dbOperations.createCategory({ ...data, slug });
  }
}

// =============================================================================
// Factory
// =============================================================================

let serviceServiceInstance: ServiceService | null = null;

export function getServiceService(): ServiceService {
  if (!serviceServiceInstance) {
    serviceServiceInstance = new ServiceService();
  }
  return serviceServiceInstance;
}

export default ServiceService;
