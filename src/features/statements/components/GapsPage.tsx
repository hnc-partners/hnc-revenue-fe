/**
 * GapsPage.tsx
 *
 * Matrix visualization showing missing statement periods across all brands.
 * Rows = brands, columns = periods (months). Color-coded by gap status.
 *
 * FE-4: Statement Gaps View (F54)
 */

import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button, Skeleton, Badge, Input } from '@hnc-partners/ui-components';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Search,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGaps } from '../api/useGaps';
import type { RMGapResult, RMGapStatus, RMGapQueryParams } from '../types/gaps';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a date string as "Mar 05" for short column labels */
function formatPeriodShort(dateStr: string): string {
  // Parse as local date to avoid timezone shift (dateStr is YYYY-MM-DD)
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
}

/** Default start date: 6 months ago from today */
function defaultStartDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d.toISOString().slice(0, 10);
}

/** Default end date: today */
function defaultEndDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Status config for visual display */
const STATUS_CONFIG: Record<
  RMGapStatus,
  { label: string; bgClass: string; textClass: string; dotClass: string }
> = {
  received: {
    label: 'Received',
    bgClass: 'bg-success/20',
    textClass: 'text-success',
    dotClass: 'bg-success',
  },
  missing: {
    label: 'Missing',
    bgClass: 'bg-destructive/20',
    textClass: 'text-destructive',
    dotClass: 'bg-destructive',
  },
  failed: {
    label: 'Failed',
    bgClass: 'bg-warning/20',
    textClass: 'text-warning',
    dotClass: 'bg-warning',
  },
  partial: {
    label: 'Partial',
    bgClass: 'bg-info/20',
    textClass: 'text-info',
    dotClass: 'bg-info',
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Loading skeleton matching the matrix layout */
function GapsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

/** Error state with retry */
function GapsError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-destructive/10 p-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">
        Something went wrong
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}

/** Success state when no gaps detected */
function AllCoveredState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-success/10 p-3 mb-4">
        <CheckCircle2 className="h-8 w-8 text-success" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">
        All Periods Covered
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        No gaps detected across all brands for the selected date range. All
        expected statements have been received.
      </p>
    </div>
  );
}

/** Legend for the matrix colors */
function GapsLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      {(Object.keys(STATUS_CONFIG) as RMGapStatus[]).map((status) => {
        const config = STATUS_CONFIG[status];
        return (
          <div key={status} className="flex items-center gap-1.5">
            <span
              className={cn('h-3 w-3 rounded-sm', config.dotClass)}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{config.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Single cell in the gap matrix */
function GapCell({ status, brandCode }: { status: RMGapStatus; brandCode: string }) {
  const config = STATUS_CONFIG[status];

  // Link missing/failed/partial cells to brand detail for investigation
  if (status !== 'received') {
    return (
      <Link
        to="/revenue/statements/$brandCode"
        params={{ brandCode }}
        className={cn(
          'block h-8 w-full rounded-sm transition-opacity hover:opacity-80',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          config.bgClass
        )}
        title={`${config.label} — click to investigate`}
      >
        <span className="sr-only">{config.label}</span>
      </Link>
    );
  }

  return (
    <div
      className={cn('h-8 w-full rounded-sm', config.bgClass)}
      title={config.label}
    >
      <span className="sr-only">{config.label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Matrix data transformation
// ---------------------------------------------------------------------------

interface MatrixRow {
  brandCode: string;
  brandName: string;
  cells: Map<string, RMGapStatus>;
}

/**
 * Transform flat gap results into a matrix structure.
 * Returns sorted brands (rows) and unique periods (columns).
 */
function buildMatrix(gaps: RMGapResult[]): {
  rows: MatrixRow[];
  periods: string[];
} {
  // Collect unique periods and brands
  const periodSet = new Set<string>();
  const brandMap = new Map<string, MatrixRow>();

  for (const gap of gaps) {
    const periodKey = gap.periodStart;
    periodSet.add(periodKey);

    if (!brandMap.has(gap.brandCode)) {
      brandMap.set(gap.brandCode, {
        brandCode: gap.brandCode,
        brandName: gap.brandName,
        cells: new Map(),
      });
    }

    brandMap.get(gap.brandCode)!.cells.set(periodKey, gap.status);
  }

  // Sort periods chronologically
  const periods = Array.from(periodSet).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // Sort brands alphabetically
  const rows = Array.from(brandMap.values()).sort((a, b) =>
    a.brandName.localeCompare(b.brandName)
  );

  return { rows, periods };
}

// ---------------------------------------------------------------------------
// Date filter
// ---------------------------------------------------------------------------

function DateFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: {
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <Input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="h-8 w-[140px] text-sm"
        aria-label="Start date"
      />
      <span className="text-sm text-muted-foreground">to</span>
      <Input
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="h-8 w-[140px] text-sm"
        aria-label="End date"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Brand filter
// ---------------------------------------------------------------------------

function BrandFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Filter brands..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-[180px] pl-8 text-sm"
        aria-label="Filter brands"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gap Matrix Table
// ---------------------------------------------------------------------------

function GapMatrix({
  rows,
  periods,
  brandFilter,
}: {
  rows: MatrixRow[];
  periods: string[];
  brandFilter: string;
}) {
  const filteredRows = useMemo(() => {
    if (!brandFilter.trim()) return rows;
    const lower = brandFilter.toLowerCase();
    return rows.filter(
      (r) =>
        r.brandName.toLowerCase().includes(lower) ||
        r.brandCode.toLowerCase().includes(lower)
    );
  }, [rows, brandFilter]);

  if (filteredRows.length === 0 && brandFilter.trim()) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No brands match &quot;{brandFilter}&quot;
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse" role="grid" aria-label="Statement gaps matrix">
        <thead>
          <tr className="bg-muted/50">
            <th className="sticky left-0 z-10 bg-muted/50 text-left px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground min-w-[160px] border-r border-border">
              Brand
            </th>
            {periods.map((period) => (
              <th
                key={period}
                className="px-2 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground text-center min-w-[72px]"
              >
                {formatPeriodShort(period)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((row) => (
            <tr
              key={row.brandCode}
              className="border-t border-border hover:bg-muted/30 transition-colors"
            >
              <td className="sticky left-0 z-10 bg-card px-3 py-2 text-sm font-medium text-foreground border-r border-border">
                <Link
                  to="/revenue/statements/$brandCode"
                  params={{ brandCode: row.brandCode }}
                  className="hover:text-mf-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  {row.brandName}
                </Link>
              </td>
              {periods.map((period) => {
                const status = row.cells.get(period);
                return (
                  <td key={period} className="px-1.5 py-1.5">
                    {status ? (
                      <GapCell status={status} brandCode={row.brandCode} />
                    ) : (
                      <div
                        className="h-8 w-full rounded-sm bg-muted/30"
                        title="No data"
                      >
                        <span className="sr-only">No data</span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary stats
// ---------------------------------------------------------------------------

function GapsSummary({ gaps }: { gaps: RMGapResult[] }) {
  const counts = useMemo(() => {
    const result = { received: 0, missing: 0, failed: 0, partial: 0 };
    for (const g of gaps) {
      result[g.status]++;
    }
    return result;
  }, [gaps]);

  return (
    <div className="flex flex-wrap gap-3">
      {(Object.keys(STATUS_CONFIG) as RMGapStatus[]).map((status) => {
        const config = STATUS_CONFIG[status];
        return (
          <Badge
            key={status}
            variant="outline"
            className={cn('gap-1.5', config.textClass)}
          >
            <span
              className={cn('h-2 w-2 rounded-full', config.dotClass)}
              aria-hidden="true"
            />
            {counts[status]} {config.label}
          </Badge>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main GapsPage Component
// ---------------------------------------------------------------------------

export function GapsPage() {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [brandFilter, setBrandFilter] = useState('');

  const queryParams: RMGapQueryParams = useMemo(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [startDate, endDate]
  );

  const { data: gaps, isLoading, error, refetch } = useGaps(queryParams);

  const matrix = useMemo(() => {
    if (!gaps || gaps.length === 0) return null;
    return buildMatrix(gaps);
  }, [gaps]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Link to="/revenue/statements">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to Statements</span>
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-foreground">
              Statement Gaps
            </h1>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <DateFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
          <BrandFilter value={brandFilter} onChange={setBrandFilter} />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto flex-1">
        {isLoading ? (
          <GapsSkeleton />
        ) : error ? (
          <GapsError
            message="Could not load gap detection results. Please try again."
            onRetry={() => refetch()}
          />
        ) : !gaps || gaps.length === 0 ? (
          <AllCoveredState />
        ) : matrix ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <GapsSummary gaps={gaps} />
              <GapsLegend />
            </div>
            <GapMatrix
              rows={matrix.rows}
              periods={matrix.periods}
              brandFilter={brandFilter}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
