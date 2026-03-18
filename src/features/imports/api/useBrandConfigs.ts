/**
 * useBrandConfigs.ts
 *
 * TanStack Query hook for fetching brand configs for import filters.
 * GET /batches/coverage/config — returns active brands.
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type { BrandConfig } from '../types';

/** Query key for brand configs */
export const brandConfigsQueryKey = () =>
  ['revenue', 'imports', 'brand-configs'] as const;

interface BrandConfigsResponse {
  data: BrandConfig[];
}

/**
 * Fetch active brand configs for import filters.
 */
async function fetchBrandConfigs(): Promise<BrandConfig[]> {
  const response = await apiFetch<BrandConfigsResponse>(
    `${REVENUE_API_URL}/batches/coverage/config`
  );
  return response.data;
}

/**
 * Hook for fetching brand configs used in the brand filter dropdown.
 *
 * @example
 * ```tsx
 * const { data: brands } = useBrandConfigs();
 * ```
 */
export function useBrandConfigs() {
  return useQuery({
    queryKey: brandConfigsQueryKey(),
    queryFn: fetchBrandConfigs,
    staleTime: 1000 * 60 * 10, // 10 minutes — brands rarely change
  });
}
