/**
 * useStatementBrands.ts
 *
 * TanStack Query hook for fetching brand list with statement status.
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REPORT_MANAGEMENT_API_URL } from '@/features/revenue/api/config';
import type { CollectionResponse, RMBrandConfigWithStatus } from '../types';

/** Query key for statement brands */
export const statementBrandsQueryKey = ['report-management', 'brands'] as const;

/**
 * Fetch all brands with statement status summary.
 */
async function fetchStatementBrands(): Promise<RMBrandConfigWithStatus[]> {
  const response = await apiFetch<CollectionResponse<RMBrandConfigWithStatus>>(
    `${REPORT_MANAGEMENT_API_URL}/brands`
  );
  return response.data;
}

/**
 * Hook for fetching all brands with their statement acquisition status.
 *
 * @example
 * ```tsx
 * const { data: brands, isLoading, error } = useStatementBrands();
 * ```
 */
export function useStatementBrands() {
  return useQuery({
    queryKey: statementBrandsQueryKey,
    queryFn: fetchStatementBrands,
    staleTime: 1000 * 60 * 2, // 2 minutes — status can change frequently
  });
}
