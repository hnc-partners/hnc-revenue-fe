/**
 * useRollbackBatch.ts
 *
 * TanStack Query mutation hook for rolling back a processed import batch.
 * DELETE /batches/:id — soft-deletes batch, hard-deletes revenue records.
 *
 * On success, invalidates import batch queries so data refreshes.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type { RollbackResult } from '../types';

/**
 * Rollback a processed batch.
 * DELETE /batches/:id
 */
async function rollbackBatch(batchId: string): Promise<RollbackResult> {
  return apiFetch<RollbackResult>(
    `${REVENUE_API_URL}/batches/${batchId}`,
    { method: 'DELETE' }
  );
}

/**
 * Mutation hook for rolling back a processed import batch.
 *
 * On success:
 * - Invalidates import batch queries
 * - Invalidates batch list queries
 *
 * @example
 * ```tsx
 * const rollback = useRollbackBatch();
 * rollback.mutate('batch-uuid-123');
 * ```
 */
export function useRollbackBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (batchId: string) => rollbackBatch(batchId),
    onSuccess: (_data, batchId) => {
      queryClient.invalidateQueries({
        queryKey: ['revenue', 'imports', 'batch', batchId],
      });
      queryClient.invalidateQueries({
        queryKey: ['revenue', 'imports', 'batches'],
      });
    },
  });
}
