// =============================================================================
// Task Service
// =============================================================================
// Business logic for task management: CRUD, filtering, status changes,
// assignment, reordering, and dashboard stats.
// Uses placeholder db operations - replace with actual Prisma client.

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

interface TaskRecord {
  id: string;
  userId: string;
  projectId: string | null;
  assigneeId: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  position: number;
  isArchived: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================

const dbOperations = {
  async createTask(data: {
    userId: string;
    projectId: string | null;
    assigneeId: string | null;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    position: number;
  }): Promise<TaskRecord> {
    console.log('[DB] Creating task:', data.title);
    return {
      id: 'task_' + Date.now(),
      ...data,
      isArchived: false,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async findTaskById(id: string): Promise<TaskRecord | null> {
    console.log('[DB] Finding task by ID:', id);
    return null;
  },

  async findTasks(userId: string, filters: TaskFilters): Promise<{ items: TaskRecord[]; total: number }> {
    console.log('[DB] Finding tasks for user:', userId, filters);
    return { items: [], total: 0 };
  },

  async updateTask(id: string, data: Partial<TaskRecord>): Promise<TaskRecord | null> {
    console.log('[DB] Updating task:', id);
    return null;
  },

  async deleteTask(id: string): Promise<void> {
    console.log('[DB] Deleting task:', id);
  },

  async checkTaskBelongsToUser(id: string, userId: string): Promise<boolean> {
    console.log('[DB] Checking task ownership:', id, userId);
    return false;
  },

  async getTaskCountForStatus(userId: string, status: string): Promise<number> {
    console.log('[DB] Getting task count for status:', status);
    return 0;
  },

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    console.log('[DB] Getting dashboard stats for user:', userId);
    return {
      totalTasks: 0,
      todoTasks: 0,
      inProgressTasks: 0,
      inReviewTasks: 0,
      doneTasks: 0,
      overdueTasks: 0,
      dueTodayTasks: 0,
      totalProjects: 0,
    };
  },
};

// =============================================================================
// Task Service
// =============================================================================

export class TaskService {
  async create(input: TaskCreateInput): Promise<TaskRecord> {
    const count = await dbOperations.getTaskCountForStatus(input.userId, input.status || 'TODO');

    return dbOperations.createTask({
      userId: input.userId,
      projectId: input.projectId || null,
      assigneeId: input.assigneeId || null,
      title: input.title,
      description: input.description || null,
      status: input.status || 'TODO',
      priority: input.priority || 'NONE',
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      position: count,
    });
  }

  async update(id: string, userId: string, input: TaskUpdateInput): Promise<TaskRecord | null> {
    const belongs = await dbOperations.checkTaskBelongsToUser(id, userId);
    if (!belongs) throw new Error('Task not found');

    const updateData: Partial<TaskRecord> = { ...input } as Partial<TaskRecord>;
    if (input.dueDate !== undefined) {
      updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    }

    return dbOperations.updateTask(id, updateData);
  }

  async delete(id: string, userId: string): Promise<void> {
    const belongs = await dbOperations.checkTaskBelongsToUser(id, userId);
    if (!belongs) throw new Error('Task not found');

    return dbOperations.deleteTask(id);
  }

  async getById(id: string, userId: string): Promise<TaskRecord | null> {
    const belongs = await dbOperations.checkTaskBelongsToUser(id, userId);
    if (!belongs) return null;

    return dbOperations.findTaskById(id);
  }

  async list(userId: string, filters: TaskFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await dbOperations.findTasks(userId, { ...filters, page, limit });

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

  async changeStatus(id: string, userId: string, status: string): Promise<TaskRecord | null> {
    const belongs = await dbOperations.checkTaskBelongsToUser(id, userId);
    if (!belongs) throw new Error('Task not found');

    const updateData: Partial<TaskRecord> = { status } as Partial<TaskRecord>;
    if (status === 'DONE') {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }

    return dbOperations.updateTask(id, updateData);
  }

  async assign(id: string, userId: string, assigneeId: string | null): Promise<TaskRecord | null> {
    const belongs = await dbOperations.checkTaskBelongsToUser(id, userId);
    if (!belongs) throw new Error('Task not found');

    return dbOperations.updateTask(id, { assigneeId } as Partial<TaskRecord>);
  }

  async reorder(userId: string, taskIds: string[]): Promise<void> {
    for (let i = 0; i < taskIds.length; i++) {
      const belongs = await dbOperations.checkTaskBelongsToUser(taskIds[i], userId);
      if (belongs) {
        await dbOperations.updateTask(taskIds[i], { position: i } as Partial<TaskRecord>);
      }
    }
  }

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    return dbOperations.getDashboardStats(userId);
  }
}

// =============================================================================
// Factory
// =============================================================================

let instance: TaskService | null = null;

export function getTaskService(): TaskService {
  if (!instance) instance = new TaskService();
  return instance;
}

export default TaskService;
