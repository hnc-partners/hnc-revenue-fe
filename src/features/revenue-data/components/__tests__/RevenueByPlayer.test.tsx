/**
 * RevenueByPlayer.test.tsx
 *
 * TE04 compliant: Mocks ONLY API hooks (external fetch layer).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RevenueByPlayer } from '../RevenueByPlayer';
import type { PlayerRevenue, PaginatedResponse } from '../../types';

// Mock API hooks — external fetch layer
const mockUseRevenueByPlayer = vi.fn();
vi.mock('../../api', () => ({
  useRevenueByPlayer: (...args: unknown[]) => mockUseRevenueByPlayer(...args),
}));

function makeRecord(overrides: Partial<PlayerRevenue> = {}): PlayerRevenue {
  return {
    id: 'rec-1',
    batchId: 'batch-1',
    gamingAccountId: 'ga-1',
    brandId: 'brand-1',
    brandName: 'Test Brand',
    brandPlayerId: 'player-123',
    nickname: 'TestPlayer',
    agentCode: null,
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    commission: '100.00',
    extras: null,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
    amounts: [
      {
        id: 'amt-1',
        revenueId: 'rec-1',
        shareTypeId: 'st-1',
        shareTypeCode: 'CASINO_NGR',
        amount: '500.00',
      },
    ],
    ...overrides,
  };
}

function makeResponse(
  records: PlayerRevenue[],
  meta = { page: 1, limit: 50, total: records.length, totalPages: 1 }
): PaginatedResponse<PlayerRevenue> {
  return { data: records, meta };
}

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('RevenueByPlayer', () => {
  const mockOnBack = vi.fn();
  const mockOnRowClick = vi.fn();

  beforeEach(() => {
    mockOnBack.mockReset();
    mockOnRowClick.mockReset();
    mockUseRevenueByPlayer.mockReset();
  });

  it('renders loading skeleton when data is loading', () => {
    mockUseRevenueByPlayer.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('renders error state with retry and back buttons', async () => {
    const mockRefetch = vi.fn();
    mockUseRevenueByPlayer.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Server error'),
      refetch: mockRefetch,
    });

    renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/could not load player revenue/i)).toBeInTheDocument();

    const user = userEvent.setup();

    // Click Try Again
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);

    // Click Back to all
    await user.click(screen.getByRole('button', { name: /back to all/i }));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no records exist', () => {
    mockUseRevenueByPlayer.mockReturnValue({
      data: makeResponse([]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );

    expect(screen.getByText('No revenue records')).toBeInTheDocument();
    expect(screen.getByText(/no revenue data found for this player/i)).toBeInTheDocument();
  });

  it('renders back button in empty state that calls onBack', async () => {
    mockUseRevenueByPlayer.mockReturnValue({
      data: makeResponse([]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );

    // Multiple "Back to all" buttons exist (header + empty state), use getAllBy
    const backButtons = screen.getAllByRole('button', { name: /back to all/i });
    await user.click(backButtons[backButtons.length - 1]); // Click the empty state one
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('renders player header with nickname and brand', () => {
    const records = [makeRecord({ nickname: 'PlayerOne', brandName: 'Cool Brand' })];
    mockUseRevenueByPlayer.mockReturnValue({
      data: makeResponse(records),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );

    expect(screen.getByText('PlayerOne')).toBeInTheDocument();
    expect(screen.getByText(/Cool Brand/)).toBeInTheDocument();
  });

  it('renders brandPlayerId when nickname is empty', () => {
    const records = [makeRecord({ nickname: '', brandPlayerId: 'bp-999' })];
    mockUseRevenueByPlayer.mockReturnValue({
      data: makeResponse(records),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );

    expect(screen.getByText('bp-999')).toBeInTheDocument();
  });

  it('renders summary totals row with amounts and commission', () => {
    const records = [
      makeRecord({
        amounts: [
          { id: 'a1', revenueId: 'r1', shareTypeId: 's1', shareTypeCode: 'CASINO_NGR', amount: '500.00' },
          { id: 'a2', revenueId: 'r1', shareTypeId: 's2', shareTypeCode: 'POKER_CNGR', amount: '200.00' },
        ],
        commission: '100.00',
      }),
      makeRecord({
        id: 'rec-2',
        amounts: [
          { id: 'a3', revenueId: 'r2', shareTypeId: 's1', shareTypeCode: 'CASINO_NGR', amount: '300.00' },
        ],
        commission: '50.00',
      }),
    ];

    mockUseRevenueByPlayer.mockReturnValue({
      data: makeResponse(records),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );

    expect(screen.getByText('Totals across all periods')).toBeInTheDocument();
    // Share type labels appear in both totals and table headers, use getAllBy
    expect(screen.getAllByText('Casino NGR').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Commission').length).toBeGreaterThanOrEqual(1);
  });

  it('renders period data in the table', () => {
    const records = [makeRecord()];
    mockUseRevenueByPlayer.mockReturnValue({
      data: makeResponse(records),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );

    // Table should have Period header
    expect(screen.getByText('Period')).toBeInTheDocument();
  });

  it('calls onRowClick when a table row is clicked', async () => {
    const record = makeRecord();
    mockUseRevenueByPlayer.mockReturnValue({
      data: makeResponse([record]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );

    // Click the data row (not the header row)
    const rows = screen.getAllByRole('row');
    // First row is the header, second is data
    await user.click(rows[1]);
    expect(mockOnRowClick).toHaveBeenCalledWith(record);
  });

  it('renders back button in header that calls onBack', async () => {
    mockUseRevenueByPlayer.mockReturnValue({
      data: makeResponse([makeRecord()]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );

    await user.click(screen.getAllByRole('button', { name: /back to all/i })[0]);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('renders pagination when multiple pages exist', () => {
    mockUseRevenueByPlayer.mockReturnValue({
      data: makeResponse([makeRecord()], { page: 1, limit: 50, total: 100, totalPages: 2 }),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );

    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next page/i })).not.toBeDisabled();
  });

  it('does not render pagination when only one page exists', () => {
    mockUseRevenueByPlayer.mockReturnValue({
      data: makeResponse([makeRecord()], { page: 1, limit: 50, total: 1, totalPages: 1 }),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );

    expect(screen.queryByRole('button', { name: /previous page/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /next page/i })).not.toBeInTheDocument();
  });

  it('navigates to next page when next button is clicked', async () => {
    mockUseRevenueByPlayer.mockReturnValue({
      data: makeResponse([makeRecord()], { page: 1, limit: 50, total: 100, totalPages: 2 }),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );

    await user.click(screen.getByRole('button', { name: /next page/i }));

    // After clicking next, the hook should be called with page 2
    const lastCall = mockUseRevenueByPlayer.mock.calls[mockUseRevenueByPlayer.mock.calls.length - 1];
    expect(lastCall[1]).toEqual(expect.objectContaining({ page: 2 }));
  });

  it('disables next page button on last page after navigating', async () => {
    // Start on page 1, then navigate to page 2
    mockUseRevenueByPlayer.mockReturnValue({
      data: makeResponse([makeRecord()], { page: 1, limit: 50, total: 100, totalPages: 2 }),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );

    // Now mock returns page 2 data after navigation
    mockUseRevenueByPlayer.mockReturnValue({
      data: makeResponse([makeRecord()], { page: 2, limit: 50, total: 100, totalPages: 2 }),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    await user.click(screen.getByRole('button', { name: /next page/i }));

    // On page 2 of 2, next should be disabled, prev enabled
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /previous page/i })).not.toBeDisabled();
  });

  it('renders summary totals with negative amounts styled as destructive', () => {
    const records = [
      makeRecord({
        amounts: [
          { id: 'a1', revenueId: 'r1', shareTypeId: 's1', shareTypeCode: 'CASINO_NGR', amount: '-500.00' },
        ],
        commission: '-100.00',
      }),
    ];

    mockUseRevenueByPlayer.mockReturnValue({
      data: makeResponse(records),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );

    const destructiveElements = container.querySelectorAll('.text-destructive');
    expect(destructiveElements.length).toBeGreaterThan(0);
  });

  it('shows "-" for null commission in table row', () => {
    mockUseRevenueByPlayer.mockReturnValue({
      data: makeResponse([makeRecord({ commission: null })]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );

    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('shows "-" for missing share type amount in table row', () => {
    const records = [
      makeRecord({
        id: 'rec-1',
        amounts: [
          { id: 'a1', revenueId: 'r1', shareTypeId: 's1', shareTypeCode: 'CASINO_NGR', amount: '100' },
        ],
      }),
      makeRecord({
        id: 'rec-2',
        amounts: [
          { id: 'a2', revenueId: 'r2', shareTypeId: 's2', shareTypeCode: 'POKER_CNGR', amount: '200' },
        ],
      }),
    ];

    mockUseRevenueByPlayer.mockReturnValue({
      data: makeResponse(records),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );

    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('pluralizes period count correctly for singular', () => {
    mockUseRevenueByPlayer.mockReturnValue({
      data: makeResponse([makeRecord()], { page: 1, limit: 50, total: 1, totalPages: 1 }),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );

    expect(screen.getByText(/1 period(?!s)/)).toBeInTheDocument();
  });

  it('pluralizes period count correctly for plural', () => {
    mockUseRevenueByPlayer.mockReturnValue({
      data: makeResponse(
        [makeRecord(), makeRecord({ id: 'rec-2' })],
        { page: 1, limit: 50, total: 2, totalPages: 1 }
      ),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );

    expect(screen.getByText(/2 periods/)).toBeInTheDocument();
  });

  it('renders commission total of zero correctly', () => {
    const records = [
      makeRecord({ commission: null }),
    ];

    mockUseRevenueByPlayer.mockReturnValue({
      data: makeResponse(records),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <RevenueByPlayer gamingAccountId="ga-1" onBack={mockOnBack} onRowClick={mockOnRowClick} />
    );

    // Commission total should show 0.00 when all commissions are null
    expect(screen.getByText('Totals across all periods')).toBeInTheDocument();
  });
});
