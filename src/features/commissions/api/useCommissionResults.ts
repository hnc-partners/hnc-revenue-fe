/**
 * useCommissionResults.ts
 *
 * TanStack Query hook for fetching paginated commission results.
 * Supports server-side filtering, pagination, and sorting.
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type {
  CollectionResponse,
  CommissionResult,
  CommissionResultFilters,
} from '../types';

/** Query key factory for commission results */
export const commissionResultsQueryKey = (filters: CommissionResultFilters) =>
  ['revenue', 'commissions', 'results', filters] as const;

/**
 * Build query string from filter params, omitting undefined/empty values.
 */
function buildQueryString(filters: CommissionResultFilters): string {
  const params = new URLSearchParams();

  if (filters.batch_id) params.set('batch_id', filters.batch_id);
  if (filters.contact_id) params.set('contact_id', filters.contact_id);
  if (filters.gaming_account_id)
    params.set('gaming_account_id', filters.gaming_account_id);
  if (filters.direction) params.set('direction', filters.direction);
  if (filters.share_type) params.set('share_type', filters.share_type);
  if (filters.share_category_code)
    params.set('share_category_code', filters.share_category_code);
  if (filters.deal_type) params.set('deal_type', filters.deal_type);
  if (filters.period_start) params.set('period_start', filters.period_start);
  if (filters.period_end) params.set('period_end', filters.period_end);
  if (filters.status) params.set('status', filters.status);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.sort_by) params.set('sort_by', filters.sort_by);
  if (filters.sort_order) params.set('sort_order', filters.sort_order);

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Fetch paginated commission results with filters.
 */
async function fetchCommissionResults(
  filters: CommissionResultFilters
): Promise<CollectionResponse<CommissionResult>> {
  const queryString = buildQueryString(filters);
  return apiFetch<CollectionResponse<CommissionResult>>(
    `${REVENUE_API_URL}/commissions/results${queryString}`
  );
}

/**
 * Hook for fetching paginated, filtered commission results.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCommissionResults({
 *   direction: 'incoming',
 *   page: 1,
 *   limit: 25,
 *   status: 'active',
 * });
 * ```
 */
export function useCommissionResults(filters: CommissionResultFilters) {
  return useQuery({
    queryKey: commissionResultsQueryKey(filters),
    queryFn: () => fetchCommissionResults(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
