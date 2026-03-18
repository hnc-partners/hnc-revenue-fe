/**
 * CoverageReport.tsx
 *
 * Main page component for the Coverage Report (FES-05).
 * Date range selector + coverage matrix + brand config section.
 */

import { useState, useMemo } from 'react';
import { Search, CalendarDays } from 'lucide-react';
import { Button, Input, Label, Skeleton, Spinner } from '@hnc-partners/ui-components';
import { toast } from 'sonner';
import { useCoverageMatrix } from '../api/useCoverageMatrix';
import { CoverageMatrix } from './CoverageMatrix';
import { BrandConfigSection } from './BrandConfigSection';
import type { CoverageQueryParams } from '../types';

/**
 * Format date to YYYY-MM-DD for input value.
 */
function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get default date range: 3 months ago to today.
 */
function getDefaultDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 3);
  return {
    start: toDateString(start),
    end: toDateString(end),
  };
}

/** Maximum allowed days for the date range (730 days) */
const MAX_DAYS = 730;

export function CoverageReport() {
  const defaults = useMemo(() => getDefaultDateRange(), []);

  const [periodStart, setPeriodStart] = useState(defaults.start);
  const [periodEnd, setPeriodEnd] = useState(defaults.end);
  const [queryParams, setQueryParams] = useState<CoverageQueryParams | null>(null);

  const {
    data: coverageData,
    isLoading,
    error,
    isFetching,
  } = useCoverageMatrix(queryParams);

  const handleLoadCoverage = () => {
    // Validate date range
    if (!periodStart || !periodEnd) {
      toast.error('Please select both start and end dates.');
      return;
    }

    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    if (start > end) {
      toast.error('Start date must be before end date.');
      return;
    }

    const diffDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > MAX_DAYS) {
      toast.error(`Date range cannot exceed ${MAX_DAYS} days.`);
      return;
    }

    setQueryParams({
      periodStartGte: periodStart,
      periodStartLte: periodEnd,
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-8 pt-6 overflow-y-auto flex-1">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Coverage Report</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Brand reporting coverage across periods
            </p>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm mb-6">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="grid gap-1.5">
              <Label htmlFor="periodStart" className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                Period Start
              </Label>
              <Input
                id="periodStart"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="periodEnd" className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                Period End
              </Label>
              <Input
                id="periodEnd"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <Button onClick={handleLoadCoverage} disabled={isFetching}>
              {isFetching ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Load Coverage
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Maximum date range: {MAX_DAYS} days
          </p>
        </div>

        {/* Coverage Matrix Section */}
        <div className="mb-6">
          {!queryParams && (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Load Coverage Data</h3>
              <p className="text-sm text-muted-foreground">
                Select a date range and click Load Coverage to see reporting coverage.
              </p>
            </div>
          )}

          {queryParams && isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          )}

          {queryParams && error && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-destructive">
                <h3 className="font-medium">Failed to load coverage data</h3>
                <p className="text-sm mt-1">Please try again or adjust the date range.</p>
                <Button
                  onClick={handleLoadCoverage}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {queryParams && !isLoading && !error && coverageData && (
            <CoverageMatrix data={coverageData} />
          )}
        </div>

        {/* Brand Config Section */}
        <div className="mb-6">
          <BrandConfigSection />
        </div>
      </div>
    </div>
  );
}
