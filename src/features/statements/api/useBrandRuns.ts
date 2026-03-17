/**
 * useBrandRuns.ts
 *
 * TanStack Query hooks for brand run history and run actions.
 * - useBrandRuns: paginated run history for a brand
 * - useTriggerDownload: trigger an automated download
 * - useUploadCSV: upload CSV for manual download brands
 * - useRetryRun: retry a failed run
 * - useRetryNotify: retry a failed notify
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REPORT_MANAGEMENT_API_URL } from '@/features/revenue/api/config';
import { brandConfigQueryKey } from './useBrandConfig';
import { statementBrandsQueryKey } from './useStatementBrands';
import type { RMRunsResponse } from '../types';

/** Query key factory for brand runs */
export const brandRunsQueryKey = (brandCode: string, page: number) =>
  ['report-management', 'brands', brandCode, 'runs', page] as const;

/**
 * Fetch paginated run history for a brand.
 */
async function fetchBrandRuns(
  brandCode: string,
  page: number,
  limit: number
): Promise<RMRunsResponse> {
  return apiFetch<RMRunsResponse>(
    `${REPORT_MANAGEMENT_API_URL}/brands/${encodeURIComponent(brandCode)}/runs?page=${page}&limit=${limit}`
  );
}

/**
 * Hook for fetching paginated run history.
 */
export function useBrandRuns(brandCode: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: brandRunsQueryKey(brandCode, page),
    queryFn: () => fetchBrandRuns(brandCode, page, limit),
    enabled: !!brandCode,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Mutation: trigger automated download for a brand.
 */
export function useTriggerDownload(brandCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiFetch(
        `${REPORT_MANAGEMENT_API_URL}/brands/${encodeURIComponent(brandCode)}/trigger`,
        { method: 'POST' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandConfigQueryKey(brandCode) });
      queryClient.invalidateQueries({
        queryKey: ['report-management', 'brands', brandCode, 'runs'],
      });
      queryClient.invalidateQueries({ queryKey: statementBrandsQueryKey });
    },
  });
}

/**
 * Mutation: upload CSV file for a manual download brand.
 */
export function useUploadCSV(brandCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const token = (await import('@hnc-partners/auth-context')).getAuthItem(
        'access_token',
        'hnc_'
      );

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${REPORT_MANAGEMENT_API_URL}/brands/${encodeURIComponent(brandCode)}/upload`,
        {
          method: 'POST',
          headers,
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || data.message || `Upload failed (${response.status})`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandConfigQueryKey(brandCode) });
      queryClient.invalidateQueries({
        queryKey: ['report-management', 'brands', brandCode, 'runs'],
      });
      queryClient.invalidateQueries({ queryKey: statementBrandsQueryKey });
    },
  });
}

/**
 * Mutation: retry a failed run.
 */
export function useRetryRun(brandCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (runId: string) => {
      await apiFetch(
        `${REPORT_MANAGEMENT_API_URL}/runs/${encodeURIComponent(runId)}/retry`,
        { method: 'POST' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandConfigQueryKey(brandCode) });
      queryClient.invalidateQueries({
        queryKey: ['report-management', 'brands', brandCode, 'runs'],
      });
      queryClient.invalidateQueries({ queryKey: statementBrandsQueryKey });
    },
  });
}

/**
 * Mutation: retry a failed notify for a run.
 */
export function useRetryNotify(brandCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (runId: string) => {
      await apiFetch(
        `${REPORT_MANAGEMENT_API_URL}/runs/${encodeURIComponent(runId)}/retry-notify`,
        { method: 'POST' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['report-management', 'brands', brandCode, 'runs'],
      });
    },
  });
}
