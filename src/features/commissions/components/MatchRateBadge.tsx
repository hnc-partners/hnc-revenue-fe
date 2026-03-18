/**
 * MatchRateBadge.tsx
 *
 * Reusable badge showing match rate as a percentage with semantic coloring.
 * - >= 99%: green (success)
 * - 95-99%: yellow/amber (warning)
 * - < 95%: red (destructive)
 */

import { Badge } from '@hnc-partners/ui-components';
import { cn } from '@/lib/utils';

interface MatchRateBadgeProps {
  /** Match rate as a decimal string (e.g. "0.9048" = 90.48%) */
  matchRate: string;
  className?: string;
}

/**
 * Get badge styling based on match rate threshold.
 */
function getBadgeStyle(rate: number): string {
  if (rate >= 0.99) {
    return 'bg-success/20 text-success border-success/30';
  }
  if (rate >= 0.95) {
    return 'bg-warning/20 text-warning border-warning/30';
  }
  return 'bg-destructive/20 text-destructive border-destructive/30';
}

export function MatchRateBadge({ matchRate, className }: MatchRateBadgeProps) {
  const rate = parseFloat(matchRate);
  const displayRate = isNaN(rate) ? '0.00' : (rate * 100).toFixed(2);

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-mono tabular-nums text-xs',
        getBadgeStyle(rate),
        className
      )}
    >
      {displayRate}%
    </Badge>
  );
}
