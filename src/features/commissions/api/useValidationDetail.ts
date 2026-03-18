/**
 * useValidationDetail.ts
 *
 * TanStack Query hooks for fetching and triggering per-batch validation detail.
 * - useValidationDetail: Fetches existing validation results for a batch
 * - useRunValidation: Triggers a new validation run for a batch
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type { ValidationDetailResponse } from '../types';
import { validationOverviewQueryKey } from './useValidationOverview';

/** Query key factory for validation detail */
export const validationDetailQueryKey = (batchId: string) =>
  ['revenue', 'commissions', 'validation', 'detail', batchId] as const;

/**
 * Fetch validation detail for a specific batch.
 * GET /commissions/validate/:batchId
 */
async function fetchValidationDetail(
  batchId: string
): Promise<ValidationDetailResponse> {
  return apiFetch<ValidationDetailResponse>(
    `${REVENUE_API_URL}/commissions/validate/${batchId}`
  );
}

/**
 * Hook for fetching per-batch validation detail.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useValidationDetail(batchId);
 * ```
 */
export function useValidationDetail(batchId: string) {
  return useQuery({
    queryKey: validationDetailQueryKey(batchId),
    queryFn: () => fetchValidationDetail(batchId),
    enabled: !!batchId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Mutation hook to trigger a validation run for a batch.
 * Calls the same endpoint (GET /commissions/validate/:batchId)
 * which performs validation and returns results.
 * Invalidates both detail and overview queries on success.
 */
export function useRunValidation(batchId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => fetchValidationDetail(batchId),
    onSuccess: (data) => {
      // Update the detail cache with fresh results
      queryClient.setQueryData(validationDetailQueryKey(batchId), data);
      // Invalidate overview so it shows fresh match rates
      queryClient.invalidateQueries({
        queryKey: validationOverviewQueryKey({}),
      });
    },
  });
}
