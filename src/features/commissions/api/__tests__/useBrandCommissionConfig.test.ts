import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { BrandCommissionConfig } from '../../types';

const mockApiFetch = vi.fn();
vi.mock('@/features/revenue/api', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

vi.mock('@/features/revenue/api/config', () => ({
  REVENUE_API_URL: 'http://test-api',
}));

import {
  useBrandCommissionConfig,
  useToggleAutoCalculation,
  brandCommissionConfigQueryKey,
} from '../useBrandCommissionConfig';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

const mockConfig: BrandCommissionConfig = {
  brand_id: 'b-1',
  autoCalculateCommission: true,
  lastAutoCalculatedAt: '2026-01-20T10:00:00Z',
};

describe('useBrandCommissionConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches config for a brand', async () => {
    mockApiFetch.mockResolvedValue(mockConfig);

    const { result } = renderHook(() => useBrandCommissionConfig('b-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockConfig);
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/brand-reporting-config/b-1'
    );
  });

  it('is disabled when brandId is empty', async () => {
    const { result } = renderHook(() => useBrandCommissionConfig(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('respects enabled option', async () => {
    const { result } = renderHook(
      () => useBrandCommissionConfig('b-1', { enabled: false }),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('returns error on failure', async () => {
    mockApiFetch.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useBrandCommissionConfig('b-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useToggleAutoCalculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends PATCH to toggle auto-calculation', async () => {
    const updatedConfig: BrandCommissionConfig = {
      ...mockConfig,
      autoCalculateCommission: false,
    };
    mockApiFetch.mockResolvedValue(updatedConfig);

    const { result } = renderHook(() => useToggleAutoCalculation(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        brandId: 'b-1',
        autoCalculateCommission: false,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/brand-reporting-config/b-1',
      {
        method: 'PATCH',
        body: JSON.stringify({ autoCalculateCommission: false }),
      }
    );
  });

  it('returns error on failure', async () => {
    mockApiFetch.mockRejectedValue(new Error('Permission denied'));

    const { result } = renderHook(() => useToggleAutoCalculation(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        brandId: 'b-1',
        autoCalculateCommission: true,
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('brandCommissionConfigQueryKey', () => {
  it('returns correct key shape', () => {
    expect(brandCommissionConfigQueryKey('b-1')).toEqual([
      'revenue',
      'commissions',
      'brand-config',
      'b-1',
    ]);
  });
});
