/**
 * useImportBatch.ts
 *
 * TanStack Query hook for fetching a single import batch by ID.
 * GET /batches/:id (includes nested files[])
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type { ImportBatchDetailResponse } from '../types';

/** Query key factory for a single import batch */
export const importBatchQueryKey = (batchId: string) =>
  ['revenue', 'imports', 'batch', batchId] as const;

/**
 * Fetch a single import batch with nested files.
 */
async function fetchImportBatch(
  batchId: string
): Promise<ImportBatchDetailResponse> {
  return apiFetch<ImportBatchDetailResponse>(
    `${REVENUE_API_URL}/batches/${batchId}`
  );
}

/**
 * Hook for fetching a single import batch by ID.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useImportBatch('batch-uuid');
 * ```
 */
export function useImportBatch(batchId: string) {
  return useQuery({
    queryKey: importBatchQueryKey(batchId),
    queryFn: () => fetchImportBatch(batchId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!batchId,
  });
}
