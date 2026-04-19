// =============================================================================
// Label Service
// =============================================================================
// Business logic for label management: CRUD and task-label assignment.
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface LabelCreateInput {
  userId: string;
  name: string;
  color?: string;
}

export interface LabelUpdateInput {
  name?: string;
  color?: string;
}

// =============================================================================
// Label Service
// =============================================================================

export class LabelService {
  constructor(private db: PrismaClient) {}

  async create(input: LabelCreateInput) {
    return this.db.taskLabel.create({
      data: {
        userId: input.userId,
        name: input.name,
        color: input.color || '#6B7280',
      },
    });
  }

  async update(id: string, userId: string, input: LabelUpdateInput) {
    const label = await this.db.taskLabel.findFirst({ where: { id, userId } });
    if (!label) throw new Error('Label not found');

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.color !== undefined) data.color = input.color;

    return this.db.taskLabel.update({
      where: { id },
      data: data as any,
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const label = await this.db.taskLabel.findFirst({ where: { id, userId } });
    if (!label) throw new Error('Label not found');

    await this.db.taskLabel.delete({ where: { id } });
  }

  async list(userId: string) {
    return this.db.taskLabel.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async addToTask(taskId: string, labelId: string, userId: string): Promise<void> {
    // Verify label belongs to user
    const label = await this.db.taskLabel.findFirst({ where: { id: labelId, userId } });
    if (!label) throw new Error('Label not found');

    // Verify task belongs to user
    const task = await this.db.task.findFirst({ where: { id: taskId, userId } });
    if (!task) throw new Error('Task not found');

    // Upsert to avoid duplicate errors
    await this.db.taskLabelLink.upsert({
      where: { taskId_labelId: { taskId, labelId } },
      create: { taskId, labelId },
      update: {},
    });
  }

  async removeFromTask(taskId: string, labelId: string, userId: string): Promise<void> {
    // Verify label belongs to user
    const label = await this.db.taskLabel.findFirst({ where: { id: labelId, userId } });
    if (!label) throw new Error('Label not found');

    await this.db.taskLabelLink.deleteMany({
      where: { taskId, labelId },
    });
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createLabelService(db: PrismaClient): LabelService {
  return new LabelService(db);
}

let instance: LabelService | null = null;

export function getLabelService(db?: PrismaClient): LabelService {
  if (db) return createLabelService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new LabelService(globalDb);
  }
  return instance;
}

export default LabelService;
