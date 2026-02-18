export interface PreviewLimits {
  maxConcurrentSchemas: number;
  maxSessionsPerIp: number;
  sessionTtlHours: number;
  schemaIdleTimeoutMin: number;
  maxRowsPerTable: number;
  maxFileSizeBytes: number;
  prismaConnectionLimit: number;
}

let limits: PreviewLimits = {
  maxConcurrentSchemas: 50,
  maxSessionsPerIp: 5,
  sessionTtlHours: 4,
  schemaIdleTimeoutMin: 30,
  maxRowsPerTable: 1000,
  maxFileSizeBytes: 1 * 1024 * 1024, // 1MB
  prismaConnectionLimit: 2,
};

export function initLimits(config: Partial<PreviewLimits>): void {
  limits = { ...limits, ...config };
}

export function getLimits(): Readonly<PreviewLimits> {
  return limits;
}
