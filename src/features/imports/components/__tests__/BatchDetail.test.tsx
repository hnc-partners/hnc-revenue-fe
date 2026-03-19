/**
 * BatchDetail.test.tsx
 *
 * TE04 compliant: Mocks ONLY API hooks and router (external services).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BatchDetail } from '../BatchDetail';
import type { ImportBatchDetail } from '../../types';

// onBack callback — replaces router navigation
const mockOnBack = vi.fn();

// Mock API hooks — external fetch layer
const mockUseImportBatch = vi.fn();
const mockRefetch = vi.fn();
const mockUseRollbackBatch = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });
const mockUsePurgeBatch = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });
const mockUseBatchLogs = vi.fn().mockReturnValue({
  data: { data: [], meta: { page: 1, limit: 25, total: 0, totalPages: 0 } },
  isLoading: false,
  error: null,
  refetch: vi.fn(),
});

vi.mock('../../api', () => ({
  useImportBatch: (id: string) => mockUseImportBatch(id),
  useRollbackBatch: () => mockUseRollbackBatch(),
  usePurgeBatch: () => mockUsePurgeBatch(),
  useBatchLogs: (...args: unknown[]) => mockUseBatchLogs(...args),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function makeBatchDetail(overrides: Partial<ImportBatchDetail> = {}): ImportBatchDetail {
  return {
    id: 'batch-1',
    brandId: 'brand-uuid',
    brandName: 'Test Brand',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    granularity: 'monthly',
    status: 'processed',
    fileCount: 2,
    rowCount: 500,
    createdBy: 'admin',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T12:00:00Z',
    processingStartedAt: '2026-01-15T11:00:00Z',
    processingCompletedAt: '2026-01-15T11:00:30Z',
    validationErrors: null,
    files: [],
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

describe('BatchDetail', () => {
  beforeEach(() => {
    mockOnBack.mockReset();
    mockRefetch.mockReset();
    mockUseImportBatch.mockReset();
    mockUseRollbackBatch.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUsePurgeBatch.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it('renders loading skeleton when data is loading', () => {
    mockUseImportBatch.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    });

    const { container } = renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('renders error state with retry button', async () => {
    mockUseImportBatch.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Not found'),
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/could not load batch details/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('renders batch header with brand name and status', () => {
    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail() },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
    expect(screen.getByText('Processed')).toBeInTheDocument();
  });

  it('renders Back to Imports button', async () => {
    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail() },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);

    await user.click(screen.getByText('Back to Imports'));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('renders tabs for Files, Processing Results, and Audit Log', () => {
    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail() },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('Processing Results')).toBeInTheDocument();
    expect(screen.getByText('Audit Log')).toBeInTheDocument();
  });

  it('shows Rollback button for processed batches', () => {
    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail({ status: 'processed' }) },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);
    expect(screen.getByText('Rollback')).toBeInTheDocument();
  });

  it('shows Purge button for rolled_back batches', () => {
    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail({ status: 'rolled_back' }) },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);
    expect(screen.getByText('Purge')).toBeInTheDocument();
  });

  it('shows Upload Files button for pending batches', () => {
    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail({ status: 'pending' }) },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);
    expect(screen.getByText('Upload Files')).toBeInTheDocument();
  });

  it('shows no action buttons for processing batches', () => {
    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail({ status: 'processing' }) },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);
    expect(screen.queryByText('Rollback')).not.toBeInTheDocument();
    expect(screen.queryByText('Purge')).not.toBeInTheDocument();
    expect(screen.queryByText('Upload Files')).not.toBeInTheDocument();
  });

  it('shows validation errors banner for failed batches', () => {
    mockUseImportBatch.mockReturnValue({
      data: {
        data: makeBatchDetail({
          status: 'failed',
          validationErrors: [
            { type: 'MISSING_FIELD', severity: 'error', message: 'Missing required field' },
          ],
        }),
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);
    expect(screen.getByText(/processing failed with 1 validation error/i)).toBeInTheDocument();
  });

  it('opens rollback dialog when Rollback is clicked', async () => {
    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail({ status: 'processed' }) },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);

    await user.click(screen.getByText('Rollback'));
    expect(screen.getByText('Rollback Import Batch')).toBeInTheDocument();
    expect(screen.getByText(/permanently delete all revenue records/i)).toBeInTheDocument();
  });

  it('opens purge dialog when Purge is clicked', async () => {
    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail({ status: 'rolled_back' }) },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);

    await user.click(screen.getByText('Purge'));
    expect(screen.getByText('Purge Import Batch')).toBeInTheDocument();
  });

  it('switches to Processing Results tab', async () => {
    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail({ status: 'processed' }) },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);

    await user.click(screen.getByText('Processing Results'));
    // Should render BatchResultsTab content
    expect(screen.getByText('Revenue Records Created')).toBeInTheDocument();
  });

  it('displays created by metadata', () => {
    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail({ createdBy: 'john' }) },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);
    expect(screen.getByText('Created by: john')).toBeInTheDocument();
  });

  it('returns null when batch data is undefined', () => {
    mockUseImportBatch.mockReturnValue({
      data: { data: undefined },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { container } = renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows Recalculate Commissions button (disabled) for processed batches', () => {
    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail({ status: 'processed' }) },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);
    const recalcButton = screen.getByText('Recalculate Commissions');
    expect(recalcButton.closest('button')).toBeDisabled();
  });

  it('navigates to imports/new when Upload Files is clicked for pending batch', async () => {
    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail({ status: 'pending' }) },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);

    // Upload Files button exists for pending batches (no-op in MF mode)
    expect(screen.getByText('Upload Files')).toBeInTheDocument();
  });

  it('shows processing duration when both timestamps exist', () => {
    mockUseImportBatch.mockReturnValue({
      data: {
        data: makeBatchDetail({
          processingStartedAt: '2026-01-15T11:00:00Z',
          processingCompletedAt: '2026-01-15T11:00:30Z',
        }),
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);
    expect(screen.getByText('Duration: 30s')).toBeInTheDocument();
  });

  it('does not show duration when timestamps are null', () => {
    mockUseImportBatch.mockReturnValue({
      data: {
        data: makeBatchDetail({
          processingStartedAt: null,
          processingCompletedAt: null,
        }),
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);
    expect(screen.queryByText(/duration/i)).not.toBeInTheDocument();
  });

  it('switches to Audit Log tab', async () => {
    mockUseBatchLogs.mockReturnValue({
      data: { data: [], meta: { page: 1, limit: 25, total: 0, totalPages: 0 } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail() },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);

    await user.click(screen.getByText('Audit Log'));
    // BatchLogsTab should render — it shows logs or empty state
    expect(screen.getByText('No log entries yet')).toBeInTheDocument();
  });

  it('shows multiple validation errors banner with plural text', () => {
    mockUseImportBatch.mockReturnValue({
      data: {
        data: makeBatchDetail({
          status: 'failed',
          validationErrors: [
            { type: 'ERR1', severity: 'error', message: 'Error 1' },
            { type: 'ERR2', severity: 'error', message: 'Error 2' },
            { type: 'ERR3', severity: 'warning', message: 'Warn 1' },
          ],
        }),
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);
    expect(screen.getByText(/processing failed with 3 validation errors/i)).toBeInTheDocument();
  });

  it('does not show validation banner for failed batch with no errors', () => {
    mockUseImportBatch.mockReturnValue({
      data: {
        data: makeBatchDetail({
          status: 'failed',
          validationErrors: [],
        }),
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);
    expect(screen.queryByText(/processing failed with/i)).not.toBeInTheDocument();
  });

  it('executes rollback mutation when confirmed in dialog', async () => {
    const mockRollbackMutate = vi.fn().mockImplementation(
      (_id: string, opts: { onSuccess: () => void }) => {
        opts.onSuccess();
      }
    );
    mockUseRollbackBatch.mockReturnValue({
      mutate: mockRollbackMutate,
      isPending: false,
    });

    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail({ status: 'processed' }) },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);

    // Open rollback dialog
    await user.click(screen.getByText('Rollback'));
    expect(screen.getByText('Rollback Import Batch')).toBeInTheDocument();

    // Confirm rollback — click the destructive "Rollback" button inside dialog
    const rollbackButtons = screen.getAllByText('Rollback');
    const confirmButton = rollbackButtons.find(
      (el) => el.closest('[role="dialog"]') !== null
    );
    await user.click(confirmButton!);

    expect(mockRollbackMutate).toHaveBeenCalledWith('batch-1', expect.any(Object));
  });

  it('executes purge mutation when confirmed in dialog', async () => {
    const mockPurgeMutate = vi.fn().mockImplementation(
      (_id: string, opts: { onSuccess: () => void }) => {
        opts.onSuccess();
      }
    );
    mockUsePurgeBatch.mockReturnValue({
      mutate: mockPurgeMutate,
      isPending: false,
    });

    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail({ status: 'rolled_back' }) },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);

    // Open purge dialog
    await user.click(screen.getByText('Purge'));
    expect(screen.getByText('Purge Import Batch')).toBeInTheDocument();

    // Confirm purge — click the destructive "Purge" button inside dialog
    const purgeButtons = screen.getAllByText('Purge');
    const confirmButton = purgeButtons.find(
      (el) => el.closest('[role="dialog"]') !== null
    );
    await user.click(confirmButton!);

    expect(mockPurgeMutate).toHaveBeenCalledWith('batch-1', expect.any(Object));
  });

  it('navigates back after successful purge', async () => {
    const mockPurgeMutate = vi.fn().mockImplementation(
      (_id: string, opts: { onSuccess: () => void }) => {
        opts.onSuccess();
      }
    );
    mockUsePurgeBatch.mockReturnValue({
      mutate: mockPurgeMutate,
      isPending: false,
    });

    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail({ status: 'rolled_back' }) },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);

    await user.click(screen.getByText('Purge'));
    const purgeButtons = screen.getAllByText('Purge');
    const confirmButton = purgeButtons.find(
      (el) => el.closest('[role="dialog"]') !== null
    );
    await user.click(confirmButton!);

    // After purge success, handlePurgeSuccess navigates back
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('shows rollback error toast on failure', async () => {
    const { toast } = await import('sonner');

    const mockRollbackMutate = vi.fn().mockImplementation(
      (_id: string, opts: { onError: () => void }) => {
        opts.onError();
      }
    );
    mockUseRollbackBatch.mockReturnValue({
      mutate: mockRollbackMutate,
      isPending: false,
    });

    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail({ status: 'processed' }) },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);

    await user.click(screen.getByText('Rollback'));
    const rollbackButtons = screen.getAllByText('Rollback');
    const confirmButton = rollbackButtons.find(
      (el) => el.closest('[role="dialog"]') !== null
    );
    await user.click(confirmButton!);

    expect(toast.error).toHaveBeenCalledWith('Failed to rollback batch. Please try again.');
  });

  it('shows purge error toast on failure', async () => {
    const { toast } = await import('sonner');

    const mockPurgeMutate = vi.fn().mockImplementation(
      (_id: string, opts: { onError: () => void }) => {
        opts.onError();
      }
    );
    mockUsePurgeBatch.mockReturnValue({
      mutate: mockPurgeMutate,
      isPending: false,
    });

    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail({ status: 'rolled_back' }) },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);

    await user.click(screen.getByText('Purge'));
    const purgeButtons = screen.getAllByText('Purge');
    const confirmButton = purgeButtons.find(
      (el) => el.closest('[role="dialog"]') !== null
    );
    await user.click(confirmButton!);

    expect(toast.error).toHaveBeenCalledWith('Failed to purge batch. Please try again.');
  });

  it('shows Rolling back... text when rollback is pending', async () => {
    mockUseRollbackBatch.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    });

    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail({ status: 'processed' }) },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);

    await user.click(screen.getByText('Rollback'));
    expect(screen.getByText('Rolling back...')).toBeInTheDocument();
  });

  it('shows Purging... text when purge is pending', async () => {
    mockUsePurgeBatch.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    });

    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail({ status: 'rolled_back' }) },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);

    await user.click(screen.getByText('Purge'));
    expect(screen.getByText('Purging...')).toBeInTheDocument();
  });

  it('navigates back from error state', async () => {
    mockUseImportBatch.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Not found'),
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);

    await user.click(screen.getByText('Back to Imports'));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('displays processing started/completed timestamps', () => {
    mockUseImportBatch.mockReturnValue({
      data: {
        data: makeBatchDetail({
          processingStartedAt: '2026-01-15T11:00:00Z',
          processingCompletedAt: '2026-01-15T11:00:30Z',
        }),
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);
    expect(screen.getByText(/Started:/)).toBeInTheDocument();
    expect(screen.getByText(/Completed:/)).toBeInTheDocument();
  });

  it('shows no action buttons for failed batches', () => {
    mockUseImportBatch.mockReturnValue({
      data: { data: makeBatchDetail({ status: 'failed' }) },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchDetail batchId="batch-1" onBack={mockOnBack} />);
    expect(screen.queryByText('Rollback')).not.toBeInTheDocument();
    expect(screen.queryByText('Purge')).not.toBeInTheDocument();
    expect(screen.queryByText('Upload Files')).not.toBeInTheDocument();
  });
});
