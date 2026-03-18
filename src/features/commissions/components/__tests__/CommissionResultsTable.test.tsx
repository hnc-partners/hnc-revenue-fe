import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CommissionResult, PaginatedMeta } from '../../types';

// Mock the detail hook used by CommissionResultDetail
vi.mock('../../api', () => ({
  useCommissionResult: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

import { CommissionResultsTable } from '../CommissionResultsTable';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockResults: CommissionResult[] = [
  {
    id: 'cr-1',
    gaming_account_id: 'ga-1',
    gaming_account_name: 'Alpha GA',
    contact_id: 'c-1',
    contact_name: 'John Smith',
    share_type: 'revenue_share',
    share_category_code: 'POKER',
    share_category_name: 'Poker',
    direction: 'incoming',
    deal_type: 'master_agent',
    share_pct_applied: '0.15',
    revenue_amount: '2000.00',
    commission_amount: '300.00',
    currency: 'USD',
    period_start: '2026-01-01',
    period_end: '2026-01-31',
    status: 'active',
    batch_id: 'batch-1',
    deal_name: 'Deal Alpha',
    superseded_by_id: null,
    recalculation_id: null,
  },
  {
    id: 'cr-2',
    gaming_account_id: 'ga-2',
    gaming_account_name: 'Beta GA',
    contact_id: 'c-2',
    contact_name: 'Jane Doe',
    share_type: 'revenue_share',
    share_category_code: 'CASINO',
    share_category_name: 'Casino',
    direction: 'outgoing',
    deal_type: 'player',
    share_pct_applied: '0.10',
    revenue_amount: '5000.00',
    commission_amount: '500.00',
    currency: 'EUR',
    period_start: '2026-02-01',
    period_end: '2026-02-28',
    status: 'active',
    batch_id: 'batch-2',
    deal_name: 'Deal Beta',
    superseded_by_id: null,
    recalculation_id: null,
  },
];

const mockMeta: PaginatedMeta = {
  page: 1,
  limit: 25,
  total: 2,
  totalPages: 1,
};

describe('CommissionResultsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table headers', () => {
    render(
      <CommissionResultsTable
        data={mockResults}
        meta={mockMeta}
        currentPage={1}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Gaming Account')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Direction')).toBeInTheDocument();
  });

  it('renders result rows', () => {
    render(
      <CommissionResultsTable
        data={mockResults}
        meta={mockMeta}
        currentPage={1}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Alpha GA')).toBeInTheDocument();
    expect(screen.getByText('Beta GA')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('shows direction badges', () => {
    render(
      <CommissionResultsTable
        data={mockResults}
        meta={mockMeta}
        currentPage={1}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('incoming')).toBeInTheDocument();
    expect(screen.getByText('outgoing')).toBeInTheDocument();
  });

  it('shows total count', () => {
    render(
      <CommissionResultsTable
        data={mockResults}
        meta={mockMeta}
        currentPage={1}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('2 results')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(
      <CommissionResultsTable
        data={[]}
        meta={undefined}
        currentPage={1}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('No commission results found.')).toBeInTheDocument();
  });

  it('renders pagination for multi-page results', () => {
    const multiPageMeta: PaginatedMeta = {
      page: 1,
      limit: 25,
      total: 100,
      totalPages: 4,
    };

    render(
      <CommissionResultsTable
        data={mockResults}
        meta={multiPageMeta}
        currentPage={1}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Page 1 of 4', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Previous page')).toBeInTheDocument();
    expect(screen.getByText('Next page')).toBeInTheDocument();
  });

  it('calls onPageChange when clicking next page', async () => {
    const onPageChange = vi.fn();
    const multiPageMeta: PaginatedMeta = {
      page: 1,
      limit: 25,
      total: 100,
      totalPages: 4,
    };

    render(
      <CommissionResultsTable
        data={mockResults}
        meta={multiPageMeta}
        currentPage={1}
        onPageChange={onPageChange}
      />,
      { wrapper: createWrapper() }
    );

    const user = userEvent.setup();
    // Find the next page button (contains sr-only "Next page")
    const nextButton = screen.getByText('Next page').closest('button')!;
    await user.click(nextButton);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables previous button on first page', () => {
    const multiPageMeta: PaginatedMeta = {
      page: 1,
      limit: 25,
      total: 100,
      totalPages: 4,
    };

    render(
      <CommissionResultsTable
        data={mockResults}
        meta={multiPageMeta}
        currentPage={1}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    const prevButton = screen.getByText('Previous page').closest('button')!;
    expect(prevButton).toBeDisabled();
  });

  it('expands row detail on click', async () => {
    render(
      <CommissionResultsTable
        data={mockResults}
        meta={mockMeta}
        currentPage={1}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    const user = userEvent.setup();
    // Click the first data row (contains "Alpha GA")
    const firstRow = screen.getByText('Alpha GA').closest('tr')!;
    await user.click(firstRow);

    // After expanding, detail view should appear with "Result Detail"
    expect(screen.getByText('Result Detail')).toBeInTheDocument();
  });

  it('collapses row detail when clicking same row again', async () => {
    render(
      <CommissionResultsTable
        data={mockResults}
        meta={mockMeta}
        currentPage={1}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    const user = userEvent.setup();
    const firstRow = screen.getByText('Alpha GA').closest('tr')!;

    // Expand
    await user.click(firstRow);
    expect(screen.getByText('Result Detail')).toBeInTheDocument();

    // Collapse by clicking same row again
    await user.click(firstRow);
    expect(screen.queryByText('Result Detail')).not.toBeInTheDocument();
  });

  it('switches expanded row when clicking a different row', async () => {
    render(
      <CommissionResultsTable
        data={mockResults}
        meta={mockMeta}
        currentPage={1}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    const user = userEvent.setup();

    // Expand first row
    const firstRow = screen.getByText('Alpha GA').closest('tr')!;
    await user.click(firstRow);
    expect(screen.getByText('Result Detail')).toBeInTheDocument();

    // Click second row
    const secondRow = screen.getByText('Beta GA').closest('tr')!;
    await user.click(secondRow);

    // Detail should still be visible (for the new row)
    expect(screen.getByText('Result Detail')).toBeInTheDocument();
  });

  it('closes detail via close button', async () => {
    render(
      <CommissionResultsTable
        data={mockResults}
        meta={mockMeta}
        currentPage={1}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    const user = userEvent.setup();
    const firstRow = screen.getByText('Alpha GA').closest('tr')!;
    await user.click(firstRow);

    // Click the close button inside the detail
    const closeBtn = screen.getByText('Close detail').closest('button')!;
    await user.click(closeBtn);

    expect(screen.queryByText('Result Detail')).not.toBeInTheDocument();
  });

  it('shows "1 result" for singular count', () => {
    const singleMeta: PaginatedMeta = {
      page: 1,
      limit: 25,
      total: 1,
      totalPages: 1,
    };

    render(
      <CommissionResultsTable
        data={[mockResults[0]]}
        meta={singleMeta}
        currentPage={1}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('1 result')).toBeInTheDocument();
  });

  it('does not show pagination for single-page results', () => {
    render(
      <CommissionResultsTable
        data={mockResults}
        meta={mockMeta}
        currentPage={1}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Previous page')).not.toBeInTheDocument();
    expect(screen.queryByText('Next page')).not.toBeInTheDocument();
  });

  it('disables next button on last page', () => {
    const lastPageMeta: PaginatedMeta = {
      page: 4,
      limit: 25,
      total: 100,
      totalPages: 4,
    };

    render(
      <CommissionResultsTable
        data={mockResults}
        meta={lastPageMeta}
        currentPage={4}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    const nextBtn = screen.getByText('Next page').closest('button')!;
    expect(nextBtn).toBeDisabled();
  });

  it('calls onPageChange when clicking previous page', async () => {
    const onPageChange = vi.fn();
    const multiPageMeta: PaginatedMeta = {
      page: 2,
      limit: 25,
      total: 100,
      totalPages: 4,
    };

    render(
      <CommissionResultsTable
        data={mockResults}
        meta={multiPageMeta}
        currentPage={2}
        onPageChange={onPageChange}
      />,
      { wrapper: createWrapper() }
    );

    const user = userEvent.setup();
    const prevBtn = screen.getByText('Previous page').closest('button')!;
    await user.click(prevBtn);

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange when clicking a specific page number', async () => {
    const onPageChange = vi.fn();
    const multiPageMeta: PaginatedMeta = {
      page: 1,
      limit: 25,
      total: 100,
      totalPages: 4,
    };

    render(
      <CommissionResultsTable
        data={mockResults}
        meta={multiPageMeta}
        currentPage={1}
        onPageChange={onPageChange}
      />,
      { wrapper: createWrapper() }
    );

    const user = userEvent.setup();
    // Click page 3 button
    await user.click(screen.getByText('3'));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('renders deal type labels', () => {
    render(
      <CommissionResultsTable
        data={mockResults}
        meta={mockMeta}
        currentPage={1}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Master Agent')).toBeInTheDocument();
    expect(screen.getByText('Player')).toBeInTheDocument();
  });

  it('renders share category badges', () => {
    render(
      <CommissionResultsTable
        data={mockResults}
        meta={mockMeta}
        currentPage={1}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Poker')).toBeInTheDocument();
    expect(screen.getByText('Casino')).toBeInTheDocument();
  });

  it('handles undefined meta gracefully', () => {
    render(
      <CommissionResultsTable
        data={mockResults}
        meta={undefined}
        currentPage={1}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    // Should show 0 results when meta is undefined (total defaults to 0)
    expect(screen.getByText('0 results')).toBeInTheDocument();
  });
});
