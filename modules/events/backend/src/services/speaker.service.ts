// =============================================================================
// Speaker Service
// =============================================================================
// Business logic for event speakers: CRUD and reordering.
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

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

// =============================================================================
// Speaker Service
// =============================================================================

export class SpeakerService {
  constructor(private db: PrismaClient) {}

  async create(input: SpeakerCreateInput) {
    const count = await this.db.eventSpeaker.count({ where: { eventId: input.eventId } });

    return this.db.eventSpeaker.create({
      data: {
        eventId: input.eventId,
        userId: input.userId,
        name: input.name,
        email: input.email || null,
        bio: input.bio || null,
        avatarUrl: input.avatarUrl || null,
        title: input.title || null,
        company: input.company || null,
        sortOrder: count,
      },
    });
  }

  async update(id: string, userId: string, input: SpeakerUpdateInput) {
    const speaker = await this.db.eventSpeaker.findFirst({ where: { id, userId } });
    if (!speaker) throw new Error('Speaker not found');

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.email !== undefined) data.email = input.email ?? null;
    if (input.bio !== undefined) data.bio = input.bio ?? null;
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl ?? null;
    if (input.title !== undefined) data.title = input.title ?? null;
    if (input.company !== undefined) data.company = input.company ?? null;

    return this.db.eventSpeaker.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const speaker = await this.db.eventSpeaker.findFirst({ where: { id, userId } });
    if (!speaker) throw new Error('Speaker not found');

    await this.db.eventSpeaker.delete({ where: { id } });
  }

  async listByEvent(eventId: string) {
    return this.db.eventSpeaker.findMany({
      where: { eventId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async reorder(userId: string, speakerIds: string[]): Promise<void> {
    const updates = speakerIds.map((id, index) =>
      this.db.eventSpeaker.updateMany({
        where: { id, userId },
        data: { sortOrder: index },
      })
    );
    await Promise.all(updates);
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createSpeakerService(db: PrismaClient): SpeakerService {
  return new SpeakerService(db);
}

let instance: SpeakerService | null = null;

export function getSpeakerService(db?: PrismaClient): SpeakerService {
  if (db) return createSpeakerService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new SpeakerService(globalDb);
  }
  return instance;
}

export default SpeakerService;
