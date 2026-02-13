import { Router, Request, Response } from 'express';
import { getProductService } from '../services/product.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const productService = getProductService();

// =============================================================================
// Public Endpoints
// =============================================================================

/**
 * GET /products
 * List published products with filtering and pagination
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, minPrice, maxPrice, sort, page, limit } = req.query;

    const result = await productService.listProducts({
      status: 'ACTIVE',
      search: search as string,
      categorySlug: category as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort: sort as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[ProductRoutes] List error:', error);
    res.status(500).json({ error: 'Failed to list products' });
  }
});

/**
 * GET /products/categories
 * List all product categories
 */
router.get('/categories', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await productService.listCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('[ProductRoutes] Categories error:', error);
    res.status(500).json({ error: 'Failed to list categories' });
  }
});

/**
 * GET /products/:slug
 * Get product details by slug (public)
 */
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await productService.getProductBySlug(req.params.slug);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('[ProductRoutes] Get by slug error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// =============================================================================
// Authenticated Endpoints (Seller)
// =============================================================================

/**
 * POST /products
 * Create a new product (seller)
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { title, description, shortDescription, price, compareAtPrice, sku, images, categoryIds, variants } = req.body;

    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required' });
      return;
    }

    const product = await productService.createProduct({
      title,
      description,
      shortDescription,
      price,
      compareAtPrice,
      sku,
      images,
      sellerId: authReq.user.userId,
      categoryIds,
      variants,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('[ProductRoutes] Create error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create product',
    });
  }
});

/**
 * PATCH /products/:id
 * Update a product (seller)
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, shortDescription, price, compareAtPrice, sku, images, categoryIds, variants } = req.body;

    const product = await productService.updateProduct(req.params.id, {
      title,
      description,
      shortDescription,
      price,
      compareAtPrice,
      sku,
      images,
      categoryIds,
      variants,
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('[ProductRoutes] Update error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update product',
    });
  }
});

/**
 * DELETE /products/:id
 * Delete a product (seller)
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('[ProductRoutes] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

/**
 * POST /products/:id/publish
 * Publish a product
 */
router.post('/:id/publish', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await productService.publishProduct(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('[ProductRoutes] Publish error:', error);
    res.status(500).json({ error: 'Failed to publish product' });
  }
});

/**
 * POST /products/:id/unpublish
 * Unpublish a product
 */
router.post('/:id/unpublish', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await productService.unpublishProduct(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('[ProductRoutes] Unpublish error:', error);
    res.status(500).json({ error: 'Failed to unpublish product' });
  }
});

// =============================================================================
// Categories (Admin)
// =============================================================================

/**
 * POST /products/categories
 * Create a new category
 */
router.post('/categories', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, imageUrl } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }

    const category = await productService.createCategory({ name, description, imageUrl });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('[ProductRoutes] Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

export default router;
