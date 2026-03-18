/**
 * useBrandCommissionConfig.ts
 *
 * TanStack Query hooks for reading and toggling the brand auto-calculation
 * commission config (FES-06).
 *
 * - useBrandCommissionConfig(brandId) — query hook to read config
 * - useToggleAutoCalculation() — mutation to PATCH the toggle
 *
 * Endpoints live on REVENUE_API_URL:
 * - GET  /brand-reporting-config/:brandId
 * - PATCH /brand-reporting-config/:brandId
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type { BrandCommissionConfig } from '../types';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const brandCommissionConfigQueryKey = (brandId: string) =>
  ['revenue', 'commissions', 'brand-config', brandId] as const;

// ---------------------------------------------------------------------------
// Fetch function
// ---------------------------------------------------------------------------

async function fetchBrandCommissionConfig(
  brandId: string
): Promise<BrandCommissionConfig> {
  return apiFetch<BrandCommissionConfig>(
    `${REVENUE_API_URL}/brand-reporting-config/${encodeURIComponent(brandId)}`
  );
}

// ---------------------------------------------------------------------------
// Query hook
// ---------------------------------------------------------------------------

/**
 * Fetch the auto-calculation commission config for a brand.
 *
 * @param brandId - Brand UUID
 * @param options - Additional options (enabled)
 *
 * @example
 * ```tsx
 * const { data: config, isLoading } = useBrandCommissionConfig(brandId);
 * ```
 */
export function useBrandCommissionConfig(
  brandId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: brandCommissionConfigQueryKey(brandId),
    queryFn: () => fetchBrandCommissionConfig(brandId),
    enabled: options?.enabled ?? !!brandId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ---------------------------------------------------------------------------
// Mutation hook
// ---------------------------------------------------------------------------

interface ToggleAutoCalculationParams {
  brandId: string;
  autoCalculateCommission: boolean;
}

/**
 * PATCH the autoCalculateCommission toggle for a brand.
 *
 * On success, invalidates the brand config query so dependent views refresh.
 *
 * @example
 * ```tsx
 * const toggle = useToggleAutoCalculation();
 * toggle.mutate({ brandId: 'uuid', autoCalculateCommission: true });
 * ```
 */
export function useToggleAutoCalculation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ brandId, autoCalculateCommission }: ToggleAutoCalculationParams) =>
      apiFetch<BrandCommissionConfig>(
        `${REVENUE_API_URL}/brand-reporting-config/${encodeURIComponent(brandId)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ autoCalculateCommission }),
        }
      ),
    onSuccess: (_data, { brandId }) => {
      queryClient.invalidateQueries({
        queryKey: brandCommissionConfigQueryKey(brandId),
      });
    },
  });
}
