/**
 * CommissionResultFilters.tsx
 *
 * Filter bar for commission results. Provides dropdowns and inputs
 * for filtering by batch, contact, gaming account, direction,
 * share type, share category, deal type, and period range.
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
import type {
  CommissionResultFilters as FilterType,
  CommissionDirection,
  CommissionDealType,
} from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIRECTION_OPTIONS: { value: CommissionDirection; label: string }[] = [
  { value: 'incoming', label: 'Incoming' },
  { value: 'outgoing', label: 'Outgoing' },
];

const DEAL_TYPE_OPTIONS: { value: CommissionDealType; label: string }[] = [
  { value: 'master_agent', label: 'Master Agent' },
  { value: 'player', label: 'Player' },
  { value: 'sub_agent', label: 'Sub-Agent' },
  { value: 'referrer', label: 'Referrer' },
];

const SHARE_CATEGORY_OPTIONS = [
  { value: 'POKER', label: 'Poker' },
  { value: 'CASINO', label: 'Casino' },
  { value: 'SPORTS', label: 'Sports' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CommissionResultFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommissionResultFilters({
  filters,
  onFiltersChange,
}: CommissionResultFiltersProps) {
  const updateFilter = useCallback(
    (key: keyof FilterType, value: string | undefined) => {
      onFiltersChange({
        ...filters,
        [key]: value || undefined,
        // Reset page when filters change
        page: key !== 'page' ? 1 : filters.page,
      });
    },
    [filters, onFiltersChange]
  );

  const hasActiveFilters =
    filters.batch_id ||
    filters.contact_id ||
    filters.gaming_account_id ||
    filters.direction ||
    filters.share_type ||
    filters.share_category_code ||
    filters.deal_type ||
    filters.period_start ||
    filters.period_end;

  const clearFilters = useCallback(() => {
    onFiltersChange({
      status: 'active',
      page: 1,
      limit: filters.limit,
    });
  }, [filters.limit, onFiltersChange]);

  return (
    <div className="space-y-3">
      {/* Row 1: Search inputs */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Batch ID */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Batch ID..."
            value={filters.batch_id ?? ''}
            onChange={(e) => updateFilter('batch_id', e.target.value)}
            className="h-8 w-[160px] pl-8 text-sm rounded-md"
            aria-label="Filter by batch ID"
          />
        </div>

        {/* Contact */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Contact..."
            value={filters.contact_id ?? ''}
            onChange={(e) => updateFilter('contact_id', e.target.value)}
            className="h-8 w-[160px] pl-8 text-sm rounded-md"
            aria-label="Filter by contact"
          />
        </div>

        {/* Gaming Account */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Gaming account..."
            value={filters.gaming_account_id ?? ''}
            onChange={(e) => updateFilter('gaming_account_id', e.target.value)}
            className="h-8 w-[160px] pl-8 text-sm rounded-md"
            aria-label="Filter by gaming account"
          />
        </div>

        {/* Share Type */}
        <Input
          type="text"
          placeholder="Share type..."
          value={filters.share_type ?? ''}
          onChange={(e) => updateFilter('share_type', e.target.value)}
          className="h-8 w-[140px] text-sm rounded-md"
          aria-label="Filter by share type"
        />
      </div>

      {/* Row 2: Enum filters + date range */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Direction */}
        <Select
          value={filters.direction ?? ''}
          onValueChange={(val) =>
            updateFilter('direction', val === 'all' ? undefined : val)
          }
        >
          <SelectTrigger className="h-8 w-[130px] rounded-md text-sm">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Directions</SelectItem>
            {DIRECTION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Share Category */}
        <Select
          value={filters.share_category_code ?? ''}
          onValueChange={(val) =>
            updateFilter('share_category_code', val === 'all' ? undefined : val)
          }
        >
          <SelectTrigger className="h-8 w-[140px] rounded-md text-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {SHARE_CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Deal Type */}
        <Select
          value={filters.deal_type ?? ''}
          onValueChange={(val) =>
            updateFilter('deal_type', val === 'all' ? undefined : val)
          }
        >
          <SelectTrigger className="h-8 w-[150px] rounded-md text-sm">
            <SelectValue placeholder="Deal Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Deal Types</SelectItem>
            {DEAL_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Period date range */}
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
    </div>
  );
}
