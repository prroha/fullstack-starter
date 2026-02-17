import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getPushService } from '../services/push.service.js';
import { getDeviceTokenService } from '../services/device.service.js';

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

// Extend Fastify Request to include user
interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// =============================================================================
// Routes Plugin
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  const push = getPushService();
  const deviceTokenService = getDeviceTokenService();

  // ===========================================================================
  // Device Token Management
  // ===========================================================================

  /**
   * POST /notifications/register
   * Register a device token for push notifications
   */
  fastify.post('/register', async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { token, platform, deviceName } = req.body as RegisterTokenRequest;
    const userId = authReq.user?.id;

    if (!token) {
      return reply.code(400).send({ error: 'Token is required' });
    }

    if (!platform || !['web', 'android', 'ios'].includes(platform)) {
      return reply.code(400).send({ error: 'Valid platform is required (web, android, ios)' });
    }

    if (!userId) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    // Register token using device token service
    const result = await deviceTokenService.registerToken({
      userId,
      token,
      platform,
      deviceName,
    });

    if (result.success) {
      return reply.send({
        success: true,
        message: 'Device token registered',
        deviceToken: result.deviceToken,
      });
    } else {
      return reply.code(400).send({
        success: false,
        error: result.error,
      });
    }
  });

  /**
   * DELETE /notifications/unregister
   * Remove a device token
   */
  fastify.delete('/unregister', async (req: FastifyRequest, reply: FastifyReply) => {
    const { token } = req.body as { token: string };

    if (!token) {
      return reply.code(400).send({ error: 'Token is required' });
    }

    // Deactivate token using device token service
    const result = await deviceTokenService.deactivateToken(token);

    if (result.success) {
      return reply.send({
        success: true,
        message: 'Device token removed',
      });
    } else {
      return reply.code(400).send({
        success: false,
        error: result.error,
      });
    }
  });

  /**
   * GET /notifications/devices
   * Get all devices for the current user
   */
  fastify.get('/devices', async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    const result = await deviceTokenService.getTokensByUserId(userId, true);

    return reply.send({
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
  });

  // ===========================================================================
  // Send Notifications
  // ===========================================================================

  /**
   * POST /notifications/send
   * Send notification to specific device(s) or user
   * Requires admin authentication
   */
  fastify.post('/send', async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    // Check admin permission
    if (authReq.user?.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Admin access required' });
    }

    const { userId, token, tokens, title, body, imageUrl, data } =
      req.body as SendNotificationRequest;

    if (!title || !body) {
      return reply.code(400).send({ error: 'Title and body are required' });
    }

    if (!token && !tokens && !userId) {
      return reply.code(400).send({
        error: 'Either token, tokens, or userId is required',
      });
    }

    const payload = { title, body, imageUrl, data };

    // Send to specific token
    if (token) {
      const result = await push.sendToDevice(token, payload);

      // Handle failed tokens
      if (result.failedTokens && result.failedTokens.length > 0) {
        await deviceTokenService.handleFailedTokens(result.failedTokens);
      }

      return reply.send({
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      });
    }

    // Send to multiple tokens
    if (tokens && tokens.length > 0) {
      const result = await push.sendToDevices(tokens, payload);

      // Handle failed tokens
      if (result.failedTokens && result.failedTokens.length > 0) {
        await deviceTokenService.handleFailedTokens(result.failedTokens);
      }

      return reply.send({
        success: result.success,
        messageId: result.messageId,
        failedTokens: result.failedTokens,
        error: result.error,
      });
    }

    // Send to user's devices
    if (userId) {
      // Fetch user's tokens using device token service
      const userTokens = await deviceTokenService.getTokenStringsForUser(userId);

      if (userTokens.length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'No active devices found for user',
        });
      }

      const result = await push.sendToDevices(userTokens, payload);

      // Handle failed tokens
      if (result.failedTokens && result.failedTokens.length > 0) {
        await deviceTokenService.handleFailedTokens(result.failedTokens);
      }

      return reply.send({
        success: result.success,
        messageId: result.messageId,
        devicesNotified: userTokens.length,
        failedTokens: result.failedTokens,
        error: result.error,
      });
    }

    return reply.code(400).send({ error: 'No valid target specified' });
  });

  /**
   * POST /notifications/send-topic
   * Send notification to a topic
   * Requires admin authentication
   */
  fastify.post('/send-topic', async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    // Check admin permission
    if (authReq.user?.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Admin access required' });
    }

    const { topic, title, body, imageUrl, data } = req.body as SendTopicRequest;

    if (!topic) {
      return reply.code(400).send({ error: 'Topic is required' });
    }

    if (!title || !body) {
      return reply.code(400).send({ error: 'Title and body are required' });
    }

    const result = await push.sendToTopic(topic, { title, body, imageUrl, data });

    return reply.send({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    });
  });

  /**
   * POST /notifications/broadcast
   * Send notification to all active devices
   * Requires admin authentication
   */
  fastify.post('/broadcast', async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    // Check admin permission
    if (authReq.user?.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Admin access required' });
    }

    const { title, body, imageUrl, data, platform } =
      req.body as SendNotificationRequest & { platform?: 'web' | 'android' | 'ios' };

    if (!title || !body) {
      return reply.code(400).send({ error: 'Title and body are required' });
    }

    // Get all active tokens
    const result = await deviceTokenService.getActiveTokens(platform);

    if (result.tokens.length === 0) {
      return reply.code(400).send({
        success: false,
        error: 'No active devices found',
      });
    }

    const tokenStrings = result.tokens.map((t) => t.token);
    const sendResult = await push.sendToDevices(tokenStrings, { title, body, imageUrl, data });

    // Handle failed tokens
    if (sendResult.failedTokens && sendResult.failedTokens.length > 0) {
      await deviceTokenService.handleFailedTokens(sendResult.failedTokens);
    }

    return reply.send({
      success: sendResult.success,
      messageId: sendResult.messageId,
      devicesNotified: tokenStrings.length,
      failedCount: sendResult.failedTokens?.length || 0,
      error: sendResult.error,
    });
  });

  // ===========================================================================
  // Topic Subscription
  // ===========================================================================

  /**
   * POST /notifications/topics/subscribe
   * Subscribe tokens to a topic
   */
  fastify.post('/topics/subscribe', async (req: FastifyRequest, reply: FastifyReply) => {
    const { tokens, topic } = req.body as TopicSubscribeRequest;

    if (!tokens || tokens.length === 0) {
      return reply.code(400).send({ error: 'Tokens array is required' });
    }

    if (!topic) {
      return reply.code(400).send({ error: 'Topic is required' });
    }

    const result = await push.subscribeToTopic(tokens, topic);

    return reply.send({
      success: result.success,
      successCount: result.successCount,
      failureCount: result.failureCount,
      errors: result.errors,
    });
  });

  /**
   * POST /notifications/topics/unsubscribe
   * Unsubscribe tokens from a topic
   */
  fastify.post('/topics/unsubscribe', async (req: FastifyRequest, reply: FastifyReply) => {
    const { tokens, topic } = req.body as TopicSubscribeRequest;

    if (!tokens || tokens.length === 0) {
      return reply.code(400).send({ error: 'Tokens array is required' });
    }

    if (!topic) {
      return reply.code(400).send({ error: 'Topic is required' });
    }

    const result = await push.unsubscribeFromTopic(tokens, topic);

    return reply.send({
      success: result.success,
      successCount: result.successCount,
      failureCount: result.failureCount,
      errors: result.errors,
    });
  });

  // ===========================================================================
  // Notification History
  // ===========================================================================

  /**
   * GET /notifications/history
   * Get notification history for the current user
   */
  fastify.get('/history', async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const query = req.query as Record<string, string>;
    const page = parseInt(query.page) || 1;
    const limit = Math.min(100, parseInt(query.limit) || 20);

    if (!userId) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    // In production, fetch from database
    // For now, return empty array
    return reply.send({
      success: true,
      notifications: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    });
  });

  // ===========================================================================
  // Admin Endpoints
  // ===========================================================================

  /**
   * GET /notifications/stats
   * Get device token statistics (admin only)
   */
  fastify.get('/stats', async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    if (authReq.user?.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Admin access required' });
    }

    const stats = await deviceTokenService.getStats();

    return reply.send({
      success: true,
      stats,
    });
  });

  /**
   * POST /notifications/cleanup
   * Clean up inactive device tokens (admin only)
   */
  fastify.post('/cleanup', async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    if (authReq.user?.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Admin access required' });
    }

    const { daysOld: daysOldStr } = req.body as { daysOld?: string };
    const daysOld = parseInt(daysOldStr as string) || 30;
    const deletedCount = await deviceTokenService.cleanupInactiveTokens(daysOld);

    return reply.send({
      success: true,
      message: `Cleaned up ${deletedCount} inactive tokens`,
      deletedCount,
    });
  });

  /**
   * GET /notifications/status
   * Check push service status
   */
  fastify.get('/status', async (_req: FastifyRequest, reply: FastifyReply) => {
    const isReady = push.isReady();
    const stats = await deviceTokenService.getStats();

    return reply.send({
      success: true,
      status: isReady ? 'ready' : 'disabled',
      message: isReady
        ? 'Push notification service is ready'
        : 'Push notifications disabled (check Firebase credentials)',
      deviceStats: stats,
    });
  });
};

export default routes;
