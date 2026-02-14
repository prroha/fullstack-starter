import { Router, Request, Response } from 'express';
import { getArticleService } from '../services/article.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const articleService = getArticleService();

// =============================================================================
// Article Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /articles/search
 * Search articles by query string
 * MUST be before /:id route to avoid matching "search" as an ID
 */
router.get('/search', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { q } = req.query;

    const results = await articleService.search(authReq.user.userId, q as string);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('[ArticleRoutes] Search error:', error);
    res.status(500).json({ error: 'Failed to search articles' });
  }
});

/**
 * GET /articles
 * List articles with filtering and pagination
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { search, status, categoryId, page, limit } = req.query;

    const result = await articleService.list(authReq.user.userId, {
      search: search as string,
      status: status as string,
      categoryId: categoryId as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[ArticleRoutes] List error:', error);
    res.status(500).json({ error: 'Failed to list articles' });
  }
});

/**
 * GET /articles/:id
 * Get article by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const article = await articleService.getById(req.params.id, authReq.user.userId);
    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    res.json({ success: true, data: article });
  } catch (error) {
    console.error('[ArticleRoutes] Get error:', error);
    res.status(500).json({ error: 'Failed to get article' });
  }
});

/**
 * POST /articles
 * Create a new article
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { title, slug, content, excerpt, categoryId, tags, metaTitle, metaDescription } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'title and content are required' });
      return;
    }

    const article = await articleService.create({
      userId: authReq.user.userId,
      title,
      slug,
      content,
      excerpt,
      categoryId,
      tags,
      metaTitle,
      metaDescription,
    });

    res.status(201).json({ success: true, data: article });
  } catch (error) {
    console.error('[ArticleRoutes] Create error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to create article',
    });
  }
});

/**
 * PATCH /articles/:id
 * Update an article
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { title, slug, content, excerpt, categoryId, tags, metaTitle, metaDescription } = req.body;

    const article = await articleService.update(req.params.id, authReq.user.userId, {
      title,
      slug,
      content,
      excerpt,
      categoryId,
      tags,
      metaTitle,
      metaDescription,
    });

    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    res.json({ success: true, data: article });
  } catch (error) {
    console.error('[ArticleRoutes] Update error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update article',
    });
  }
});

/**
 * DELETE /articles/:id
 * Delete an article
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await articleService.delete(req.params.id, authReq.user.userId);
    res.json({ success: true, message: 'Article deleted' });
  } catch (error) {
    console.error('[ArticleRoutes] Delete error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete article',
    });
  }
});

/**
 * POST /articles/:id/publish
 * Publish an article
 */
router.post('/:id/publish', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const article = await articleService.publish(req.params.id, authReq.user.userId);
    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    res.json({ success: true, data: article });
  } catch (error) {
    console.error('[ArticleRoutes] Publish error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to publish article',
    });
  }
});

/**
 * POST /articles/:id/archive
 * Archive an article
 */
router.post('/:id/archive', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const article = await articleService.archive(req.params.id, authReq.user.userId);
    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    res.json({ success: true, data: article });
  } catch (error) {
    console.error('[ArticleRoutes] Archive error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to archive article',
    });
  }
});

/**
 * POST /articles/:id/feedback
 * Submit feedback on an article (helpful/not helpful)
 */
router.post('/:id/feedback', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { helpful, comment } = req.body;

    if (helpful === undefined) {
      res.status(400).json({ error: 'helpful is required' });
      return;
    }

    const feedback = await articleService.recordFeedback(authReq.user.userId, {
      articleId: req.params.id,
      helpful,
      comment,
    });
    res.json({ success: true, data: feedback });
  } catch (error) {
    console.error('[ArticleRoutes] Feedback error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to submit article feedback',
    });
  }
});

export default router;
