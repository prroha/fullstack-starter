// =============================================================================
// Tax Rate Service
// =============================================================================
// Business logic for managing tax rates (create, update, delete, list, default).
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface TaxRateCreateInput {
  userId: string;
  name: string;
  rate: number;
  isDefault?: boolean;
}

export interface TaxRateUpdateInput {
  name?: string;
  rate?: number;
  isDefault?: boolean;
}

// =============================================================================
// Tax Rate Service
// =============================================================================

export class TaxRateService {
  constructor(private db: PrismaClient) {}

  /**
   * Create a new tax rate. If isDefault is true, unsets other defaults first.
   * Rate is stored as a percentage value (e.g., 10 for 10%).
   */
  async create(input: TaxRateCreateInput) {
    if (input.rate < 0 || input.rate > 100) {
      throw new Error('Tax rate must be between 0 and 100');
    }

    if (input.isDefault) {
      await this.db.taxRate.updateMany({
        where: { userId: input.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.db.taxRate.create({
      data: {
        userId: input.userId,
        name: input.name,
        rate: input.rate,
        isDefault: input.isDefault || false,
      },
    });
  }

  /**
   * Update an existing tax rate. Validates ownership.
   */
  async update(id: string, userId: string, input: TaxRateUpdateInput) {
    const taxRate = await this.db.taxRate.findFirst({ where: { id, userId } });
    if (!taxRate) {
      throw new Error('Tax rate not found');
    }

    if (input.rate !== undefined && (input.rate < 0 || input.rate > 100)) {
      throw new Error('Tax rate must be between 0 and 100');
    }

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.rate !== undefined) data.rate = input.rate;
    if (input.isDefault !== undefined) data.isDefault = input.isDefault;

    return this.db.taxRate.update({ where: { id }, data });
  }

  /**
   * Delete a tax rate. Validates ownership and checks it is not in use.
   */
  async delete(id: string, userId: string): Promise<void> {
    const taxRate = await this.db.taxRate.findFirst({ where: { id, userId } });
    if (!taxRate) {
      throw new Error('Tax rate not found');
    }

    const inUse = await this.db.invoiceItem.findFirst({ where: { taxRateId: id } });
    if (inUse) {
      throw new Error('Cannot delete a tax rate that is used by invoice items');
    }

    await this.db.taxRate.delete({ where: { id } });
  }

  /**
   * List all tax rates for a user, ordered by default first then alphabetical
   */
  async list(userId: string) {
    return this.db.taxRate.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Set a tax rate as the default for a user.
   * Unsets all other defaults first, then sets this one.
   */
  async setDefault(id: string, userId: string) {
    const taxRate = await this.db.taxRate.findFirst({ where: { id, userId } });
    if (!taxRate) {
      throw new Error('Tax rate not found');
    }

    await this.db.taxRate.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    return this.db.taxRate.update({
      where: { id },
      data: { isDefault: true },
    });
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createTaxRateService(db: PrismaClient): TaxRateService {
  return new TaxRateService(db);
}

let instance: TaxRateService | null = null;
export function getTaxRateService(db?: PrismaClient): TaxRateService {
  if (db) return createTaxRateService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new TaxRateService(globalDb);
  }
  return instance;
}

export default TaxRateService;
