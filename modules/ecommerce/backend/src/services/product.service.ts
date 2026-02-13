// =============================================================================
// E-Commerce Product Service
// =============================================================================
// Business logic for product management, slug generation, and category handling.
// Uses placeholder db operations - replace with actual Prisma client.
// Table: @@map("ecommerce_products"), @@map("ecommerce_categories")

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

interface ProductRecord {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  sellerId: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  sku: string | null;
  stock: number;
  images: { id: string; url: string; altText: string | null; sortOrder: number }[];
  variants: { id: string; name: string; sku: string | null; price: number; stock: number; options: unknown; sortOrder: number }[];
  status: string;
  isFeatured: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================
// Replace with actual Prisma client:
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  async findProducts(filters: ProductFilters): Promise<{ items: ProductRecord[]; total: number }> {
    // Replace with:
    // const where = {
    //   status: filters.status,
    //   sellerId: filters.sellerId,
    //   ...(filters.categorySlug && { categories: { some: { category: { slug: filters.categorySlug } } } }),
    //   ...(filters.minPrice !== undefined && { price: { gte: filters.minPrice } }),
    //   ...(filters.maxPrice !== undefined && { price: { ...where.price, lte: filters.maxPrice } }),
    //   ...(filters.search && { OR: [{ title: { contains: filters.search, mode: 'insensitive' } }, { description: { contains: filters.search, mode: 'insensitive' } }] }),
    // };
    // const skip = ((filters.page || 1) - 1) * (filters.limit || 20);
    // const [items, total] = await Promise.all([
    //   db.product.findMany({ where, skip, take: filters.limit || 20, include: { categories: true, seller: true } }),
    //   db.product.count({ where }),
    // ]);
    console.log('[DB] Finding products with filters:', filters);
    return { items: [], total: 0 };
  },

  async findProductById(id: string): Promise<ProductRecord | null> {
    // Replace with: return db.product.findUnique({ where: { id }, include: { categories: true, seller: true, reviews: true } });
    console.log('[DB] Finding product by ID:', id);
    return null;
  },

  async findProductBySlug(slug: string): Promise<ProductRecord | null> {
    // Replace with: return db.product.findUnique({ where: { slug }, include: { categories: true, seller: true, reviews: true } });
    console.log('[DB] Finding product by slug:', slug);
    return null;
  },

  async createProduct(data: ProductCreateInput & { slug: string }): Promise<ProductRecord> {
    // Replace with:
    // return db.product.create({
    //   data: {
    //     ...data,
    //     categories: { create: data.categoryIds?.map(id => ({ categoryId: id })) },
    //   },
    //   include: { categories: true },
    // });
    console.log('[DB] Creating product:', data.title);
    return {
      id: 'product_' + Date.now(),
      title: data.title,
      slug: data.slug,
      description: data.description,
      shortDescription: data.shortDescription || null,
      sellerId: data.sellerId,
      price: data.price || 0,
      compareAtPrice: data.compareAtPrice || null,
      currency: data.currency || 'usd',
      sku: data.sku || null,
      stock: data.stock || 0,
      images: [],
      variants: [],
      status: 'DRAFT',
      isFeatured: false,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async updateProduct(id: string, data: ProductUpdateInput): Promise<ProductRecord | null> {
    // Replace with: return db.product.update({ where: { id }, data: { ...data, categories: { deleteMany: {}, create: data.categoryIds?.map(id => ({ categoryId: id })) } } });
    console.log('[DB] Updating product:', id);
    return null;
  },

  async deleteProduct(id: string): Promise<void> {
    // Replace with: await db.product.delete({ where: { id } });
    console.log('[DB] Deleting product:', id);
  },

  async publishProduct(id: string): Promise<ProductRecord | null> {
    // Replace with: return db.product.update({ where: { id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
    console.log('[DB] Publishing product:', id);
    return null;
  },

  async unpublishProduct(id: string): Promise<ProductRecord | null> {
    // Replace with: return db.product.update({ where: { id }, data: { status: 'DRAFT', publishedAt: null } });
    console.log('[DB] Unpublishing product:', id);
    return null;
  },

  async findCategories(): Promise<CategoryRecord[]> {
    // Replace with: return db.productCategory.findMany({ orderBy: { displayOrder: 'asc' } });
    console.log('[DB] Finding categories');
    return [];
  },

  async createCategory(data: { name: string; slug: string; description?: string; imageUrl?: string }): Promise<CategoryRecord> {
    // Replace with: return db.productCategory.create({ data });
    console.log('[DB] Creating category:', data.name);
    return {
      id: 'cat_' + Date.now(),
      ...data,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      displayOrder: 0,
    };
  },

  async slugExists(slug: string): Promise<boolean> {
    // Replace with: return !!(await db.product.findUnique({ where: { slug } }));
    console.log('[DB] Checking slug existence:', slug);
    return false;
  },
};

// =============================================================================
// Product Service
// =============================================================================

export class ProductService {
  /**
   * Generate a unique URL slug from the product title
   */
  async generateSlug(title: string): Promise<string> {
    const base = title
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
   * List products with filtering and pagination
   */
  async listProducts(filters: ProductFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await dbOperations.findProducts({
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
   * Get a single product by ID
   */
  async getProductById(id: string) {
    return dbOperations.findProductById(id);
  }

  /**
   * Get a single product by slug (public-facing)
   */
  async getProductBySlug(slug: string) {
    return dbOperations.findProductBySlug(slug);
  }

  /**
   * Create a new product (price in cents)
   */
  async createProduct(input: ProductCreateInput) {
    const slug = await this.generateSlug(input.title);
    return dbOperations.createProduct({ ...input, slug });
  }

  /**
   * Update an existing product
   */
  async updateProduct(id: string, input: ProductUpdateInput) {
    return dbOperations.updateProduct(id, input);
  }

  /**
   * Delete a product (cascades to variants, reviews, etc.)
   */
  async deleteProduct(id: string) {
    return dbOperations.deleteProduct(id);
  }

  /**
   * Publish a product (make it visible to customers)
   */
  async publishProduct(id: string) {
    return dbOperations.publishProduct(id);
  }

  /**
   * Unpublish a product (hide from customers)
   */
  async unpublishProduct(id: string) {
    return dbOperations.unpublishProduct(id);
  }

  /**
   * List all product categories
   */
  async listCategories() {
    return dbOperations.findCategories();
  }

  /**
   * Create a new product category
   */
  async createCategory(data: { name: string; description?: string; imageUrl?: string }) {
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

let productServiceInstance: ProductService | null = null;

export function getProductService(): ProductService {
  if (!productServiceInstance) {
    productServiceInstance = new ProductService();
  }
  return productServiceInstance;
}

export default ProductService;
