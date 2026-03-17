/**
 * PeriodTimeline.tsx
 *
 * Visual timeline of statement periods showing coverage.
 * Displays recent runs as period blocks color-coded by status.
 */

import { cn } from '@/lib/utils';
import type { RecentRun, RunStatus } from '../types';

interface PeriodTimelineProps {
  runs: RecentRun[];
  className?: string;
}

function formatMonth(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    success: 'bg-success',
    running: 'bg-info',
    partial: 'bg-warning',
    failed: 'bg-destructive',
    skipped: 'bg-muted-foreground/30',
    rolled_back: 'bg-warning/60',
  };
  return map[status] ?? 'bg-muted-foreground/30';
}

function getStatusTooltip(status: string): string {
  const map: Record<string, string> = {
    success: 'Success',
    running: 'Running',
    partial: 'Partial',
    failed: 'Failed',
    skipped: 'Skipped',
    rolled_back: 'Rolled Back',
  };
  return map[status] ?? status;
}

export function PeriodTimeline({ runs, className }: PeriodTimelineProps) {
  if (runs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">No period data available</p>
    );
  }

  // Sort by periodStart ascending for left-to-right timeline
  const sorted = [...runs].sort(
    (a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime()
  );

  return (
    <div className={cn('space-y-2', className)}>
      {/* Timeline blocks */}
      <div className="flex gap-1 items-end">
        {sorted.map((run) => (
          <div
            key={run.id}
            className="flex flex-col items-center gap-1 flex-1 min-w-0"
            title={`${formatMonth(run.periodStart)} - ${formatMonth(run.periodEnd)}: ${getStatusTooltip(run.status)}`}
          >
            <div
              className={cn(
                'w-full h-6 rounded-sm transition-colors',
                getStatusColor(run.status)
              )}
            />
            <span className="text-[10px] text-muted-foreground truncate w-full text-center">
              {formatMonth(run.periodStart)}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        {(['success', 'partial', 'failed', 'running'] as RunStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-1">
            <div className={cn('h-2.5 w-2.5 rounded-sm', getStatusColor(status))} />
            <span className="text-[10px] text-muted-foreground">{getStatusTooltip(status)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
