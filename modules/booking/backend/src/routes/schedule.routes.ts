import { Router, Request, Response } from 'express';
import { getScheduleService } from '../services/schedule.service';
import { authMiddleware } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const scheduleService = getScheduleService();

// =============================================================================
// Schedule Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /schedules/:providerId
 * Get weekly schedule for a provider
 */
router.get('/:providerId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const schedule = await scheduleService.getWeeklySchedule(req.params.providerId);
    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('[ScheduleRoutes] Get schedule error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get schedule' });
  }
});

/**
 * PUT /schedules/:providerId
 * Update the full 7-day weekly schedule for a provider
 */
router.put('/:providerId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { schedules } = req.body;

    if (!schedules || !Array.isArray(schedules)) {
      res.status(400).json({ error: 'schedules array is required' });
      return;
    }

    const result = await scheduleService.updateWeeklySchedule(req.params.providerId, schedules);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[ScheduleRoutes] Update schedule error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update schedule',
    });
  }
});

// =============================================================================
// Schedule Overrides
// =============================================================================

/**
 * GET /schedules/:providerId/overrides
 * List schedule overrides for a date range
 */
router.get('/:providerId/overrides', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const overrides = await scheduleService.listOverrides(
      req.params.providerId,
      startDate as string,
      endDate as string,
    );

    res.json({ success: true, data: overrides });
  } catch (error) {
    console.error('[ScheduleRoutes] List overrides error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to list schedule overrides' });
  }
});

/**
 * POST /schedules/:providerId/overrides
 * Add a schedule override (e.g., day off, special hours)
 */
router.post('/:providerId/overrides', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, isAvailable, startTime, endTime, reason } = req.body;

    if (!date) {
      res.status(400).json({ error: 'date is required' });
      return;
    }

    const override = await scheduleService.createOverride(req.params.providerId, {
      date,
      isAvailable,
      startTime,
      endTime,
      reason,
    });

    res.status(201).json({ success: true, data: override });
  } catch (error) {
    console.error('[ScheduleRoutes] Create override error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create schedule override',
    });
  }
});

/**
 * DELETE /schedules/:providerId/overrides/:id
 * Remove a schedule override
 */
router.delete('/:providerId/overrides/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    await scheduleService.deleteOverride(req.params.id);
    res.json({ success: true, message: 'Schedule override removed' });
  } catch (error) {
    console.error('[ScheduleRoutes] Delete override error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to delete schedule override' });
  }
});

export default router;
