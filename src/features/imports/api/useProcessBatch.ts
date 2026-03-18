/**
 * useProcessBatch.ts
 *
 * TanStack Query mutation hook for triggering batch processing.
 * POST /batches/:id/process
 *
 * Processing can take ~30s for large batches (e.g. GGPoker).
 * No timeout is set — the mutation waits for completion.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type { ProcessBatchResponse, ProcessingResult } from '../types';

/**
 * Trigger processing for a batch.
 * POST /batches/:id/process
 */
async function processBatch(batchId: string): Promise<ProcessingResult> {
  const response = await apiFetch<ProcessBatchResponse>(
    `${REVENUE_API_URL}/batches/${batchId}/process`,
    { method: 'POST' }
  );
  return response.data;
}

/**
 * Mutation hook for triggering batch processing.
 *
 * On success:
 * - Invalidates import batches queries (batch status changed)
 *
 * @example
 * ```tsx
 * const process = useProcessBatch();
 * process.mutate('batch-uuid-123');
 * ```
 */
export function useProcessBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (batchId: string) => processBatch(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['revenue', 'imports', 'batches'],
      });
    },
  });
}
