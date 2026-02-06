// =============================================================================
// Types
// =============================================================================

export type AuditLevel = 'info' | 'warning' | 'error' | 'security';

export type AuditCategory =
  | 'auth'
  | 'user'
  | 'admin'
  | 'payment'
  | 'system'
  | 'api'
  | 'security'
  | string;

export interface AuditLogEntry {
  level?: AuditLevel;
  action: string;
  category?: AuditCategory;
  userId?: string;
  userEmail?: string;
  targetId?: string;
  targetType?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface AuditLogRecord extends AuditLogEntry {
  id: string;
  timestamp: Date;
}

export interface AuditQueryOptions {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  level?: AuditLevel;
  levels?: AuditLevel[];
  action?: string;
  actions?: string[];
  category?: AuditCategory;
  categories?: AuditCategory[];
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'timestamp' | 'level' | 'action';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditQueryResult {
  logs: AuditLogRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditStats {
  total: number;
  byLevel: Record<AuditLevel, number>;
  byCategory: Record<string, number>;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

export interface AuditConfig {
  enabled: boolean;
  retentionDays: number;
  levels: AuditLevel[];
  excludePaths: RegExp[];
  includeBody: boolean;
  maskFields: string[];
}

// =============================================================================
// Audit Service
// =============================================================================

export class AuditService {
  private config: AuditConfig;
  private queue: AuditLogEntry[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 5000;

  // In production, inject PrismaClient
  // private prisma: PrismaClient;

  constructor(config?: Partial<AuditConfig>) {
    this.config = {
      enabled: config?.enabled ?? process.env.AUDIT_LOG_ENABLED !== 'false',
      retentionDays: config?.retentionDays ?? parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '365'),
      levels: config?.levels ?? this.parseLevels(process.env.AUDIT_LOG_LEVELS),
      excludePaths: config?.excludePaths ?? this.parsePaths(process.env.AUDIT_LOG_EXCLUDE_PATHS),
      includeBody: config?.includeBody ?? process.env.AUDIT_LOG_INCLUDE_BODY === 'true',
      maskFields: config?.maskFields ?? this.parseFields(process.env.AUDIT_LOG_MASK_FIELDS),
    };

    if (this.config.enabled) {
      this.startFlushInterval();
    }
  }

  // ===========================================================================
  // Logging Methods
  // ===========================================================================

  /**
   * Log an audit entry
   */
  async log(entry: AuditLogEntry): Promise<void> {
    if (!this.config.enabled) return;
    if (!this.shouldLog(entry.level || 'info')) return;

    const sanitized = this.sanitizeEntry(entry);
    this.queue.push(sanitized);

    // Flush immediately if queue is large
    if (this.queue.length >= this.BATCH_SIZE) {
      await this.flush();
    }
  }

  /**
   * Log an info-level entry
   */
  async info(entry: Omit<AuditLogEntry, 'level'>): Promise<void> {
    return this.log({ ...entry, level: 'info' });
  }

  /**
   * Log a warning-level entry
   */
  async warning(entry: Omit<AuditLogEntry, 'level'>): Promise<void> {
    return this.log({ ...entry, level: 'warning' });
  }

  /**
   * Log an error-level entry
   */
  async error(entry: Omit<AuditLogEntry, 'level'>): Promise<void> {
    return this.log({ ...entry, level: 'error' });
  }

  /**
   * Log a security-level entry
   */
  async security(entry: Omit<AuditLogEntry, 'level'>): Promise<void> {
    return this.log({ ...entry, level: 'security' });
  }

  // ===========================================================================
  // Query Methods
  // ===========================================================================

  /**
   * Query audit logs with filtering and pagination
   */
  async query(options: AuditQueryOptions = {}): Promise<AuditQueryResult> {
    const {
      startDate,
      endDate,
      userId,
      level,
      levels,
      action,
      actions,
      category,
      categories,
      search,
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = options;

    // In production, use Prisma:
    // const where: Prisma.AuditLogWhereInput = {};
    //
    // if (startDate || endDate) {
    //   where.timestamp = {};
    //   if (startDate) where.timestamp.gte = startDate;
    //   if (endDate) where.timestamp.lte = endDate;
    // }
    //
    // if (userId) where.userId = userId;
    // if (level) where.level = level;
    // if (levels?.length) where.level = { in: levels };
    // if (action) where.action = { contains: action };
    // if (actions?.length) where.action = { in: actions };
    // if (category) where.category = category;
    // if (categories?.length) where.category = { in: categories };
    //
    // if (search) {
    //   where.OR = [
    //     { action: { contains: search, mode: 'insensitive' } },
    //     { path: { contains: search, mode: 'insensitive' } },
    //     { userEmail: { contains: search, mode: 'insensitive' } },
    //   ];
    // }
    //
    // const [logs, total] = await Promise.all([
    //   this.prisma.auditLog.findMany({
    //     where,
    //     orderBy: { [sortBy]: sortOrder },
    //     skip: (page - 1) * limit,
    //     take: limit,
    //   }),
    //   this.prisma.auditLog.count({ where }),
    // ]);

    // Stub implementation
    console.log('[AuditService] Query with options:', {
      startDate,
      endDate,
      userId,
      level,
      category,
      search,
      page,
      limit,
    });

    return {
      logs: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  /**
   * Get a single audit log by ID
   */
  async getById(id: string): Promise<AuditLogRecord | null> {
    // In production:
    // return this.prisma.auditLog.findUnique({ where: { id } });

    console.log('[AuditService] Get by ID:', id);
    return null;
  }

  /**
   * Get audit log statistics
   */
  async getStats(days: number = 30): Promise<AuditStats> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // In production:
    // const [total, byLevel, byCategory, dailyCounts] = await Promise.all([
    //   this.prisma.auditLog.count({ where: { timestamp: { gte: startDate } } }),
    //   this.prisma.auditLog.groupBy({
    //     by: ['level'],
    //     _count: true,
    //     where: { timestamp: { gte: startDate } },
    //   }),
    //   this.prisma.auditLog.groupBy({
    //     by: ['category'],
    //     _count: true,
    //     where: { timestamp: { gte: startDate } },
    //   }),
    //   // Raw query for daily counts
    // ]);

    // Stub implementation
    return {
      total: 0,
      byLevel: {
        info: 0,
        warning: 0,
        error: 0,
        security: 0,
      },
      byCategory: {},
      recentActivity: [],
    };
  }

  // ===========================================================================
  // Maintenance Methods
  // ===========================================================================

  /**
   * Delete logs older than retention period
   */
  async cleanup(): Promise<number> {
    const cutoffDate = new Date(
      Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000
    );

    // In production:
    // const result = await this.prisma.auditLog.deleteMany({
    //   where: { timestamp: { lt: cutoffDate } },
    // });
    // return result.count;

    console.log('[AuditService] Cleanup logs before:', cutoffDate);
    return 0;
  }

  /**
   * Export logs to JSON format
   */
  async exportToJson(options: AuditQueryOptions): Promise<string> {
    const result = await this.query({ ...options, limit: 10000 });
    return JSON.stringify(result.logs, null, 2);
  }

  /**
   * Export logs to CSV format
   */
  async exportToCsv(options: AuditQueryOptions): Promise<string> {
    const result = await this.query({ ...options, limit: 10000 });

    const headers = [
      'id',
      'timestamp',
      'level',
      'action',
      'category',
      'userId',
      'userEmail',
      'method',
      'path',
      'statusCode',
      'ipAddress',
      'duration',
      'error',
    ];

    const rows = result.logs.map((log) =>
      headers.map((h) => {
        const value = log[h as keyof AuditLogRecord];
        if (value === null || value === undefined) return '';
        if (value instanceof Date) return value.toISOString();
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value).replace(/"/g, '""');
      })
    );

    const csvRows = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ];

    return csvRows.join('\n');
  }

  // ===========================================================================
  // Path Checking
  // ===========================================================================

  /**
   * Check if a path should be excluded from logging
   */
  shouldExcludePath(path: string): boolean {
    return this.config.excludePaths.some((pattern) => pattern.test(path));
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private shouldLog(level: AuditLevel): boolean {
    return this.config.levels.includes(level);
  }

  private sanitizeEntry(entry: AuditLogEntry): AuditLogEntry {
    const sanitized = { ...entry };

    // Mask sensitive fields in metadata
    if (sanitized.metadata) {
      sanitized.metadata = this.maskSensitiveData(sanitized.metadata);
    }

    return sanitized;
  }

  private maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
    const masked: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (this.config.maskFields.some((field) =>
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        masked[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskSensitiveData(value as Record<string, unknown>);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush().catch((err) => {
        console.error('[AuditService] Flush error:', err);
      });
    }, this.FLUSH_INTERVAL_MS);
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const entries = this.queue.splice(0, this.BATCH_SIZE);

    // In production, batch insert:
    // await this.prisma.auditLog.createMany({
    //   data: entries.map((entry) => ({
    //     ...entry,
    //     timestamp: new Date(),
    //     metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
    //   })),
    // });

    // Stub: Just log to console
    console.log(`[AuditService] Flushing ${entries.length} audit log entries`);
  }

  private parseLevels(levelsStr?: string): AuditLevel[] {
    if (!levelsStr) {
      return ['info', 'warning', 'error', 'security'];
    }
    return levelsStr.split(',').map((l) => l.trim() as AuditLevel);
  }

  private parsePaths(pathsStr?: string): RegExp[] {
    if (!pathsStr) {
      return [/^\/health$/, /^\/metrics$/];
    }
    return pathsStr.split(',').map((p) => new RegExp(p.trim()));
  }

  private parseFields(fieldsStr?: string): string[] {
    if (!fieldsStr) {
      return ['password', 'token', 'secret', 'apiKey', 'creditCard', 'ssn'];
    }
    return fieldsStr.split(',').map((f) => f.trim());
  }

  /**
   * Stop the flush interval (for cleanup)
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    // Flush remaining entries
    this.flush().catch(console.error);
  }
}

// =============================================================================
// Factory
// =============================================================================

let auditServiceInstance: AuditService | null = null;

/**
 * Get or create the audit service singleton
 */
export function getAuditService(): AuditService {
  if (!auditServiceInstance) {
    auditServiceInstance = new AuditService();
  }
  return auditServiceInstance;
}

/**
 * Create a custom audit service instance
 */
export function createAuditService(config: Partial<AuditConfig>): AuditService {
  return new AuditService(config);
}

export default AuditService;
