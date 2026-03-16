/**
 * useBrandConfig.ts
 *
 * TanStack Query hooks for brand configuration CRUD operations.
 * - useBrandConfig: fetch single brand config with activity
 * - useCreateBrand: mutation to create new brand
 * - useUpdateBrand: mutation to update existing brand
 * - useEnableBrand / useDisableBrand: toggle brand enabled state
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REPORT_MANAGEMENT_API_URL } from '@/features/revenue/api/config';
import { statementBrandsQueryKey } from './useStatementBrands';
import type {
  SingleResponse,
  RMBrandConfigWithActivity,
  RMCreateBrandConfigDto,
  RMUpdateBrandConfigDto,
} from '../types';

/** Query key factory for brand config */
export const brandConfigQueryKey = (brandCode: string) =>
  ['report-management', 'brands', brandCode] as const;

/**
 * Fetch a single brand config with recent activity.
 */
async function fetchBrandConfig(brandCode: string): Promise<RMBrandConfigWithActivity> {
  const response = await apiFetch<SingleResponse<RMBrandConfigWithActivity>>(
    `${REPORT_MANAGEMENT_API_URL}/brands/${encodeURIComponent(brandCode)}`
  );
  return response.data;
}

/**
 * Hook for fetching a single brand config with activity data.
 */
export function useBrandConfig(brandCode: string) {
  return useQuery({
    queryKey: brandConfigQueryKey(brandCode),
    queryFn: () => fetchBrandConfig(brandCode),
    enabled: !!brandCode,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Mutation hook to create a new brand configuration.
 */
export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RMCreateBrandConfigDto) => {
      const response = await apiFetch<SingleResponse<RMBrandConfigWithActivity>>(
        `${REPORT_MANAGEMENT_API_URL}/brands`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statementBrandsQueryKey });
    },
  });
}

/**
 * Mutation hook to update an existing brand configuration.
 */
export function useUpdateBrand(brandCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RMUpdateBrandConfigDto) => {
      const response = await apiFetch<SingleResponse<RMBrandConfigWithActivity>>(
        `${REPORT_MANAGEMENT_API_URL}/brands/${encodeURIComponent(brandCode)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandConfigQueryKey(brandCode) });
      queryClient.invalidateQueries({ queryKey: statementBrandsQueryKey });
    },
  });
}

/**
 * Mutation hook to enable a brand.
 */
export function useEnableBrand(brandCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiFetch(
        `${REPORT_MANAGEMENT_API_URL}/brands/${encodeURIComponent(brandCode)}/enable`,
        { method: 'POST' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandConfigQueryKey(brandCode) });
      queryClient.invalidateQueries({ queryKey: statementBrandsQueryKey });
    },
  });
}

/**
 * Mutation hook to disable a brand.
 */
export function useDisableBrand(brandCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiFetch(
        `${REPORT_MANAGEMENT_API_URL}/brands/${encodeURIComponent(brandCode)}/disable`,
        { method: 'POST' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandConfigQueryKey(brandCode) });
      queryClient.invalidateQueries({ queryKey: statementBrandsQueryKey });
    },
  });
}
