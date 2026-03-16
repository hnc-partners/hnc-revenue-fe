/**
 * useServiceStatus.ts
 *
 * TanStack Query hooks for global service pause state + pause/resume mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REPORT_MANAGEMENT_API_URL } from '@/features/revenue/api/config';
import type { SingleResponse, RMServiceState } from '../types';

/** Query key for service status */
export const serviceStatusQueryKey = ['report-management', 'service', 'status'] as const;

/**
 * Fetch global service pause state.
 */
async function fetchServiceStatus(): Promise<RMServiceState> {
  const response = await apiFetch<SingleResponse<RMServiceState>>(
    `${REPORT_MANAGEMENT_API_URL}/service/status`
  );
  return response.data;
}

/**
 * Hook for fetching global service pause state.
 */
export function useServiceStatus() {
  return useQuery({
    queryKey: serviceStatusQueryKey,
    queryFn: fetchServiceStatus,
    staleTime: 1000 * 30, // 30 seconds — important to stay current
  });
}

/**
 * Mutation hook to pause all statement scheduling.
 */
export function usePauseService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiFetch<SingleResponse<RMServiceState>>(
        `${REPORT_MANAGEMENT_API_URL}/service/pause`,
        { method: 'POST' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceStatusQueryKey });
      queryClient.invalidateQueries({ queryKey: ['report-management', 'brands'] });
    },
  });
}

/**
 * Mutation hook to resume all statement scheduling.
 */
export function useResumeService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiFetch<SingleResponse<RMServiceState>>(
        `${REPORT_MANAGEMENT_API_URL}/service/resume`,
        { method: 'POST' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceStatusQueryKey });
      queryClient.invalidateQueries({ queryKey: ['report-management', 'brands'] });
    },
  });
}
