import { Router, Request, Response } from 'express';
import { getEnrollmentService } from '../services/enrollment.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const enrollmentService = getEnrollmentService();

// =============================================================================
// Enrollment Endpoints
// =============================================================================

/**
 * POST /enrollments
 * Enroll current user in a course
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { courseId } = req.body;

    if (!courseId) {
      res.status(400).json({ error: 'courseId is required' });
      return;
    }

    const enrollment = await enrollmentService.enroll({
      userId: authReq.user.userId,
      courseId,
    });

    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    console.error('[EnrollmentRoutes] Enroll error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Enrollment failed',
    });
  }
});

/**
 * GET /enrollments
 * Get current user's enrollments
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const enrollments = await enrollmentService.getUserEnrollments(authReq.user.userId);
    res.json({ success: true, data: enrollments });
  } catch (error) {
    console.error('[EnrollmentRoutes] List error:', error);
    res.status(500).json({ error: 'Failed to list enrollments' });
  }
});

/**
 * GET /enrollments/course/:courseId
 * Get enrollments for a specific course (instructor view)
 */
router.get('/course/:courseId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const enrollments = await enrollmentService.getCourseEnrollments(req.params.courseId);
    res.json({ success: true, data: enrollments });
  } catch (error) {
    console.error('[EnrollmentRoutes] Course enrollments error:', error);
    res.status(500).json({ error: 'Failed to get course enrollments' });
  }
});

/**
 * GET /enrollments/:enrollmentId/progress
 * Get progress details for an enrollment
 */
router.get('/:enrollmentId/progress', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const progress = await enrollmentService.getProgress(req.params.enrollmentId);
    res.json({ success: true, data: progress });
  } catch (error) {
    console.error('[EnrollmentRoutes] Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

/**
 * POST /enrollments/:enrollmentId/progress
 * Update lesson progress (time spent, position, etc.)
 */
router.post('/:enrollmentId/progress', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { lessonId, completed, timeSpent, lastPosition } = req.body;

    if (!lessonId) {
      res.status(400).json({ error: 'lessonId is required' });
      return;
    }

    const progress = await enrollmentService.updateProgress({
      enrollmentId: req.params.enrollmentId,
      lessonId,
      completed,
      timeSpent,
      lastPosition,
    });

    res.json({ success: true, data: progress });
  } catch (error) {
    console.error('[EnrollmentRoutes] Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

/**
 * POST /enrollments/:enrollmentId/complete/:lessonId
 * Mark a lesson as completed
 */
router.post(
  '/:enrollmentId/complete/:lessonId',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const progress = await enrollmentService.completeLesson(
        req.params.enrollmentId,
        req.params.lessonId,
      );
      res.json({ success: true, data: progress });
    } catch (error) {
      console.error('[EnrollmentRoutes] Complete lesson error:', error);
      res.status(500).json({ error: 'Failed to complete lesson' });
    }
  },
);

/**
 * POST /enrollments/:enrollmentId/drop
 * Drop an enrollment
 */
router.post('/:enrollmentId/drop', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const enrollment = await enrollmentService.dropEnrollment(req.params.enrollmentId);
    res.json({ success: true, data: enrollment });
  } catch (error) {
    console.error('[EnrollmentRoutes] Drop error:', error);
    res.status(500).json({ error: 'Failed to drop enrollment' });
  }
});

export default router;
