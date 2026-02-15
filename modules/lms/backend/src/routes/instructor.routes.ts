import { Router, Request, Response } from 'express';
import { getInstructorService } from '../services/instructor.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const instructorService = getInstructorService();

// =============================================================================
// Instructor Dashboard Endpoints
// =============================================================================

/**
 * GET /instructor/stats
 * Get instructor dashboard statistics
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const stats = await instructorService.getDashboardStats(authReq.user.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[InstructorRoutes] Stats error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get instructor stats' });
  }
});

/**
 * GET /instructor/courses/analytics
 * Get per-course analytics
 */
router.get('/courses/analytics', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const analytics = await instructorService.getCourseAnalytics(authReq.user.userId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('[InstructorRoutes] Course analytics error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get course analytics' });
  }
});

/**
 * GET /instructor/earnings
 * Get earnings breakdown
 */
router.get('/earnings', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { period, startDate, endDate } = req.query;

    const earnings = await instructorService.getEarnings(
      authReq.user.userId,
      (period as 'daily' | 'weekly' | 'monthly') || 'monthly',
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
    );

    res.json({ success: true, data: earnings });
  } catch (error) {
    console.error('[InstructorRoutes] Earnings error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get earnings' });
  }
});

/**
 * GET /instructor/enrollments/recent
 * Get recent enrollments across all courses
 */
router.get('/enrollments/recent', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const enrollments = await instructorService.getRecentEnrollments(authReq.user.userId, limit);
    res.json({ success: true, data: enrollments });
  } catch (error) {
    console.error('[InstructorRoutes] Recent enrollments error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get recent enrollments' });
  }
});

/**
 * GET /instructor/reviews/recent
 * Get recent reviews across all courses
 */
router.get('/reviews/recent', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const reviews = await instructorService.getRecentReviews(authReq.user.userId, limit);
    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('[InstructorRoutes] Recent reviews error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get recent reviews' });
  }
});

export default router;
