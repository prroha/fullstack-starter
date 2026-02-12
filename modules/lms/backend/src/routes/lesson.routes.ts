import { Router, Request, Response } from 'express';
import { getLessonService } from '../services/lesson.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const lessonService = getLessonService();

// =============================================================================
// Section Endpoints
// =============================================================================

/**
 * GET /lessons/sections/:courseId
 * List all sections for a course (with lessons)
 */
router.get('/sections/:courseId', async (req: Request, res: Response): Promise<void> => {
  try {
    const sections = await lessonService.listSections(req.params.courseId);
    res.json({ success: true, data: sections });
  } catch (error) {
    console.error('[LessonRoutes] List sections error:', error);
    res.status(500).json({ error: 'Failed to list sections' });
  }
});

/**
 * POST /lessons/sections
 * Create a new section
 */
router.post('/sections', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId, title, description } = req.body;

    if (!courseId || !title) {
      res.status(400).json({ error: 'courseId and title are required' });
      return;
    }

    const section = await lessonService.createSection({ courseId, title, description });
    res.status(201).json({ success: true, data: section });
  } catch (error) {
    console.error('[LessonRoutes] Create section error:', error);
    res.status(500).json({ error: 'Failed to create section' });
  }
});

/**
 * PATCH /lessons/sections/:id
 * Update a section
 */
router.patch('/sections/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body;
    const section = await lessonService.updateSection(req.params.id, { title, description });

    if (!section) {
      res.status(404).json({ error: 'Section not found' });
      return;
    }

    res.json({ success: true, data: section });
  } catch (error) {
    console.error('[LessonRoutes] Update section error:', error);
    res.status(500).json({ error: 'Failed to update section' });
  }
});

/**
 * DELETE /lessons/sections/:id
 * Delete a section and its lessons
 */
router.delete('/sections/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    await lessonService.deleteSection(req.params.id);
    res.json({ success: true, message: 'Section deleted' });
  } catch (error) {
    console.error('[LessonRoutes] Delete section error:', error);
    res.status(500).json({ error: 'Failed to delete section' });
  }
});

/**
 * PUT /lessons/sections/:courseId/reorder
 * Reorder sections within a course
 */
router.put('/sections/:courseId/reorder', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ error: 'orderedIds array is required' });
      return;
    }

    await lessonService.reorderSections(req.params.courseId, orderedIds);
    res.json({ success: true, message: 'Sections reordered' });
  } catch (error) {
    console.error('[LessonRoutes] Reorder sections error:', error);
    res.status(500).json({ error: 'Failed to reorder sections' });
  }
});

// =============================================================================
// Lesson Endpoints
// =============================================================================

/**
 * GET /lessons/:id
 * Get a single lesson
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const lesson = await lessonService.getLesson(req.params.id);
    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }
    res.json({ success: true, data: lesson });
  } catch (error) {
    console.error('[LessonRoutes] Get lesson error:', error);
    res.status(500).json({ error: 'Failed to get lesson' });
  }
});

/**
 * POST /lessons
 * Create a new lesson within a section
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { sectionId, title, description, type, contentUrl, contentText, duration, isFree } = req.body;

    if (!sectionId || !title) {
      res.status(400).json({ error: 'sectionId and title are required' });
      return;
    }

    const lesson = await lessonService.createLesson({
      sectionId,
      title,
      description,
      type,
      contentUrl,
      contentText,
      duration,
      isFree,
    });

    res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    console.error('[LessonRoutes] Create lesson error:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

/**
 * PATCH /lessons/:id
 * Update a lesson
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, type, contentUrl, contentText, duration, isFree } = req.body;

    const lesson = await lessonService.updateLesson(req.params.id, {
      title,
      description,
      type,
      contentUrl,
      contentText,
      duration,
      isFree,
    });

    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }

    res.json({ success: true, data: lesson });
  } catch (error) {
    console.error('[LessonRoutes] Update lesson error:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

/**
 * DELETE /lessons/:id
 * Delete a lesson
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    await lessonService.deleteLesson(req.params.id);
    res.json({ success: true, message: 'Lesson deleted' });
  } catch (error) {
    console.error('[LessonRoutes] Delete lesson error:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

/**
 * PUT /lessons/reorder/:sectionId
 * Reorder lessons within a section
 */
router.put('/reorder/:sectionId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ error: 'orderedIds array is required' });
      return;
    }

    await lessonService.reorderLessons(req.params.sectionId, orderedIds);
    res.json({ success: true, message: 'Lessons reordered' });
  } catch (error) {
    console.error('[LessonRoutes] Reorder lessons error:', error);
    res.status(500).json({ error: 'Failed to reorder lessons' });
  }
});

export default router;
