// =============================================================================
// Tasks Formatters
// =============================================================================

import type { TaskStatus, TaskPriority, TaskView } from './types';

/**
 * Format a task status to a human-readable label.
 */
const taskStatusLabels: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

export function formatTaskStatus(status: TaskStatus): string {
  return taskStatusLabels[status] ?? status;
}

/**
 * Get StatusBadge status type for a task status.
 */
type StatusType = "active" | "inactive" | "pending" | "success" | "warning" | "error" | "info";

const taskStatusBadgeMap: Record<TaskStatus, StatusType> = {
  TODO: 'pending',
  IN_PROGRESS: 'info',
  IN_REVIEW: 'warning',
  DONE: 'success',
  CANCELLED: 'inactive',
};

export function getTaskStatusBadge(status: TaskStatus): StatusType {
  return taskStatusBadgeMap[status] ?? 'pending';
}

/**
 * Format a task priority to a human-readable label.
 */
const taskPriorityLabels: Record<TaskPriority, string> = {
  NONE: 'None',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export function formatTaskPriority(priority: TaskPriority): string {
  return taskPriorityLabels[priority] ?? priority;
}

/**
 * Get StatusBadge status type for a task priority.
 */
const taskPriorityBadgeMap: Record<TaskPriority, StatusType> = {
  NONE: 'inactive',
  LOW: 'pending',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'error',
};

export function getTaskPriorityBadge(priority: TaskPriority): StatusType {
  return taskPriorityBadgeMap[priority] ?? 'pending';
}

/**
 * Format a task view to a human-readable label.
 */
const taskViewLabels: Record<TaskView, string> = {
  LIST: 'List',
  BOARD: 'Board',
  CALENDAR: 'Calendar',
};

export function formatTaskView(view: TaskView): string {
  return taskViewLabels[view] ?? view;
}

import { formatDate } from '@/lib/utils';
export { formatDate };

/**
 * Format a date string to a relative time (e.g., "2 hours ago").
 */
export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

/**
 * Format a due date with overdue indicator.
 */
export function formatDueDate(dateStr: string): { text: string; isOverdue: boolean } {
  const dueDate = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffDays = Math.floor((due.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) {
    return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
  }
  if (diffDays === 0) {
    return { text: 'Due today', isOverdue: false };
  }
  if (diffDays === 1) {
    return { text: 'Due tomorrow', isOverdue: false };
  }
  if (diffDays <= 7) {
    return { text: `Due in ${diffDays}d`, isOverdue: false };
  }
  return { text: formatDate(dateStr), isOverdue: false };
}
