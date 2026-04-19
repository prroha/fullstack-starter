// =============================================================================
// Task Service
// =============================================================================
// Business logic for task management: CRUD, filtering, status changes,
// assignment, reordering, and dashboard stats.
// Uses dependency-injected PrismaClient for all database operations.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface TaskCreateInput {
  userId: string;
  projectId?: string;
  assigneeId?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
}

export interface TaskUpdateInput {
  projectId?: string;
  assigneeId?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  projectId?: string;
  assigneeId?: string;
  labelId?: string;
  search?: string;
  dueBefore?: string;
  dueAfter?: string;
  showCompleted?: boolean;
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  inReviewTasks: number;
  doneTasks: number;
  overdueTasks: number;
  dueTodayTasks: number;
  totalProjects: number;
}

// =============================================================================
// Task Service
// =============================================================================

export class TaskService {
  constructor(private db: PrismaClient) {}

  async create(input: TaskCreateInput) {
    const count = await this.db.task.count({
      where: { userId: input.userId, status: (input.status as any) || 'TODO' },
    });

    return this.db.task.create({
      data: {
        userId: input.userId,
        projectId: input.projectId || null,
        assigneeId: input.assigneeId || null,
        title: input.title,
        description: input.description || null,
        status: (input.status as any) || 'TODO',
        priority: (input.priority as any) || 'NONE',
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        position: count,
      },
      include: { project: true, comments: true, labels: { include: { label: true } } },
    });
  }

  async update(id: string, userId: string, input: TaskUpdateInput) {
    const task = await this.db.task.findFirst({ where: { id, userId } });
    if (!task) throw new Error('Task not found');

    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.projectId !== undefined) data.projectId = input.projectId || null;
    if (input.assigneeId !== undefined) data.assigneeId = input.assigneeId || null;
    if (input.status !== undefined) data.status = input.status;
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.dueDate !== undefined) {
      data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    }
    if (input.status === 'DONE') {
      data.completedAt = new Date();
    } else if (input.status !== undefined) {
      data.completedAt = null;
    }

    return this.db.task.update({
      where: { id },
      data: data as any,
      include: { project: true, comments: true, labels: { include: { label: true } } },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const task = await this.db.task.findFirst({ where: { id, userId } });
    if (!task) throw new Error('Task not found');

    await this.db.task.delete({ where: { id } });
  }

  async getById(id: string, userId: string) {
    const task = await this.db.task.findFirst({
      where: { id, userId },
      include: { project: true, comments: true, labels: { include: { label: true } } },
    });
    return task || null;
  }

  async list(userId: string, filters: TaskFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (!filters.showCompleted) {
      where.status = where.status || { not: 'DONE' };
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.dueBefore || filters.dueAfter) {
      const dueDateFilter: Record<string, Date> = {};
      if (filters.dueBefore) dueDateFilter.lte = new Date(filters.dueBefore);
      if (filters.dueAfter) dueDateFilter.gte = new Date(filters.dueAfter);
      where.dueDate = dueDateFilter;
    }
    if (filters.labelId) {
      where.labels = { some: { labelId: filters.labelId } };
    }

    const [items, total] = await Promise.all([
      this.db.task.findMany({
        where: where as any,
        include: { project: true, labels: { include: { label: true } } },
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.db.task.count({ where: where as any }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async changeStatus(id: string, userId: string, status: string) {
    const task = await this.db.task.findFirst({ where: { id, userId } });
    if (!task) throw new Error('Task not found');

    const data: Record<string, unknown> = { status };
    if (status === 'DONE') {
      data.completedAt = new Date();
    } else {
      data.completedAt = null;
    }

    return this.db.task.update({
      where: { id },
      data: data as any,
      include: { project: true, comments: true, labels: { include: { label: true } } },
    });
  }

  async assign(id: string, userId: string, assigneeId: string | null) {
    const task = await this.db.task.findFirst({ where: { id, userId } });
    if (!task) throw new Error('Task not found');

    return this.db.task.update({
      where: { id },
      data: { assigneeId },
      include: { project: true, comments: true, labels: { include: { label: true } } },
    });
  }

  async reorder(userId: string, taskIds: string[]): Promise<void> {
    const updates = taskIds.map((taskId, index) =>
      this.db.task.updateMany({
        where: { id: taskId, userId },
        data: { position: index },
      })
    );
    await Promise.all(updates);
  }

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const [
      totalTasks,
      todoTasks,
      inProgressTasks,
      inReviewTasks,
      doneTasks,
      overdueTasks,
      dueTodayTasks,
      totalProjects,
    ] = await Promise.all([
      this.db.task.count({ where: { userId } }),
      this.db.task.count({ where: { userId, status: 'TODO' } }),
      this.db.task.count({ where: { userId, status: 'IN_PROGRESS' } }),
      this.db.task.count({ where: { userId, status: 'IN_REVIEW' } }),
      this.db.task.count({ where: { userId, status: 'DONE' } }),
      this.db.task.count({
        where: {
          userId,
          status: { not: 'DONE' },
          dueDate: { lt: startOfDay },
        },
      }),
      this.db.task.count({
        where: {
          userId,
          dueDate: { gte: startOfDay, lt: endOfDay },
        },
      }),
      this.db.taskProject.count({ where: { userId } }),
    ]);

    return {
      totalTasks,
      todoTasks,
      inProgressTasks,
      inReviewTasks,
      doneTasks,
      overdueTasks,
      dueTodayTasks,
      totalProjects,
    };
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createTaskService(db: PrismaClient): TaskService {
  return new TaskService(db);
}

let instance: TaskService | null = null;

export function getTaskService(db?: PrismaClient): TaskService {
  if (db) return createTaskService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new TaskService(globalDb);
  }
  return instance;
}

export default TaskService;
