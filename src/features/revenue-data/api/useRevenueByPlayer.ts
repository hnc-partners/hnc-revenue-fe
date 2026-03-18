/**
 * useRevenueByPlayer.ts
 *
 * TanStack Query hook for fetching all revenue records for a single player.
 * GET /revenue/by-player/:gamingAccountId — paginated, sorted DESC.
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type {
  PaginatedResponse,
  PlayerRevenue,
  ByPlayerQueryParams,
} from '../types';

/** Query key factory for by-player revenue */
export const revenueByPlayerQueryKey = (
  gamingAccountId: string,
  params: ByPlayerQueryParams
) => ['revenue', 'data', 'by-player', gamingAccountId, params] as const;

/**
 * Build query string from params.
 */
function buildQueryString(params: ByPlayerQueryParams): string {
  const qs = new URLSearchParams();

  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.periodStartGte) qs.set('periodStartGte', params.periodStartGte);
  if (params.periodStartLte) qs.set('periodStartLte', params.periodStartLte);

  const str = qs.toString();
  return str ? `?${str}` : '';
}

/**
 * Fetch all revenue for one player.
 */
async function fetchRevenueByPlayer(
  gamingAccountId: string,
  params: ByPlayerQueryParams
): Promise<PaginatedResponse<PlayerRevenue>> {
  const queryString = buildQueryString(params);
  return apiFetch<PaginatedResponse<PlayerRevenue>>(
    `${REVENUE_API_URL}/revenue/by-player/${gamingAccountId}${queryString}`
  );
}

/**
 * Hook for fetching all revenue for a single player.
 *
 * @example
 * ```tsx
 * const { data } = useRevenueByPlayer('gaming-account-uuid', { page: 1, limit: 50 });
 * ```
 */
export function useRevenueByPlayer(
  gamingAccountId: string,
  params: ByPlayerQueryParams
) {
  return useQuery({
    queryKey: revenueByPlayerQueryKey(gamingAccountId, params),
    queryFn: () => fetchRevenueByPlayer(gamingAccountId, params),
    staleTime: 1000 * 60 * 2,
    enabled: !!gamingAccountId,
  });
}
