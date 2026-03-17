/**
 * useGaps.ts
 *
 * TanStack Query hook for fetching gap detection results.
 * Gaps are computed on the fly by the API — may take a moment.
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REPORT_MANAGEMENT_API_URL } from '@/features/revenue/api/config';
import type { RMGapResult, RMGapQueryParams } from '../types/gaps';

/** Query key for gap detection */
export const gapsQueryKey = ['report-management', 'gaps'] as const;

/**
 * Build query key including filter params for cache differentiation.
 */
function buildGapsQueryKey(params: RMGapQueryParams) {
  return [...gapsQueryKey, params] as const;
}

/**
 * Fetch gap detection results from the API.
 */
async function fetchGaps(params: RMGapQueryParams): Promise<RMGapResult[]> {
  const searchParams = new URLSearchParams();

  if (params.brandCode) {
    searchParams.set('brandCode', params.brandCode);
  }
  if (params.startDate) {
    searchParams.set('startDate', params.startDate);
  }
  if (params.endDate) {
    searchParams.set('endDate', params.endDate);
  }

  const queryString = searchParams.toString();
  const url = `${REPORT_MANAGEMENT_API_URL}/gaps${queryString ? `?${queryString}` : ''}`;

  const res = await apiFetch<{ data: RMGapResult[] }>(url);
  return res.data;
}

/**
 * Hook for fetching gap detection results.
 *
 * Gap detection is computed on the fly, so staleTime is kept short.
 *
 * @param params - Optional query parameters (brandCode, startDate, endDate)
 * @param enabled - Whether the query is enabled (default: true)
 *
 * @example
 * ```tsx
 * const { data: gaps, isLoading } = useGaps({ startDate: '2026-01-01', endDate: '2026-03-31' });
 * ```
 */
export function useGaps(params: RMGapQueryParams = {}, enabled = true) {
  return useQuery({
    queryKey: buildGapsQueryKey(params),
    queryFn: () => fetchGaps(params),
    enabled,
    staleTime: 1000 * 60, // 1 minute — gaps are computed, avoid frequent refetch
  });
}
