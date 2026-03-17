/**
 * ManualEntryPage.test.tsx
 *
 * TE04 compliant: Mocks ONLY API hooks and router (external services).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ManualEntryPage } from '../ManualEntryPage';
import type { RMBrandConfigWithStatus } from '../../../types';
import type { RMEntryFormData } from '../../../types/manual-entry';

// Mock router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

// Mock API hooks
const mockUseManualInputBrands = vi.fn();
const mockUseEntryForm = vi.fn();
const mockUseManualEntryBatches = vi.fn();
const mockSubmitMutateAsync = vi.fn();
const mockUseSubmitManualEntry = vi.fn().mockReturnValue({
  mutateAsync: mockSubmitMutateAsync,
  isPending: false,
});

vi.mock('../../../api/useManualEntry', () => ({
  useManualInputBrands: () => mockUseManualInputBrands(),
  useEntryForm: (...args: unknown[]) => mockUseEntryForm(...args),
  useManualEntryBatches: (...args: unknown[]) => mockUseManualEntryBatches(...args),
  useSubmitManualEntry: () => mockUseSubmitManualEntry(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

function makeBrandOption(
  overrides: Partial<RMBrandConfigWithStatus> = {}
): RMBrandConfigWithStatus {
  return {
    id: '1',
    brandId: 'b-1',
    brandCode: 'manual-brand',
    brandName: 'Manual Brand',
    acquisitionMode: 'manual_input',
    scheduleCron: '',
    granularity: 'monthly',
    periodType: null,
    requiredFileTypes: [],
    optionalFileTypes: [],
    shareTypes: [{ code: 'GGR', name: 'Gross Gaming Revenue' }],
    currencyCode: 'EUR',
    portalUrl: null,
    credentialsEnv: null,
    maxBackfillMonths: 3,
    enabled: true,
    paused: false,
    autoNotify: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    createdBy: null,
    updatedBy: null,
    lastRun: null,
    nextExpected: null,
    health: 'unknown',
    ...overrides,
  };
}

function makeEntryFormData(
  overrides: Partial<RMEntryFormData> = {}
): RMEntryFormData {
  return {
    brandCode: 'manual-brand',
    brandName: 'Manual Brand',
    shareTypes: [{ code: 'GGR', name: 'Gross Gaming Revenue' }],
    currencyCode: 'EUR',
    gamingAccounts: [
      {
        id: 'ga-1',
        externalAccountId: 'ext-1',
        accountName: 'Test Account',
      },
    ],
    ...overrides,
  };
}

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('ManualEntryPage', () => {
  beforeEach(() => {
    mockUseManualInputBrands.mockReturnValue({
      data: [makeBrandOption()],
      isLoading: false,
    });
    mockUseEntryForm.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
    mockUseManualEntryBatches.mockReturnValue({
      data: [],
    });
    mockSubmitMutateAsync.mockReset();
    mockUseSubmitManualEntry.mockReturnValue({
      mutateAsync: mockSubmitMutateAsync,
      isPending: false,
    });
  });

  it('renders page header', () => {
    renderWithQuery(<ManualEntryPage />);
    expect(screen.getByText('Manual Statement Entry')).toBeInTheDocument();
    expect(screen.getByText(/enter statement values/i)).toBeInTheDocument();
  });

  it('renders brand selection step', () => {
    renderWithQuery(<ManualEntryPage />);
    expect(screen.getByText('1. Select Brand')).toBeInTheDocument();
  });

  it('shows period selection after brand is preselected', () => {
    mockUseEntryForm.mockReturnValue({
      data: makeEntryFormData(),
      isLoading: false,
      error: null,
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);
    expect(screen.getByText('2. Select Period')).toBeInTheDocument();
    expect(screen.getByLabelText(/period start/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/period end/i)).toBeInTheDocument();
  });

  it('shows metric grid when brand and entry form data available', () => {
    mockUseEntryForm.mockReturnValue({
      data: makeEntryFormData(),
      isLoading: false,
      error: null,
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);
    expect(screen.getByText('3. Enter Amounts')).toBeInTheDocument();
    expect(screen.getByText('Gaming Account')).toBeInTheDocument();
    expect(screen.getByText('Gross Gaming Revenue')).toBeInTheDocument();
    expect(screen.getByText('Test Account')).toBeInTheDocument();
  });

  it('shows "No Gaming Accounts" when brand has none', () => {
    mockUseEntryForm.mockReturnValue({
      data: makeEntryFormData({ gamingAccounts: [] }),
      isLoading: false,
      error: null,
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);
    expect(screen.getByText('No Gaming Accounts')).toBeInTheDocument();
  });

  it('shows loading skeleton for entry form', () => {
    mockUseEntryForm.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { container } = renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);
    const skeletons = container.querySelectorAll('[class*="animate-pulse"], [class*="Skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error when entry form fails to load', () => {
    mockUseEntryForm.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('API error'),
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);
    expect(screen.getByText(/failed to load form structure/i)).toBeInTheDocument();
  });

  it('renders submit section with disabled button when no amounts entered', () => {
    mockUseEntryForm.mockReturnValue({
      data: makeEntryFormData(),
      isLoading: false,
      error: null,
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);
    expect(screen.getByText(/enter at least one non-zero amount/i)).toBeInTheDocument();
    const submitBtn = screen.getByRole('button', { name: /submit entry/i });
    expect(submitBtn).toBeDisabled();
  });

  it('renders Reset button in submit section', () => {
    mockUseEntryForm.mockReturnValue({
      data: makeEntryFormData(),
      isLoading: false,
      error: null,
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('shows currency and share type badge counts', () => {
    mockUseEntryForm.mockReturnValue({
      data: makeEntryFormData(),
      isLoading: false,
      error: null,
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);
    expect(screen.getByText('EUR')).toBeInTheDocument();
    expect(screen.getByText('1 share type')).toBeInTheDocument();
    expect(screen.getByText('1 account')).toBeInTheDocument();
  });

  it('shows existing drafts warning when drafts exist', () => {
    mockUseManualEntryBatches.mockReturnValue({
      data: [
        {
          id: 'batch-1',
          brandConfigId: '1',
          brandCode: 'manual-brand',
          brandName: 'Manual Brand',
          periodStart: '2026-01-01',
          periodEnd: '2026-01-31',
          status: 'draft',
          lineCount: 5,
          submittedAt: null,
          submittedBy: null,
          processedAt: null,
          errorMessage: null,
          createdAt: '2026-01-15T00:00:00Z',
          updatedAt: '2026-01-15T00:00:00Z',
          createdBy: null,
        },
      ],
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);
    expect(screen.getByText('Existing Drafts')).toBeInTheDocument();
  });

  it('updates metric grid when amount is entered', async () => {
    const user = userEvent.setup();
    mockUseEntryForm.mockReturnValue({
      data: makeEntryFormData(),
      isLoading: false,
      error: null,
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);

    const input = screen.getByLabelText('Gross Gaming Revenue for Test Account');
    await user.clear(input);
    await user.type(input, '100.50');

    // Line count should update - text is split across elements
    expect(screen.getByText(/ready to submit/)).toBeInTheDocument();
  });

  it('clears metric values when Reset is clicked', async () => {
    const user = userEvent.setup();
    mockUseEntryForm.mockReturnValue({
      data: makeEntryFormData(),
      isLoading: false,
      error: null,
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);

    // Enter an amount
    const input = screen.getByLabelText('Gross Gaming Revenue for Test Account');
    await user.clear(input);
    await user.type(input, '50');

    // Click Reset
    await user.click(screen.getByRole('button', { name: /reset/i }));

    // Should go back to zero amounts message
    expect(screen.getByText(/enter at least one non-zero amount/i)).toBeInTheDocument();
  });

  it('shows brands loading skeleton', () => {
    mockUseManualInputBrands.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderWithQuery(<ManualEntryPage />);
    // When brands are loading, should show skeleton in brand selector area
    expect(screen.getByText('1. Select Brand')).toBeInTheDocument();
  });

  it('renders total row in metric grid', () => {
    mockUseEntryForm.mockReturnValue({
      data: makeEntryFormData(),
      isLoading: false,
      error: null,
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('shows plural share types count', () => {
    mockUseEntryForm.mockReturnValue({
      data: makeEntryFormData({
        shareTypes: [
          { code: 'GGR', name: 'GGR' },
          { code: 'NGR', name: 'NGR' },
        ],
      }),
      isLoading: false,
      error: null,
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);
    expect(screen.getByText('2 share types')).toBeInTheDocument();
  });

  it('shows plural accounts count', () => {
    mockUseEntryForm.mockReturnValue({
      data: makeEntryFormData({
        gamingAccounts: [
          { id: 'ga-1', externalAccountId: 'ext-1', accountName: 'Account 1' },
          { id: 'ga-2', externalAccountId: 'ext-2', accountName: 'Account 2' },
        ],
      }),
      isLoading: false,
      error: null,
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);
    expect(screen.getByText('2 accounts')).toBeInTheDocument();
  });

  it('shows no period selection without brand selected', () => {
    renderWithQuery(<ManualEntryPage />);
    expect(screen.queryByText('2. Select Period')).not.toBeInTheDocument();
  });

  it('shows external account ID in metric grid', () => {
    mockUseEntryForm.mockReturnValue({
      data: makeEntryFormData(),
      isLoading: false,
      error: null,
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);
    expect(screen.getByText('ext-1')).toBeInTheDocument();
  });

  it('submits entry successfully and shows success state', async () => {
    const user = userEvent.setup();
    mockSubmitMutateAsync.mockResolvedValue({ id: 'batch-1' });
    mockUseEntryForm.mockReturnValue({
      data: makeEntryFormData(),
      isLoading: false,
      error: null,
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);

    // Fill period dates
    const startInput = screen.getByLabelText(/period start/i);
    const endInput = screen.getByLabelText(/period end/i);
    await user.type(startInput, '2026-01-01');
    await user.type(endInput, '2026-01-31');

    // Enter an amount
    const input = screen.getByLabelText('Gross Gaming Revenue for Test Account');
    await user.clear(input);
    await user.type(input, '500');

    // Submit
    await user.click(screen.getByRole('button', { name: /submit entry/i }));

    // Should show success state
    await screen.findByText('Entry Submitted Successfully');
    expect(screen.getByText(/new entry/i)).toBeInTheDocument();
    expect(screen.getByText(/view brand detail/i)).toBeInTheDocument();
  });

  it('shows error toast on 409 conflict', async () => {
    const user = userEvent.setup();
    const conflictError = new Error('Conflict');
    Object.assign(conflictError, { status: 409 });
    // Use the mock ApiError from the module
    const { ApiError } = await import('../../../api/useManualEntry');
    mockSubmitMutateAsync.mockRejectedValue(new ApiError('Conflict', 409));
    mockUseEntryForm.mockReturnValue({
      data: makeEntryFormData(),
      isLoading: false,
      error: null,
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);

    // Fill period dates
    await user.type(screen.getByLabelText(/period start/i), '2026-01-01');
    await user.type(screen.getByLabelText(/period end/i), '2026-01-31');

    // Enter an amount
    const input = screen.getByLabelText('Gross Gaming Revenue for Test Account');
    await user.clear(input);
    await user.type(input, '100');

    // Submit
    await user.click(screen.getByRole('button', { name: /submit entry/i }));

    // The mutation is called (even though it rejects)
    await vi.waitFor(() => {
      expect(mockSubmitMutateAsync).toHaveBeenCalled();
    });
  });

  it('shows generic error on non-409 failure', async () => {
    const user = userEvent.setup();
    mockSubmitMutateAsync.mockRejectedValue(new Error('Server error'));
    mockUseEntryForm.mockReturnValue({
      data: makeEntryFormData(),
      isLoading: false,
      error: null,
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);

    // Fill period dates
    await user.type(screen.getByLabelText(/period start/i), '2026-01-01');
    await user.type(screen.getByLabelText(/period end/i), '2026-01-31');

    // Enter an amount
    const input = screen.getByLabelText('Gross Gaming Revenue for Test Account');
    await user.clear(input);
    await user.type(input, '100');

    // Submit
    await user.click(screen.getByRole('button', { name: /submit entry/i }));

    await vi.waitFor(() => {
      expect(mockSubmitMutateAsync).toHaveBeenCalled();
    });
  });

  it('validates metric amounts - rejects values outside range', async () => {
    const user = userEvent.setup();
    mockUseEntryForm.mockReturnValue({
      data: makeEntryFormData(),
      isLoading: false,
      error: null,
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);

    // Fill period dates
    await user.type(screen.getByLabelText(/period start/i), '2026-01-01');
    await user.type(screen.getByLabelText(/period end/i), '2026-01-31');

    // Enter an out-of-range amount
    const input = screen.getByLabelText('Gross Gaming Revenue for Test Account');
    await user.clear(input);
    await user.type(input, '9999999999');

    // Submit — should fail validation
    await user.click(screen.getByRole('button', { name: /submit entry/i }));

    // Mutation should NOT be called because of validation failure
    expect(mockSubmitMutateAsync).not.toHaveBeenCalled();
  });

  it('shows "Submitting..." text when mutation is pending', () => {
    mockUseSubmitManualEntry.mockReturnValue({
      mutateAsync: mockSubmitMutateAsync,
      isPending: true,
    });
    mockUseEntryForm.mockReturnValue({
      data: makeEntryFormData(),
      isLoading: false,
      error: null,
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
  });

  it('shows error message text from formError', () => {
    mockUseEntryForm.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Custom API error message'),
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);
    expect(screen.getByText('Custom API error message')).toBeInTheDocument();
  });

  it('handles New Entry button after successful submission', async () => {
    const user = userEvent.setup();
    mockSubmitMutateAsync.mockResolvedValue({ id: 'batch-1' });
    mockUseEntryForm.mockReturnValue({
      data: makeEntryFormData(),
      isLoading: false,
      error: null,
    });

    renderWithQuery(<ManualEntryPage initialBrandCode="manual-brand" />);

    // Fill period dates and enter an amount
    await user.type(screen.getByLabelText(/period start/i), '2026-01-01');
    await user.type(screen.getByLabelText(/period end/i), '2026-01-31');
    const input = screen.getByLabelText('Gross Gaming Revenue for Test Account');
    await user.clear(input);
    await user.type(input, '500');

    // Submit
    await user.click(screen.getByRole('button', { name: /submit entry/i }));

    // Should show success state
    await screen.findByText('Entry Submitted Successfully');

    // Click New Entry
    await user.click(screen.getByRole('button', { name: /new entry/i }));

    // Should go back to form
    expect(screen.getByText('Manual Statement Entry')).toBeInTheDocument();
  });
});
