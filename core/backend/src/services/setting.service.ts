/**
 * Setting Service
 *
 * Business logic for application settings management.
 */

import { db } from "../lib/db";
import { ApiError } from "../middleware/error.middleware";
import { ErrorCodes } from "../utils/response";

// ============================================================================
// Types
// ============================================================================

export type SettingType = "STRING" | "NUMBER" | "BOOLEAN" | "JSON";

export interface CreateSettingInput {
  key: string;
  value: string;
  type?: SettingType;
  description?: string | null;
  isPublic?: boolean;
}

export interface UpdateSettingInput {
  value?: string;
  type?: SettingType;
  description?: string | null;
  isPublic?: boolean;
}

export interface BulkUpdateItem {
  key: string;
  value: string;
}

// ============================================================================
// Service Class
// ============================================================================

class SettingService {
  /**
   * Get all settings (admin)
   */
  async getAll() {
    return db.setting.findMany({
      orderBy: { key: "asc" },
    });
  }

  /**
   * Get setting by key
   */
  async getByKey(key: string) {
    const setting = await db.setting.findUnique({ where: { key } });
    if (!setting) {
      throw ApiError.notFound("Setting not found");
    }
    return setting;
  }

  /**
   * Create a new setting
   */
  async create(input: CreateSettingInput) {
    // Check if key already exists
    const existing = await db.setting.findUnique({ where: { key: input.key } });
    if (existing) {
      throw ApiError.conflict("Setting key already exists", ErrorCodes.CONFLICT);
    }

    return db.setting.create({ data: input });
  }

  /**
   * Update setting by key
   */
  async update(key: string, input: UpdateSettingInput) {
    const existing = await db.setting.findUnique({ where: { key } });
    if (!existing) {
      throw ApiError.notFound("Setting not found");
    }

    return db.setting.update({
      where: { key },
      data: input,
    });
  }

  /**
   * Bulk update settings (upsert)
   */
  async bulkUpdate(items: BulkUpdateItem[]) {
    await db.$transaction(
      items.map((s) =>
        db.setting.upsert({
          where: { key: s.key },
          update: { value: s.value },
          create: { key: s.key, value: s.value },
        })
      )
    );
    return items.length;
  }

  /**
   * Delete setting by key
   */
  async delete(key: string) {
    const existing = await db.setting.findUnique({ where: { key } });
    if (!existing) {
      throw ApiError.notFound("Setting not found");
    }

    await db.setting.delete({ where: { key } });
    return existing;
  }

  /**
   * Get public settings (for frontend/API consumption)
   */
  async getPublic() {
    const settings = await db.setting.findMany({
      where: { isPublic: true },
      select: { key: true, value: true, type: true },
      orderBy: { key: "asc" },
    });

    // Convert to key-value object with proper type coercion
    const settingsMap: Record<string, unknown> = {};
    for (const s of settings) {
      let value: unknown = s.value;
      if (s.type === "NUMBER") value = parseFloat(s.value);
      else if (s.type === "BOOLEAN") value = s.value === "true";
      else if (s.type === "JSON") {
        try {
          value = JSON.parse(s.value);
        } catch {
          value = s.value;
        }
      }
      settingsMap[s.key] = value;
    }

    return settingsMap;
  }

  /**
   * Get all settings for export
   */
  async getAllForExport() {
    return db.setting.findMany({
      orderBy: { key: "asc" },
    });
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const settingService = new SettingService();
