import UAParser from 'ua-parser-js';

// =============================================================================
// Types
// =============================================================================

export interface AnalyticsConfig {
  enabled: boolean;
  retentionDays: number;
  batchSize?: number;
}

export interface TrackEventInput {
  userId?: string;
  sessionId?: string;
  event: string;
  properties?: Record<string, unknown>;
  userAgent?: string;
  ip?: string;
  timestamp?: Date;
}

export interface AnalyticsEvent {
  id: string;
  userId: string | null;
  sessionId: string | null;
  event: string;
  properties: Record<string, unknown> | null;
  deviceType: string | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  country: string | null;
  city: string | null;
  ip: string | null;
  createdAt: Date;
}

export interface QueryEventsInput {
  userId?: string;
  sessionId?: string;
  event?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface QueryEventsResult {
  events: AnalyticsEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type AggregationPeriod = 'hour' | 'day' | 'week' | 'month';

export interface StatsQuery {
  period: AggregationPeriod;
  startDate?: Date;
  endDate?: Date;
  event?: string;
  userId?: string;
}

export interface EventStats {
  event: string;
  count: number;
  uniqueUsers: number;
  period: string;
}

export interface OverviewStats {
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  topEvents: Array<{ event: string; count: number }>;
  deviceBreakdown: Array<{ deviceType: string; count: number }>;
  browserBreakdown: Array<{ browser: string; count: number }>;
}

export interface ExportOptions {
  format: 'json' | 'csv';
  startDate?: Date;
  endDate?: Date;
  events?: string[];
  userId?: string;
}

// =============================================================================
// Database Operations Interface
// =============================================================================

// This interface allows for easy mocking and swapping of database implementations
export interface AnalyticsDbOperations {
  createEvent(data: {
    userId: string | null;
    sessionId: string | null;
    event: string;
    properties: Record<string, unknown> | null;
    deviceType: string | null;
    browser: string | null;
    browserVersion: string | null;
    os: string | null;
    osVersion: string | null;
    country: string | null;
    city: string | null;
    ip: string | null;
    createdAt: Date;
  }): Promise<AnalyticsEvent>;

  queryEvents(input: QueryEventsInput): Promise<{ events: AnalyticsEvent[]; total: number }>;

  getEventStats(query: StatsQuery): Promise<EventStats[]>;

  getOverviewStats(startDate: Date, endDate: Date): Promise<OverviewStats>;

  deleteOldEvents(beforeDate: Date): Promise<number>;

  getDistinctEventNames(): Promise<string[]>;
}

// =============================================================================
// Default Database Operations (Prisma-based)
// =============================================================================

// Import paths should be adjusted based on your project structure
// These are relative paths from the module to the core backend
// import { db } from '../../../../../core/backend/src/lib/db';

// Placeholder implementation - replace with actual Prisma calls
const defaultDbOperations: AnalyticsDbOperations = {
  async createEvent(data) {
    // Replace with:
    // return db.analyticsEvent.create({ data });
    console.log('[Analytics] Creating event:', data.event);
    return {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
    };
  },

  async queryEvents(input) {
    // Replace with:
    // const where = {
    //   ...(input.userId && { userId: input.userId }),
    //   ...(input.sessionId && { sessionId: input.sessionId }),
    //   ...(input.event && { event: input.event }),
    //   ...(input.startDate && input.endDate && {
    //     createdAt: {
    //       gte: input.startDate,
    //       lte: input.endDate,
    //     },
    //   }),
    // };
    // const [events, total] = await Promise.all([
    //   db.analyticsEvent.findMany({
    //     where,
    //     orderBy: { createdAt: 'desc' },
    //     skip: input.offset || 0,
    //     take: input.limit || 50,
    //   }),
    //   db.analyticsEvent.count({ where }),
    // ]);
    // return { events, total };
    console.log('[Analytics] Querying events:', input);
    return { events: [], total: 0 };
  },

  async getEventStats(query) {
    // Replace with actual aggregation query
    // Using Prisma's groupBy or raw SQL for complex aggregations
    console.log('[Analytics] Getting event stats:', query);
    return [];
  },

  async getOverviewStats(startDate, endDate) {
    // Replace with actual aggregation queries
    console.log('[Analytics] Getting overview stats:', { startDate, endDate });
    return {
      totalEvents: 0,
      uniqueUsers: 0,
      uniqueSessions: 0,
      topEvents: [],
      deviceBreakdown: [],
      browserBreakdown: [],
    };
  },

  async deleteOldEvents(beforeDate) {
    // Replace with:
    // const result = await db.analyticsEvent.deleteMany({
    //   where: { createdAt: { lt: beforeDate } },
    // });
    // return result.count;
    console.log('[Analytics] Deleting events before:', beforeDate);
    return 0;
  },

  async getDistinctEventNames() {
    // Replace with:
    // const events = await db.analyticsEvent.findMany({
    //   distinct: ['event'],
    //   select: { event: true },
    // });
    // return events.map(e => e.event);
    console.log('[Analytics] Getting distinct event names');
    return [];
  },
};

// =============================================================================
// Analytics Service
// =============================================================================

export class AnalyticsService {
  private config: AnalyticsConfig;
  private dbOps: AnalyticsDbOperations;
  private eventQueue: TrackEventInput[] = [];
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(config: Partial<AnalyticsConfig> = {}, dbOps?: AnalyticsDbOperations) {
    this.config = {
      enabled: config.enabled ?? process.env.ANALYTICS_ENABLED !== 'false',
      retentionDays: config.retentionDays ?? parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90', 10),
      batchSize: config.batchSize ?? 100,
    };
    this.dbOps = dbOps || defaultDbOperations;
  }

  // ===========================================================================
  // Event Tracking
  // ===========================================================================

  /**
   * Track a single event
   */
  async trackEvent(input: TrackEventInput): Promise<AnalyticsEvent | null> {
    if (!this.config.enabled) {
      return null;
    }

    const deviceInfo = this.parseUserAgent(input.userAgent);
    const timestamp = input.timestamp || new Date();

    const event = await this.dbOps.createEvent({
      userId: input.userId || null,
      sessionId: input.sessionId || null,
      event: input.event,
      properties: input.properties || null,
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      browserVersion: deviceInfo.browserVersion,
      os: deviceInfo.os,
      osVersion: deviceInfo.osVersion,
      country: null, // Can be enriched via IP geolocation service
      city: null,
      ip: this.anonymizeIp(input.ip),
      createdAt: timestamp,
    });

    return event;
  }

  /**
   * Track multiple events in batch (for high-volume scenarios)
   */
  async trackBatch(events: TrackEventInput[]): Promise<number> {
    if (!this.config.enabled) {
      return 0;
    }

    let tracked = 0;
    for (const event of events) {
      const result = await this.trackEvent(event);
      if (result) {
        tracked++;
      }
    }

    return tracked;
  }

  /**
   * Queue an event for batched processing
   * Useful for high-throughput scenarios
   */
  queueEvent(input: TrackEventInput): void {
    if (!this.config.enabled) {
      return;
    }

    this.eventQueue.push(input);

    if (this.eventQueue.length >= (this.config.batchSize || 100)) {
      this.flushQueue();
    } else if (!this.flushTimeout) {
      // Flush after 5 seconds of inactivity
      this.flushTimeout = setTimeout(() => this.flushQueue(), 5000);
    }
  }

  /**
   * Flush the event queue
   */
  async flushQueue(): Promise<void> {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    await this.trackBatch(events);
  }

  // ===========================================================================
  // Querying
  // ===========================================================================

  /**
   * Query events with filtering and pagination
   */
  async queryEvents(input: QueryEventsInput): Promise<QueryEventsResult> {
    const limit = Math.min(input.limit || 50, 1000);
    const offset = input.offset || 0;
    const page = Math.floor(offset / limit) + 1;

    const result = await this.dbOps.queryEvents({
      ...input,
      limit,
      offset,
    });

    return {
      events: result.events,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  /**
   * Get aggregated statistics for events
   */
  async getStats(query: StatsQuery): Promise<EventStats[]> {
    return this.dbOps.getEventStats(query);
  }

  /**
   * Get overview statistics for a date range
   */
  async getOverview(startDate?: Date, endDate?: Date): Promise<OverviewStats> {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days

    return this.dbOps.getOverviewStats(start, end);
  }

  /**
   * Get list of all distinct event names
   */
  async getEventNames(): Promise<string[]> {
    return this.dbOps.getDistinctEventNames();
  }

  // ===========================================================================
  // Export
  // ===========================================================================

  /**
   * Export events in specified format
   */
  async exportEvents(options: ExportOptions): Promise<string> {
    const endDate = options.endDate || new Date();
    const startDate = options.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const result = await this.dbOps.queryEvents({
      startDate,
      endDate,
      event: options.events?.[0], // TODO: Support multiple events
      userId: options.userId,
      limit: 10000, // Max export size
    });

    if (options.format === 'csv') {
      return this.eventsToCSV(result.events);
    }

    return JSON.stringify(result.events, null, 2);
  }

  // ===========================================================================
  // Maintenance
  // ===========================================================================

  /**
   * Clean up old events based on retention policy
   */
  async cleanupOldEvents(): Promise<number> {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - this.config.retentionDays);

    return this.dbOps.deleteOldEvents(retentionDate);
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  /**
   * Parse user agent string to extract device info
   */
  private parseUserAgent(userAgent?: string): {
    deviceType: string | null;
    browser: string | null;
    browserVersion: string | null;
    os: string | null;
    osVersion: string | null;
  } {
    if (!userAgent) {
      return {
        deviceType: null,
        browser: null,
        browserVersion: null,
        os: null,
        osVersion: null,
      };
    }

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    let deviceType = result.device.type || 'desktop';
    if (!result.device.type) {
      // UAParser returns undefined for desktop browsers
      deviceType = 'desktop';
    }

    return {
      deviceType,
      browser: result.browser.name || null,
      browserVersion: result.browser.version || null,
      os: result.os.name || null,
      osVersion: result.os.version || null,
    };
  }

  /**
   * Anonymize IP address for privacy compliance
   * Keeps first 3 octets for IPv4, first 48 bits for IPv6
   */
  private anonymizeIp(ip?: string): string | null {
    if (!ip) {
      return null;
    }

    // Check if IPv6
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 4) {
        return `${parts[0]}:${parts[1]}:${parts[2]}:0:0:0:0:0`;
      }
      return null;
    }

    // IPv4
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }

    return null;
  }

  /**
   * Convert events to CSV format
   */
  private eventsToCSV(events: AnalyticsEvent[]): string {
    if (events.length === 0) {
      return '';
    }

    const headers = [
      'id',
      'userId',
      'sessionId',
      'event',
      'properties',
      'deviceType',
      'browser',
      'browserVersion',
      'os',
      'osVersion',
      'country',
      'city',
      'createdAt',
    ];

    const rows = events.map((event) => {
      return [
        event.id,
        event.userId || '',
        event.sessionId || '',
        event.event,
        event.properties ? JSON.stringify(event.properties) : '',
        event.deviceType || '',
        event.browser || '',
        event.browserVersion || '',
        event.os || '',
        event.osVersion || '',
        event.country || '',
        event.city || '',
        event.createdAt.toISOString(),
      ]
        .map((value) => {
          // Escape values containing commas or quotes
          const str = String(value);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let analyticsServiceInstance: AnalyticsService | null = null;

/**
 * Get or create the analytics service singleton
 */
export function getAnalyticsService(): AnalyticsService {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new AnalyticsService();
  }
  return analyticsServiceInstance;
}

/**
 * Create a custom analytics service instance
 */
export function createAnalyticsService(
  config: Partial<AnalyticsConfig>,
  dbOps?: AnalyticsDbOperations
): AnalyticsService {
  return new AnalyticsService(config, dbOps);
}

export default AnalyticsService;
