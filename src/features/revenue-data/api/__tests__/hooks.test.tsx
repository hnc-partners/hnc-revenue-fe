/**
 * hooks.test.tsx
 *
 * Tests for revenue-data TanStack Query API hooks.
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

// Import hooks AFTER mocks
import { useRevenueRecords } from '../../api/useRevenueRecords';
import { useRevenueRecord } from '../../api/useRevenueRecord';
import { useRevenueByPlayer } from '../../api/useRevenueByPlayer';

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

// ---------------------------------------------------------------------------
// useRevenueRecords
// ---------------------------------------------------------------------------

describe('useRevenueRecords', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('fetches paginated records with default params', async () => {
    const response = {
      data: [{ id: 'rec-1', brandName: 'Test' }],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };
    mockApiFetch.mockResolvedValueOnce(response);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useRevenueRecords({ page: 1, limit: 50 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
    expect(mockApiFetch).toHaveBeenCalledWith(
      expect.stringContaining('http://test-api/revenue')
    );
  });

  it('includes filter params in query string', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useRevenueRecords({
          page: 1,
          limit: 50,
          brandId: 'brand-uuid',
          batchId: 'batch-uuid',
          gamingAccountId: 'ga-uuid',
          periodStartGte: '2026-01-01',
          periodStartLte: '2026-03-31',
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const url = mockApiFetch.mock.calls[0][0] as string;
    expect(url).toContain('brandId=brand-uuid');
    expect(url).toContain('batchId=batch-uuid');
    expect(url).toContain('gamingAccountId=ga-uuid');
    expect(url).toContain('periodStartGte=2026-01-01');
    expect(url).toContain('periodStartLte=2026-03-31');
  });

  it('sets isLoading while fetching', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {})); // never resolves
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useRevenueRecords({ page: 1 }),
      { wrapper }
    );
    expect(result.current.isLoading).toBe(true);
  });

  it('returns error on fetch failure', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useRevenueRecords({ page: 1 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Network error');
  });
});

// ---------------------------------------------------------------------------
// useRevenueRecord
// ---------------------------------------------------------------------------

describe('useRevenueRecord', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('fetches a single record by ID', async () => {
    const response = { data: { id: 'rec-1', brandName: 'Test' } };
    mockApiFetch.mockResolvedValueOnce(response);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRevenueRecord('rec-1'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
    expect(mockApiFetch).toHaveBeenCalledWith('http://test-api/revenue/rec-1');
  });

  it('does not fetch when id is empty', () => {
    mockApiFetch.mockResolvedValue({ data: null });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRevenueRecord(''), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('returns error on fetch failure', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Not found'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRevenueRecord('bad-id'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Not found');
  });
});

// ---------------------------------------------------------------------------
// useRevenueByPlayer
// ---------------------------------------------------------------------------

describe('useRevenueByPlayer', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('fetches revenue for a player', async () => {
    const response = {
      data: [{ id: 'rec-1', gamingAccountId: 'ga-1' }],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };
    mockApiFetch.mockResolvedValueOnce(response);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useRevenueByPlayer('ga-1', { page: 1, limit: 50 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
    expect(mockApiFetch).toHaveBeenCalledWith(
      expect.stringContaining('http://test-api/revenue/by-player/ga-1')
    );
  });

  it('includes filter params in query string', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useRevenueByPlayer('ga-1', {
          page: 2,
          limit: 25,
          periodStartGte: '2026-01-01',
          periodStartLte: '2026-06-30',
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const url = mockApiFetch.mock.calls[0][0] as string;
    expect(url).toContain('page=2');
    expect(url).toContain('limit=25');
    expect(url).toContain('periodStartGte=2026-01-01');
    expect(url).toContain('periodStartLte=2026-06-30');
  });

  it('does not fetch when gamingAccountId is empty', () => {
    mockApiFetch.mockResolvedValue({ data: [] });
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useRevenueByPlayer('', { page: 1 }),
      { wrapper }
    );
    expect(result.current.isLoading).toBe(false);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('returns error on fetch failure', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Server error'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useRevenueByPlayer('ga-1', { page: 1 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Server error');
  });
});
