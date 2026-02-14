// =============================================================================
// Comment Service
// =============================================================================
// Business logic for task comments: create, update, delete, list.
// Uses placeholder db operations - replace with actual Prisma client.

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

interface CommentRecord {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================

const dbOperations = {
  async createComment(data: { taskId: string; userId: string; content: string }): Promise<CommentRecord> {
    console.log('[DB] Creating comment for task:', data.taskId);
    return {
      id: 'comment_' + Date.now(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async findCommentById(id: string): Promise<CommentRecord | null> {
    console.log('[DB] Finding comment by ID:', id);
    return null;
  },

  async findCommentsByTaskId(taskId: string): Promise<CommentRecord[]> {
    console.log('[DB] Finding comments for task:', taskId);
    return [];
  },

  async updateComment(id: string, data: { content: string }): Promise<CommentRecord | null> {
    console.log('[DB] Updating comment:', id);
    return null;
  },

  async deleteComment(id: string): Promise<void> {
    console.log('[DB] Deleting comment:', id);
  },

  async checkCommentBelongsToUser(id: string, userId: string): Promise<boolean> {
    console.log('[DB] Checking comment ownership:', id, userId);
    return false;
  },

  async checkTaskBelongsToUser(taskId: string, userId: string): Promise<boolean> {
    console.log('[DB] Checking task ownership for comments:', taskId, userId);
    return false;
  },
};

// =============================================================================
// Comment Service
// =============================================================================

export class CommentService {
  async create(input: CommentCreateInput): Promise<CommentRecord> {
    const belongs = await dbOperations.checkTaskBelongsToUser(input.taskId, input.userId);
    if (!belongs) throw new Error('Task not found');

    return dbOperations.createComment({
      taskId: input.taskId,
      userId: input.userId,
      content: input.content,
    });
  }

  async update(id: string, userId: string, input: CommentUpdateInput): Promise<CommentRecord | null> {
    const belongs = await dbOperations.checkCommentBelongsToUser(id, userId);
    if (!belongs) throw new Error('Comment not found');

    return dbOperations.updateComment(id, { content: input.content });
  }

  async delete(id: string, userId: string): Promise<void> {
    const belongs = await dbOperations.checkCommentBelongsToUser(id, userId);
    if (!belongs) throw new Error('Comment not found');

    return dbOperations.deleteComment(id);
  }

  async listByTask(taskId: string, userId: string): Promise<CommentRecord[]> {
    const belongs = await dbOperations.checkTaskBelongsToUser(taskId, userId);
    if (!belongs) throw new Error('Task not found');

    return dbOperations.findCommentsByTaskId(taskId);
  }
}

// =============================================================================
// Factory
// =============================================================================

let instance: CommentService | null = null;

export function getCommentService(): CommentService {
  if (!instance) instance = new CommentService();
  return instance;
}

export default CommentService;
