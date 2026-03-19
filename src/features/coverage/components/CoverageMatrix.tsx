/**
 * CoverageMatrix.tsx
 *
 * Matrix grid showing brand coverage across periods.
 * Brands as rows, periods as columns, color-coded cells by status.
 */

import { useSafeNavigate } from '@/lib/use-safe-navigate';
import { Badge } from '@hnc-partners/ui-components';
import { Check, X, Minus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CoverageBrandRow, CoveragePeriod, CoverageGranularity } from '../types';

interface CoverageMatrixProps {
  data: CoverageBrandRow[];
}

/**
 * Format a period date based on granularity.
 */
function formatPeriodLabel(
  periodStart: string,
  periodEnd: string,
  granularity: CoverageGranularity
): string {
  const start = new Date(periodStart + 'T00:00:00');
  const end = new Date(periodEnd + 'T00:00:00');

  if (granularity === 'monthly') {
    return start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  if (granularity === 'weekly') {
    const startDay = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDay = end.toLocaleDateString('en-US', { day: 'numeric' });
    return `${startDay}-${endDay}`;
  }

  // Daily
  return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get cell styling based on coverage status.
 */
function getStatusStyles(status: CoveragePeriod['status']): string {
  switch (status) {
    case 'processed':
      return 'bg-success/20 text-success hover:bg-success/30';
    case 'pending':
      return 'bg-warning/20 text-warning hover:bg-warning/30';
    case 'failed':
      return 'bg-destructive/20 text-destructive hover:bg-destructive/30';
    case 'missing':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

/**
 * Get status icon for a cell.
 */
function StatusIcon({ status }: { status: CoveragePeriod['status'] }) {
  switch (status) {
    case 'processed':
      return <Check className="h-4 w-4" />;
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'failed':
      return <X className="h-4 w-4" />;
    case 'missing':
      return <Minus className="h-4 w-4" />;
    default:
      return <Minus className="h-4 w-4" />;
  }
}

/**
 * Get granularity badge variant.
 */
function getGranularityVariant(granularity: CoverageGranularity) {
  switch (granularity) {
    case 'daily':
      return 'info' as const;
    case 'weekly':
      return 'warning' as const;
    case 'monthly':
      return 'default' as const;
    default:
      return 'secondary' as const;
  }
}

export function CoverageMatrix({ data }: CoverageMatrixProps) {
  const navigate = useSafeNavigate();

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Minus className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Coverage Data</h3>
        <p className="text-sm text-muted-foreground">
          No brands configured for reporting. Add a brand configuration below.
        </p>
      </div>
    );
  }

  // Collect all unique period columns from the first brand row
  // (API returns consistent columns across all brands)
  const allPeriods = data[0]?.periods ?? [];

  const handleCellClick = (period: CoveragePeriod) => {
    if (period.batchId) {
      navigate({ to: '/revenue/imports/$batchId', params: { batchId: period.batchId } });
    }
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground min-w-[200px] border-r border-border">
                Brand
              </th>
              {allPeriods.map((period, idx) => (
                <th
                  key={`header-${idx}`}
                  className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground min-w-[80px] whitespace-nowrap"
                >
                  {data[0] &&
                    formatPeriodLabel(
                      period.periodStart,
                      period.periodEnd,
                      data[0].granularity
                    )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((brand) => (
              <tr key={brand.brandId} className="border-t border-border">
                <td className="sticky left-0 z-10 bg-card px-4 py-3 border-r border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {brand.brandName}
                    </span>
                    <Badge variant={getGranularityVariant(brand.granularity)}>
                      {brand.granularity}
                    </Badge>
                  </div>
                </td>
                {brand.periods.map((period, idx) => (
                  <td key={`${brand.brandId}-${idx}`} className="px-1 py-1">
                    <button
                      type="button"
                      onClick={() => handleCellClick(period)}
                      disabled={!period.batchId}
                      className={cn(
                        'w-full flex items-center justify-center rounded-md p-2 transition-colors',
                        getStatusStyles(period.status),
                        period.batchId
                          ? 'cursor-pointer'
                          : 'cursor-default'
                      )}
                      title={`${period.status}${period.batchId ? ' — Click to view batch' : ''}`}
                    >
                      <StatusIcon status={period.status} />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-border bg-muted/30">
        <span className="text-xs font-medium text-muted-foreground">Legend:</span>
        <div className="flex items-center gap-1">
          <div className="h-4 w-4 rounded bg-success/20 flex items-center justify-center">
            <Check className="h-3 w-3 text-success" />
          </div>
          <span className="text-xs text-muted-foreground">Processed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-4 w-4 rounded bg-warning/20 flex items-center justify-center">
            <Clock className="h-3 w-3 text-warning" />
          </div>
          <span className="text-xs text-muted-foreground">Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-4 w-4 rounded bg-destructive/20 flex items-center justify-center">
            <X className="h-3 w-3 text-destructive" />
          </div>
          <span className="text-xs text-muted-foreground">Failed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-4 w-4 rounded bg-muted flex items-center justify-center">
            <Minus className="h-3 w-3 text-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground">Missing</span>
        </div>
      </div>
    </div>
  );
}
