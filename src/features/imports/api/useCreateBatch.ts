/**
 * useCreateBatch.ts
 *
 * TanStack Query mutation hook for creating a new import batch.
 * POST /batches with { brandId, periodStart, periodEnd, periodGranularity }
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type {
  CreateBatchPayload,
  CreateBatchResponse,
  ImportBatch,
} from '../types';

/**
 * Create a new import batch.
 * POST /batches
 */
async function createBatch(payload: CreateBatchPayload): Promise<ImportBatch> {
  const response = await apiFetch<CreateBatchResponse>(
    `${REVENUE_API_URL}/batches`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return response.data;
}

/**
 * Mutation hook for creating a new import batch.
 *
 * On success:
 * - Invalidates import batches queries so the list refreshes
 *
 * @example
 * ```tsx
 * const create = useCreateBatch();
 * create.mutate({ brandId: '...', periodStart: '2024-01-01', periodEnd: '2024-01-31', periodGranularity: 'monthly' });
 * ```
 */
export function useCreateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBatchPayload) => createBatch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['revenue', 'imports', 'batches'],
      });
    },
  });
}
