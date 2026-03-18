/**
 * useUpsertBrandConfig.test.tsx
 *
 * TE04 compliant: Mocks ONLY the apiFetch function (external fetch layer).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock the apiFetch function — external fetch layer
const mockApiFetch = vi.fn();
vi.mock('@/features/revenue/api', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

vi.mock('@/features/revenue/api/config', () => ({
  REVENUE_API_URL: 'http://test-api',
}));

vi.mock('@/features/imports/api/useBrandConfigs', () => ({
  brandConfigsQueryKey: () => ['revenue', 'imports', 'brand-configs'],
}));

// Import after mocks
import { useUpsertBrandConfig } from '../useUpsertBrandConfig';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

describe('useUpsertBrandConfig', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('calls POST endpoint with payload', async () => {
    const response = {
      data: {
        brandId: 'b-1',
        brandName: 'Brand A',
        brandCode: 'BA',
        periodGranularity: 'monthly',
        expectedFileTypes: ['commission'],
        active: true,
      },
    };
    mockApiFetch.mockResolvedValueOnce(response);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpsertBrandConfig(), { wrapper });

    const payload = {
      brandId: 'b-1',
      brandCode: 'BA',
      periodGranularity: 'monthly' as const,
      expectedFileTypes: ['commission' as const],
      active: true,
    };

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/batches/coverage/config',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  });

  it('returns error on failed mutation', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Server error'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpsertBrandConfig(), { wrapper });

    const payload = {
      brandId: 'b-1',
      brandCode: 'BA',
      periodGranularity: 'monthly' as const,
      expectedFileTypes: ['commission' as const],
      active: true,
    };

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Server error');
  });

  it('invalidates brand configs query on success', async () => {
    const response = { data: { brandId: 'b-1' } };
    mockApiFetch.mockResolvedValueOnce(response);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpsertBrandConfig(), { wrapper });

    result.current.mutate({
      brandId: 'b-1',
      brandCode: 'BA',
      periodGranularity: 'monthly',
      expectedFileTypes: ['commission'],
      active: true,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['revenue', 'imports', 'brand-configs'],
    });
  });
});
