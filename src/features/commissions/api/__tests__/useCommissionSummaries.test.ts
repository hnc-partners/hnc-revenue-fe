import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { CollectionResponse, CommissionSummary, SummaryFilters } from '../../types';

const mockApiFetch = vi.fn();
vi.mock('@/features/revenue/api', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

vi.mock('@/features/revenue/api/config', () => ({
  REVENUE_API_URL: 'http://test-api',
}));

import {
  useCommissionSummaries,
  commissionSummariesQueryKey,
} from '../useCommissionSummaries';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

const mockSummary: CommissionSummary = {
  id: 'cs-1',
  contact_id: 'c-1',
  contact_name: 'Test Contact',
  brand_id: 'b-1',
  brand_name: 'Test Brand',
  share_category_code: 'POKER',
  deal_type: 'master_agent',
  period_start: '2026-01-01',
  period_end: '2026-01-31',
  currency: 'USD',
  total_incoming: '1000.00',
  total_outgoing: '200.00',
  net_commission: '800.00',
  batch_id: 'batch-1',
};

const mockResponse: CollectionResponse<CommissionSummary> = {
  data: [mockSummary],
  meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
};

describe('useCommissionSummaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches summaries with filters', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: SummaryFilters = { page: 1, limit: 50 };

    const { result } = renderHook(() => useCommissionSummaries(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/commissions/summaries?page=1&limit=50'
    );
  });

  it('builds full query string from all filter params', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: SummaryFilters = {
      contact_id: 'c-1',
      gaming_account_id: 'ga-1',
      brand_id: 'b-1',
      period_start: '2026-01-01',
      period_end: '2026-01-31',
      currency: 'USD',
      page: 1,
      limit: 50,
    };

    const { result } = renderHook(() => useCommissionSummaries(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockApiFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('contact_id=c-1');
    expect(calledUrl).toContain('currency=USD');
  });

  it('respects enabled option', async () => {
    const filters: SummaryFilters = { page: 1, limit: 50 };
    const { result } = renderHook(
      () => useCommissionSummaries(filters, { enabled: false }),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('returns error state on failure', async () => {
    mockApiFetch.mockRejectedValue(new Error('Server error'));
    const filters: SummaryFilters = { page: 1, limit: 50 };

    const { result } = renderHook(() => useCommissionSummaries(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('commissionSummariesQueryKey', () => {
  it('returns stable query key', () => {
    const filters: SummaryFilters = { page: 1 };
    expect(commissionSummariesQueryKey(filters)).toEqual([
      'revenue',
      'commissions',
      'summaries',
      filters,
    ]);
  });
});
