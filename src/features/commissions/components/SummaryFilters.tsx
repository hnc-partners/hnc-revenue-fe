/**
 * SummaryFilters.tsx
 *
 * Dimension-aware filter bar for the Commission Summary page.
 * Common filters: period range, currency.
 * Dimension-specific: contact search, GA search, brand select.
 */

import { useCallback } from 'react';
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
} from '@hnc-partners/ui-components';
import { Search, X, Calendar } from 'lucide-react';
import type { SummaryDimension, SummaryFilters as SummaryFiltersType } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SummaryFiltersProps {
  dimension: SummaryDimension;
  filters: SummaryFiltersType;
  onFiltersChange: (filters: SummaryFiltersType) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SummaryFilters({
  dimension,
  filters,
  onFiltersChange,
}: SummaryFiltersProps) {
  const updateFilter = useCallback(
    (key: keyof SummaryFiltersType, value: string | undefined) => {
      onFiltersChange({
        ...filters,
        [key]: value || undefined,
        page: key !== 'page' ? 1 : filters.page,
      });
    },
    [filters, onFiltersChange]
  );

  const hasActiveFilters =
    filters.contact_id ||
    filters.gaming_account_id ||
    filters.brand_id ||
    filters.period_start ||
    filters.period_end ||
    filters.currency;

  const clearFilters = useCallback(() => {
    onFiltersChange({
      page: 1,
      limit: filters.limit,
    });
  }, [filters.limit, onFiltersChange]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Dimension-specific search */}
      {dimension === 'contact' && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Contact..."
            value={filters.contact_id ?? ''}
            onChange={(e) => updateFilter('contact_id', e.target.value)}
            className="h-8 w-[180px] pl-8 text-sm rounded-md"
            aria-label="Filter by contact"
          />
        </div>
      )}

      {dimension === 'ga' && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Gaming account..."
            value={filters.gaming_account_id ?? ''}
            onChange={(e) => updateFilter('gaming_account_id', e.target.value)}
            className="h-8 w-[180px] pl-8 text-sm rounded-md"
            aria-label="Filter by gaming account"
          />
        </div>
      )}

      {dimension === 'brand' && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Brand..."
            value={filters.brand_id ?? ''}
            onChange={(e) => updateFilter('brand_id', e.target.value)}
            className="h-8 w-[180px] pl-8 text-sm rounded-md"
            aria-label="Filter by brand"
          />
        </div>
      )}

      {/* Currency filter (all dimensions) */}
      <Select
        value={filters.currency ?? ''}
        onValueChange={(val) =>
          updateFilter('currency', val === 'all' ? undefined : val)
        }
      >
        <SelectTrigger className="h-8 w-[110px] rounded-md text-sm">
          <SelectValue placeholder="Currency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {CURRENCY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Period date range (all dimensions) */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Input
          type="date"
          value={filters.period_start ?? ''}
          onChange={(e) => updateFilter('period_start', e.target.value)}
          className="h-8 w-[140px] text-sm rounded-md"
          aria-label="Period start date"
        />
        <span className="text-sm text-muted-foreground">to</span>
        <Input
          type="date"
          value={filters.period_end ?? ''}
          onChange={(e) => updateFilter('period_end', e.target.value)}
          className="h-8 w-[140px] text-sm rounded-md"
          aria-label="Period end date"
        />
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8 text-sm text-muted-foreground"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
