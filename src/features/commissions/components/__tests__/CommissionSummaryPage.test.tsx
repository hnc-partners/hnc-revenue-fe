import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type {
  CollectionResponse,
  CommissionSummary,
} from '../../types';

// Mock MF-safe navigation and search
const mockNavigate = vi.fn();
vi.mock('@/lib/use-safe-navigate', () => ({
  useSafeNavigate: () => mockNavigate,
}));

const mockUseSearch = vi.fn();
vi.mock('@/lib/useSafeSearch', () => ({
  useSafeSearch: (...args: unknown[]) => mockUseSearch(...args),
}));

// Mock API hooks
const mockUseCommissionSummaries = vi.fn();
const mockUseCommissionSummariesByGA = vi.fn();
const mockUseCommissionSummariesByBrand = vi.fn();

vi.mock('../../api', () => ({
  useCommissionSummaries: (...args: unknown[]) => mockUseCommissionSummaries(...args),
  useCommissionSummariesByGA: (...args: unknown[]) => mockUseCommissionSummariesByGA(...args),
  useCommissionSummariesByBrand: (...args: unknown[]) => mockUseCommissionSummariesByBrand(...args),
}));

import { CommissionSummaryPage } from '../CommissionSummaryPage';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
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

const mockSummaryResponse: CollectionResponse<CommissionSummary> = {
  data: [mockSummary],
  meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
};

function setupDefaultMocks() {
  mockUseCommissionSummaries.mockReturnValue({
    data: mockSummaryResponse,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
  mockUseCommissionSummariesByGA.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
  mockUseCommissionSummariesByBrand.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
}

describe('CommissionSummaryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearch.mockReturnValue({});
  });

  it('renders page title', () => {
    setupDefaultMocks();
    render(<CommissionSummaryPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Commission Summaries')).toBeInTheDocument();
  });

  it('renders dimension picker tabs', () => {
    setupDefaultMocks();
    render(<CommissionSummaryPage />, { wrapper: createWrapper() });

    expect(screen.getByText('By Contact')).toBeInTheDocument();
    expect(screen.getByText('By Gaming Account')).toBeInTheDocument();
    expect(screen.getByText('By Brand')).toBeInTheDocument();
    expect(screen.getByText('By Category')).toBeInTheDocument();
    expect(screen.getByText('By Deal Type')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    mockUseCommissionSummaries.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });
    mockUseCommissionSummariesByGA.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseCommissionSummariesByBrand.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = render(<CommissionSummaryPage />, {
      wrapper: createWrapper(),
    });
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('shows error state with retry', async () => {
    const mockRefetch = vi.fn();
    mockUseCommissionSummaries.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed'),
      refetch: mockRefetch,
    });
    mockUseCommissionSummariesByGA.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseCommissionSummariesByBrand.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<CommissionSummaryPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByText('Try Again'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('shows empty state when no summaries', () => {
    mockUseCommissionSummaries.mockReturnValue({
      data: { data: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseCommissionSummariesByGA.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseCommissionSummariesByBrand.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<CommissionSummaryPage />, { wrapper: createWrapper() });
    expect(screen.getByText('No Commission Summaries')).toBeInTheDocument();
  });

  it('renders summary data in table', () => {
    setupDefaultMocks();
    render(<CommissionSummaryPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Test Contact')).toBeInTheDocument();
  });

  it('defaults to contact dimension', () => {
    setupDefaultMocks();
    render(<CommissionSummaryPage />, { wrapper: createWrapper() });

    // The contact query should be enabled (called with enabled: true)
    expect(mockUseCommissionSummaries).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ enabled: true })
    );
  });

  it('switches to GA dimension when clicking By Gaming Account tab', async () => {
    setupDefaultMocks();
    render(<CommissionSummaryPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    await user.click(screen.getByText('By Gaming Account'));

    // After switching, GA query should be enabled
    expect(mockUseCommissionSummariesByGA).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ enabled: true })
    );
  });

  it('switches to brand dimension when clicking By Brand tab', async () => {
    setupDefaultMocks();
    render(<CommissionSummaryPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    await user.click(screen.getByText('By Brand'));

    expect(mockUseCommissionSummariesByBrand).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ enabled: true })
    );
  });

  it('switches to category dimension and groups data client-side', async () => {
    const summaryWithCategory: CommissionSummary = {
      ...mockSummary,
      share_category_code: 'POKER',
      total_incoming: '500.00',
      total_outgoing: '100.00',
      net_commission: '400.00',
    };
    mockUseCommissionSummaries.mockReturnValue({
      data: { data: [summaryWithCategory], meta: { page: 1, limit: 50, total: 1, totalPages: 1 } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseCommissionSummariesByGA.mockReturnValue({
      data: undefined, isLoading: false, error: null, refetch: vi.fn(),
    });
    mockUseCommissionSummariesByBrand.mockReturnValue({
      data: undefined, isLoading: false, error: null, refetch: vi.fn(),
    });

    render(<CommissionSummaryPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    await user.click(screen.getByText('By Category'));

    // Category dimension groups by share_category_code, should show POKER label
    expect(screen.getByText('POKER')).toBeInTheDocument();
  });

  it('switches to deal_type dimension and groups data client-side', async () => {
    const summaryWithDeal: CommissionSummary = {
      ...mockSummary,
      deal_type: 'master_agent',
      total_incoming: '1000.00',
      total_outgoing: '200.00',
      net_commission: '800.00',
    };
    mockUseCommissionSummaries.mockReturnValue({
      data: { data: [summaryWithDeal], meta: { page: 1, limit: 50, total: 1, totalPages: 1 } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseCommissionSummariesByGA.mockReturnValue({
      data: undefined, isLoading: false, error: null, refetch: vi.fn(),
    });
    mockUseCommissionSummariesByBrand.mockReturnValue({
      data: undefined, isLoading: false, error: null, refetch: vi.fn(),
    });

    render(<CommissionSummaryPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    await user.click(screen.getByText('By Deal Type'));

    // Deal type grouping should show the label "Master Agent"
    expect(screen.getByText('Master Agent')).toBeInTheDocument();
  });

  it('navigates to results page when clicking a contact row', async () => {
    setupDefaultMocks();
    render(<CommissionSummaryPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    await user.click(screen.getByText('Test Contact'));

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/revenue/commissions/results',
      search: { contactId: 'c-1' },
    });
  });

  it('reads dimension from URL search params', () => {
    mockUseSearch.mockReturnValue({ dimension: 'brand' });
    setupDefaultMocks();

    render(<CommissionSummaryPage />, { wrapper: createWrapper() });

    expect(mockUseCommissionSummariesByBrand).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ enabled: true })
    );
  });

  it('shows deep-link contact filter banner and allows dismissal', async () => {
    mockUseSearch.mockReturnValue({ contactId: 'c-123' });
    setupDefaultMocks();

    render(<CommissionSummaryPage />, { wrapper: createWrapper() });

    // Should show contact filter banner
    expect(screen.getByText(/Showing commissions for Contact/)).toBeInTheDocument();
    expect(screen.getByText('c-123')).toBeInTheDocument();

    // Dismiss the banner
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Clear Contact filter'));

    // Banner should disappear
    expect(screen.queryByText('c-123')).not.toBeInTheDocument();
  });

  it('shows deep-link GA filter banner when dimension is ga', async () => {
    mockUseSearch.mockReturnValue({ dimension: 'ga', gamingAccountId: 'ga-99' });
    setupDefaultMocks();

    render(<CommissionSummaryPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/Showing commissions for Gaming Account/)).toBeInTheDocument();
    expect(screen.getByText('ga-99')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Clear Gaming Account filter'));
    expect(screen.queryByText('ga-99')).not.toBeInTheDocument();
  });

  it('shows deep-link brand filter banner when dimension is brand', async () => {
    mockUseSearch.mockReturnValue({ dimension: 'brand', brandId: 'b-55' });
    setupDefaultMocks();

    render(<CommissionSummaryPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/Showing commissions for Brand/)).toBeInTheDocument();
    expect(screen.getByText('b-55')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Clear Brand filter'));
    expect(screen.queryByText('b-55')).not.toBeInTheDocument();
  });

  it('uses GA data for table when dimension is ga', async () => {
    const gaSummary = {
      id: 'csga-1',
      gaming_account_id: 'ga-1',
      gaming_account_name: 'Test GA',
      brand_id: 'b-1',
      brand_name: 'Test Brand',
      share_category_code: 'POKER',
      deal_type: 'master_agent' as const,
      period_start: '2026-01-01',
      period_end: '2026-01-31',
      currency: 'USD',
      total_incoming: '1000.00',
      total_outgoing: '200.00',
      net_commission: '800.00',
      batch_id: 'batch-1',
    };

    mockUseCommissionSummaries.mockReturnValue({
      data: undefined, isLoading: false, error: null, refetch: vi.fn(),
    });
    mockUseCommissionSummariesByGA.mockReturnValue({
      data: { data: [gaSummary], meta: { page: 1, limit: 50, total: 1, totalPages: 1 } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseCommissionSummariesByBrand.mockReturnValue({
      data: undefined, isLoading: false, error: null, refetch: vi.fn(),
    });

    mockUseSearch.mockReturnValue({ dimension: 'ga' });
    render(<CommissionSummaryPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Test GA')).toBeInTheDocument();
  });

  it('renders empty grouped data as empty state for category when contact data is empty', async () => {
    mockUseCommissionSummaries.mockReturnValue({
      data: { data: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseCommissionSummariesByGA.mockReturnValue({
      data: undefined, isLoading: false, error: null, refetch: vi.fn(),
    });
    mockUseCommissionSummariesByBrand.mockReturnValue({
      data: undefined, isLoading: false, error: null, refetch: vi.fn(),
    });

    render(<CommissionSummaryPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();
    await user.click(screen.getByText('By Category'));

    expect(screen.getByText('No Commission Summaries')).toBeInTheDocument();
  });
});
