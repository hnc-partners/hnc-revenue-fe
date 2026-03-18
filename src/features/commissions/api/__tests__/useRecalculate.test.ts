import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { RecalculationResult } from '../../types';

const mockApiFetch = vi.fn();
vi.mock('@/features/revenue/api', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

vi.mock('@/features/revenue/api/config', () => ({
  REVENUE_API_URL: 'http://test-api',
}));

import { useRecalculate } from '../useRecalculate';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

const mockResult: RecalculationResult = {
  batch_id: 'batch-1',
  previous_total: '5000.00',
  new_total: '5200.00',
  changed_count: 3,
  unchanged_count: 47,
  recalculated_at: '2026-01-20T15:00:00Z',
};

describe('useRecalculate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers recalculation with batch ID', async () => {
    mockApiFetch.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useRecalculate(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('batch-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResult);
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/commissions/recalculate',
      {
        method: 'POST',
        body: JSON.stringify({ batch_id: 'batch-1' }),
      }
    );
  });

  it('returns error on failure', async () => {
    mockApiFetch.mockRejectedValue(new Error('Recalculation failed'));

    const { result } = renderHook(() => useRecalculate(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('batch-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('shows pending state during mutation', async () => {
    let resolvePromise: (value: RecalculationResult) => void;
    mockApiFetch.mockImplementation(
      () =>
        new Promise<RecalculationResult>((resolve) => {
          resolvePromise = resolve;
        })
    );

    const { result } = renderHook(() => useRecalculate(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate('batch-1');
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    await act(async () => {
      resolvePromise!(mockResult);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
