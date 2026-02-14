// =============================================================================
// Tax Rate Service
// =============================================================================
// Business logic for managing tax rates (create, update, delete, list, default).
// Uses placeholder db operations - replace with actual Prisma client.

// =============================================================================
// Types
// =============================================================================

export interface TaxRateCreateInput {
  userId: string;
  name: string;
  rate: number;
  description?: string;
  isDefault?: boolean;
}

export interface TaxRateUpdateInput {
  name?: string;
  rate?: number;
  description?: string;
}

interface TaxRateRecord {
  id: string;
  userId: string;
  name: string;
  rate: number;
  description: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================
// Replace with actual Prisma client:
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  async createTaxRate(data: {
    userId: string;
    name: string;
    rate: number;
    description: string | null;
    isDefault: boolean;
  }): Promise<TaxRateRecord> {
    // Replace with: return db.taxRate.create({ data });
    console.log('[DB] Creating tax rate:', data.name, 'rate:', data.rate);
    return {
      id: 'taxrate_' + Date.now(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async updateTaxRate(id: string, data: Partial<TaxRateRecord>): Promise<TaxRateRecord | null> {
    // Replace with: return db.taxRate.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
    console.log('[DB] Updating tax rate:', id);
    return null;
  },

  async deleteTaxRate(id: string): Promise<void> {
    // Replace with: await db.taxRate.delete({ where: { id } });
    console.log('[DB] Deleting tax rate:', id);
  },

  async findTaxRateById(id: string): Promise<TaxRateRecord | null> {
    // Replace with: return db.taxRate.findUnique({ where: { id } });
    console.log('[DB] Finding tax rate by ID:', id);
    return null;
  },

  async findTaxRates(userId: string): Promise<TaxRateRecord[]> {
    // Replace with: return db.taxRate.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { name: 'asc' }] });
    console.log('[DB] Finding tax rates for user:', userId);
    return [];
  },

  async unsetAllDefaults(userId: string): Promise<void> {
    // Replace with: await db.taxRate.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false, updatedAt: new Date() } });
    console.log('[DB] Unsetting all default tax rates for user:', userId);
  },

  async setDefault(id: string): Promise<TaxRateRecord | null> {
    // Replace with: return db.taxRate.update({ where: { id }, data: { isDefault: true, updatedAt: new Date() } });
    console.log('[DB] Setting tax rate as default:', id);
    return null;
  },

  async checkTaxRateBelongsToUser(taxRateId: string, userId: string): Promise<boolean> {
    // Replace with: return !!(await db.taxRate.findFirst({ where: { id: taxRateId, userId } }));
    console.log('[DB] Checking tax rate ownership:', taxRateId, userId);
    return false;
  },

  async isTaxRateInUse(taxRateId: string): Promise<boolean> {
    // Replace with: return !!(await db.invoiceItem.findFirst({ where: { taxRateId } }));
    console.log('[DB] Checking if tax rate is in use:', taxRateId);
    return false;
  },
};

// =============================================================================
// Tax Rate Service
// =============================================================================

export class TaxRateService {
  /**
   * Create a new tax rate. If isDefault is true, unsets other defaults first.
   * Rate is stored as a percentage value (e.g., 10 for 10%).
   */
  async create(input: TaxRateCreateInput): Promise<TaxRateRecord> {
    if (input.rate < 0 || input.rate > 100) {
      throw new Error('Tax rate must be between 0 and 100');
    }

    if (input.isDefault) {
      await dbOperations.unsetAllDefaults(input.userId);
    }

    return dbOperations.createTaxRate({
      userId: input.userId,
      name: input.name,
      rate: input.rate,
      description: input.description || null,
      isDefault: input.isDefault || false,
    });
  }

  /**
   * Update an existing tax rate. Validates ownership.
   */
  async update(id: string, userId: string, input: TaxRateUpdateInput): Promise<TaxRateRecord | null> {
    const belongs = await dbOperations.checkTaxRateBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Tax rate not found');
    }

    if (input.rate !== undefined && (input.rate < 0 || input.rate > 100)) {
      throw new Error('Tax rate must be between 0 and 100');
    }

    return dbOperations.updateTaxRate(id, input as Partial<TaxRateRecord>);
  }

  /**
   * Delete a tax rate. Validates ownership and checks it is not in use.
   */
  async delete(id: string, userId: string): Promise<void> {
    const belongs = await dbOperations.checkTaxRateBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Tax rate not found');
    }

    const inUse = await dbOperations.isTaxRateInUse(id);
    if (inUse) {
      throw new Error('Cannot delete a tax rate that is used by invoice items');
    }

    return dbOperations.deleteTaxRate(id);
  }

  /**
   * List all tax rates for a user, ordered by default first then alphabetical
   */
  async list(userId: string): Promise<TaxRateRecord[]> {
    return dbOperations.findTaxRates(userId);
  }

  /**
   * Set a tax rate as the default for a user.
   * Unsets all other defaults first, then sets this one.
   */
  async setDefault(id: string, userId: string): Promise<TaxRateRecord | null> {
    const belongs = await dbOperations.checkTaxRateBelongsToUser(id, userId);
    if (!belongs) {
      throw new Error('Tax rate not found');
    }

    await dbOperations.unsetAllDefaults(userId);

    return dbOperations.setDefault(id);
  }
}

// =============================================================================
// Factory
// =============================================================================

let taxRateServiceInstance: TaxRateService | null = null;

export function getTaxRateService(): TaxRateService {
  if (!taxRateServiceInstance) {
    taxRateServiceInstance = new TaxRateService();
  }
  return taxRateServiceInstance;
}

export default TaxRateService;
