/**
 * ServiceStatusBar.test.tsx
 *
 * TE04 compliant: Mocks ONLY API hooks (external fetch layer).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServiceStatusBar } from '../ServiceStatusBar';
import type { RMServiceState } from '../../types';

const mockUseServiceStatus = vi.fn();
const mockUsePauseService = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });
const mockUseResumeService = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });

vi.mock('../../api', () => ({
  useServiceStatus: () => mockUseServiceStatus(),
  usePauseService: () => mockUsePauseService(),
  useResumeService: () => mockUseResumeService(),
}));

function makeServiceState(overrides: Partial<RMServiceState> = {}): RMServiceState {
  return {
    globalPaused: false,
    pausedAt: null,
    pausedBy: null,
    updatedAt: '2026-01-15T00:00:00Z',
    activeRuns: 0,
    scheduler: {
      running: true,
      scheduledBrands: 5,
      queueLength: 0,
      isProcessing: false,
      pendingRetries: 0,
      nextRun: null,
      brands: [],
    },
    nextScheduledRun: null,
    ...overrides,
  };
}

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('ServiceStatusBar', () => {
  beforeEach(() => {
    mockUseServiceStatus.mockReset();
    mockUsePauseService.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseResumeService.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it('renders nothing when loading', () => {
    mockUseServiceStatus.mockReturnValue({ data: null, isLoading: true });
    const { container } = renderWithQuery(<ServiceStatusBar />);
    // Component returns null when loading, so no meaningful content
    expect(container.textContent).toBe('');
  });

  it('renders "Service Active" when not paused', () => {
    mockUseServiceStatus.mockReturnValue({
      data: makeServiceState({ globalPaused: false }),
      isLoading: false,
    });

    renderWithQuery(<ServiceStatusBar />);
    expect(screen.getByText('Service Active')).toBeInTheDocument();
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('renders "Service Paused" when paused', () => {
    mockUseServiceStatus.mockReturnValue({
      data: makeServiceState({
        globalPaused: true,
        pausedBy: 'admin',
        pausedAt: '2026-01-15T12:00:00Z',
      }),
      isLoading: false,
    });

    renderWithQuery(<ServiceStatusBar />);
    expect(screen.getByText('Service Paused')).toBeInTheDocument();
    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.getByText(/paused by admin/i)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    mockUseServiceStatus.mockReturnValue({
      data: makeServiceState(),
      isLoading: false,
    });

    const { container } = renderWithQuery(<ServiceStatusBar className="my-status" />);
    expect(container.firstChild).toHaveClass('my-status');
  });

  it('shows pause confirm dialog when Pause button is clicked', async () => {
    const user = userEvent.setup();
    mockUseServiceStatus.mockReturnValue({
      data: makeServiceState({ globalPaused: false }),
      isLoading: false,
    });

    renderWithQuery(<ServiceStatusBar />);
    await user.click(screen.getByText('Pause'));
    expect(screen.getByText(/this will pause all scheduled/i)).toBeInTheDocument();
  });

  it('shows resume confirm dialog when Resume button is clicked', async () => {
    const user = userEvent.setup();
    mockUseServiceStatus.mockReturnValue({
      data: makeServiceState({ globalPaused: true, pausedBy: 'admin', pausedAt: '2026-01-15T12:00:00Z' }),
      isLoading: false,
    });

    renderWithQuery(<ServiceStatusBar />);
    await user.click(screen.getByText('Resume'));
    expect(screen.getByText(/this will resume all scheduled/i)).toBeInTheDocument();
  });

  it('shows green dot indicator when active', () => {
    mockUseServiceStatus.mockReturnValue({
      data: makeServiceState({ globalPaused: false }),
      isLoading: false,
    });

    const { container } = renderWithQuery(<ServiceStatusBar />);
    const dot = container.querySelector('.bg-success');
    expect(dot).toBeInTheDocument();
  });

  it('calls pause mutation when pause confirm is accepted', async () => {
    const mockMutate = vi.fn();
    mockUsePauseService.mockReturnValue({ mutate: mockMutate, isPending: false });
    mockUseServiceStatus.mockReturnValue({
      data: makeServiceState({ globalPaused: false }),
      isLoading: false,
    });

    const user = userEvent.setup();
    renderWithQuery(<ServiceStatusBar />);
    await user.click(screen.getByText('Pause'));

    // Click the confirm button in dialog
    const confirmBtn = screen.getByRole('button', { name: 'Pause' });
    await user.click(confirmBtn);
    expect(mockMutate).toHaveBeenCalled();
  });

  it('calls resume mutation when resume confirm is accepted', async () => {
    const mockMutate = vi.fn();
    mockUseResumeService.mockReturnValue({ mutate: mockMutate, isPending: false });
    mockUseServiceStatus.mockReturnValue({
      data: makeServiceState({
        globalPaused: true,
        pausedBy: 'admin',
        pausedAt: '2026-01-15T12:00:00Z',
      }),
      isLoading: false,
    });

    const user = userEvent.setup();
    renderWithQuery(<ServiceStatusBar />);
    await user.click(screen.getByText('Resume'));

    // Click the confirm button in dialog
    const confirmBtn = screen.getByRole('button', { name: 'Resume' });
    await user.click(confirmBtn);
    expect(mockMutate).toHaveBeenCalled();
  });

  it('formats paused time correctly', () => {
    mockUseServiceStatus.mockReturnValue({
      data: makeServiceState({
        globalPaused: true,
        pausedBy: 'john',
        pausedAt: '2026-03-15T14:30:00Z',
      }),
      isLoading: false,
    });

    renderWithQuery(<ServiceStatusBar />);
    expect(screen.getByText(/paused by john/i)).toBeInTheDocument();
    // The formatted time should contain "Mar" and some time
    expect(screen.getByText(/at mar/i)).toBeInTheDocument();
  });

  it('renders nothing when status data is null', () => {
    mockUseServiceStatus.mockReturnValue({ data: null, isLoading: false });
    const { container } = renderWithQuery(<ServiceStatusBar />);
    expect(container.textContent).toBe('');
  });

  it('disables buttons when pause mutation is pending', () => {
    mockUsePauseService.mockReturnValue({ mutate: vi.fn(), isPending: true });
    mockUseServiceStatus.mockReturnValue({
      data: makeServiceState({ globalPaused: false }),
      isLoading: false,
    });

    renderWithQuery(<ServiceStatusBar />);
    const pauseBtn = screen.getByText('Pause').closest('button');
    expect(pauseBtn).toBeDisabled();
  });

  it('disables buttons when resume mutation is pending', () => {
    mockUseResumeService.mockReturnValue({ mutate: vi.fn(), isPending: true });
    mockUseServiceStatus.mockReturnValue({
      data: makeServiceState({
        globalPaused: true,
        pausedBy: 'admin',
        pausedAt: '2026-01-15T12:00:00Z',
      }),
      isLoading: false,
    });

    renderWithQuery(<ServiceStatusBar />);
    const resumeBtn = screen.getByText('Resume').closest('button');
    expect(resumeBtn).toBeDisabled();
  });

  it('shows paused state without pausedBy info', () => {
    mockUseServiceStatus.mockReturnValue({
      data: makeServiceState({
        globalPaused: true,
        pausedBy: null,
        pausedAt: null,
      }),
      isLoading: false,
    });

    renderWithQuery(<ServiceStatusBar />);
    expect(screen.getByText('Service Paused')).toBeInTheDocument();
    expect(screen.getByText('Resume')).toBeInTheDocument();
  });
});
