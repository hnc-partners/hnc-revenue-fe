/**
 * GapsPage.test.tsx
 *
 * TE04 compliant: Mocks ONLY API hooks and router (external services).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GapsPage } from '../GapsPage';
import type { RMGapResult } from '../../types/gaps';

// Mock router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={props.to}>{children}</a>
  ),
}));

// Mock API hooks
const mockUseGaps = vi.fn();
vi.mock('../../api/useGaps', () => ({
  useGaps: (...args: unknown[]) => mockUseGaps(...args),
}));

function makeGap(overrides: Partial<RMGapResult> = {}): RMGapResult {
  return {
    brandCode: 'brand-a',
    brandName: 'Brand A',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    status: 'received',
    ...overrides,
  };
}

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('GapsPage', () => {
  beforeEach(() => {
    mockUseGaps.mockReset();
  });

  it('renders loading skeleton', () => {
    mockUseGaps.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = renderWithQuery(<GapsPage />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('renders error state with retry', async () => {
    const refetch = vi.fn();
    mockUseGaps.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('fail'),
      refetch,
    });

    renderWithQuery(<GapsPage />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it('renders "All Periods Covered" when no gaps', () => {
    mockUseGaps.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<GapsPage />);
    expect(screen.getByText('All Periods Covered')).toBeInTheDocument();
  });

  it('renders gap matrix with brand rows and period columns', () => {
    mockUseGaps.mockReturnValue({
      data: [
        makeGap({ brandCode: 'brand-a', brandName: 'Brand A', periodStart: '2026-01-01', status: 'received' }),
        makeGap({ brandCode: 'brand-a', brandName: 'Brand A', periodStart: '2026-02-01', status: 'missing' }),
        makeGap({ brandCode: 'brand-b', brandName: 'Brand B', periodStart: '2026-01-01', status: 'failed' }),
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<GapsPage />);
    expect(screen.getByText('Brand A')).toBeInTheDocument();
    expect(screen.getByText('Brand B')).toBeInTheDocument();
    // Should show period column labels
    expect(screen.getByText('Jan 01')).toBeInTheDocument();
    expect(screen.getByText('Feb 01')).toBeInTheDocument();
  });

  it('renders summary badges with counts', () => {
    mockUseGaps.mockReturnValue({
      data: [
        makeGap({ status: 'received' }),
        makeGap({ brandCode: 'brand-b', brandName: 'Brand B', status: 'missing' }),
        makeGap({ brandCode: 'brand-c', brandName: 'Brand C', status: 'failed' }),
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<GapsPage />);
    expect(screen.getByText(/1 Received/)).toBeInTheDocument();
    expect(screen.getByText(/1 Missing/)).toBeInTheDocument();
    expect(screen.getByText(/1 Failed/)).toBeInTheDocument();
  });

  it('renders date filter inputs', () => {
    mockUseGaps.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<GapsPage />);
    expect(screen.getByLabelText('Start date')).toBeInTheDocument();
    expect(screen.getByLabelText('End date')).toBeInTheDocument();
  });

  it('renders brand filter input', () => {
    mockUseGaps.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<GapsPage />);
    expect(screen.getByLabelText('Filter brands')).toBeInTheDocument();
  });

  it('filters brands in matrix when filter is typed', async () => {
    mockUseGaps.mockReturnValue({
      data: [
        makeGap({ brandCode: 'brand-a', brandName: 'Alpha Brand' }),
        makeGap({ brandCode: 'brand-b', brandName: 'Beta Brand' }),
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(<GapsPage />);

    await user.type(screen.getByLabelText('Filter brands'), 'Alpha');

    expect(screen.getByText('Alpha Brand')).toBeInTheDocument();
    expect(screen.queryByText('Beta Brand')).not.toBeInTheDocument();
  });

  it('shows "no brands match" message when filter has no results', async () => {
    mockUseGaps.mockReturnValue({
      data: [makeGap()],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(<GapsPage />);

    await user.type(screen.getByLabelText('Filter brands'), 'nonexistent');
    expect(screen.getByText(/no brands match/i)).toBeInTheDocument();
  });

  it('renders page header with back button and title', () => {
    mockUseGaps.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<GapsPage />);
    expect(screen.getByText('Statement Gaps')).toBeInTheDocument();
    expect(screen.getByText('Back to Statements')).toBeInTheDocument();
  });

  it('renders legend with all status types', () => {
    mockUseGaps.mockReturnValue({
      data: [makeGap()],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<GapsPage />);
    // Legend + summary badges may produce duplicates; use getAllByText
    expect(screen.getAllByText('Received').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Missing').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Failed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Partial').length).toBeGreaterThanOrEqual(1);
  });
});
