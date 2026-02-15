import { Router, Request, Response } from 'express';
import { getPushService } from '../services/push.service';
import { getDeviceTokenService } from '../services/device.service';

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
const deviceTokenService = getDeviceTokenService();

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

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Register token using device token service
    const result = await deviceTokenService.registerToken({
      userId,
      token,
      platform,
      deviceName,
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Device token registered',
        deviceToken: result.deviceToken,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('[NotificationsRoutes] Register token error:', error instanceof Error ? error.message : error);
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

    // Deactivate token using device token service
    const result = await deviceTokenService.deactivateToken(token);

    if (result.success) {
      res.json({
        success: true,
        message: 'Device token removed',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('[NotificationsRoutes] Unregister token error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to unregister token',
    });
  }
});

/**
 * GET /notifications/devices
 * Get all devices for the current user
 */
router.get('/devices', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const result = await deviceTokenService.getTokensByUserId(userId, true);

    res.json({
      success: true,
      devices: result.tokens.map((t) => ({
        id: t.id,
        platform: t.platform,
        deviceName: t.deviceName,
        isActive: t.isActive,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    });
  } catch (error) {
    console.error('[NotificationsRoutes] Get devices error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get devices',
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

      // Handle failed tokens
      if (result.failedTokens && result.failedTokens.length > 0) {
        await deviceTokenService.handleFailedTokens(result.failedTokens);
      }

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

      // Handle failed tokens
      if (result.failedTokens && result.failedTokens.length > 0) {
        await deviceTokenService.handleFailedTokens(result.failedTokens);
      }

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
      // Fetch user's tokens using device token service
      const userTokens = await deviceTokenService.getTokenStringsForUser(userId);

      if (userTokens.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No active devices found for user',
        });
        return;
      }

      const result = await push.sendToDevices(userTokens, payload);

      // Handle failed tokens
      if (result.failedTokens && result.failedTokens.length > 0) {
        await deviceTokenService.handleFailedTokens(result.failedTokens);
      }

      res.json({
        success: result.success,
        messageId: result.messageId,
        devicesNotified: userTokens.length,
        failedTokens: result.failedTokens,
        error: result.error,
      });
      return;
    }

    res.status(400).json({ error: 'No valid target specified' });
  } catch (error) {
    console.error('[NotificationsRoutes] Send notification error:', error instanceof Error ? error.message : error);
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
    console.error('[NotificationsRoutes] Send to topic error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to send topic notification',
    });
  }
});

/**
 * POST /notifications/broadcast
 * Send notification to all active devices
 * Requires admin authentication
 */
router.post('/broadcast', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check admin permission
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { title, body, imageUrl, data, platform } =
      req.body as SendNotificationRequest & { platform?: 'web' | 'android' | 'ios' };

    if (!title || !body) {
      res.status(400).json({ error: 'Title and body are required' });
      return;
    }

    // Get all active tokens
    const result = await deviceTokenService.getActiveTokens(platform);

    if (result.tokens.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No active devices found',
      });
      return;
    }

    const tokens = result.tokens.map((t) => t.token);
    const sendResult = await push.sendToDevices(tokens, { title, body, imageUrl, data });

    // Handle failed tokens
    if (sendResult.failedTokens && sendResult.failedTokens.length > 0) {
      await deviceTokenService.handleFailedTokens(sendResult.failedTokens);
    }

    res.json({
      success: sendResult.success,
      messageId: sendResult.messageId,
      devicesNotified: tokens.length,
      failedCount: sendResult.failedTokens?.length || 0,
      error: sendResult.error,
    });
  } catch (error) {
    console.error('[NotificationsRoutes] Broadcast error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to broadcast notification',
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
      console.error('[NotificationsRoutes] Subscribe to topic error:', error instanceof Error ? error.message : error);
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
      console.error('[NotificationsRoutes] Unsubscribe from topic error:', error instanceof Error ? error.message : error);
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
    console.error('[NotificationsRoutes] Get history error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get notification history',
    });
  }
});

// =============================================================================
// Admin Endpoints
// =============================================================================

/**
 * GET /notifications/stats
 * Get device token statistics (admin only)
 */
router.get('/stats', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const stats = await deviceTokenService.getStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[NotificationsRoutes] Get stats error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get stats',
    });
  }
});

/**
 * POST /notifications/cleanup
 * Clean up inactive device tokens (admin only)
 */
router.post('/cleanup', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const daysOld = parseInt(req.body.daysOld as string) || 30;
    const deletedCount = await deviceTokenService.cleanupInactiveTokens(daysOld);

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} inactive tokens`,
      deletedCount,
    });
  } catch (error) {
    console.error('[NotificationsRoutes] Cleanup error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to cleanup tokens',
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
    const stats = await deviceTokenService.getStats();

    res.json({
      success: true,
      status: isReady ? 'ready' : 'disabled',
      message: isReady
        ? 'Push notification service is ready'
        : 'Push notifications disabled (check Firebase credentials)',
      deviceStats: stats,
    });
  } catch (error) {
    console.error('[NotificationsRoutes] Status check error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

export default router;
