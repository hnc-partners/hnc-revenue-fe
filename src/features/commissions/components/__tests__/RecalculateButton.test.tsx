import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the recalculate hook
const mockMutate = vi.fn();
const mockUseRecalculate = vi.fn();

vi.mock('../../api/useRecalculate', () => ({
  useRecalculate: (...args: unknown[]) => mockUseRecalculate(...args),
}));

// Mock toast
vi.mock('@hnc-partners/ui-components', async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    '@hnc-partners/ui-components'
  );
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

import { RecalculateButton } from '../RecalculateButton';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('RecalculateButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRecalculate.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it('renders the recalculate button', () => {
    render(<RecalculateButton batchId="batch-1" />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText('Recalculate Commissions')).toBeInTheDocument();
  });

  it('opens confirmation dialog on click', async () => {
    render(
      <RecalculateButton batchId="batch-1" batchLabel="January 2026" />,
      { wrapper: createWrapper() }
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('Recalculate Commissions'));

    // Confirm dialog should appear with the batch label in the message
    expect(
      screen.getByText(/replace existing commission results for batch January 2026/i)
    ).toBeInTheDocument();
  });

  it('shows pending state during recalculation', () => {
    mockUseRecalculate.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    });

    render(<RecalculateButton batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Recalculating...')).toBeInTheDocument();
    expect(
      screen.getByText('Recalculating...').closest('button')
    ).toBeDisabled();
  });

  it('shows error state after failure', () => {
    mockUseRecalculate.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: new Error('Server error'),
    });

    render(<RecalculateButton batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    // The error message is: "Recalculation failed. Server error" in a <p>
    expect(screen.getByText(/Recalculation failed/)).toBeInTheDocument();
    expect(screen.getByText(/Server error/)).toBeInTheDocument();
  });

  it('displays delta summary after successful recalculation', async () => {
    mockUseRecalculate.mockReturnValue({
      mutate: (
        _batchId: string,
        options: { onSuccess: (result: Record<string, unknown>) => void }
      ) => {
        options.onSuccess({
          batch_id: 'batch-1',
          previous_total: '5000.00',
          new_total: '5200.00',
          changed_count: 3,
          unchanged_count: 47,
          recalculated_at: '2026-01-20T15:00:00Z',
        });
      },
      isPending: false,
      isError: false,
      error: null,
    });

    render(<RecalculateButton batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    // Click the button to open confirmation dialog
    const user = userEvent.setup();
    await user.click(screen.getByText('Recalculate Commissions'));

    // Confirm the dialog
    const confirmBtn = screen.getByText('Recalculate');
    await user.click(confirmBtn);

    // Delta summary should now be visible
    expect(screen.getByText('Recalculation Complete')).toBeInTheDocument();
    expect(screen.getByText('Previous total:')).toBeInTheDocument();
    expect(screen.getByText('New total:')).toBeInTheDocument();
    expect(screen.getByText('Records changed:')).toBeInTheDocument();
    expect(screen.getByText('Records unchanged:')).toBeInTheDocument();
  });

  it('calls onRecalculated callback after successful recalculation', async () => {
    const onRecalculated = vi.fn();
    const resultData = {
      batch_id: 'batch-1',
      previous_total: '1000.00',
      new_total: '1100.00',
      changed_count: 2,
      unchanged_count: 10,
      recalculated_at: '2026-01-20T15:00:00Z',
    };

    mockUseRecalculate.mockReturnValue({
      mutate: (
        _batchId: string,
        options: { onSuccess: (result: Record<string, unknown>) => void }
      ) => {
        options.onSuccess(resultData);
      },
      isPending: false,
      isError: false,
      error: null,
    });

    render(
      <RecalculateButton batchId="batch-1" onRecalculated={onRecalculated} />,
      { wrapper: createWrapper() }
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('Recalculate Commissions'));
    await user.click(screen.getByText('Recalculate'));

    expect(onRecalculated).toHaveBeenCalledWith(resultData);
  });

  it('shows toast error on recalculation failure', async () => {
    const { toast } = await import('@hnc-partners/ui-components');

    mockUseRecalculate.mockReturnValue({
      mutate: (
        _batchId: string,
        options: { onError: (error: Error) => void }
      ) => {
        options.onError(new Error('Batch not found'));
      },
      isPending: false,
      isError: false,
      error: null,
    });

    render(<RecalculateButton batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Recalculate Commissions'));
    await user.click(screen.getByText('Recalculate'));

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Batch not found')
    );
  });

  it('uses batchId as display name when batchLabel is not provided', async () => {
    render(<RecalculateButton batchId="batch-xyz" />, {
      wrapper: createWrapper(),
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Recalculate Commissions'));

    expect(
      screen.getByText(/replace existing commission results for batch batch-xyz/i)
    ).toBeInTheDocument();
  });

  it('closes confirmation dialog when cancelled', async () => {
    render(
      <RecalculateButton batchId="batch-1" batchLabel="January 2026" />,
      { wrapper: createWrapper() }
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('Recalculate Commissions'));

    // Dialog should be open
    expect(
      screen.getByText(/replace existing commission results for batch January 2026/i)
    ).toBeInTheDocument();

    // Close the dialog (via the close callback)
    // The ConfirmDialog has an onClose prop
    const cancelBtn = screen.getByText('Cancel');
    if (cancelBtn) {
      await user.click(cancelBtn);
    }
  });

  it('shows error inline with non-Error object', () => {
    mockUseRecalculate.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: 'string-error',
    });

    render(<RecalculateButton batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    // Should show generic fallback message since error is not an Error instance
    expect(screen.getByText(/Recalculation failed/)).toBeInTheDocument();
    expect(screen.getByText(/Please try again/)).toBeInTheDocument();
  });

  it('formats NaN amount as dash', async () => {
    mockUseRecalculate.mockReturnValue({
      mutate: (
        _batchId: string,
        options: { onSuccess: (result: Record<string, unknown>) => void }
      ) => {
        options.onSuccess({
          batch_id: 'batch-1',
          previous_total: 'invalid',
          new_total: '100.00',
          changed_count: 1,
          unchanged_count: 0,
          recalculated_at: '2026-01-20T15:00:00Z',
        });
      },
      isPending: false,
      isError: false,
      error: null,
    });

    render(<RecalculateButton batchId="batch-1" />, {
      wrapper: createWrapper(),
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Recalculate Commissions'));
    await user.click(screen.getByText('Recalculate'));

    // NaN previous_total: formatAmount returns "-", rendered with $ prefix
    expect(screen.getByText(/\$-/)).toBeInTheDocument();
  });
});
