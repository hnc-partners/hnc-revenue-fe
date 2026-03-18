/**
 * CommissionResultsPage.tsx
 *
 * Main page component for the Commission Results view.
 * Renders filter bar + DataTable + pagination.
 * Reads deep-link query params: ?batchId=X, ?contactId=X, ?gamingAccountId=X
 */

import { useState, useMemo, useCallback } from 'react';
import { useSearch } from '@tanstack/react-router';
import { Skeleton, Button } from '@hnc-partners/ui-components';
import { AlertTriangle, Percent } from 'lucide-react';
import { useCommissionResults } from '../api';
import { CommissionResultFilters } from './CommissionResultFilters';
import { CommissionResultsTable } from './CommissionResultsTable';
import type { CommissionResultFilters as FilterType } from '../types';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-[140px]" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center"
      role="alert"
    >
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Percent className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-1">
        No Commission Results
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        No commission results found for the current filters. Try adjusting your
        filters or run a commission calculation batch first.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 25;

export function CommissionResultsPage() {
  // Read deep-link params from URL search
  const search = useSearch({ strict: false }) as Record<string, string | undefined>;

  // Initialize filters from URL params
  const [filters, setFilters] = useState<FilterType>(() => ({
    batch_id: search.batchId || undefined,
    contact_id: search.contactId || undefined,
    gaming_account_id: search.gamingAccountId || undefined,
    status: 'active', // Default: show only active results
    page: 1,
    limit: DEFAULT_LIMIT,
  }));

  // Memoize query filters to prevent unnecessary re-renders
  const queryFilters = useMemo(() => filters, [filters]);

  const { data: response, isLoading, error, refetch } = useCommissionResults(queryFilters);

  const handleFiltersChange = useCallback((newFilters: FilterType) => {
    setFilters(newFilters);
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      setFilters((prev) => ({ ...prev, page }));
    },
    []
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold text-foreground">
            Commission Results
          </h1>
        </div>

        {/* Filters */}
        <div className="mb-4">
          <CommissionResultFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto flex-1">
        {isLoading ? (
          <PageSkeleton />
        ) : error ? (
          <ErrorState
            message="Could not load commission results. Please try again."
            onRetry={() => refetch()}
          />
        ) : !response?.data || response.data.length === 0 ? (
          <EmptyState />
        ) : (
          <CommissionResultsTable
            data={response.data}
            meta={response.meta}
            currentPage={filters.page ?? 1}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
