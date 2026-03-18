import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { CollectionResponse, CommissionSummaryByGA, SummaryFilters } from '../../types';

const mockApiFetch = vi.fn();
vi.mock('@/features/revenue/api', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

vi.mock('@/features/revenue/api/config', () => ({
  REVENUE_API_URL: 'http://test-api',
}));

import {
  useCommissionSummariesByGA,
  commissionSummariesByGAQueryKey,
} from '../useCommissionSummariesByGA';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

const mockSummary: CommissionSummaryByGA = {
  id: 'csga-1',
  gaming_account_id: 'ga-1',
  gaming_account_name: 'Test GA',
  brand_id: 'b-1',
  brand_name: 'Test Brand',
  share_category_code: 'CASINO',
  deal_type: 'player',
  period_start: '2026-01-01',
  period_end: '2026-01-31',
  currency: 'EUR',
  total_incoming: '500.00',
  total_outgoing: '100.00',
  net_commission: '400.00',
  batch_id: 'batch-1',
};

const mockResponse: CollectionResponse<CommissionSummaryByGA> = {
  data: [mockSummary],
  meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
};

describe('useCommissionSummariesByGA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches summaries by gaming account', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: SummaryFilters = { page: 1, limit: 50 };

    const { result } = renderHook(() => useCommissionSummariesByGA(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/commissions/summaries/by-ga?page=1&limit=50'
    );
  });

  it('respects enabled option', async () => {
    const filters: SummaryFilters = { page: 1 };
    const { result } = renderHook(
      () => useCommissionSummariesByGA(filters, { enabled: false }),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('returns error on failure', async () => {
    mockApiFetch.mockRejectedValue(new Error('Failed'));
    const filters: SummaryFilters = { page: 1, limit: 50 };

    const { result } = renderHook(() => useCommissionSummariesByGA(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('includes gaming_account_id in query string', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: SummaryFilters = { gaming_account_id: 'ga-1', page: 1, limit: 50 };

    const { result } = renderHook(() => useCommissionSummariesByGA(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockApiFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('gaming_account_id=ga-1');
  });

  it('includes brand_id in query string', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: SummaryFilters = { brand_id: 'b-1', page: 1, limit: 50 };

    const { result } = renderHook(() => useCommissionSummariesByGA(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockApiFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('brand_id=b-1');
  });

  it('includes period_start and period_end in query string', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: SummaryFilters = {
      period_start: '2026-01-01',
      period_end: '2026-01-31',
      page: 1,
      limit: 50,
    };

    const { result } = renderHook(() => useCommissionSummariesByGA(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockApiFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('period_start=2026-01-01');
    expect(calledUrl).toContain('period_end=2026-01-31');
  });

  it('includes currency in query string', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: SummaryFilters = { currency: 'EUR', page: 1, limit: 50 };

    const { result } = renderHook(() => useCommissionSummariesByGA(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockApiFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('currency=EUR');
  });

  it('omits empty filter values from query string', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: SummaryFilters = { page: 1, limit: 50 };

    const { result } = renderHook(() => useCommissionSummariesByGA(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockApiFetch.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('gaming_account_id');
    expect(calledUrl).not.toContain('brand_id');
    expect(calledUrl).not.toContain('period_start');
    expect(calledUrl).not.toContain('currency');
  });

  it('defaults enabled to true when no options provided', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: SummaryFilters = { page: 1, limit: 50 };

    const { result } = renderHook(() => useCommissionSummariesByGA(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalled();
  });
});

describe('commissionSummariesByGAQueryKey', () => {
  it('includes by-ga segment', () => {
    const filters: SummaryFilters = { page: 1 };
    expect(commissionSummariesByGAQueryKey(filters)).toEqual([
      'revenue',
      'commissions',
      'summaries',
      'by-ga',
      filters,
    ]);
  });
});
