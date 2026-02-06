// =============================================================================
// Types
// =============================================================================

export interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'web' | 'android' | 'ios';
  deviceName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterTokenInput {
  userId: string;
  token: string;
  platform: 'web' | 'android' | 'ios';
  deviceName?: string;
}

export interface DeviceTokenResult {
  success: boolean;
  deviceToken?: DeviceToken;
  error?: string;
}

export interface TokensResult {
  success: boolean;
  tokens: DeviceToken[];
  error?: string;
}

// =============================================================================
// Device Token Service
// =============================================================================

/**
 * Service for managing device tokens in the database.
 * This service handles CRUD operations for FCM device tokens.
 *
 * Note: This implementation uses placeholder database calls.
 * Replace with actual Prisma calls when integrating with your database.
 */
export class DeviceTokenService {
  // In-memory store for development (replace with Prisma in production)
  private tokens: Map<string, DeviceToken> = new Map();

  // ===========================================================================
  // Create / Register
  // ===========================================================================

  /**
   * Register or update a device token
   * Uses upsert logic - creates if not exists, updates if exists
   */
  async registerToken(input: RegisterTokenInput): Promise<DeviceTokenResult> {
    try {
      const { userId, token, platform, deviceName } = input;

      if (!userId || !token || !platform) {
        return {
          success: false,
          error: 'userId, token, and platform are required',
        };
      }

      const now = new Date();

      // Check if token already exists
      const existingToken = await this.findByToken(token);

      if (existingToken) {
        // Update existing token
        const updatedToken: DeviceToken = {
          ...existingToken,
          userId,
          platform,
          deviceName: deviceName || existingToken.deviceName,
          isActive: true,
          updatedAt: now,
        };

        // In production, use Prisma:
        // await prisma.deviceToken.update({
        //   where: { token },
        //   data: { userId, platform, deviceName, isActive: true, updatedAt: now },
        // });

        this.tokens.set(token, updatedToken);

        return {
          success: true,
          deviceToken: updatedToken,
        };
      }

      // Create new token
      const newToken: DeviceToken = {
        id: this.generateId(),
        userId,
        token,
        platform,
        deviceName,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      // In production, use Prisma:
      // await prisma.deviceToken.create({
      //   data: { userId, token, platform, deviceName },
      // });

      this.tokens.set(token, newToken);

      console.log('[DeviceTokenService] Token registered:', {
        userId,
        platform,
        tokenPrefix: token.substring(0, 20) + '...',
      });

      return {
        success: true,
        deviceToken: newToken,
      };
    } catch (error) {
      console.error('[DeviceTokenService] Register token error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to register token',
      };
    }
  }

  // ===========================================================================
  // Read
  // ===========================================================================

  /**
   * Find a device token by its token value
   */
  async findByToken(token: string): Promise<DeviceToken | null> {
    try {
      // In production, use Prisma:
      // return prisma.deviceToken.findUnique({ where: { token } });

      return this.tokens.get(token) || null;
    } catch (error) {
      console.error('[DeviceTokenService] Find by token error:', error);
      return null;
    }
  }

  /**
   * Find a device token by its ID
   */
  async findById(id: string): Promise<DeviceToken | null> {
    try {
      // In production, use Prisma:
      // return prisma.deviceToken.findUnique({ where: { id } });

      for (const token of this.tokens.values()) {
        if (token.id === id) {
          return token;
        }
      }
      return null;
    } catch (error) {
      console.error('[DeviceTokenService] Find by id error:', error);
      return null;
    }
  }

  /**
   * Get all tokens for a specific user
   */
  async getTokensByUserId(
    userId: string,
    activeOnly: boolean = true
  ): Promise<TokensResult> {
    try {
      // In production, use Prisma:
      // const tokens = await prisma.deviceToken.findMany({
      //   where: { userId, ...(activeOnly && { isActive: true }) },
      //   orderBy: { updatedAt: 'desc' },
      // });

      const userTokens: DeviceToken[] = [];
      for (const token of this.tokens.values()) {
        if (token.userId === userId) {
          if (!activeOnly || token.isActive) {
            userTokens.push(token);
          }
        }
      }

      // Sort by updatedAt descending
      userTokens.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      return {
        success: true,
        tokens: userTokens,
      };
    } catch (error) {
      console.error('[DeviceTokenService] Get tokens by user error:', error);
      return {
        success: false,
        tokens: [],
        error: error instanceof Error ? error.message : 'Failed to get tokens',
      };
    }
  }

  /**
   * Get all active tokens (for broadcast notifications)
   */
  async getActiveTokens(
    platform?: 'web' | 'android' | 'ios'
  ): Promise<TokensResult> {
    try {
      // In production, use Prisma:
      // const tokens = await prisma.deviceToken.findMany({
      //   where: { isActive: true, ...(platform && { platform }) },
      // });

      const activeTokens: DeviceToken[] = [];
      for (const token of this.tokens.values()) {
        if (token.isActive) {
          if (!platform || token.platform === platform) {
            activeTokens.push(token);
          }
        }
      }

      return {
        success: true,
        tokens: activeTokens,
      };
    } catch (error) {
      console.error('[DeviceTokenService] Get active tokens error:', error);
      return {
        success: false,
        tokens: [],
        error: error instanceof Error ? error.message : 'Failed to get active tokens',
      };
    }
  }

  /**
   * Get token strings for a user (for sending notifications)
   */
  async getTokenStringsForUser(userId: string): Promise<string[]> {
    const result = await this.getTokensByUserId(userId, true);
    return result.tokens.map((t) => t.token);
  }

  // ===========================================================================
  // Update
  // ===========================================================================

  /**
   * Mark a token as active
   */
  async activateToken(token: string): Promise<DeviceTokenResult> {
    try {
      const existingToken = await this.findByToken(token);
      if (!existingToken) {
        return { success: false, error: 'Token not found' };
      }

      // In production, use Prisma:
      // await prisma.deviceToken.update({
      //   where: { token },
      //   data: { isActive: true, updatedAt: new Date() },
      // });

      existingToken.isActive = true;
      existingToken.updatedAt = new Date();
      this.tokens.set(token, existingToken);

      return { success: true, deviceToken: existingToken };
    } catch (error) {
      console.error('[DeviceTokenService] Activate token error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to activate token',
      };
    }
  }

  /**
   * Mark a token as inactive (soft delete)
   */
  async deactivateToken(token: string): Promise<DeviceTokenResult> {
    try {
      const existingToken = await this.findByToken(token);
      if (!existingToken) {
        return { success: false, error: 'Token not found' };
      }

      // In production, use Prisma:
      // await prisma.deviceToken.update({
      //   where: { token },
      //   data: { isActive: false, updatedAt: new Date() },
      // });

      existingToken.isActive = false;
      existingToken.updatedAt = new Date();
      this.tokens.set(token, existingToken);

      console.log('[DeviceTokenService] Token deactivated:', token.substring(0, 20) + '...');

      return { success: true, deviceToken: existingToken };
    } catch (error) {
      console.error('[DeviceTokenService] Deactivate token error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deactivate token',
      };
    }
  }

  // ===========================================================================
  // Delete
  // ===========================================================================

  /**
   * Permanently delete a token
   */
  async deleteToken(token: string): Promise<boolean> {
    try {
      // In production, use Prisma:
      // await prisma.deviceToken.delete({ where: { token } });

      const deleted = this.tokens.delete(token);

      if (deleted) {
        console.log('[DeviceTokenService] Token deleted:', token.substring(0, 20) + '...');
      }

      return deleted;
    } catch (error) {
      console.error('[DeviceTokenService] Delete token error:', error);
      return false;
    }
  }

  /**
   * Delete all tokens for a user (useful for logout/account deletion)
   */
  async deleteTokensForUser(userId: string): Promise<number> {
    try {
      // In production, use Prisma:
      // const result = await prisma.deviceToken.deleteMany({ where: { userId } });
      // return result.count;

      let deletedCount = 0;
      for (const [token, data] of this.tokens.entries()) {
        if (data.userId === userId) {
          this.tokens.delete(token);
          deletedCount++;
        }
      }

      console.log(`[DeviceTokenService] Deleted ${deletedCount} tokens for user:`, userId);
      return deletedCount;
    } catch (error) {
      console.error('[DeviceTokenService] Delete tokens for user error:', error);
      return 0;
    }
  }

  /**
   * Clean up inactive tokens older than a specified number of days
   */
  async cleanupInactiveTokens(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // In production, use Prisma:
      // const result = await prisma.deviceToken.deleteMany({
      //   where: {
      //     isActive: false,
      //     updatedAt: { lt: cutoffDate },
      //   },
      // });
      // return result.count;

      let deletedCount = 0;
      for (const [token, data] of this.tokens.entries()) {
        if (!data.isActive && data.updatedAt < cutoffDate) {
          this.tokens.delete(token);
          deletedCount++;
        }
      }

      console.log(`[DeviceTokenService] Cleaned up ${deletedCount} inactive tokens`);
      return deletedCount;
    } catch (error) {
      console.error('[DeviceTokenService] Cleanup inactive tokens error:', error);
      return 0;
    }
  }

  /**
   * Handle failed tokens (tokens that FCM reports as invalid)
   * Deactivates or deletes tokens that are no longer valid
   */
  async handleFailedTokens(tokens: string[]): Promise<void> {
    if (!tokens || tokens.length === 0) return;

    try {
      console.log(`[DeviceTokenService] Handling ${tokens.length} failed tokens`);

      // In production, use Prisma:
      // await prisma.deviceToken.updateMany({
      //   where: { token: { in: tokens } },
      //   data: { isActive: false, updatedAt: new Date() },
      // });

      for (const token of tokens) {
        await this.deactivateToken(token);
      }
    } catch (error) {
      console.error('[DeviceTokenService] Handle failed tokens error:', error);
    }
  }

  // ===========================================================================
  // Stats
  // ===========================================================================

  /**
   * Get token statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    byPlatform: Record<string, number>;
  }> {
    try {
      // In production, use Prisma aggregate queries

      let total = 0;
      let active = 0;
      const byPlatform: Record<string, number> = {
        web: 0,
        android: 0,
        ios: 0,
      };

      for (const token of this.tokens.values()) {
        total++;
        if (token.isActive) {
          active++;
        }
        byPlatform[token.platform] = (byPlatform[token.platform] || 0) + 1;
      }

      return { total, active, byPlatform };
    } catch (error) {
      console.error('[DeviceTokenService] Get stats error:', error);
      return { total: 0, active: 0, byPlatform: {} };
    }
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private generateId(): string {
    return `dt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

// =============================================================================
// Factory
// =============================================================================

let deviceTokenServiceInstance: DeviceTokenService | null = null;

/**
 * Get or create the device token service singleton
 */
export function getDeviceTokenService(): DeviceTokenService {
  if (!deviceTokenServiceInstance) {
    deviceTokenServiceInstance = new DeviceTokenService();
  }
  return deviceTokenServiceInstance;
}

/**
 * Create a new device token service instance
 */
export function createDeviceTokenService(): DeviceTokenService {
  return new DeviceTokenService();
}

export default DeviceTokenService;
