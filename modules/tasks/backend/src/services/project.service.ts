// =============================================================================
// Project Service
// =============================================================================
// Business logic for project management: CRUD, archiving, reordering, and stats.
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface ProjectCreateInput {
  userId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface ProjectStats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
}

// =============================================================================
// Project Service
// =============================================================================

export class ProjectService {
  constructor(private db: PrismaClient) {}

  async create(input: ProjectCreateInput) {
    const count = await this.db.taskProject.count({
      where: { userId: input.userId },
    });

    return this.db.taskProject.create({
      data: {
        userId: input.userId,
        name: input.name,
        description: input.description || null,
        color: input.color || '#6B7280',
        icon: input.icon || null,
        position: count,
      },
    });
  }

  async update(id: string, userId: string, input: ProjectUpdateInput) {
    const project = await this.db.taskProject.findFirst({ where: { id, userId } });
    if (!project) throw new Error('Project not found');

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.color !== undefined) data.color = input.color;
    if (input.icon !== undefined) data.icon = input.icon;

    return this.db.taskProject.update({
      where: { id },
      data: data as any,
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const project = await this.db.taskProject.findFirst({ where: { id, userId } });
    if (!project) throw new Error('Project not found');

    await this.db.taskProject.delete({ where: { id } });
  }

  async getById(id: string, userId: string) {
    const project = await this.db.taskProject.findFirst({ where: { id, userId } });
    return project || null;
  }

  async list(userId: string, includeArchived = false) {
    const where: Record<string, unknown> = { userId };
    if (!includeArchived) {
      where.isArchived = false;
    }

    return this.db.taskProject.findMany({
      where: where as any,
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async archive(id: string, userId: string) {
    const project = await this.db.taskProject.findFirst({ where: { id, userId } });
    if (!project) throw new Error('Project not found');

    return this.db.taskProject.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  async unarchive(id: string, userId: string) {
    const project = await this.db.taskProject.findFirst({ where: { id, userId } });
    if (!project) throw new Error('Project not found');

    return this.db.taskProject.update({
      where: { id },
      data: { isArchived: false },
    });
  }

  async reorder(userId: string, ids: string[]): Promise<void> {
    const updates = ids.map((projectId, index) =>
      this.db.taskProject.updateMany({
        where: { id: projectId, userId },
        data: { position: index },
      })
    );
    await Promise.all(updates);
  }

  async getStats(id: string, userId: string): Promise<ProjectStats> {
    const project = await this.db.taskProject.findFirst({ where: { id, userId } });
    if (!project) throw new Error('Project not found');

    const [totalTasks, todoTasks, inProgressTasks, doneTasks] = await Promise.all([
      this.db.task.count({ where: { projectId: id } }),
      this.db.task.count({ where: { projectId: id, status: 'TODO' } }),
      this.db.task.count({ where: { projectId: id, status: 'IN_PROGRESS' } }),
      this.db.task.count({ where: { projectId: id, status: 'DONE' } }),
    ]);

    return { totalTasks, todoTasks, inProgressTasks, doneTasks };
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createProjectService(db: PrismaClient): ProjectService {
  return new ProjectService(db);
}

let instance: ProjectService | null = null;

export function getProjectService(db?: PrismaClient): ProjectService {
  if (db) return createProjectService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new ProjectService(globalDb);
  }
  return instance;
}

export default ProjectService;
