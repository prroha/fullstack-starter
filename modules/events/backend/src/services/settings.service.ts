// =============================================================================
// Settings Service
// =============================================================================
// Business logic for per-user event settings.
// Uses placeholder db operations - replace with actual Prisma client.

// =============================================================================
// Types
// =============================================================================

export interface SettingsUpdateInput {
  defaultView?: string;
  defaultCategoryId?: string;
  currency?: string;
  timezone?: string;
}

interface SettingsRecord {
  id: string;
  userId: string;
  defaultView: string;
  defaultCategoryId: string | null;
  currency: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================

const dbOperations = {
  async getSettings(userId: string): Promise<SettingsRecord | null> {
    console.log('[DB] Getting event settings for user:', userId);
    return null;
  },

  async upsertSettings(userId: string, data: Partial<SettingsRecord>): Promise<SettingsRecord> {
    console.log('[DB] Upserting event settings for user:', userId);
    return {
      id: 'settings_' + Date.now(),
      userId,
      defaultView: data.defaultView ?? 'LIST',
      defaultCategoryId: data.defaultCategoryId ?? null,
      currency: data.currency ?? 'USD',
      timezone: data.timezone ?? 'UTC',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
};

// =============================================================================
// Settings Service
// =============================================================================

export class SettingsService {
  async get(userId: string): Promise<SettingsRecord> {
    const settings = await dbOperations.getSettings(userId);
    if (settings) return settings;

    return dbOperations.upsertSettings(userId, {
      defaultView: 'LIST',
      currency: 'USD',
      timezone: 'UTC',
    });
  }

  async update(userId: string, input: SettingsUpdateInput): Promise<SettingsRecord> {
    const updateData: Partial<SettingsRecord> = {};
    if (input.defaultView !== undefined) updateData.defaultView = input.defaultView;
    if (input.defaultCategoryId !== undefined) updateData.defaultCategoryId = input.defaultCategoryId ?? null;
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.timezone !== undefined) updateData.timezone = input.timezone;

    return dbOperations.upsertSettings(userId, updateData);
  }
}

// =============================================================================
// Factory
// =============================================================================

let instance: SettingsService | null = null;

export function getSettingsService(): SettingsService {
  if (!instance) instance = new SettingsService();
  return instance;
}

export default SettingsService;
