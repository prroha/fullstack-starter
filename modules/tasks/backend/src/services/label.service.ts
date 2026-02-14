// =============================================================================
// Label Service
// =============================================================================
// Business logic for label management: CRUD and task-label assignment.
// Uses placeholder db operations - replace with actual Prisma client.

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

interface LabelRecord {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================

const dbOperations = {
  async createLabel(data: { userId: string; name: string; color: string }): Promise<LabelRecord> {
    console.log('[DB] Creating label:', data.name);
    return { id: 'label_' + Date.now(), ...data, createdAt: new Date() };
  },

  async findLabelById(id: string): Promise<LabelRecord | null> {
    console.log('[DB] Finding label by ID:', id);
    return null;
  },

  async findLabels(userId: string): Promise<LabelRecord[]> {
    console.log('[DB] Finding labels for user:', userId);
    return [];
  },

  async updateLabel(id: string, data: Partial<LabelRecord>): Promise<LabelRecord | null> {
    console.log('[DB] Updating label:', id);
    return null;
  },

  async deleteLabel(id: string): Promise<void> {
    console.log('[DB] Deleting label:', id);
  },

  async checkLabelBelongsToUser(id: string, userId: string): Promise<boolean> {
    console.log('[DB] Checking label ownership:', id, userId);
    return false;
  },

  async addLabelToTask(taskId: string, labelId: string): Promise<void> {
    console.log('[DB] Adding label to task:', labelId, taskId);
  },

  async removeLabelFromTask(taskId: string, labelId: string): Promise<void> {
    console.log('[DB] Removing label from task:', labelId, taskId);
  },
};

// =============================================================================
// Label Service
// =============================================================================

export class LabelService {
  async create(input: LabelCreateInput): Promise<LabelRecord> {
    return dbOperations.createLabel({
      userId: input.userId,
      name: input.name,
      color: input.color || '#6B7280',
    });
  }

  async update(id: string, userId: string, input: LabelUpdateInput): Promise<LabelRecord | null> {
    const belongs = await dbOperations.checkLabelBelongsToUser(id, userId);
    if (!belongs) throw new Error('Label not found');

    return dbOperations.updateLabel(id, input as Partial<LabelRecord>);
  }

  async delete(id: string, userId: string): Promise<void> {
    const belongs = await dbOperations.checkLabelBelongsToUser(id, userId);
    if (!belongs) throw new Error('Label not found');

    return dbOperations.deleteLabel(id);
  }

  async list(userId: string): Promise<LabelRecord[]> {
    return dbOperations.findLabels(userId);
  }

  async addToTask(taskId: string, labelId: string, userId: string): Promise<void> {
    const taskBelongs = await dbOperations.checkLabelBelongsToUser(labelId, userId);
    if (!taskBelongs) throw new Error('Label not found');

    return dbOperations.addLabelToTask(taskId, labelId);
  }

  async removeFromTask(taskId: string, labelId: string, userId: string): Promise<void> {
    const taskBelongs = await dbOperations.checkLabelBelongsToUser(labelId, userId);
    if (!taskBelongs) throw new Error('Label not found');

    return dbOperations.removeLabelFromTask(taskId, labelId);
  }
}

// =============================================================================
// Factory
// =============================================================================

let instance: LabelService | null = null;

export function getLabelService(): LabelService {
  if (!instance) instance = new LabelService();
  return instance;
}

export default LabelService;
