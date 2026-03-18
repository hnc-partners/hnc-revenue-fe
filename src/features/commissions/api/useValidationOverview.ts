/**
 * useValidationOverview.ts
 *
 * TanStack Query hook for fetching the validation overview list.
 * Shows latest validation results per brand.
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/features/revenue/api';
import { REVENUE_API_URL } from '@/features/revenue/api/config';
import type {
  CollectionResponse,
  ValidationOverview,
  ValidationOverviewFilters,
} from '../types';

/** Query key factory for validation overview */
export const validationOverviewQueryKey = (filters: ValidationOverviewFilters) =>
  ['revenue', 'commissions', 'validation', 'overview', filters] as const;

/**
 * Build query string from filter params.
 */
function buildQueryString(filters: ValidationOverviewFilters): string {
  const params = new URLSearchParams();

  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Fetch validation overview list.
 */
async function fetchValidationOverview(
  filters: ValidationOverviewFilters
): Promise<CollectionResponse<ValidationOverview>> {
  const queryString = buildQueryString(filters);
  return apiFetch<CollectionResponse<ValidationOverview>>(
    `${REVENUE_API_URL}/commissions/validation/overview${queryString}`
  );
}

/**
 * Hook for fetching paginated validation overview.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useValidationOverview({ page: 1, limit: 25 });
 * ```
 */
export function useValidationOverview(filters: ValidationOverviewFilters) {
  return useQuery({
    queryKey: validationOverviewQueryKey(filters),
    queryFn: () => fetchValidationOverview(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
