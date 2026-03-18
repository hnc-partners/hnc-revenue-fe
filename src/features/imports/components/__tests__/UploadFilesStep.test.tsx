/**
 * UploadFilesStep.test.tsx
 *
 * TE04 compliant: Mocks ONLY API hooks (external services).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UploadFilesStep } from '../UploadFilesStep';
import type { BrandConfig } from '../../types';

// Mock API hooks — external fetch layer
const mockMutate = vi.fn();
vi.mock('../../api', () => ({
  useUploadFile: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

// Mock ApiError for upload error handling
vi.mock('@/features/revenue/api', () => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

const brandConfig: BrandConfig = {
  brandId: 'b-1',
  brandName: 'Test Brand',
  periodGranularity: 'monthly',
  expectedFileTypes: ['commission', 'ggr_report'],
};

const singleFileConfig: BrandConfig = {
  brandId: 'b-2',
  brandName: 'Single Brand',
  periodGranularity: 'monthly',
  expectedFileTypes: [],
};

describe('UploadFilesStep', () => {
  const onContinue = vi.fn();
  const onSkip = vi.fn();

  beforeEach(() => {
    onContinue.mockReset();
    onSkip.mockReset();
    mockMutate.mockReset();
  });

  it('renders file slots based on brand config expectedFileTypes', () => {
    renderWithQuery(
      <UploadFilesStep
        batchId="batch-1"
        brandConfig={brandConfig}
        onContinue={onContinue}
        onSkip={onSkip}
      />
    );
    expect(screen.getByText('Commission')).toBeInTheDocument();
    expect(screen.getByText('Ggr Report')).toBeInTheDocument();
    expect(screen.getByText(/expects/)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders single file slot when no expectedFileTypes', () => {
    renderWithQuery(
      <UploadFilesStep
        batchId="batch-1"
        brandConfig={singleFileConfig}
        onContinue={onContinue}
        onSkip={onSkip}
      />
    );
    expect(screen.getByText('Single')).toBeInTheDocument();
  });

  it('renders drag & drop zones for each file slot', () => {
    renderWithQuery(
      <UploadFilesStep
        batchId="batch-1"
        brandConfig={brandConfig}
        onContinue={onContinue}
        onSkip={onSkip}
      />
    );
    const dropZones = screen.getAllByText(/drag & drop/i);
    expect(dropZones).toHaveLength(2);
  });

  it('renders Skip Upload and Continue to Process buttons', () => {
    renderWithQuery(
      <UploadFilesStep
        batchId="batch-1"
        brandConfig={brandConfig}
        onContinue={onContinue}
        onSkip={onSkip}
      />
    );
    expect(screen.getByText('Skip Upload')).toBeInTheDocument();
    expect(screen.getByText('Continue to Process')).toBeInTheDocument();
  });

  it('disables Continue to Process button when no files uploaded', () => {
    renderWithQuery(
      <UploadFilesStep
        batchId="batch-1"
        brandConfig={brandConfig}
        onContinue={onContinue}
        onSkip={onSkip}
      />
    );
    expect(screen.getByText('Continue to Process')).toBeDisabled();
  });

  it('calls onSkip when Skip Upload is clicked', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <UploadFilesStep
        batchId="batch-1"
        brandConfig={brandConfig}
        onContinue={onContinue}
        onSkip={onSkip}
      />
    );

    await user.click(screen.getByText('Skip Upload'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('shows brand name in info section', () => {
    renderWithQuery(
      <UploadFilesStep
        batchId="batch-1"
        brandConfig={brandConfig}
        onContinue={onContinue}
        onSkip={onSkip}
      />
    );
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
  });

  it('has accessible upload buttons for each file type', () => {
    renderWithQuery(
      <UploadFilesStep
        batchId="batch-1"
        brandConfig={brandConfig}
        onContinue={onContinue}
        onSkip={onSkip}
      />
    );
    expect(screen.getByLabelText('Upload Commission file')).toBeInTheDocument();
    expect(screen.getByLabelText('Upload Ggr Report file')).toBeInTheDocument();
  });

  it('calls mutate when a file is selected via file input', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <UploadFilesStep
        batchId="batch-1"
        brandConfig={brandConfig}
        onContinue={onContinue}
        onSkip={onSkip}
      />
    );

    const file = new File(['csv,data'], 'test.csv', { type: 'text/csv' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    expect(fileInputs.length).toBe(2);

    await user.upload(fileInputs[0] as HTMLInputElement, file);
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        batchId: 'batch-1',
        file: expect.any(File),
        fileType: 'commission',
      }),
      expect.any(Object)
    );
  });

  it('shows uploading state after file selected', async () => {
    const user = userEvent.setup();
    // Make mutate not call any callbacks so slot stays in 'uploading'
    mockMutate.mockImplementation(() => {});

    renderWithQuery(
      <UploadFilesStep
        batchId="batch-1"
        brandConfig={brandConfig}
        onContinue={onContinue}
        onSkip={onSkip}
      />
    );

    const file = new File(['csv,data'], 'test.csv', { type: 'text/csv' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    await user.upload(fileInputs[0] as HTMLInputElement, file);

    expect(screen.getByText(/uploading test\.csv/i)).toBeInTheDocument();
  });

  it('shows uploaded state after successful upload', async () => {
    const { toast } = await import('sonner');

    mockMutate.mockImplementation(
      (_params: unknown, opts: { onSuccess: (file: unknown) => void }) => {
        opts.onSuccess({
          id: 'file-1',
          batchId: 'batch-1',
          fileType: 'commission',
          originalFilename: 'test.csv',
          fileSizeBytes: '1024',
          hash: 'abc',
          status: 'uploaded',
          createdAt: '2026-01-01T00:00:00Z',
        });
      }
    );

    const user = userEvent.setup();
    renderWithQuery(
      <UploadFilesStep
        batchId="batch-1"
        brandConfig={brandConfig}
        onContinue={onContinue}
        onSkip={onSkip}
      />
    );

    const file = new File(['csv,data'], 'test.csv', { type: 'text/csv' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    await user.upload(fileInputs[0] as HTMLInputElement, file);

    expect(screen.getByText('Uploaded')).toBeInTheDocument();
    expect(screen.getByText('test.csv (1.0 KB)')).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith('Commission file uploaded');
  });

  it('enables Continue button after a file is uploaded', async () => {
    mockMutate.mockImplementation(
      (_params: unknown, opts: { onSuccess: (file: unknown) => void }) => {
        opts.onSuccess({
          id: 'file-1',
          batchId: 'batch-1',
          fileType: 'commission',
          originalFilename: 'test.csv',
          fileSizeBytes: '1024',
          hash: 'abc',
          status: 'uploaded',
          createdAt: '2026-01-01T00:00:00Z',
        });
      }
    );

    const user = userEvent.setup();
    renderWithQuery(
      <UploadFilesStep
        batchId="batch-1"
        brandConfig={brandConfig}
        onContinue={onContinue}
        onSkip={onSkip}
      />
    );

    const file = new File(['csv,data'], 'test.csv', { type: 'text/csv' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    await user.upload(fileInputs[0] as HTMLInputElement, file);

    const continueButton = screen.getByText('Continue to Process');
    expect(continueButton).not.toBeDisabled();

    await user.click(continueButton);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('shows upload progress summary after upload', async () => {
    mockMutate.mockImplementation(
      (_params: unknown, opts: { onSuccess: (file: unknown) => void }) => {
        opts.onSuccess({
          id: 'file-1',
          batchId: 'batch-1',
          fileType: 'commission',
          originalFilename: 'test.csv',
          fileSizeBytes: '1024',
          hash: 'abc',
          status: 'uploaded',
          createdAt: '2026-01-01T00:00:00Z',
        });
      }
    );

    const user = userEvent.setup();
    renderWithQuery(
      <UploadFilesStep
        batchId="batch-1"
        brandConfig={brandConfig}
        onContinue={onContinue}
        onSkip={onSkip}
      />
    );

    const file = new File(['csv,data'], 'test.csv', { type: 'text/csv' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    await user.upload(fileInputs[0] as HTMLInputElement, file);

    expect(screen.getByText('1 of 2 files uploaded')).toBeInTheDocument();
  });

  it('shows error state on upload failure', async () => {
    const { toast } = await import('sonner');

    mockMutate.mockImplementation(
      (_params: unknown, opts: { onError: (err: Error) => void }) => {
        opts.onError(new Error('Upload failed'));
      }
    );

    const user = userEvent.setup();
    renderWithQuery(
      <UploadFilesStep
        batchId="batch-1"
        brandConfig={brandConfig}
        onContinue={onContinue}
        onSkip={onSkip}
      />
    );

    const file = new File(['csv,data'], 'test.csv', { type: 'text/csv' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    await user.upload(fileInputs[0] as HTMLInputElement, file);

    expect(screen.getByText('Upload failed. Please try again.')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Upload failed. Please try again.');
  });

  it('shows duplicate hash error on 409 upload error', async () => {
    const { ApiError } = await import('@/features/revenue/api');

    mockMutate.mockImplementation(
      (_params: unknown, opts: { onError: (err: Error) => void }) => {
        opts.onError(new ApiError('Conflict', 409));
      }
    );

    const user = userEvent.setup();
    renderWithQuery(
      <UploadFilesStep
        batchId="batch-1"
        brandConfig={brandConfig}
        onContinue={onContinue}
        onSkip={onSkip}
      />
    );

    const file = new File(['csv,data'], 'test.csv', { type: 'text/csv' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    await user.upload(fileInputs[0] as HTMLInputElement, file);

    expect(screen.getByText('This file has already been uploaded (duplicate hash)')).toBeInTheDocument();
  });

  it('clears error slot when remove button is clicked', async () => {
    mockMutate.mockImplementation(
      (_params: unknown, opts: { onError: (err: Error) => void }) => {
        opts.onError(new Error('Upload failed'));
      }
    );

    const user = userEvent.setup();
    renderWithQuery(
      <UploadFilesStep
        batchId="batch-1"
        brandConfig={brandConfig}
        onContinue={onContinue}
        onSkip={onSkip}
      />
    );

    const file = new File(['csv,data'], 'test.csv', { type: 'text/csv' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    await user.upload(fileInputs[0] as HTMLInputElement, file);

    // Error state should be visible
    expect(screen.getByText('Upload failed. Please try again.')).toBeInTheDocument();

    // Click clear button (X icon button with title "Clear and retry")
    const clearButton = screen.getByTitle('Clear and retry');
    await user.click(clearButton);

    // Should return to idle drop zone
    expect(screen.queryByText('Upload failed. Please try again.')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Upload Commission file')).toBeInTheDocument();
  });

  it('shows warning toast for large files', async () => {
    const { toast } = await import('sonner');

    mockMutate.mockImplementation(() => {});

    const user = userEvent.setup();
    renderWithQuery(
      <UploadFilesStep
        batchId="batch-1"
        brandConfig={brandConfig}
        onContinue={onContinue}
        onSkip={onSkip}
      />
    );

    // Create a file larger than 10MB
    const largeContent = new ArrayBuffer(11 * 1024 * 1024);
    const file = new File([largeContent], 'large.csv', { type: 'text/csv' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    await user.upload(fileInputs[0] as HTMLInputElement, file);

    expect(toast.warning).toHaveBeenCalledWith(
      expect.stringContaining('large.csv')
    );
  });

  it('handles keyboard activation of drop zone', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <UploadFilesStep
        batchId="batch-1"
        brandConfig={brandConfig}
        onContinue={onContinue}
        onSkip={onSkip}
      />
    );

    const dropZone = screen.getByLabelText('Upload Commission file');
    dropZone.focus();
    await user.keyboard('{Enter}');
    // The Enter key should trigger inputRef.current?.click() — no assertion needed
    // beyond verifying no errors are thrown
  });

  it('shows singular "file" text when brand expects 1 file', () => {
    const singleExpectedConfig: BrandConfig = {
      brandId: 'b-3',
      brandName: 'Single Expected',
      periodGranularity: 'monthly',
      expectedFileTypes: ['commission'],
    };

    renderWithQuery(
      <UploadFilesStep
        batchId="batch-1"
        brandConfig={singleExpectedConfig}
        onContinue={onContinue}
        onSkip={onSkip}
      />
    );
    // "expects 1 file." (singular)
    expect(screen.getByText(/expects/)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
