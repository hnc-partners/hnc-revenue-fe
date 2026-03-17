/**
 * BrandActions.test.tsx
 *
 * TE04 compliant: Mocks ONLY API hooks and router (external services).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrandActions } from '../BrandActions';
import type { RMBrandConfigWithActivity } from '../../types';

// Mock router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

// Mock API hooks with success callback invocation
const mockEnableMutate = vi.fn();
const mockDisableMutate = vi.fn();
const mockTriggerMutate = vi.fn();
const mockUploadMutate = vi.fn();
const mockMutate = vi.fn(); // legacy reference for existing tests

const mockUseEnableBrand = vi.fn().mockReturnValue({ mutate: mockEnableMutate, isPending: false });
const mockUseDisableBrand = vi.fn().mockReturnValue({ mutate: mockDisableMutate, isPending: false });
const mockUseTriggerDownload = vi.fn().mockReturnValue({ mutate: mockTriggerMutate, isPending: false });
const mockUseUploadCSV = vi.fn().mockReturnValue({ mutate: mockUploadMutate, isPending: false });

vi.mock('../../api', () => ({
  useEnableBrand: (...args: unknown[]) => mockUseEnableBrand(...args),
  useDisableBrand: (...args: unknown[]) => mockUseDisableBrand(...args),
  useTriggerDownload: (...args: unknown[]) => mockUseTriggerDownload(...args),
  useUploadCSV: (...args: unknown[]) => mockUseUploadCSV(...args),
}));

function makeBrand(
  overrides: Partial<RMBrandConfigWithActivity> = {}
): RMBrandConfigWithActivity {
  return {
    id: '1',
    brandId: 'b-1',
    brandCode: 'test-brand',
    brandName: 'Test Brand',
    acquisitionMode: 'automated_download',
    granularity: 'monthly',
    scheduleCron: '0 6 * * *',
    requiredFileTypes: [],
    optionalFileTypes: [],
    shareTypes: [],
    currencyCode: 'EUR',
    portalUrl: null,
    credentialsEnv: null,
    maxBackfillMonths: 3,
    enabled: true,
    paused: false,
    autoNotify: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    recentRuns: [],
    ...overrides,
  };
}

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('BrandActions', () => {
  beforeEach(() => {
    mockEnableMutate.mockReset();
    mockDisableMutate.mockReset();
    mockTriggerMutate.mockReset();
    mockUploadMutate.mockReset();
    mockMutate.mockReset();

    // Default: invoke onSuccess callbacks
    mockEnableMutate.mockImplementation((_data: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    mockDisableMutate.mockImplementation((_data: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    mockTriggerMutate.mockImplementation((_data: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    mockUploadMutate.mockImplementation((_data: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    // Legacy mutate (used by some older tests)
    mockMutate.mockImplementation((_data: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });

    mockUseEnableBrand.mockReturnValue({ mutate: mockEnableMutate, isPending: false });
    mockUseDisableBrand.mockReturnValue({ mutate: mockDisableMutate, isPending: false });
    mockUseTriggerDownload.mockReturnValue({ mutate: mockTriggerMutate, isPending: false });
    mockUseUploadCSV.mockReturnValue({ mutate: mockUploadMutate, isPending: false });
  });

  it('shows Trigger Download for automated brands', () => {
    renderWithQuery(
      <BrandActions brand={makeBrand({ acquisitionMode: 'automated_download' })} onEditConfig={vi.fn()} />
    );
    expect(screen.getByText('Trigger Download')).toBeInTheDocument();
  });

  it('shows Upload CSV for manual_download brands', () => {
    renderWithQuery(
      <BrandActions brand={makeBrand({ acquisitionMode: 'manual_download' })} onEditConfig={vi.fn()} />
    );
    expect(screen.getByText('Upload CSV')).toBeInTheDocument();
  });

  it('shows New Entry for manual_input brands', () => {
    renderWithQuery(
      <BrandActions brand={makeBrand({ acquisitionMode: 'manual_input' })} onEditConfig={vi.fn()} />
    );
    expect(screen.getByText('New Entry')).toBeInTheDocument();
  });

  it('shows Pause button for active automated brands', () => {
    renderWithQuery(
      <BrandActions
        brand={makeBrand({ acquisitionMode: 'automated_download', enabled: true, paused: false })}
        onEditConfig={vi.fn()}
      />
    );
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('shows Resume button for paused automated brands', () => {
    renderWithQuery(
      <BrandActions
        brand={makeBrand({ acquisitionMode: 'automated_download', paused: true })}
        onEditConfig={vi.fn()}
      />
    );
    expect(screen.getByText('Resume')).toBeInTheDocument();
  });

  it('shows Edit Config button for all brands', () => {
    const onEdit = vi.fn();
    renderWithQuery(
      <BrandActions brand={makeBrand()} onEditConfig={onEdit} />
    );
    expect(screen.getByText('Edit Config')).toBeInTheDocument();
  });

  it('does not show Trigger Download for non-automated brands', () => {
    renderWithQuery(
      <BrandActions brand={makeBrand({ acquisitionMode: 'manual_input' })} onEditConfig={vi.fn()} />
    );
    expect(screen.queryByText('Trigger Download')).not.toBeInTheDocument();
  });

  it('does not show Pause/Resume for non-automated brands', () => {
    renderWithQuery(
      <BrandActions brand={makeBrand({ acquisitionMode: 'manual_download' })} onEditConfig={vi.fn()} />
    );
    expect(screen.queryByText('Pause')).not.toBeInTheDocument();
    expect(screen.queryByText('Resume')).not.toBeInTheDocument();
  });

  it('calls onEditConfig when Edit Config button is clicked', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    renderWithQuery(
      <BrandActions brand={makeBrand()} onEditConfig={onEdit} />
    );
    await user.click(screen.getByText('Edit Config'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('shows Resume when brand is disabled (not enabled)', () => {
    renderWithQuery(
      <BrandActions
        brand={makeBrand({ acquisitionMode: 'automated_download', enabled: false, paused: false })}
        onEditConfig={vi.fn()}
      />
    );
    expect(screen.getByText('Resume')).toBeInTheDocument();
  });

  it('disables Trigger Download when brand is paused', () => {
    renderWithQuery(
      <BrandActions
        brand={makeBrand({ acquisitionMode: 'automated_download', paused: true })}
        onEditConfig={vi.fn()}
      />
    );
    const btn = screen.getByText('Trigger Download').closest('button');
    expect(btn).toBeDisabled();
  });

  it('shows hidden file input for manual_download brands', () => {
    const { container } = renderWithQuery(
      <BrandActions brand={makeBrand({ acquisitionMode: 'manual_download' })} onEditConfig={vi.fn()} />
    );
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput?.getAttribute('accept')).toBe('.csv');
  });

  it('shows confirm dialog for trigger download', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <BrandActions
        brand={makeBrand({ acquisitionMode: 'automated_download', paused: false })}
        onEditConfig={vi.fn()}
      />
    );

    await user.click(screen.getByText('Trigger Download'));
    expect(screen.getByText(/this will start an immediate download/i)).toBeInTheDocument();
  });

  it('shows confirm dialog for pause', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <BrandActions
        brand={makeBrand({ acquisitionMode: 'automated_download', enabled: true, paused: false })}
        onEditConfig={vi.fn()}
      />
    );

    await user.click(screen.getByText('Pause'));
    expect(screen.getByText(/pause scheduled acquisitions/i)).toBeInTheDocument();
  });

  it('shows confirm dialog for resume', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <BrandActions
        brand={makeBrand({ acquisitionMode: 'automated_download', paused: true })}
        onEditConfig={vi.fn()}
      />
    );

    await user.click(screen.getByText('Resume'));
    expect(screen.getByText(/resume scheduled acquisitions/i)).toBeInTheDocument();
  });

  it('calls trigger mutation when confirm dialog is confirmed', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <BrandActions
        brand={makeBrand({ acquisitionMode: 'automated_download', paused: false })}
        onEditConfig={vi.fn()}
      />
    );

    await user.click(screen.getByText('Trigger Download'));
    // Click the confirm button in the dialog
    const confirmBtn = screen.getByRole('button', { name: 'Trigger' });
    await user.click(confirmBtn);
    expect(mockTriggerMutate).toHaveBeenCalled();
  });

  it('calls disable mutation when pause confirm is confirmed', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <BrandActions
        brand={makeBrand({ acquisitionMode: 'automated_download', enabled: true, paused: false })}
        onEditConfig={vi.fn()}
      />
    );

    await user.click(screen.getByText('Pause'));
    const confirmBtn = screen.getByRole('button', { name: 'Pause' });
    await user.click(confirmBtn);
    expect(mockDisableMutate).toHaveBeenCalled();
  });

  it('calls enable mutation when resume confirm is confirmed', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <BrandActions
        brand={makeBrand({ acquisitionMode: 'automated_download', paused: true })}
        onEditConfig={vi.fn()}
      />
    );

    await user.click(screen.getByText('Resume'));
    const confirmBtn = screen.getByRole('button', { name: 'Resume' });
    await user.click(confirmBtn);
    expect(mockEnableMutate).toHaveBeenCalled();
  });

  it('renders New Entry link for manual_input brands', () => {
    renderWithQuery(
      <BrandActions brand={makeBrand({ acquisitionMode: 'manual_input' })} onEditConfig={vi.fn()} />
    );
    expect(screen.getByText('New Entry')).toBeInTheDocument();
  });

  it('calls upload mutation when a CSV file is selected', async () => {
    const user = userEvent.setup();
    const { container } = renderWithQuery(
      <BrandActions brand={makeBrand({ acquisitionMode: 'manual_download' })} onEditConfig={vi.fn()} />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['col1,col2\n1,2'], 'test.csv', { type: 'text/csv' });
    await user.upload(fileInput, file);

    expect(mockUploadMutate).toHaveBeenCalledWith(file, expect.objectContaining({
      onSuccess: expect.any(Function),
      onError: expect.any(Function),
    }));
  });

  it('invokes onError callback for trigger download failure', async () => {
    mockTriggerMutate.mockImplementation((_data: unknown, opts?: { onError?: (err: Error) => void }) => {
      opts?.onError?.(new Error('network fail'));
    });

    const user = userEvent.setup();
    renderWithQuery(
      <BrandActions
        brand={makeBrand({ acquisitionMode: 'automated_download', paused: false })}
        onEditConfig={vi.fn()}
      />
    );

    await user.click(screen.getByText('Trigger Download'));
    const confirmBtn = screen.getByRole('button', { name: 'Trigger' });
    await user.click(confirmBtn);
    expect(mockTriggerMutate).toHaveBeenCalled();
  });

  it('invokes onError callback for pause failure', async () => {
    mockDisableMutate.mockImplementation((_data: unknown, opts?: { onError?: (err: Error) => void }) => {
      opts?.onError?.(new Error('pause failed'));
    });

    const user = userEvent.setup();
    renderWithQuery(
      <BrandActions
        brand={makeBrand({ acquisitionMode: 'automated_download', enabled: true, paused: false })}
        onEditConfig={vi.fn()}
      />
    );

    await user.click(screen.getByText('Pause'));
    const confirmBtn = screen.getByRole('button', { name: 'Pause' });
    await user.click(confirmBtn);
    expect(mockDisableMutate).toHaveBeenCalled();
  });

  it('invokes onError callback for resume failure', async () => {
    mockEnableMutate.mockImplementation((_data: unknown, opts?: { onError?: (err: Error) => void }) => {
      opts?.onError?.(new Error('resume failed'));
    });

    const user = userEvent.setup();
    renderWithQuery(
      <BrandActions
        brand={makeBrand({ acquisitionMode: 'automated_download', paused: true })}
        onEditConfig={vi.fn()}
      />
    );

    await user.click(screen.getByText('Resume'));
    const confirmBtn = screen.getByRole('button', { name: 'Resume' });
    await user.click(confirmBtn);
    expect(mockEnableMutate).toHaveBeenCalled();
  });

  it('invokes onError callback for upload failure', async () => {
    mockUploadMutate.mockImplementation((_data: unknown, opts?: { onError?: (err: Error) => void }) => {
      opts?.onError?.(new Error('upload failed'));
    });

    const user = userEvent.setup();
    const { container } = renderWithQuery(
      <BrandActions brand={makeBrand({ acquisitionMode: 'manual_download' })} onEditConfig={vi.fn()} />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['data'], 'test.csv', { type: 'text/csv' });
    await user.upload(fileInput, file);

    expect(mockUploadMutate).toHaveBeenCalled();
  });

  it('shows "Uploading..." text when upload is pending', () => {
    mockUseUploadCSV.mockReturnValue({ mutate: mockUploadMutate, isPending: true });

    renderWithQuery(
      <BrandActions brand={makeBrand({ acquisitionMode: 'manual_download' })} onEditConfig={vi.fn()} />
    );
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
  });

  it('disables trigger button when trigger mutation is pending', () => {
    mockUseTriggerDownload.mockReturnValue({ mutate: mockTriggerMutate, isPending: true });

    renderWithQuery(
      <BrandActions
        brand={makeBrand({ acquisitionMode: 'automated_download', paused: false })}
        onEditConfig={vi.fn()}
      />
    );
    const btn = screen.getByText('Trigger Download').closest('button');
    expect(btn).toBeDisabled();
  });

  it('disables pause button when disable mutation is pending', () => {
    mockUseDisableBrand.mockReturnValue({ mutate: mockDisableMutate, isPending: true });

    renderWithQuery(
      <BrandActions
        brand={makeBrand({ acquisitionMode: 'automated_download', enabled: true, paused: false })}
        onEditConfig={vi.fn()}
      />
    );
    const btn = screen.getByText('Pause').closest('button');
    expect(btn).toBeDisabled();
  });

  it('disables resume button when enable mutation is pending', () => {
    mockUseEnableBrand.mockReturnValue({ mutate: mockEnableMutate, isPending: true });

    renderWithQuery(
      <BrandActions
        brand={makeBrand({ acquisitionMode: 'automated_download', paused: true })}
        onEditConfig={vi.fn()}
      />
    );
    const btn = screen.getByText('Resume').closest('button');
    expect(btn).toBeDisabled();
  });
});
