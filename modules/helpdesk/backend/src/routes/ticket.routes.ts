import { Router, Request, Response } from 'express';
import { getTicketService } from '../services/ticket.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const ticketService = getTicketService();

// =============================================================================
// Ticket Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /tickets/stats
 * Get dashboard stats (total, open, pending, resolved, etc.)
 * MUST be before /:id route to avoid matching "stats" as an ID
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const stats = await ticketService.getStats(authReq.user.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[TicketRoutes] Stats error:', error);
    res.status(500).json({ error: 'Failed to get ticket stats' });
  }
});

/**
 * GET /tickets
 * List tickets with filtering and pagination
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { search, status, priority, categoryId, assignedAgentId, tagId, dateFrom, dateTo, page, limit } = req.query;

    const result = await ticketService.list(authReq.user.userId, {
      search: search as string,
      status: status as string,
      priority: priority as string,
      categoryId: categoryId as string,
      assignedAgentId: assignedAgentId as string,
      tagId: tagId as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[TicketRoutes] List error:', error);
    res.status(500).json({ error: 'Failed to list tickets' });
  }
});

/**
 * GET /tickets/:id
 * Get ticket by ID (includes messages, tags, category, assigned agent)
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const ticket = await ticketService.getById(req.params.id, authReq.user.userId);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error('[TicketRoutes] Get error:', error);
    res.status(500).json({ error: 'Failed to get ticket' });
  }
});

/**
 * POST /tickets
 * Create a new ticket
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { subject, description, priority, categoryId } = req.body;

    if (!subject || !description) {
      res.status(400).json({ error: 'subject and description are required' });
      return;
    }

    const ticket = await ticketService.create({
      userId: authReq.user.userId,
      subject,
      description,
      priority,
      categoryId,
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    console.error('[TicketRoutes] Create error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to create ticket',
    });
  }
});

/**
 * PATCH /tickets/:id
 * Update a ticket
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { subject, description, priority, categoryId } = req.body;

    const ticket = await ticketService.update(req.params.id, authReq.user.userId, {
      subject,
      description,
      priority,
      categoryId,
    });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error('[TicketRoutes] Update error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update ticket',
    });
  }
});

/**
 * DELETE /tickets/:id
 * Delete a ticket
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await ticketService.delete(req.params.id, authReq.user.userId);
    res.json({ success: true, message: 'Ticket deleted' });
  } catch (error) {
    console.error('[TicketRoutes] Delete error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete ticket',
    });
  }
});

/**
 * POST /tickets/:id/assign
 * Assign a ticket to an agent
 */
router.post('/:id/assign', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { agentId } = req.body;

    const ticket = await ticketService.assign(req.params.id, authReq.user.userId, agentId);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error('[TicketRoutes] Assign error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to assign ticket',
    });
  }
});

/**
 * POST /tickets/:id/status
 * Update ticket status
 */
router.post('/:id/status', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: 'status is required' });
      return;
    }

    const ticket = await ticketService.changeStatus(req.params.id, authReq.user.userId, status);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error('[TicketRoutes] Status update error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update ticket status',
    });
  }
});

/**
 * GET /tickets/:id/messages
 * Get messages for a ticket
 */
router.get('/:id/messages', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const messages = await ticketService.getMessages(req.params.id, authReq.user.userId);
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('[TicketRoutes] Get messages error:', error);
    res.status(500).json({ error: 'Failed to get ticket messages' });
  }
});

/**
 * POST /tickets/:id/messages
 * Add a message to a ticket
 */
router.post('/:id/messages', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { body, senderType, isInternal } = req.body;

    if (!body) {
      res.status(400).json({ error: 'body is required' });
      return;
    }

    const message = await ticketService.addMessage(req.params.id, authReq.user.userId, {
      senderId: authReq.user.userId,
      body,
      senderType: senderType || 'customer',
      isInternal,
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('[TicketRoutes] Add message error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to add message',
    });
  }
});

/**
 * POST /tickets/:id/tags
 * Add a tag to a ticket
 */
router.post('/:id/tags', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { tagId } = req.body;

    if (!tagId) {
      res.status(400).json({ error: 'tagId is required' });
      return;
    }

    await ticketService.addTag(req.params.id, authReq.user.userId, tagId);
    res.json({ success: true, message: 'Tag added to ticket' });
  } catch (error) {
    console.error('[TicketRoutes] Add tag error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to add tag to ticket',
    });
  }
});

/**
 * DELETE /tickets/:id/tags/:tagId
 * Remove a tag from a ticket
 */
router.delete('/:id/tags/:tagId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    await ticketService.removeTag(req.params.id, authReq.user.userId, req.params.tagId);
    res.json({ success: true, message: 'Tag removed from ticket' });
  } catch (error) {
    console.error('[TicketRoutes] Remove tag error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to remove tag from ticket',
    });
  }
});

export default router;
