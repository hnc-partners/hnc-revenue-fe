/**
 * BrandStatusIndicator.tsx
 *
 * Status dot + label showing a brand's overall statement acquisition health.
 * Colors follow the design system semantic tokens.
 */

import { cn } from '@/lib/utils';
import type { BrandHealth } from '../types';

interface StatusDisplayConfig {
  label: string;
  dotClass: string;
  textClass: string;
}

interface BrandStatusIndicatorProps {
  health: BrandHealth;
  /** Show label text alongside the dot */
  showLabel?: boolean;
  className?: string;
}

const HEALTH_CONFIG: Record<BrandHealth, StatusDisplayConfig> = {
  healthy: {
    label: 'On Track',
    dotClass: 'bg-success',
    textClass: 'text-success',
  },
  warning: {
    label: 'Overdue',
    dotClass: 'bg-warning',
    textClass: 'text-warning',
  },
  critical: {
    label: 'Failed',
    dotClass: 'bg-destructive',
    textClass: 'text-destructive',
  },
  unknown: {
    label: 'Unknown',
    dotClass: 'bg-muted-foreground/50',
    textClass: 'text-muted-foreground',
  },
};

/** Fallback config for unexpected health values */
const FALLBACK_CONFIG: StatusDisplayConfig = HEALTH_CONFIG.unknown;

export function BrandStatusIndicator({
  health,
  showLabel = true,
  className,
}: BrandStatusIndicatorProps) {
  const config = HEALTH_CONFIG[health] ?? FALLBACK_CONFIG;

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span
        className={cn('inline-block h-2 w-2 rounded-full shrink-0', config.dotClass)}
        aria-hidden="true"
      />
      {showLabel && (
        <span className={cn('text-xs font-medium', config.textClass)}>
          {config.label}
        </span>
      )}
      <span className="sr-only">{config.label}</span>
    </div>
  );
}
