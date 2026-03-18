/**
 * useBatchLogs.ts
 *
 * TanStack Query hook for fetching paginated audit logs for an import batch.
 * GET /batches/:id/logs (paginated, filterable by logLevel)
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type { LogQueryParams, LogsResponse } from '../types';

/** Query key factory for batch logs */
export const batchLogsQueryKey = (batchId: string, params: LogQueryParams) =>
  ['revenue', 'imports', 'batch', batchId, 'logs', params] as const;

/**
 * Build query string from log query params.
 */
function buildLogQueryString(params: LogQueryParams): string {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.logLevel) searchParams.set('logLevel', params.logLevel);

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Fetch paginated audit logs for a batch.
 */
async function fetchBatchLogs(
  batchId: string,
  params: LogQueryParams
): Promise<LogsResponse> {
  const queryString = buildLogQueryString(params);
  return apiFetch<LogsResponse>(
    `${REVENUE_API_URL}/batches/${batchId}/logs${queryString}`
  );
}

/**
 * Hook for fetching paginated, filtered batch audit logs.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useBatchLogs('batch-uuid', {
 *   page: 1,
 *   limit: 25,
 *   logLevel: 'error',
 * });
 * ```
 */
export function useBatchLogs(batchId: string, params: LogQueryParams) {
  return useQuery({
    queryKey: batchLogsQueryKey(batchId, params),
    queryFn: () => fetchBatchLogs(batchId, params),
    staleTime: 1000 * 30, // 30 seconds
    enabled: !!batchId,
  });
}
