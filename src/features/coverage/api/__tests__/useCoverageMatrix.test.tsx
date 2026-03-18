/**
 * useCoverageMatrix.test.tsx
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

// Import after mocks
import { useCoverageMatrix, coverageMatrixQueryKey } from '../useCoverageMatrix';

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

describe('useCoverageMatrix', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('fetches coverage data with date range params', async () => {
    const brands = [
      {
        brandId: 'b-1',
        brandName: 'Brand A',
        granularity: 'monthly',
        periods: [
          { periodStart: '2026-01-01', periodEnd: '2026-01-31', status: 'processed', batchId: 'batch-1' },
        ],
      },
    ];
    mockApiFetch.mockResolvedValueOnce({ data: brands });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useCoverageMatrix({
          periodStartGte: '2026-01-01',
          periodStartLte: '2026-03-31',
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(brands);
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/batches/coverage?periodStartGte=2026-01-01&periodStartLte=2026-03-31'
    );
  });

  it('does not fetch when params are null', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCoverageMatrix(null),
      { wrapper }
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('does not fetch when enabled is false', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useCoverageMatrix(
          { periodStartGte: '2026-01-01', periodStartLte: '2026-03-31' },
          { enabled: false }
        ),
      { wrapper }
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('sets isLoading while fetching', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {})); // never resolves

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useCoverageMatrix({
          periodStartGte: '2026-01-01',
          periodStartLte: '2026-03-31',
        }),
      { wrapper }
    );
    expect(result.current.isLoading).toBe(true);
  });

  it('returns error on fetch failure', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useCoverageMatrix({
          periodStartGte: '2026-01-01',
          periodStartLte: '2026-03-31',
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Network error');
  });
});

describe('coverageMatrixQueryKey', () => {
  it('returns query key array with params', () => {
    const params = { periodStartGte: '2026-01-01', periodStartLte: '2026-03-31' };
    const key = coverageMatrixQueryKey(params);
    expect(key).toEqual(['revenue', 'coverage', 'matrix', params]);
  });

  it('returns different keys for different params', () => {
    const key1 = coverageMatrixQueryKey({ periodStartGte: '2026-01-01', periodStartLte: '2026-03-31' });
    const key2 = coverageMatrixQueryKey({ periodStartGte: '2026-04-01', periodStartLte: '2026-06-30' });
    expect(key1).not.toEqual(key2);
  });
});
