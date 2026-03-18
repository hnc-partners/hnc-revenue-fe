import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { CollectionResponse, CommissionSummaryByBrand, SummaryFilters } from '../../types';

const mockApiFetch = vi.fn();
vi.mock('@/features/revenue/api', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

vi.mock('@/features/revenue/api/config', () => ({
  REVENUE_API_URL: 'http://test-api',
}));

import {
  useCommissionSummariesByBrand,
  commissionSummariesByBrandQueryKey,
} from '../useCommissionSummariesByBrand';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

const mockSummary: CommissionSummaryByBrand = {
  id: 'csb-1',
  brand_id: 'b-1',
  brand_name: 'Test Brand',
  share_category_code: 'SPORTS',
  deal_type: 'sub_agent',
  period_start: '2026-01-01',
  period_end: '2026-01-31',
  currency: 'GBP',
  total_incoming: '2000.00',
  total_outgoing: '500.00',
  net_commission: '1500.00',
  batch_id: 'batch-1',
};

const mockResponse: CollectionResponse<CommissionSummaryByBrand> = {
  data: [mockSummary],
  meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
};

describe('useCommissionSummariesByBrand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches summaries by brand', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: SummaryFilters = { page: 1, limit: 50 };

    const { result } = renderHook(
      () => useCommissionSummariesByBrand(filters),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://test-api/commissions/summaries/by-brand?page=1&limit=50'
    );
  });

  it('includes brand_id in query string', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: SummaryFilters = { brand_id: 'b-1', page: 1, limit: 50 };

    const { result } = renderHook(
      () => useCommissionSummariesByBrand(filters),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockApiFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('brand_id=b-1');
  });

  it('respects enabled option', async () => {
    const filters: SummaryFilters = { page: 1 };
    const { result } = renderHook(
      () => useCommissionSummariesByBrand(filters, { enabled: false }),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('returns error on failure', async () => {
    mockApiFetch.mockRejectedValue(new Error('Failed'));
    const filters: SummaryFilters = { page: 1 };

    const { result } = renderHook(
      () => useCommissionSummariesByBrand(filters),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('includes period_start and period_end in query string', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: SummaryFilters = {
      period_start: '2026-01-01',
      period_end: '2026-01-31',
      page: 1,
      limit: 50,
    };

    const { result } = renderHook(
      () => useCommissionSummariesByBrand(filters),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockApiFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('period_start=2026-01-01');
    expect(calledUrl).toContain('period_end=2026-01-31');
  });

  it('includes currency in query string', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: SummaryFilters = { currency: 'GBP', page: 1, limit: 50 };

    const { result } = renderHook(
      () => useCommissionSummariesByBrand(filters),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockApiFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('currency=GBP');
  });

  it('omits empty filter values from query string', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: SummaryFilters = { page: 1, limit: 50 };

    const { result } = renderHook(
      () => useCommissionSummariesByBrand(filters),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockApiFetch.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('brand_id');
    expect(calledUrl).not.toContain('period_start');
    expect(calledUrl).not.toContain('currency');
  });

  it('defaults enabled to true when no options provided', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: SummaryFilters = { page: 1, limit: 50 };

    const { result } = renderHook(
      () => useCommissionSummariesByBrand(filters),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalled();
  });

  it('builds empty query string when no params set', async () => {
    mockApiFetch.mockResolvedValue(mockResponse);
    const filters: SummaryFilters = {};

    const { result } = renderHook(
      () => useCommissionSummariesByBrand(filters),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockApiFetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe('http://test-api/commissions/summaries/by-brand');
  });
});

describe('commissionSummariesByBrandQueryKey', () => {
  it('includes by-brand segment', () => {
    const filters: SummaryFilters = {};
    expect(commissionSummariesByBrandQueryKey(filters)).toEqual([
      'revenue',
      'commissions',
      'summaries',
      'by-brand',
      filters,
    ]);
  });
});
