/**
 * useCommissionResult.ts
 *
 * TanStack Query hook for fetching a single commission result with audit detail.
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type { SingleResponse, CommissionResultDetail } from '../types';

/** Query key factory for a single commission result */
export const commissionResultQueryKey = (id: string) =>
  ['revenue', 'commissions', 'results', id] as const;

/**
 * Fetch a single commission result with audit detail.
 */
async function fetchCommissionResult(
  id: string
): Promise<CommissionResultDetail> {
  const response = await apiFetch<SingleResponse<CommissionResultDetail>>(
    `${REVENUE_API_URL}/commissions/results/${encodeURIComponent(id)}`
  );
  return response.data;
}

/**
 * Hook for fetching a single commission result with audit trail.
 *
 * @param id - Commission result ID
 * @param options - Additional options
 *
 * @example
 * ```tsx
 * const { data: result, isLoading } = useCommissionResult(resultId, {
 *   enabled: !!resultId,
 * });
 * ```
 */
export function useCommissionResult(
  id: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: commissionResultQueryKey(id),
    queryFn: () => fetchCommissionResult(id),
    enabled: options?.enabled ?? !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes — detail data changes less frequently
  });
}
