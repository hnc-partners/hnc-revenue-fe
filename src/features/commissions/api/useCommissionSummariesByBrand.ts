/**
 * useCommissionSummariesByBrand.ts
 *
 * TanStack Query hook for fetching commission summaries by Brand.
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type {
  CollectionResponse,
  CommissionSummaryByBrand,
  SummaryFilters,
} from '../types';

/** Query key factory for brand summaries */
export const commissionSummariesByBrandQueryKey = (filters: SummaryFilters) =>
  ['revenue', 'commissions', 'summaries', 'by-brand', filters] as const;

/**
 * Build query string from summary filter params.
 */
function buildQueryString(filters: SummaryFilters): string {
  const params = new URLSearchParams();

  if (filters.brand_id) params.set('brand_id', filters.brand_id);
  if (filters.period_start) params.set('period_start', filters.period_start);
  if (filters.period_end) params.set('period_end', filters.period_end);
  if (filters.currency) params.set('currency', filters.currency);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Fetch commission summaries by brand.
 */
async function fetchSummariesByBrand(
  filters: SummaryFilters
): Promise<CollectionResponse<CommissionSummaryByBrand>> {
  const queryString = buildQueryString(filters);
  return apiFetch<CollectionResponse<CommissionSummaryByBrand>>(
    `${REVENUE_API_URL}/commissions/summaries/by-brand${queryString}`
  );
}

/**
 * Hook for fetching commission summaries by Brand.
 */
export function useCommissionSummariesByBrand(
  filters: SummaryFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: commissionSummariesByBrandQueryKey(filters),
    queryFn: () => fetchSummariesByBrand(filters),
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 2,
  });
}
