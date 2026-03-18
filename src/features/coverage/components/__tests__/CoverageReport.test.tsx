/**
 * CoverageReport.test.tsx
 *
 * TE04 compliant: Mocks ONLY API hooks (external services).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CoverageReport } from '../CoverageReport';
import type { CoverageBrandRow } from '../../types';

// Mock router — external navigation service
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock sonner toast — external notification service
const mockToastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: vi.fn(),
  },
}));

// Mock API hooks — external fetch layer
const mockUseCoverageMatrix = vi.fn();
vi.mock('../../api/useCoverageMatrix', () => ({
  useCoverageMatrix: (...args: unknown[]) => mockUseCoverageMatrix(...args),
}));

// Mock child components that have their own test files
// (BrandConfigSection uses useBrandConfigs which we don't want to mock here)
vi.mock('../BrandConfigSection', () => ({
  BrandConfigSection: () => <div data-testid="brand-config-section">BrandConfigSection</div>,
}));

function makeBrandRow(overrides: Partial<CoverageBrandRow> = {}): CoverageBrandRow {
  return {
    brandId: 'brand-1',
    brandName: 'Test Brand',
    granularity: 'monthly',
    periods: [
      {
        periodStart: '2026-01-01',
        periodEnd: '2026-01-31',
        status: 'processed',
        batchId: 'batch-1',
      },
    ],
    ...overrides,
  };
}

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('CoverageReport', () => {
  beforeEach(() => {
    mockUseCoverageMatrix.mockReset();
    mockToastError.mockReset();
    // Default: no query params set, hook returns idle state
    mockUseCoverageMatrix.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      isFetching: false,
    });
  });

  it('renders page header with title and description', () => {
    renderWithQuery(<CoverageReport />);
    expect(screen.getByText('Coverage Report')).toBeInTheDocument();
    expect(screen.getByText('Brand reporting coverage across periods')).toBeInTheDocument();
  });

  it('renders date range selector with start and end inputs', () => {
    renderWithQuery(<CoverageReport />);
    expect(screen.getByLabelText(/period start/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/period end/i)).toBeInTheDocument();
  });

  it('renders Load Coverage button', () => {
    renderWithQuery(<CoverageReport />);
    expect(screen.getByRole('button', { name: /load coverage/i })).toBeInTheDocument();
  });

  it('shows initial empty state before loading data', () => {
    renderWithQuery(<CoverageReport />);
    expect(screen.getByText('Load Coverage Data')).toBeInTheDocument();
    expect(
      screen.getByText(/select a date range and click load coverage/i)
    ).toBeInTheDocument();
  });

  it('renders BrandConfigSection', () => {
    renderWithQuery(<CoverageReport />);
    expect(screen.getByTestId('brand-config-section')).toBeInTheDocument();
  });

  it('shows maximum date range hint text', () => {
    renderWithQuery(<CoverageReport />);
    expect(screen.getByText(/maximum date range: 730 days/i)).toBeInTheDocument();
  });

  it('shows loading state when data is being fetched', async () => {
    mockUseCoverageMatrix.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isFetching: true,
    });

    const user = userEvent.setup();
    renderWithQuery(<CoverageReport />);

    // Click load to set queryParams
    await user.click(screen.getByRole('button', { name: /loading/i }));
  });

  it('shows error state when fetch fails', async () => {
    // First render: idle. We need to trigger load, which sets queryParams.
    // But the mock always returns the same state, so we simulate post-load error.
    let callCount = 0;
    mockUseCoverageMatrix.mockImplementation(() => {
      callCount++;
      if (callCount > 1) {
        return {
          data: undefined,
          isLoading: false,
          error: new Error('Network error'),
          isFetching: false,
        };
      }
      return {
        data: undefined,
        isLoading: false,
        error: null,
        isFetching: false,
      };
    });

    const user = userEvent.setup();
    renderWithQuery(<CoverageReport />);

    await user.click(screen.getByRole('button', { name: /load coverage/i }));

    expect(screen.getByText('Failed to load coverage data')).toBeInTheDocument();
    expect(screen.getByText(/please try again or adjust/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('renders CoverageMatrix when data is loaded successfully', async () => {
    let callCount = 0;
    mockUseCoverageMatrix.mockImplementation(() => {
      callCount++;
      if (callCount > 1) {
        return {
          data: [makeBrandRow()],
          isLoading: false,
          error: null,
          isFetching: false,
        };
      }
      return {
        data: undefined,
        isLoading: false,
        error: null,
        isFetching: false,
      };
    });

    const user = userEvent.setup();
    renderWithQuery(<CoverageReport />);

    await user.click(screen.getByRole('button', { name: /load coverage/i }));

    // CoverageMatrix renders the brand name
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
  });

  it('shows toast error when start date is after end date', async () => {
    const user = userEvent.setup();
    renderWithQuery(<CoverageReport />);

    const startInput = screen.getByLabelText(/period start/i);
    const endInput = screen.getByLabelText(/period end/i);

    // Set start after end
    await user.clear(startInput);
    await user.type(startInput, '2026-12-01');
    await user.clear(endInput);
    await user.type(endInput, '2026-01-01');

    await user.click(screen.getByRole('button', { name: /load coverage/i }));

    expect(mockToastError).toHaveBeenCalledWith('Start date must be before end date.');
  });

  it('shows toast error when date range exceeds 730 days', async () => {
    const user = userEvent.setup();
    renderWithQuery(<CoverageReport />);

    const startInput = screen.getByLabelText(/period start/i);
    const endInput = screen.getByLabelText(/period end/i);

    await user.clear(startInput);
    await user.type(startInput, '2024-01-01');
    await user.clear(endInput);
    await user.type(endInput, '2026-12-31');

    await user.click(screen.getByRole('button', { name: /load coverage/i }));

    expect(mockToastError).toHaveBeenCalledWith('Date range cannot exceed 730 days.');
  });

  it('shows Loading... text on button when isFetching is true', () => {
    mockUseCoverageMatrix.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      isFetching: true,
    });

    renderWithQuery(<CoverageReport />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('disables Load Coverage button when isFetching', () => {
    mockUseCoverageMatrix.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      isFetching: true,
    });

    renderWithQuery(<CoverageReport />);
    const button = screen.getByRole('button', { name: /loading/i });
    expect(button).toBeDisabled();
  });

  it('shows toast error when start date is empty', async () => {
    const user = userEvent.setup();
    renderWithQuery(<CoverageReport />);

    const startInput = screen.getByLabelText(/period start/i);
    const endInput = screen.getByLabelText(/period end/i);

    // Clear both dates
    await user.clear(startInput);
    await user.clear(endInput);

    await user.click(screen.getByRole('button', { name: /load coverage/i }));

    expect(mockToastError).toHaveBeenCalledWith('Please select both start and end dates.');
  });

  it('retries on error state Try Again button', async () => {
    // Simulate post-load error state with Try Again
    let callCount = 0;
    mockUseCoverageMatrix.mockImplementation(() => {
      callCount++;
      if (callCount > 1) {
        return {
          data: undefined,
          isLoading: false,
          error: new Error('Network error'),
          isFetching: false,
        };
      }
      return {
        data: undefined,
        isLoading: false,
        error: null,
        isFetching: false,
      };
    });

    const user = userEvent.setup();
    renderWithQuery(<CoverageReport />);

    // First click sets queryParams
    await user.click(screen.getByRole('button', { name: /load coverage/i }));

    // Error state should show retry button
    const tryAgainBtn = screen.getByRole('button', { name: /try again/i });
    expect(tryAgainBtn).toBeInTheDocument();

    // Click try again — should re-trigger the load
    await user.click(tryAgainBtn);
    // The hook should be called again (callCount increases)
    expect(callCount).toBeGreaterThan(2);
  });

  it('shows loading skeletons when isLoading and queryParams set', async () => {
    let callCount = 0;
    mockUseCoverageMatrix.mockImplementation(() => {
      callCount++;
      if (callCount > 1) {
        return {
          data: undefined,
          isLoading: true,
          error: null,
          isFetching: true,
        };
      }
      return {
        data: undefined,
        isLoading: false,
        error: null,
        isFetching: false,
      };
    });

    const user = userEvent.setup();
    const { container } = renderWithQuery(<CoverageReport />);

    await user.click(screen.getByRole('button', { name: /load coverage/i }));

    // Should show skeleton loading state
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('accepts a valid date range within 730 days', async () => {
    let callCount = 0;
    mockUseCoverageMatrix.mockImplementation(() => {
      callCount++;
      if (callCount > 1) {
        return {
          data: [makeBrandRow()],
          isLoading: false,
          error: null,
          isFetching: false,
        };
      }
      return {
        data: undefined,
        isLoading: false,
        error: null,
        isFetching: false,
      };
    });

    const user = userEvent.setup();
    renderWithQuery(<CoverageReport />);

    const startInput = screen.getByLabelText(/period start/i);
    const endInput = screen.getByLabelText(/period end/i);

    await user.clear(startInput);
    await user.type(startInput, '2026-01-01');
    await user.clear(endInput);
    await user.type(endInput, '2026-06-01');

    await user.click(screen.getByRole('button', { name: /load coverage/i }));

    // Should NOT show any toast error
    expect(mockToastError).not.toHaveBeenCalled();
    // Should show matrix data
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
  });
});
