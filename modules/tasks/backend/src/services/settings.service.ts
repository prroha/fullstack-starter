// =============================================================================
// Settings Service
// =============================================================================
// Business logic for per-user task settings.
// Uses placeholder db operations - replace with actual Prisma client.

// =============================================================================
// Types
// =============================================================================

export interface SettingsUpdateInput {
  defaultView?: string;
  defaultProjectId?: string;
  showCompletedTasks?: boolean;
}

interface SettingsRecord {
  id: string;
  userId: string;
  defaultView: string;
  defaultProjectId: string | null;
  showCompletedTasks: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================

const dbOperations = {
  async getSettings(userId: string): Promise<SettingsRecord | null> {
    console.log('[DB] Getting task settings for user:', userId);
    return null;
  },

  async upsertSettings(userId: string, data: Partial<SettingsRecord>): Promise<SettingsRecord> {
    console.log('[DB] Upserting task settings for user:', userId);
    return {
      id: 'settings_' + Date.now(),
      userId,
      defaultView: (data.defaultView as string) || 'LIST',
      defaultProjectId: (data.defaultProjectId as string) || null,
      showCompletedTasks: data.showCompletedTasks ?? true,
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
      showCompletedTasks: true,
    });
  }

  async update(userId: string, input: SettingsUpdateInput): Promise<SettingsRecord> {
    return dbOperations.upsertSettings(userId, input as Partial<SettingsRecord>);
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
