/**
 * RunHistory.test.tsx
 *
 * TE04 compliant: Mocks ONLY API hooks (external fetch layer).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RunHistory } from '../RunHistory';
import type { RMDownloadRun, RMRunsResponse } from '../../types';

// Mock API hooks — external fetch layer
const mockUseBrandRuns = vi.fn();
const mockRetryRunMutate = vi.fn();
const mockRetryNotifyMutate = vi.fn();

vi.mock('../../api', () => ({
  useBrandRuns: (...args: unknown[]) => mockUseBrandRuns(...args),
  useRetryRun: () => ({ mutate: mockRetryRunMutate, isPending: false }),
  useRetryNotify: () => ({ mutate: mockRetryNotifyMutate, isPending: false }),
}));

function makeRun(overrides: Partial<RMDownloadRun> = {}): RMDownloadRun {
  return {
    id: 'run-1',
    brandConfigId: 'bc-1',
    brandCode: 'test-brand',
    status: 'success',
    notifyStatus: 'notified',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    sourceType: 'automated',
    startedAt: '2026-01-10T06:00:00Z',
    completedAt: '2026-01-10T06:05:00Z',
    errorMessage: null,
    files: [],
    createdAt: '2026-01-10T06:00:00Z',
    updatedAt: '2026-01-10T06:05:00Z',
    ...overrides,
  };
}

function makeResponse(runs: RMDownloadRun[], meta = { page: 1, limit: 10, total: 1, totalPages: 1 }): RMRunsResponse {
  return { data: runs, meta };
}

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('RunHistory', () => {
  beforeEach(() => {
    mockUseBrandRuns.mockReset();
    mockRetryRunMutate.mockReset();
    mockRetryNotifyMutate.mockReset();
  });

  // Note: RunHistory test doesn't need re-set of useRetryRun/useRetryNotify defaults
  // because the vi.mock factory returns static objects, and mockReset only affects
  // the outer mock fns. The RunRow component reads the returned mock objects.

  it('renders loading skeleton', () => {
    mockUseBrandRuns.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = renderWithQuery(<RunHistory brandCode="test-brand" />);
    // Skeletons are rendered
    const skeletons = container.querySelectorAll('[class*="animate-pulse"], [class*="Skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders error state with retry', async () => {
    const refetch = vi.fn();
    mockUseBrandRuns.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('fail'),
      refetch,
    });

    renderWithQuery(<RunHistory brandCode="test-brand" />);
    expect(screen.getByText(/failed to load run history/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it('renders empty state when no runs', () => {
    mockUseBrandRuns.mockReturnValue({
      data: makeResponse([]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<RunHistory brandCode="test-brand" />);
    expect(screen.getByText(/no runs recorded yet/i)).toBeInTheDocument();
  });

  it('renders run table with headers', () => {
    mockUseBrandRuns.mockReturnValue({
      data: makeResponse([makeRun()]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<RunHistory brandCode="test-brand" />);
    expect(screen.getByText('Period')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Notify')).toBeInTheDocument();
    expect(screen.getByText('Started')).toBeInTheDocument();
    expect(screen.getByText('Files')).toBeInTheDocument();
  });

  it('renders run status badges', () => {
    mockUseBrandRuns.mockReturnValue({
      data: makeResponse([makeRun({ status: 'success' })]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<RunHistory brandCode="test-brand" />);
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('shows retry button for failed runs', () => {
    mockUseBrandRuns.mockReturnValue({
      data: makeResponse([makeRun({ status: 'failed' })]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<RunHistory brandCode="test-brand" />);
    expect(screen.getByRole('button', { name: /retry run/i })).toBeInTheDocument();
  });

  it('does not show retry button for successful runs', () => {
    mockUseBrandRuns.mockReturnValue({
      data: makeResponse([makeRun({ status: 'success' })]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<RunHistory brandCode="test-brand" />);
    expect(screen.queryByRole('button', { name: /retry run/i })).not.toBeInTheDocument();
  });

  it('expands row to show file details when clicked', async () => {
    const run = makeRun({
      files: [
        {
          id: 'f-1',
          runId: 'run-1',
          fileType: 'csv',
          fileName: 'data.csv',
          filePath: '/files/data.csv',
          fileSize: 1024,
          recordCount: 100,
          status: 'processed',
          errorMessage: null,
          createdAt: '2026-01-10T06:05:00Z',
        },
      ],
    });
    mockUseBrandRuns.mockReturnValue({
      data: makeResponse([run]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithQuery(<RunHistory brandCode="test-brand" />);

    // Click on the run row to expand
    const row = screen.getByText('Success').closest('tr')!;
    await user.click(row);

    // File details should be visible
    expect(screen.getByText('data.csv')).toBeInTheDocument();
    expect(screen.getByText('1.0 KB')).toBeInTheDocument();
    expect(screen.getByText('100 rows')).toBeInTheDocument();
  });

  it('renders pagination when multiple pages', () => {
    mockUseBrandRuns.mockReturnValue({
      data: makeResponse([makeRun()], { page: 1, limit: 10, total: 25, totalPages: 3 }),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQuery(<RunHistory brandCode="test-brand" />);
    expect(screen.getByText('Page 1 of 3 (25 runs)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
  });
});
