/**
 * BatchFilesTab.test.tsx
 *
 * TE04 compliant: No mocks needed — pure presentational component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BatchFilesTab } from '../BatchFilesTab';
import type { BatchFile } from '../../types';

function makeFile(overrides: Partial<BatchFile> = {}): BatchFile {
  return {
    id: 'file-1',
    batchId: 'batch-1',
    fileType: 'commission',
    originalFilename: 'commission_jan.csv',
    fileSizeBytes: '524288',
    hash: 'abc123',
    status: 'uploaded',
    createdAt: '2026-01-15T10:00:00Z',
    ...overrides,
  };
}

describe('BatchFilesTab', () => {
  it('renders empty state when no files', () => {
    render(<BatchFilesTab files={[]} />);
    expect(screen.getByText('No files uploaded yet')).toBeInTheDocument();
    expect(screen.getByText(/upload files to this batch/i)).toBeInTheDocument();
  });

  it('renders files table with file data', () => {
    const files = [
      makeFile({ id: 'f-1', fileType: 'commission', originalFilename: 'comm.csv' }),
      makeFile({ id: 'f-2', fileType: 'ggr', originalFilename: 'ggr.csv' }),
    ];

    render(<BatchFilesTab files={files} />);
    expect(screen.getByText('comm.csv')).toBeInTheDocument();
    expect(screen.getByText('ggr.csv')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<BatchFilesTab files={[makeFile()]} />);
    expect(screen.getByText('File Type')).toBeInTheDocument();
    expect(screen.getByText('Original Filename')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Uploaded At')).toBeInTheDocument();
  });

  it('formats file size correctly', () => {
    render(
      <BatchFilesTab
        files={[makeFile({ fileSizeBytes: '1048576' })]} // 1 MB
      />
    );
    expect(screen.getByText('1.0 MB')).toBeInTheDocument();
  });

  it('renders file count text', () => {
    render(
      <BatchFilesTab
        files={[
          makeFile({ id: 'f-1' }),
          makeFile({ id: 'f-2' }),
          makeFile({ id: 'f-3' }),
        ]}
      />
    );
    expect(screen.getByText('3 files')).toBeInTheDocument();
  });

  it('renders singular "file" text for 1 file', () => {
    render(<BatchFilesTab files={[makeFile()]} />);
    expect(screen.getByText('1 file')).toBeInTheDocument();
  });

  it('renders file status badge', () => {
    render(<BatchFilesTab files={[makeFile({ status: 'uploaded' })]} />);
    expect(screen.getByText('uploaded')).toBeInTheDocument();
  });

  it('renders different file status variants', () => {
    render(
      <BatchFilesTab
        files={[
          makeFile({ id: 'f-1', status: 'uploaded' }),
          makeFile({ id: 'f-2', status: 'processing' }),
          makeFile({ id: 'f-3', status: 'pending' }),
          makeFile({ id: 'f-4', status: 'failed' }),
          makeFile({ id: 'f-5', status: 'unknown_status' }),
        ]}
      />
    );
    expect(screen.getByText('uploaded')).toBeInTheDocument();
    expect(screen.getByText('processing')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('failed')).toBeInTheDocument();
    expect(screen.getByText('unknown_status')).toBeInTheDocument();
  });

  it('formats small file sizes in bytes', () => {
    render(
      <BatchFilesTab
        files={[makeFile({ fileSizeBytes: '500' })]}
      />
    );
    expect(screen.getByText('500 B')).toBeInTheDocument();
  });

  it('formats file sizes in KB', () => {
    render(
      <BatchFilesTab
        files={[makeFile({ fileSizeBytes: '51200' })]} // 50 KB
      />
    );
    expect(screen.getByText('50.0 KB')).toBeInTheDocument();
  });

  it('handles 0 byte file size', () => {
    render(
      <BatchFilesTab
        files={[makeFile({ fileSizeBytes: '0' })]}
      />
    );
    expect(screen.getByText('0 B')).toBeInTheDocument();
  });

  it('handles NaN file size', () => {
    render(
      <BatchFilesTab
        files={[makeFile({ fileSizeBytes: 'not-a-number' })]}
      />
    );
    expect(screen.getByText('0 B')).toBeInTheDocument();
  });

  it('renders file type as badge', () => {
    render(
      <BatchFilesTab
        files={[makeFile({ fileType: 'ggr_report' })]}
      />
    );
    expect(screen.getByText('ggr_report')).toBeInTheDocument();
  });
});
