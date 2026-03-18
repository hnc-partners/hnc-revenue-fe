/**
 * useUpsertBrandConfig.ts
 *
 * TanStack Query mutation hook for upserting brand coverage config.
 * POST /batches/coverage/config — upserts by brandId.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import { brandConfigsQueryKey } from '@/features/imports/api/useBrandConfigs';
import type { UpsertBrandConfigPayload, UpsertBrandConfigResponse } from '../types';

/**
 * Upsert a brand coverage config.
 */
async function upsertBrandConfig(
  payload: UpsertBrandConfigPayload
): Promise<UpsertBrandConfigResponse> {
  return apiFetch<UpsertBrandConfigResponse>(
    `${REVENUE_API_URL}/batches/coverage/config`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

/**
 * Hook for upserting brand coverage config.
 * Invalidates brand configs query on success.
 *
 * @example
 * ```tsx
 * const mutation = useUpsertBrandConfig();
 * mutation.mutate({ brandId: '...', brandCode: 'BR1', ... });
 * ```
 */
export function useUpsertBrandConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertBrandConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandConfigsQueryKey() });
    },
  });
}
