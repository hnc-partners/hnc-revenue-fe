import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { SingleResponse, CommissionResultDetail } from '../../types';

const mockApiFetch = vi.fn();
vi.mock('@/features/revenue/api', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

vi.mock('@/features/revenue/api/config', () => ({
  REVENUE_API_URL: 'http://test-api',
}));

import { useCommissionResult, commissionResultQueryKey } from '../useCommissionResult';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

const mockDetail: CommissionResultDetail = {
  id: 'cr-1',
  gaming_account_id: 'ga-1',
  gaming_account_name: 'Test GA',
  contact_id: 'c-1',
  contact_name: 'Test Contact',
  share_type: 'revenue_share',
  share_category_code: 'POKER',
  share_category_name: 'Poker',
  direction: 'incoming',
  deal_type: 'master_agent',
  share_pct_applied: '0.25',
  revenue_amount: '1000.00',
  commission_amount: '250.00',
  currency: 'USD',
  period_start: '2026-01-01',
  period_end: '2026-01-31',
  status: 'active',
  batch_id: 'batch-1',
  deal_name: 'Test Deal',
  superseded_by_id: null,
  recalculation_id: null,
  supersession_chain: [
    {
      id: 'cr-0',
      status: 'superseded',
      commission_amount: '200.00',
      created_at: '2026-01-15T10:00:00Z',
      superseded_by_id: 'cr-1',
    },
  ],
  created_at: '2026-01-20T10:00:00Z',
  updated_at: '2026-01-20T10:00:00Z',
};

const mockResponse: SingleResponse<CommissionResultDetail> = {
  data: mockDetail,
};

describe('useCommissionResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches a single commission result by ID', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCommissionResult('cr-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockDetail);
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/commissions/results/cr-1'
    );
  });

  it('is disabled when id is empty', async () => {
    const { result } = renderHook(() => useCommissionResult(''), {
      wrapper: createWrapper(),
    });

    // Query should not fire
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('respects enabled option', async () => {
    const { result } = renderHook(
      () => useCommissionResult('cr-1', { enabled: false }),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('returns error state on failure', async () => {
    mockApiFetch.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useCommissionResult('cr-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe('commissionResultQueryKey', () => {
  it('returns query key for a single result', () => {
    expect(commissionResultQueryKey('cr-1')).toEqual([
      'revenue',
      'commissions',
      'results',
      'cr-1',
    ]);
  });
});
