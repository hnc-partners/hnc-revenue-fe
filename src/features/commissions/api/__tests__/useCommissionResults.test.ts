import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { CollectionResponse, CommissionResult, CommissionResultFilters } from '../../types';

// Mock apiFetch
const mockApiFetch = vi.fn();
vi.mock('@/features/revenue/api', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

vi.mock('@/features/revenue/api/config', () => ({
  REVENUE_API_URL: 'http://test-api',
}));

import { useCommissionResults, commissionResultsQueryKey } from '../useCommissionResults';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

const mockResult: CommissionResult = {
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
};

const mockResponse: CollectionResponse<CommissionResult> = {
  data: [mockResult],
  meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
};

describe('useCommissionResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches commission results with default filters', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: CommissionResultFilters = { page: 1, limit: 25 };

    const { result } = renderHook(() => useCommissionResults(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/commissions/results?page=1&limit=25'
    );
  });

  it('builds query string from all filter params', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: CommissionResultFilters = {
      batch_id: 'batch-1',
      contact_id: 'c-1',
      gaming_account_id: 'ga-1',
      direction: 'incoming',
      share_type: 'revenue_share',
      share_category_code: 'POKER',
      deal_type: 'master_agent',
      period_start: '2026-01-01',
      period_end: '2026-01-31',
      status: 'active',
      page: 2,
      limit: 50,
      sort_by: 'commission_amount',
      sort_order: 'desc',
    };

    const { result } = renderHook(() => useCommissionResults(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = mockApiFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('batch_id=batch-1');
    expect(calledUrl).toContain('contact_id=c-1');
    expect(calledUrl).toContain('direction=incoming');
    expect(calledUrl).toContain('sort_order=desc');
  });

  it('returns error state on fetch failure', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network error'));
    const filters: CommissionResultFilters = { page: 1, limit: 25 };

    const { result } = renderHook(() => useCommissionResults(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('omits empty filter values from query string', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: CommissionResultFilters = {
      page: 1,
      limit: 25,
      batch_id: undefined,
      direction: undefined,
    };

    const { result } = renderHook(() => useCommissionResults(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = mockApiFetch.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('batch_id');
    expect(calledUrl).not.toContain('direction');
  });
});

describe('commissionResultsQueryKey', () => {
  it('returns stable query key based on filters', () => {
    const filters: CommissionResultFilters = { page: 1, limit: 25 };
    const key = commissionResultsQueryKey(filters);
    expect(key).toEqual(['revenue', 'commissions', 'results', filters]);
  });
});
