// =============================================================================
// Helpdesk Types
// =============================================================================

// --- Enums (union types for frontend) ---

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_ON_CUSTOMER'
  | 'WAITING_ON_AGENT'
  | 'RESOLVED'
  | 'CLOSED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type AgentRole = 'AGENT' | 'SUPERVISOR' | 'ADMIN';

export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

// --- Category ---

export interface HelpdeskCategory {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  ticketCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryCreateInput {
  name: string;
  description?: string;
  color?: string;
  parentId?: string;
}

export interface CategoryUpdateInput {
  name?: string;
  description?: string;
  color?: string;
  parentId?: string;
}

// --- Agent ---

export interface HelpdeskAgent {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: AgentRole;
  department: string | null;
  isActive: boolean;
  maxOpenTickets: number;
  specialties: string[];
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentCreateInput {
  name: string;
  email: string;
  role?: AgentRole;
  department?: string;
  maxOpenTickets?: number;
  specialties?: string[];
}

export interface AgentUpdateInput {
  name?: string;
  email?: string;
  role?: AgentRole;
  department?: string;
  maxOpenTickets?: number;
  specialties?: string[];
}

export interface AgentWorkload {
  agentId: string;
  agentName: string;
  openTickets: number;
  inProgressTickets: number;
  resolvedToday: number;
  avgResponseMinutes: number;
  maxOpenTickets: number;
  utilizationPercent: number;
}

// --- SLA Policy ---

export interface SlaPolicy {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  priority: TicketPriority;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  businessHoursOnly: boolean;
  escalationEmail: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SlaPolicyCreateInput {
  name: string;
  description?: string;
  priority: TicketPriority;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  escalationEmail?: string;
  businessHoursOnly?: boolean;
}

export interface SlaPolicyUpdateInput {
  name?: string;
  description?: string;
  priority?: TicketPriority;
  firstResponseMinutes?: number;
  resolutionMinutes?: number;
  escalationEmail?: string;
  businessHoursOnly?: boolean;
}

export interface SlaBreachResult {
  ticketId: string;
  ticketNumber: string;
  policyName: string;
  breachType: 'first_response' | 'resolution';
  expectedMinutes: number;
  actualMinutes: number;
  breachedAt: string;
}

export interface SlaBreachCheckResult {
  breaches: SlaBreachResult[];
  checkedCount: number;
  errors: string[];
}

// --- Ticket ---

export interface Ticket {
  id: string;
  userId: string;
  ticketNumber: string;
  categoryId: string | null;
  assignedAgentId: string | null;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  slaBreached: boolean;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category?: HelpdeskCategory | null;
  assignedAgent?: HelpdeskAgent | null;
  tags?: TicketTagLink[];
  messages?: TicketMessage[];
}

export interface TicketCreateInput {
  categoryId?: string;
  subject: string;
  description: string;
  priority?: TicketPriority;
}

export interface TicketUpdateInput {
  categoryId?: string;
  subject?: string;
  description?: string;
  priority?: TicketPriority;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: string;
  assignedAgentId?: string;
  tagId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// --- Ticket Message ---

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'customer' | 'agent';
  body: string;
  isInternal: boolean;
  createdAt: string;
}

export interface MessageCreateInput {
  body: string;
  senderType: 'customer' | 'agent';
  isInternal?: boolean;
}

// --- Tags ---

export interface TicketTag {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface TicketTagLink {
  id: string;
  ticketId: string;
  tagId: string;
  tag?: TicketTag;
}

// --- Knowledge Base Article ---

export interface KnowledgeBaseArticle {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: ArticleStatus;
  tags: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category?: HelpdeskCategory | null;
}

export interface ArticleCreateInput {
  categoryId?: string;
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface ArticleUpdateInput {
  categoryId?: string;
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

// --- Canned Response ---

export interface CannedResponse {
  id: string;
  userId: string;
  title: string;
  content: string;
  shortcut: string | null;
  categoryId: string | null;
  isShared: boolean;
  createdByAgentId: string | null;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CannedResponseCreateInput {
  title: string;
  content: string;
  shortcut?: string;
  categoryId?: string;
  isShared?: boolean;
  createdByAgentId?: string;
}

export interface CannedResponseUpdateInput {
  title?: string;
  content?: string;
  shortcut?: string;
  categoryId?: string;
  isShared?: boolean;
}

// --- Settings ---

export interface HelpdeskSettings {
  id: string;
  userId: string;
  companyName: string | null;
  supportEmail: string | null;
  ticketPrefix: string;
  nextTicketNumber: number;
  autoAssign: boolean;
  businessHours: BusinessHours | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessHours {
  timezone: string;
  schedule: Array<{
    day: string;
    start: string;
    end: string;
  }>;
}

export interface SettingsUpdateInput {
  companyName?: string;
  supportEmail?: string;
  ticketPrefix?: string;
  autoAssign?: boolean;
  businessHours?: BusinessHours;
}

// --- Dashboard Stats ---

export interface HelpdeskDashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  avgResolutionHours: number;
  slaBreachedCount: number;
  unassignedCount: number;
  ticketsToday: number;
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
