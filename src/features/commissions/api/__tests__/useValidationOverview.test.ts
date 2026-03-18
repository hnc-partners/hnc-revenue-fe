import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { CollectionResponse, ValidationOverview, ValidationOverviewFilters } from '../../types';

const mockApiFetch = vi.fn();
vi.mock('@/features/revenue/api', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

vi.mock('@/features/revenue/api/config', () => ({
  REVENUE_API_URL: 'http://test-api',
}));

import {
  useValidationOverview,
  validationOverviewQueryKey,
} from '../useValidationOverview';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

const mockOverview: ValidationOverview = {
  id: 'vo-1',
  batch_id: 'batch-1',
  brand_id: 'b-1',
  brand_name: 'Test Brand',
  matched: 45,
  mismatched: 3,
  missing: 2,
  skipped: 0,
  match_rate: '0.9000',
  validated_at: '2026-01-20T14:00:00Z',
  validated_by: 'admin',
};

const mockResponse: CollectionResponse<ValidationOverview> = {
  data: [mockOverview],
  meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
};

describe('useValidationOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches validation overview', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: ValidationOverviewFilters = { page: 1, limit: 25 };

    const { result } = renderHook(() => useValidationOverview(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/commissions/validation/overview?page=1&limit=25'
    );
  });

  it('omits empty filter values', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: ValidationOverviewFilters = {};

    const { result } = renderHook(() => useValidationOverview(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/commissions/validation/overview'
    );
  });

  it('returns error on failure', async () => {
    mockApiFetch.mockRejectedValue(new Error('Failed'));
    const filters: ValidationOverviewFilters = { page: 1 };

    const { result } = renderHook(() => useValidationOverview(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('validationOverviewQueryKey', () => {
  it('returns correct key shape', () => {
    const filters: ValidationOverviewFilters = { page: 1 };
    expect(validationOverviewQueryKey(filters)).toEqual([
      'revenue',
      'commissions',
      'validation',
      'overview',
      filters,
    ]);
  });
});
