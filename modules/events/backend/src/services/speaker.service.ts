// =============================================================================
// Speaker Service
// =============================================================================
// Business logic for event speakers: CRUD and reordering.
// Uses placeholder db operations - replace with actual Prisma client.

// =============================================================================
// Types
// =============================================================================

export interface SpeakerCreateInput {
  eventId: string;
  userId: string;
  name: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  title?: string;
  company?: string;
}

export interface SpeakerUpdateInput {
  name?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  title?: string;
  company?: string;
}

interface SpeakerRecord {
  id: string;
  eventId: string;
  userId: string;
  name: string;
  email: string | null;
  bio: string | null;
  avatarUrl: string | null;
  title: string | null;
  company: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================

const dbOperations = {
  async createSpeaker(data: Omit<SpeakerRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<SpeakerRecord> {
    console.log('[DB] Creating speaker:', data.name);
    return {
      id: 'speaker_' + Date.now(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async findSpeakersByEvent(eventId: string): Promise<SpeakerRecord[]> {
    console.log('[DB] Finding speakers for event:', eventId);
    return [];
  },

  async updateSpeaker(id: string, data: Partial<SpeakerRecord>): Promise<SpeakerRecord | null> {
    console.log('[DB] Updating speaker:', id);
    return null;
  },

  async deleteSpeaker(id: string): Promise<void> {
    console.log('[DB] Deleting speaker:', id);
  },

  async checkSpeakerBelongsToUser(id: string, userId: string): Promise<boolean> {
    console.log('[DB] Checking speaker ownership:', id, userId);
    return false;
  },

  async getSpeakerCountForEvent(eventId: string): Promise<number> {
    console.log('[DB] Getting speaker count for event:', eventId);
    return 0;
  },
};

// =============================================================================
// Speaker Service
// =============================================================================

export class SpeakerService {
  async create(input: SpeakerCreateInput): Promise<SpeakerRecord> {
    const count = await dbOperations.getSpeakerCountForEvent(input.eventId);

    return dbOperations.createSpeaker({
      eventId: input.eventId,
      userId: input.userId,
      name: input.name,
      email: input.email || null,
      bio: input.bio || null,
      avatarUrl: input.avatarUrl || null,
      title: input.title || null,
      company: input.company || null,
      sortOrder: count,
    });
  }

  async update(id: string, userId: string, input: SpeakerUpdateInput): Promise<SpeakerRecord | null> {
    const belongs = await dbOperations.checkSpeakerBelongsToUser(id, userId);
    if (!belongs) throw new Error('Speaker not found');

    const updateData: Partial<SpeakerRecord> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email ?? null;
    if (input.bio !== undefined) updateData.bio = input.bio ?? null;
    if (input.avatarUrl !== undefined) updateData.avatarUrl = input.avatarUrl ?? null;
    if (input.title !== undefined) updateData.title = input.title ?? null;
    if (input.company !== undefined) updateData.company = input.company ?? null;

    return dbOperations.updateSpeaker(id, updateData);
  }

  async delete(id: string, userId: string): Promise<void> {
    const belongs = await dbOperations.checkSpeakerBelongsToUser(id, userId);
    if (!belongs) throw new Error('Speaker not found');

    return dbOperations.deleteSpeaker(id);
  }

  async listByEvent(eventId: string): Promise<SpeakerRecord[]> {
    return dbOperations.findSpeakersByEvent(eventId);
  }

  async reorder(userId: string, speakerIds: string[]): Promise<void> {
    for (let i = 0; i < speakerIds.length; i++) {
      const belongs = await dbOperations.checkSpeakerBelongsToUser(speakerIds[i], userId);
      if (belongs) {
        await dbOperations.updateSpeaker(speakerIds[i], { sortOrder: i } as Partial<SpeakerRecord>);
      }
    }
  }
}

// =============================================================================
// Factory
// =============================================================================

let instance: SpeakerService | null = null;

export function getSpeakerService(): SpeakerService {
  if (!instance) instance = new SpeakerService();
  return instance;
}

export default SpeakerService;
