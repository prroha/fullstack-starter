// =============================================================================
// Settings Service
// =============================================================================
// Business logic for per-user event settings.
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface SettingsUpdateInput {
  defaultView?: string;
  defaultCategoryId?: string;
  currency?: string;
  timezone?: string;
}

// =============================================================================
// Settings Service
// =============================================================================

export class SettingsService {
  constructor(private db: PrismaClient) {}

  async get(userId: string) {
    const settings = await this.db.eventSettings.findUnique({ where: { userId } });
    if (settings) return settings;

    return this.db.eventSettings.create({
      data: {
        userId,
        defaultView: 'LIST',
        currency: 'USD',
        timezone: 'UTC',
      },
    });
  }

  async update(userId: string, input: SettingsUpdateInput) {
    const data: Record<string, unknown> = {};
    if (input.defaultView !== undefined) data.defaultView = input.defaultView;
    if (input.defaultCategoryId !== undefined) data.defaultCategoryId = input.defaultCategoryId ?? null;
    if (input.currency !== undefined) data.currency = input.currency;
    if (input.timezone !== undefined) data.timezone = input.timezone;

    return this.db.eventSettings.upsert({
      where: { userId },
      create: {
        userId,
        defaultView: input.defaultView ?? 'LIST',
        defaultCategoryId: input.defaultCategoryId ?? null,
        currency: input.currency ?? 'USD',
        timezone: input.timezone ?? 'UTC',
      },
      update: data,
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
