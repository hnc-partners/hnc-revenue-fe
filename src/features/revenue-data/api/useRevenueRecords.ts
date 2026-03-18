/**
 * useRevenueRecords.ts
 *
 * TanStack Query hook for fetching paginated revenue records.
 * GET /revenue — supports server-side filtering and pagination.
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type {
  PaginatedResponse,
  PlayerRevenue,
  RevenueQueryParams,
} from '../types';

/** Query key factory for revenue records */
export const revenueRecordsQueryKey = (params: RevenueQueryParams) =>
  ['revenue', 'data', 'records', params] as const;

/**
 * Build query string from params, omitting undefined/empty values.
 */
function buildQueryString(params: RevenueQueryParams): string {
  const qs = new URLSearchParams();

  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.brandId) qs.set('brandId', params.brandId);
  if (params.batchId) qs.set('batchId', params.batchId);
  if (params.gamingAccountId) qs.set('gamingAccountId', params.gamingAccountId);
  if (params.periodStartGte) qs.set('periodStartGte', params.periodStartGte);
  if (params.periodStartLte) qs.set('periodStartLte', params.periodStartLte);

  const str = qs.toString();
  return str ? `?${str}` : '';
}

/**
 * Fetch paginated revenue records with filters.
 */
async function fetchRevenueRecords(
  params: RevenueQueryParams
): Promise<PaginatedResponse<PlayerRevenue>> {
  const queryString = buildQueryString(params);
  return apiFetch<PaginatedResponse<PlayerRevenue>>(
    `${REVENUE_API_URL}/revenue${queryString}`
  );
}

/**
 * Hook for fetching paginated, filtered revenue records.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useRevenueRecords({
 *   brandId: 'brand-uuid',
 *   page: 1,
 *   limit: 50,
 * });
 * ```
 */
export function useRevenueRecords(params: RevenueQueryParams) {
  return useQuery({
    queryKey: revenueRecordsQueryKey(params),
    queryFn: () => fetchRevenueRecords(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
