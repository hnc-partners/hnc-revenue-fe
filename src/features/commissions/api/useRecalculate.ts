/**
 * useRecalculate.ts
 *
 * TanStack Query mutation hook for triggering commission recalculation.
 * POST /commissions/recalculate with { batch_id }
 *
 * On success, invalidates commission results and validation queries
 * so dependent views refresh automatically.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type { RecalculationResult } from '../types';

/**
 * Trigger recalculation for a batch.
 * POST /commissions/recalculate
 */
async function recalculateBatch(
  batchId: string
): Promise<RecalculationResult> {
  return apiFetch<RecalculationResult>(
    `${REVENUE_API_URL}/commissions/recalculate`,
    {
      method: 'POST',
      body: JSON.stringify({ batch_id: batchId }),
    }
  );
}

/**
 * Mutation hook for triggering commission recalculation on a batch.
 *
 * On success:
 * - Invalidates commission results queries (results may have changed)
 * - Invalidates commission summaries queries
 * - Invalidates validation queries (validation may be stale)
 *
 * @example
 * ```tsx
 * const recalculate = useRecalculate();
 * recalculate.mutate('batch-uuid-123');
 * ```
 */
export function useRecalculate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (batchId: string) => recalculateBatch(batchId),
    onSuccess: () => {
      // Invalidate all commission-related queries so views refresh
      queryClient.invalidateQueries({
        queryKey: ['revenue', 'commissions', 'results'],
      });
      queryClient.invalidateQueries({
        queryKey: ['revenue', 'commissions', 'summaries'],
      });
      queryClient.invalidateQueries({
        queryKey: ['revenue', 'commissions', 'validation'],
      });
    },
  });
}
