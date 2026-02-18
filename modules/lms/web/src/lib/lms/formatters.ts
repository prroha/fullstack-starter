export { formatPrice, formatDuration } from '@/lib/utils';

/**
 * Get Tailwind CSS classes for a course level badge.
 */
const levelColors: Record<string, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  intermediate: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  advanced: 'bg-destructive/10 text-destructive',
};

export function getLevelColor(level: string): string {
  return levelColors[level.toLowerCase()] ?? 'bg-muted text-foreground';
}
