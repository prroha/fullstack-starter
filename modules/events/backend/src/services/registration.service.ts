// =============================================================================
// Registration Service
// =============================================================================
// Business logic for event registrations: register, cancel, confirm, check-in.
// Uses placeholder db operations - replace with actual Prisma client.

// =============================================================================
// Types
// =============================================================================

export interface RegistrationCreateInput {
  eventId: string;
  userId: string;
  attendeeName: string;
  attendeeEmail: string;
  notes?: string;
}

export interface RegistrationFilters {
  eventId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface RegistrationRecord {
  id: string;
  eventId: string;
  userId: string;
  status: string;
  registrationNumber: string;
  attendeeName: string;
  attendeeEmail: string;
  notes: string | null;
  checkedInAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================

function generateRegistrationNumber(): string {
  const prefix = 'EVT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

const dbOperations = {
  async createRegistration(data: Omit<RegistrationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<RegistrationRecord> {
    console.log('[DB] Creating registration for event:', data.eventId);
    return {
      id: 'reg_' + Date.now(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async findRegistrationById(id: string): Promise<RegistrationRecord | null> {
    console.log('[DB] Finding registration by ID:', id);
    return null;
  },

  async findRegistrations(userId: string, filters: RegistrationFilters): Promise<{ items: RegistrationRecord[]; total: number }> {
    console.log('[DB] Finding registrations for user:', userId, filters);
    return { items: [], total: 0 };
  },

  async findRegistrationsByEvent(eventId: string): Promise<RegistrationRecord[]> {
    console.log('[DB] Finding registrations for event:', eventId);
    return [];
  },

  async updateRegistration(id: string, data: Partial<RegistrationRecord>): Promise<RegistrationRecord | null> {
    console.log('[DB] Updating registration:', id);
    return null;
  },

  async checkRegistrationBelongsToUser(id: string, userId: string): Promise<boolean> {
    console.log('[DB] Checking registration ownership:', id, userId);
    return false;
  },

  async getRegistrationStats(userId: string): Promise<{ total: number; confirmed: number; cancelled: number; attended: number }> {
    console.log('[DB] Getting registration stats for user:', userId);
    return { total: 0, confirmed: 0, cancelled: 0, attended: 0 };
  },
};

// =============================================================================
// Registration Service
// =============================================================================

export class RegistrationService {
  async register(input: RegistrationCreateInput): Promise<RegistrationRecord> {
    return dbOperations.createRegistration({
      eventId: input.eventId,
      userId: input.userId,
      status: 'PENDING',
      registrationNumber: generateRegistrationNumber(),
      attendeeName: input.attendeeName,
      attendeeEmail: input.attendeeEmail,
      notes: input.notes || null,
      checkedInAt: null,
    });
  }

  private async changeStatus(id: string, userId: string, status: string, extra?: Partial<RegistrationRecord>): Promise<RegistrationRecord | null> {
    const belongs = await dbOperations.checkRegistrationBelongsToUser(id, userId);
    if (!belongs) throw new Error('Registration not found');

    return dbOperations.updateRegistration(id, { status, ...extra });
  }

  async cancel(id: string, userId: string): Promise<RegistrationRecord | null> {
    return this.changeStatus(id, userId, 'CANCELLED');
  }

  async confirm(id: string, userId: string): Promise<RegistrationRecord | null> {
    return this.changeStatus(id, userId, 'CONFIRMED');
  }

  async checkIn(id: string, userId: string): Promise<RegistrationRecord | null> {
    return this.changeStatus(id, userId, 'ATTENDED', { checkedInAt: new Date() });
  }

  async getById(id: string, userId: string): Promise<RegistrationRecord | null> {
    const belongs = await dbOperations.checkRegistrationBelongsToUser(id, userId);
    if (!belongs) return null;

    return dbOperations.findRegistrationById(id);
  }

  async listByEvent(eventId: string): Promise<RegistrationRecord[]> {
    return dbOperations.findRegistrationsByEvent(eventId);
  }

  async listAll(userId: string, filters: RegistrationFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await dbOperations.findRegistrations(userId, { ...filters, page, limit });

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  async getStats(userId: string) {
    return dbOperations.getRegistrationStats(userId);
  }
}

// =============================================================================
// Factory
// =============================================================================

let instance: RegistrationService | null = null;

export function getRegistrationService(): RegistrationService {
  if (!instance) instance = new RegistrationService();
  return instance;
}

export default RegistrationService;
