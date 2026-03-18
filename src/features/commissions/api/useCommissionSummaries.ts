/**
 * useCommissionSummaries.ts
 *
 * TanStack Query hook for fetching commission summaries (By Contact dimension).
 * Also used for client-side grouping into By Category and By Deal Type.
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type {
  CollectionResponse,
  CommissionSummary,
  SummaryFilters,
} from '../types';

/** Query key factory for commission summaries */
export const commissionSummariesQueryKey = (filters: SummaryFilters) =>
  ['revenue', 'commissions', 'summaries', filters] as const;

/**
 * Build query string from summary filter params.
 */
function buildQueryString(filters: SummaryFilters): string {
  const params = new URLSearchParams();

  if (filters.contact_id) params.set('contact_id', filters.contact_id);
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
 * Fetch commission summaries with filters.
 */
async function fetchCommissionSummaries(
  filters: SummaryFilters
): Promise<CollectionResponse<CommissionSummary>> {
  const queryString = buildQueryString(filters);
  return apiFetch<CollectionResponse<CommissionSummary>>(
    `${REVENUE_API_URL}/commissions/summaries${queryString}`
  );
}

/**
 * Hook for fetching commission summaries (By Contact).
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useCommissionSummaries({
 *   period_start: '2026-02-01',
 *   currency: 'USD',
 *   page: 1,
 *   limit: 50,
 * });
 * ```
 */
export function useCommissionSummaries(
  filters: SummaryFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: commissionSummariesQueryKey(filters),
    queryFn: () => fetchCommissionSummaries(filters),
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 2,
  });
}
