/**
 * usePurgeBatch.ts
 *
 * TanStack Query mutation hook for purging a rolled-back import batch.
 * DELETE /batches/:id/purge
 *
 * On success, invalidates import batches queries so the list refreshes.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';

/**
 * Purge a rolled-back batch.
 * DELETE /batches/:id/purge
 */
async function purgeBatch(batchId: string): Promise<void> {
  return apiFetch<void>(
    `${REVENUE_API_URL}/batches/${batchId}/purge`,
    { method: 'DELETE' }
  );
}

/**
 * Mutation hook for purging a rolled-back import batch.
 *
 * On success:
 * - Invalidates import batches queries so list refreshes
 *
 * @example
 * ```tsx
 * const purge = usePurgeBatch();
 * purge.mutate('batch-uuid-123');
 * ```
 */
export function usePurgeBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (batchId: string) => purgeBatch(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['revenue', 'imports', 'batches'],
      });
    },
  });
}
