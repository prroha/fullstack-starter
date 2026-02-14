// =============================================================================
// Tasks Types
// =============================================================================

// --- Enums (union types for frontend) ---

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';

export type TaskPriority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskView = 'LIST' | 'BOARD' | 'CALENDAR';

// --- Project ---

export interface TaskProject {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  isArchived: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCreateInput {
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

// --- Task ---

export interface Task {
  id: string;
  userId: string;
  projectId: string | null;
  assigneeId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  position: number;
  isArchived: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  project?: TaskProject | null;
  comments?: TaskComment[];
  labels?: TaskLabelLink[];
}

export interface TaskCreateInput {
  projectId?: string;
  assigneeId?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface TaskUpdateInput {
  projectId?: string;
  assigneeId?: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
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

// --- Comment ---

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentCreateInput {
  content: string;
}

export interface CommentUpdateInput {
  content: string;
}

// --- Label ---

export interface TaskLabel {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface TaskLabelLink {
  id: string;
  taskId: string;
  labelId: string;
  label?: TaskLabel;
}

export interface LabelCreateInput {
  name: string;
  color?: string;
}

export interface LabelUpdateInput {
  name?: string;
  color?: string;
}

// --- Settings ---

export interface TaskSettings {
  id: string;
  userId: string;
  defaultView: TaskView;
  defaultProjectId: string | null;
  showCompletedTasks: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsUpdateInput {
  defaultView?: TaskView;
  defaultProjectId?: string;
  showCompletedTasks?: boolean;
}

// --- Dashboard Stats ---

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

// --- API Response ---

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
