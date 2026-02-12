import { Router, Request, Response } from 'express';
import { getCourseService } from '../services/course.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const courseService = getCourseService();

// =============================================================================
// Public Endpoints
// =============================================================================

/**
 * GET /courses
 * List published courses with filtering and pagination
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, level, minPrice, maxPrice, page, limit } = req.query;

    const result = await courseService.listCourses({
      status: 'PUBLISHED',
      search: search as string,
      categorySlug: category as string,
      level: level as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[CourseRoutes] List error:', error);
    res.status(500).json({ error: 'Failed to list courses' });
  }
});

/**
 * GET /courses/categories
 * List all course categories
 */
router.get('/categories', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await courseService.listCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('[CourseRoutes] Categories error:', error);
    res.status(500).json({ error: 'Failed to list categories' });
  }
});

/**
 * GET /courses/:slug
 * Get course details by slug (public)
 */
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await courseService.getCourseBySlug(req.params.slug);
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    res.json({ success: true, data: course });
  } catch (error) {
    console.error('[CourseRoutes] Get by slug error:', error);
    res.status(500).json({ error: 'Failed to get course' });
  }
});

// =============================================================================
// Authenticated Endpoints (Instructor)
// =============================================================================

/**
 * POST /courses
 * Create a new course (instructor)
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { title, description, shortDescription, thumbnailUrl, price, compareAtPrice, level, language, maxStudents, categoryIds } = req.body;

    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required' });
      return;
    }

    const course = await courseService.createCourse({
      title,
      description,
      shortDescription,
      thumbnailUrl,
      instructorId: authReq.user.userId,
      price,
      compareAtPrice,
      level,
      language,
      maxStudents,
      categoryIds,
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    console.error('[CourseRoutes] Create error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create course',
    });
  }
});

/**
 * PATCH /courses/:id
 * Update a course (instructor)
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, shortDescription, thumbnailUrl, price, compareAtPrice, level, language, maxStudents, categoryIds } = req.body;

    const course = await courseService.updateCourse(req.params.id, {
      title,
      description,
      shortDescription,
      thumbnailUrl,
      price,
      compareAtPrice,
      level,
      language,
      maxStudents,
      categoryIds,
    });

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    res.json({ success: true, data: course });
  } catch (error) {
    console.error('[CourseRoutes] Update error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update course',
    });
  }
});

/**
 * DELETE /courses/:id
 * Delete a course (instructor)
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    await courseService.deleteCourse(req.params.id);
    res.json({ success: true, message: 'Course deleted' });
  } catch (error) {
    console.error('[CourseRoutes] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

/**
 * POST /courses/:id/publish
 * Publish a course
 */
router.post('/:id/publish', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await courseService.publishCourse(req.params.id);
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    res.json({ success: true, data: course });
  } catch (error) {
    console.error('[CourseRoutes] Publish error:', error);
    res.status(500).json({ error: 'Failed to publish course' });
  }
});

/**
 * POST /courses/:id/unpublish
 * Unpublish a course
 */
router.post('/:id/unpublish', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await courseService.unpublishCourse(req.params.id);
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    res.json({ success: true, data: course });
  } catch (error) {
    console.error('[CourseRoutes] Unpublish error:', error);
    res.status(500).json({ error: 'Failed to unpublish course' });
  }
});

// =============================================================================
// Categories (Admin)
// =============================================================================

/**
 * POST /courses/categories
 * Create a new category
 */
router.post('/categories', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, iconName } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }

    const category = await courseService.createCategory({ name, description, iconName });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('[CourseRoutes] Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// =============================================================================
// Reviews
// =============================================================================

// Review endpoints would go here - listing reviews for a course,
// creating a review (authenticated), etc.
// For brevity, these can be added as needed.

export default router;
