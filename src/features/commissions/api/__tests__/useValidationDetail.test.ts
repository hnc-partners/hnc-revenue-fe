import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { ValidationDetailResponse } from '../../types';

const mockApiFetch = vi.fn();
vi.mock('@/features/revenue/api', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

vi.mock('@/features/revenue/api/config', () => ({
  REVENUE_API_URL: 'http://test-api',
}));

import {
  useValidationDetail,
  useRunValidation,
  validationDetailQueryKey,
} from '../useValidationDetail';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

const mockDetailResponse: ValidationDetailResponse = {
  data: [
    {
      id: 'vd-1',
      gaming_account_id: 'ga-1',
      gaming_account_name: 'Test GA',
      calculated_amount: '500.00',
      reported_amount: '500.00',
      difference: '0.00',
      pct_difference: '0.00',
      status: 'matched',
    },
    {
      id: 'vd-2',
      gaming_account_id: 'ga-2',
      gaming_account_name: 'Test GA 2',
      calculated_amount: '300.00',
      reported_amount: '280.00',
      difference: '20.00',
      pct_difference: '0.0667',
      status: 'mismatched',
    },
  ],
  meta: { page: 1, limit: 25, total: 2, totalPages: 1 },
  summary: {
    matched: 1,
    mismatched: 1,
    missing: 0,
    skipped: 0,
    match_rate: '0.5000',
  },
};

describe('useValidationDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches validation detail for a batch', async () => {
    mockApiFetch.mockResolvedValue(mockDetailResponse);

    const { result } = renderHook(() => useValidationDetail('batch-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockDetailResponse);
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/commissions/validate/batch-1'
    );
  });

  it('is disabled when batchId is empty', async () => {
    const { result } = renderHook(() => useValidationDetail(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('returns error on failure', async () => {
    mockApiFetch.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useValidationDetail('batch-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useRunValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers validation and returns results', async () => {
    mockApiFetch.mockResolvedValue(mockDetailResponse);

    const { result } = renderHook(() => useRunValidation('batch-1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockDetailResponse);
  });

  it('returns error on failure', async () => {
    mockApiFetch.mockRejectedValue(new Error('Validation failed'));

    const { result } = renderHook(() => useRunValidation('batch-1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('validationDetailQueryKey', () => {
  it('returns correct key shape with batchId', () => {
    expect(validationDetailQueryKey('batch-1')).toEqual([
      'revenue',
      'commissions',
      'validation',
      'detail',
      'batch-1',
    ]);
  });
});
