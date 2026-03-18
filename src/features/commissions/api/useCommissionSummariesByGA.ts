/**
 * useCommissionSummariesByGA.ts
 *
 * TanStack Query hook for fetching commission summaries by Gaming Account.
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type {
  CollectionResponse,
  CommissionSummaryByGA,
  SummaryFilters,
} from '../types';

/** Query key factory for GA summaries */
export const commissionSummariesByGAQueryKey = (filters: SummaryFilters) =>
  ['revenue', 'commissions', 'summaries', 'by-ga', filters] as const;

/**
 * Build query string from summary filter params.
 */
function buildQueryString(filters: SummaryFilters): string {
  const params = new URLSearchParams();

  if (filters.gaming_account_id)
    params.set('gaming_account_id', filters.gaming_account_id);
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
 * Fetch commission summaries by gaming account.
 */
async function fetchSummariesByGA(
  filters: SummaryFilters
): Promise<CollectionResponse<CommissionSummaryByGA>> {
  const queryString = buildQueryString(filters);
  return apiFetch<CollectionResponse<CommissionSummaryByGA>>(
    `${REVENUE_API_URL}/commissions/summaries/by-ga${queryString}`
  );
}

/**
 * Hook for fetching commission summaries by Gaming Account.
 */
export function useCommissionSummariesByGA(
  filters: SummaryFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: commissionSummariesByGAQueryKey(filters),
    queryFn: () => fetchSummariesByGA(filters),
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 2,
  });
}
