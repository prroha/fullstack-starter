import { Router, Request, Response } from 'express';
import { getPushService } from '../services/push.service';

// =============================================================================
// Types
// =============================================================================

interface RegisterTokenRequest {
  token: string;
  platform: 'web' | 'android' | 'ios';
  deviceName?: string;
}

interface SendNotificationRequest {
  userId?: string;
  token?: string;
  tokens?: string[];
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
}

interface SendTopicRequest {
  topic: string;
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
}

interface TopicSubscribeRequest {
  tokens: string[];
  topic: string;
}

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// =============================================================================
// Router Setup
// =============================================================================

const router = Router();
const push = getPushService();

// =============================================================================
// Device Token Management
// =============================================================================

/**
 * POST /notifications/register
 * Register a device token for push notifications
 */
router.post('/register', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { token, platform, deviceName } = req.body as RegisterTokenRequest;
    const userId = req.user?.id;

    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    if (!platform || !['web', 'android', 'ios'].includes(platform)) {
      res.status(400).json({ error: 'Valid platform is required (web, android, ios)' });
      return;
    }

    // In production, save to database:
    // await prisma.deviceToken.upsert({
    //   where: { token },
    //   create: { token, platform, userId, deviceName },
    //   update: { platform, userId, deviceName, isActive: true, updatedAt: new Date() },
    // });

    console.log('[NotificationsRoutes] Token registered:', {
      token: token.substring(0, 20) + '...',
      platform,
      userId,
      deviceName,
    });

    res.json({
      success: true,
      message: 'Device token registered',
    });
  } catch (error) {
    console.error('[NotificationsRoutes] Register token error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to register token',
    });
  }
});

/**
 * DELETE /notifications/unregister
 * Remove a device token
 */
router.delete('/unregister', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body as { token: string };

    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    // In production, mark as inactive or delete:
    // await prisma.deviceToken.update({
    //   where: { token },
    //   data: { isActive: false },
    // });

    console.log('[NotificationsRoutes] Token unregistered:', token.substring(0, 20) + '...');

    res.json({
      success: true,
      message: 'Device token removed',
    });
  } catch (error) {
    console.error('[NotificationsRoutes] Unregister token error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to unregister token',
    });
  }
});

// =============================================================================
// Send Notifications
// =============================================================================

/**
 * POST /notifications/send
 * Send notification to specific device(s) or user
 * Requires admin authentication
 */
router.post('/send', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check admin permission
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { userId, token, tokens, title, body, imageUrl, data } =
      req.body as SendNotificationRequest;

    if (!title || !body) {
      res.status(400).json({ error: 'Title and body are required' });
      return;
    }

    if (!token && !tokens && !userId) {
      res.status(400).json({
        error: 'Either token, tokens, or userId is required',
      });
      return;
    }

    const payload = { title, body, imageUrl, data };

    // Send to specific token
    if (token) {
      const result = await push.sendToDevice(token, payload);
      res.json({
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      });
      return;
    }

    // Send to multiple tokens
    if (tokens && tokens.length > 0) {
      const result = await push.sendToDevices(tokens, payload);
      res.json({
        success: result.success,
        messageId: result.messageId,
        failedTokens: result.failedTokens,
        error: result.error,
      });
      return;
    }

    // Send to user's devices
    if (userId) {
      // In production, fetch user's tokens:
      // const deviceTokens = await prisma.deviceToken.findMany({
      //   where: { userId, isActive: true },
      //   select: { token: true },
      // });
      // const userTokens = deviceTokens.map(d => d.token);

      // For now, return error indicating tokens need to be fetched
      res.status(400).json({
        error: 'User token lookup not implemented. Provide tokens directly.',
      });
      return;
    }

    res.status(400).json({ error: 'No valid target specified' });
  } catch (error) {
    console.error('[NotificationsRoutes] Send notification error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to send notification',
    });
  }
});

/**
 * POST /notifications/send-topic
 * Send notification to a topic
 * Requires admin authentication
 */
router.post('/send-topic', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check admin permission
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { topic, title, body, imageUrl, data } = req.body as SendTopicRequest;

    if (!topic) {
      res.status(400).json({ error: 'Topic is required' });
      return;
    }

    if (!title || !body) {
      res.status(400).json({ error: 'Title and body are required' });
      return;
    }

    const result = await push.sendToTopic(topic, { title, body, imageUrl, data });

    res.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    });
  } catch (error) {
    console.error('[NotificationsRoutes] Send to topic error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to send topic notification',
    });
  }
});

// =============================================================================
// Topic Subscription
// =============================================================================

/**
 * POST /notifications/topics/subscribe
 * Subscribe tokens to a topic
 */
router.post(
  '/topics/subscribe',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { tokens, topic } = req.body as TopicSubscribeRequest;

      if (!tokens || tokens.length === 0) {
        res.status(400).json({ error: 'Tokens array is required' });
        return;
      }

      if (!topic) {
        res.status(400).json({ error: 'Topic is required' });
        return;
      }

      const result = await push.subscribeToTopic(tokens, topic);

      res.json({
        success: result.success,
        successCount: result.successCount,
        failureCount: result.failureCount,
        errors: result.errors,
      });
    } catch (error) {
      console.error('[NotificationsRoutes] Subscribe to topic error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to subscribe to topic',
      });
    }
  }
);

/**
 * POST /notifications/topics/unsubscribe
 * Unsubscribe tokens from a topic
 */
router.post(
  '/topics/unsubscribe',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { tokens, topic } = req.body as TopicSubscribeRequest;

      if (!tokens || tokens.length === 0) {
        res.status(400).json({ error: 'Tokens array is required' });
        return;
      }

      if (!topic) {
        res.status(400).json({ error: 'Topic is required' });
        return;
      }

      const result = await push.unsubscribeFromTopic(tokens, topic);

      res.json({
        success: result.success,
        successCount: result.successCount,
        failureCount: result.failureCount,
        errors: result.errors,
      });
    } catch (error) {
      console.error('[NotificationsRoutes] Unsubscribe from topic error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to unsubscribe from topic',
      });
    }
  }
);

// =============================================================================
// Notification History
// =============================================================================

/**
 * GET /notifications/history
 * Get notification history for the current user
 */
router.get('/history', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // In production, fetch from database:
    // const notifications = await prisma.notification.findMany({
    //   where: { userId },
    //   orderBy: { createdAt: 'desc' },
    //   skip: (page - 1) * limit,
    //   take: limit,
    // });

    // For now, return empty array
    res.json({
      success: true,
      notifications: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    });
  } catch (error) {
    console.error('[NotificationsRoutes] Get history error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get notification history',
    });
  }
});

/**
 * GET /notifications/status
 * Check push service status
 */
router.get('/status', async (_req: Request, res: Response): Promise<void> => {
  try {
    const isReady = push.isReady();

    res.json({
      success: true,
      status: isReady ? 'ready' : 'disabled',
      message: isReady
        ? 'Push notification service is ready'
        : 'Push notifications disabled (check Firebase credentials)',
    });
  } catch (error) {
    console.error('[NotificationsRoutes] Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

export default router;
