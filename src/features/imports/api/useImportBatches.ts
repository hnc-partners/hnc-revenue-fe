/**
 * useImportBatches.ts
 *
 * TanStack Query hook for fetching paginated import batches.
 * Supports server-side filtering and pagination.
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type {
  CollectionResponse,
  ImportBatch,
  ImportBatchFilters,
} from '../types';

/** Query key factory for import batches */
export const importBatchesQueryKey = (filters: ImportBatchFilters) =>
  ['revenue', 'imports', 'batches', filters] as const;

/**
 * Build query string from filter params, omitting undefined/empty values.
 */
function buildQueryString(filters: ImportBatchFilters): string {
  const params = new URLSearchParams();

  if (filters.brandId) params.set('brandId', filters.brandId);
  if (filters.status && filters.status.length > 0) {
    filters.status.forEach((s) => params.append('status', s));
  }
  if (filters.periodStart) params.set('periodStart', filters.periodStart);
  if (filters.periodEnd) params.set('periodEnd', filters.periodEnd);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Fetch paginated import batches with filters.
 */
async function fetchImportBatches(
  filters: ImportBatchFilters
): Promise<CollectionResponse<ImportBatch>> {
  const queryString = buildQueryString(filters);
  return apiFetch<CollectionResponse<ImportBatch>>(
    `${REVENUE_API_URL}/batches${queryString}`
  );
}

/**
 * Hook for fetching paginated, filtered import batches.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useImportBatches({
 *   brandId: 'brand-uuid',
 *   page: 1,
 *   limit: 50,
 * });
 * ```
 */
export function useImportBatches(filters: ImportBatchFilters) {
  return useQuery({
    queryKey: importBatchesQueryKey(filters),
    queryFn: () => fetchImportBatches(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
