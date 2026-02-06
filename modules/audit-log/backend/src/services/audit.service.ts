import { PrismaClient } from '@prisma/client';

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
  private prisma: PrismaClient;

  constructor(config?: Partial<AuditConfig>, prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
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

    const where: Record<string, unknown> = {};

    // Date range filter
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) (where.timestamp as Record<string, Date>).gte = startDate;
      if (endDate) (where.timestamp as Record<string, Date>).lte = endDate;
    }

    // User filter
    if (userId) where.userId = userId;

    // Level filter (single or multiple)
    if (level) where.level = level;
    if (levels?.length) where.level = { in: levels };

    // Action filter (single or multiple)
    if (action) where.action = { contains: action };
    if (actions?.length) where.action = { in: actions };

    // Category filter (single or multiple)
    if (category) where.category = category;
    if (categories?.length) where.category = { in: categories };

    // Search filter (searches across action, path, userEmail)
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { path: { contains: search, mode: 'insensitive' } },
        { userEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Convert metadata from JSON string to object if needed
    const formattedLogs: AuditLogRecord[] = logs.map((log) => ({
      ...log,
      metadata: typeof log.metadata === 'string'
        ? JSON.parse(log.metadata)
        : log.metadata as Record<string, unknown> | undefined,
    }));

    return {
      logs: formattedLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single audit log by ID
   */
  async getById(id: string): Promise<AuditLogRecord | null> {
    const log = await this.prisma.auditLog.findUnique({ where: { id } });

    if (!log) return null;

    return {
      ...log,
      metadata: typeof log.metadata === 'string'
        ? JSON.parse(log.metadata)
        : log.metadata as Record<string, unknown> | undefined,
    };
  }

  /**
   * Get audit log statistics
   */
  async getStats(days: number = 30): Promise<AuditStats> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [total, byLevelRaw, byCategoryRaw] = await Promise.all([
      this.prisma.auditLog.count({ where: { timestamp: { gte: startDate } } }),
      this.prisma.auditLog.groupBy({
        by: ['level'],
        _count: true,
        where: { timestamp: { gte: startDate } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['category'],
        _count: true,
        where: { timestamp: { gte: startDate } },
      }),
    ]);

    // Build byLevel object
    const byLevel: Record<AuditLevel, number> = {
      info: 0,
      warning: 0,
      error: 0,
      security: 0,
    };
    for (const item of byLevelRaw) {
      if (item.level && item.level in byLevel) {
        byLevel[item.level as AuditLevel] = item._count;
      }
    }

    // Build byCategory object
    const byCategory: Record<string, number> = {};
    for (const item of byCategoryRaw) {
      if (item.category) {
        byCategory[item.category] = item._count;
      }
    }

    // Get daily activity counts for the last N days using raw query
    const recentActivity: Array<{ date: string; count: number }> = [];
    try {
      const dailyCounts = await this.prisma.$queryRaw<
        Array<{ date: string; count: bigint }>
      >`
        SELECT DATE(timestamp) as date, COUNT(*) as count
        FROM "AuditLog"
        WHERE timestamp >= ${startDate}
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
        LIMIT 30
      `;

      for (const row of dailyCounts) {
        recentActivity.push({
          date: row.date,
          count: Number(row.count),
        });
      }
    } catch (err) {
      // Raw query may not work with all database providers, fallback to empty array
      console.warn('[AuditService] Failed to get daily counts:', err);
    }

    return {
      total,
      byLevel,
      byCategory,
      recentActivity,
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

    const result = await this.prisma.auditLog.deleteMany({
      where: { timestamp: { lt: cutoffDate } },
    });

    return result.count;
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

    try {
      await this.prisma.auditLog.createMany({
        data: entries.map((entry) => ({
          level: entry.level || 'info',
          action: entry.action,
          category: entry.category || 'api',
          userId: entry.userId,
          userEmail: entry.userEmail,
          targetId: entry.targetId,
          targetType: entry.targetType,
          method: entry.method,
          path: entry.path,
          statusCode: entry.statusCode,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          duration: entry.duration,
          metadata: entry.metadata ? entry.metadata : undefined,
          error: entry.error,
          timestamp: new Date(),
        })),
      });
    } catch (err) {
      // Re-add entries to queue on failure
      this.queue.unshift(...entries);
      throw err;
    }
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
let sharedPrismaClient: PrismaClient | null = null;

/**
 * Initialize the audit service with a shared Prisma client
 * Call this once during application startup
 */
export function initAuditService(prisma: PrismaClient, config?: Partial<AuditConfig>): AuditService {
  sharedPrismaClient = prisma;
  auditServiceInstance = new AuditService(config, prisma);
  return auditServiceInstance;
}

/**
 * Get or create the audit service singleton
 */
export function getAuditService(): AuditService {
  if (!auditServiceInstance) {
    auditServiceInstance = new AuditService(undefined, sharedPrismaClient || undefined);
  }
  return auditServiceInstance;
}

/**
 * Create a custom audit service instance
 */
export function createAuditService(config: Partial<AuditConfig>, prisma?: PrismaClient): AuditService {
  return new AuditService(config, prisma || sharedPrismaClient || undefined);
}

export default AuditService;
