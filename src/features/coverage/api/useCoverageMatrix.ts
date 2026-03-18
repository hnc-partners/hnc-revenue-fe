/**
 * useCoverageMatrix.ts
 *
 * TanStack Query hook for fetching coverage matrix data.
 * GET /batches/coverage — requires periodStartGte, periodStartLte.
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type {
  CoverageBrandRow,
  CoverageQueryParams,
  CoverageResponse,
} from '../types';

/** Query key factory for coverage matrix */
export const coverageMatrixQueryKey = (params: CoverageQueryParams) =>
  ['revenue', 'coverage', 'matrix', params] as const;

/**
 * Fetch coverage matrix data for a date range.
 */
async function fetchCoverageMatrix(
  params: CoverageQueryParams
): Promise<CoverageBrandRow[]> {
  const qs = new URLSearchParams();
  qs.set('periodStartGte', params.periodStartGte);
  qs.set('periodStartLte', params.periodStartLte);

  const response = await apiFetch<CoverageResponse>(
    `${REVENUE_API_URL}/batches/coverage?${qs.toString()}`
  );
  return response.data;
}

/**
 * Hook for fetching coverage matrix.
 * Only enabled when params are provided (user must click "Load Coverage").
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useCoverageMatrix(
 *   { periodStartGte: '2026-01-01', periodStartLte: '2026-03-17' },
 *   { enabled: hasLoadedCoverage }
 * );
 * ```
 */
export function useCoverageMatrix(
  params: CoverageQueryParams | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: coverageMatrixQueryKey(params ?? { periodStartGte: '', periodStartLte: '' }),
    queryFn: () => fetchCoverageMatrix(params!),
    enabled: !!params && options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
