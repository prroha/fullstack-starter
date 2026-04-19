// =============================================================================
// Settings Service
// =============================================================================
// Business logic for per-user task settings.
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface SettingsUpdateInput {
  defaultView?: string;
  defaultProjectId?: string;
  showCompletedTasks?: boolean;
}

// =============================================================================
// Settings Service
// =============================================================================

export class SettingsService {
  constructor(private db: PrismaClient) {}

  async get(userId: string) {
    const settings = await this.db.taskSettings.findUnique({
      where: { userId },
    });

    if (settings) return settings;

    // Create default settings if none exist
    return this.db.taskSettings.create({
      data: {
        userId,
        defaultView: 'LIST',
        showCompletedTasks: true,
      },
    });
  }

  async update(userId: string, input: SettingsUpdateInput) {
    return this.db.taskSettings.upsert({
      where: { userId },
      create: {
        userId,
        defaultView: (input.defaultView as any) || 'LIST',
        defaultProjectId: input.defaultProjectId || null,
        showCompletedTasks: input.showCompletedTasks ?? true,
      },
      update: {
        ...(input.defaultView !== undefined && { defaultView: input.defaultView as any }),
        ...(input.defaultProjectId !== undefined && { defaultProjectId: input.defaultProjectId || null }),
        ...(input.showCompletedTasks !== undefined && { showCompletedTasks: input.showCompletedTasks }),
      },
    });
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createSettingsService(db: PrismaClient): SettingsService {
  return new SettingsService(db);
}

let instance: SettingsService | null = null;

export function getSettingsService(db?: PrismaClient): SettingsService {
  if (db) return createSettingsService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new SettingsService(globalDb);
  }
  return instance;
}

export default SettingsService;
