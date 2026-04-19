// =============================================================================
// Comment Service
// =============================================================================
// Business logic for task comments: create, update, delete, list.
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface CommentCreateInput {
  taskId: string;
  userId: string;
  content: string;
}

export interface CommentUpdateInput {
  content: string;
}

// =============================================================================
// Comment Service
// =============================================================================

export class CommentService {
  constructor(private db: PrismaClient) {}

  async create(input: CommentCreateInput) {
    // Verify task belongs to user
    const task = await this.db.task.findFirst({
      where: { id: input.taskId, userId: input.userId },
    });
    if (!task) throw new Error('Task not found');

    return this.db.taskComment.create({
      data: {
        taskId: input.taskId,
        userId: input.userId,
        content: input.content,
      },
    });
  }

  async update(id: string, userId: string, input: CommentUpdateInput) {
    const comment = await this.db.taskComment.findFirst({
      where: { id, userId },
    });
    if (!comment) throw new Error('Comment not found');

    return this.db.taskComment.update({
      where: { id },
      data: { content: input.content },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const comment = await this.db.taskComment.findFirst({
      where: { id, userId },
    });
    if (!comment) throw new Error('Comment not found');

    await this.db.taskComment.delete({ where: { id } });
  }

  async listByTask(taskId: string, userId: string) {
    // Verify task belongs to user
    const task = await this.db.task.findFirst({
      where: { id: taskId, userId },
    });
    if (!task) throw new Error('Task not found');

    return this.db.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
    });
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createCommentService(db: PrismaClient): CommentService {
  return new CommentService(db);
}

let instance: CommentService | null = null;

export function getCommentService(db?: PrismaClient): CommentService {
  if (db) return createCommentService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new CommentService(globalDb);
  }
  return instance;
}

export default CommentService;
