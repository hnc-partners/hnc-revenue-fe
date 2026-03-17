/**
 * useManualEntry.ts
 *
 * TanStack Query hooks for manual entry operations (FE-3).
 * - useEntryForm: fetch dynamic form structure for a brand
 * - useManualEntryBatches: list existing batches for a brand
 * - useCreateBatch: create a draft batch
 * - useSubmitManualEntry: validate + submit full entry
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/features/revenue/api';
import { REPORT_MANAGEMENT_API_URL } from '@/features/revenue/api/config';
import { statementBrandsQueryKey } from './useStatementBrands';
import type { SingleResponse, CollectionResponse } from '../types';
import type {
  RMEntryFormData,
  RMManualEntryBatch,
  RMCreateManualEntryBatchDto,
  RMSubmitManualEntryDto,
  RMSubmitManualEntryResponse,
} from '../types/manual-entry';

// Re-export ApiError for consumers
export { ApiError };

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const entryFormQueryKey = (brandCode: string) =>
  ['report-management', 'entry-form', brandCode] as const;

export const manualEntryBatchesQueryKey = (brandCode?: string) =>
  brandCode
    ? (['report-management', 'manual-entries', brandCode] as const)
    : (['report-management', 'manual-entries'] as const);

// ---------------------------------------------------------------------------
// Entry Form (dynamic structure)
// ---------------------------------------------------------------------------

/**
 * Fetch dynamic form data for a brand's manual entry.
 */
async function fetchEntryForm(brandCode: string): Promise<RMEntryFormData> {
  const response = await apiFetch<SingleResponse<RMEntryFormData>>(
    `${REPORT_MANAGEMENT_API_URL}/brands/${encodeURIComponent(brandCode)}/entry-form`
  );
  return response.data;
}

/**
 * Hook for fetching the dynamic entry form structure for a brand.
 * Returns share types, currency, and gaming accounts.
 */
export function useEntryForm(brandCode: string | undefined) {
  return useQuery({
    queryKey: entryFormQueryKey(brandCode ?? ''),
    queryFn: () => fetchEntryForm(brandCode!),
    enabled: !!brandCode,
    staleTime: 1000 * 60 * 5, // 5 minutes — structure changes rarely
  });
}

// ---------------------------------------------------------------------------
// Manual Entry Batches List
// ---------------------------------------------------------------------------

/**
 * Fetch existing manual entry batches, optionally filtered by brand.
 */
async function fetchManualEntryBatches(
  brandCode?: string
): Promise<RMManualEntryBatch[]> {
  const params = brandCode ? `?brandCode=${encodeURIComponent(brandCode)}` : '';
  const response = await apiFetch<CollectionResponse<RMManualEntryBatch>>(
    `${REPORT_MANAGEMENT_API_URL}/manual-entries${params}`
  );
  return response.data;
}

/**
 * Hook for listing existing manual entry batches for a brand.
 */
export function useManualEntryBatches(brandCode?: string) {
  return useQuery({
    queryKey: manualEntryBatchesQueryKey(brandCode),
    queryFn: () => fetchManualEntryBatches(brandCode),
    staleTime: 1000 * 60 * 2,
  });
}

// ---------------------------------------------------------------------------
// Create Draft Batch
// ---------------------------------------------------------------------------

/**
 * Mutation: create a new draft manual entry batch.
 */
export function useCreateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RMCreateManualEntryBatchDto) => {
      const response = await apiFetch<SingleResponse<RMManualEntryBatch>>(
        `${REPORT_MANAGEMENT_API_URL}/manual-entries`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: manualEntryBatchesQueryKey(variables.brandCode),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Submit Manual Entry (full submit: validate + CSV + notify)
// ---------------------------------------------------------------------------

/**
 * Mutation: submit a manual entry batch for processing.
 * This validates, generates CSV, and triggers notify.
 */
export function useSubmitManualEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RMSubmitManualEntryDto) => {
      const response = await apiFetch<SingleResponse<RMSubmitManualEntryResponse>>(
        `${REPORT_MANAGEMENT_API_URL}/manual-entries/submit`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all manual entry queries and brand-related queries
      queryClient.invalidateQueries({
        queryKey: ['report-management', 'manual-entries'],
      });
      queryClient.invalidateQueries({ queryKey: statementBrandsQueryKey });
    },
  });
}

// ---------------------------------------------------------------------------
// Fetch brands filtered to manual_input only (for the brand selector)
// ---------------------------------------------------------------------------

/**
 * Hook that returns only manual_input brands from the statement brands list.
 * Reuses the existing statementBrands query.
 */
export function useManualInputBrands() {
  const query = useQuery({
    queryKey: statementBrandsQueryKey,
    queryFn: async () => {
      const response = await apiFetch<
        CollectionResponse<import('../types').RMBrandConfigWithStatus>
      >(`${REPORT_MANAGEMENT_API_URL}/brands`);
      return response.data;
    },
    staleTime: 1000 * 60 * 2,
  });

  return {
    ...query,
    data: query.data?.filter((b) => b.acquisitionMode === 'manual_input'),
  };
}
