/**
 * CommissionSummaryPage.tsx
 *
 * Main page for the Commission Summary Dashboard (FES-02).
 * Multi-dimension view with dimension picker, filters, and drill-down.
 *
 * Deep-link params: ?dimension=contact&contactId=X, ?dimension=ga&gamingAccountId=X, etc.
 * Click row -> navigates to Results tab pre-filtered by entity.
 */

import { useState, useMemo, useCallback } from 'react';
import { useSafeNavigate } from '@/lib/use-safe-navigate';
import { useSafeSearch } from '@/lib/useSafeSearch';
import { Skeleton, Button } from '@hnc-partners/ui-components';
import { AlertTriangle, BarChart3, X } from 'lucide-react';
import {
  useCommissionSummaries,
  useCommissionSummariesByGA,
  useCommissionSummariesByBrand,
} from '../api';
import { DimensionPicker } from './DimensionPicker';
import { SummaryFilters } from './SummaryFilters';
import { SummaryTable } from './SummaryTable';
import { dealTypeLabel } from './commission-helpers';
import type {
  SummaryDimension,
  SummaryFilters as SummaryFiltersType,
  CommissionSummary,
  CommissionSummaryByGA,
  CommissionSummaryByBrand,
  GroupedSummaryRow,
} from '../types';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-9 w-[500px]" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-[140px]" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
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
      <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-1">
        No Commission Summaries
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        No summary data found for the current filters and dimension. Try adjusting
        your filters or selecting a different dimension.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter banner for deep-link params
// ---------------------------------------------------------------------------

interface FilterBannerProps {
  label: string;
  value: string;
  onDismiss: () => void;
}

function FilterBanner({ label, value, onDismiss }: FilterBannerProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-mf-accent/10 border border-mf-accent/20 text-sm">
      <span className="text-muted-foreground">
        Showing commissions for {label}:
      </span>
      <span className="font-medium text-foreground">{value}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-1 p-0.5 rounded-sm hover:bg-mf-accent/20 transition-colors"
        aria-label={`Clear ${label} filter`}
      >
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Client-side grouping helpers
// ---------------------------------------------------------------------------

function groupByCategory(data: CommissionSummary[]): GroupedSummaryRow[] {
  const groups = new Map<string, GroupedSummaryRow>();

  for (const row of data) {
    const key = `${row.share_category_code}|${row.currency}|${row.period_start}|${row.period_end}`;
    const existing = groups.get(key);
    if (existing) {
      existing.total_incoming += parseFloat(row.total_incoming) || 0;
      existing.total_outgoing += parseFloat(row.total_outgoing) || 0;
      existing.net_commission += parseFloat(row.net_commission) || 0;
    } else {
      groups.set(key, {
        key,
        label: row.share_category_code,
        currency: row.currency,
        period_start: row.period_start,
        period_end: row.period_end,
        total_incoming: parseFloat(row.total_incoming) || 0,
        total_outgoing: parseFloat(row.total_outgoing) || 0,
        net_commission: parseFloat(row.net_commission) || 0,
      });
    }
  }

  return Array.from(groups.values());
}

function groupByDealType(data: CommissionSummary[]): GroupedSummaryRow[] {
  const groups = new Map<string, GroupedSummaryRow>();

  for (const row of data) {
    const key = `${row.deal_type}|${row.currency}|${row.period_start}|${row.period_end}`;
    const existing = groups.get(key);
    if (existing) {
      existing.total_incoming += parseFloat(row.total_incoming) || 0;
      existing.total_outgoing += parseFloat(row.total_outgoing) || 0;
      existing.net_commission += parseFloat(row.net_commission) || 0;
    } else {
      groups.set(key, {
        key,
        label: dealTypeLabel(row.deal_type),
        currency: row.currency,
        period_start: row.period_start,
        period_end: row.period_end,
        total_incoming: parseFloat(row.total_incoming) || 0,
        total_outgoing: parseFloat(row.total_outgoing) || 0,
        net_commission: parseFloat(row.net_commission) || 0,
      });
    }
  }

  return Array.from(groups.values());
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 50;

export function CommissionSummaryPage() {
  const navigate = useSafeNavigate();
  const search = useSafeSearch();

  // Initialize dimension from URL
  const [dimension, setDimension] = useState<SummaryDimension>(
    () => (search.dimension as SummaryDimension) || 'contact'
  );

  // Deep-link entity filter state
  const [deepLinkContactId, setDeepLinkContactId] = useState<string | undefined>(
    search.contactId
  );
  const [deepLinkGAId, setDeepLinkGAId] = useState<string | undefined>(
    search.gamingAccountId
  );
  const [deepLinkBrandId, setDeepLinkBrandId] = useState<string | undefined>(
    search.brandId
  );

  // Filters state
  const [filters, setFilters] = useState<SummaryFiltersType>(() => ({
    contact_id: search.contactId || undefined,
    gaming_account_id: search.gamingAccountId || undefined,
    brand_id: search.brandId || undefined,
    period_start: search.periodStart || undefined,
    period_end: search.periodEnd || undefined,
    currency: search.currency || undefined,
    page: 1,
    limit: DEFAULT_LIMIT,
  }));

  // Determine which hooks to enable based on dimension
  const isContactDim = dimension === 'contact' || dimension === 'category' || dimension === 'deal_type';
  const isGADim = dimension === 'ga';
  const isBrandDim = dimension === 'brand';

  // Fetch data per dimension
  const contactQuery = useCommissionSummaries(filters, { enabled: isContactDim });
  const gaQuery = useCommissionSummariesByGA(filters, { enabled: isGADim });
  const brandQuery = useCommissionSummariesByBrand(filters, { enabled: isBrandDim });

  // Active query based on dimension
  const activeQuery = isContactDim ? contactQuery : isGADim ? gaQuery : brandQuery;

  // Client-side grouped data for category/deal_type dimensions
  const groupedData = useMemo(() => {
    if (dimension === 'category' && contactQuery.data?.data) {
      return groupByCategory(contactQuery.data.data);
    }
    if (dimension === 'deal_type' && contactQuery.data?.data) {
      return groupByDealType(contactQuery.data.data);
    }
    return [];
  }, [dimension, contactQuery.data]);

  // Table data — use grouped data for category/deal_type, raw data otherwise
  const tableData = useMemo(() => {
    if (dimension === 'category' || dimension === 'deal_type') {
      return groupedData;
    }
    return activeQuery.data?.data ?? [];
  }, [dimension, groupedData, activeQuery.data]);

  const handleFiltersChange = useCallback((newFilters: SummaryFiltersType) => {
    setFilters(newFilters);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleDimensionChange = useCallback(
    (newDim: SummaryDimension) => {
      setDimension(newDim);
      // Reset page when changing dimension
      setFilters((prev) => ({ ...prev, page: 1 }));
    },
    []
  );

  // Row click handlers — navigate to Results tab with pre-filter
  const handleContactClick = useCallback(
    (row: CommissionSummary) => {
      navigate({
        to: '/revenue/commissions/results',
        search: { contactId: row.contact_id },
      });
    },
    [navigate]
  );

  const handleGAClick = useCallback(
    (row: CommissionSummaryByGA) => {
      navigate({
        to: '/revenue/commissions/results',
        search: { gamingAccountId: row.gaming_account_id },
      });
    },
    [navigate]
  );

  const handleBrandClick = useCallback(
    (row: CommissionSummaryByBrand) => {
      navigate({
        to: '/revenue/commissions/results',
        search: { brandId: row.brand_id },
      });
    },
    [navigate]
  );

  // Dismiss deep-link filter
  const dismissDeepLink = useCallback(
    (type: 'contact' | 'ga' | 'brand') => {
      if (type === 'contact') {
        setDeepLinkContactId(undefined);
        setFilters((prev) => ({ ...prev, contact_id: undefined, page: 1 }));
      } else if (type === 'ga') {
        setDeepLinkGAId(undefined);
        setFilters((prev) => ({ ...prev, gaming_account_id: undefined, page: 1 }));
      } else {
        setDeepLinkBrandId(undefined);
        setFilters((prev) => ({ ...prev, brand_id: undefined, page: 1 }));
      }
    },
    []
  );

  // Determine loading/error state
  const isLoading = activeQuery.isLoading;
  const error = activeQuery.error;
  const isEmpty = !isLoading && !error && tableData.length === 0;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold text-foreground">
            Commission Summaries
          </h1>
        </div>

        {/* Dimension picker */}
        <div className="mb-4">
          <DimensionPicker value={dimension} onChange={handleDimensionChange} />
        </div>

        {/* Deep-link filter banners */}
        <div className="space-y-2 mb-4">
          {deepLinkContactId && dimension === 'contact' && (
            <FilterBanner
              label="Contact"
              value={deepLinkContactId}
              onDismiss={() => dismissDeepLink('contact')}
            />
          )}
          {deepLinkGAId && dimension === 'ga' && (
            <FilterBanner
              label="Gaming Account"
              value={deepLinkGAId}
              onDismiss={() => dismissDeepLink('ga')}
            />
          )}
          {deepLinkBrandId && dimension === 'brand' && (
            <FilterBanner
              label="Brand"
              value={deepLinkBrandId}
              onDismiss={() => dismissDeepLink('brand')}
            />
          )}
        </div>

        {/* Filters */}
        <div className="mb-4">
          <SummaryFilters
            dimension={dimension}
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
            message="Could not load commission summaries. Please try again."
            onRetry={() => activeQuery.refetch()}
          />
        ) : isEmpty ? (
          <EmptyState />
        ) : (
          <SummaryTable
            dimension={dimension}
            data={tableData}
            meta={activeQuery.data?.meta}
            currentPage={filters.page ?? 1}
            onPageChange={handlePageChange}
            onContactClick={handleContactClick}
            onGAClick={handleGAClick}
            onBrandClick={handleBrandClick}
          />
        )}
      </div>
    </div>
  );
}
