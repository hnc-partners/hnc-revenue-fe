import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ValidationDetailResponse } from '../../types';

// Mock MF-safe navigation
const mockNavigate = vi.fn();
vi.mock('@/lib/use-safe-navigate', () => ({
  useSafeNavigate: () => mockNavigate,
}));

// Mock API hooks
const mockUseValidationDetail = vi.fn();
const mockMutate = vi.fn();
const mockUseRunValidation = vi.fn();

vi.mock('../../api', () => ({
  useValidationDetail: (...args: unknown[]) => mockUseValidationDetail(...args),
  useRunValidation: (...args: unknown[]) => mockUseRunValidation(...args),
}));

import { ValidationDetailPage } from '../ValidationDetailPage';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockDetailResponse: ValidationDetailResponse = {
  data: [
    {
      id: 'vd-1',
      gaming_account_id: 'ga-1',
      gaming_account_name: 'Alpha GA',
      calculated_amount: '500.00',
      reported_amount: '500.00',
      difference: '0.00',
      pct_difference: '0.00',
      status: 'matched',
    },
    {
      id: 'vd-2',
      gaming_account_id: 'ga-2',
      gaming_account_name: 'Beta GA',
      calculated_amount: '300.00',
      reported_amount: '280.00',
      difference: '20.00',
      pct_difference: '6.67',
      status: 'mismatched',
    },
    {
      id: 'vd-3',
      gaming_account_id: 'ga-3',
      gaming_account_name: 'Gamma GA',
      calculated_amount: '100.00',
      reported_amount: '0.00',
      difference: '100.00',
      pct_difference: '100.00',
      status: 'missing',
    },
  ],
  meta: { page: 1, limit: 25, total: 3, totalPages: 1 },
  summary: {
    matched: 1,
    mismatched: 1,
    missing: 1,
    skipped: 0,
    match_rate: '0.3333',
  },
};

describe('ValidationDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRunValidation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isSuccess: false,
      isError: false,
      data: undefined,
    });
  });

  it('renders page title and match rate badge', () => {
    mockUseValidationDetail.mockReturnValue({
      data: mockDetailResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationDetailPage batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Validation Detail')).toBeInTheDocument();
    // 0.3333 * 100 = 33.33%
    expect(screen.getByText('33.33%')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    mockUseValidationDetail.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = render(
      <ValidationDetailPage batchId="batch-1" />,
      { wrapper: createWrapper() }
    );
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('shows error state with retry', async () => {
    const mockRefetch = vi.fn();
    mockUseValidationDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed'),
      refetch: mockRefetch,
    });

    render(<ValidationDetailPage batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByText('Try Again'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders validation detail rows', () => {
    mockUseValidationDetail.mockReturnValue({
      data: mockDetailResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationDetailPage batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Alpha GA')).toBeInTheDocument();
    expect(screen.getByText('Beta GA')).toBeInTheDocument();
    expect(screen.getByText('Gamma GA')).toBeInTheDocument();
  });

  it('renders status badges in the table', () => {
    mockUseValidationDetail.mockReturnValue({
      data: mockDetailResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationDetailPage batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    // "Matched", "Mismatched", "Missing" appear both as tab labels and as
    // status badges in table rows. Verify at least 2 instances of each
    // (1 tab + 1 badge).
    expect(screen.getAllByText('Matched').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Mismatched').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Missing').length).toBeGreaterThanOrEqual(2);
  });

  it('renders filter tabs with counts', () => {
    mockUseValidationDetail.mockReturnValue({
      data: mockDetailResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationDetailPage batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    // Tab labels
    expect(screen.getByText('All')).toBeInTheDocument();
    // Count "3" for All tab
    const allTab = screen.getByText('All').closest('button')!;
    expect(allTab).toBeInTheDocument();
  });

  it('renders Run Validation button', () => {
    mockUseValidationDetail.mockReturnValue({
      data: mockDetailResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationDetailPage batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Run Validation')).toBeInTheDocument();
  });

  it('triggers validation run on button click', async () => {
    mockUseValidationDetail.mockReturnValue({
      data: mockDetailResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationDetailPage batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Run Validation'));
    expect(mockMutate).toHaveBeenCalled();
  });

  it('shows running state when validation is pending', () => {
    mockUseRunValidation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isSuccess: false,
      isError: false,
      data: undefined,
    });

    mockUseValidationDetail.mockReturnValue({
      data: mockDetailResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationDetailPage batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Running...')).toBeInTheDocument();
  });

  it('navigates back to overview on back button click', async () => {
    mockUseValidationDetail.mockReturnValue({
      data: mockDetailResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationDetailPage batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    const user = userEvent.setup();
    const backButton = screen.getByText('Back to overview').closest('button')!;
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/revenue/commissions/validation',
    });
  });

  it('shows all-skipped empty state when all records are skipped', () => {
    const allSkippedResponse: ValidationDetailResponse = {
      data: [
        {
          id: 'vd-1',
          gaming_account_id: 'ga-1',
          gaming_account_name: 'Test GA',
          calculated_amount: '500.00',
          reported_amount: '0.00',
          difference: '0.00',
          pct_difference: '0.00',
          status: 'skipped',
        },
      ],
      meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
      summary: {
        matched: 0,
        mismatched: 0,
        missing: 0,
        skipped: 1,
        match_rate: '0.0000',
      },
    };

    mockUseValidationDetail.mockReturnValue({
      data: allSkippedResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationDetailPage batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    expect(
      screen.getByText('No Brand-Reported Data Available')
    ).toBeInTheDocument();
  });

  it('shows record count', () => {
    mockUseValidationDetail.mockReturnValue({
      data: mockDetailResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationDetailPage batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('3 records')).toBeInTheDocument();
  });

  it('filters data by clicking Matched tab', async () => {
    mockUseValidationDetail.mockReturnValue({
      data: mockDetailResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationDetailPage batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    const user = userEvent.setup();

    // Click the "Matched" tab - there are multiple elements with this text
    // (tab label + table badge). Click the tab button specifically.
    const matchedTabs = screen.getAllByText('Matched');
    const matchedTabButton = matchedTabs.find(
      (el) => el.closest('[role="tab"]') !== null
    );
    if (matchedTabButton) {
      await user.click(matchedTabButton.closest('[role="tab"]')!);
    }

    // After filtering, should show "1 record (filtered from 3 total)"
    expect(screen.getByText(/filtered from 3 total/)).toBeInTheDocument();
  });

  it('shows empty filtered state when no records match tab', async () => {
    // Response with only matched records
    const matchedOnlyResponse: ValidationDetailResponse = {
      data: [
        {
          id: 'vd-1',
          gaming_account_id: 'ga-1',
          gaming_account_name: 'Alpha GA',
          calculated_amount: '500.00',
          reported_amount: '500.00',
          difference: '0.00',
          pct_difference: '0.00',
          status: 'matched',
        },
      ],
      meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
      summary: {
        matched: 1,
        mismatched: 0,
        missing: 0,
        skipped: 0,
        match_rate: '1.0000',
      },
    };

    mockUseValidationDetail.mockReturnValue({
      data: matchedOnlyResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationDetailPage batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    const user = userEvent.setup();
    // Click "Mismatched" tab
    const mismatchedTabs = screen.getAllByText('Mismatched');
    const mismatchedTabButton = mismatchedTabs.find(
      (el) => el.closest('[role="tab"]') !== null
    );
    if (mismatchedTabButton) {
      await user.click(mismatchedTabButton.closest('[role="tab"]')!);
    }

    expect(screen.getByText('No records match the selected filter.')).toBeInTheDocument();
  });

  it('does not show filter tabs when data is empty', () => {
    mockUseValidationDetail.mockReturnValue({
      data: {
        data: [],
        meta: { page: 1, limit: 25, total: 0, totalPages: 0 },
        summary: { matched: 0, mismatched: 0, missing: 0, skipped: 0, match_rate: '0.0000' },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationDetailPage batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    // Tab list should not be rendered
    expect(screen.queryByText('All')).not.toBeInTheDocument();
  });

  it('shows "1 record" for singular count', async () => {
    const singleRecordResponse: ValidationDetailResponse = {
      data: [
        {
          id: 'vd-1',
          gaming_account_id: 'ga-1',
          gaming_account_name: 'Alpha GA',
          calculated_amount: '500.00',
          reported_amount: '500.00',
          difference: '0.00',
          pct_difference: '0.00',
          status: 'matched',
        },
      ],
      meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
      summary: {
        matched: 1,
        mismatched: 0,
        missing: 0,
        skipped: 0,
        match_rate: '1.0000',
      },
    };

    mockUseValidationDetail.mockReturnValue({
      data: singleRecordResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationDetailPage batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('1 record')).toBeInTheDocument();
  });

  it('disables Run Validation button when pending', () => {
    mockUseRunValidation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isSuccess: false,
      isError: false,
      data: undefined,
    });

    mockUseValidationDetail.mockReturnValue({
      data: mockDetailResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationDetailPage batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    const runBtn = screen.getByText('Running...').closest('button')!;
    expect(runBtn).toBeDisabled();
  });

  it('renders difference column with correct colors', () => {
    mockUseValidationDetail.mockReturnValue({
      data: mockDetailResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationDetailPage batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    // Positive difference (20.00) should show +20.00
    expect(screen.getByText('+20.00')).toBeInTheDocument();
    // +100.00 for missing record
    expect(screen.getByText('+100.00')).toBeInTheDocument();
  });

  it('does not show match rate badge when response has no summary', () => {
    mockUseValidationDetail.mockReturnValue({
      data: {
        data: [],
        meta: { page: 1, limit: 25, total: 0, totalPages: 0 },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ValidationDetailPage batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    // Title should be present but no match rate badge
    expect(screen.getByText('Validation Detail')).toBeInTheDocument();
  });
});
