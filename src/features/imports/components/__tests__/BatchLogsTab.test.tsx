/**
 * BatchLogsTab.test.tsx
 *
 * TE04 compliant: Mocks ONLY API hooks (external services).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BatchLogsTab } from '../BatchLogsTab';
import type { ImportLog, LogsResponse } from '../../types';

// Mock API hooks — external fetch layer
const mockUseBatchLogs = vi.fn();
const mockRefetch = vi.fn();

vi.mock('../../api', () => ({
  useBatchLogs: (...args: unknown[]) => mockUseBatchLogs(...args),
}));

function makeLog(overrides: Partial<ImportLog> = {}): ImportLog {
  return {
    id: 'log-1',
    batchId: 'batch-1',
    fileId: null,
    logLevel: 'info',
    message: 'Processing started',
    details: null,
    createdAt: '2026-01-15T11:00:00Z',
    ...overrides,
  };
}

function makeLogsResponse(
  logs: ImportLog[] = [],
  meta = { page: 1, limit: 25, total: logs.length, totalPages: 1 }
): LogsResponse {
  return { data: logs, meta };
}

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('BatchLogsTab', () => {
  beforeEach(() => {
    mockUseBatchLogs.mockReset();
    mockRefetch.mockReset();
  });

  it('renders loading skeleton when data is loading', () => {
    mockUseBatchLogs.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    });

    const { container } = renderWithQuery(<BatchLogsTab batchId="batch-1" />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('renders error state with retry button', async () => {
    mockUseBatchLogs.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Server error'),
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchLogsTab batchId="batch-1" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/could not load audit logs/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no logs', () => {
    mockUseBatchLogs.mockReturnValue({
      data: makeLogsResponse([]),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchLogsTab batchId="batch-1" />);
    expect(screen.getByText('No log entries yet')).toBeInTheDocument();
  });

  it('renders log entries in table', () => {
    mockUseBatchLogs.mockReturnValue({
      data: makeLogsResponse([
        makeLog({ id: 'l-1', logLevel: 'info', message: 'Started processing' }),
        makeLog({ id: 'l-2', logLevel: 'error', message: 'Validation failed' }),
      ]),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchLogsTab batchId="batch-1" />);
    expect(screen.getByText('Started processing')).toBeInTheDocument();
    expect(screen.getByText('Validation failed')).toBeInTheDocument();
  });

  it('renders log level badges', () => {
    mockUseBatchLogs.mockReturnValue({
      data: makeLogsResponse([
        makeLog({ id: 'l-1', logLevel: 'info' }),
        makeLog({ id: 'l-2', logLevel: 'error' }),
        makeLog({ id: 'l-3', logLevel: 'warn' }),
      ]),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchLogsTab batchId="batch-1" />);
    expect(screen.getByText('info')).toBeInTheDocument();
    expect(screen.getByText('error')).toBeInTheDocument();
    expect(screen.getByText('warn')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    mockUseBatchLogs.mockReturnValue({
      data: makeLogsResponse([makeLog()]),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchLogsTab batchId="batch-1" />);
    expect(screen.getByText('Level')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
    expect(screen.getByText('Timestamp')).toBeInTheDocument();
  });

  it('renders log count', () => {
    mockUseBatchLogs.mockReturnValue({
      data: makeLogsResponse(
        [makeLog()],
        { page: 1, limit: 25, total: 42, totalPages: 2 }
      ),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchLogsTab batchId="batch-1" />);
    expect(screen.getByText(/42 log entries/)).toBeInTheDocument();
  });

  it('renders singular "log entry" text for 1 entry', () => {
    mockUseBatchLogs.mockReturnValue({
      data: makeLogsResponse(
        [makeLog()],
        { page: 1, limit: 25, total: 1, totalPages: 1 }
      ),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchLogsTab batchId="batch-1" />);
    expect(screen.getByText(/1 log entry/)).toBeInTheDocument();
  });

  it('expands row with details when clicked', async () => {
    const details = { recordCount: 100, duration: '5s' };
    mockUseBatchLogs.mockReturnValue({
      data: makeLogsResponse([
        makeLog({ id: 'l-1', message: 'Click me', details }),
      ]),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithQuery(<BatchLogsTab batchId="batch-1" />);

    // Click the row to expand
    await user.click(screen.getByText('Click me'));
    expect(screen.getByText('Details')).toBeInTheDocument();
    // The JSON details should be visible in the expanded area
    expect(screen.getByText(/"recordCount": 100/)).toBeInTheDocument();
  });

  it('renders level filter dropdown', () => {
    mockUseBatchLogs.mockReturnValue({
      data: makeLogsResponse([makeLog()]),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchLogsTab batchId="batch-1" />);
    expect(screen.getByText('All Levels')).toBeInTheDocument();
  });

  it('renders pagination when multiple pages', () => {
    mockUseBatchLogs.mockReturnValue({
      data: makeLogsResponse(
        [makeLog()],
        { page: 1, limit: 25, total: 100, totalPages: 4 }
      ),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchLogsTab batchId="batch-1" />);
    expect(screen.getByText(/Page 1 of 4/)).toBeInTheDocument();
  });

  it('collapses expanded row when clicked again', async () => {
    const details = { recordCount: 100 };
    mockUseBatchLogs.mockReturnValue({
      data: makeLogsResponse([
        makeLog({ id: 'l-1', message: 'Toggle me', details }),
      ]),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithQuery(<BatchLogsTab batchId="batch-1" />);

    // Expand
    await user.click(screen.getByText('Toggle me'));
    expect(screen.getByText('Details')).toBeInTheDocument();

    // Collapse
    await user.click(screen.getByText('Toggle me'));
    expect(screen.queryByText('Details')).not.toBeInTheDocument();
  });

  it('does not expand rows without details', async () => {
    mockUseBatchLogs.mockReturnValue({
      data: makeLogsResponse([
        makeLog({ id: 'l-1', message: 'No details here', details: null }),
      ]),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithQuery(<BatchLogsTab batchId="batch-1" />);

    await user.click(screen.getByText('No details here'));
    // Should not show Details section
    expect(screen.queryByText('Details')).not.toBeInTheDocument();
  });

  it('navigates to next page on pagination click', async () => {
    mockUseBatchLogs.mockReturnValue({
      data: makeLogsResponse(
        [makeLog()],
        { page: 1, limit: 25, total: 100, totalPages: 4 }
      ),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithQuery(<BatchLogsTab batchId="batch-1" />);

    await user.click(screen.getByRole('button', { name: /next page/i }));
    // useBatchLogs should be called with new page params
    expect(mockUseBatchLogs).toHaveBeenCalledWith(
      'batch-1',
      expect.objectContaining({ page: 2 })
    );
  });

  it('navigates to specific page on pagination click', async () => {
    mockUseBatchLogs.mockReturnValue({
      data: makeLogsResponse(
        [makeLog()],
        { page: 1, limit: 25, total: 100, totalPages: 4 }
      ),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const user = userEvent.setup();
    renderWithQuery(<BatchLogsTab batchId="batch-1" />);

    // Click page 3 button
    await user.click(screen.getByRole('button', { name: '3' }));
    expect(mockUseBatchLogs).toHaveBeenCalledWith(
      'batch-1',
      expect.objectContaining({ page: 3 })
    );
  });

  it('disables previous page button on first page', () => {
    mockUseBatchLogs.mockReturnValue({
      data: makeLogsResponse(
        [makeLog()],
        { page: 1, limit: 25, total: 100, totalPages: 4 }
      ),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchLogsTab batchId="batch-1" />);
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
  });

  it('does not show pagination for single page', () => {
    mockUseBatchLogs.mockReturnValue({
      data: makeLogsResponse(
        [makeLog()],
        { page: 1, limit: 25, total: 5, totalPages: 1 }
      ),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQuery(<BatchLogsTab batchId="batch-1" />);
    expect(screen.queryByLabelText('Previous page')).not.toBeInTheDocument();
  });
});
