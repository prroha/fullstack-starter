import * as admin from 'firebase-admin';

// =============================================================================
// Types
// =============================================================================

export interface PushConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
  databaseUrl?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
  clickAction?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  failedTokens?: string[];
  error?: string;
}

export interface TopicSubscribeResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors?: Array<{ token: string; error: string }>;
}

export interface DeviceInfo {
  token: string;
  platform: 'web' | 'android' | 'ios';
  userId?: string;
}

// =============================================================================
// Push Notification Service
// =============================================================================

export class PushService {
  private app: admin.app.App | null = null;
  private messaging: admin.messaging.Messaging | null = null;
  private initialized = false;

  constructor(config: PushConfig) {
    this.initialize(config);
  }

  private initialize(config: PushConfig): void {
    if (!config.projectId || !config.privateKey || !config.clientEmail) {
      console.warn('[PushService] Firebase credentials not provided, service disabled');
      return;
    }

    try {
      // Check if already initialized
      try {
        this.app = admin.app('push-notifications');
      } catch {
        // App not initialized, create it
        this.app = admin.initializeApp(
          {
            credential: admin.credential.cert({
              projectId: config.projectId,
              privateKey: config.privateKey.replace(/\\n/g, '\n'),
              clientEmail: config.clientEmail,
            }),
            databaseURL: config.databaseUrl,
          },
          'push-notifications'
        );
      }

      this.messaging = this.app.messaging();
      this.initialized = true;
      console.log('[PushService] Firebase initialized successfully');
    } catch (error) {
      console.error('[PushService] Firebase initialization error:', error);
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.initialized && this.messaging !== null;
  }

  // ===========================================================================
  // Send Notifications
  // ===========================================================================

  /**
   * Send notification to a single device
   */
  async sendToDevice(token: string, payload: NotificationPayload): Promise<SendResult> {
    if (!this.isReady()) {
      return { success: false, error: 'Push service not initialized' };
    }

    try {
      const message = this.buildMessage(token, payload);
      const response = await this.messaging!.send(message);

      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      console.error('[PushService] Send to device error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        failedTokens: [token],
      };
    }
  }

  /**
   * Send notification to multiple devices
   */
  async sendToDevices(
    tokens: string[],
    payload: NotificationPayload
  ): Promise<SendResult> {
    if (!this.isReady()) {
      return { success: false, error: 'Push service not initialized' };
    }

    if (tokens.length === 0) {
      return { success: true, messageId: 'no-tokens' };
    }

    // FCM supports max 500 tokens per request
    const batchSize = 500;
    const batches: string[][] = [];
    for (let i = 0; i < tokens.length; i += batchSize) {
      batches.push(tokens.slice(i, i + batchSize));
    }

    const failedTokens: string[] = [];
    let totalSuccess = 0;

    try {
      for (const batch of batches) {
        const message: admin.messaging.MulticastMessage = {
          tokens: batch,
          notification: {
            title: payload.title,
            body: payload.body,
            imageUrl: payload.imageUrl,
          },
          data: payload.data,
          android: this.getAndroidConfig(payload),
          apns: this.getApnsConfig(payload),
          webpush: this.getWebPushConfig(payload),
        };

        const response = await this.messaging!.sendEachForMulticast(message);
        totalSuccess += response.successCount;

        // Collect failed tokens
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(batch[idx]);
          }
        });
      }

      return {
        success: failedTokens.length < tokens.length,
        messageId: `multicast-${totalSuccess}-success`,
        failedTokens: failedTokens.length > 0 ? failedTokens : undefined,
      };
    } catch (error) {
      console.error('[PushService] Send to devices error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        failedTokens: tokens,
      };
    }
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(topic: string, payload: NotificationPayload): Promise<SendResult> {
    if (!this.isReady()) {
      return { success: false, error: 'Push service not initialized' };
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
        android: this.getAndroidConfig(payload),
        apns: this.getApnsConfig(payload),
        webpush: this.getWebPushConfig(payload),
      };

      const response = await this.messaging!.send(message);

      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      console.error('[PushService] Send to topic error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Send notification with condition
   * Example condition: "'news' in topics && 'premium' in topics"
   */
  async sendWithCondition(
    condition: string,
    payload: NotificationPayload
  ): Promise<SendResult> {
    if (!this.isReady()) {
      return { success: false, error: 'Push service not initialized' };
    }

    try {
      const message: admin.messaging.Message = {
        condition,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
        android: this.getAndroidConfig(payload),
        apns: this.getApnsConfig(payload),
        webpush: this.getWebPushConfig(payload),
      };

      const response = await this.messaging!.send(message);

      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      console.error('[PushService] Send with condition error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  // ===========================================================================
  // Topic Management
  // ===========================================================================

  /**
   * Subscribe tokens to a topic
   */
  async subscribeToTopic(
    tokens: string[],
    topic: string
  ): Promise<TopicSubscribeResult> {
    if (!this.isReady()) {
      return {
        success: false,
        successCount: 0,
        failureCount: tokens.length,
        errors: [{ token: '*', error: 'Push service not initialized' }],
      };
    }

    try {
      const response = await this.messaging!.subscribeToTopic(tokens, topic);

      const errors: Array<{ token: string; error: string }> = [];
      response.errors?.forEach((err, idx) => {
        errors.push({
          token: tokens[idx],
          error: err.error.message,
        });
      });

      return {
        success: response.failureCount === 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('[PushService] Subscribe to topic error:', error);
      return {
        success: false,
        successCount: 0,
        failureCount: tokens.length,
        errors: [{ token: '*', error: this.getErrorMessage(error) }],
      };
    }
  }

  /**
   * Unsubscribe tokens from a topic
   */
  async unsubscribeFromTopic(
    tokens: string[],
    topic: string
  ): Promise<TopicSubscribeResult> {
    if (!this.isReady()) {
      return {
        success: false,
        successCount: 0,
        failureCount: tokens.length,
        errors: [{ token: '*', error: 'Push service not initialized' }],
      };
    }

    try {
      const response = await this.messaging!.unsubscribeFromTopic(tokens, topic);

      const errors: Array<{ token: string; error: string }> = [];
      response.errors?.forEach((err, idx) => {
        errors.push({
          token: tokens[idx],
          error: err.error.message,
        });
      });

      return {
        success: response.failureCount === 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('[PushService] Unsubscribe from topic error:', error);
      return {
        success: false,
        successCount: 0,
        failureCount: tokens.length,
        errors: [{ token: '*', error: this.getErrorMessage(error) }],
      };
    }
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private buildMessage(
    token: string,
    payload: NotificationPayload
  ): admin.messaging.Message {
    return {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data,
      android: this.getAndroidConfig(payload),
      apns: this.getApnsConfig(payload),
      webpush: this.getWebPushConfig(payload),
    };
  }

  private getAndroidConfig(
    payload: NotificationPayload
  ): admin.messaging.AndroidConfig {
    return {
      priority: 'high',
      notification: {
        sound: payload.sound || 'default',
        clickAction: payload.clickAction,
        channelId: 'default',
      },
    };
  }

  private getApnsConfig(payload: NotificationPayload): admin.messaging.ApnsConfig {
    return {
      payload: {
        aps: {
          sound: payload.sound || 'default',
          badge: payload.badge,
          contentAvailable: true,
        },
      },
    };
  }

  private getWebPushConfig(
    payload: NotificationPayload
  ): admin.messaging.WebpushConfig {
    return {
      notification: {
        icon: '/icon-192.png',
        badge: '/badge.png',
        requireInteraction: true,
      },
      fcmOptions: {
        link: payload.clickAction,
      },
    };
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      // Check for specific FCM error codes
      const fcmError = error as Error & { code?: string };
      if (fcmError.code) {
        switch (fcmError.code) {
          case 'messaging/invalid-registration-token':
            return 'Invalid device token';
          case 'messaging/registration-token-not-registered':
            return 'Device token not registered';
          case 'messaging/invalid-argument':
            return 'Invalid message format';
          case 'messaging/quota-exceeded':
            return 'Message quota exceeded';
          default:
            return fcmError.message;
        }
      }
      return error.message;
    }
    return 'Unknown push notification error';
  }
}

// =============================================================================
// Factory
// =============================================================================

let pushServiceInstance: PushService | null = null;

/**
 * Get or create the push service singleton
 */
export function getPushService(): PushService {
  if (!pushServiceInstance) {
    pushServiceInstance = new PushService({
      projectId: process.env.FIREBASE_PROJECT_ID || '',
      privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
      databaseUrl: process.env.FIREBASE_DATABASE_URL,
    });
  }
  return pushServiceInstance;
}

/**
 * Create a custom push service instance
 */
export function createPushService(config: PushConfig): PushService {
  return new PushService(config);
}

export default PushService;
