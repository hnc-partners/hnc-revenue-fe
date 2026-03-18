/**
 * useRevenueRecord.ts
 *
 * TanStack Query hook for fetching a single revenue record.
 * GET /revenue/:id — includes nested amounts[] and extras.
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type { SingleResponse, PlayerRevenue } from '../types';

/** Query key factory for a single revenue record */
export const revenueRecordQueryKey = (id: string) =>
  ['revenue', 'data', 'record', id] as const;

/**
 * Fetch a single revenue record by ID.
 */
async function fetchRevenueRecord(
  id: string
): Promise<SingleResponse<PlayerRevenue>> {
  return apiFetch<SingleResponse<PlayerRevenue>>(
    `${REVENUE_API_URL}/revenue/${id}`
  );
}

/**
 * Hook for fetching a single revenue record by ID.
 *
 * @example
 * ```tsx
 * const { data } = useRevenueRecord('record-uuid');
 * ```
 */
export function useRevenueRecord(id: string) {
  return useQuery({
    queryKey: revenueRecordQueryKey(id),
    queryFn: () => fetchRevenueRecord(id),
    staleTime: 1000 * 60 * 2,
    enabled: !!id,
  });
}
