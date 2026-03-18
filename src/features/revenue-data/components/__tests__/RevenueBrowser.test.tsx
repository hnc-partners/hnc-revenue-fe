/**
 * RevenueBrowser.test.tsx
 *
 * TE04 compliant: Mocks ONLY API hooks (external fetch layer).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RevenueBrowser } from '../RevenueBrowser';
import type { PlayerRevenue, PaginatedResponse } from '../../types';

// Mock router — external navigation service
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock API hooks — external fetch layer
const mockUseRevenueRecords = vi.fn();
const mockUseBrandConfigs = vi.fn();
const mockUseRevenueByPlayer = vi.fn();

vi.mock('../../api', () => ({
  useRevenueRecords: (...args: unknown[]) => mockUseRevenueRecords(...args),
  useRevenueByPlayer: (...args: unknown[]) => mockUseRevenueByPlayer(...args),
}));

vi.mock('@/features/imports/api', () => ({
  useBrandConfigs: () => mockUseBrandConfigs(),
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

describe('RevenueBrowser', () => {
  beforeEach(() => {
    mockUseRevenueRecords.mockReset();
    mockUseBrandConfigs.mockReset();
    mockUseRevenueByPlayer.mockReset();

    // Default: brands loaded for filter dropdown
    mockUseBrandConfigs.mockReturnValue({
      data: [
        { brandId: 'b-1', brandName: 'Brand Alpha' },
        { brandId: 'b-2', brandName: 'Brand Beta' },
      ],
    });

    // Default: by-player hook not actively used from browser view
    mockUseRevenueByPlayer.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('renders page title "Revenue Data"', () => {
    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse([]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<RevenueBrowser />);
    expect(screen.getByText('Revenue Data')).toBeInTheDocument();
  });

  it('renders loading skeleton when data is loading', () => {
    mockUseRevenueRecords.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = renderWithQuery(<RevenueBrowser />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('renders error state with retry button', async () => {
    const mockRefetch = vi.fn();
    mockUseRevenueRecords.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    });

    renderWithQuery(<RevenueBrowser />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/could not load revenue records/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no records exist', () => {
    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse([]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<RevenueBrowser />);
    expect(screen.getByText('No revenue data')).toBeInTheDocument();
    expect(screen.getByText(/no revenue records found/i)).toBeInTheDocument();
  });

  it('renders table with data rows', () => {
    const records = [
      makeRecord({ brandPlayerId: 'player-A', nickname: 'Alpha' }),
      makeRecord({
        id: 'rec-2',
        brandPlayerId: 'player-B',
        nickname: 'Beta',
      }),
    ];

    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse(records),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<RevenueBrowser />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('player-A')).toBeInTheDocument();
    expect(screen.getByText('player-B')).toBeInTheDocument();
  });

  it('renders table column headers including dynamic share type columns', () => {
    const records = [
      makeRecord({
        amounts: [
          { id: 'a1', revenueId: 'r1', shareTypeId: 's1', shareTypeCode: 'CASINO_NGR', amount: '100' },
          { id: 'a2', revenueId: 'r1', shareTypeId: 's2', shareTypeCode: 'POKER_CNGR', amount: '200' },
        ],
      }),
    ];

    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse(records),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<RevenueBrowser />);

    // Static columns
    expect(screen.getByText('Brand Player ID')).toBeInTheDocument();
    expect(screen.getByText('Nickname')).toBeInTheDocument();
    expect(screen.getByText('Brand')).toBeInTheDocument();
    expect(screen.getByText('Period')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();

    // Dynamic share type columns
    expect(screen.getByText('Casino NGR')).toBeInTheDocument();
    expect(screen.getByText('Poker CNGR')).toBeInTheDocument();
  });

  it('displays record count in pagination area', () => {
    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse([makeRecord()], { page: 1, limit: 50, total: 1, totalPages: 1 }),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<RevenueBrowser />);
    expect(screen.getByText(/1 record/)).toBeInTheDocument();
  });

  it('displays pagination controls when multiple pages exist', () => {
    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse([makeRecord()], { page: 1, limit: 50, total: 100, totalPages: 2 }),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<RevenueBrowser />);
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next page/i })).not.toBeDisabled();
  });

  it('does not display pagination buttons for single page', () => {
    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse([makeRecord()], { page: 1, limit: 50, total: 1, totalPages: 1 }),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<RevenueBrowser />);
    expect(screen.queryByRole('button', { name: /previous page/i })).not.toBeInTheDocument();
  });

  it('opens side panel when a row is clicked', async () => {
    const record = makeRecord({ nickname: 'ClickMe' });
    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse([record]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(<RevenueBrowser />);

    // Click the data row
    const rows = screen.getAllByRole('row');
    await user.click(rows[1]); // First row is header

    // Side panel should show detail panel content
    expect(screen.getByText('Player Info')).toBeInTheDocument();
    expect(screen.getByText('Amounts')).toBeInTheDocument();
  });

  it('renders filter inputs', () => {
    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse([]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<RevenueBrowser />);

    // Gaming Account ID filter
    expect(screen.getByLabelText(/filter by gaming account id/i)).toBeInTheDocument();
    // Batch ID filter
    expect(screen.getByLabelText(/filter by batch id/i)).toBeInTheDocument();
    // Date filters
    expect(screen.getByLabelText(/period start from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/period start to/i)).toBeInTheDocument();
  });

  it('does not show clear button when no filters are active', () => {
    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse([]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<RevenueBrowser />);
    expect(screen.queryByText('Clear')).not.toBeInTheDocument();
  });

  it('shows "-" for missing nickname', () => {
    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse([makeRecord({ nickname: '' })]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<RevenueBrowser />);
    // The nickname cell shows '-' when empty
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('applies destructive styling to negative commission', () => {
    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse([makeRecord({ commission: '-50.00' })]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = renderWithQuery(<RevenueBrowser />);
    const destructiveElements = container.querySelectorAll('.text-destructive');
    expect(destructiveElements.length).toBeGreaterThan(0);
  });

  it('pluralizes record count correctly', () => {
    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse(
        [makeRecord(), makeRecord({ id: 'rec-2' })],
        { page: 1, limit: 50, total: 2, totalPages: 1 }
      ),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<RevenueBrowser />);
    expect(screen.getByText(/2 records/)).toBeInTheDocument();
  });

  it('navigates to next page when next page button is clicked', async () => {
    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse([makeRecord()], { page: 1, limit: 50, total: 100, totalPages: 2 }),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(<RevenueBrowser />);

    await user.click(screen.getByRole('button', { name: /next page/i }));

    // After clicking next, the hook should be called with page 2
    const lastCall = mockUseRevenueRecords.mock.calls[mockUseRevenueRecords.mock.calls.length - 1];
    expect(lastCall[0]).toEqual(expect.objectContaining({ page: 2 }));
  });

  it('closes side panel when close button is clicked', async () => {
    const record = makeRecord({ nickname: 'PanelPlayer' });
    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse([record]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(<RevenueBrowser />);

    // Open side panel by clicking a row
    const rows = screen.getAllByRole('row');
    await user.click(rows[1]);
    expect(screen.getByText('Player Info')).toBeInTheDocument();

    // Close the panel
    await user.click(screen.getByRole('button', { name: /close panel/i }));
    expect(screen.queryByText('Player Info')).not.toBeInTheDocument();
  });

  it('navigates to by-player view when "View all periods" is clicked from side panel', async () => {
    const record = makeRecord({ gamingAccountId: 'ga-nav-test', nickname: 'NavPlayer' });
    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse([record]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Set up by-player mock for when view switches
    mockUseRevenueByPlayer.mockReturnValue({
      data: { data: [record], meta: { page: 1, limit: 50, total: 1, totalPages: 1 } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(<RevenueBrowser />);

    // Open side panel
    const rows = screen.getAllByRole('row');
    await user.click(rows[1]);

    // Click "View all periods for this player"
    await user.click(screen.getByText(/view all periods/i));

    // Should now show by-player view with back button
    expect(screen.getByRole('button', { name: /back to all/i })).toBeInTheDocument();
  });

  it('returns to browser view when back button is clicked from by-player view', async () => {
    const record = makeRecord({ gamingAccountId: 'ga-back-test', nickname: 'BackPlayer' });
    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse([record]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    mockUseRevenueByPlayer.mockReturnValue({
      data: { data: [record], meta: { page: 1, limit: 50, total: 1, totalPages: 1 } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(<RevenueBrowser />);

    // Open side panel and go to by-player view
    const rows = screen.getAllByRole('row');
    await user.click(rows[1]);
    await user.click(screen.getByText(/view all periods/i));

    // Now click back to all
    await user.click(screen.getAllByRole('button', { name: /back to all/i })[0]);

    // Should be back on browser view with title
    expect(screen.getByText('Revenue Data')).toBeInTheDocument();
  });

  it('shows clear filters button when a filter is active and clears on click', async () => {
    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse([]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(<RevenueBrowser />);

    // Type into gaming account ID filter
    const gaInput = screen.getByLabelText(/filter by gaming account id/i);
    await user.type(gaInput, 'ga-123');

    // Clear button should now be visible
    expect(screen.getByText('Clear')).toBeInTheDocument();

    // Click clear
    await user.click(screen.getByText('Clear'));

    // Filter should be cleared — the Clear button should disappear
    expect(screen.queryByText('Clear')).not.toBeInTheDocument();
  });

  it('shows "-" for null commission', () => {
    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse([makeRecord({ commission: null })]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<RevenueBrowser />);
    // Commission column should show "-" when null
    const cells = screen.getAllByText('-');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('shows "-" for missing share type amount in a row', () => {
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

    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse(records),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<RevenueBrowser />);
    // Each record is missing one share type column → "-" should appear
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('applies filter changes and resets page to 1', async () => {
    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse([makeRecord()], { page: 2, limit: 50, total: 100, totalPages: 2 }),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(<RevenueBrowser />);

    // Type into batch ID filter
    const batchInput = screen.getByLabelText(/filter by batch id/i);
    await user.type(batchInput, 'b-123');

    // After filter change, page should reset to 1
    const lastCall = mockUseRevenueRecords.mock.calls[mockUseRevenueRecords.mock.calls.length - 1];
    expect(lastCall[0]).toEqual(expect.objectContaining({ page: 1 }));
  });

  it('updates date filters correctly', async () => {
    mockUseRevenueRecords.mockReturnValue({
      data: makeResponse([]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(<RevenueBrowser />);

    const startInput = screen.getByLabelText(/period start from/i);
    await user.type(startInput, '2026-01-01');

    // Clear button should appear since a filter is active
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });
});
