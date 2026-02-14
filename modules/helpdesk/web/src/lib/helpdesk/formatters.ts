// =============================================================================
// Helpdesk Formatters
// =============================================================================

import type { TicketStatus, TicketPriority, AgentRole, ArticleStatus } from './types';

/**
 * Format a ticket status to a human-readable label.
 */
const ticketStatusLabels: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  WAITING_ON_CUSTOMER: 'Waiting on Customer',
  WAITING_ON_AGENT: 'Waiting on Agent',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export function formatTicketStatus(status: TicketStatus): string {
  return ticketStatusLabels[status] ?? status;
}

/**
 * Get StatusBadge status type for a ticket status.
 */
const ticketStatusBadgeMap: Record<TicketStatus, string> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  WAITING_ON_CUSTOMER: 'pending',
  WAITING_ON_AGENT: 'pending',
  RESOLVED: 'success',
  CLOSED: 'inactive',
};

export function getTicketStatusBadge(status: TicketStatus): string {
  return ticketStatusBadgeMap[status] ?? 'pending';
}

/**
 * Format a ticket priority to a human-readable label.
 */
const ticketPriorityLabels: Record<TicketPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export function formatTicketPriority(priority: TicketPriority): string {
  return ticketPriorityLabels[priority] ?? priority;
}

/**
 * Get StatusBadge status type for a ticket priority.
 */
const ticketPriorityBadgeMap: Record<TicketPriority, string> = {
  LOW: 'inactive',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'error',
};

export function getTicketPriorityBadge(priority: TicketPriority): string {
  return ticketPriorityBadgeMap[priority] ?? 'pending';
}

/**
 * Format an agent role to a human-readable label.
 */
const agentRoleLabels: Record<AgentRole, string> = {
  AGENT: 'Agent',
  SUPERVISOR: 'Supervisor',
  ADMIN: 'Admin',
};

export function formatAgentRole(role: AgentRole): string {
  return agentRoleLabels[role] ?? role;
}

/**
 * Format an article status to a human-readable label.
 */
const articleStatusLabels: Record<ArticleStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

export function formatArticleStatus(status: ArticleStatus): string {
  return articleStatusLabels[status] ?? status;
}

/**
 * Get StatusBadge status type for an article status.
 */
const articleStatusBadgeMap: Record<ArticleStatus, string> = {
  DRAFT: 'inactive',
  PUBLISHED: 'success',
  ARCHIVED: 'warning',
};

export function getArticleStatusBadge(status: ArticleStatus): string {
  return articleStatusBadgeMap[status] ?? 'pending';
}

/**
 * Format a date string to a locale display string.
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

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
 * Format SLA time in minutes to a human-readable string.
 */
export function formatSlaTime(minutes: number): string {
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    if (remainingMinutes === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    return `${hours}h ${remainingMinutes}m`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0 && remainingMinutes === 0) return `${days} day${days !== 1 ? 's' : ''}`;
  if (remainingMinutes === 0) return `${days}d ${remainingHours}h`;
  return `${days}d ${remainingHours}h ${remainingMinutes}m`;
}
