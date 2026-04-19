// =============================================================================
// E-Commerce Product Service
// =============================================================================
// Business logic for product management, slug generation, and category handling.
// Supports dependency injection for preview mode (per-schema PrismaClient).

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface ProductCreateInput {
  title: string;
  description: string;
  shortDescription?: string;
  sellerId: string;
  price?: number;
  compareAtPrice?: number;
  currency?: string;
  sku?: string;
  stock?: number;
  categoryIds?: string[];
  images?: string[];
}

export interface ProductUpdateInput {
  title?: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  compareAtPrice?: number;
  currency?: string;
  sku?: string;
  stock?: number;
  categoryIds?: string[];
  images?: string[];
}

export interface ProductFilters {
  status?: string;
  sellerId?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

// =============================================================================
// Product Service
// =============================================================================

export class ProductService {
  constructor(private db: PrismaClient) {}

  async generateSlug(title: string): Promise<string> {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = base;
    let counter = 1;

    while (await this.db.product.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${base}-${counter}`;
      counter++;
    }

    return slug;
  }

  async listProducts(filters: ProductFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.sellerId) where.sellerId = filters.sellerId;
    if (filters.categorySlug) {
      where.categories = { some: { category: { slug: filters.categorySlug } } };
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) (where.price as Record<string, unknown>).gte = filters.minPrice;
      if (filters.maxPrice !== undefined) (where.price as Record<string, unknown>).lte = filters.maxPrice;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: Record<string, string> = { createdAt: 'desc' };
    if (filters.sort === 'price_asc') orderBy = { price: 'asc' };
    else if (filters.sort === 'price_desc') orderBy = { price: 'desc' };
    else if (filters.sort === 'title') orderBy = { title: 'asc' };
    else if (filters.sort === 'newest') orderBy = { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.db.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          categories: { include: { category: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          variants: { orderBy: { sortOrder: 'asc' } },
        },
      }),
      this.db.product.count({ where }),
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

  async getProductById(id: string) {
    return this.db.product.findUnique({
      where: { id },
      include: {
        categories: { include: { category: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: { sortOrder: 'asc' } },
        reviews: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }

  async getProductBySlug(slug: string) {
    return this.db.product.findUnique({
      where: { slug },
      include: {
        categories: { include: { category: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: { sortOrder: 'asc' } },
        reviews: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }

  async createProduct(input: ProductCreateInput) {
    const slug = await this.generateSlug(input.title);
    const { categoryIds, images, ...data } = input;

    return this.db.product.create({
      data: {
        ...data,
        slug,
        price: data.price || 0,
        currency: data.currency || 'usd',
        categories: categoryIds?.length
          ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
        images: images?.length
          ? { create: images.map((url, i) => ({ url, sortOrder: i })) }
          : undefined,
      },
      include: {
        categories: { include: { category: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async updateProduct(id: string, input: ProductUpdateInput) {
    const existing = await this.db.product.findUnique({ where: { id } });
    if (!existing) return null;

    const { categoryIds, images, ...data } = input;

    return this.db.product.update({
      where: { id },
      data: {
        ...data,
        ...(categoryIds !== undefined && {
          categories: {
            deleteMany: {},
            create: categoryIds.map((categoryId) => ({ categoryId })),
          },
        }),
        ...(images !== undefined && {
          images: {
            deleteMany: {},
            create: images.map((url, i) => ({ url, sortOrder: i })),
          },
        }),
      },
      include: {
        categories: { include: { category: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async deleteProduct(id: string) {
    await this.db.product.delete({ where: { id } });
  }

  async publishProduct(id: string) {
    const existing = await this.db.product.findUnique({ where: { id } });
    if (!existing) return null;
    return this.db.product.update({
      where: { id },
      data: { status: 'ACTIVE', publishedAt: new Date() },
    });
  }

  async unpublishProduct(id: string) {
    const existing = await this.db.product.findUnique({ where: { id } });
    if (!existing) return null;
    return this.db.product.update({
      where: { id },
      data: { status: 'DRAFT', publishedAt: null },
    });
  }

  async listCategories() {
    return this.db.productCategory.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createCategory(data: { name: string; description?: string; imageUrl?: string }) {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return this.db.productCategory.create({
      data: { ...data, slug },
    });
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createProductService(db: PrismaClient): ProductService {
  return new ProductService(db);
}

let productServiceInstance: ProductService | null = null;

export function getProductService(db?: PrismaClient): ProductService {
  if (db) return createProductService(db);
  if (!productServiceInstance) {
    // Lazy import for standalone mode
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    productServiceInstance = new ProductService(globalDb);
  }
  return productServiceInstance;
}

export default ProductService;
