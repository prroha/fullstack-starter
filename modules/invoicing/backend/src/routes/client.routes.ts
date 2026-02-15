import { Router, Request, Response } from 'express';
import { getClientService } from '../services/client.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const clientService = getClientService();

// =============================================================================
// Client Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /clients
 * List clients with search and pagination
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { search, page, limit } = req.query;

    const result = await clientService.list(authReq.user.userId, {
      search: search as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[ClientRoutes] List error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to list clients' });
  }
});

/**
 * GET /clients/:id
 * Get client by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const client = await clientService.getById(req.params.id, authReq.user.userId);
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    res.json({ success: true, data: client });
  } catch (error) {
    console.error('[ClientRoutes] Get error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get client' });
  }
});

/**
 * GET /clients/:id/stats
 * Get client stats (total invoices, total paid, outstanding, etc.)
 */
router.get('/:id/stats', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const stats = await clientService.getStats(req.params.id, authReq.user.userId);
    if (!stats) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[ClientRoutes] Stats error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get client stats' });
  }
});

/**
 * POST /clients
 * Create a new client
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, email, phone, companyName, taxId, billingAddress, notes } = req.body;

    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const client = await clientService.create({
      userId: authReq.user.userId,
      name,
      email,
      phone,
      companyName,
      taxId,
      billingAddress,
      notes,
    });

    res.status(201).json({ success: true, data: client });
  } catch (error) {
    console.error('[ClientRoutes] Create error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to create client',
    });
  }
});

/**
 * PATCH /clients/:id
 * Update a client
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, email, phone, companyName, taxId, billingAddress, notes } = req.body;

    const client = await clientService.update(req.params.id, authReq.user.userId, {
      name,
      email,
      phone,
      companyName,
      taxId,
      billingAddress,
      notes,
    });

    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    res.json({ success: true, data: client });
  } catch (error) {
    console.error('[ClientRoutes] Update error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update client',
    });
  }
});

/**
 * DELETE /clients/:id
 * Delete a client
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await clientService.delete(req.params.id, authReq.user.userId);
    res.json({ success: true, message: 'Client deleted' });
  } catch (error) {
    console.error('[ClientRoutes] Delete error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete client',
    });
  }
});

export default router;
