/**
 * BrandCard.tsx
 *
 * Individual brand card showing statement acquisition status at a glance.
 * Click to navigate to brand detail view.
 */

import { useNavigate } from '@tanstack/react-router';
import { Calendar, Clock, Settings } from 'lucide-react';
import { Button } from '@hnc-partners/ui-components';
import { cn } from '@/lib/utils';
import type { RMBrandConfigWithStatus } from '../types';
import { BrandStatusIndicator } from './BrandStatusIndicator';
import { AcquisitionModeBadge } from './AcquisitionModeBadge';

interface BrandCardProps {
  brand: RMBrandConfigWithStatus;
  /** Called when the settings/gear icon is clicked (opens edit dialog) */
  onEditConfig?: (brandCode: string) => void;
}

function formatDate(isoString: string | null): string {
  if (!isoString) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function formatGranularity(g: string): string {
  return g.charAt(0).toUpperCase() + g.slice(1);
}

export function BrandCard({ brand, onEditConfig }: BrandCardProps) {
  const navigate = useNavigate();
  const isDisabled = !brand.enabled;
  const health = isDisabled ? 'unknown' as const : brand.health;

  return (
    <button
      type="button"
      onClick={() =>
        navigate({ to: '/revenue/statements/$brandCode', params: { brandCode: brand.brandCode } })
      }
      className={cn(
        'w-full text-left rounded-lg border border-border bg-card p-4 shadow-sm',
        'transition-colors hover:border-mf-accent/50 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isDisabled && 'opacity-50'
      )}
      aria-label={`View statements for ${brand.brandName}`}
    >
      {/* Header: name + status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {brand.brandName}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {brand.brandCode}
          </p>
        </div>
        <BrandStatusIndicator health={health} showLabel={false} />
      </div>

      {/* Acquisition mode badge */}
      <div className="mb-3">
        <AcquisitionModeBadge mode={brand.acquisitionMode} />
      </div>

      {/* Status details */}
      <div className="space-y-2">
        {/* Last statement */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Last:</span>
          <span className="text-foreground font-medium truncate">
            {formatDate(brand.lastRun?.periodStart ?? brand.lastRun?.startedAt ?? null)}
          </span>
        </div>

        {/* Next expected */}
        <div className="flex items-center gap-2 text-xs">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Next:</span>
          <span className="text-foreground font-medium truncate">
            {formatDate(brand.nextExpected)}
          </span>
        </div>

        {/* Granularity + status label */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            {formatGranularity(brand.granularity)}
          </span>
          <div className="flex items-center gap-2">
            <BrandStatusIndicator health={health} showLabel />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onEditConfig?.(brand.brandCode);
              }}
              aria-label={`Configure ${brand.brandName}`}
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </button>
  );
}
