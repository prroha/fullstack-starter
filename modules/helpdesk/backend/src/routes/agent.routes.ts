import { Router, Request, Response } from 'express';
import { getAgentService } from '../services/agent.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const agentService = getAgentService();

// =============================================================================
// Agent Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /agents/me
 * Get the current user's agent profile
 * MUST be before /:id route to avoid matching "me" as an ID
 */
router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const agent = await agentService.getByUserId(authReq.user.userId, authReq.user.userId);
    if (!agent) {
      res.status(404).json({ error: 'Agent profile not found' });
      return;
    }
    res.json({ success: true, data: agent });
  } catch (error) {
    console.error('[AgentRoutes] Get me error:', error);
    res.status(500).json({ error: 'Failed to get agent profile' });
  }
});

/**
 * GET /agents/workload
 * Get all agents workload summary
 * MUST be before /:id route to avoid matching "workload" as an ID
 */
router.get('/workload', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const workload = await agentService.getAllWorkloads(authReq.user.userId);
    res.json({ success: true, data: workload });
  } catch (error) {
    console.error('[AgentRoutes] Workload error:', error);
    res.status(500).json({ error: 'Failed to get agents workload' });
  }
});

/**
 * GET /agents
 * List all agents
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { search, department, role, isActive, page, limit } = req.query;

    const agents = await agentService.list(authReq.user.userId, {
      search: search as string,
      department: department as string,
      role: role as string,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json({ success: true, data: agents });
  } catch (error) {
    console.error('[AgentRoutes] List error:', error);
    res.status(500).json({ error: 'Failed to list agents' });
  }
});

/**
 * GET /agents/:id
 * Get agent by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const agent = await agentService.getById(req.params.id, authReq.user.userId);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    res.json({ success: true, data: agent });
  } catch (error) {
    console.error('[AgentRoutes] Get error:', error);
    res.status(500).json({ error: 'Failed to get agent' });
  }
});

/**
 * POST /agents
 * Create a new agent
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, email, role, department, maxOpenTickets, specialties } = req.body;

    if (!name || !email) {
      res.status(400).json({ error: 'name and email are required' });
      return;
    }

    const agent = await agentService.create({
      userId: authReq.user.userId,
      name,
      email,
      role,
      department,
      maxOpenTickets,
      specialties,
    });

    res.status(201).json({ success: true, data: agent });
  } catch (error) {
    console.error('[AgentRoutes] Create error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to create agent',
    });
  }
});

/**
 * PATCH /agents/:id
 * Update an agent
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, email, role, department, maxOpenTickets, specialties } = req.body;

    const agent = await agentService.update(req.params.id, authReq.user.userId, {
      name,
      email,
      role,
      department,
      maxOpenTickets,
      specialties,
    });

    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    res.json({ success: true, data: agent });
  } catch (error) {
    console.error('[AgentRoutes] Update error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update agent',
    });
  }
});

/**
 * DELETE /agents/:id
 * Delete an agent
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await agentService.delete(req.params.id, authReq.user.userId);
    res.json({ success: true, message: 'Agent deleted' });
  } catch (error) {
    console.error('[AgentRoutes] Delete error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete agent',
    });
  }
});

/**
 * POST /agents/:id/toggle-active
 * Toggle agent active status
 */
router.post('/:id/toggle-active', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const agent = await agentService.toggleActive(req.params.id, authReq.user.userId);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    res.json({ success: true, data: agent });
  } catch (error) {
    console.error('[AgentRoutes] Toggle active error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to toggle agent status',
    });
  }
});

export default router;
