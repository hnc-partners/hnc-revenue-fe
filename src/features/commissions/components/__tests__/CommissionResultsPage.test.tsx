import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CollectionResponse, CommissionResult } from '../../types';

// Mock TanStack Router
const mockUseSearch = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useSearch: (...args: unknown[]) => mockUseSearch(...args),
}));

// Mock commission results hook
const mockUseCommissionResults = vi.fn();
vi.mock('../../api', () => ({
  useCommissionResults: (...args: unknown[]) => mockUseCommissionResults(...args),
}));

import { CommissionResultsPage } from '../CommissionResultsPage';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
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

describe('CommissionResultsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearch.mockReturnValue({});
  });

  it('renders page title', () => {
    mockUseCommissionResults.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<CommissionResultsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Commission Results')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    mockUseCommissionResults.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = render(<CommissionResultsPage />, {
      wrapper: createWrapper(),
    });
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('shows error state with retry button', async () => {
    const mockRefetch = vi.fn();
    mockUseCommissionResults.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed'),
      refetch: mockRefetch,
    });

    render(<CommissionResultsPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();

    const retryBtn = screen.getByText('Try Again');
    const user = userEvent.setup();
    await user.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('shows empty state when no results', () => {
    mockUseCommissionResults.mockReturnValue({
      data: { data: [], meta: { page: 1, limit: 25, total: 0, totalPages: 0 } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<CommissionResultsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('No Commission Results')).toBeInTheDocument();
  });

  it('renders table with data', () => {
    mockUseCommissionResults.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<CommissionResultsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Test GA')).toBeInTheDocument();
    expect(screen.getByText('Test Contact')).toBeInTheDocument();
  });

  it('reads deep-link params from URL search', () => {
    mockUseSearch.mockReturnValue({
      batchId: 'batch-123',
      contactId: 'c-456',
    });

    mockUseCommissionResults.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<CommissionResultsPage />, { wrapper: createWrapper() });

    // Verify the hook was called with filters containing the URL params
    const calledFilters = mockUseCommissionResults.mock.calls[0][0];
    expect(calledFilters.batch_id).toBe('batch-123');
    expect(calledFilters.contact_id).toBe('c-456');
  });

  it('reads gamingAccountId from URL search', () => {
    mockUseSearch.mockReturnValue({
      gamingAccountId: 'ga-789',
    });

    mockUseCommissionResults.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<CommissionResultsPage />, { wrapper: createWrapper() });

    const calledFilters = mockUseCommissionResults.mock.calls[0][0];
    expect(calledFilters.gaming_account_id).toBe('ga-789');
  });

  it('defaults status to active', () => {
    mockUseCommissionResults.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<CommissionResultsPage />, { wrapper: createWrapper() });

    const calledFilters = mockUseCommissionResults.mock.calls[0][0];
    expect(calledFilters.status).toBe('active');
  });

  it('shows null data as empty state', () => {
    mockUseCommissionResults.mockReturnValue({
      data: { data: null, meta: { page: 1, limit: 25, total: 0, totalPages: 0 } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<CommissionResultsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('No Commission Results')).toBeInTheDocument();
  });

  it('renders with no URL search params', () => {
    mockUseSearch.mockReturnValue({});

    mockUseCommissionResults.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<CommissionResultsPage />, { wrapper: createWrapper() });

    const calledFilters = mockUseCommissionResults.mock.calls[0][0];
    expect(calledFilters.batch_id).toBeUndefined();
    expect(calledFilters.contact_id).toBeUndefined();
    expect(calledFilters.gaming_account_id).toBeUndefined();
  });
});
