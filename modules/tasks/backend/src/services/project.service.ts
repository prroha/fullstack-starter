// =============================================================================
// Project Service
// =============================================================================
// Business logic for project management: CRUD, archiving, reordering, and stats.
// Uses placeholder db operations - replace with actual Prisma client.

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

interface ProjectRecord {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  isArchived: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================

const dbOperations = {
  async createProject(data: {
    userId: string;
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
    position: number;
  }): Promise<ProjectRecord> {
    console.log('[DB] Creating project:', data.name);
    return {
      id: 'proj_' + Date.now(),
      ...data,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async findProjectById(id: string): Promise<ProjectRecord | null> {
    console.log('[DB] Finding project by ID:', id);
    return null;
  },

  async findProjects(userId: string, includeArchived = false): Promise<ProjectRecord[]> {
    console.log('[DB] Finding projects for user:', userId);
    return [];
  },

  async updateProject(id: string, data: Partial<ProjectRecord>): Promise<ProjectRecord | null> {
    console.log('[DB] Updating project:', id);
    return null;
  },

  async deleteProject(id: string): Promise<void> {
    console.log('[DB] Deleting project:', id);
  },

  async checkProjectBelongsToUser(id: string, userId: string): Promise<boolean> {
    console.log('[DB] Checking project ownership:', id, userId);
    return false;
  },

  async getProjectCount(userId: string): Promise<number> {
    console.log('[DB] Getting project count for user:', userId);
    return 0;
  },

  async getProjectStats(projectId: string): Promise<ProjectStats> {
    console.log('[DB] Getting project stats:', projectId);
    return { totalTasks: 0, todoTasks: 0, inProgressTasks: 0, doneTasks: 0 };
  },
};

// =============================================================================
// Project Service
// =============================================================================

export class ProjectService {
  async create(input: ProjectCreateInput): Promise<ProjectRecord> {
    const count = await dbOperations.getProjectCount(input.userId);

    return dbOperations.createProject({
      userId: input.userId,
      name: input.name,
      description: input.description || null,
      color: input.color || '#6B7280',
      icon: input.icon || null,
      position: count,
    });
  }

  async update(id: string, userId: string, input: ProjectUpdateInput): Promise<ProjectRecord | null> {
    const belongs = await dbOperations.checkProjectBelongsToUser(id, userId);
    if (!belongs) throw new Error('Project not found');

    return dbOperations.updateProject(id, input as Partial<ProjectRecord>);
  }

  async delete(id: string, userId: string): Promise<void> {
    const belongs = await dbOperations.checkProjectBelongsToUser(id, userId);
    if (!belongs) throw new Error('Project not found');

    return dbOperations.deleteProject(id);
  }

  async getById(id: string, userId: string): Promise<ProjectRecord | null> {
    const belongs = await dbOperations.checkProjectBelongsToUser(id, userId);
    if (!belongs) return null;

    return dbOperations.findProjectById(id);
  }

  async list(userId: string, includeArchived = false): Promise<ProjectRecord[]> {
    return dbOperations.findProjects(userId, includeArchived);
  }

  async archive(id: string, userId: string): Promise<ProjectRecord | null> {
    const belongs = await dbOperations.checkProjectBelongsToUser(id, userId);
    if (!belongs) throw new Error('Project not found');

    return dbOperations.updateProject(id, { isArchived: true } as Partial<ProjectRecord>);
  }

  async unarchive(id: string, userId: string): Promise<ProjectRecord | null> {
    const belongs = await dbOperations.checkProjectBelongsToUser(id, userId);
    if (!belongs) throw new Error('Project not found');

    return dbOperations.updateProject(id, { isArchived: false } as Partial<ProjectRecord>);
  }

  async reorder(userId: string, ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      const belongs = await dbOperations.checkProjectBelongsToUser(ids[i], userId);
      if (belongs) {
        await dbOperations.updateProject(ids[i], { position: i } as Partial<ProjectRecord>);
      }
    }
  }

  async getStats(id: string, userId: string): Promise<ProjectStats> {
    const belongs = await dbOperations.checkProjectBelongsToUser(id, userId);
    if (!belongs) throw new Error('Project not found');

    return dbOperations.getProjectStats(id);
  }
}

// =============================================================================
// Factory
// =============================================================================

let instance: ProjectService | null = null;

export function getProjectService(): ProjectService {
  if (!instance) instance = new ProjectService();
  return instance;
}

export default ProjectService;
